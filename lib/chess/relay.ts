import { createHmac } from "node:crypto";

const upstream = "https://sjakk-for-to-kveldsro-160926.thodhel.chatgpt.site";
const room = "[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}";
const getPath = new RegExp(`^/sjakk/api/rooms/${room}$`, "i");
const postPath = new RegExp(`^/sjakk/api/rooms(?:/${room}/(?:preview|join|action))?$`, "i");
const responseHeaders = { "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" };
const error = (message: string, status: number) => Response.json({ error: message }, { status, headers: responseHeaders });
const roomId = new RegExp(`^${room}$`, "i");

/**
 * Seat holders get a realtime topic for move hints. Only the gateway can derive it, so the room ID alone
 * is not enough to listen in. Hints are untrusted; the game server stays authoritative.
 */
export function pushTopic(id: string, gatewayKey: string) {
  return `sjakk-${createHmac("sha256", gatewayKey).update(`push:${id.toLowerCase()}`).digest("hex").slice(0, 32)}`;
}

/**
 * Only answers that hand a seat holder their own snapshot get the topic: the room state, a created room, an
 * accepted join, and an action's result or conflict. Never previews, rejected joins or other errors.
 */
function pushAllowed(method: string, pathname: string, status: number) {
  const ok = status >= 200 && status < 300;
  if (method === "GET") return ok;
  if (/^\/sjakk\/api\/rooms$/.test(pathname) || pathname.endsWith("/join")) return ok;
  return pathname.endsWith("/action") && (ok || status === 409);
}

function withPushTopic(text: string, gatewayKey: string, pathId: string | undefined) {
  let body: unknown;
  try { body = JSON.parse(text); } catch { return text; }
  if (!body || typeof body !== "object" || Array.isArray(body)) return text;
  const snapshot = body as Record<string, unknown>;
  if (typeof snapshot.roomId !== "string" || !roomId.test(snapshot.roomId) || !snapshot.state || !["w", "b"].includes(snapshot.color as string)) return text;
  if (pathId && snapshot.roomId.toLowerCase() !== pathId.toLowerCase()) return text;
  return JSON.stringify({ ...snapshot, push: pushTopic(snapshot.roomId, gatewayKey) });
}

export async function relayChess(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const allowed = request.method === "GET" ? getPath.test(url.pathname) : request.method === "POST" && postPath.test(url.pathname);
  if (!allowed || url.search) return error("Fant ikke partiet.", 404);
  const origin = request.headers.get("Origin");
  if (origin && origin !== url.origin) return error("Forespørselen må komme fra spillets egen side.", 403);
  const access = process.env.SJAKK_SITE_BYPASS;
  const gatewayKey = process.env.SJAKK_GATEWAY_KEY;
  if (!access || !gatewayKey) return error("Nettspill er ikke tilgjengelig akkurat nå.", 503);

  let body: string | undefined;
  if (request.method === "POST") {
    if (!request.headers.get("Content-Type")?.includes("application/json")) return error("Bruk JSON.", 415);
    if (Number(request.headers.get("Content-Length")) > 16384) return error("Forespørselen er for stor.", 413);
    // Bound the stream before buffering: Content-Length is optional and untrusted.
    const reader = request.body?.getReader();
    if (!reader) return error("Ugyldig forespørsel.", 400);
    const chunks: Uint8Array[] = [];
    let size = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > 16384) { await reader.cancel(); return error("Forespørselen er for stor.", 413); }
      chunks.push(value);
    }
    body = Buffer.concat(chunks).toString("utf8");
  }

  // Vercel overwrites x-forwarded-for. Never forward client-supplied relay headers.
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "local";
  const client = createHmac("sha256", gatewayKey).update(`${ip}:${Math.floor(Date.now() / 86400000)}`).digest("hex");
  const headers = new Headers({
    "OAI-Sites-Authorization": `Bearer ${access}`,
    "X-Sjakk-Gateway-Key": gatewayKey,
    "X-Sjakk-Client": client,
    "Accept": "application/json",
  });
  if (body !== undefined) headers.set("Content-Type", "application/json");
  const player = request.headers.get("Authorization");
  if (player) headers.set("Authorization", player);
  try {
    const result = await fetch(`${upstream}${url.pathname.slice("/sjakk".length)}`, {
      method: request.method, headers, body, cache: "no-store", redirect: "manual", signal: AbortSignal.timeout(10000),
    });
    if (!result.headers.get("Content-Type")?.includes("application/json") || result.status >= 500 || result.status < 200 || result.status >= 300 && result.status < 400) {
      return error("Spillserveren svarer ikke akkurat nå. Prøv igjen om litt.", 502);
    }
    // No upstream cookies, redirects or authentication headers leave this gateway.
    const text = await result.text();
    const pathId = url.pathname.split("/")[4];
    const answer = pushAllowed(request.method, url.pathname, result.status) ? withPushTopic(text, gatewayKey, pathId) : text;
    return new Response(answer, { status: result.status, headers: { ...responseHeaders, "Content-Type": "application/json" } });
  } catch {
    return error("Mistet forbindelsen til spillserveren. Prøv igjen om litt.", 502);
  }
}

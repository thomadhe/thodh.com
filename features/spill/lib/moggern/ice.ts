// WebRTC ICE server configuration for Moggern.
//
// Public STUN is always included so peers on standard networks connect directly.
// Optional TURN credentials are read from environment variables and only handed out to
// authenticated users, so mobile networks behind symmetric NAT can relay cleanly when configured.

export type IceTjener = {
  urls: string | string[]
  username?: string
  credential?: string
}

export type IceKonfig = {
  iceServers: IceTjener[]
  harTurn: boolean
}

export const STANDARD_STUN: readonly IceTjener[] = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun1.l.google.com:19302" },
  { urls: "stun:stun2.l.google.com:19302" },
  { urls: "stun:stun.cloudflare.com:3478" },
]

export type TurnMiljo = {
  MOGGERN_TURN_URLS?: string
  MOGGERN_TURN_URL?: string
  MOGGERN_TURN_USERNAME?: string
  MOGGERN_TURN_CREDENTIAL?: string
  /** Cloudflare Realtime TURN (1 TB/month free tier) — short-lived ephemeral credentials. */
  MOGGERN_CF_TURN_KEY_ID?: string
  MOGGERN_CF_TURN_API_TOKEN?: string
  /** Metered.ca TURN API (e.g. "myapp.metered.live") — dynamic ICE server list. */
  MOGGERN_METERED_DOMAIN?: string
  MOGGERN_METERED_API_KEY?: string
}

const GYLDIG_ICE_URL = /^(stuns?|turns?):.+$/i
/** Browsers block port 53 for WebRTC ICE candidates (Cloudflare recommends stripping it). */
const BLOKKERT_PORT_53 = /:53(\?|$)/

function rensIceUrls(ra: unknown): string[] {
  const liste = typeof ra === "string" ? [ra] : Array.isArray(ra) ? ra : []
  return liste
    .filter((u): u is string => typeof u === "string")
    .map((u) => u.trim())
    .filter((u) => GYLDIG_ICE_URL.test(u) && !BLOKKERT_PORT_53.test(u))
}

/** Validates and sanitizes an external ICE server list (from Cloudflare/Metered), stripping blocked port-53 URLs. */
export function normaliserIceTjenere(ra: unknown): { tjenere: IceTjener[]; harTurn: boolean } {
  if (!Array.isArray(ra)) return { tjenere: [], harTurn: false }
  const tjenere: IceTjener[] = []
  let harTurn = false
  for (const post of ra) {
    if (!post || typeof post !== "object") continue
    const o = post as Record<string, unknown>
    const urls = rensIceUrls(o.urls)
    if (!urls.length) continue
    const tjener: IceTjener = { urls: urls.length === 1 ? urls[0] : urls }
    if (typeof o.username === "string" && o.username.trim()) tjener.username = o.username.trim()
    if (typeof o.credential === "string" && o.credential.trim()) tjener.credential = o.credential.trim()
    if (urls.some((u) => /^turns?:/i.test(u)) && tjener.username && tjener.credential) {
      harTurn = true
    }
    tjenere.push(tjener)
  }
  return { tjenere, harTurn }
}

/**
 * Builds the synchronous ICE server list for WebRTC (STUN + optional static TURN).
 * TURN servers are only attached when `innlogget` is true and both URL(s) and credentials are set.
 */
export function byggIceKonfig(env: TurnMiljo, innlogget: boolean): IceKonfig {
  const iceServers: IceTjener[] = STANDARD_STUN.map((s) => ({ ...s }))
  if (!innlogget) return { iceServers, harTurn: false }

  const raUrls = (env.MOGGERN_TURN_URLS || env.MOGGERN_TURN_URL || "")
    .split(",")
    .map((u) => u.trim())
    .filter((u) => /^turns?:.+/i.test(u) && !BLOKKERT_PORT_53.test(u))
  const username = env.MOGGERN_TURN_USERNAME?.trim()
  const credential = env.MOGGERN_TURN_CREDENTIAL?.trim()

  if (raUrls.length > 0 && username && credential) {
    iceServers.push({
      urls: raUrls.length === 1 ? raUrls[0] : raUrls,
      username,
      credential,
    })
    return { iceServers, harTurn: true }
  }

  return { iceServers, harTurn: false }
}

/**
 * Fetches dynamic short-lived TURN credentials (Cloudflare Realtime TURN or Metered TURN) when configured,
 * falling back cleanly to static TURN env vars or STUN-only. Only hands out TURN to logged-in users.
 */
export async function hentIceKonfig(
  env: TurnMiljo,
  innlogget: boolean,
  fetchFn: typeof fetch = fetch,
): Promise<IceKonfig> {
  const basis = byggIceKonfig(env, innlogget)
  if (!innlogget) return basis

  const cfKeyId = env.MOGGERN_CF_TURN_KEY_ID?.trim()
  const cfToken = env.MOGGERN_CF_TURN_API_TOKEN?.trim()
  if (cfKeyId && cfToken) {
    try {
      const res = await fetchFn(
        `https://rtc.live.cloudflare.com/v1/turn/keys/${encodeURIComponent(cfKeyId)}/credentials/generate-ice-servers`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${cfToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ ttl: 3600 }),
          signal: AbortSignal.timeout(2500),
        },
      )
      if (res.ok) {
        const data = (await res.json()) as { iceServers?: unknown }
        const norm = normaliserIceTjenere(data?.iceServers)
        if (norm.harTurn) {
          return {
            iceServers: [...STANDARD_STUN.map((s) => ({ ...s })), ...norm.tjenere],
            harTurn: true,
          }
        }
      }
    } catch {
      // Fall through to next provider / STUN-only.
    }
  }

  const meteredDomene = env.MOGGERN_METERED_DOMAIN?.trim().replace(/^https?:\/\//i, "").replace(/\/+$/, "")
  const meteredKey = env.MOGGERN_METERED_API_KEY?.trim()
  if (meteredDomene && meteredKey) {
    try {
      const res = await fetchFn(
        `https://${meteredDomene}/api/v1/turn/credentials?apiKey=${encodeURIComponent(meteredKey)}`,
        { signal: AbortSignal.timeout(2500) },
      )
      if (res.ok) {
        const data: unknown = await res.json()
        const norm = normaliserIceTjenere(data)
        if (norm.harTurn) {
          return {
            iceServers: [...STANDARD_STUN.map((s) => ({ ...s })), ...norm.tjenere],
            harTurn: true,
          }
        }
      }
    } catch {
      // Fall through to static TURN / STUN-only.
    }
  }

  return basis
}

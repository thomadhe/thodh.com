import { z } from "zod";

export const authInput = z.object({
  action: z.enum(["login", "signup", "magic"]),
  email: z.string().trim().email().max(254).transform((s) => s.toLowerCase()),
  password: z.string().max(1024).optional(),
  next: z.string().optional(),
}).strict();

export function safeNext(value: unknown): string {
  return value === "/konto" ? "/konto" : "/otsjoba";
}

export function sameOrigin(request: Request): boolean {
  return request.headers.get("origin") === new URL(request.url).origin;
}

export async function readJson(request: Request, maxBytes: number): Promise<unknown> {
  if (!request.headers.get("content-type")?.startsWith("application/json")) throw new Error("content-type");
  const reader = request.body?.getReader();
  if (!reader) throw new Error("empty-body");
  let total = 0;
  const chunks: Uint8Array[] = [];
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > maxBytes) { await reader.cancel(); throw new Error("too-large"); }
    chunks.push(value);
  }
  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
  return JSON.parse(new TextDecoder().decode(bytes));
}

export function authError(code?: string): string {
  if (code === "invalid_credentials") return "Feil e-post eller passord.";
  if (code === "email_not_confirmed") return "Bekreft e-posten din først. Sjekk innboksen og søppelpost.";
  if (code === "user_already_exists") return "Har du allerede konto i Karrierepiloten? Bruk samme innlogging her.";
  if (code?.includes("rate_limit")) return "For mange forsøk akkurat nå. Vent litt og prøv igjen.";
  if (code === "weak_password") return "Velg et sterkere passord med minst 8 tegn.";
  return "Kunne ikke fullføre innloggingen. Prøv igjen, eller be om en innloggingslenke.";
}

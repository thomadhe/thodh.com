// The client side of the duels' signed verdicts (lib/server/duell-signatur.ts) and of the server clock. Each client
// fetches the public key from the server itself (never from another player) and checks every verdict it is shown.
// Answer deadlines are in server time, so each client also keeps an estimate of how far its clock is off.

/** A verdict as the server signed it: the exact JSON text and its Ed25519 signature, both base64url-safe text. */
export type Signert = { j: string; s: string }

export const DUELL_API = "/spill/api/duell"

export function lesSignert(x: unknown): Signert | null {
  if (typeof x !== "object" || x === null) return null
  const { j, s } = x as Record<string, unknown>
  if (typeof j !== "string" || typeof s !== "string" || j.length > 2000 || s.length > 100) return null
  return { j, s }
}

/** The signed JSON, read back. Null when it is not an object. */
export function apne(x: Signert): Record<string, unknown> | null {
  try {
    const v = JSON.parse(x.j) as unknown
    return typeof v === "object" && v !== null && !Array.isArray(v) ? (v as Record<string, unknown>) : null
  } catch {
    return null
  }
}

// ---- the server clock ----

let forskyvning = 0
let besteRtt = Infinity

/** Takes the server's time from a response; the answer with the shortest round trip gives the best estimate. */
export function merkServertid(na: unknown, sendt: number, mottatt: number) {
  if (typeof na !== "number" || !Number.isFinite(na)) return
  const rtt = mottatt - sendt
  if (rtt > besteRtt) return
  besteRtt = rtt
  forskyvning = na - (sendt + mottatt) / 2
}

/** Now, in server time (epoch ms). */
export const serverNa = () => Math.round(Date.now() + forskyvning)

/** A POST to a game's API that also reads the server clock from the `na` in the answer. */
export async function duellPost<T>(url: string, body: unknown): Promise<T> {
  const sendt = Date.now()
  const svar = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
  const data = await svar.json().catch(() => ({ melding: "Noe gikk galt." }))
  merkServertid(data?.na, sendt, Date.now())
  if (!svar.ok) throw new Error(data?.melding ?? "Noe gikk galt.")
  return data as T
}

// ---- checking signatures ----

const fraBase64url = (s: string) => {
  const b = atob(s.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((s.length + 3) % 4))
  return Uint8Array.from(b, (c) => c.charCodeAt(0))
}

/** The key, or null when this browser has no Ed25519 in WebCrypto (then the server checks for us). */
let nokkel: Promise<CryptoKey | null> | null = null

/**
 * Fetches the public key and sets the clock. Called as soon as a duel page opens, so it also wakes the API before
 * the first answer needs it.
 */
export function forberedDuell(): Promise<CryptoKey | null> {
  nokkel ??= (async () => {
    // Two quick round trips: the second is usually the shorter one, once the connection is up.
    let raa = ""
    for (let i = 0; i < 2; i++) {
      const sendt = Date.now()
      const svar = await fetch(DUELL_API, { cache: "no-store" })
      const data = (await svar.json()) as { nokkel?: string; na?: number }
      merkServertid(data.na, sendt, Date.now())
      raa = data.nokkel ?? raa
    }
    try {
      return await crypto.subtle.importKey("raw", fraBase64url(raa), { name: "Ed25519" }, false, ["verify"])
    } catch {
      return null
    }
  })()
  nokkel.catch(() => (nokkel = null))
  return nokkel
}

const sjekket = new Map<string, boolean>()
const nokkelFor = (x: Signert) => `${x.s}|${x.j}`

/** Whether each verdict carries the server's signature. Results are remembered, so asking again is free. */
export async function sjekkSignaturer(liste: Signert[]): Promise<boolean[]> {
  const ukjente = liste.filter((x) => !sjekket.has(nokkelFor(x)))
  if (ukjente.length) {
    const key = await forberedDuell()
    if (key) {
      const koder = new TextEncoder()
      await Promise.all(
        ukjente.map(async (x) => {
          let ok = false
          try {
            ok = await crypto.subtle.verify("Ed25519", key, fraBase64url(x.s), koder.encode(x.j))
          } catch {}
          sjekket.set(nokkelFor(x), ok)
        }),
      )
    } else {
      const { ok } = await duellPost<{ ok: boolean[] }>(DUELL_API, { liste: ukjente })
      ukjente.forEach((x, i) => sjekket.set(nokkelFor(x), ok[i] === true))
    }
  }
  return liste.map((x) => sjekket.get(nokkelFor(x)) === true)
}

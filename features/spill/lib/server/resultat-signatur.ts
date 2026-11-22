// Ed25519 signatures for daily game sessions, offline result receipts and leaderboard rows.
// Reuses STEGERN_HEMMELIGHET or SJAKK_GATEWAY_KEY with its own HMAC domain (no new env var needed).
// Kept free of "server-only" so unit tests can import it directly.

import { createHmac, createPrivateKey, createPublicKey, randomBytes, sign, verify, type KeyObject } from "node:crypto"
import { erServerSpill, klemTidSek, type ServerSpillId } from "../sosial"

const PKCS8_ED25519 = Buffer.from("302e020100300506032b657004220420", "hex")

let nokler: { privat: KeyObject; offentlig: KeyObject; fast: boolean } | null = null

function hentNokler() {
  if (nokler) return nokler
  const kilde = process.env.STEGERN_HEMMELIGHET || process.env.SJAKK_GATEWAY_KEY
  const fro = kilde ? createHmac("sha256", kilde).update("spill-resultat:ed25519:v1").digest() : randomBytes(32)
  const privat = createPrivateKey({ key: Buffer.concat([PKCS8_ED25519, fro]), format: "der", type: "pkcs8" })
  const offentlig = createPublicKey(privat)
  return (nokler = { privat, offentlig, fast: Boolean(kilde) })
}

/** True when a persistent env secret backs the key (production Vercel), false for ephemeral local dev keys. */
export function harFastResultatNokkel() {
  return hentNokler().fast
}

function signerTekst(tekst: string) {
  return sign(null, Buffer.from(tekst, "utf8"), hentNokler().privat).toString("base64url")
}

function verifiserTekst(tekst: string, sig: string) {
  try {
    return verify(null, Buffer.from(tekst, "utf8"), hentNokler().offentlig, Buffer.from(sig, "base64url"))
  } catch {
    return false
  }
}

export type SignertPakke = { j: string; s: string }

function pakk(data: Record<string, unknown>): SignertPakke {
  const j = JSON.stringify(data)
  return { j, s: signerTekst(j) }
}

function pakkUt(pakke: unknown): Record<string, unknown> | null {
  if (!pakke || typeof pakke !== "object") return null
  const { j, s } = pakke as { j?: unknown; s?: unknown }
  if (typeof j !== "string" || typeof s !== "string" || j.length > 16_000 || s.length > 160) return null
  if (!verifiserTekst(j, s)) return null
  try {
    const parsed = JSON.parse(j) as unknown
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? (parsed as Record<string, unknown>) : null
  } catch {
    return null
  }
}

// ---- 1. Signed in-progress session token (`okt`) ----

export type OktPayload = {
  v: 1
  t: "okt"
  sp: ServerSpillId
  d: string
  /** Server start timestamp (epoch ms) recorded on the first guess/hint/answer. */
  st: number
  /** Guesses/attempts made so far. */
  f: number
  /** Hints requested so far. */
  h: number
  /** True if `fasit` was fetched before finishing (disqualifies verified win). */
  fh?: boolean
  /** Compact game-specific verified state (per-question scores, solved groups, etc.). */
  x?: Record<string, unknown>
}

export function signerOkt(payload: Omit<OktPayload, "v" | "t">): SignertPakke {
  return pakk({ v: 1, t: "okt", ...payload })
}

export function lesOkt(pakke: unknown, spillId: ServerSpillId, dato: string): OktPayload | null {
  const d = pakkUt(pakke)
  if (!d || d.v !== 1 || d.t !== "okt" || d.sp !== spillId || d.d !== dato) return null
  if (typeof d.st !== "number" || !Number.isFinite(d.st) || d.st <= 0) return null
  if (typeof d.f !== "number" || !Number.isInteger(d.f) || d.f < 0 || d.f > 5000) return null
  if (typeof d.h !== "number" || !Number.isInteger(d.h) || d.h < 0 || d.h > 500) return null
  return {
    v: 1,
    t: "okt",
    sp: spillId,
    d: dato,
    st: d.st,
    f: d.f,
    h: d.h,
    fh: d.fh === true,
    x: d.x && typeof d.x === "object" && !Array.isArray(d.x) ? (d.x as Record<string, unknown>) : undefined,
  }
}

// ---- 2. Signed finished result receipt (`bevis`) ----

export type BevisPayload = {
  v: 1
  t: "bevis"
  sp: ServerSpillId
  d: string
  status: "vunnet" | "tapt" | "ferdig"
  etikett: string
  poeng: number | null
  forsok: number | null
  hint: number
  tidSek: number | null
}

export function signerBevis(payload: Omit<BevisPayload, "v" | "t">): SignertPakke {
  return pakk({
    v: 1,
    t: "bevis",
    ...payload,
    tidSek: klemTidSek(payload.tidSek),
  })
}

export function lesBevis(pakke: unknown): BevisPayload | null {
  const d = pakkUt(pakke)
  if (!d || d.v !== 1 || d.t !== "bevis") return null
  if (typeof d.sp !== "string" || !erServerSpill(d.sp) || typeof d.d !== "string") return null
  if (d.status !== "vunnet" && d.status !== "tapt" && d.status !== "ferdig") return null
  if (typeof d.etikett !== "string" || d.etikett.length > 60) return null
  const poeng = d.poeng === null ? null : typeof d.poeng === "number" && Number.isFinite(d.poeng) ? d.poeng : undefined
  const forsok = d.forsok === null ? null : typeof d.forsok === "number" && Number.isInteger(d.forsok) && d.forsok >= 0 ? d.forsok : undefined
  if (poeng === undefined || forsok === undefined) return null
  if (typeof d.hint !== "number" || !Number.isInteger(d.hint) || d.hint < 0 || d.hint > 500) return null
  const tidSek = d.tidSek === null ? null : typeof d.tidSek === "number" ? klemTidSek(d.tidSek) : undefined
  if (tidSek === undefined) return null
  return {
    v: 1,
    t: "bevis",
    sp: d.sp,
    d: d.d,
    status: d.status,
    etikett: d.etikett,
    poeng,
    forsok,
    hint: d.hint,
    tidSek,
  }
}

// ---- 3. Database row signature bound to userId + leaderboard columns ----

export type ResultatRadSignaturInput = {
  userId: string
  spillId: string
  dato: string
  status: "vunnet" | "tapt" | "ferdig"
  poeng: number | null
  forsok: number | null
  hintAntall: number
  tidSek: number | null
}

function kanoniskRad(r: ResultatRadSignaturInput): string {
  const poeng = r.poeng === null || r.poeng === undefined ? null : Math.round(Number(r.poeng) * 100) / 100
  const forsok = r.forsok === null || r.forsok === undefined ? null : Math.trunc(Number(r.forsok))
  const hint = Math.trunc(Number(r.hintAntall ?? 0))
  const tid = r.tidSek === null || r.tidSek === undefined ? null : Math.trunc(Number(r.tidSek))
  return JSON.stringify(["rad:v1", r.userId, r.spillId, r.dato, r.status, poeng, forsok, hint, tid])
}

export function signerResultatRad(r: ResultatRadSignaturInput): string {
  return signerTekst(kanoniskRad(r))
}

export function verifiserResultatRad(r: ResultatRadSignaturInput, signatur: string | null | undefined): boolean {
  if (!signatur || typeof signatur !== "string" || signatur.length > 200) return false
  return verifiserTekst(kanoniskRad(r), signatur)
}

/** Computes clamped elapsed seconds from a server start timestamp (epoch ms). */
export function beregnTidSek(startetMs: number | null | undefined, sluttMs = Date.now()): number | null {
  if (typeof startetMs !== "number" || !Number.isFinite(startetMs) || startetMs <= 0) return null
  return klemTidSek(Math.max(1, Math.round((sluttMs - startetMs) / 1000)))
}

import "server-only"

import type { SupabaseClient, User } from "@supabase/supabase-js"
import { authCookieOptions } from "@/lib/supabase/config"
import { createClient } from "@/lib/supabase/server"
import { klemTidSek, type ServerSpillId } from "../sosial"
import { beregnTidSek, lesOkt, signerBevis, signerOkt, signerResultatRad, type OktPayload, type SignertPakke } from "./resultat-signatur"

export type Innlogget = { supabase: SupabaseClient; user: User }

/** Zero-cost check: skip Supabase Auth roundtrip on public game API calls when no auth cookie is sent. */
export function harAuthCookie(request: Request): boolean {
  const cookie = request.headers.get("cookie")
  return Boolean(cookie && cookie.includes(authCookieOptions.name))
}

export async function hentInnlogget(request: Request): Promise<Innlogget | null> {
  if (!harAuthCookie(request)) return null
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser()
    if (error || !user) return null
    return { supabase, user }
  } catch {
    return null
  }
}

export type ServerOktRad = {
  startet_kl: string
  forsok: number
  hint_antall: number
  fasit_hentet: boolean
  data: Record<string, unknown>
}

export type SamletOkt = {
  startetMs: number
  forsok: number
  hint: number
  fasitHentet: boolean
  data: Record<string, unknown>
  innlogget: Innlogget | null
  harDbOkt: boolean
}

/** Loads both the signed client token and (when logged in) the Postgres `spill_okter` row, merging conservatively. */
export async function lastOkt(
  request: Request,
  spillId: ServerSpillId,
  dato: string,
  klientPakke?: unknown,
): Promise<SamletOkt> {
  const na = Date.now()
  const klientOkt: OktPayload | null = lesOkt(klientPakke, spillId, dato)
  const innlogget = await hentInnlogget(request)

  let dbOkt: ServerOktRad | null = null
  if (innlogget) {
    try {
      const { data } = await innlogget.supabase
        .from("spill_okter")
        .select("startet_kl, forsok, hint_antall, fasit_hentet, data")
        .eq("user_id", innlogget.user.id)
        .eq("spill_id", spillId)
        .eq("dato", dato)
        .maybeSingle()
      if (data) dbOkt = data as ServerOktRad
    } catch {
      // Migration may not be applied yet: degrade gracefully to signed token only.
    }
  }

  const dbStartMs = dbOkt ? Date.parse(dbOkt.startet_kl) : null
  const tider = [dbStartMs, klientOkt?.st].filter((t): t is number => typeof t === "number" && Number.isFinite(t) && t > 0)
  const startetMs = tider.length ? Math.min(...tider) : na

  return {
    startetMs,
    forsok: Math.max(dbOkt?.forsok ?? 0, klientOkt?.f ?? 0),
    hint: Math.max(dbOkt?.hint_antall ?? 0, klientOkt?.h ?? 0),
    fasitHentet: Boolean(dbOkt?.fasit_hentet || klientOkt?.fh),
    data: { ...(klientOkt?.x ?? {}), ...(dbOkt?.data ?? {}) },
    innlogget,
    harDbOkt: Boolean(dbOkt),
  }
}

/** Persists updated session progress to `spill_okter` (if logged in) and returns a freshly signed `okt` token. */
export async function lagreOktTilstand(
  okt: SamletOkt,
  spillId: ServerSpillId,
  dato: string,
  neste: { forsok: number; hint: number; fasitHentet?: boolean; data?: Record<string, unknown> },
): Promise<SignertPakke> {
  const fasitHentet = Boolean(okt.fasitHentet || neste.fasitHentet)
  const data = neste.data ?? okt.data
  if (okt.innlogget) {
    try {
      await okt.innlogget.supabase.from("spill_okter").upsert(
        {
          user_id: okt.innlogget.user.id,
          spill_id: spillId,
          dato,
          startet_kl: new Date(okt.startetMs).toISOString(),
          forsok: neste.forsok,
          hint_antall: neste.hint,
          fasit_hentet: fasitHentet,
          data,
        },
        { onConflict: "user_id,spill_id,dato" },
      )
    } catch {
      // Ignore DB errors so the game never breaks if migration is pending.
    }
  }
  return signerOkt({
    sp: spillId,
    d: dato,
    st: okt.startetMs,
    f: neste.forsok,
    h: neste.hint,
    ...(fasitHentet ? { fh: true } : {}),
    ...(Object.keys(data).length ? { x: data } : {}),
  })
}

export type FerdigResultatInput = {
  spillId: ServerSpillId
  dato: string
  status: "vunnet" | "tapt" | "ferdig"
  etikett: string
  poeng: number | null
  forsok: number | null
  hint: number
  /** Whether elapsed solve time makes sense for this game. */
  medTid?: boolean
  detaljer?: Record<string, unknown>
}

/**
 * Finalizes a server-judged daily game:
 * - Returns a signed `bevis` receipt (for offline->login sync) if `fasit` was NOT fetched before finishing.
 * - If logged in, immediately inserts the immutable verified row into `spill_resultater` (never overwriting an existing day).
 */
export async function fullforServerSpill(
  okt: SamletOkt,
  input: FerdigResultatInput,
): Promise<{ bevis?: SignertPakke; lagret: boolean }> {
  const tidSek = input.medTid ? beregnTidSek(okt.startetMs) : null
  // If `fasit` was already requested before solving a win/loss game, disqualify from leaderboards.
  const verifisert = !(okt.fasitHentet && input.status !== "tapt")
  const bevis = verifisert
    ? signerBevis({
        sp: input.spillId,
        d: input.dato,
        status: input.status,
        etikett: input.etikett,
        poeng: input.poeng,
        forsok: input.forsok,
        hint: input.hint,
        tidSek,
      })
    : undefined

  let lagret = false
  if (okt.innlogget) {
    try {
      const signatur = verifisert
        ? signerResultatRad({
            userId: okt.innlogget.user.id,
            spillId: input.spillId,
            dato: input.dato,
            status: input.status,
            poeng: input.poeng,
            forsok: input.forsok,
            hintAntall: input.hint,
            tidSek,
          })
        : null
      const { error } = await okt.innlogget.supabase.from("spill_resultater").insert({
        user_id: okt.innlogget.user.id,
        spill_id: input.spillId,
        dato: input.dato,
        status: input.status,
        etikett: input.etikett.slice(0, 60),
        poeng: input.poeng,
        forsok: input.forsok,
        hint_antall: input.hint,
        tid_sek: klemTidSek(tidSek),
        verifisert,
        signatur,
        detaljer: input.detaljer ?? {},
      })
      lagret = !error || error.code === "23505"
    } catch {
      // Migration pending or transient error: client still holds signed `bevis` for later sync.
    }
  }
  return { bevis, lagret }
}

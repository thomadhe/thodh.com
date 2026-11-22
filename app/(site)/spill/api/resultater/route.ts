import { z } from "zod"
import { erGyldigManed, klemTidSek, manedGrenser, spillEtterId } from "@/features/spill/lib/sosial"
import type { SpillId } from "@/features/spill/lib/spill"
import { verifiserKlientResultat } from "@/features/spill/lib/server/klient-verifisering"
import { signerResultatRad } from "@/features/spill/lib/server/resultat-signatur"
import { DB_IKKE_KLAR_MELDING, erDatabaseMangel, hentBruker, jsonPrivat } from "@/features/spill/lib/server/sosial-api"
import { readJson, sameOrigin } from "@/lib/auth/validation"

const bevisSkjema = z.object({ j: z.string().max(16_000), s: z.string().max(160) }).optional()

const oppforingSkjema = z.object({
  spillId: z.string().refine((id): id is SpillId => Boolean(spillEtterId(id))),
  dato: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  tilstand: z.unknown().optional(),
  bevis: bevisSkjema,
})

const lagreSkjema = z.object({
  oppforinger: z.array(oppforingSkjema).min(1).max(40),
})

export async function GET(request: Request) {
  const innlogget = await hentBruker()
  if (!innlogget) return jsonPrivat({ melding: "Logg inn for å se historikk." }, 401)

  const url = new URL(request.url)
  const spillParam = url.searchParams.get("spill")
  const manedParam = url.searchParams.get("maned")

  let sporring = innlogget.supabase
    .from("spill_resultater")
    .select("spill_id, dato, status, etikett, poeng, forsok, hint_antall, tid_sek, verifisert, opprettet_kl")
    .eq("user_id", innlogget.user.id)
    .order("dato", { ascending: false })
    .order("opprettet_kl", { ascending: false })
    .limit(500)

  if (spillParam && spillEtterId(spillParam)) {
    sporring = sporring.eq("spill_id", spillParam)
  }
  if (manedParam && erGyldigManed(manedParam)) {
    const { fra, til } = manedGrenser(manedParam)
    sporring = sporring.gte("dato", fra).lte("dato", til)
  }

  const { data, error } = await sporring
  if (error) {
    if (erDatabaseMangel(error)) {
      return jsonPrivat({ resultater: [], databaseKlar: false, melding: DB_IKKE_KLAR_MELDING })
    }
    return jsonPrivat({ melding: "Klarte ikke å hente historikken." }, 500)
  }

  return jsonPrivat({ resultater: data ?? [], databaseKlar: true })
}

export async function POST(request: Request) {
  if (!sameOrigin(request)) return jsonPrivat({ melding: "Ugyldig opprinnelse." }, 403)
  const innlogget = await hentBruker()
  if (!innlogget) return jsonPrivat({ melding: "Du må være innlogget." }, 401)

  let kropp: unknown
  try {
    kropp = await readJson(request, 256_000)
  } catch {
    return jsonPrivat({ melding: "Ugyldig forespørsel." }, 400)
  }

  const tolket = lagreSkjema.safeParse(kropp)
  if (!tolket.success) return jsonPrivat({ melding: "Ugyldige resultatdata." }, 400)

  let lagret = 0
  let vurdert = 0
  for (const o of tolket.data.oppforinger) {
    const res = verifiserKlientResultat(o.spillId, o.dato, o.tilstand, o.bevis)
    if (!res) continue
    vurdert++
    const tidSek = klemTidSek(res.tidSek)
    const signatur = res.verifisert
      ? signerResultatRad({
          userId: innlogget.user.id,
          spillId: res.spillId,
          dato: res.dato,
          status: res.status,
          poeng: res.poeng,
          forsok: res.forsok,
          hintAntall: res.hintAntall,
          tidSek,
        })
      : null
    const { error } = await innlogget.supabase.from("spill_resultater").insert({
      user_id: innlogget.user.id,
      spill_id: res.spillId,
      dato: res.dato,
      status: res.status,
      etikett: res.etikett.slice(0, 60),
      poeng: res.poeng,
      forsok: res.forsok,
      hint_antall: res.hintAntall,
      tid_sek: tidSek,
      verifisert: res.verifisert,
      signatur,
      detaljer: res.detaljer,
    })
    if (!error) {
      lagret++
    } else if (erDatabaseMangel(error)) {
      return jsonPrivat({ lagret, totalt: vurdert, databaseKlar: false, melding: DB_IKKE_KLAR_MELDING }, 503)
    }
    // 23505 (already saved for this game + day) is expected and silently skipped.
  }

  return jsonPrivat({ lagret, totalt: vurdert, databaseKlar: true })
}

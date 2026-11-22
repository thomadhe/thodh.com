import {
  erGyldigManed,
  erServerSpill,
  gjeldendeManed,
  manedGrenser,
  TAVLE_META,
  type TavleMetrikk,
  type TavleOmfang,
} from "@/features/spill/lib/sosial"
import { aggregerLedertavle, type RaTavleRad } from "@/features/spill/lib/server/ledertavle-logikk"
import { harFastResultatNokkel } from "@/features/spill/lib/server/resultat-signatur"
import { DB_IKKE_KLAR_MELDING, erDatabaseMangel, hentBruker, jsonPrivat } from "@/features/spill/lib/server/sosial-api"

export async function GET(request: Request) {
  const innlogget = await hentBruker()
  if (!innlogget) return jsonPrivat({ melding: "Logg inn for å se ledertavlen." }, 401)

  const url = new URL(request.url)
  const spillParam = url.searchParams.get("spill") ?? "anelseslos"
  if (!erServerSpill(spillParam)) {
    return jsonPrivat({ melding: "Dette spillet har ikke ledertavle." }, 400)
  }

  const manedParam = url.searchParams.get("maned") ?? gjeldendeManed()
  if (!erGyldigManed(manedParam)) {
    return jsonPrivat({ melding: "Ugyldig måned." }, 400)
  }

  const omfang: TavleOmfang = url.searchParams.get("omfang") === "venner" ? "venner" : "global"
  const meta = TAVLE_META[spillParam]
  const metrikkParam = url.searchParams.get("metrikk") as TavleMetrikk | null
  const metrikk: TavleMetrikk =
    metrikkParam && (meta.metrikker as readonly string[]).includes(metrikkParam) ? metrikkParam : meta.standard

  const { fra, til } = manedGrenser(manedParam)

  const [{ data: rader, error: tavleFeil }, { data: profil }] = await Promise.all([
    innlogget.supabase.rpc("spill_ledertavle_rader", {
      p_spill_id: spillParam,
      p_fra: fra,
      p_til: til,
      p_kun_venner: omfang === "venner",
    }),
    innlogget.supabase.from("spill_profiler").select("visningsnavn").eq("user_id", innlogget.user.id).maybeSingle(),
  ])

  if (tavleFeil) {
    if (erDatabaseMangel(tavleFeil)) {
      return jsonPrivat({
        spillId: spillParam,
        maned: manedParam,
        omfang,
        metrikk,
        rader: [],
        harVisningsnavn: false,
        databaseKlar: false,
        melding: DB_IKKE_KLAR_MELDING,
      })
    }
    return jsonPrivat({ melding: "Klarte ikke å hente ledertavlen." }, 500)
  }

  const liste = aggregerLedertavle(
    spillParam,
    (rader ?? []) as RaTavleRad[],
    innlogget.user.id,
    metrikk,
    harFastResultatNokkel(),
  )

  return jsonPrivat({
    spillId: spillParam,
    maned: manedParam,
    omfang,
    metrikk,
    rader: liste,
    harVisningsnavn: Boolean(profil?.visningsnavn),
    databaseKlar: true,
  })
}

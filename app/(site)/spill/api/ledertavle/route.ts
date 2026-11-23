import { iDagOslo, kanSpilles } from "@/features/spill/lib/dag"
import {
  erGyldigManed,
  erServerSpill,
  gjeldendeManed,
  manedGrenser,
  SERVER_SPILL,
  TAVLE_META,
  type ServerSpillId,
  type TavleMetrikk,
  type TavleOmfang,
  type TavlePeriode,
} from "@/features/spill/lib/sosial"
import { aggregerLedertavle, aggregerSeierherre, type RaTavleRad } from "@/features/spill/lib/server/ledertavle-logikk"
import { harFastResultatNokkel } from "@/features/spill/lib/server/resultat-signatur"
import { DB_IKKE_KLAR_MELDING, erDatabaseMangel, hentBruker, jsonPrivat } from "@/features/spill/lib/server/sosial-api"

export async function GET(request: Request) {
  const innlogget = await hentBruker()
  if (!innlogget) return jsonPrivat({ melding: "Logg inn for å se ledertavlen." }, 401)

  const url = new URL(request.url)
  const spillParam = url.searchParams.get("spill") ?? "totalt"
  const erTotalt = spillParam === "totalt"
  if (!erTotalt && !erServerSpill(spillParam)) {
    return jsonPrivat({ melding: "Dette spillet har ikke ledertavle." }, 400)
  }

  const periodeParam = url.searchParams.get("periode")
  const harManedParam = url.searchParams.has("maned")
  const periode: TavlePeriode =
    periodeParam === "maned" || (periodeParam === null && harManedParam && !url.searchParams.has("dato")) ? "maned" : "dag"

  const iDag = iDagOslo()
  let dato = iDag
  let maned = gjeldendeManed(iDag)
  let fra: string
  let til: string

  if (periode === "dag") {
    const datoParam = url.searchParams.get("dato") ?? iDag
    if (!kanSpilles(datoParam, iDag)) {
      return jsonPrivat({ melding: "Ugyldig dato." }, 400)
    }
    dato = datoParam
    maned = dato.slice(0, 7)
    fra = dato
    til = dato
  } else {
    const manedParam = url.searchParams.get("maned") ?? maned
    if (!erGyldigManed(manedParam)) {
      return jsonPrivat({ melding: "Ugyldig måned." }, 400)
    }
    maned = manedParam
    const grenser = manedGrenser(manedParam)
    fra = grenser.fra
    til = grenser.til
  }

  const omfang: TavleOmfang = url.searchParams.get("omfang") === "venner" ? "venner" : "global"
  const krevSignatur = harFastResultatNokkel()

  if (erTotalt) {
    const [spillSvar, { data: profil }] = await Promise.all([
      Promise.all(
        SERVER_SPILL.map((id) =>
          innlogget.supabase
            .rpc("spill_ledertavle_rader", {
              p_spill_id: id,
              p_fra: fra,
              p_til: til,
              p_omfang: omfang,
            })
            .then((svar) => ({ id, svar })),
        ),
      ),
      innlogget.supabase.from("spill_profiler").select("visningsnavn").eq("user_id", innlogget.user.id).maybeSingle(),
    ])

    const forsteFeil = spillSvar.find((x) => x.svar.error)?.svar.error
    if (forsteFeil) {
      if (erDatabaseMangel(forsteFeil)) {
        return jsonPrivat({
          modus: "totalt",
          periode,
          dato,
          maned,
          omfang,
          rader: [],
          spillVinnere: [],
          harVisningsnavn: false,
          databaseKlar: false,
          melding: DB_IKKE_KLAR_MELDING,
        })
      }
      return jsonPrivat({ melding: "Klarte ikke å hente ledertavlen." }, 500)
    }

    const perSpill: Partial<Record<ServerSpillId, RaTavleRad[]>> = {}
    for (const { id, svar } of spillSvar) {
      perSpill[id] = (svar.data ?? []) as RaTavleRad[]
    }

    const { rader, spillVinnere } = aggregerSeierherre(
      perSpill,
      innlogget.user.id,
      krevSignatur,
      periode === "dag" ? dato : undefined,
    )

    return jsonPrivat({
      modus: "totalt",
      periode,
      dato,
      maned,
      omfang,
      rader,
      spillVinnere,
      harVisningsnavn: Boolean(profil?.visningsnavn),
      databaseKlar: true,
    })
  }

  const meta = TAVLE_META[spillParam]
  const tillatte = periode === "dag" ? meta.dagMetrikker : meta.metrikker
  const standard = periode === "dag" ? meta.dagStandard : meta.standard
  const metrikkParam = url.searchParams.get("metrikk") as TavleMetrikk | null
  const metrikk: TavleMetrikk =
    metrikkParam && (tillatte as readonly string[]).includes(metrikkParam) ? metrikkParam : standard

  const [{ data: rader, error: tavleFeil }, { data: profil }] = await Promise.all([
    innlogget.supabase.rpc("spill_ledertavle_rader", {
      p_spill_id: spillParam,
      p_fra: fra,
      p_til: til,
      p_omfang: omfang,
    }),
    innlogget.supabase.from("spill_profiler").select("visningsnavn").eq("user_id", innlogget.user.id).maybeSingle(),
  ])

  if (tavleFeil) {
    if (erDatabaseMangel(tavleFeil)) {
      return jsonPrivat({
        modus: "spill",
        periode,
        dato,
        maned,
        spillId: spillParam,
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

  const liste = aggregerLedertavle(spillParam, (rader ?? []) as RaTavleRad[], innlogget.user.id, metrikk, krevSignatur)

  return jsonPrivat({
    modus: "spill",
    periode,
    dato,
    maned,
    spillId: spillParam,
    omfang,
    metrikk,
    rader: liste,
    harVisningsnavn: Boolean(profil?.visningsnavn),
    databaseKlar: true,
  })
}

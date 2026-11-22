import { z } from "zod"
import { kanSpilles } from "@/features/spill/lib/dag"
import { MAKS_POENG, rundePoeng } from "@/features/spill/lib/heksagon"
import { nivaaFor } from "@/features/spill/lib/heksagon-celler"
import { dagensFasit, heleFasit, STEDER_PER_DAG, vurderGjetning } from "@/features/spill/lib/server/heksagonal-jakt"
import { fullforServerSpill, lagreOktTilstand, lastOkt } from "@/features/spill/lib/server/okt-lagring"

const oktSkjema = z.object({ j: z.string().max(16_000), s: z.string().max(160) }).optional()

const foresporsel = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("gjett"),
    dato: z.string(),
    nr: z.number().int().min(0).max(STEDER_PER_DAG - 1),
    // An H3 index of one of the game's levels.
    celle: z.string().max(20).refine((c) => nivaaFor(c) !== null),
    forsok: z.number().int().min(1).max(3),
    okt: oktSkjema,
  }),
  z.object({ type: z.literal("fasit"), dato: z.string(), okt: oktSkjema }),
])

function lesTallKart(v: unknown): Record<string, number> {
  if (!v || typeof v !== "object" || Array.isArray(v)) return {}
  const ut: Record<string, number> = {}
  for (const [k, val] of Object.entries(v as Record<string, unknown>)) {
    if (typeof val === "number" && Number.isFinite(val)) ut[k] = val
  }
  return ut
}

// Places stay on the server; a guess gets its feedback and about how many hexes away it is, and the answer once it
// is found or the third guess is spent.
export async function POST(request: Request) {
  const tolket = foresporsel.safeParse(await request.json().catch(() => null))
  if (!tolket.success || !kanSpilles(tolket.data.dato)) return Response.json({ melding: "Ugyldig forespørsel." }, { status: 400 })
  const data = tolket.data
  const okt = await lastOkt(request, "heksagonal-jakt", data.dato, data.okt)

  if (data.type === "fasit") {
    if (!okt.data.ferdig) {
      const nyOkt = await lagreOktTilstand(okt, "heksagonal-jakt", data.dato, {
        forsok: okt.forsok,
        hint: 0,
        fasitHentet: true,
      })
      return Response.json({ steder: heleFasit(data.dato), okt: nyOkt })
    }
    return Response.json({ steder: heleFasit(data.dato) })
  }

  const { utfall, unna } = vurderGjetning(data.dato, data.nr, data.celle)
  const p = lesTallKart(okt.data.p)
  const g = lesTallKart(okt.data.g)
  const key = String(data.nr)
  const rundeForsok = Math.min(3, Math.max(data.forsok, (g[key] ?? 0) + 1))
  g[key] = rundeForsok
  const avslutt = utfall === "funnet" || data.forsok === 3
  if ((utfall === "funnet" || rundeForsok >= 3) && p[key] === undefined) {
    const nivaa = nivaaFor(data.celle) ?? 0
    p[key] = rundePoeng(utfall, nivaa, rundeForsok - 1)
  }

  const totalForsok = okt.forsok + 1
  const alleFerdig = Array.from({ length: STEDER_PER_DAG }, (_, i) => p[String(i)] !== undefined).every(Boolean)
  const nyOkt = await lagreOktTilstand(okt, "heksagonal-jakt", data.dato, {
    forsok: totalForsok,
    hint: 0,
    data: { p, g, ...(alleFerdig ? { ferdig: true } : {}) },
  })

  let bevis: unknown = undefined
  if (alleFerdig && !okt.data.ferdig) {
    let sum = 0
    for (let i = 0; i < STEDER_PER_DAG; i++) sum += p[String(i)] ?? 0
    ;({ bevis } = await fullforServerSpill(okt, {
      spillId: "heksagonal-jakt",
      dato: data.dato,
      status: "ferdig",
      etikett: `${sum}/${STEDER_PER_DAG * MAKS_POENG}`,
      poeng: sum,
      forsok: totalForsok,
      hint: 0,
      medTid: false,
    }))
  }

  const kropp = avslutt ? { utfall, unna, fasit: dagensFasit(data.dato, data.nr) } : { utfall, unna }
  return Response.json({ ...kropp, okt: nyOkt, ...(bevis ? { bevis } : {}) })
}

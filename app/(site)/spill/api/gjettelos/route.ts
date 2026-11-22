import { z } from "zod"
import { erGyldigKode } from "@/features/spill/lib/duell/rom"
import { ANTALL, formaterPoeng, MAKS_SUM, summer } from "@/features/spill/lib/gjettelos"
import {
  erGjettelosDuellSporsmal,
  gjettelosDuellFasit,
  gjettelosDuellSporsmal,
  gjettelosDuellStempel,
  kanSpillesGjettelos,
  vurder,
} from "@/features/spill/lib/server/gjettelos"
import { fullforServerSpill, lagreOktTilstand, lastOkt } from "@/features/spill/lib/server/okt-lagring"

const gjett = z.number().finite().positive().max(1e30)
const oktSkjema = z.object({ j: z.string().max(16_000), s: z.string().max(160) }).optional()

const foresporsel = z.object({
  dato: z.string(),
  nr: z.number().int().min(0).max(ANTALL - 1),
  gjett,
  okt: oktSkjema,
})

const rom = { kode: z.string().refine(erGyldigKode), runde: z.number().int().min(0).max(999) }
// `nr` is a question of an earlier day, or with dato "bank" an index in the duel bank.
const sporsmal = { ...rom, i: z.number().int().min(0).max(ANTALL - 1), dato: z.string().max(10), nr: z.number().int().min(0).max(9999) }
const duell = z.discriminatedUnion("type", [
  // The questions for one round of a duel, from earlier days only, without their answers.
  z.object({ type: z.literal("duell"), ...rom }),
  // A player's guess: stamped and signed with the time, but the answer stays here.
  z.object({ type: z.literal("duell-gjett"), ...sporsmal, id: z.string().min(1).max(40), gjett }),
  // The answer, signed, asked for by the host once the question has closed.
  z.object({ type: z.literal("duell-fasit"), ...sporsmal }),
])

function lesPoengKart(v: unknown): Record<string, number> {
  if (!v || typeof v !== "object" || Array.isArray(v)) return {}
  const ut: Record<string, number> = {}
  for (const [k, val] of Object.entries(v as Record<string, unknown>)) {
    if (typeof val === "number" && Number.isFinite(val)) ut[k] = val
  }
  return ut
}

// The page only has the questions. The answer and its source come back here once the player has guessed.
export async function POST(request: Request) {
  const body = await request.json().catch(() => null)
  if (body && typeof body === "object" && "type" in body) return duellSvar(body)
  const tolket = foresporsel.safeParse(body)
  if (!tolket.success || !kanSpillesGjettelos(tolket.data.dato)) return Response.json({ melding: "Ugyldig forespørsel." }, { status: 400 })
  const { dato, nr, gjett: g, okt: klientOkt } = tolket.data
  const res = vurder(dato, nr, g)

  const okt = await lastOkt(request, "gjettelos", dato, klientOkt)
  const s = lesPoengKart(okt.data.s)
  if (s[String(nr)] === undefined) s[String(nr)] = res.poeng
  const alle = Array.from({ length: ANTALL }, (_, i) => s[String(i)] !== undefined).every(Boolean)
  const nyOkt = await lagreOktTilstand(okt, "gjettelos", dato, {
    forsok: Object.keys(s).length,
    hint: 0,
    data: { s, ...(alle ? { ferdig: true } : {}) },
  })
  if (alle && !okt.data.ferdig) {
    const poeng = summer(Array.from({ length: ANTALL }, (_, i) => s[String(i)]))
    const { bevis } = await fullforServerSpill(okt, {
      spillId: "gjettelos",
      dato,
      status: "ferdig",
      etikett: `${formaterPoeng(poeng)}/${MAKS_SUM}`,
      poeng,
      forsok: ANTALL,
      hint: 0,
      medTid: false,
    })
    return Response.json({ ...res, okt: nyOkt, ...(bevis ? { bevis } : {}) })
  }
  return Response.json({ ...res, okt: nyOkt })
}

function duellSvar(body: unknown) {
  const tolket = duell.safeParse(body)
  if (!tolket.success) return Response.json({ melding: "Ugyldig forespørsel." }, { status: 400 })
  const data = tolket.data
  if (data.type === "duell") {
    const liste = gjettelosDuellSporsmal(data.kode, data.runde)
    if (!liste.length) return Response.json({ melding: "Duellen trenger minst én tidligere dag å hente spørsmål fra." }, { status: 409 })
    return Response.json({ sporsmal: liste, na: Date.now() })
  }
  if (!erGjettelosDuellSporsmal(data.dato, data.nr)) return Response.json({ melding: "Spørsmålet hører ikke til en duell." }, { status: 400 })
  if (data.type === "duell-gjett") return Response.json({ dom: gjettelosDuellStempel(data), na: Date.now() })
  return Response.json({ dom: gjettelosDuellFasit(data), na: Date.now() })
}

import { z } from "zod"
import { erGyldigKode } from "@/features/spill/lib/duell/rom"
import { ANTALL } from "@/features/spill/lib/gjettelos"
import {
  erGjettelosDuellSporsmal,
  gjettelosDuellFasit,
  gjettelosDuellSporsmal,
  gjettelosDuellStempel,
  kanSpillesGjettelos,
  vurder,
} from "@/features/spill/lib/server/gjettelos"

const gjett = z.number().finite().positive().max(1e30)

const foresporsel = z.object({
  dato: z.string(),
  nr: z.number().int().min(0).max(ANTALL - 1),
  gjett,
})

const rom = { kode: z.string().refine(erGyldigKode), runde: z.number().int().min(0).max(999) }
const sporsmal = { ...rom, i: z.number().int().min(0).max(ANTALL - 1), dato: z.string(), nr: z.number().int().min(0).max(ANTALL - 1) }
const duell = z.discriminatedUnion("type", [
  // The questions for one round of a duel, from earlier days only, without their answers.
  z.object({ type: z.literal("duell"), ...rom }),
  // A player's guess: stamped and signed with the time, but the answer stays here.
  z.object({ type: z.literal("duell-gjett"), ...sporsmal, id: z.string().min(1).max(40), gjett }),
  // The answer, signed, asked for by the host once the question has closed.
  z.object({ type: z.literal("duell-fasit"), ...sporsmal }),
])

// The page only has the questions. The answer and its source come back here once the player has guessed.
export async function POST(request: Request) {
  const body = await request.json().catch(() => null)
  if (body && typeof body === "object" && "type" in body) return duellSvar(body)
  const tolket = foresporsel.safeParse(body)
  if (!tolket.success || !kanSpillesGjettelos(tolket.data.dato)) return Response.json({ melding: "Ugyldig forespørsel." }, { status: 400 })
  const { dato, nr, gjett: g } = tolket.data
  return Response.json(vurder(dato, nr, g))
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

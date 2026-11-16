import { z } from "zod"
import { ANTALL } from "@/features/spill/lib/gjettelos"
import { kanSpillesGjettelos, vurder } from "@/features/spill/lib/server/gjettelos"

const foresporsel = z.object({
  dato: z.string(),
  nr: z.number().int().min(0).max(ANTALL - 1),
  gjett: z.number().finite().positive().max(1e30),
})

// The page only has the questions. The answer and its source come back here once the player has guessed.
export async function POST(request: Request) {
  const tolket = foresporsel.safeParse(await request.json().catch(() => null))
  if (!tolket.success || !kanSpillesGjettelos(tolket.data.dato)) return Response.json({ melding: "Ugyldig forespørsel." }, { status: 400 })
  const { dato, nr, gjett } = tolket.data
  return Response.json(vurder(dato, nr, gjett))
}

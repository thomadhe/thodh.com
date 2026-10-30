import { z } from "zod"
import { kanSpilles } from "@/features/spill/lib/dag"
import { nivaaFor } from "@/features/spill/lib/heksagon-celler"
import { dagensFasit, heleFasit, STEDER_PER_DAG, vurderGjetning } from "@/features/spill/lib/server/heksagonal-jakt"

const foresporsel = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("gjett"),
    dato: z.string(),
    nr: z.number().int().min(0).max(STEDER_PER_DAG - 1),
    // An H3 index of one of the game's levels.
    celle: z.string().max(20).refine((c) => nivaaFor(c) !== null),
    forsok: z.number().int().min(1).max(3),
  }),
  z.object({ type: z.literal("fasit"), dato: z.string() }),
])

// Places stay on the server; a guess gets its feedback, and the answer once it is found or the third guess is spent.
export async function POST(request: Request) {
  const tolket = foresporsel.safeParse(await request.json().catch(() => null))
  if (!tolket.success || !kanSpilles(tolket.data.dato)) return Response.json({ melding: "Ugyldig forespørsel." }, { status: 400 })
  const data = tolket.data
  if (data.type === "fasit") return Response.json({ steder: heleFasit(data.dato) })
  const utfall = vurderGjetning(data.dato, data.nr, data.celle)
  const avslutt = utfall === "funnet" || data.forsok === 3
  return Response.json(avslutt ? { utfall, fasit: dagensFasit(data.dato, data.nr) } : { utfall })
}

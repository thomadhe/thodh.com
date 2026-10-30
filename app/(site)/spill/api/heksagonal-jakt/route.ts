import { z } from "zod"
import { kanSpilles } from "@/features/spill/lib/dag"
import { NIVAER } from "@/features/spill/lib/heksagon"
import { dagensFasit, heleFasit, STEDER_PER_DAG, vurderGjetning } from "@/features/spill/lib/server/heksagonal-jakt"

const celle = z.number().int().min(-2000).max(2000)
const foresporsel = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("gjett"),
    dato: z.string(),
    nr: z.number().int().min(0).max(STEDER_PER_DAG - 1),
    nivaa: z.number().int().min(0).max(NIVAER.length - 1),
    q: celle,
    r: celle,
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
  const utfall = vurderGjetning(data.dato, data.nr, data.nivaa, data.q, data.r)
  const avslutt = utfall === "funnet" || data.forsok === 3
  return Response.json(avslutt ? { utfall, fasit: dagensFasit(data.dato, data.nr) } : { utfall })
}

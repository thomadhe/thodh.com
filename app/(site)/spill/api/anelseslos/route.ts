import { z } from "zod"
import { kanSpilles } from "@/features/spill/lib/dag"
import { fasit, gjett, hint } from "@/features/spill/lib/server/anelseslos"

const foresporsel = z.discriminatedUnion("type", [
  z.object({ type: z.literal("gjett"), dato: z.string(), ord: z.string().max(40) }),
  z.object({
    type: z.literal("hint"),
    dato: z.string(),
    beste: z.number().int().positive().nullable(),
    gjettet: z.array(z.string().max(40)).max(2000),
  }),
  z.object({ type: z.literal("fasit"), dato: z.string() }),
])

export async function POST(request: Request) {
  const tolket = foresporsel.safeParse(await request.json().catch(() => null))
  if (!tolket.success) return Response.json({ melding: "Ugyldig forespørsel." }, { status: 400 })
  const data = tolket.data
  if (!kanSpilles(data.dato)) return Response.json({ melding: "Den dagen kan ikke spilles ennå." }, { status: 400 })

  switch (data.type) {
    case "gjett":
      return Response.json(gjett(data.dato, data.ord))
    case "hint": {
      const h = hint(data.dato, data.beste, data.gjettet)
      return h ? Response.json(h) : Response.json({ melding: "Du er så nær at det ikke finnes flere hint." }, { status: 409 })
    }
    case "fasit":
      // Only requested after the player wins or gives up; the client never receives it otherwise.
      return Response.json(fasit(data.dato))
  }
}

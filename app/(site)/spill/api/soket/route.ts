import { z } from "zod"
import { kanSpilles } from "@/features/spill/lib/dag"
import { dagensSok } from "@/features/spill/lib/server/soket"
import { normaliserSok, vurderOrd } from "@/features/spill/lib/soket"

const foresporsel = z.discriminatedUnion("type", [
  z.object({ type: z.literal("gjett"), dato: z.string(), ord: z.string().max(20) }),
  z.object({ type: z.literal("fasit"), dato: z.string() }),
])

export async function POST(request: Request) {
  const tolket = foresporsel.safeParse(await request.json().catch(() => null))
  if (!tolket.success || !kanSpilles(tolket.data.dato)) return Response.json({ melding: "Ugyldig forespørsel." }, { status: 400 })
  const sok = dagensSok(tolket.data.dato)
  if (tolket.data.type === "fasit") return Response.json({ svar: sok.svar })
  const ord = normaliserSok(tolket.data.ord)
  if (!/^[a-zæøå]+$/.test(ord) || [...ord].length !== [...sok.svar].length) {
    return Response.json({ melding: `Ordet har ${[...sok.svar].length} bokstaver.` }, { status: 400 })
  }
  return Response.json({ farger: vurderOrd(sok.svar, ord) })
}

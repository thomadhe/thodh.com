import { z } from "zod"
import { kanSpilles } from "@/features/spill/lib/dag"
import { dagensTilkoblinger } from "@/features/spill/lib/server/tilkoblinger"

const foresporsel = z.discriminatedUnion("type", [
  z.object({ type: z.literal("gjett"), dato: z.string(), ider: z.array(z.string().max(4)).length(4) }),
  z.object({ type: z.literal("fasit"), dato: z.string() }),
])

// Groups stay on the server; the page only gets the 16 countries.
export async function POST(request: Request) {
  const tolket = foresporsel.safeParse(await request.json().catch(() => null))
  if (!tolket.success || !kanSpilles(tolket.data.dato)) return Response.json({ melding: "Ugyldig forespørsel." }, { status: 400 })
  const { grupper } = dagensTilkoblinger(tolket.data.dato)
  if (tolket.data.type === "fasit") return Response.json({ grupper })
  const valgt = new Set(tolket.data.ider)
  const gruppe = grupper.findIndex((g) => g.ider.every((id) => valgt.has(id)))
  if (gruppe >= 0) return Response.json({ gruppe, ...grupper[gruppe] })
  // "One away": three of the four belong together.
  const enUnna = grupper.some((g) => g.ider.filter((id) => valgt.has(id)).length === 3)
  return Response.json({ gruppe: -1, enUnna })
}

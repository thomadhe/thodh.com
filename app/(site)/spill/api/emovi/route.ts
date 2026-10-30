import { z } from "zod"
import { kanSpilles } from "@/features/spill/lib/dag"
import { dagensFilm, enkelTittel } from "@/features/spill/lib/server/emovi"

const foresporsel = z.discriminatedUnion("type", [
  z.object({ type: z.literal("gjett"), dato: z.string(), tittel: z.string().max(200), aar: z.number().int() }),
  z.object({ type: z.literal("hint"), dato: z.string(), nr: z.number().int().min(1).max(3) }),
  z.object({ type: z.literal("fasit"), dato: z.string() }),
])

export async function POST(request: Request) {
  const tolket = foresporsel.safeParse(await request.json().catch(() => null))
  if (!tolket.success || !kanSpilles(tolket.data.dato)) return Response.json({ melding: "Ugyldig forespørsel." }, { status: 400 })
  const film = dagensFilm(tolket.data.dato)
  const data = tolket.data
  switch (data.type) {
    case "gjett": {
      const tittel = enkelTittel(data.tittel)
      const riktig = data.aar === film.aar && [film.tittel, film.originaltittel].some((t) => t && enkelTittel(t) === tittel)
      return Response.json({ riktig })
    }
    case "hint": {
      const tekst =
        data.nr === 1 ? `Fra ${film.aar}` : data.nr === 2 ? `${film.regi} (regi) · ${film.skuespillere.join(", ")}` : `Sjanger: ${film.sjanger}`
      return Response.json({ tekst })
    }
    case "fasit":
      return Response.json({ tittel: film.tittel, aar: film.aar })
  }
}

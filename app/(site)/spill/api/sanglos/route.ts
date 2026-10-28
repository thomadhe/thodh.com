import { z } from "zod"
import { kanSpilles } from "@/features/spill/lib/dag"
import { erSangKategori } from "@/features/spill/lib/sanglos"
import { dagensSang, finnSang, slaOpp } from "@/features/spill/lib/server/sanglos"

const foresporsel = z.discriminatedUnion("type", [
  z.object({ type: z.literal("lyd"), dato: z.string(), kategori: z.string() }),
  z.object({ type: z.literal("gjett"), dato: z.string(), kategori: z.string(), sangId: z.string().max(200) }),
  z.object({ type: z.literal("fasit"), dato: z.string(), kategori: z.string() }),
])

export async function POST(request: Request) {
  const tolket = foresporsel.safeParse(await request.json().catch(() => null))
  if (!tolket.success) return Response.json({ melding: "Ugyldig forespørsel." }, { status: 400 })
  const data = tolket.data
  if (!kanSpilles(data.dato) || !erSangKategori(data.kategori)) {
    return Response.json({ melding: "Ugyldig dag eller kategori." }, { status: 400 })
  }
  const sang = dagensSang(data.dato, data.kategori)

  switch (data.type) {
    case "lyd": {
      // Only the opaque preview URL is returned, never the title.
      const oppslag = await slaOpp(sang.trackId).catch(() => null)
      if (!oppslag) return Response.json({ melding: "Fant ikke lydklippet akkurat nå. Prøv igjen senere." }, { status: 502 })
      return Response.json({ lyd: oppslag.lyd })
    }
    case "gjett": {
      const gjettet = finnSang(data.sangId)
      if (!gjettet) return Response.json({ melding: "Ukjent sang." }, { status: 400 })
      return Response.json({
        riktig: gjettet.id === sang.id,
        sammeArtist: gjettet.id !== sang.id && gjettet.artist.toLowerCase() === sang.artist.toLowerCase(),
      })
    }
    case "fasit": {
      const oppslag = await slaOpp(sang.trackId).catch(() => null)
      return Response.json({
        id: sang.id,
        tittel: sang.title,
        artist: sang.artist,
        aar: sang.year,
        bilde: oppslag?.bilde,
        lenke: oppslag?.lenke,
      })
    }
  }
}

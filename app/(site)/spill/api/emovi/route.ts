import { z } from "zod"
import { kanSpilles } from "@/features/spill/lib/dag"
import { dagensFilm, enkelTittel, plakat } from "@/features/spill/lib/server/emovi"
import { fullforServerSpill, lagreOktTilstand, lastOkt } from "@/features/spill/lib/server/okt-lagring"

const LIV = 3
const oktSkjema = z.object({ j: z.string().max(16_000), s: z.string().max(160) }).optional()

const foresporsel = z.discriminatedUnion("type", [
  z.object({ type: z.literal("gjett"), dato: z.string(), tittel: z.string().max(200), aar: z.number().int(), okt: oktSkjema }),
  z.object({ type: z.literal("hint"), dato: z.string(), nr: z.number().int().min(1).max(3), okt: oktSkjema }),
  z.object({ type: z.literal("fasit"), dato: z.string(), okt: oktSkjema }),
])

export async function POST(request: Request) {
  const tolket = foresporsel.safeParse(await request.json().catch(() => null))
  if (!tolket.success || !kanSpilles(tolket.data.dato)) return Response.json({ melding: "Ugyldig forespørsel." }, { status: 400 })
  const film = dagensFilm(tolket.data.dato)
  const data = tolket.data
  const okt = await lastOkt(request, "emovi", data.dato, data.okt)
  const feilFor = typeof okt.data.feil === "number" ? okt.data.feil : 0
  const hintNrFor = typeof okt.data.hintNr === "number" ? okt.data.hintNr : 0

  switch (data.type) {
    case "gjett": {
      const tittel = enkelTittel(data.tittel)
      const riktig = data.aar === film.aar && [film.tittel, film.originaltittel].some((t) => t && enkelTittel(t) === tittel)
      const forsok = okt.forsok + 1
      if (riktig) {
        const tapt = Math.min(LIV - 1, Math.max(hintNrFor, feilFor))
        const viaHint = Math.max(0, tapt - feilFor)
        const nyOkt = await lagreOktTilstand(okt, "emovi", data.dato, {
          forsok,
          hint: viaHint,
          data: { ...okt.data, feil: feilFor, hintNr: hintNrFor, ferdig: true },
        })
        if (!okt.data.ferdig) {
          const { bevis } = await fullforServerSpill(okt, {
            spillId: "emovi",
            dato: data.dato,
            status: "vunnet",
            etikett: `${tapt + 1}/${LIV}`,
            poeng: Math.max(1, LIV - tapt),
            forsok,
            hint: viaHint,
            medTid: true,
          })
          return Response.json({ riktig, plakat: plakat(film.id), okt: nyOkt, ...(bevis ? { bevis } : {}) })
        }
        return Response.json({ riktig, plakat: plakat(film.id), okt: nyOkt })
      }
      const feil = feilFor + 1
      const viaHint = Math.max(0, hintNrFor - feil)
      const nyOkt = await lagreOktTilstand(okt, "emovi", data.dato, {
        forsok,
        hint: viaHint,
        data: { ...okt.data, feil, hintNr: hintNrFor },
      })
      return Response.json({ riktig, okt: nyOkt })
    }
    case "hint": {
      const tekst =
        data.nr === 1 ? `Fra ${film.aar}` : data.nr === 2 ? `${film.regi} (regi) · ${film.skuespillere.join(", ")}` : `Sjanger: ${film.sjanger}`
      const hintNr = Math.max(hintNrFor, data.nr)
      const viaHint = Math.max(0, hintNr - feilFor)
      const tapt = hintNr >= LIV
      const nyOkt = await lagreOktTilstand(okt, "emovi", data.dato, {
        forsok: okt.forsok,
        hint: viaHint,
        data: { ...okt.data, feil: feilFor, hintNr, ...(tapt ? { ferdig: true } : {}) },
      })
      if (tapt && !okt.data.ferdig) {
        const { bevis } = await fullforServerSpill(okt, {
          spillId: "emovi",
          dato: data.dato,
          status: "tapt",
          etikett: `X/${LIV}`,
          poeng: 0,
          forsok: okt.forsok,
          hint: viaHint,
          medTid: false,
        })
        return Response.json({ tekst, okt: nyOkt, ...(bevis ? { bevis } : {}) })
      }
      return Response.json({ tekst, okt: nyOkt })
    }
    case "fasit": {
      if (!okt.data.ferdig) {
        const viaHint = Math.max(0, hintNrFor - feilFor)
        const nyOkt = await lagreOktTilstand(okt, "emovi", data.dato, {
          forsok: okt.forsok,
          hint: viaHint,
          fasitHentet: true,
          data: { ...okt.data, ferdig: true },
        })
        const { bevis } = await fullforServerSpill(okt, {
          spillId: "emovi",
          dato: data.dato,
          status: "tapt",
          etikett: `X/${LIV}`,
          poeng: 0,
          forsok: okt.forsok,
          hint: viaHint,
          medTid: false,
        })
        return Response.json({ tittel: film.tittel, aar: film.aar, plakat: plakat(film.id), okt: nyOkt, ...(bevis ? { bevis } : {}) })
      }
      return Response.json({ tittel: film.tittel, aar: film.aar, plakat: plakat(film.id) })
    }
  }
}

import { z } from "zod"
import { kanSpilles } from "@/features/spill/lib/dag"
import { fullforServerSpill, lagreOktTilstand, lastOkt } from "@/features/spill/lib/server/okt-lagring"
import { dagensSok } from "@/features/spill/lib/server/soket"
import { normaliserSok, SOKET_FORSOK, vurderOrd } from "@/features/spill/lib/soket"

const oktSkjema = z.object({ j: z.string().max(16_000), s: z.string().max(160) }).optional()

const foresporsel = z.discriminatedUnion("type", [
  z.object({ type: z.literal("gjett"), dato: z.string(), ord: z.string().max(20), okt: oktSkjema }),
  z.object({ type: z.literal("fasit"), dato: z.string(), okt: oktSkjema }),
])

export async function POST(request: Request) {
  const tolket = foresporsel.safeParse(await request.json().catch(() => null))
  if (!tolket.success || !kanSpilles(tolket.data.dato)) return Response.json({ melding: "Ugyldig forespørsel." }, { status: 400 })
  const sok = dagensSok(tolket.data.dato)
  const okt = await lastOkt(request, "soket", tolket.data.dato, tolket.data.okt)

  if (tolket.data.type === "fasit") {
    if (!okt.data.ferdig) {
      const nyOkt = await lagreOktTilstand(okt, "soket", tolket.data.dato, {
        forsok: okt.forsok,
        hint: 0,
        fasitHentet: true,
      })
      return Response.json({ svar: sok.svar, okt: nyOkt })
    }
    return Response.json({ svar: sok.svar })
  }

  const ord = normaliserSok(tolket.data.ord)
  if (!/^[a-zæøå]+$/.test(ord) || [...ord].length !== [...sok.svar].length) {
    return Response.json({ melding: `Ordet har ${[...sok.svar].length} bokstaver.` }, { status: 400 })
  }
  const farger = vurderOrd(sok.svar, ord)
  const forsok = okt.forsok + 1
  const vunnet = farger.every((f) => f === "riktig")
  const ferdig = vunnet || forsok >= SOKET_FORSOK
  const nyOkt = await lagreOktTilstand(okt, "soket", tolket.data.dato, {
    forsok,
    hint: 0,
    data: ferdig ? { ...okt.data, ferdig: true } : okt.data,
  })
  if (ferdig && !okt.data.ferdig) {
    const { bevis } = await fullforServerSpill(okt, {
      spillId: "soket",
      dato: tolket.data.dato,
      status: vunnet ? "vunnet" : "tapt",
      etikett: vunnet ? `${forsok}/${SOKET_FORSOK}` : `X/${SOKET_FORSOK}`,
      poeng: vunnet ? SOKET_FORSOK + 1 - forsok : 0,
      forsok,
      hint: 0,
      medTid: vunnet,
    })
    return Response.json({ farger, okt: nyOkt, ...(bevis ? { bevis } : {}) })
  }
  return Response.json({ farger, okt: nyOkt })
}

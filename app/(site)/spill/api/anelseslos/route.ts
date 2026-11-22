import { z } from "zod"
import { kanSpilles } from "@/features/spill/lib/dag"
import { fasit, gjett, hint } from "@/features/spill/lib/server/anelseslos"
import { fullforServerSpill, lagreOktTilstand, lastOkt } from "@/features/spill/lib/server/okt-lagring"

const oktSkjema = z.object({ j: z.string().max(16_000), s: z.string().max(160) }).optional()

const foresporsel = z.discriminatedUnion("type", [
  z.object({ type: z.literal("gjett"), dato: z.string(), ord: z.string().max(40), okt: oktSkjema }),
  z.object({
    type: z.literal("hint"),
    dato: z.string(),
    beste: z.number().int().positive().nullable(),
    gjettet: z.array(z.string().max(40)).max(2000),
    okt: oktSkjema,
  }),
  z.object({ type: z.literal("fasit"), dato: z.string(), okt: oktSkjema }),
])

export async function POST(request: Request) {
  const tolket = foresporsel.safeParse(await request.json().catch(() => null))
  if (!tolket.success) return Response.json({ melding: "Ugyldig forespørsel." }, { status: 400 })
  const data = tolket.data
  if (!kanSpilles(data.dato)) return Response.json({ melding: "Den dagen kan ikke spilles ennå." }, { status: 400 })

  const okt = await lastOkt(request, "anelseslos", data.dato, data.okt)

  switch (data.type) {
    case "gjett": {
      const res = gjett(data.dato, data.ord)
      if (!res.ok) return Response.json(res)
      const forsok = okt.forsok + 1
      const vunnet = res.avstand === 1
      const nyOkt = await lagreOktTilstand(okt, "anelseslos", data.dato, {
        forsok,
        hint: okt.hint,
        data: vunnet ? { ...okt.data, vunnet: true } : okt.data,
      })
      if (vunnet && !okt.data.vunnet) {
        const { bevis } = await fullforServerSpill(okt, {
          spillId: "anelseslos",
          dato: data.dato,
          status: "vunnet",
          etikett: `${forsok} gjetninger`,
          poeng: forsok,
          forsok,
          hint: okt.hint,
          medTid: true,
        })
        return Response.json({ ...res, okt: nyOkt, ...(bevis ? { bevis } : {}) })
      }
      return Response.json({ ...res, okt: nyOkt })
    }
    case "hint": {
      const h = hint(data.dato, data.beste, data.gjettet)
      if (!h) return Response.json({ melding: "Du er så nær at det ikke finnes flere hint." }, { status: 409 })
      const antallHint = okt.hint + 1
      const nyOkt = await lagreOktTilstand(okt, "anelseslos", data.dato, {
        forsok: okt.forsok,
        hint: antallHint,
      })
      return Response.json({ ...h, okt: nyOkt })
    }
    case "fasit": {
      // Only requested after the player wins or gives up; the client never receives it otherwise.
      if (!okt.data.vunnet) {
        const nyOkt = await lagreOktTilstand(okt, "anelseslos", data.dato, {
          forsok: okt.forsok,
          hint: okt.hint,
          fasitHentet: true,
          data: { ...okt.data, tapt: true },
        })
        const { bevis } = await fullforServerSpill(okt, {
          spillId: "anelseslos",
          dato: data.dato,
          status: "tapt",
          etikett: "Ga opp",
          poeng: null,
          forsok: okt.forsok,
          hint: okt.hint,
          medTid: false,
        })
        return Response.json({ ...fasit(data.dato), okt: nyOkt, ...(bevis ? { bevis } : {}) })
      }
      return Response.json(fasit(data.dato))
    }
  }
}

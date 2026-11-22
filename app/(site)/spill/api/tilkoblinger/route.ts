import { z } from "zod"
import { kanSpilles } from "@/features/spill/lib/dag"
import { fullforServerSpill, lagreOktTilstand, lastOkt } from "@/features/spill/lib/server/okt-lagring"
import { dagensTilkoblinger } from "@/features/spill/lib/server/tilkoblinger"

const LIV = 4
const oktSkjema = z.object({ j: z.string().max(16_000), s: z.string().max(160) }).optional()

const foresporsel = z.discriminatedUnion("type", [
  z.object({ type: z.literal("gjett"), dato: z.string(), ider: z.array(z.string().max(4)).length(4), okt: oktSkjema }),
  z.object({ type: z.literal("fasit"), dato: z.string(), okt: oktSkjema }),
])

// Groups stay on the server; the page only gets the 16 countries.
export async function POST(request: Request) {
  const tolket = foresporsel.safeParse(await request.json().catch(() => null))
  if (!tolket.success || !kanSpilles(tolket.data.dato)) return Response.json({ melding: "Ugyldig forespørsel." }, { status: 400 })
  const { grupper } = dagensTilkoblinger(tolket.data.dato)
  const okt = await lastOkt(request, "tilkoblinger", tolket.data.dato, tolket.data.okt)

  if (tolket.data.type === "fasit") {
    if (!okt.data.ferdig) {
      const nyOkt = await lagreOktTilstand(okt, "tilkoblinger", tolket.data.dato, {
        forsok: okt.forsok,
        hint: 0,
        fasitHentet: true,
      })
      return Response.json({ grupper, okt: nyOkt })
    }
    return Response.json({ grupper })
  }

  const funnet = new Set<number>(Array.isArray(okt.data.funnet) ? okt.data.funnet.filter((n): n is number => typeof n === "number") : [])
  let feil = typeof okt.data.feil === "number" ? okt.data.feil : 0
  const forsok = okt.forsok + 1
  const valgt = new Set(tolket.data.ider)
  const gruppe = grupper.findIndex((g) => g.ider.every((id) => valgt.has(id)))
  if (gruppe >= 0) funnet.add(gruppe)
  else feil++

  const vunnet = funnet.size === 4
  const tapt = !vunnet && feil >= LIV
  const ferdig = vunnet || tapt
  const nyOkt = await lagreOktTilstand(okt, "tilkoblinger", tolket.data.dato, {
    forsok,
    hint: 0,
    data: { funnet: [...funnet], feil, ...(ferdig ? { ferdig: true } : {}) },
  })
  let bevis: unknown = undefined
  if (ferdig && !okt.data.ferdig) {
    ;({ bevis } = await fullforServerSpill(okt, {
      spillId: "tilkoblinger",
      dato: tolket.data.dato,
      status: vunnet ? "vunnet" : "tapt",
      etikett: vunnet ? `${feil} feil` : `${funnet.size}/4`,
      poeng: vunnet ? Math.max(0, LIV - feil) : 0,
      forsok,
      hint: 0,
      medTid: vunnet,
      detaljer: { feil },
    }))
  }

  if (gruppe >= 0) return Response.json({ gruppe, ...grupper[gruppe], okt: nyOkt, ...(bevis ? { bevis } : {}) })
  // "One away": three of the four belong together.
  const enUnna = grupper.some((g) => g.ider.filter((id) => valgt.has(id)).length === 3)
  return Response.json({ gruppe: -1, enUnna, okt: nyOkt, ...(bevis ? { bevis } : {}) })
}

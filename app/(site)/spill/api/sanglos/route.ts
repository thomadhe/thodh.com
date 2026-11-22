import { z } from "zod"
import { kanSpilles } from "@/features/spill/lib/dag"
import { erSangKategori, SANG_KATEGORIER, TRINN } from "@/features/spill/lib/sanglos"
import { fullforServerSpill, lagreOktTilstand, lastOkt } from "@/features/spill/lib/server/okt-lagring"
import { dagensSang, finnSang, slaOpp, sokKatalog, vurderGjett } from "@/features/spill/lib/server/sanglos"

const oktSkjema = z.object({ j: z.string().max(16_000), s: z.string().max(160) }).optional()

const foresporsel = z.discriminatedUnion("type", [
  z.object({ type: z.literal("sok"), q: z.string().min(2).max(60) }),
  z.object({ type: z.literal("lyd"), dato: z.string(), kategori: z.string(), okt: oktSkjema }),
  z.object({
    type: z.literal("gjett"),
    dato: z.string(),
    kategori: z.string(),
    sangId: z.string().max(200),
    // Songs from the catalogue search are judged by title and artist.
    tittel: z.string().max(300).optional(),
    artist: z.string().max(300).optional(),
    okt: oktSkjema,
  }),
  z.object({ type: z.literal("fasit"), dato: z.string(), kategori: z.string(), okt: oktSkjema }),
])

type KatTilstand = { f: number; s?: "v" | "t"; fh?: boolean }

function lesKat(data: Record<string, unknown>): Record<string, KatTilstand> {
  const raa = data.kat
  if (!raa || typeof raa !== "object" || Array.isArray(raa)) return {}
  const ut: Record<string, KatTilstand> = {}
  for (const [k, v] of Object.entries(raa as Record<string, unknown>)) {
    if (v && typeof v === "object" && !Array.isArray(v)) {
      const o = v as Record<string, unknown>
      ut[k] = {
        f: typeof o.f === "number" ? o.f : 0,
        s: o.s === "v" || o.s === "t" ? o.s : undefined,
        fh: o.fh === true ? true : undefined,
      }
    }
  }
  return ut
}

export async function POST(request: Request) {
  const tolket = foresporsel.safeParse(await request.json().catch(() => null))
  if (!tolket.success) return Response.json({ melding: "Ugyldig forespørsel." }, { status: 400 })
  const data = tolket.data
  if (data.type === "sok") {
    const treff = await sokKatalog(data.q).catch(() => [])
    return Response.json({ treff })
  }
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
      const kjent = finnSang(data.sangId)
      const tittel = kjent?.title ?? data.tittel
      const artist = kjent?.artist ?? data.artist
      if (!tittel || !artist) return Response.json({ melding: "Ukjent sang." }, { status: 400 })
      const dom = kjent?.id === sang.id ? { riktig: true, sammeArtist: false } : vurderGjett(sang, tittel, artist)
      const okt = await lastOkt(request, "sanglos", data.dato, data.okt)
      const kat = lesKat(okt.data)
      const rad = kat[data.kategori] ?? { f: 0 }
      const f = Math.min(TRINN.length, rad.f + 1)
      let s = rad.s
      if (!s) {
        if (dom.riktig && !rad.fh) s = "v"
        else if (f >= TRINN.length) s = "t"
      }
      kat[data.kategori] = { f, ...(s ? { s } : {}), ...(rad.fh ? { fh: true } : {}) }
      const alleFerdig = SANG_KATEGORIER.every(({ id }) => kat[id]?.s === "v" || kat[id]?.s === "t")
      const totalForsok = okt.forsok + 1
      const nyOkt = await lagreOktTilstand(okt, "sanglos", data.dato, {
        forsok: totalForsok,
        hint: 0,
        data: { kat, ...(alleFerdig ? { ferdig: true } : {}) },
      })
      if (alleFerdig && !okt.data.ferdig) {
        const klart = SANG_KATEGORIER.filter(({ id }) => kat[id]?.s === "v").length
        const n = SANG_KATEGORIER.length
        const { bevis } = await fullforServerSpill(okt, {
          spillId: "sanglos",
          dato: data.dato,
          status: klart === n ? "vunnet" : klart > 0 ? "ferdig" : "tapt",
          etikett: `${klart}/${n}`,
          poeng: klart,
          forsok: totalForsok,
          hint: 0,
          medTid: false,
        })
        return Response.json({ ...dom, okt: nyOkt, ...(bevis ? { bevis } : {}) })
      }
      return Response.json({ ...dom, okt: nyOkt })
    }
    case "fasit": {
      const okt = await lastOkt(request, "sanglos", data.dato, data.okt)
      const kat = lesKat(okt.data)
      const rad = kat[data.kategori] ?? { f: 0 }
      if (rad.s !== "v") {
        kat[data.kategori] = { f: rad.f, s: "t", fh: true }
      }
      const alleFerdig = SANG_KATEGORIER.every(({ id }) => kat[id]?.s === "v" || kat[id]?.s === "t")
      const nyOkt = await lagreOktTilstand(okt, "sanglos", data.dato, {
        forsok: okt.forsok,
        hint: 0,
        data: { kat, ...(alleFerdig ? { ferdig: true } : {}) },
      })
      let bevis: unknown = undefined
      if (alleFerdig && !okt.data.ferdig) {
        const klart = SANG_KATEGORIER.filter(({ id }) => kat[id]?.s === "v").length
        const n = SANG_KATEGORIER.length
        ;({ bevis } = await fullforServerSpill(okt, {
          spillId: "sanglos",
          dato: data.dato,
          status: klart === n ? "vunnet" : klart > 0 ? "ferdig" : "tapt",
          etikett: `${klart}/${n}`,
          poeng: klart,
          forsok: okt.forsok,
          hint: 0,
          medTid: false,
        }))
      }
      const oppslag = await slaOpp(sang.trackId).catch(() => null)
      return Response.json({
        id: sang.id,
        tittel: sang.title,
        artist: sang.artist,
        aar: sang.year,
        bilde: oppslag?.bilde,
        lenke: oppslag?.lenke,
        okt: nyOkt,
        ...(bevis ? { bevis } : {}),
      })
    }
  }
}

import "server-only"

import type { SanglosSong } from "../../data/types"
import { sanglosSanger } from "../../data/sanglos/sanger"
import { dagNummer, iRotasjon } from "../dag"
import type { SangKategori } from "../sanglos"

const perKategori = new Map<SangKategori, SanglosSong[]>()
for (const s of sanglosSanger) {
  const liste = perKategori.get(s.category) ?? []
  liste.push(s)
  perKategori.set(s.category, liste)
}

export function dagensSang(dato: string, kategori: SangKategori) {
  return iRotasjon(perKategori.get(kategori)!, dagNummer(dato), `sanglos:${kategori}`)
}

type Oppslag = { lyd: string; bilde?: string; lenke?: string; album?: string }
const buffer = new Map<number, { data: Oppslag; utloper: number }>()

/** Looks up the 30 s preview from the public iTunes Lookup API (Norwegian store). */
export async function slaOpp(trackId: number): Promise<Oppslag | null> {
  const lagret = buffer.get(trackId)
  if (lagret && lagret.utloper > Date.now()) return lagret.data
  const svar = await fetch(`https://itunes.apple.com/lookup?id=${trackId}&country=no&entity=song`, {
    next: { revalidate: 21600 },
  })
  if (!svar.ok) return null
  const json = (await svar.json()) as {
    results?: { previewUrl?: string; artworkUrl100?: string; trackViewUrl?: string; collectionName?: string }[]
  }
  const r = json.results?.[0]
  if (!r?.previewUrl) return null
  const data: Oppslag = {
    lyd: r.previewUrl,
    bilde: r.artworkUrl100?.replace("100x100bb", "300x300bb"),
    lenke: r.trackViewUrl,
    album: r.collectionName,
  }
  buffer.set(trackId, { data, utloper: Date.now() + 6 * 3600_000 })
  if (buffer.size > 64) buffer.delete(buffer.keys().next().value!)
  return data
}

export function finnSang(id: string) {
  return sanglosSanger.find((s) => s.id === id)
}

import "server-only"

import type { SanglosSong } from "../../data/types"
import { sanglosSanger } from "../../data/sanglos/sanger"
import { dagNummer, iRotasjon } from "../dag"
import type { SangKategori } from "../sanglos"

const perKategori: Record<SangKategori, SanglosSong[]> = {
  alle: sanglosSanger,
  rock: sanglosSanger.filter((s) => s.genre === "rock"),
  hiphop: sanglosSanger.filter((s) => s.genre === "hiphop"),
}

export function dagensSang(dato: string, kategori: SangKategori): SanglosSong {
  const dag = dagNummer(dato)
  if (kategori !== "alle") return iRotasjon(perKategori[kategori], dag, `sanglos:${kategori}`)
  // "Alle" draws from every song, but never repeats today's rock or hip hop song.
  const opptatt = new Set([dagensSang(dato, "rock").id, dagensSang(dato, "hiphop").id])
  for (let n = dag * 3; ; n++) {
    const sang = iRotasjon(perKategori.alle, n, "sanglos:alle")
    if (!opptatt.has(sang.id)) return sang
  }
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

// ---- guessing any song, not just the ones in the daily list ----

const enkel = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9æøå]/g, "")

/** "Levels - Radio Edit", "Levels (feat. X) [Remastered]" → "levels". */
export function tittelNokkel(tittel: string) {
  return enkel(tittel.split(/\s[-–]\s|\s?[([]/)[0])
}

/** "Galantis & Hook N Sling feat. X" → {"galantis", "hooknsling", "x"}. */
export function artistNokler(artist: string) {
  return new Set(
    artist
      .split(/,|&|\s(?:x|and|og|feat\.?|ft\.?|featuring|with)\s/i)
      .map(enkel)
      .filter(Boolean),
  )
}

export function sammeArtist(a: string, b: string) {
  const nb = artistNokler(b)
  return [...artistNokler(a)].some((x) => nb.has(x))
}

export type KatalogTreff = { id: string; title: string; artist: string }
const sokBuffer = new Map<string, { treff: KatalogTreff[]; utloper: number }>()

/**
 * Searches the whole iTunes catalogue (Norwegian store), so players can guess any song and the search
 * doesn't give away which songs are in the daily list. Cached per query to stay well under rate limits.
 */
export async function sokKatalog(sporring: string): Promise<KatalogTreff[]> {
  const q = sporring.trim().toLowerCase().slice(0, 60)
  const lagret = sokBuffer.get(q)
  if (lagret && lagret.utloper > Date.now()) return lagret.treff
  const url = `https://itunes.apple.com/search?${new URLSearchParams({ term: q, entity: "song", limit: "25", country: "no" })}`
  const svar = await fetch(url, { next: { revalidate: 86400 } })
  if (!svar.ok) return []
  const json = (await svar.json()) as { results?: { trackId: number; trackName?: string; artistName?: string }[] }
  const sett = new Set<string>()
  const treff: KatalogTreff[] = []
  for (const r of json.results ?? []) {
    if (!r.trackName || !r.artistName || /karaoke|tribute|cover/i.test(r.artistName)) continue
    const nokkel = `${tittelNokkel(r.trackName)}|${enkel(r.artistName)}`
    if (sett.has(nokkel)) continue
    sett.add(nokkel)
    treff.push({ id: `it:${r.trackId}`, title: r.trackName, artist: r.artistName })
  }
  sokBuffer.set(q, { treff, utloper: Date.now() + 6 * 3600_000 })
  if (sokBuffer.size > 500) sokBuffer.delete(sokBuffer.keys().next().value!)
  return treff
}

/** Right song = same title (ignoring versions and features) and at least one shared artist. */
export function vurderGjett(sang: SanglosSong, tittel: string, artist: string) {
  const artistTreff = sammeArtist(artist, sang.artist)
  const riktig = artistTreff && tittelNokkel(tittel) === tittelNokkel(sang.title)
  return { riktig, sammeArtist: artistTreff && !riktig }
}

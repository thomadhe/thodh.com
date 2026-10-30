import "server-only"

import { stokk } from "../dag"
import { land, type Land } from "../geografi"
import { egenskaper } from "../geografi-egenskaper"

// Havet (our GeoZee): nine countries arrive one at a time and each goes into one of nine categories
// worth 0–100 points. The best possible total is found with an exact assignment over all orders.

type Kategori = { id: string; navn: string; regel: string; ikon: string; poeng: (l: Land) => number }

const e = (l: Land) => egenskaper[l.id]
const ja = (b: boolean | null | undefined) => (b ? 100 : 0)
const tak = (n: number) => Math.max(0, Math.min(100, Math.round(n)))

const KATEGORIER: Kategori[] = [
  { id: "naboer", navn: "Naboer", regel: "10 poeng per naboland", ikon: "🤝", poeng: (l) => tak(l.naboer.length * 10) },
  { id: "skog", navn: "Skog", regel: "1 poeng per prosent skog", ikon: "🌲", poeng: (l) => tak(e(l).skogProsent) },
  { id: "ol", navn: "OL-medaljer", regel: "1 poeng per medalje (maks 100)", ikon: "🏅", poeng: (l) => tak(e(l).olMedaljer) },
  { id: "hdi", navn: "Utvikling", regel: "HDI × 100", ikon: "📈", poeng: (l) => tak((e(l).hdi ?? 0) * 100) },
  { id: "folk", navn: "Folketall", regel: "1 poeng per million innbyggere", ikon: "👥", poeng: (l) => tak(l.befolkning / 1e6) },
  { id: "areal", navn: "Størrelse", regel: "1 poeng per 20 000 km²", ikon: "📐", poeng: (l) => tak(l.areal / 20000) },
  { id: "kyst", navn: "Kystlinje", regel: "1 poeng per 100 km kyst", ikon: "🌊", poeng: (l) => tak(e(l).kystKm / 100) },
  { id: "fjell", navn: "Fjell", regel: "1 poeng per 50 høydemeter (høyeste punkt)", ikon: "⛰️", poeng: (l) => tak(e(l).hoyestePunktM / 50) },
  { id: "rik", navn: "Rikdom", regel: "1 poeng per 1000 dollar BNP per innbygger", ikon: "💰", poeng: (l) => tak((e(l).bnpPerInnbygger ?? 0) / 1000) },
  { id: "alder", navn: "Levealder", regel: "1 poeng per år forventet levealder", ikon: "🧓", poeng: (l) => tak(e(l).levealder ?? 0) },
  { id: "innland", navn: "Innlandsstat", regel: "100 poeng uten kyst", ikon: "🏔️", poeng: (l) => ja(e(l).innlandsstat) },
  { id: "dyr", navn: "Dyr i flagget", regel: "100 poeng hvis flagget har et dyr", ikon: "🦅", poeng: (l) => ja(e(l).flaggDyr) },
  { id: "stjerne", navn: "Stjerne i flagget", regel: "100 poeng hvis flagget har en stjerne", ikon: "⭐", poeng: (l) => ja(e(l).flaggStjerne) },
  { id: "tropene", navn: "Tropene", regel: "100 poeng hvis noe av landet ligger i tropene", ikon: "🌴", poeng: (l) => ja(e(l).tropene) },
  { id: "ild", navn: "Ildringen", regel: "100 poeng i Stillehavets ildring", ikon: "🌋", poeng: (l) => ja(e(l).ildringen) },
  { id: "monarki", navn: "Kongehus", regel: "100 poeng for monarki", ikon: "👑", poeng: (l) => ja(e(l).monarki) },
  { id: "eu", navn: "EU", regel: "100 poeng for EU-medlem", ikon: "🏛️", poeng: (l) => ja(e(l).eu) },
  { id: "nato", navn: "NATO", regel: "100 poeng for NATO-medlem", ikon: "🛡️", poeng: (l) => ja(e(l).nato) },
  { id: "venstre", navn: "Venstrekjøring", regel: "100 poeng hvis de kjører på venstre side", ikon: "🚗", poeng: (l) => ja(e(l).venstrekjoring) },
  { id: "samveldet", navn: "Samveldet", regel: "100 poeng for medlem av Samveldet", ikon: "🤴", poeng: (l) => ja(e(l).samveldet) },
  { id: "metro", navn: "T-bane", regel: "100 poeng hvis landet har T-bane", ikon: "🚇", poeng: (l) => ja(e(l).metro) },
  { id: "olvert", navn: "OL-vert", regel: "100 poeng hvis landet har arrangert OL", ikon: "🏟️", poeng: (l) => ja(e(l).harArrangertOL) },
]

export type HavetKategori = { id: string; navn: string; regel: string; ikon: string }
export type HavetOppgave = { land: string[]; kategorier: HavetKategori[]; poeng: number[][]; maks: number }

/** Best total over all ways of giving each country its own category (bitmask DP, 9 × 2⁹ states). */
function beste(poeng: number[][]) {
  const n = poeng.length
  const dp = new Array<number>(1 << n).fill(-1)
  dp[0] = 0
  for (let maske = 0; maske < 1 << n; maske++) {
    if (dp[maske] < 0) continue
    let i = 0
    for (let m = maske; m; m &= m - 1) i++
    if (i >= n) continue
    for (let k = 0; k < n; k++) {
      if (maske & (1 << k)) continue
      const ny = maske | (1 << k)
      dp[ny] = Math.max(dp[ny], dp[maske] + poeng[i][k])
    }
  }
  return dp[(1 << n) - 1]
}

const kjent = land.filter((l) => l.befolkning >= 1_500_000 && egenskaper[l.id])

/** Today's nine countries (in arrival order), nine categories and the score table. */
export function dagensHavet(dato: string): HavetOppgave {
  for (let forsok = 0; ; forsok++) {
    const binare = stokk(KATEGORIER.filter((k) => k.regel.startsWith("100")), `havet:${dato}:${forsok}:b`).slice(0, 4)
    const tall = stokk(KATEGORIER.filter((k) => !k.regel.startsWith("100")), `havet:${dato}:${forsok}:t`).slice(0, 5)
    const kategorier = stokk([...binare, ...tall], `havet:${dato}:${forsok}:rekke`)
    const valgte = stokk(kjent, `havet:${dato}:${forsok}:land`).slice(0, 9)
    const poeng = valgte.map((l) => kategorier.map((k) => k.poeng(l)))
    // Every yes/no category should be reachable by at least one country, so no card is a dead end.
    const brukbar = kategorier.every((_, k) => valgte.some((_, i) => poeng[i][k] > 0))
    if (!brukbar && forsok < 50) continue
    return {
      land: valgte.map((l) => l.id),
      kategorier: kategorier.map(({ id, navn, regel, ikon }) => ({ id, navn, regel, ikon })),
      poeng,
      maks: beste(poeng),
    }
  }
}

// Daily puzzle calendar shared by all games. Dates are ISO "YYYY-MM-DD" in Europe/Oslo.

export const START_DATO = "2026-10-01"
const DAG_MS = 86_400_000

export function iDagOslo(now = new Date()) {
  // en-CA formats as YYYY-MM-DD.
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Oslo" }).format(now)
}

export function erGyldigDato(dato: unknown): dato is string {
  if (typeof dato !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(dato)) return false
  const d = new Date(`${dato}T00:00:00Z`)
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === dato
}

/** Days since START_DATO (0 on the first day). */
export function dagNummer(dato: string) {
  return Math.round((Date.parse(`${dato}T00:00:00Z`) - Date.parse(`${START_DATO}T00:00:00Z`)) / DAG_MS)
}

export function leggTilDager(dato: string, dager: number) {
  return new Date(Date.parse(`${dato}T00:00:00Z`) + dager * DAG_MS).toISOString().slice(0, 10)
}

export function kanSpilles(dato: string, iDag = iDagOslo()) {
  return erGyldigDato(dato) && dato >= START_DATO && dato <= iDag
}

/** Picks the requested date if it is playable, otherwise today. */
export function velgDato(onsket: string | string[] | undefined, iDag = iDagOslo()) {
  return typeof onsket === "string" && kanSpilles(onsket, iDag) ? onsket : iDag
}

export function formaterDato(dato: string, stil: "lang" | "kort" = "lang") {
  return new Intl.DateTimeFormat("nb-NO", {
    timeZone: "UTC",
    ...(stil === "lang"
      ? { weekday: "long", day: "numeric", month: "long" }
      : { day: "numeric", month: "short" }),
  }).format(new Date(`${dato}T00:00:00Z`))
}

function hash(tekst: string) {
  let h = 2166136261
  for (let i = 0; i < tekst.length; i++) {
    h ^= tekst.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

/** Deterministic PRNG (mulberry32) seeded from a string. */
export function tilfeldig(frø: string) {
  let a = hash(frø)
  return () => {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function stokk<T>(liste: readonly T[], frø: string) {
  const r = tilfeldig(frø)
  const ut = [...liste]
  for (let i = ut.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1))
    ;[ut[i], ut[j]] = [ut[j], ut[i]]
  }
  return ut
}

/**
 * The n-th element of an endless sequence made of back-to-back shuffles of `liste`.
 * Every element appears once per round before anything repeats.
 */
export function iRotasjon<T>(liste: readonly T[], n: number, salt: string) {
  const runde = Math.floor(n / liste.length)
  return stokk(liste, `${salt}:${runde}`)[n % liste.length]
}

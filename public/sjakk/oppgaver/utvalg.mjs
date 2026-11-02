// Which puzzle to show: rating bands, difficulty offsets and the daily puzzle.
// Data rows are [id, fen, moves, rating, rd, themes] as written by scripts/sjakk-oppgaver/bygg.mjs.

export const BAND_MIN = 400;
export const BAND_MAX = 2900;
export const bandFor = rating => Math.min(BAND_MAX, Math.max(BAND_MIN, Math.floor(rating / 100) * 100));

export const VANSKELIGHET = [
  { id: 'enklest', navn: 'Enklest', avvik: -600 },
  { id: 'enklere', navn: 'Enklere', avvik: -300 },
  { id: 'normal', navn: 'Normal', avvik: 0 },
  { id: 'vanskeligere', navn: 'Vanskeligere', avvik: 300 },
  { id: 'vanskeligst', navn: 'Vanskeligst', avvik: 600 },
];

export function malRating(rating, vanskelighet) {
  const avvik = VANSKELIGHET.find(v => v.id === vanskelighet)?.avvik ?? 0;
  return Math.min(BAND_MAX + 99, Math.max(BAND_MIN, Math.round(rating + avvik)));
}

export function lesRad([id, fen, moves, rating, rd, themes]) {
  return { id, fen, moves: moves.split(' '), rating, rd, themes: themes ? themes.split(' ') : [] };
}

/** The bands to load for a target rating, nearest first. */
export function bandNaer(mal, antall = 2) {
  const alle = Array.from({ length: (BAND_MAX - BAND_MIN) / 100 + 1 }, (_, i) => BAND_MIN + i * 100);
  return alle.sort((a, b) => Math.abs(a + 50 - mal) - Math.abs(b + 50 - mal) || a - b).slice(0, antall);
}

/** A random unseen puzzle close to the target, widening the window until something fits. */
export function velgOppgave(rader, mal, { sett = new Set(), tema = '', tilfeldig = Math.random } = {}) {
  const aktuelle = rader.filter(r => !sett.has(r[0]) && (!tema || ` ${r[5]} `.includes(` ${tema} `)));
  for (const vindu of [40, 80, 150, 300, 600, 3000]) {
    const nar = aktuelle.filter(r => Math.abs(r[3] - mal) <= vindu);
    if (nar.length) return lesRad(nar[Math.floor(tilfeldig() * nar.length)]);
  }
  return null;
}

// ---- Daily puzzle: the same puzzle for everyone at the same level on the same Oslo date ----

export const DAG_START = '2026-11-01';
export const NIVA_MIN = 500;
export const NIVA_MAX = 2900;

/** Levels are 200 points wide and centred on 500, 700, … 2900. */
export const nivaFor = rating => Math.min(NIVA_MAX, Math.max(NIVA_MIN, NIVA_MIN + 200 * Math.round((rating - NIVA_MIN) / 200)));
export const bandForNiva = niva => [niva - 100, niva].map(bandFor).filter((b, i, a) => a.indexOf(b) === i);

export function iDagOslo(now = new Date()) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Oslo' }).format(now);
}

export const dagNummer = dato => Math.round((Date.parse(`${dato}T00:00:00Z`) - Date.parse(`${DAG_START}T00:00:00Z`)) / 86_400_000);
export const leggTilDager = (dato, dager) => new Date(Date.parse(`${dato}T00:00:00Z`) + dager * 86_400_000).toISOString().slice(0, 10);

export function kortDato(dato) {
  return new Intl.DateTimeFormat('nb-NO', { timeZone: 'UTC', day: 'numeric', month: 'short' }).format(new Date(`${dato}T00:00:00Z`)).replace(/\.$/, '');
}

function hash(tekst) {
  let h = 2166136261;
  for (let i = 0; i < tekst.length; i++) { h ^= tekst.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}

/** Deterministic PRNG (mulberry32) seeded from a string, as in the daily games. */
export function tilfeldig(fro) {
  let a = hash(fro);
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function stokk(liste, fro) {
  const r = tilfeldig(fro);
  const ut = [...liste];
  for (let i = ut.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [ut[i], ut[j]] = [ut[j], ut[i]]; }
  return ut;
}

/**
 * The daily puzzle for a level. Candidates are the level's puzzles with at least two
 * moves for the solver, ordered by id so the result does not depend on file order.
 * Back-to-back shuffles mean no puzzle repeats before the whole list has been used.
 */
export function dagensOppgave(dato, niva, rader) {
  const [lav, hoy] = [niva - 100, niva + 100];
  const iNiva = rader.filter(r => (r[3] >= lav || niva === NIVA_MIN) && (r[3] < hoy || niva === NIVA_MAX));
  const lange = iNiva.filter(r => r[2].split(' ').length >= 4);
  const kandidater = (lange.length >= 50 ? lange : iNiva).map(r => r[0]).sort();
  if (!kandidater.length) return null;
  const n = Math.max(0, dagNummer(dato));
  const runde = Math.floor(n / kandidater.length);
  const id = stokk(kandidater, `sjakk-dag:${niva}:${runde}`)[n % kandidater.length];
  return lesRad(rader.find(r => r[0] === id));
}

/** Days in a row with the daily puzzle solved, counting today only once it is solved. */
export function dagRekke(dagens, iDag) {
  let dato = dagens[iDag]?.status === 'løst' ? iDag : leggTilDager(iDag, -1);
  let rekke = 0;
  while (dagens[dato]?.status === 'løst') { rekke++; dato = leggTilDager(dato, -1); }
  return rekke;
}

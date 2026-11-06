// The player's puzzle state in localStorage, versioned so later formats can migrate.
import { START, etterPause, oppdater } from './glicko.mjs';
import { VANSKELIGHET } from './utvalg.mjs';

export const NOKKEL = 'sjakk-oppgaver-v1';
const MAKS_SETT = 8000;
const MAKS_HISTORIKK = 300;
export const PLASSERING = 3;

export function nyTilstand() {
  return {
    versjon: 1,
    spiller: { ...START, sist: null },
    historikk: [],
    antall: 0,
    losteAntall: 0,
    rekke: 0,
    besteRekke: 0,
    sett: [],
    vanskelighet: 'normal',
    tema: '',
    aktiv: null,
    dagens: {},
    lynlop: { beste: 0, spilt: 0, besteDato: null },
  };
}

const tall = (v, lav, hoy, standard) => (Number.isFinite(v) && v >= lav && v <= hoy ? v : standard);
const objekt = v => (v && typeof v === 'object' && !Array.isArray(v) ? v : {});

/** Reads and sanitizes saved state; anything unexpected falls back to defaults. */
export function les(lager = globalThis.localStorage) {
  const t = nyTilstand();
  let lagret;
  try { lagret = JSON.parse(lager?.getItem(NOKKEL) ?? 'null'); } catch { lagret = null; }
  if (!lagret || lagret.versjon !== 1) return t;
  const s = objekt(lagret.spiller);
  t.spiller = { rating: tall(s.rating, 0, 4000, START.rating), rd: tall(s.rd, 1, 500, START.rd), vol: tall(s.vol, 0.001, 1, START.vol), sist: tall(s.sist, 0, 1e14, null) };
  t.historikk = (Array.isArray(lagret.historikk) ? lagret.historikk : []).filter(h => Number.isFinite(h?.r) && Number.isFinite(h?.t)).slice(-MAKS_HISTORIKK);
  for (const k of ['antall', 'losteAntall', 'rekke', 'besteRekke']) t[k] = tall(lagret[k], 0, 1e9, 0);
  t.sett = (Array.isArray(lagret.sett) ? lagret.sett : []).filter(id => typeof id === 'string').slice(-MAKS_SETT);
  if (VANSKELIGHET.some(v => v.id === lagret.vanskelighet)) t.vanskelighet = lagret.vanskelighet;
  if (typeof lagret.tema === 'string') t.tema = lagret.tema;
  if (typeof lagret.aktiv?.id === 'string' && Number.isFinite(lagret.aktiv?.band)) t.aktiv = { id: lagret.aktiv.id, band: lagret.aktiv.band };
  for (const [dato, d] of Object.entries(objekt(lagret.dagens))) {
    if (/^\d{4}-\d{2}-\d{2}$/.test(dato) && typeof d?.id === 'string' && Number.isFinite(d?.niva)) {
      t.dagens[dato] = { id: d.id, niva: d.niva, forsok: tall(d.forsok, 0, 999, 0), hint: Boolean(d.hint), status: ['åpen', 'løst', 'feilet'].includes(d.status) ? d.status : 'åpen' };
    }
  }
  const l = objekt(lagret.lynlop);
  t.lynlop = { beste: tall(l.beste, 0, 9999, 0), spilt: tall(l.spilt, 0, 1e9, 0), besteDato: typeof l.besteDato === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(l.besteDato) ? l.besteDato : null };
  return t;
}

export function lagre(t, lager = globalThis.localStorage) {
  try { lager?.setItem(NOKKEL, JSON.stringify(t)); } catch { /* The tab keeps working without storage. */ }
}

/** How the daily puzzle went, in words. */
export function resultatTekst(d) {
  if (d.status === 'feilet') return 'ikke løst';
  if (d.status !== 'løst') return 'ikke ferdig';
  return `løst på ${d.forsok <= 1 ? 'første' : `${d.forsok}.`} forsøk${d.hint ? ' med hint' : ''}`;
}

export function markerSett(t, id) {
  if (t.sett.includes(id)) return;
  t.sett.push(id);
  if (t.sett.length > MAKS_SETT) t.sett.splice(0, t.sett.length - MAKS_SETT);
}

/**
 * Records a rated attempt. A hint halves the rating gain of a solved puzzle;
 * a failure counts in full either way.
 */
export function registrer(t, oppgave, { lost, hint = false }, naa = Date.now()) {
  const dager = t.spiller.sist ? (naa - t.spiller.sist) / 86_400_000 : 0;
  const for_ = etterPause(t.spiller, dager);
  const ny = oppdater(for_, oppgave, lost ? 1 : 0);
  if (lost && hint) ny.rating = for_.rating + (ny.rating - for_.rating) / 2;
  const endring = Math.round(ny.rating) - Math.round(t.spiller.rating);
  t.spiller = { ...ny, sist: naa };
  t.antall++;
  if (lost) { t.losteAntall++; t.rekke++; t.besteRekke = Math.max(t.besteRekke, t.rekke); } else t.rekke = 0;
  t.historikk.push({ t: naa, r: Math.round(ny.rating) });
  if (t.historikk.length > MAKS_HISTORIKK) t.historikk.splice(0, t.historikk.length - MAKS_HISTORIKK);
  markerSett(t, oppgave.id);
  return endring;
}

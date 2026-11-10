// Courses ("gjennomganger"): a guided walkthrough of one opening, read and checked here (format: scripts/sjakk-apninger/KURS.md).
// Pure functions shared by the browser, the tests and the scripts. The player lives in gjennomgang.mjs.
import { Chess } from '../vendor/chess.mjs';
import { deltSti, spill, stilling, trekkNummer } from './modell.mjs';
import { egneTrekk } from './repertoar.mjs';
import { norsk } from './trener.mjs';

export const KURS_SCHEMA = 1;
const ID = /^[a-z0-9-]+$/;
const PIL = /^[a-h][1-8][a-h][1-8]$/;
const FELT = /^[a-h][1-8]$/;
const tekst = verdi => typeof verdi === 'string' && verdi.trim().length > 0;
const START = new Chess().fen();

const KJENTE = {
  kurs: ['schema', 'apning', 'tittel', 'minutter', 'kapitler', 'huskeregler'],
  kapittel: ['id', 'tittel', 'start', 'steg', 'alternativ'],
  steg: ['trekk', 'fra', 'tekst', 'piler', 'fare', 'felt', 'sporsmal', 'alternativ'],
  trekk: ['type', 'svar', 'hint', 'forklaring'],
  valg: ['type', 'valg', 'riktig', 'forklaring'],
};
const ukjente = (objekt, kjente) => Object.keys(objekt ?? {}).filter(nokkel => !kjente.includes(nokkel));

// A text this long is no longer one idea per step.
export const MAKS_TEKST = 420;
// A jump to another line plays at most this many half-moves; the rest of the way is set at once.
const MAKS_INNSPILL = 8;

// Moves from a position, as { fen, san, sist } after each of them. Throws like spill() on an illegal move.
function spillFra(fra, sans) {
  const { chess, trekk } = spill(sans, fra.fen);
  return { fen: chess.fen(), san: [...fra.san, ...trekk.map(m => m.san)], sist: trekk.length ? { from: trekk.at(-1).from, to: trekk.at(-1).to } : fra.sist, trekk };
}

const stillingFra = sans => { const ut = spillFra({ fen: START, san: [], sist: null }, sans); delete ut.trekk; return ut; };

// The common start of two lines.
function felles(a, b) {
  let i = 0;
  while (i < a.length && i < b.length && a[i] === b[i]) i += 1;
  return i;
}

// "e2e4" strings become arrow objects, as in the trees.
const pilerFra = (liste, type) => (liste ?? []).map(s => ({ fra: s.slice(0, 2), til: s.slice(2, 4), type }));

// Reads and checks a course. kurs is null only when nothing can be shown; a chapter with an error is left out.
// apning (the parsed opening) adds the check against the tree; finnes(id) says whether an opening id exists.
export function lesKurs(data, { apning = null, finnes = null } = {}) {
  const feil = [];
  const advarsler = [];
  const navn = data?.apning ?? '?';
  const f = melding => feil.push(`kurs ${navn}: ${melding}`);
  const a = melding => { const linje = `kurs ${navn}: ${melding}`; if (!advarsler.includes(linje)) advarsler.push(linje); };
  if (!data || typeof data !== 'object' || Array.isArray(data)) return { kurs: null, feil: ['kurs: ugyldig fil'], advarsler };
  if (data.schema !== KURS_SCHEMA) f(`schema må være ${KURS_SCHEMA}`);
  if (!ID.test(data.apning ?? '')) f('apning må være id-en til en åpning');
  else if (finnes && !finnes(data.apning)) f(`åpningen ${data.apning} finnes ikke`);
  if (apning && data.apning !== apning.id) f(`kurset hører til ${data.apning}, ikke ${apning.id}`);
  if (!tekst(data.tittel)) f('mangler tittel');
  if (!Number.isInteger(data.minutter) || data.minutter < 1) f('minutter må være et helt tall over 0');
  for (const nokkel of ukjente(data, KJENTE.kurs)) a(`ukjent felt «${nokkel}»`);
  if (!Array.isArray(data.huskeregler) || !data.huskeregler.every(tekst)) f('huskeregler må være en liste med tekst');
  else if (data.huskeregler.length < 4 || data.huskeregler.length > 6) a(`huskeregler bør være 4–6, ikke ${data.huskeregler.length}`);
  if (!Array.isArray(data.kapitler) || !data.kapitler.length) { f('kapitler mangler'); return { kurs: null, feil, advarsler }; }

  const egne = apning ? egneTrekk(apning) : null;
  // Our move in a position from the tree, where the course plays something else.
  const sjekkTrekk = (fra, trekk, hvor, alternativ) => {
    if (!egne || alternativ) return;
    let fen = fra;
    for (const m of trekk) {
      const node = egne.get(stilling(fen));
      if (m.color === apning.farge && node && node.san !== m.san) a(`${hvor}: viser ${m.san} der treet spiller ${node.san} (${trekkNummer(fen)}). Skriv at det er et alternativ og sett "alternativ": true, eller bruk repertoartrekket`);
      fen = m.after;
    }
  };

  const ider = new Set();
  const kapitler = [];
  for (const [k, kapittel] of data.kapitler.entries()) {
    const hvor = `kapitler[${k}]${kapittel?.id ? ` «${kapittel.id}»` : ''}`;
    const antallFor = feil.length;
    const kf = melding => f(`${hvor}: ${melding}`);
    if (!kapittel || typeof kapittel !== 'object') { kf('ugyldig kapittel'); continue; }
    if (!ID.test(kapittel.id ?? '')) kf('id må være små bokstaver, tall og bindestrek');
    else if (ider.has(kapittel.id)) kf('id-en er brukt før');
    ider.add(kapittel.id);
    if (!tekst(kapittel.tittel)) kf('mangler tittel');
    for (const nokkel of ukjente(kapittel, KJENTE.kapittel)) a(`${hvor}: ukjent felt «${nokkel}»`);
    if (typeof kapittel.start !== 'string') { kf('start må være SAN fra utgangsstillingen (tom tekst for utgangsstillingen)'); continue; }
    let start;
    try {
      start = stillingFra(deltSti(kapittel.start));
      sjekkTrekk(START, spill(deltSti(kapittel.start)).trekk, `${hvor} start`, kapittel.alternativ === true);
    } catch (error) { kf(`start: ${error.message}`); continue; }
    if (!Array.isArray(kapittel.steg) || !kapittel.steg.length) { kf('steg mangler'); continue; }

    let her = start;
    const steg = [];
    for (const [s, rad] of kapittel.steg.entries()) {
      const sted = `${hvor} steg[${s}]`;
      const sf = melding => f(`${sted}: ${melding}`);
      if (!rad || typeof rad !== 'object') { sf('ugyldig steg'); break; }
      const alternativ = rad.alternativ === true || kapittel.alternativ === true;
      for (const nokkel of ukjente(rad, KJENTE.steg)) a(`${sted}: ukjent felt «${nokkel}»`);
      if (!tekst(rad.tekst)) sf('mangler tekst');
      else if (rad.tekst.length > MAKS_TEKST) a(`${sted}: teksten er ${rad.tekst.length} tegn – en idé per steg, helst under ${MAKS_TEKST}`);
      if (rad.trekk !== undefined && rad.fra !== undefined) { sf('et steg kan ha trekk eller fra, ikke begge'); break; }
      for (const pil of [...(rad.piler ?? []), ...(rad.fare ?? [])]) if (!PIL.test(pil)) sf(`ugyldig pil «${pil}»`);
      for (const felt of rad.felt ?? []) if (!FELT.test(felt)) sf(`ugyldig felt «${felt}»`);
      for (const liste of ['piler', 'fare', 'felt']) if (rad[liste] !== undefined && !Array.isArray(rad[liste])) sf(`${liste} må være en liste`);

      // What the player sees: the position before the step, the moves played in, and the position they lead to.
      let foer = her;
      let trekk = [];
      try {
        if (rad.fra !== undefined) {
          if (typeof rad.fra !== 'string') throw new Error('fra må være SAN fra utgangsstillingen');
          const linje = deltSti(rad.fra);
          sjekkTrekk(START, spill(linje).trekk, sted, alternativ);
          // A line that branches off late is played in from where it branches, so the player sees where it goes.
          const delt = Math.max(felles(her.san, linje), linje.length - MAKS_INNSPILL);
          foer = stillingFra(linje.slice(0, delt));
          trekk = spillFra(foer, linje.slice(delt)).trekk;
        } else if (rad.trekk !== undefined) {
          if (typeof rad.trekk !== 'string' || !deltSti(rad.trekk).length) throw new Error('trekk må være SAN');
          trekk = spillFra(her, deltSti(rad.trekk)).trekk;
          sjekkTrekk(her.fen, trekk, sted, alternativ);
        }
      } catch (error) { sf(`${rad.fra !== undefined ? 'fra' : 'trekk'}: ${error.message}`); break; }
      const vist = trekk.length ? spillFra(foer, trekk.map(m => m.san)) : foer;
      delete vist.trekk;
      let etter = vist;

      let sporsmal = null;
      const q = rad.sporsmal;
      if (q !== undefined) {
        if (!q || typeof q !== 'object') sf('sporsmal er ugyldig');
        else if (q.type === 'trekk') {
          for (const nokkel of ukjente(q, KJENTE.trekk)) a(`${sted}: ukjent felt i sporsmal «${nokkel}»`);
          if (!Array.isArray(q.svar) || !q.svar.length) sf('sporsmal.svar må være en liste med trekk');
          else {
            try {
              const svar = q.svar.map(san => spill([san], vist.fen).trekk[0]);
              if (new Set(svar.map(m => m.san)).size !== svar.length) sf('sporsmal.svar har samme trekk to ganger');
              const node = egne?.get(stilling(vist.fen));
              if (node && apning.farge === new Chess(vist.fen).turn() && !alternativ) {
                if (svar[0].san !== node.san) a(`${sted}: svaret er ${svar[0].san}, men treet spiller ${node.san} her. Repertoartrekket bør være det første svaret`);
              }
              etter = spillFra(vist, [svar[0].san]);
              delete etter.trekk;
              sporsmal = { type: 'trekk', svar: svar.map(m => m.san), riktig: svar[0], hint: tekst(q.hint) ? q.hint : null, forklaring: q.forklaring };
            } catch (error) { sf(`sporsmal.svar: ${error.message}`); }
          }
          if (q.hint !== undefined && !tekst(q.hint)) sf('sporsmal.hint må være tekst');
          if (!tekst(q.forklaring)) sf('sporsmal.forklaring mangler');
        } else if (q.type === 'valg') {
          for (const nokkel of ukjente(q, KJENTE.valg)) a(`${sted}: ukjent felt i sporsmal «${nokkel}»`);
          if (!Array.isArray(q.valg) || q.valg.length < 2 || q.valg.length > 5 || !q.valg.every(tekst)) sf('sporsmal.valg må være 2–5 tekster');
          else if (!Number.isInteger(q.riktig) || q.riktig < 0 || q.riktig >= q.valg.length) sf('sporsmal.riktig må peke på et av valgene (fra 0)');
          if (!tekst(q.forklaring)) sf('sporsmal.forklaring mangler');
          sporsmal = { type: 'valg', valg: q.valg, riktig: q.riktig, forklaring: q.forklaring };
        } else sf('sporsmal.type må være trekk eller valg');
      }

      steg.push({ i: s, tekst: rad.tekst, foer, trekk, vist, etter, piler: [...pilerFra(rad.piler, 'plan'), ...pilerFra(rad.fare, 'fare')], felt: rad.felt ?? [], sporsmal, alternativ });
      her = etter;
    }
    if (feil.length === antallFor) kapitler.push({ id: kapittel.id, tittel: kapittel.tittel, start, steg });
  }

  if (!kapitler.length) return { kurs: null, feil, advarsler };
  const kurs = { apning: data.apning, tittel: data.tittel, minutter: data.minutter, huskeregler: Array.isArray(data.huskeregler) ? data.huskeregler.filter(tekst) : [], kapitler };
  const anslag = Math.round(kursTid(kurs) / 60000);
  if (Number.isInteger(data.minutter) && (data.minutter > anslag * 2.5 + 2 || data.minutter * 2.5 + 2 < anslag)) a(`minutter er ${data.minutter}, men stegene tar omtrent ${anslag} minutter å se`);
  return { kurs, feil, advarsler };
}

// ---------- Timing ----------
// A move takes this long to play in, at normal speed.
export const TREKK_MS = 800;
const TREKK_MIN = 420;

// How long a text stays before the next step: about 170 words a minute, never faster than a quick reader.
export function lesetid(tekst, fart = 1) {
  const ord = String(tekst ?? '').trim().split(/\s+/).filter(Boolean).length;
  const vanlig = 1600 + ord * 350;
  const gulv = 1200 + ord * 230;
  return Math.round(Math.max(3000, gulv, vanlig / fart));
}
export const trekkTid = (fart = 1) => Math.round(Math.max(TREKK_MIN, TREKK_MS / fart));

// The whole step: the moves first, then the text has its time.
export const stegTid = (steg, fart = 1) => steg.trekk.length * trekkTid(fart) + lesetid(steg.tekst, fart) + (steg.sporsmal ? lesetid(steg.sporsmal.forklaring, fart) + 6000 : 0);
export const kursTid = (kurs, fart = 1) => kurs.kapitler.reduce((sum, kapittel) => sum + kapittel.steg.reduce((s, steg) => s + stegTid(steg, fart), 1500), 0);

// "1.e4 c5 2.d4" from a list of SAN from the initial position, with Norwegian letters.
export const linjeTekst = sans => sans.map((san, i) => (i % 2 ? '' : `${i / 2 + 1}.`) + norsk(san)).join(' ');
// The moves of a step, numbered from where they start, for the screen reader.
export function trekkTekst(steg) {
  const chess = new Chess(steg.foer.fen);
  return steg.trekk.map((m, i) => { const nr = trekkNummer(chess.fen()); chess.move(m.san); return (m.color === 'w' || i === 0 ? nr : '') + norsk(m.san); }).join(' ');
}

// ---------- Progress ----------
// fremgang.kurs[apningId] = { kapitler: { [kapittelId]: tid }, ferdig?, tilbudt?, sted?: { kapittel, steg, sist }, sist }
export const kursPost = (fremgang, apningId) => fremgang.kurs?.[apningId] ?? null;
function post(fremgang, apningId, naa) {
  const ut = ((fremgang.kurs ??= {})[apningId] ??= { kapitler: {}, sist: naa });
  ut.kapitler ??= {};
  ut.sist = Math.max(ut.sist ?? 0, naa);
  return ut;
}
export function merkKapittel(fremgang, apningId, kapittelId, naa = Date.now()) { const p = post(fremgang, apningId, naa); p.kapitler[kapittelId] ??= naa; }
export function merkFerdig(fremgang, apningId, naa = Date.now()) { const p = post(fremgang, apningId, naa); p.ferdig ??= naa; }
export function merkTilbudt(fremgang, apningId, naa = Date.now()) { const p = post(fremgang, apningId, naa); p.tilbudt ??= naa; }
export function merkSted(fremgang, apningId, kapittel, steg, naa = Date.now()) { const p = post(fremgang, apningId, naa); p.sted = { kapittel, steg, sist: naa }; }

// How far the player has come: chapters seen, the first one not seen, and where they left off.
export function kursStatus(kurs, fremgang) {
  const p = kursPost(fremgang, kurs.apning);
  const sett = kurs.kapitler.filter(k => p?.kapitler?.[k.id]).length;
  const forsteUsett = kurs.kapitler.findIndex(k => !p?.kapitler?.[k.id]);
  const stedK = p?.sted ? kurs.kapitler.findIndex(k => k.id === p.sted.kapittel) : -1;
  // The place left off counts while its chapter is unfinished; after that the next chapter not seen is where to go on.
  const sted = stedK >= 0 && !p.ferdig && !p.kapitler?.[p.sted.kapittel] ? { kapittel: stedK, steg: Math.min(Math.max(0, p.sted.steg | 0), kurs.kapitler[stedK].steg.length - 1) } : { kapittel: Math.max(0, forsteUsett), steg: 0 };
  return { sett, antall: kurs.kapitler.length, ferdig: Boolean(p?.ferdig), startet: Boolean(p && (sett || p.sted)), tilbudt: Boolean(p?.tilbudt), sted };
}

// Offered once in the daily session: before the first chapter is seen, and only if it was never offered.
export const kursTilbys = (kurs, fremgang) => { const s = kursStatus(kurs, fremgang); return !s.startet && !s.ferdig && !s.tilbudt; };

export function kursMerke(kurs, fremgang) {
  const s = kursStatus(kurs, fremgang);
  if (s.ferdig) return 'Sett';
  if (s.sett) return `${s.sett} av ${s.antall} kapitler`;
  return `${kurs.minutter} min`;
}

// ---------- Loading ----------
// Courses are fetched when a page needs one. With a list of ids (manifest.kurs) nothing else is asked for.
export function lagKursLager({ adresse = id => `/sjakk/apninger/data/kurs/${id}.json`, hent = (...args) => fetch(...args), apning = () => null, liste = () => null, logg = console } = {}) {
  const lofter = new Map();
  const ferdig = new Map();
  async function last(id) {
    const kjente = liste();
    if (Array.isArray(kjente) && !kjente.includes(id)) return null;
    try {
      const svar = await hent(adresse(id));
      if (!svar.ok) return null;
      const { kurs, feil } = lesKurs(await svar.json(), { apning: apning(id) });
      if (feil.length) logg.warn?.(`Gjennomgangen for ${id} har feil:`, feil);
      return kurs?.apning === id ? kurs : null;
    } catch {
      return null;
    }
  }
  const lager = {
    // undefined while not yet known, then the course or null.
    kjent: id => (ferdig.has(id) ? ferdig.get(id) : undefined),
    hent(id) {
      if (!lofter.has(id)) lofter.set(id, last(id).then(kurs => { ferdig.set(id, kurs); return kurs; }));
      return lofter.get(id);
    },
    sjekk: ids => Promise.all([...new Set(ids)].map(lager.hent)),
    alleKjent: ids => ids.every(id => ferdig.has(id)),
  };
  return lager;
}

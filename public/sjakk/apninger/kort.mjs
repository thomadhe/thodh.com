// Flashcards: one position and the repertoire move, Leitner per position. Pure functions; progress is passed in.
import { Chess } from '../vendor/chess.mjs';
import { deltSti, stilling, veiTil } from './modell.mjs';
import { mestVanlig, startNoder, veiVekt } from './repertoar.mjs';
import { INTERVALL_DAGER } from './repetisjon.mjs';
import { norsk } from './trener.mjs';
import { flertall } from './ui.mjs';

export const OKT_STORRELSE = 12;
export const NYE_PER_DAG = 6;
export const FRITT = 'fri';
export const NYE_VALG = [6, 10, 15, 25, 40, FRITT];
// One session holds this many new cards; the rest of the day's cards are one tap away afterwards.
export const NYE_I_OKT = 15;
export const OVELSE_STORRELSE = 30;
// Up to this pace the queue protects the player after a long absence. Above it the player has said what they want.
const ROLIG_TEMPO = 15;
export const MAKS_FORFALT = 30;
const HOPP_EGNE_TREKK = 2;
const GJENTA_ETTER = 3;
const DAG = 86400000;
// New cards are taught a few at a time, and each batch is tested before the next one starts.
const BLOKK = 3;
// A line is followed until it is less than half as likely as the best one still waiting.
const HOLD_TRADEN = 0.5;

export const valgtTempo = fremgang => (NYE_VALG.includes(fremgang.tempo?.nye) ? fremgang.tempo.nye : NYE_PER_DAG);
export const nyePerDag = fremgang => { const tempo = valgtTempo(fremgang); return tempo === FRITT ? Infinity : tempo; };
export function settTempo(fremgang, nye, naa = Date.now()) { fremgang.tempo = { nye, sist: naa }; }

export const kortId = (fen, farge) => `${stilling(fen)}|${farge}`;
const trekkTall = fen => Number(fen.split(' ')[5]);
const tvunget = fen => new Chess(fen).moves().length === 1;

// The name of the line so far. Only earlier moves count, since a name on the answer would give it away.
function linjeNavn(node) {
  for (let n = node.forelder; n?.sti; n = n.forelder) if (n.entry.navn) return n.entry.navn;
  for (let n = node.forelder; n?.sti; n = n.forelder) if (!n.rep && n.forelder.barn.length > 1) return `${n.nummer}${norsk(n.san)}`;
  return 'Hovedlinjen';
}

// Cards for the chosen openings. The key ignores the move order, so transpositions merge by themselves;
// openings that disagree in a position become one card that accepts either move.
export function lagKort(apninger) {
  const kort = new Map();
  const legg = (fen, farge, kilde) => {
    const id = kortId(fen, farge);
    if (!kort.has(id)) kort.set(id, { id, farge, fen, kilder: [] });
    kort.get(id).kilder.push(kilde);
  };
  for (const apning of apninger) {
    // Our moves inside `start` have no tree node, but another chosen opening can branch off right there.
    const spilt = [];
    let forrige = new Chess().fen();
    for (const node of startNoder(apning)) {
      if (node.rep && trekkTall(forrige) > HOPP_EGNE_TREKK && !tvunget(forrige)) legg(forrige, apning.farge, { apning, innledning: true, san: node.san, fra: node.fra, til: node.til, linje: 'Veien inn', sti: '', forTrekk: [...spilt] });
      spilt.push(node.san);
      forrige = node.fen;
    }
    for (const node of apning.noder.values()) {
      if (!node.rep) continue;
      const { fen } = node.forelder;
      if (trekkTall(fen) <= HOPP_EGNE_TREKK || tvunget(fen)) continue;
      legg(fen, apning.farge, { apning, node, san: node.san, fra: node.fra, til: node.til, linje: linjeNavn(node), sti: node.forelder.sti, forTrekk: [...apning.startTrekk, ...veiTil(node.forelder).map(n => n.san)] });
    }
    for (const felle of apning.feller) {
      if (felle.side !== apning.farge || tvunget(felle.fen)) continue;
      const felles = { apning, felle, linje: felle.navn, sti: deltSti(felle.sti).join(' '), forTrekk: [...apning.startTrekk, ...felle.forTrekk.map(m => m.san)] };
      const [forste] = felle.losning;
      legg(felle.fen, felle.side, { ...felles, san: forste.san, fra: forste.from, til: forste.to });
      for (const san of felle.godta ?? []) {
        const trekk = new Chess(felle.fen).move(san);
        legg(felle.fen, felle.side, { ...felles, san: trekk.san, fra: trekk.from, til: trekk.to, godtatt: true });
      }
    }
  }
  return [...kort.values()].map(k => ({ ...k, trekk: [...new Set(k.kilder.map(kilde => kilde.san))], vekt: Math.max(...k.kilder.map(kilde => veiVekt(kilde.apning, kilde.forTrekk))) }));
}

// Midnight local time, so a card due tomorrow is there in the morning however late today's session was.
export function dagStart(tid, dager = 0) {
  const dato = new Date(tid);
  dato.setHours(0, 0, 0, 0);
  dato.setDate(dato.getDate() + dager);
  return dato.getTime();
}

// utfall: 'riktig' moves up a box, 'hint' stays in the box, 'feil' goes to box 1 (not 0: it comes back tomorrow).
export function vurderKort(fremgang, id, utfall, naa = Date.now()) {
  const forrige = fremgang.kort[id];
  const boks = utfall === 'feil' ? 1 : utfall === 'hint' ? forrige?.boks ?? 0 : Math.min(INTERVALL_DAGER.length - 1, (forrige?.boks ?? 0) + 1);
  const post = { boks, forfall: dagStart(naa, INTERVALL_DAGER[boks]), sist: naa, forst: forrige?.forst ?? naa, riktige: (forrige?.riktige ?? 0) + (utfall === 'riktig' ? 1 : 0), feil: (forrige?.feil ?? 0) + (utfall === 'feil' ? 1 : 0) };
  fremgang.kort[id] = post;
  return post;
}

const forsinkelse = (post, naa) => (naa - post.forfall) / (Math.max(1, INTERVALL_DAGER[post.boks]) * DAG);

// The likeliest position first, then on down its likeliest line, so the moves read as a story.
// Main lines against the most common replies come first, and side lines last.
export function nyeIRekkefolge(ukjente) {
  const paNode = new Map(ukjente.flatMap(kort => kort.kilder.filter(kilde => kilde.node).map(kilde => [kilde.node, kort])));
  const sortert = [...ukjente].sort((a, b) => (b.vekt ?? 0) - (a.vekt ?? 0) || trekkTall(a.fen) - trekkTall(b.fen));
  const brukt = new Set();
  const ut = [];
  const ta = kort => { brukt.add(kort); ut.push(kort); };
  let forste = 0;
  for (const start of sortert) {
    if (brukt.has(start)) continue;
    ta(start);
    let node = start.kilder.find(kilde => kilde.node)?.node;
    while (node?.barn.length) {
      node = mestVanlig(node);
      const kort = paNode.get(node);
      if (!kort || brukt.has(kort)) continue;
      while (brukt.has(sortert[forste])) forste += 1;
      if ((kort.vekt ?? 0) < (sortert[forste].vekt ?? 0) * HOLD_TRADEN) break;
      ta(kort);
    }
  }
  return ut;
}

// What is ready now. After a long absence the most overdue cards come first and only the cap shows;
// new cards wait until the queue is below the cap. ekstra is how many times the player asked for more.
export function kortKo(kort, fremgang, naa = Date.now(), ekstra = 0) {
  const idag = dagStart(naa);
  let gjortIDag = 0, nyeIDag = 0;
  for (const post of Object.values(fremgang.kort)) {
    if (post.forst >= idag) nyeIDag += 1;
    else if (post.sist >= idag) gjortIDag += 1;
  }
  const forfalte = kort.filter(k => fremgang.kort[k.id]?.forfall <= naa).sort((a, b) => forsinkelse(fremgang.kort[b.id], naa) - forsinkelse(fremgang.kort[a.id], naa) || fremgang.kort[a.id].boks - fremgang.kort[b.id].boks);
  const ukjente = kort.filter(k => !fremgang.kort[k.id]);
  const perDag = nyePerDag(fremgang);
  const rolig = perDag <= ROLIG_TEMPO;
  const pause = rolig && forfalte.length >= MAKS_FORFALT;
  const rom = rolig ? Math.max(0, MAKS_FORFALT * (1 + ekstra) - gjortIDag) : Infinity;
  const nyeRom = pause ? 0 : Math.max(0, perDag * (1 + ekstra) - nyeIDag);
  const klare = forfalte.slice(0, rom);
  const nye = nyeIRekkefolge(ukjente).slice(0, nyeRom);
  return { kort: [...klare, ...nye], klare, nyeKort: nye, forfalte: klare.length, nye: nye.length, pause, flere: forfalte.length > klare.length || (!pause && ukjente.length > nye.length) };
}

// The smallest "Ta flere" count that really gives cards: what was done earlier today can use up the next steps.
export function nesteEkstra(kort, fremgang, naa = Date.now(), ekstra = 0) {
  const grense = ekstra + Object.keys(fremgang.kort).length + 1;
  let neste = ekstra + 1;
  while (neste < grense && !kortKo(kort, fremgang, naa, neste).kort.length) neste += 1;
  return neste;
}

export function forfallerIMorgen(kort, fremgang, naa = Date.now()) {
  const grense = dagStart(naa, 2);
  return kort.filter(k => { const post = fremgang.kort[k.id]; return post && post.forfall > naa && post.forfall < grense; }).length;
}

// What the next session holds.
export function oktInnhold(ko) {
  const repetisjoner = Math.min(ko.forfalte, OKT_STORRELSE);
  const nye = Math.min(ko.nye, NYE_I_OKT);
  return { repetisjoner, nye, etterpa: ko.forfalte + ko.nye - repetisjoner - nye };
}

export function oktTekst({ repetisjoner, nye }) {
  const gamle = repetisjoner ? flertall(repetisjoner, 'repetisjon', 'repetisjoner') : '';
  const ferske = nye ? (repetisjoner ? flertall(nye, 'ny', 'nye') : flertall(nye, 'nytt kort', 'nye kort')) : '';
  return [gamle, ferske].filter(Boolean).join(' og ');
}

// The one thing to do next, whatever state the player is in.
export function nesteSteg(antallValgte, ko) {
  if (!antallValgte) return { type: 'bygg' };
  const innhold = oktInnhold(ko);
  if (innhold.repetisjoner || innhold.nye) return { type: 'okt', ...innhold };
  return { type: ko.flere ? 'flere' : 'ov' };
}

// Reviews are spread around the new cards, so a new card is tested some cards after it was taught.
function fordelOkt(repetisjoner, nye) {
  const ut = [];
  const rest = [...repetisjoner];
  const blokker = Array.from({ length: Math.ceil(nye.length / BLOKK) }, (_, i) => nye.slice(i * BLOKK, (i + 1) * BLOKK));
  const hver = Math.ceil(rest.length / (2 * blokker.length + 1));
  for (const blokk of blokker) ut.push(...rest.splice(0, hver), ...blokk, ...rest.splice(0, hver), ...blokk);
  return [...ut, ...rest];
}

const nyOkt = (ko, laer, ovelse = false) => ({ ko, kortliste: [...new Set(ko)], totalt: new Set(ko).size, gjort: 0, ovelse, laer: new Set(laer.map(kort => kort.id)), vist: new Set(), vurdert: new Set(), resultat: new Map(), riktige: 0, hint: 0, bom: new Map() });

function stokk(liste, tilfeldig) {
  const ut = [...liste];
  for (let i = ut.length - 1; i > 0; i -= 1) {
    const j = Math.floor(tilfeldig() * (i + 1));
    [ut[i], ut[j]] = [ut[j], ut[i]];
  }
  return ut;
}

// nye are shown first and tested later, so they stand twice in the queue and in laer until they have been taught.
export function lagOkt(ko, tilfeldig = Math.random, nye = []) {
  const ferske = nye.slice(0, NYE_I_OKT);
  return nyOkt(fordelOkt(stokk(ko.slice(0, OKT_STORRELSE), tilfeldig), ferske), ferske);
}

// Practice outside the schedule. A card nobody has taught is still shown before it is asked: here once, with the arrow.
export function lagOvelse(kort, fremgang) {
  return nyOkt([...kort], kort.filter(k => !fremgang.kort[k.id]), true);
}

export const ovelseRekke = (kort, { stokket = false, tilfeldig = Math.random } = {}) => (stokket ? stokk(kort, tilfeldig) : nyeIRekkefolge(kort));

// Shown and played once: the card is known from now on, in box 0 and due for its test. Only that test gives box 1.
export function vistKort(okt, kort, fremgang, naa = Date.now()) {
  okt.laer.delete(kort.id);
  okt.vist.add(kort.id);
  if (!okt.resultat.has(kort.id)) okt.resultat.set(kort.id, 'vist');
  if (!okt.ovelse) fremgang.kort[kort.id] = { boks: 0, forfall: dagStart(naa), sist: naa, forst: naa, riktige: 0, feil: 0, vist: naa };
}

export const introSett = (fremgang, apningId) => Boolean(fremgang.introer[apningId]);
export function merkIntro(fremgang, apningId, naa = Date.now()) { fremgang.introer[apningId] = { sist: naa }; }

// How far the player has come with a set of cards: a card counts once its test is passed.
export const laerteKort = (kort, fremgang) => kort.filter(k => fremgang.kort[k.id]?.boks >= 1).length;

// Only the first answer counts as a review. A wrong answer brings the card back a few cards later, whatever it was the first time.
export function svarKort(okt, kort, utfall, fremgang, naa = Date.now()) {
  const forste = !okt.vurdert.has(kort.id);
  let post = null;
  if (forste) {
    okt.vurdert.add(kort.id);
    okt.resultat.set(kort.id, utfall);
    if (!okt.ovelse) post = vurderKort(fremgang, kort.id, utfall, naa);
    if (utfall === 'riktig') okt.riktige += 1;
    if (utfall === 'hint') okt.hint += 1;
  }
  if (utfall === 'feil') {
    okt.bom.set(kort.id, { kort, antall: (okt.bom.get(kort.id)?.antall ?? 0) + 1 });
    okt.ko.splice(Math.min(okt.ko.length, GJENTA_ETTER + 1), 0, kort);
  }
  return post;
}

export const vanskeligst = (okt, grense = 3) => [...okt.bom.values()].sort((a, b) => b.antall - a.antall).slice(0, grense);

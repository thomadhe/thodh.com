// Flashcards: one position and the repertoire move, Leitner per position. Pure functions; progress is passed in.
import { Chess } from '../vendor/chess.mjs';
import { deltSti, stilling, veiTil } from './modell.mjs';
import { startNoder } from './repertoar.mjs';
import { INTERVALL_DAGER, linjePost } from './repetisjon.mjs';
import { norsk } from './trener.mjs';

export const OKT_STORRELSE = 12;
export const NYE_PER_DAG = 6;
export const MAKS_FORFALT = 30;
const HOPP_EGNE_TREKK = 2;
const GJENTA_ETTER = 3;
const DAG = 86400000;

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
  return [...kort.values()].map(k => ({ ...k, trekk: [...new Set(k.kilder.map(kilde => kilde.san))] }));
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

// Earliest positions first, known lines before unseen ones, taking turns between the openings.
function nyeIRekkefolge(ukjente, fremgang) {
  const kjent = ({ kilder: [{ apning, sti }] }) => apning.linjer.some(linje => (!sti || linje.id === sti || linje.id.startsWith(`${sti} `)) && linjePost(fremgang, apning.id, linje.id));
  const sortert = ukjente.map(kort => ({ kort, kjent: kjent(kort) })).sort((a, b) => b.kjent - a.kjent || trekkTall(a.kort.fen) - trekkTall(b.kort.fen));
  const plass = new Map();
  const med = sortert.map(({ kort }) => {
    const apningId = kort.kilder[0].apning.id;
    plass.set(apningId, (plass.get(apningId) ?? 0) + 1);
    return { kort, runde: plass.get(apningId) };
  });
  return med.sort((a, b) => a.runde - b.runde).map(m => m.kort);
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
  const pause = forfalte.length >= MAKS_FORFALT;
  const rom = Math.max(0, MAKS_FORFALT * (1 + ekstra) - gjortIDag);
  const nyeRom = pause ? 0 : Math.max(0, NYE_PER_DAG * (1 + ekstra) - nyeIDag);
  const klare = forfalte.slice(0, rom);
  const nye = nyeIRekkefolge(ukjente, fremgang).slice(0, nyeRom);
  return { kort: [...klare, ...nye], forfalte: klare.length, nye: nye.length, pause, flere: forfalte.length > klare.length || (!pause && ukjente.length > nye.length) };
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

export function lagOkt(ko, tilfeldig = Math.random) {
  const valgt = ko.slice(0, OKT_STORRELSE);
  for (let i = valgt.length - 1; i > 0; i -= 1) {
    const j = Math.floor(tilfeldig() * (i + 1));
    [valgt[i], valgt[j]] = [valgt[j], valgt[i]];
  }
  return { ko: valgt, totalt: valgt.length, vurdert: new Set(), riktige: 0, hint: 0, bom: new Map() };
}

// Only the first answer counts as a review. A wrong answer brings the card back a few cards later, whatever it was the first time.
export function svarKort(okt, kort, utfall, fremgang, naa = Date.now()) {
  const forste = !okt.vurdert.has(kort.id);
  let post = null;
  if (forste) {
    okt.vurdert.add(kort.id);
    post = vurderKort(fremgang, kort.id, utfall, naa);
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

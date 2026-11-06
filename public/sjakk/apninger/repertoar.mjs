// The player's own repertoire: a slot per opponent reply, filled from the opening data, and the mixed drill over it.
import { Chess } from '../vendor/chess.mjs';
import { stilling, trekkNummer } from './modell.mjs';
import { linjePost } from './repetisjon.mjs';

// Openings are matched against linjer, so a new data file finds its slot without being listed here.
export const SLOTS = [
  { id: 'w-e5', farge: 'w', mot: '1…e5', navn: 'Åpent spill', linjer: [['e4', 'e5']] },
  { id: 'w-c5', farge: 'w', mot: '1…c5', navn: 'Siciliansk', linjer: [['e4', 'c5']] },
  { id: 'w-e6', farge: 'w', mot: '1…e6', navn: 'Fransk', linjer: [['e4', 'e6']] },
  { id: 'w-c6', farge: 'w', mot: '1…c6', navn: 'Caro-Kann', linjer: [['e4', 'c6']] },
  { id: 'w-d5', farge: 'w', mot: '1…d5', navn: 'Skandinavisk', linjer: [['e4', 'd5']] },
  { id: 'w-nf6', farge: 'w', mot: '1…Sf6', navn: 'Aljechin', linjer: [['e4', 'Nf6']] },
  { id: 'w-d6', farge: 'w', mot: '1…d6 / 1…g6', navn: 'Pirc og moderne', linjer: [['e4', 'd6'], ['e4', 'g6']] },
  { id: 'b-e4', farge: 'b', mot: '1.e4 og sidesporene', navn: '1.e4 generelt', sporsmal: 'Hva vil du svare når hvit åpner med 1.e4?', linjer: [['e4']] },
  { id: 'b-spansk', farge: 'b', mot: '1.e4 e5 2.Sf3 Sc6 3.Lb5', navn: 'Spansk', sporsmal: 'Og når hvit går for spansk, 3.Lb5?', vekt: 15, linjer: [['e4', 'e5', 'Nf3', 'Nc6', 'Bb5']] },
  { id: 'b-italiensk', farge: 'b', mot: '1.e4 e5 2.Sf3 Sc6 3.Lc4', navn: 'Italiensk', sporsmal: 'Og når hvit går for italiensk, 3.Lc4?', vekt: 10, linjer: [['e4', 'e5', 'Nf3', 'Nc6', 'Bc4']] },
  { id: 'b-d4', farge: 'b', mot: '1.d4', navn: 'Dronningbonden', sporsmal: 'Hva vil du svare når hvit åpner med 1.d4?', linjer: [['d4']] },
  { id: 'b-resten', farge: 'b', mot: '1.c4, 1.Sf3 og 1.f4', navn: 'Resten', sporsmal: 'Og mot de roligere åpningene, 1.c4, 1.Sf3 og 1.f4?', linjer: [['c4'], ['Nf3'], ['f4']] },
];

// The owner's own example. It is only ever offered, never selected unasked.
export const STARTFORSLAG = ['kongegambitt', 'smith-morra'];

// How often the opponent plays each first move, roughly. Deeper replies use vekt in the data.
const SVAR_VEKT = { w: { c5: 34, e5: 30, e6: 13, c6: 10, d6: 4, d5: 4, g6: 3, Nf6: 2 }, b: { e4: 45, d4: 38, Nf3: 8, c4: 7, f4: 2 } };
// The moves in `start` have no vekt: each opponent move there is a guess at how often it is played.
const START_SVAR = 0.6;
// A trap leaves the tree when the opponent goes wrong, which happens less often than the lines themselves.
const AV_TREET = 0.25;

const motstanderTrekk = (farge, ply) => ply % 2 === (farge === 'w' ? 1 : 0);
const svarPly = farge => (farge === 'w' ? 1 : 0);
const sum = tall => tall.reduce((a, b) => a + b, 0);
export const mestVanlig = node => node.barn.reduce((best, barn) => ((barn.entry.vekt ?? 1) > (best.entry.vekt ?? 1) ? barn : best), node.barn[0]);

// 0 when the opening has nothing to do with the moves, the length when it starts at or below them,
// and Infinity when it starts earlier and its own tree reaches them.
function dekning(apning, linje) {
  const start = apning.startTrekk;
  for (let i = 0; i < Math.min(start.length, linje.length); i += 1) if (start[i] !== linje[i]) return 0;
  if (start.length >= linje.length) return linje.length;
  let node = apning.rot;
  for (const san of linje.slice(start.length)) {
    node = node.barn.find(barn => barn.san === san);
    if (!node) return 0;
  }
  return Infinity;
}

// How much of a line the opening answers: all of it, unless `start` narrows it down with further opponent moves.
function andelAvLinje(apning, linje) {
  const treff = dekning(apning, linje);
  if (!treff) return 0;
  if (treff === Infinity) return 1;
  const smalere = apning.startTrekk.slice(linje.length).filter((_, i) => motstanderTrekk(apning.farge, linje.length + i)).length;
  return START_SVAR ** smalere;
}

// Every opening lands in the deepest slot it starts in and in every slot its tree reaches; the rest go to "Andre".
export function fordel(apninger) {
  const slots = [...SLOTS, ...['w', 'b'].map(farge => ({ id: `${farge}-andre`, farge, mot: 'Andre åpninger', navn: 'Andre', linjer: [] }))].map(slot => ({ ...slot, apninger: [] }));
  for (const apning of apninger) {
    const egne = slots.filter(slot => slot.farge === apning.farge);
    const treff = egne.map(slot => ({ slot, styrke: Math.max(0, ...slot.linjer.map(linje => dekning(apning, linje))) })).filter(t => t.styrke > 0);
    const dypest = Math.max(0, ...treff.map(t => t.styrke).filter(Number.isFinite));
    const plass = treff.filter(t => t.styrke === Infinity || t.styrke === dypest).map(t => t.slot);
    for (const slot of plass.length ? plass : egne.filter(s => !s.linjer.length)) slot.apninger.push(apning);
  }
  return slots;
}

// One entry per opening, last write wins, so deselecting leaves a dated trace that a later account sync can merge.
export const erValgt = (fremgang, id) => fremgang.repertoar[id]?.valgt === true;
export const valgteApninger = (fremgang, apninger) => apninger.filter(apning => erValgt(fremgang, apning.id));
export function settValgt(fremgang, id, valgt, naa = Date.now()) { fremgang.repertoar[id] = { valgt, sist: naa }; }

// The moves before the tree as nodes, so a drill can start from move 1. Only the last has a place in the tree.
// The texts name the opening only once the opponent has shown the way, so the first moves give nothing away.
export function startNoder(apning) {
  const chess = new Chess();
  const sisteSvar = apning.startTrekk.length - (apning.startTrekk.length % 2 === (apning.farge === 'w' ? 0 : 1) ? 1 : 2);
  return apning.startTrekk.map((san, i) => {
    const nummer = trekkNummer(chess.fen());
    const trekk = chess.move(san);
    const rep = trekk.color === apning.farge;
    return { sti: i === apning.startTrekk.length - 1 ? '' : null, san: trekk.san, fra: trekk.from, til: trekk.to, farge: trekk.color, rep, fen: chess.fen(), nummer, barn: [], entry: rep ? { hva: 'Det er trekket vårt her.', ide: 'det er det trekket du har valgt i repertoaret.' } : { hva: i === sisteSvar ? `Da går vi for ${apning.navn}.` : 'Et vanlig svar.' } };
  });
}

const egneCache = new WeakMap();
function egneTrekk(apning) {
  if (egneCache.has(apning)) return egneCache.get(apning);
  const kart = new Map();
  let fen = new Chess().fen();
  for (const node of startNoder(apning)) {
    if (node.rep) kart.set(stilling(fen), node);
    fen = node.fen;
  }
  for (const node of apning.noder.values()) if (node.rep && !kart.has(stilling(node.forelder.fen))) kart.set(stilling(node.forelder.fen), node);
  egneCache.set(apning, kart);
  return kart;
}

// The first position where two openings want different moves of ours, or null when they fit together.
export function krysser(a, b) {
  if (a.farge !== b.farge) return null;
  const andre = egneTrekk(b);
  for (const [nokkel, her] of egneTrekk(a)) {
    const der = andre.get(nokkel);
    if (der && der.san !== her.san) return { a: her, b: der };
  }
  return null;
}

// Normally one opening per slot: a new choice replaces those it crosses, and openings for other lines stay.
export function velgApning(fremgang, apning, slot, naa = Date.now()) {
  const byttet = slot.apninger.filter(annen => annen !== apning && erValgt(fremgang, annen.id) && krysser(apning, annen));
  for (const annen of byttet) settValgt(fremgang, annen.id, false, naa);
  settValgt(fremgang, apning.id, true, naa);
  return byttet;
}

// Two choices the player kept on purpose, as pairs that branch at the same position.
export function kryssI(slot, fremgang) {
  const valgte = slot.apninger.filter(apning => erValgt(fremgang, apning.id));
  return valgte.flatMap((a, i) => valgte.slice(i + 1).flatMap(b => { const kryss = krysser(a, b); return kryss ? [{ a, b, kryss }] : []; }));
}

const linjeVekt = (farge, linje) => SVAR_VEKT[farge][linje[svarPly(farge)]] ?? 0;
const delAv = (ytre, indre) => indre.length > ytre.length && ytre.every((san, i) => indre[i] === san);

// A slot's share of the games, in percent. A slot that holds deeper slots gives their share away.
export function slotVekt(slot) {
  if (slot.vekt) return slot.vekt;
  const inni = SLOTS.filter(annen => annen.vekt && annen.farge === slot.farge && annen.linjer.some(indre => slot.linjer.some(ytre => delAv(ytre, indre))));
  return sum(slot.linjer.map(linje => linjeVekt(slot.farge, linje))) - sum(inni.map(annen => annen.vekt));
}

// Keeps the numbers as rough as they are.
export function omtrentProsent(prosent) {
  if (prosent <= 0) return '0 %';
  return prosent < 2.5 ? 'under 5 %' : `omtrent ${Math.round(prosent / 5) * 5} %`;
}

// What the question says: a reply's whole share, also the part that deeper slots ask about later.
export const svarAndel = slot => slot.vekt ?? sum(slot.linjer.map(linje => linjeVekt(slot.farge, linje)));

export function dekningTekst({ prosent }, farge) {
  const hva = farge === 'w' ? 'det motstanderen spiller mot 1.e4' : 'det hvit åpner med';
  return prosent >= 97.5 ? `Du har svar på det aller meste av ${hva}.` : `Du har svar på ${omtrentProsent(prosent)} av ${hva}.`;
}

export function hullTekst({ slot, vekt, dekket }) {
  return dekket > 0 ? `Størst hull: ${slot.mot}, som bare er delvis dekket.` : `Størst hull: ${slot.mot}, ${omtrentProsent(vekt)}.`;
}

// Once the chosen openings leave a slot's line with a move of ours, the player never gets there.
function stengt(slot, valgte) {
  const kart = valgte.filter(apning => apning.farge === slot.farge).map(egneTrekk);
  return slot.linjer.length > 0 && slot.linjer.every(linje => {
    const chess = new Chess();
    return linje.some((san, ply) => {
      const fen = chess.fen();
      chess.move(san);
      if (!ply || motstanderTrekk(slot.farge, ply)) return false;
      const svar = kart.flatMap(egne => egne.get(stilling(fen))?.san ?? []);
      return svar.length > 0 && !svar.includes(san);
    });
  });
}

function slotDekket(slot, valgte) {
  if (stengt(slot, valgte)) return 1;
  // Two openings on the same branch answer the same games once.
  const her = [...new Map(slot.apninger.filter(apning => valgte.includes(apning)).map(apning => [apning.startTrekk.join(' '), apning])).values()];
  const dekket = sum(slot.linjer.map(linje => linjeVekt(slot.farge, linje) * Math.min(1, sum(her.map(apning => andelAvLinje(apning, linje))))));
  return dekket / (sum(slot.linjer.map(linje => linjeVekt(slot.farge, linje))) || 1);
}

const valgteI = (slots, fremgang) => [...new Set(slots.flatMap(slot => slot.apninger))].filter(apning => erValgt(fremgang, apning.id));

// Roughly how much of what the opponent plays the chosen openings answer, and the biggest gap with something to fill it.
export function svarDekning(slots, fremgang, farge) {
  const valgte = valgteI(slots, fremgang).filter(apning => apning.farge === farge);
  const deler = slots.filter(slot => slot.farge === farge && slot.linjer.length).map(slot => { const vekt = slotVekt(slot), dekket = slotDekket(slot, valgte); return { slot, vekt, dekket, mangler: vekt * (1 - dekket) }; });
  const prosent = sum(deler.map(del => del.vekt * del.dekket)) / (sum(deler.map(del => del.vekt)) || 1) * 100;
  const hull = deler.filter(del => del.slot.apninger.length && del.dekket < 1).sort((a, b) => b.mangler - a.mangler)[0] ?? null;
  return { prosent, valgte: valgte.length, hull };
}

// The guided flow asks about the biggest replies first, and about a deeper slot right after the reply it hangs on.
export function byggSteg(slots) {
  const hele = slot => sum(slot.linjer.map(linje => linjeVekt(slot.farge, linje)));
  const dybde = slot => Math.max(0, ...slot.linjer.map(linje => linje.length));
  return slots.filter(slot => slot.apninger.length).sort((a, b) => (a.farge === b.farge ? 0 : a.farge === 'w' ? -1 : 1) || hele(b) - hele(a) || dybde(a) - dybde(b) || slotVekt(b) - slotVekt(a));
}

const harValg = (slot, fremgang) => slot.apninger.some(apning => erValgt(fremgang, apning.id));

export function forsteSteg(slots, fremgang, farge, { bareHull = false } = {}) {
  const valgte = valgteI(slots, fremgang);
  return byggSteg(slots).find(slot => slot.farge === farge && !stengt(slot, valgte) && (!bareHull || !harValg(slot, fremgang))) ?? null;
}

// The next or previous question of the same colour, or null at the end.
export function nabostSteg(slots, fremgang, slotId, retning, { bareHull = false } = {}) {
  const steg = byggSteg(slots);
  const i = steg.findIndex(slot => slot.id === slotId);
  const valgte = valgteI(slots, fremgang);
  const rest = retning > 0 ? steg.slice(i + 1) : steg.slice(0, Math.max(0, i)).reverse();
  return rest.find(slot => slot.farge === steg[i]?.farge && !stengt(slot, valgte) && (!bareHull || !harValg(slot, fremgang))) ?? null;
}

// The choices to show first: what the player already has, the owner's own suggestion, then what answers most of the reply.
export function alternativer(slot, fremgang) {
  const dekker = apning => Math.max(0, ...slot.linjer.map(linje => andelAvLinje(apning, linje)));
  return slot.apninger.map((apning, plass) => ({ apning, plass })).sort((a, b) => erValgt(fremgang, b.apning.id) - erValgt(fremgang, a.apning.id) || STARTFORSLAG.includes(b.apning.id) - STARTFORSLAG.includes(a.apning.id) || dekker(b.apning) - dekker(a.apning) || a.plass - b.plass).map(valg => valg.apning);
}

// The moves up to and including our second move in the tree, far enough to show what the opening is.
export function veiInnTrekk(apning) {
  const sans = [...apning.startTrekk];
  let egne = 0;
  for (let node = apning.rot; node.barn.length && egne < 2;) {
    node = mestVanlig(node);
    sans.push(node.san);
    if (node.rep) egne += 1;
  }
  return sans;
}

// How likely the position after these moves is: SVAR_VEKT for the first reply, then vekt down the path.
export function veiVekt(apning, trekk) {
  const { farge, startTrekk } = apning;
  let vekt = 1;
  let node = apning.rot;
  trekk.forEach((san, ply) => {
    const iTreet = ply >= startTrekk.length;
    const barn = iTreet ? node?.barn.find(b => b.san === san) : null;
    if (motstanderTrekk(farge, ply)) {
      if (ply === svarPly(farge)) vekt *= (SVAR_VEKT[farge][san] ?? 1) / 100;
      else if (!iTreet) vekt *= START_SVAR;
      else vekt *= barn ? (barn.entry.vekt ?? 1) / sum(node.barn.map(b => b.entry.vekt ?? 1)) : AV_TREET;
    }
    if (iTreet) node = barn ?? null;
  });
  return vekt;
}

const linjeNokkel = ({ apning, linje }) => `${apning.id}|${linje.id}`;
export const repertoarLinjer = valgte => valgte.flatMap(apning => { const start = startNoder(apning); return apning.linjer.map(linje => ({ apning, linje, noder: [...start, ...linje.noder] })); });

function vektVed(kandidat, ply) {
  const { apning, noder } = kandidat;
  if (noder[ply].rep) return 1;
  return ply === (apning.farge === 'w' ? 1 : 0) ? SVAR_VEKT[apning.farge][noder[ply].san] ?? 1 : noder[ply].entry.vekt ?? 1;
}

// Walks from move 1 and lets the opponent choose among the replies that still lead to a candidate.
function etterVekt(kandidater, tilfeldig) {
  let igjen = kandidater;
  for (let ply = 0; igjen.length > 1; ply += 1) {
    const grupper = new Map();
    for (const kandidat of igjen) {
      const node = kandidat.noder[ply];
      if (!node) continue;
      if (!grupper.has(node.san)) grupper.set(node.san, { vekt: vektVed(kandidat, ply), liste: [] });
      grupper.get(node.san).liste.push(kandidat);
    }
    if (!grupper.size) break;
    const valg = [...grupper.values()];
    let rest = tilfeldig() * valg.reduce((sum, g) => sum + g.vekt, 0);
    igjen = (valg.find(g => (rest -= g.vekt) < 0) ?? valg.at(-1)).liste;
  }
  return igjen[0];
}

// Due lines first, then new ones, then extra rounds, across every chosen opening. spilt keeps to lines that begin with those moves.
export function velgBlandetLinje(valgte, fremgang, { naa = Date.now(), forrige = null, farge = null, spilt = [], tilfeldig = Math.random } = {}) {
  const alle = repertoarLinjer(valgte).filter(k => (!farge || k.apning.farge === farge) && spilt.every((san, i) => k.noder[i]?.san === san));
  if (!alle.length) return null;
  const andre = alle.length > 1 ? alle.filter(k => linjeNokkel(k) !== forrige) : alle;
  const post = k => linjePost(fremgang, k.apning.id, k.linje.id);
  const forfalt = andre.filter(k => post(k) && post(k).forfall <= naa);
  const nye = andre.filter(k => !post(k));
  const [utvalg, grunn] = forfalt.length ? [forfalt, 'repetisjon'] : nye.length ? [nye, 'ny'] : [andre, 'ekstra'];
  const sider = [...new Set(utvalg.map(k => k.apning.farge))];
  const side = sider[Math.floor(tilfeldig() * sider.length)];
  const valgt = etterVekt(utvalg.filter(k => k.apning.farge === side), tilfeldig);
  return { ...valgt, grunn, nokkel: linjeNokkel(valgt) };
}

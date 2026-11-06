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
  { id: 'b-e4', farge: 'b', mot: '1.e4 og sidesporene', navn: '1.e4 generelt', linjer: [['e4']] },
  { id: 'b-spansk', farge: 'b', mot: '1.e4 e5 2.Sf3 Sc6 3.Lb5', navn: 'Spansk', linjer: [['e4', 'e5', 'Nf3', 'Nc6', 'Bb5']] },
  { id: 'b-italiensk', farge: 'b', mot: '1.e4 e5 2.Sf3 Sc6 3.Lc4', navn: 'Italiensk', linjer: [['e4', 'e5', 'Nf3', 'Nc6', 'Bc4']] },
  { id: 'b-d4', farge: 'b', mot: '1.d4', navn: 'Dronningbonden', linjer: [['d4']] },
  { id: 'b-resten', farge: 'b', mot: '1.c4, 1.Sf3 og 1.f4', navn: 'Resten', linjer: [['c4'], ['Nf3'], ['f4']] },
];

// The owner's own example. It is only ever offered, never selected unasked.
export const STARTFORSLAG = ['kongegambitt', 'smith-morra', 'fransk-fremstot'];

// How often the opponent plays each first move, roughly. Deeper replies use vekt in the data.
const SVAR_VEKT = { w: { c5: 34, e5: 30, e6: 13, c6: 10, d6: 4, d5: 4, g6: 3, Nf6: 2 }, b: { e4: 45, d4: 38, Nf3: 8, c4: 7, f4: 2 } };

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
export function startNoder(apning) {
  const chess = new Chess();
  return apning.startTrekk.map((san, i) => {
    const nummer = trekkNummer(chess.fen());
    const trekk = chess.move(san);
    const rep = trekk.color === apning.farge;
    return { sti: i === apning.startTrekk.length - 1 ? '' : null, san: trekk.san, fra: trekk.from, til: trekk.to, farge: trekk.color, rep, fen: chess.fen(), nummer, barn: [], entry: rep ? { hva: `Veien inn i ${apning.navn}.`, ide: `det er veien inn i ${apning.navn}.` } : { hva: `Da går vi for ${apning.navn}.` } };
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

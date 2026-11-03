// Opening data model: builds and validates a repertoire tree. Shared by the browser, tests and scripts.
import { Chess } from '../vendor/chess.mjs';

export const SCHEMA = 1;
const NIVAER = ['lett', 'middels', 'vanskelig'];
const PIL = /^[a-h][1-8][a-h][1-8]$/;
const FELT = /^[a-h][1-8]$/;

export const deltSti = sti => (typeof sti === 'string' && sti.trim() ? sti.trim().split(/\s+/) : []);
export const stilling = fen => fen.split(' ').slice(0, 4).join(' ');
const tekst = verdi => typeof verdi === 'string' && verdi.trim().length > 0;

// Plays SAN moves from a FEN; returns { chess, trekk } or throws with the failing move.
export function spill(sans, fen) {
  const chess = fen ? new Chess(fen) : new Chess();
  const trekk = [];
  for (const san of sans) {
    let move;
    try { move = chess.move(san); } catch { move = null; }
    if (!move) throw new Error(`ulovlig trekk «${san}»`);
    if (move.san !== san) throw new Error(`«${san}» bør skrives «${move.san}»`);
    trekk.push(move);
  }
  return { chess, trekk };
}

// Move number prefix for display, e.g. "4." or "4…".
export function trekkNummer(fen) {
  const [, side, , , , full] = fen.split(' ');
  return side === 'w' ? `${full}.` : `${full}…`;
}

export function lesApning(data) {
  const feil = [];
  const f = melding => feil.push(`${data?.id ?? '?'}: ${melding}`);
  if (!data || typeof data !== 'object') return { apning: null, feil: ['ugyldig fil'] };
  if (data.schema !== SCHEMA) f(`schema må være ${SCHEMA}`);
  if (!/^[a-z0-9-]+$/.test(data.id ?? '')) f('id må være små bokstaver, tall og bindestrek');
  for (const felt of ['navn', 'kort', 'karakter']) if (!tekst(data[felt])) f(`mangler ${felt}`);
  if (!['w', 'b'].includes(data.farge)) f('farge må være w eller b');
  if (!NIVAER.includes(data.niva)) f(`niva må være ${NIVAER.join('/')}`);
  if (!Number.isInteger(data.skarphet) || data.skarphet < 1 || data.skarphet > 5) f('skarphet må være 1–5');
  for (const felt of ['historie', 'karakter', 'passer']) if (!tekst(data.intro?.[felt])) f(`intro.${felt} mangler`);
  for (const felt of ['planer', 'modellideer']) if (!Array.isArray(data[felt]) || !data[felt].length || !data[felt].every(tekst)) f(`${felt} må være en liste med tekst`);
  if (!Array.isArray(data.trekk) || !data.trekk.length) { f('trekk mangler'); return { apning: null, feil }; }

  let startFen;
  try { startFen = spill(deltSti(data.start)).chess.fen(); } catch (error) { f(`start: ${error.message}`); return { apning: null, feil }; }
  const rot = { sti: '', san: null, fen: startFen, barn: [], forelder: null, entry: null, dybde: 0 };
  const noder = new Map([['', rot]]);
  const tilSjekk = [];

  for (const [indeks, entry] of data.trekk.entries()) {
    const hvor = `trekk[${indeks}] «${entry?.sti}»`;
    const ledd = deltSti(entry?.sti);
    if (!ledd.length) { f(`${hvor}: tom sti`); continue; }
    const sti = ledd.join(' ');
    if (noder.has(sti)) { f(`${hvor}: finnes allerede`); continue; }
    const forelder = noder.get(ledd.slice(0, -1).join(' '));
    if (!forelder) { f(`${hvor}: forelderen er ikke definert før`); continue; }
    let move;
    try { move = spill([ledd.at(-1)], forelder.fen).trekk[0]; } catch (error) { f(`${hvor}: ${error.message}`); continue; }
    const chess = new Chess(forelder.fen);
    chess.move(move.san);
    const node = { sti, san: move.san, fra: move.from, til: move.to, farge: move.color, rep: move.color === data.farge, fen: chess.fen(), forelder, barn: [], entry, dybde: forelder.dybde + 1, nummer: trekkNummer(forelder.fen), sjakkmatt: chess.isCheckmate() };
    forelder.barn.push(node);
    noder.set(sti, node);
    if (!tekst(entry.hva)) f(`${hvor}: mangler hva`);
    if (node.rep) {
      if (!tekst(entry.ide)) f(`${hvor}: repertoartrekk mangler ide`);
      if (!tekst(entry.pass)) f(`${hvor}: repertoartrekk mangler pass`);
      if (entry.vekt !== undefined) f(`${hvor}: vekt gjelder bare motstanderens trekk`);
    } else if (entry.vekt !== undefined && !(typeof entry.vekt === 'number' && entry.vekt > 0)) f(`${hvor}: vekt må være et positivt tall`);
    for (const pil of [...(entry.piler ?? []), ...(entry.fare ?? [])]) if (!PIL.test(pil)) f(`${hvor}: ugyldig pil ${pil}`);
    for (const felt of entry.felt ?? []) if (!FELT.test(felt)) f(`${hvor}: ugyldig felt ${felt}`);
    for (const [san, forklaring] of Object.entries(entry.vanligeFeil ?? {})) {
      if (!tekst(forklaring)) f(`${hvor}: vanligeFeil.${san} mangler tekst`);
      if (!node.rep) f(`${hvor}: vanligeFeil hører til repertoartrekk`);
      try { spill([san], forelder.fen); } catch (error) { f(`${hvor}: vanligeFeil ${error.message}`); }
    }
    if (entry.overgang !== undefined) tilSjekk.push(node);
  }

  for (const node of tilSjekk) {
    const mal = noder.get(deltSti(node.entry.overgang).join(' '));
    if (!mal) f(`«${node.sti}»: overgang til ukjent sti`);
    else if (stilling(mal.fen) !== stilling(node.fen)) f(`«${node.sti}»: overgangen gir ikke samme stilling`);
    else node.overgang = mal;
    if (node.barn.length) f(`«${node.sti}»: en overgang kan ikke ha egne fortsettelser`);
  }

  const sideITrekk = fen => fen.split(' ')[1];
  const repPerStilling = new Map();
  for (const node of noder.values()) {
    const minTur = sideITrekk(node.fen) === data.farge;
    if (minTur && node.barn.length > 1) f(`«${node.sti}»: flere repertoartrekk (${node.barn.map(b => b.san).join(', ')})`);
    if (node.overgang) continue;
    if (minTur && !node.barn.length && !node.sjakkmatt) f(`«${node.sti || 'start'}»: mangler vårt svar`);
    if (!minTur && !node.barn.length && node !== rot && !tekst(node.entry.plan) && !node.sjakkmatt) f(`«${node.sti}»: siste trekk i linjen trenger en plan`);
    if (minTur && node.barn.length === 1) {
      const nokkel = stilling(node.fen);
      const tidligere = repPerStilling.get(nokkel);
      if (tidligere && tidligere.san !== node.barn[0].san) f(`omstilling: «${tidligere.sti}» spiller ${tidligere.san}, men «${node.sti}» spiller ${node.barn[0].san}`);
      else if (!tidligere) repPerStilling.set(nokkel, { sti: node.sti || 'start', san: node.barn[0].san });
    }
  }

  const feller = [];
  for (const [indeks, felle] of (data.feller ?? []).entries()) {
    const hvor = `feller[${indeks}]`;
    if (!/^[a-z0-9-]+$/.test(felle.id ?? '')) f(`${hvor}: ugyldig id`);
    for (const felt of ['navn', 'tekst', 'forklaring']) if (!tekst(felle[felt])) f(`${hvor}: mangler ${felt}`);
    try {
      const forut = spill(deltSti(felle.sti), startFen);
      const fen = forut.chess.fen();
      const losning = spill(deltSti(felle.trekk), fen);
      if (!losning.trekk.length) throw new Error('mangler trekk');
      for (const san of felle.godta ?? []) spill([san], fen);
      feller.push({ ...felle, fen, forTrekk: forut.trekk, losning: losning.trekk, side: sideITrekk(fen) });
    } catch (error) { f(`${hvor}: ${error.message}`); }
  }

  const sidelinjer = [];
  for (const [indeks, linje] of (data.sidelinjer ?? []).entries()) {
    if (!tekst(linje.navn) || !tekst(linje.tekst)) f(`sidelinjer[${indeks}]: mangler navn eller tekst`);
    try { sidelinjer.push({ ...linje, trekk: spill(deltSti(linje.sti), startFen).trekk }); } catch (error) { f(`sidelinjer[${indeks}]: ${error.message}`); }
  }

  const linjer = [];
  const samle = (node, vei) => {
    if (node !== rot) vei = [...vei, node];
    if (!node.barn.length) { if (vei.length) linjer.push(lagLinje(vei)); return; }
    for (const barn of node.barn) samle(barn, vei);
  };
  samle(rot, []);

  const apning = { ...data, startFen, startTrekk: deltSti(data.start), rot, noder, linjer, feller, sidelinjer, stillinger: new Set([...noder.values()].map(n => stilling(n.fen))).size };
  return { apning, feil };
}

function lagLinje(vei) {
  const navngitt = [...vei].reverse().find(node => tekst(node.entry.navn));
  const avvik = vei.filter(node => !node.rep && node.forelder.barn.length > 1).map(node => `${node.nummer}${node.san}`);
  return { id: vei.at(-1).sti, noder: vei, navn: navngitt?.entry.navn ?? (avvik.at(-1) ?? 'Hovedlinjen'), repTrekk: vei.filter(node => node.rep).length };
}

// "1.e4 e5 2.Nf3" for display.
export function notasjon(noder) {
  return noder.map((node, i) => (node.farge === 'w' || i === 0 ? node.nummer : '') + node.san).join(' ');
}

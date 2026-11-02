// Puzzle sounds, synthesized with Web Audio. The on/off choice is shared with the
// rest of the site through ../lyd.mjs.
import { lydPa, settLyd } from '../lyd.mjs';

export { lydPa, settLyd };

let ctx = null;
function kontekst() {
  ctx ??= new AudioContext();
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

function tone(frekvens, start, varighet, { type = 'sine', volum = 0.12 } = {}) {
  const c = kontekst();
  const t0 = c.currentTime + start;
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = type;
  o.frequency.setValueAtTime(frekvens, t0);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(volum, t0 + 0.008);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + varighet);
  o.connect(g).connect(c.destination);
  o.start(t0);
  o.stop(t0 + varighet + 0.03);
}

function klakk(volum, frekvens) {
  const c = kontekst();
  const lengde = Math.ceil(c.sampleRate * 0.05);
  const buffer = c.createBuffer(1, lengde, c.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < lengde; i++) data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / lengde, 4);
  const kilde = c.createBufferSource();
  const filter = c.createBiquadFilter();
  const g = c.createGain();
  kilde.buffer = buffer;
  filter.type = 'bandpass';
  filter.frequency.value = frekvens;
  filter.Q.value = 1.4;
  g.gain.value = volum;
  kilde.connect(filter).connect(g).connect(c.destination);
  kilde.start();
}

function spill(lag) {
  if (!lydPa()) return;
  try { lag(); } catch { /* Audio may be blocked until the first click. */ }
}

export const lyd = {
  trekk: () => spill(() => { klakk(0.9, 900); tone(220, 0, 0.06, { volum: 0.05 }); }),
  slag: () => spill(() => { klakk(1.2, 1500); klakk(0.6, 600); }),
  sjakk: () => spill(() => { klakk(0.9, 900); tone(660, 0.02, 0.12, { type: 'triangle', volum: 0.06 }); }),
  riktig: () => spill(() => tone(880, 0, 0.12, { type: 'triangle', volum: 0.08 })),
  lost: () => spill(() => [659, 784, 988, 1319].forEach((f, i) => tone(f, i * 0.07, 0.22, { type: 'triangle', volum: 0.1 }))),
  feil: () => spill(() => { tone(196, 0, 0.22, { type: 'sawtooth', volum: 0.05 }); tone(185, 0.12, 0.3, { type: 'sawtooth', volum: 0.05 }); }),
};

/** The right sound for a chess.js move. */
export const trekklyd = (trekk, chess) => (chess?.isCheck() ? lyd.sjakk() : trekk?.captured ? lyd.slag() : lyd.trekk());

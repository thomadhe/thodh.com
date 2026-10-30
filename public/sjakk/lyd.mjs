// Slot machine sounds for Casinosjakk, synthesized with Web Audio (no audio files).
// Shares the on/off choice with the daily games ("spill:lyd" in localStorage).

let ctx = null;

export function lydPa() {
  try { return localStorage.getItem('spill:lyd') !== 'av'; } catch { return true; }
}

export function settLyd(pa) {
  try { localStorage.setItem('spill:lyd', pa ? 'pa' : 'av'); } catch { /* Sound still works for this tab. */ }
}

function kontekst() {
  ctx ??= new AudioContext();
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

function tone(frekvens, start, varighet, { type = 'sine', volum = 0.15, til } = {}) {
  const c = kontekst();
  const t0 = c.currentTime + start;
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = type;
  o.frequency.setValueAtTime(frekvens, t0);
  if (til) o.frequency.exponentialRampToValueAtTime(til, t0 + varighet);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(volum, t0 + 0.008);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + varighet);
  o.connect(g).connect(c.destination);
  o.start(t0);
  o.stop(t0 + varighet + 0.03);
}

function stoy(start, varighet, volum, frekvens, type = 'bandpass') {
  const c = kontekst();
  const t0 = c.currentTime + start;
  const buffer = c.createBuffer(1, Math.ceil(c.sampleRate * varighet), c.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / data.length, 2);
  const kilde = c.createBufferSource();
  const filter = c.createBiquadFilter();
  const g = c.createGain();
  kilde.buffer = buffer;
  filter.type = type;
  filter.frequency.value = frekvens;
  g.gain.value = volum;
  kilde.connect(filter).connect(g).connect(c.destination);
  kilde.start(t0);
}

function spill(lag) {
  if (!lydPa()) return;
  try { lag(); } catch { /* Audio may be blocked until the first click. */ }
}

export const casinolyd = {
  /** The lever: a ratchet going down and a heavy clunk at the bottom. */
  spak: () => spill(() => {
    for (let i = 0; i < 5; i++) stoy(i * 0.035, 0.03, 0.5, 2400 - i * 250);
    stoy(0.2, 0.12, 0.9, 180, 'lowpass');
    tone(90, 0.2, 0.18, { volum: 0.35, til: 55 });
  }),
  /** One click of the spinning reels. */
  rulle: () => spill(() => stoy(0, 0.018, 0.35, 3200)),
  /** A reel locking into place. */
  stopp: () => spill(() => {
    stoy(0, 0.05, 0.7, 900);
    tone(160, 0, 0.12, { volum: 0.25, til: 110 });
  }),
  /** Coins: a bright rising arpeggio with a little sparkle. */
  gevinst: () => spill(() => {
    [784, 988, 1175, 1568].forEach((f, i) => tone(f, i * 0.075, 0.22, { type: 'triangle', volum: 0.16 }));
    for (let i = 0; i < 6; i++) tone(2400 + Math.random() * 1600, 0.3 + i * 0.05, 0.08, { type: 'square', volum: 0.03 });
  }),
  /** Nothing to move: the classic sad trombone, in miniature. */
  tap: () => spill(() => {
    [392, 370, 349].forEach((f, i) => tone(f, i * 0.28, 0.26, { type: 'sawtooth', volum: 0.06 }));
    tone(330, 0.84, 0.6, { type: 'sawtooth', volum: 0.06, til: 300 });
  }),
};

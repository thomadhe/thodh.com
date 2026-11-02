// Glicko-2 (Glickman 2012) for one puzzle at a time, tuned like Lichess puzzles:
// start at 1500 with RD 500, tau 0.75, RD kept between 45 and 500.
const SKALA = 173.7178;
export const TAU = 0.75;
export const START = Object.freeze({ rating: 1500, rd: 500, vol: 0.09 });
export const RD_MIN = 45;
export const RD_MAX = 500;
const VOL_MAX = 0.1;
/** Lichess shows a "?" after ratings with an RD above this. */
export const FORELOPIG_RD = 110;

const g = phi => 1 / Math.sqrt(1 + 3 * phi * phi / (Math.PI * Math.PI));
const E = (mu, muJ, phiJ) => 1 / (1 + Math.exp(-g(phiJ) * (mu - muJ)));

/** RD grows while the player is away: one rating period per day. */
export function etterPause(spiller, dager) {
  if (!(dager > 0)) return spiller;
  const phi = spiller.rd / SKALA;
  const rd = Math.sqrt(phi * phi + spiller.vol * spiller.vol * Math.min(dager, 365)) * SKALA;
  return { ...spiller, rd: Math.min(RD_MAX, rd) };
}

function nyVolatilitet(phi, sigma, v, delta, tau) {
  const a = Math.log(sigma * sigma);
  const f = x => {
    const ex = Math.exp(x);
    return ex * (delta * delta - phi * phi - v - ex) / (2 * (phi * phi + v + ex) ** 2) - (x - a) / (tau * tau);
  };
  let A = a;
  let B;
  if (delta * delta > phi * phi + v) B = Math.log(delta * delta - phi * phi - v);
  else { let k = 1; while (f(a - k * tau) < 0) k++; B = a - k * tau; }
  let fA = f(A), fB = f(B);
  for (let i = 0; i < 100 && Math.abs(B - A) > 1e-6; i++) {
    const C = A + (A - B) * fA / (fB - fA);
    const fC = f(C);
    if (fC * fB <= 0) { A = B; fA = fB; } else fA /= 2;
    B = C; fB = fC;
  }
  return Math.exp(A / 2);
}

/** One rating period with results [{ rating, rd, score }] (score 1 = win, 0 = loss). */
export function periode(spiller, resultater, tau = TAU) {
  const mu = (spiller.rating - 1500) / SKALA;
  const phi = spiller.rd / SKALA;
  let vInv = 0, sum = 0;
  for (const { rating, rd, score } of resultater) {
    const muJ = (rating - 1500) / SKALA, phiJ = rd / SKALA;
    const e = E(mu, muJ, phiJ), gj = g(phiJ);
    vInv += gj * gj * e * (1 - e);
    sum += gj * (score - e);
  }
  const v = 1 / vInv;
  const vol = nyVolatilitet(phi, spiller.vol, v, v * sum, tau);
  const phiStjerne = Math.sqrt(phi * phi + vol * vol);
  const phiNy = 1 / Math.sqrt(1 / (phiStjerne * phiStjerne) + 1 / v);
  return { rating: (mu + phiNy * phiNy * sum) * SKALA + 1500, rd: phiNy * SKALA, vol };
}

/** The player's new rating after one puzzle (score 1 = solved, 0 = failed). */
export function oppdater(spiller, oppgave, score) {
  const ny = periode(spiller, [{ rating: oppgave.rating, rd: oppgave.rd ?? 80, score }]);
  return { rating: ny.rating, rd: Math.min(RD_MAX, Math.max(RD_MIN, ny.rd)), vol: Math.min(VOL_MAX, ny.vol) };
}

/** Expected score against a puzzle, for showing odds. */
export const forventet = (spiller, oppgave) => E((spiller.rating - 1500) / SKALA, (oppgave.rating - 1500) / SKALA, (oppgave.rd ?? 80) / SKALA);

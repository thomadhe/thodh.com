// Evaluation bar under the board: the stored verdict at once, then the live engine.
//   const bar = lagEvalbar(element, { lager });
//   bar.settStilling(fen, { orientering: 'w', lagret: oppslag(fen) });
//   bar.avslutt();
// A value is { cp }, { matt } or { slutt }, always from White's view. { matt: -4 } means Black mates in 4.
import { Chess } from '../vendor/chess.mjs';
import { stilling } from './modell.mjs';
import { lagMotor } from './motor.mjs';

const NOKKEL = 'sjakk-apninger-evalbar';
const FORSTE_PAUSE = 500;
const PAUSE = 150;
// Shallow searches swing a lot, so a live value must be this deep before it is shown, or replaces a stored one.
const TIDLIGST = 10;
const TIDLIGST_OVER_LAGRET = 12;
const MINNE_MAKS = 500;

export const KREDITT = 'Stillingsvurderingen regnes ut i nettleseren din av <a href="https://github.com/official-stockfish/Stockfish">Stockfish</a> (<a href="https://github.com/nmrugg/stockfish.js/tree/v19.0.1">Stockfish.js 19</a>), fri programvare under <a href="/sjakk/vendor/stockfish-LICENSE.txt">GPLv3</a>.';

// Lichess' curve: -1 to 1, where a few pawns already decide most of the bar.
const sjanse = cp => 2 / (1 + Math.exp(-0.00368208 * cp)) - 1;

export function hvitAndel(verdi) {
  if (verdi.slutt) return { '1-0': 100, '0-1': 0 }[verdi.slutt] ?? 50;
  if ('matt' in verdi) return 50 + 50 * sjanse(Math.sign(verdi.matt) * (21 - Math.min(10, Math.abs(verdi.matt))) * 100);
  return 50 + 50 * sjanse(Math.max(-1000, Math.min(1000, verdi.cp)));
}

export function vurderingTekst(verdi) {
  if (verdi.slutt) return verdi.slutt;
  if ('matt' in verdi) return `#${verdi.matt}`;
  const bonder = Math.max(-99, Math.min(99, Math.round(verdi.cp / 10) / 10));
  return `${bonder > 0 ? '+' : ''}${bonder.toFixed(1)}`;
}

export function vurderingBeskrivelse(verdi) {
  if (verdi.slutt) return { '1-0': 'Hvit har vunnet.', '0-1': 'Svart har vunnet.' }[verdi.slutt] ?? 'Remis.';
  if ('matt' in verdi) return `${verdi.matt > 0 ? 'Hvit' : 'Svart'} setter matt i ${Math.abs(verdi.matt)} trekk.`;
  const bonder = Math.abs(Math.round(verdi.cp / 10) / 10);
  if (bonder < 0.2) return 'Stillingen er omtrent lik.';
  return `${verdi.cp > 0 ? 'Hvit' : 'Svart'} står ${bonder.toFixed(1).replace('.', ',')} bonde bedre.`;
}

export function spillSlutt(fen) {
  const chess = new Chess(fen);
  if (chess.isCheckmate()) return { slutt: chess.turn() === 'w' ? '0-1' : '1-0' };
  return chess.isDraw() ? { slutt: '½-½' } : null;
}

// Looks up the verifier's verdict by position. Its ±9999 means mate without a count, so those wait for the engine.
export function lagretOppslag(noder) {
  const kart = new Map();
  for (const node of noder.values()) {
    const motor = node.entry?.motor;
    if (typeof motor?.cp !== 'number' || Math.abs(motor.cp) >= 9000) continue;
    const nokkel = stilling(node.fen);
    if (!kart.has(nokkel)) kart.set(nokkel, { verdi: { cp: motor.cp }, dybde: motor.dybde });
  }
  return fen => kart.get(stilling(fen)) ?? null;
}

// Shared by every bar for the whole session.
const minne = new Map();
function husk(nokkel, post) {
  minne.delete(nokkel);
  minne.set(nokkel, post);
  if (minne.size > MINNE_MAKS) minne.delete(minne.keys().next().value);
}

const OYE = '<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z"/><circle cx="12" cy="12" r="2.8"/><path class="ap-eval-strek" d="M4 4l16 16"/></svg>';

export function lagEvalbar(rot, { lager = null } = {}) {
  rot.classList.add('ap-eval');
  rot.innerHTML = `<div class="ap-eval-vis" role="img"><span class="ap-eval-tall" aria-hidden="true"></span><span class="ap-eval-spor" aria-hidden="true"><span class="ap-eval-hvit"></span></span><span class="ap-eval-dybde" aria-hidden="true" title="Dybde"></span></div><span class="ap-eval-av">Vurdering skjult</span><button type="button" class="ap-eval-bryter" aria-label="Vis stillingsvurdering">${OYE}</button>`;
  const vis = rot.querySelector('.ap-eval-vis');
  const tall = rot.querySelector('.ap-eval-tall');
  const hvit = rot.querySelector('.ap-eval-hvit');
  const dybdeFelt = rot.querySelector('.ap-eval-dybde');
  const bryter = rot.querySelector('.ap-eval-bryter');
  let paa = lager?.getItem(NOKKEL) !== 'av';
  let fen = null;
  let lagret = null;
  let runde = 0;
  let pause = null;
  let harStartet = false;
  let feilet = false;
  let avsluttet = false;

  const motor = lagMotor({ naarFeil() { feilet = true; if (paa) oppdater(); } });

  function tegn(verdi, dybde = null) {
    tall.textContent = vurderingTekst(verdi);
    hvit.style.transform = `scaleX(${(hvitAndel(verdi) / 100).toFixed(4)})`;
    dybdeFelt.textContent = dybde ? `d${dybde}` : '';
    vis.setAttribute('aria-label', `Stillingsvurdering: ${vurderingBeskrivelse(verdi)}`);
    rot.classList.remove('ap-eval-gammel', 'ap-eval-tom');
  }

  function analyser() {
    const denne = runde;
    const nokkel = stilling(fen);
    const tidligst = Math.max(lagret ? TIDLIGST_OVER_LAGRET : TIDLIGST, minne.get(nokkel)?.dybde ?? 0);
    harStartet = true;
    motor.analyser(fen, {
      naarVerdi({ verdi, dybde }) {
        if (denne !== runde || dybde < tidligst) return;
        husk(nokkel, { verdi, dybde, ferdig: false });
        tegn(verdi, dybde);
      },
      naarFerdig() {
        if (denne !== runde) return;
        const post = minne.get(nokkel) ?? lagret;
        if (post) husk(nokkel, { ...post, ferdig: true });
        rot.classList.remove('ap-eval-regner');
      },
    });
  }

  // Runs on every new position. The bar answers at once, and the engine only starts when the player pauses.
  function oppdater() {
    clearTimeout(pause);
    runde += 1;
    motor.avbryt();
    rot.classList.toggle('ap-eval-skjult', !paa);
    rot.classList.remove('ap-eval-regner');
    if (!paa || !fen) return;
    const slutt = spillSlutt(fen);
    const husket = minne.get(stilling(fen));
    const kjent = slutt ? { verdi: slutt } : husket ?? lagret;
    if (kjent) tegn(kjent.verdi, kjent.dybde);
    else if (feilet) rot.classList.add('ap-eval-tom');
    else {
      rot.classList.add('ap-eval-gammel');
      vis.setAttribute('aria-label', 'Stillingsvurdering: regner …');
    }
    if (slutt || husket?.ferdig || feilet) return;
    rot.classList.add('ap-eval-regner');
    pause = setTimeout(analyser, harStartet ? PAUSE : FORSTE_PAUSE);
  }

  function settBryter() {
    bryter.setAttribute('aria-pressed', String(paa));
    bryter.title = paa ? 'Skjul vurderingen' : 'Vis vurderingen';
  }
  bryter.addEventListener('click', () => {
    paa = !paa;
    settBryter();
    oppdater();
    if (!paa) motor.avslutt();
    lager?.setItem(NOKKEL, paa ? 'på' : 'av');
  });
  settBryter();
  tall.textContent = '…';
  hvit.style.transform = 'scaleX(.5)';
  rot.classList.add('ap-eval-gammel');
  rot.classList.toggle('ap-eval-skjult', !paa);

  return {
    settStilling(nyFen, { orientering = 'w', lagret: nyLagret = null } = {}) {
      if (avsluttet) return;
      rot.classList.toggle('ap-eval-snudd', orientering === 'b');
      if (nyFen === fen) return;
      fen = nyFen;
      lagret = nyLagret;
      oppdater();
    },
    avslutt() {
      avsluttet = true;
      clearTimeout(pause);
      runde += 1;
      motor.avslutt();
    },
  };
}

// Interactive board: click or drag to move, legal-move dots, last move, arrows, keyboard focus.
import { Chess } from '../vendor/chess.mjs';

const GLYFER = { k: '♚', q: '♛', r: '♜', b: '♝', n: '♞', p: '♟' };
const NAVN = { p: 'bonde', n: 'springer', b: 'løper', r: 'tårn', q: 'dronning', k: 'konge' };
const FILER = 'abcdefgh';

export function lagBrett(rot, { naarTrekk }) {
  rot.classList.add('ap-brett-ramme');
  rot.innerHTML = '<div class="board ap-brett" role="group" aria-label="Sjakkbrett. Piltaster flytter fokus, Enter velger og flytter."></div><svg class="ap-piler" viewBox="0 0 8 8" aria-hidden="true"><defs><marker id="ap-spiss-plan" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="2.6" markerHeight="2.6" orient="auto"><path d="M0 0L10 5L0 10z" fill="#8fd1a0"/></marker><marker id="ap-spiss-fare" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="2.6" markerHeight="2.6" orient="auto"><path d="M0 0L10 5L0 10z" fill="#ff8f6b"/></marker><marker id="ap-spiss-hint" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="2.6" markerHeight="2.6" orient="auto"><path d="M0 0L10 5L0 10z" fill="#e8a4bc"/></marker></defs><g></g></svg>';
  const brett = rot.querySelector('.ap-brett');
  const pilLag = rot.querySelector('.ap-piler g');
  let tilstand = { fen: new Chess().fen(), orientering: 'w', sist: null, piler: [], merket: [], laast: true };
  let chess = new Chess();
  let valgt = null;
  let fokus = 'e2';
  let dra = null;

  const ruter = () => {
    const filer = [...FILER];
    const rader = [8, 7, 6, 5, 4, 3, 2, 1];
    if (tilstand.orientering === 'b') { filer.reverse(); rader.reverse(); }
    return rader.flatMap(rad => filer.map(fil => `${fil}${rad}`));
  };
  const kanFlytteFra = felt => !tilstand.laast && chess.get(felt)?.color === chess.turn();
  const lovlige = felt => (felt && !tilstand.laast ? chess.moves({ square: felt, verbose: true }) : []);

  function tegn(beholdFokus = false) {
    const mal = lovlige(valgt);
    const liste = ruter();
    const sjakk = chess.isCheck();
    brett.innerHTML = liste.map((felt, i) => {
      const brikke = chess.get(felt);
      const fil = felt.charCodeAt(0) - 97, rad = Number(felt[1]);
      const til = mal.find(m => m.to === felt);
      const klasser = ['square', (fil + rad) % 2 === 0 ? 'light' : 'dark'];
      if (valgt === felt) klasser.push('selected');
      if (tilstand.sist && [tilstand.sist.from, tilstand.sist.to].includes(felt)) klasser.push('last-move');
      if (sjakk && brikke?.type === 'k' && brikke.color === chess.turn()) klasser.push('in-check');
      if (tilstand.merket.includes(felt)) klasser.push('ap-merket');
      if (dra?.fra === felt && dra.spokelse) klasser.push('ap-dra-kilde');
      // Only squares with a piece to move block scrolling; a swipe elsewhere scrolls the page.
      if (kanFlytteFra(felt)) klasser.push('ap-kan');
      const navn = brikke ? `${brikke.color === 'w' ? 'hvit' : 'svart'} ${NAVN[brikke.type]}` : 'tomt felt';
      const etikett = `${felt}, ${navn}${til ? ', lovlig trekk hit' : ''}${valgt === felt ? ', valgt' : ''}`;
      const kol = i % 8, rekke = Math.floor(i / 8);
      return `<button type="button" class="${klasser.join(' ')}" data-square="${felt}" aria-label="${etikett}" tabindex="${felt === fokus ? 0 : -1}">${kol === 0 ? `<span aria-hidden="true" class="coordinate rank">${rad}</span>` : ''}${rekke === 7 ? `<span aria-hidden="true" class="coordinate file">${felt[0]}</span>` : ''}${brikke ? `<span aria-hidden="true" class="piece ${brikke.color === 'w' ? 'white' : 'black'}">${GLYFER[brikke.type]}</span>` : ''}${til ? `<span aria-hidden="true" class="${til.captured ? 'legal-capture' : 'legal-dot'}"></span>` : ''}</button>`;
    }).join('');
    brett.classList.toggle('ap-laast', tilstand.laast);
    tegnPiler();
    if (beholdFokus) brett.querySelector(`[data-square="${fokus}"]`)?.focus({ preventScroll: true });
  }

  function sentrum(felt) {
    const fil = felt.charCodeAt(0) - 97, rad = Number(felt[1]) - 1;
    return tilstand.orientering === 'w' ? [fil + 0.5, 7 - rad + 0.5] : [7 - fil + 0.5, rad + 0.5];
  }
  function tegnPiler() {
    pilLag.innerHTML = tilstand.piler.map(({ fra, til, type = 'plan' }) => {
      const [x1, y1] = sentrum(fra), [x2, y2] = sentrum(til);
      const lengde = Math.hypot(x2 - x1, y2 - y1) || 1;
      const kort = 0.32;
      const ex = x2 - (x2 - x1) / lengde * kort, ey = y2 - (y2 - y1) / lengde * kort;
      return `<line class="ap-pil ${type}" x1="${x1}" y1="${y1}" x2="${ex}" y2="${ey}" marker-end="url(#ap-spiss-${type})"/>`;
    }).join('');
  }

  function provTrekk(fra, til) {
    const kandidater = chess.moves({ square: fra, verbose: true }).filter(m => m.to === til);
    if (!kandidater.length) return false;
    const trekk = kandidater.find(m => !m.promotion || m.promotion === 'q') ?? kandidater[0];
    valgt = null;
    fokus = til;
    naarTrekk(trekk);
    return true;
  }

  function trykk(felt) {
    if (tilstand.laast) return;
    fokus = felt;
    if (valgt && valgt !== felt && provTrekk(valgt, felt)) return;
    valgt = kanFlytteFra(felt) && valgt !== felt ? felt : null;
    tegn(true);
  }

  brett.addEventListener('click', event => {
    // Pointer input is handled by the pointer events below; this path is for keyboard activation.
    if (event.detail !== 0) return;
    const felt = event.target.closest('[data-square]')?.dataset.square;
    if (felt) trykk(felt);
  });

  brett.addEventListener('pointerdown', event => {
    if (event.button !== 0) return;
    const knapp = event.target.closest('[data-square]');
    if (!knapp || tilstand.laast) return;
    const felt = knapp.dataset.square;
    if (valgt && valgt !== felt && lovlige(valgt).some(m => m.to === felt)) { event.preventDefault(); provTrekk(valgt, felt); return; }
    if (!kanFlytteFra(felt)) {
      fokus = felt;
      // Re-rendering under the finger would disturb a scroll gesture, so only redraw when a selection is cleared.
      if (valgt) { valgt = null; tegn(); } else for (const k of brett.querySelectorAll('[data-square]')) k.tabIndex = k.dataset.square === fokus ? 0 : -1;
      return;
    }
    event.preventDefault();
    dra = { fra: felt, x: event.clientX, y: event.clientY, spokelse: null, varValgt: valgt === felt, id: event.pointerId };
    valgt = felt;
    fokus = felt;
    tegn();
    brett.setPointerCapture?.(event.pointerId);
  });

  brett.addEventListener('pointermove', event => {
    if (!dra || event.pointerId !== dra.id) return;
    if (!dra.spokelse && Math.hypot(event.clientX - dra.x, event.clientY - dra.y) > 6) {
      const kilde = brett.querySelector(`[data-square="${dra.fra}"] .piece`);
      const storrelse = brett.querySelector('.square').getBoundingClientRect().width;
      dra.spokelse = document.createElement('span');
      dra.spokelse.className = `${kilde.className} ap-spokelse`;
      dra.spokelse.textContent = kilde.textContent;
      dra.spokelse.style.fontSize = getComputedStyle(kilde).fontSize;
      dra.spokelse.style.width = dra.spokelse.style.height = `${storrelse}px`;
      document.body.append(dra.spokelse);
      tegn();
    }
    if (dra.spokelse) dra.spokelse.style.transform = `translate(${event.clientX}px, ${event.clientY}px) translate(-50%, -50%)`;
  });

  function sluttDra(event, avbrutt = false) {
    if (!dra || event.pointerId !== dra.id) return;
    const { fra, spokelse, varValgt } = dra;
    dra = null;
    if (spokelse) {
      spokelse.remove();
      const under = avbrutt ? null : document.elementFromPoint(event.clientX, event.clientY)?.closest?.('[data-square]');
      if (under && under.dataset.square !== fra && provTrekk(fra, under.dataset.square)) return;
      tegn();
      return;
    }
    // A plain tap on an already selected piece deselects it.
    if (varValgt) valgt = null;
    tegn();
  }
  brett.addEventListener('pointerup', event => sluttDra(event));
  brett.addEventListener('pointercancel', event => sluttDra(event, true));

  brett.addEventListener('keydown', event => {
    const steg = { ArrowUp: [0, -1], ArrowDown: [0, 1], ArrowLeft: [-1, 0], ArrowRight: [1, 0] }[event.key];
    if (event.key === 'Escape' && valgt) { valgt = null; tegn(true); event.preventDefault(); return; }
    if (!steg) return;
    event.preventDefault();
    const liste = ruter();
    const i = liste.indexOf(fokus);
    const kol = Math.min(7, Math.max(0, (i % 8) + steg[0])), rad = Math.min(7, Math.max(0, Math.floor(i / 8) + steg[1]));
    fokus = liste[rad * 8 + kol];
    for (const knapp of brett.querySelectorAll('[data-square]')) knapp.tabIndex = knapp.dataset.square === fokus ? 0 : -1;
    brett.querySelector(`[data-square="${fokus}"]`).focus();
  });

  return {
    sett(ny) {
      const beholdFokus = brett.contains(document.activeElement);
      tilstand = { ...tilstand, piler: [], merket: [], sist: null, ...ny };
      chess = new Chess(tilstand.fen);
      if (ny.fen) valgt = null;
      tegn(beholdFokus);
    },
    piler(piler) { tilstand.piler = piler; tegnPiler(); },
    rist() { rot.classList.remove('ap-rist'); void rot.offsetWidth; rot.classList.add('ap-rist'); },
    get chess() { return chess; },
  };
}

// "e2e4" strings from the data become arrow objects.
export const piler = (liste = [], type = 'plan') => liste.map(s => ({ fra: s.slice(0, 2), til: s.slice(2, 4), type }));

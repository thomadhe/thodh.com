// A reusable chess board for a chess.js position: drag or click to move, legal-move dots,
// last move, check, a hint ring, promotion choice and arrow-key navigation.
// Squares are rendered in visual order, so a flipped board needs no CSS rotation.
const GLYFER = { k: '♚', q: '♛', r: '♜', b: '♝', n: '♞', p: '♟' };
export const BRIKKENAVN = { p: 'bonde', n: 'springer', b: 'løper', r: 'tårn', q: 'dronning', k: 'konge' };
const fargenavn = c => (c === 'w' ? 'hvit' : 'svart');
const reduserBevegelse = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

export const brikkeHtml = (type, color) => `<span aria-hidden="true" class="piece ${color === 'w' ? 'white' : 'black'}">${GLYFER[type]}</span>`;

export function lagBrett(rot, { kanFlytte = () => true, vedTrekk = () => {} } = {}) {
  let chess = null;
  let orientering = 'w';
  let siste = null;
  let hint = null;
  let markering = null;
  let valgt = null;
  let fokus = 'e2';
  let drag = null;
  let lastFokus = false;

  rot.classList.add('board', 'oppgave-brett');
  rot.setAttribute('role', 'group');
  rot.setAttribute('aria-label', 'Sjakkbrett. Bruk piltastene for å flytte fokus og Enter for å velge brikke og felt.');

  const dialog = document.createElement('dialog');
  dialog.className = 'modal';
  dialog.setAttribute('aria-labelledby', 'forvandling-tittel');
  dialog.innerHTML = '<h2 id="forvandling-tittel">Velg brikke</h2><div class="promotion-options"></div><button class="text-button" type="button" value="">Avbryt</button>';
  document.body.append(dialog);

  const lovlige = felt => (felt && chess && kanFlytte() ? chess.moves({ square: felt, verbose: true }) : []);
  const egen = felt => chess?.get(felt)?.color === chess?.turn();

  function tegn() {
    if (!chess) return;
    const filer = [...'abcdefgh'];
    const rader = [8, 7, 6, 5, 4, 3, 2, 1];
    if (orientering === 'b') { filer.reverse(); rader.reverse(); }
    const mal = lovlige(valgt);
    const aktiv = kanFlytte();
    const iSjakk = chess.isCheck();
    const harFokus = lastFokus || rot.contains(document.activeElement);
    rot.innerHTML = rader.flatMap((rad, r) => filer.map((fil, k) => {
      const felt = `${fil}${rad}`;
      const brikke = chess.get(felt);
      const til = mal.find(m => m.to === felt);
      const sjakk = iSjakk && brikke?.type === 'k' && brikke.color === chess.turn();
      const klasser = ['square', (fil.charCodeAt(0) - 97 + rad) % 2 === 0 ? 'light' : 'dark',
        valgt === felt ? 'selected' : '', siste && (siste.from === felt || siste.to === felt) ? 'last-move' : '',
        sjakk ? 'in-check' : '', hint === felt ? 'hint' : '', markering?.felt === felt ? `merket-${markering.type}` : ''].filter(Boolean).join(' ');
      const navn = `${felt}${brikke ? `, ${fargenavn(brikke.color)} ${BRIKKENAVN[brikke.type]}` : ', tomt felt'}${til ? (til.captured ? ', kan slås' : ', lovlig trekk') : ''}${sjakk ? ', i sjakk' : ''}${hint === felt ? ', hint' : ''}${siste?.to === felt ? ', siste trekk' : ''}`;
      return `<button type="button" class="${klasser}" data-square="${felt}" aria-label="${navn}" aria-pressed="${valgt === felt}" aria-disabled="${!aktiv}" tabindex="${felt === fokus ? 0 : -1}">${k === 0 ? `<span aria-hidden="true" class="coordinate rank">${rad}</span>` : ''}${r === 7 ? `<span aria-hidden="true" class="coordinate file">${fil}</span>` : ''}${brikke ? brikkeHtml(brikke.type, brikke.color) : ''}${til ? `<span class="${til.captured ? 'legal-capture' : 'legal-dot'}" aria-hidden="true"></span>` : ''}</button>`;
    })).join('');
    if (harFokus) rot.querySelector(`[data-square="${fokus}"]`)?.focus({ preventScroll: true });
    lastFokus = false;
  }

  function velgForvandling(farge) {
    dialog.querySelector('.promotion-options').innerHTML = ['q', 'r', 'b', 'n'].map(t => `<button type="button" class="promotion-option" value="${t}" aria-label="Velg ${BRIKKENAVN[t]}">${brikkeHtml(t, farge)}<span>${BRIKKENAVN[t]}</span></button>`).join('');
    return new Promise(svar => {
      const klikk = e => { const b = e.target.closest('button'); if (b) dialog.close(b.value); };
      dialog.addEventListener('click', klikk);
      dialog.addEventListener('close', () => { dialog.removeEventListener('click', klikk); svar(dialog.returnValue || null); }, { once: true });
      dialog.returnValue = '';
      dialog.showModal();
    });
  }

  async function provTrekk(fra, til) {
    const trekk = lovlige(fra).filter(m => m.to === til);
    if (!trekk.length) return false;
    let promotion;
    if (trekk.some(m => m.promotion)) {
      lastFokus = rot.contains(document.activeElement);
      promotion = await velgForvandling(chess.turn());
      if (!promotion) { tegn(); return true; }
    }
    valgt = null;
    fokus = til;
    vedTrekk({ from: fra, to: til, ...(promotion ? { promotion } : {}) });
    return true;
  }

  // Taps and keyboard: pick a piece, then a square.
  async function velgFelt(felt) {
    if (!kanFlytte()) return;
    fokus = felt;
    if (valgt && valgt !== felt && await provTrekk(valgt, felt)) return;
    valgt = valgt !== felt && egen(felt) ? felt : null;
    tegn();
  }

  const feltVed = (x, y) => document.elementFromPoint(x, y)?.closest?.('[data-square]');

  rot.addEventListener('pointerdown', async e => {
    if (e.button !== 0 || !kanFlytte()) return;
    const el = e.target.closest('[data-square]');
    if (!el) return;
    const felt = el.dataset.square;
    if (valgt && valgt !== felt && lovlige(valgt).some(m => m.to === felt)) { e.preventDefault(); await provTrekk(valgt, felt); return; }
    if (!egen(felt)) { if (valgt) { valgt = null; tegn(); } return; }
    e.preventDefault();
    const varValgt = valgt === felt;
    valgt = felt;
    fokus = felt;
    tegn();
    rot.querySelector(`[data-square="${felt}"]`)?.focus({ preventScroll: true });
    drag = { fra: felt, x: e.clientX, y: e.clientY, varValgt, spokelse: null, over: null, id: e.pointerId };
    rot.setPointerCapture(e.pointerId);
  });

  rot.addEventListener('pointermove', e => {
    if (!drag || e.pointerId !== drag.id) return;
    if (!drag.spokelse) {
      if (Math.hypot(e.clientX - drag.x, e.clientY - drag.y) < 6) return;
      const fra = rot.querySelector(`[data-square="${drag.fra}"]`);
      const brikke = fra?.querySelector('.piece');
      if (!brikke) return;
      const storrelse = fra.getBoundingClientRect().width;
      drag.spokelse = brikke.cloneNode(true);
      drag.spokelse.classList.add('drar');
      drag.spokelse.style.cssText = `width:${storrelse}px;height:${storrelse}px;font-size:${getComputedStyle(brikke).fontSize}`;
      document.body.append(drag.spokelse);
      fra.classList.add('drar-fra');
    }
    drag.spokelse.style.transform = `translate(${e.clientX}px, ${e.clientY}px) translate(-50%, -50%)`;
    const over = feltVed(e.clientX, e.clientY);
    if (over !== drag.over) { drag.over?.classList.remove('drag-over'); over?.classList.add('drag-over'); drag.over = over; }
  });

  async function slipp(e, avbrutt) {
    if (!drag || e.pointerId !== drag.id) return;
    const d = drag;
    drag = null;
    d.spokelse?.remove();
    d.over?.classList.remove('drag-over');
    if (avbrutt) { tegn(); return; }
    if (d.spokelse) {
      const til = feltVed(e.clientX, e.clientY)?.dataset.square;
      if (til && til !== d.fra && await provTrekk(d.fra, til)) return;
      tegn();
    } else if (d.varValgt) { valgt = null; tegn(); }
  }
  rot.addEventListener('pointerup', e => slipp(e, false));
  rot.addEventListener('pointercancel', e => slipp(e, true));
  // Pointer input is handled above; a click with detail 0 comes from the keyboard.
  rot.addEventListener('click', e => { const el = e.target.closest('[data-square]'); if (el && e.detail === 0) velgFelt(el.dataset.square); });
  rot.addEventListener('keydown', e => {
    const steg = { ArrowRight: 1, ArrowLeft: -1, ArrowUp: -8, ArrowDown: 8 };
    if (e.key === 'Escape' && valgt) { valgt = null; tegn(); return; }
    if (!(e.key in steg)) return;
    e.preventDefault();
    const felter = [...rot.querySelectorAll('[data-square]')];
    const i = felter.findIndex(b => b.dataset.square === fokus);
    const j = i + steg[e.key];
    if (j < 0 || j >= 64 || (Math.abs(steg[e.key]) === 1 && Math.floor(i / 8) !== Math.floor(j / 8))) return;
    felter[i].tabIndex = -1; felter[j].tabIndex = 0; fokus = felter[j].dataset.square; felter[j].focus();
  });

  return {
    /** Shows a position. Leaves out fields that should stay as they are. */
    vis(tilstand = {}) {
      if ('chess' in tilstand) chess = tilstand.chess;
      if ('orientering' in tilstand) orientering = tilstand.orientering;
      if ('siste' in tilstand) siste = tilstand.siste;
      if ('hint' in tilstand) hint = tilstand.hint;
      if ('markering' in tilstand) markering = tilstand.markering;
      if (valgt && !egen(valgt)) valgt = null;
      if (!kanFlytte()) valgt = null;
      tegn();
    },
    /** Slides the piece on `fra` to `til` in the current drawing; resolves when it lands. */
    animer(fra, til, ms = 260) {
      const a = rot.querySelector(`[data-square="${fra}"]`);
      const b = rot.querySelector(`[data-square="${til}"]`);
      const brikke = a?.querySelector('.piece');
      if (!brikke || !b || reduserBevegelse()) return Promise.resolve();
      const [ra, rb] = [a.getBoundingClientRect(), b.getBoundingClientRect()];
      a.style.zIndex = '5';
      brikke.style.transition = `transform ${ms}ms cubic-bezier(.3,.7,.4,1)`;
      brikke.getBoundingClientRect();
      brikke.style.transform = `translate(${rb.left - ra.left}px, ${rb.top - ra.top}px)`;
      return new Promise(ferdig => setTimeout(ferdig, ms + 20));
    },
    fokuser() { rot.querySelector(`[data-square="${fokus}"]`)?.focus(); },
    settFokus(felt) { fokus = felt; },
    get orientering() { return orientering; },
  };
}

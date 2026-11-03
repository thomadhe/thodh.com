import { Chess } from './vendor/chess.mjs';
import { colorName, pieceNames, premoveTargets } from './game-logic.mjs';
import { createSession, defaults, validateSettings, applyAction, applyPending, advanceTime, clockValues, containsAction, formatClock, noticeFacesOpposite, other, rebuild } from './session.mjs';
import { lesFen, lesRokade, trekkFor, TYPER } from './casino.mjs';
import { casinolyd, forbered, lydPa, settLyd, sjakklyd } from './lyd.mjs';

const $ = selector => document.querySelector(selector);
const apiBase = $('meta[name="chess-api-base"]')?.content ?? '/api/rooms';
const pushUrl = $('meta[name="chess-push"]')?.content;
const board = $('#board');
const setupDialog = $('#setup-dialog');
const noticeDialog = $('#notice-dialog');
const promotionDialog = $('#promotion-dialog');
const glyphs = { k: '♚', q: '♛', r: '♜', b: '♝', n: '♞', p: '♟' };
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
let state = createSession(defaults(), Date.now(), true);
state.status = 'setup';
let chess = new Chess();
let mode = 'local';
let playerColor = 'w';
let flipped = false;
let selected = null;
let focusSquare = 'e2';
let pendingPromotion = null;
let shownNotice = null;
let room = null;
let revision = -1;
let serverOffset = 0;
let busy = false;
let polling = false;
let pollAgain = false;
let lastPoll = 0;
let connected = true;
let localSetupPause = false;
let joining = null;
// Online play shows actions at once. The server snapshot stays the truth; `pending` holds what it has not confirmed yet.
let confirmed = null;
let pending = [];
let sending = false;
let knownRevision = -1;
let premoves = [];
let announceJoin = false;
const now = () => Date.now() + (mode === 'online' ? serverOffset : 0);
const token = () => [...crypto.getRandomValues(new Uint8Array(32))].map(v => v.toString(16).padStart(2, '0')).join('');
const storage = { read(key) { try { return JSON.parse(localStorage.getItem(key)); } catch { return null; } }, write(key, value) { try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* The current tab still works without persistent storage. */ } } };

let messageTimer = null;
function message(text = '', clearAfter = 0) {
  clearTimeout(messageTimer);
  $('#connection-status').textContent = text; $('#connection-status').hidden = !text;
  if (text && clearAfter) messageTimer = setTimeout(() => message(), clearAfter);
}
function pieceMarkup(piece) { return `<span aria-hidden="true" class="piece ${piece.color === 'w' ? 'white' : 'black'}">${glyphs[piece.type]}</span>`; }
function canMove() { return state.status === 'playing' && !state.notices.length && !busy && (mode === 'local' || Boolean(confirmed) && state.turn === playerColor); }
function canPremove() { return mode === 'online' && Boolean(confirmed) && state.status === 'playing' && state.turn !== playerColor && !busy; }
const fancy = () => state.settings.minispill !== 'casino';
const afterPaint = callback => requestAnimationFrame(() => setTimeout(callback, 0));
// Writing the same text or markup again still costs style and layout work, so unchanged values are skipped.
const setText = (element, text) => { if (element.textContent !== text) element.textContent = text; };
const writtenHtml = new WeakMap();
const setHtml = (element, html) => { if (writtenHtml.get(element) === html) return false; element.innerHTML = html; writtenHtml.set(element, html); return true; };

// One chess.js game kept in step with the shown moves. Replaying a whole game costs about a millisecond per move.
const replay = { chess: new Chess(), keys: [] };
const moveKey = move => `${move.from}${move.to}${move.promotion ?? ''}`;
function chessAt(game) {
  try {
    // The previous caller may have played one more move on the shared game.
    const plies = (replay.chess.moveNumber() - 1) * 2 + (replay.chess.turn() === 'b' ? 1 : 0);
    if (plies === replay.keys.length + 1) replay.chess.undo();
    else if (plies !== replay.keys.length) { replay.chess = new Chess(); replay.keys = []; }
    const wanted = game.moves.map(moveKey);
    let same = 0;
    while (same < replay.keys.length && replay.keys[same] === wanted[same]) same++;
    if (replay.keys.length - same > 6) { replay.chess = new Chess(); replay.keys = []; same = 0; }
    while (replay.keys.length > same) { replay.chess.undo(); replay.keys.pop(); }
    for (const move of game.moves.slice(same)) { replay.chess.move({ from: move.from, to: move.to, ...(move.promotion ? { promotion: move.promotion } : {}) }); replay.keys.push(moveKey(move)); }
    return replay.chess;
  } catch {
    replay.chess = new Chess(); replay.keys = [];
    return undefined;
  }
}

const boardView = () => premoves.length ? premoveView() : { get: square => chess.get(square) };

/** The board as the player sees it: queued premoves are already played out. */
function premoveView() {
  const pieces = {};
  for (const file of 'abcdefgh') for (let rank = 1; rank <= 8; rank++) { const piece = chess.get(`${file}${rank}`); if (piece) pieces[`${file}${rank}`] = piece; }
  for (const move of premoves) {
    const piece = pieces[move.from];
    if (!piece) continue;
    delete pieces[move.from];
    pieces[move.to] = piece.type === 'p' && /[18]$/.test(move.to) ? { type: 'q', color: piece.color } : piece;
    if (piece.type === 'k' && move.from[0] === 'e' && 'cg'.includes(move.to[0])) {
      const [rookFrom, rookTo] = move.to[0] === 'g' ? ['h', 'f'] : ['a', 'd'];
      const rook = pieces[`${rookFrom}${move.to[1]}`];
      if (rook) { delete pieces[`${rookFrom}${move.to[1]}`]; pieces[`${rookTo}${move.to[1]}`] = rook; }
    }
  }
  return { get: square => pieces[square] };
}

function renderPlayer(target, color) {
  const lost = state.moves.filter(move => move.captured && move.color !== color).map(move => move.captured);
  const active = state.status === 'playing' && state.turn === color;
  setHtml($(target), `<div class="player-info"><span class="player-avatar ${color === 'w' ? 'white' : 'black'}" aria-hidden="true">♟</span><div><div class="player-name">${colorName(color)}${mode === 'online' && color === playerColor ? ' · deg' : ''}</div><div class="player-meta">${lost.length} ${lost.length === 1 ? 'brikke' : 'brikker'} mistet</div></div></div><div class="captured-pieces" aria-label="Mistede brikker: ${lost.length ? lost.map(type => pieceNames[type]).join(', ') : 'ingen'}">${lost.map(type => glyphs[type]).join(' ')}</div><span class="player-clock" data-clock="${color}" role="timer" aria-label="${colorName(color)} sin partitid"></span>${active ? '<span class="turn-badge">Din tur</span>' : ''}`);
}

let boardOrder = '';
const squares = new Map();
let boardPieces = {};
let skipAnimation = false;
let soundMoves = 0;

function renderBoard(restoreFocus = false) {
  const files = [...'abcdefgh'];
  const ranks = [8, 7, 6, 5, 4, 3, 2, 1];
  if (flipped) { files.reverse(); ranks.reverse(); }
  board.classList.toggle('opposite-player', mode === 'local' && flipped);
  const movable = canMove();
  const premoving = !movable && canPremove();
  const view = boardView();
  const legal = selected && movable ? chess.moves({ square: selected, verbose: true })
    : selected && premoving ? premoveTargets(view.get, selected, playerColor).map(to => ({ to, captured: view.get(to) && view.get(to).color !== playerColor })) : [];
  const last = state.moves.at(-1);
  const queued = new Set(premoves.flatMap(move => [move.from, move.to]));
  const pieces = {};
  // The 64 buttons are kept and only changed squares are touched, so a move costs a few DOM writes.
  const order = files.join('') + ranks.join('');
  if (order !== boardOrder) {
    boardOrder = order;
    board.innerHTML = ranks.flatMap(rank => files.map(file => `<button type="button" data-square="${file}${rank}"></button>`)).join('');
    squares.clear();
    for (const element of board.children) squares.set(element.dataset.square, { element });
  }
  let moved = false;
  ranks.forEach((rank, row) => files.forEach((file, col) => {
    const square = `${file}${rank}`;
    const piece = view.get(square);
    if (piece) pieces[square] = { code: `${piece.color}${piece.type}`, row, col };
    if (boardPieces[square]?.code !== pieces[square]?.code) moved = true;
    const destination = legal.find(move => move.to === square);
    const check = piece?.type === 'k' && piece.color === state.turn && chess.isCheck();
    const next = {
      className: ['square', (file.charCodeAt(0) - 97 + rank) % 2 === 0 ? 'light' : 'dark', selected === square ? 'selected' : '', last && [last.from, last.to].includes(square) ? 'last-move' : '', queued.has(square) ? 'premove' : '', check ? 'in-check' : ''].filter(Boolean).join(' '),
      'aria-label': `${square}${piece ? `, ${colorName(piece.color).toLowerCase()} ${pieceNames[piece.type]}` : ', tomt felt'}${destination ? (premoving ? ', mulig forhåndstrekk' : ', lovlig trekk') : ''}${check ? ', i sjakk' : ''}`,
      'aria-pressed': String(selected === square),
      'aria-disabled': String(!movable && !premoving),
      tabindex: square === focusSquare ? '0' : '-1',
      html: `${col === 0 ? `<span aria-hidden="true" class="coordinate rank">${rank}</span>` : ''}${row === 7 ? `<span aria-hidden="true" class="coordinate file">${file}</span>` : ''}${piece ? pieceMarkup(piece) : ''}${destination ? `<span class="${destination.captured ? 'legal-capture' : 'legal-dot'}" aria-hidden="true"></span>` : ''}`,
    };
    const shown = squares.get(square);
    for (const [key, value] of Object.entries(next)) {
      if (shown[key] === value) continue;
      shown[key] = value;
      if (key === 'className') shown.element.className = value;
      else if (key === 'html') shown.element.innerHTML = value;
      else shown.element.setAttribute(key, value);
    }
  }));
  if (moved && !skipAnimation && fancy()) slide(boardPieces, pieces);
  skipAnimation = false;
  if (drag?.moved) board.querySelector(`[data-square="${drag.from}"] .piece`)?.classList.add('drag-origin');
  boardPieces = pieces;
  if (restoreFocus) { const target = squares.get(focusSquare)?.element; if (target && document.activeElement !== target) target.focus({ preventScroll: true }); }
}

/** Slides pieces that changed square, like a move, castling or a rollback. Big jumps (a new game) just appear. */
function slide(before, after) {
  if (reducedMotion.matches) return;
  const arrived = Object.keys(after).filter(square => before[square]?.code !== after[square].code);
  if (!arrived.length || arrived.length > 3) return;
  const size = board.clientWidth / 8;
  for (const square of arrived) {
    const code = after[square].code;
    const from = Object.keys(before).find(source => before[source].code === code && after[source]?.code !== code);
    if (!from) continue;
    const piece = board.querySelector(`[data-square="${square}"] .piece`);
    const dx = (before[from].col - after[square].col) * size, dy = (before[from].row - after[square].row) * size;
    piece?.animate([{ transform: `translate(${dx}px, ${dy}px)`, zIndex: 3 }, { transform: 'none', zIndex: 3 }], { duration: 160, easing: 'cubic-bezier(.2, .7, .3, 1)' });
  }
}

function renderClocks() {
  const values = clockValues(state, now());
  for (const color of ['w', 'b']) {
    const element = $(`[data-clock="${color}"]`);
    if (element) { setText(element, formatClock(values.remaining[color])); element.classList.toggle('urgent', values.remaining[color] !== null && values.remaining[color] <= 10000); }
  }
  setText($('#turn-timer'), formatClock(values.deadline));
  setText($('#timer-state'), state.status === 'finished' ? 'Ferdig' : state.startedAt === null ? 'Pause' : colorName(state.turn));
  setText($('#clock-increment'), state.settings.players[state.turn].increment ? `+${state.settings.players[state.turn].increment} s / trekk` : '');
  const duration = state.settings.players[state.turn].deadline * 1000;
  const width = `${duration ? Math.min(100, values.deadline / duration * 100).toFixed(1) : 100}%`;
  if ($('#timer-progress').style.width !== width) $('#timer-progress').style.width = width;
  $('.clock-panel').classList.toggle('urgent', values.deadline !== null && values.deadline <= 10000 && state.status === 'playing');
}

function syncNotice() {
  const notice = state.notices[0];
  // A casino "no win" waits until its reels have been spun with the lever.
  if (notice?.kind === 'casino' && notice.hjul && trukketVarsel !== notice.id) { if (noticeDialog.open) noticeDialog.close(); shownNotice = null; return; }
  if (!notice) { shownNotice = null; if (noticeDialog.open) noticeDialog.close(); return; }
  if (shownNotice !== notice.id) {
    if (promotionDialog.open) promotionDialog.close();
    if (setupDialog.open) setupDialog.close();
    if ($('#resign-dialog').open) $('#resign-dialog').close();
    pendingPromotion = null;
    selected = null;
    shownNotice = notice.id;
    $('#notice-icon').textContent = notice.icon;
    $('#notice-title').textContent = notice.title;
    $('#notice-description').textContent = notice.description;
    $('#notice-label').textContent = `TIL ${colorName(notice.recipient).toUpperCase()}`;
    noticeDialog.classList.toggle('facing-black', noticeFacesOpposite(notice, mode));
    if (!noticeDialog.open) noticeDialog.showModal();
  }
  const mine = mode === 'local' || notice.recipient === playerColor;
  $('#notice-continue').hidden = !mine;
  $('#notice-continue').disabled = busy;
  $('#notice-continue').textContent = 'Fortsett';
  $('#notice-waiting').hidden = mine;
  $('#notice-waiting').textContent = `Venter på at ${colorName(notice.recipient).toLowerCase()} trykker Fortsett.`;
}

function render() {
  document.body.classList.toggle('online', mode === 'online');
  chess = state.settings.minispill === 'casino' ? casinoBrett(state) : new Chess(state.fen);
  if (selected && !(boardView()).get(selected)) selected = null;
  renderBoard(board.contains(document.activeElement));
  renderPlayer('#top-player', mode === 'online' ? other(playerColor) : 'b');
  renderPlayer('#bottom-player', mode === 'online' ? playerColor : 'w');
  const title = state.status === 'setup' ? 'Klar for et parti?' : state.status === 'waiting' ? 'Venter på en venn' : state.result?.title ?? `${colorName(state.turn)} sin tur`;
  setText($('#status'), title);
  setText($('#status-detail'), state.status === 'setup' ? 'Velg tid og variant for å starte.' : state.status === 'waiting' ? 'Del invitasjonslenken for å starte.' : state.result?.description ?? (state.notices.length ? 'Spillet er på pause mens beskjeden vises.' : chess.isCheck() ? `${colorName(state.turn)} står i sjakk. Beskytt kongen.` : mode === 'online' && state.turn !== playerColor ? (premoves.length ? `Forhåndstrekk: ${premoves.map(move => `${move.from}–${move.to}`).join(', ')}. Trykk på et tomt felt for å avbryte.` : 'Venter på motspillerens trekk.') : state.settings.minispill === 'casino' ? 'Flytt brikkene hjulene viser. Sjakk er lov – den som slår kongen, vinner.' : 'Velg en brikke for å se lovlige trekk.'));
  setText($('#turn-piece'), state.result?.icon ?? '♟');
  setText($('#mode-label'), mode === 'online' ? `NETTSPILL · DU ER ${colorName(playerColor).toUpperCase()}` : 'PÅ SAMME SKJERM');
  setText($('#seat-help'), mode === 'online' ? 'Hver spiller har sitt eget brett.' : 'Hvit sitter her. Svart sitter på motsatt side.');
  $('#flip').hidden = mode === 'online';
  $('#resign').hidden = state.status !== 'playing';
  $('#rematch').hidden = !(mode === 'online' && state.status === 'finished' && confirmed);
  $('#invite-panel').hidden = !(mode === 'online' && state.status === 'waiting' && room?.inviteToken);
  if (room?.inviteToken) $('#invite-link').value = `${location.origin}${location.pathname}#room=${room.id}&invite=${room.inviteToken}`;
  setText($('#move-count'), `${state.moves.length} trekk`);
  let historyHtml = state.moves.length ? Array.from({ length: Math.ceil(state.moves.length / 2) }, (_, i) => `<div class="move-row"><span class="move-number">${i + 1}.</span><span>${state.moves[2 * i].san.replace('#', '')}</span><span>${(state.moves[2 * i + 1]?.san ?? '—').replace('#', '')}</span></div>`).join('') : '<p class="empty-history">Ingen trekk ennå.</p>';
  if (state.settings.minispill === 'casino' && state.moves.length) {
    // Up to three moves per turn, so group by turn instead of white/black pairs.
    const turer = [];
    for (const move of state.moves) {
      if (turer.at(-1)?.color === move.color) turer.at(-1).san.push(move.san);
      else turer.push({ color: move.color, san: [move.san] });
    }
    historyHtml = turer.map((tur, i) => `<div class="move-row"><span class="move-number">${i + 1}.</span><span>${colorName(tur.color)}</span><span>${tur.san.join(' ')}</span></div>`).join('');
  }
  if (setHtml($('#history'), historyHtml)) $('#history').scrollTop = $('#history').scrollHeight;
  const training = state.settings.variant === 'training';
  setText($('#variant-label'), training ? 'EN AKTIV RUNDE' : 'EN LITEN VRI');
  setText($('#variant-icon'), training ? '💪' : '😈');
  setText($('#variant-title'), training ? 'En brikke mindre. En øvelse mer.' : 'En brikke mindre. Et plagg mindre.');
  setText($('#variant-description'), training ? Object.entries(state.settings.exercises).filter(([, reps]) => reps).map(([name, reps]) => `${reps} ${name}`).join(' · ') : 'Vinneren får massasje.');
  setText($('#variant-prize'), training ? 'Sjakk for hodet. Bevegelse for kroppen.' : 'Vinneren? Massasjetid.');
  renderCasino();
  renderClocks();
  syncNotice();
  // One sound per new move in online play; replays and reloads stay quiet.
  if (mode === 'online' && state.moves.length === soundMoves + 1) { const captured = Boolean(state.moves.at(-1).captured); afterPaint(() => sjakklyd.trekk(captured)); }
  soundMoves = state.moves.length;
  shownKey = viewKey();
  if (premoves.length) queueMicrotask(playPremove);
}

// ---- Casinosjakk: pull the lever, watch the reels, move the pieces they show ----

// Which spin the player has revealed with the lever. Until then the board stays locked.
let trukketRunde = null;
let trukketVarsel = null;
let spinner = false;

/** The reels waiting for the lever: a failed spin (shown before its "no win" notice) or the new spin. */
function ventendeSpinn() {
  if (state.settings.minispill !== 'casino' || !state.casino || state.status === 'setup') return null;
  const varsel = state.notices[0];
  if (varsel?.kind === 'casino' && varsel.hjul && trukketVarsel !== varsel.id) return { hjul: varsel.hjul, status: varsel.hjul.map(() => 'tom'), farge: varsel.recipient, varsel: varsel.id };
  if (!state.notices.length && state.status === 'playing' && trukketRunde !== state.casino.runde) return { ...state.casino, farge: state.turn };
  return null;
}

function casinoBrett(game) {
  const brett = lesFen(game.fen);
  const opplast = trukketRunde === game.casino?.runde && !spinner;
  const igjen = new Set(opplast ? (game.casino?.hjul ?? []).filter((_, i) => game.casino.status[i] === 'klar') : []);
  return {
    get: square => brett[square],
    moves: ({ square }) => { const piece = brett[square]; return piece && piece.color === game.turn && igjen.has(piece.type) ? trekkFor(brett, square, lesRokade(game.fen)) : []; },
    isCheck: () => false,
  };
}

const reels = () => [...document.querySelectorAll('[data-hjul]')];
const visBrikke = (el, type, color) => { el.innerHTML = pieceMarkup({ type, color }); };

function visHjul(hjul, status, color) {
  reels().forEach((el, i) => {
    visBrikke(el, hjul[i], color);
    el.className = `hjul ${status[i]}`;
    el.setAttribute('aria-label', `${pieceNames[hjul[i]]}: ${status[i] === 'klar' ? 'skal flyttes' : status[i] === 'brukt' ? 'flyttet' : 'kan ikke flytte'}`);
  });
}

/** Pull the lever: the reels roll for a while and stop one by one, then the board unlocks. */
function trekkSpak() {
  const spinn = ventendeSpinn();
  if (!spinn || spinner) return;
  spinner = true;
  casinolyd.spak();
  const spak = $('#spak');
  spak.classList.add('trukket');
  setTimeout(() => spak.classList.remove('trukket'), 450);
  const stopp = [1500, 2200, 2900];
  const start = performance.now() + 250;
  let sisteKlikk = 0;
  reels().forEach(el => { el.className = 'hjul spinner'; });
  $('#casino-tekst').textContent = 'Lykke til …';
  const steg = () => {
    const t = performance.now() - start;
    let ruller = false;
    reels().forEach((el, i) => {
      if (t < 0) return;
      if (t < stopp[i]) {
        ruller = true;
        // Ticks slow down as the last reel gets close to stopping.
        if (performance.now() - sisteKlikk > 70 + 90 * (t / stopp[2])) visBrikke(el, TYPER[Math.floor(Math.random() * TYPER.length)], spinn.farge);
      } else if (el.classList.contains('spinner')) {
        visBrikke(el, spinn.hjul[i], spinn.farge);
        el.className = `hjul ${spinn.status[i]} landet`;
        casinolyd.stopp();
      }
    });
    if (ruller && performance.now() - sisteKlikk > 70 + 90 * (Math.max(0, t) / stopp[2])) { casinolyd.rulle(); sisteKlikk = performance.now(); }
    if (t < stopp[2] + 50) { requestAnimationFrame(steg); return; }
    spinner = false;
    if (spinn.varsel) {
      casinolyd.tap();
      trukketVarsel = spinn.varsel;
    } else {
      if (spinn.status.includes('klar')) casinolyd.gevinst();
      trukketRunde = spinn.runde;
    }
    setTimeout(render, spinn.varsel ? 700 : 300);
  };
  requestAnimationFrame(steg);
}

function renderCasino() {
  const aktiv = state.settings.minispill === 'casino' && state.casino && state.status !== 'setup';
  $('#casino-panel').hidden = !aktiv;
  if (!aktiv || spinner) return;
  const venter = ventendeSpinn();
  const spak = $('#spak');
  spak.disabled = !venter || (mode === 'online');
  spak.classList.toggle('klar', Boolean(venter));
  $('#lyd-av').textContent = lydPa() ? '🔊' : '🔇';
  if (venter) {
    reels().forEach(el => { el.innerHTML = '<span class="spm" aria-hidden="true">?</span>'; el.className = 'hjul skjult'; el.setAttribute('aria-label', 'Ikke spunnet ennå'); });
    $('#casino-tekst').textContent = `${colorName(venter.farge)}: trekk i spaken!`;
    return;
  }
  const { hjul, status } = state.casino;
  visHjul(hjul, status, state.turn);
  const igjen = hjul.filter((_, i) => status[i] === 'klar').map(type => pieceNames[type]);
  $('#casino-tekst').textContent = state.status !== 'playing' ? '' : igjen.length ? `Flytt: ${igjen.join(', ')}` : 'Turen går videre';
}

$('#spak').addEventListener('click', trekkSpak);
$('#lyd-av').addEventListener('click', () => { settLyd(!lydPa()); renderCasino(); });

// ---- Server requests ----

// Clock offset from the fastest round trip seen lately, so clocks don't jump with network jitter.
let bestTrip = Infinity;
let bestTripAt = 0;
function noteServerTime(serverNow, sent, received) {
  if (typeof serverNow !== 'number') return;
  const trip = received - sent;
  if (trip > bestTrip * 1.25 && performance.now() - bestTripAt < 30000) return;
  bestTrip = trip; bestTripAt = performance.now();
  serverOffset = serverNow - (sent + received) / 2;
}

async function request(path, data, credentials, timeout = 12000) {
  const sent = Date.now();
  let response;
  try { response = await fetch(path.replace(/^\/api\/rooms/, apiBase), { method: data === undefined ? 'GET' : 'POST', headers: { ...(data !== undefined ? { 'Content-Type': 'application/json' } : {}), ...(credentials ? { Authorization: `Bearer ${credentials.token}` } : {}) }, ...(data !== undefined ? { body: JSON.stringify(data) } : {}), signal: AbortSignal.timeout(timeout), cache: 'no-store' }); }
  catch { throw new Error('Kunne ikke nå nettspillet. Prøv igjen om litt.'); }
  if (!response.headers.get('Content-Type')?.includes('application/json')) throw new Error('Kunne ikke nå nettspillet. Prøv igjen om litt.');
  const result = await response.json();
  noteServerTime(result.serverNow, sent, Date.now());
  // 5xx is the gateway or game server being unavailable: worth retrying. 4xx is the server's answer.
  if (!response.ok) throw Object.assign(new Error(result.error ?? 'Kunne ikke nå nettspillet.'), { snapshot: result.state ? result : null, status: response.status < 500 ? response.status : undefined });
  return result;
}

function setConnected(value) {
  if (connected === value) return;
  connected = value;
  if (mode !== 'online') return;
  if (value) message('Tilkoblet igjen. Partiet er oppdatert.', 2500);
  else message('Mistet forbindelsen. Kobler til igjen …');
}

/** What the full render depends on, apart from clocks. */
const viewKey = () => [state.fen, state.moves.length, state.status, state.notices.map(notice => notice.id).join(), state.startedAt === null, playerColor, Boolean(confirmed), premoves.length].join('|');
let shownKey = '';

// Own actions the server hasn't confirmed survive a reload of the tab and are sent again if they still fit.
// A saved premove may be built on an opponent move the server doesn't have yet; it waits for that revision.
let parked = [];
function savePending() {
  if (!room) return;
  try { sessionStorage.setItem(`sjakk-pending:${room.id}`, JSON.stringify([...parked, ...pending.filter(entry => entry.own)])); } catch { /* Only this page load keeps them. */ }
}
function savedPending(id) {
  try { return (JSON.parse(sessionStorage.getItem(`sjakk-pending:${id}`)) ?? []).filter(entry => entry && entry.own && Number.isInteger(entry.base) && validHint(entry.action)).map(entry => ({ ...entry, since: performance.now() })); } catch { return []; }
}

function acceptSnapshot(snapshot) {
  if (!room || snapshot.roomId !== room.id || snapshot.revision < revision) return;
  revision = snapshot.revision;
  knownRevision = Math.max(knownRevision, revision);
  playerColor = snapshot.color;
  confirmed = snapshot.state;
  flipped = playerColor === 'b';
  if (snapshot.push) joinPush(snapshot.push);
  // Unconfirmed hints from the opponent expire; our own actions wait for the server's answer.
  const time = performance.now();
  parked = parked.filter(entry => entry.base >= revision && time - entry.since < 10000);
  if (parked.length && !pending.length && parked[0].base === revision) { pending = parked; parked = []; }
  const rebuilt = rebuild(confirmed, revision, pending.filter(entry => entry.own || time - entry.since < 6000), chessAt);
  pending = rebuilt.kept;
  state = rebuilt.state;
  savePending();
  setConnected(true);
  if (viewKey() !== shownKey) render(); else renderClocks();
  if (pending.some(entry => entry.own)) flush();
}

// ---- Online actions: shown at once, sent in order, confirmed or rolled back by the server ----

function perform(action) {
  if (busy) return;
  if (mode === 'local') {
    try {
      const actor = action.type === 'ack' ? state.notices[0]?.recipient : state.turn;
      applyAction(state, action, actor, now(), action.type === 'move' && fancy() ? chessAt(state) : undefined);
      selected = null;
      flipped = state.turn === 'b';
      render();
    } catch (error) { message(error.message); }
    return;
  }
  if (!room || !confirmed) return;
  const entry = { base: revision + pending.length, action, actor: playerColor, at: now(), own: true, since: performance.now(), index: state.moves.length };
  const next = structuredClone(state);
  if (!applyPending(next, entry, chessAt)) { render(); return; }
  state = next;
  pending.push(entry);
  savePending();
  selected = null;
  hint('act', { b: entry.base, a: action, c: entry.actor });
  render();
  flush();
}

let retryTimer = null;
let retryDelay = 150;
function retry(delay) { clearTimeout(retryTimer); retryTimer = setTimeout(() => { flush(); if (!pending.some(entry => entry.own)) poll(); }, delay); }

async function flush() {
  if (sending || !room) return;
  const entry = pending.find(item => item.own);
  // A premove on top of an unconfirmed opponent move waits until the server has that move.
  if (!entry || entry.base > Math.max(revision, knownRevision)) return;
  sending = true;
  const activeRoom = room;
  try {
    const snapshot = await request(`/api/rooms/${room.id}/action`, { action: entry.action, revision: entry.base }, room, 8000);
    if (room !== activeRoom) return;
    retryDelay = 150;
    acceptSnapshot(snapshot);
    hint('sync', { r: snapshot.revision });
  } catch (error) {
    if (room !== activeRoom) return;
    const snapshot = error.snapshot;
    if (!error.status) { setConnected(false); retry(retryDelay); retryDelay = Math.min(2000, retryDelay * 2); return; }
    if (snapshot && snapshot.revision < entry.base) { acceptSnapshot(snapshot); retry(retryDelay); retryDelay = Math.min(2000, retryDelay * 2); return; }
    if (snapshot && snapshot.revision > entry.base && containsAction(snapshot.state, entry)) { acceptSnapshot(snapshot); hint('sync', { r: snapshot.revision }); return; }
    // Rejected: drop it and everything built on it, then show the server's position.
    pending = pending.filter(item => item.base < entry.base);
    savePending();
    premoves = [];
    if (snapshot) acceptSnapshot(snapshot);
    else if (confirmed) { const rebuilt = rebuild(confirmed, revision, pending, chessAt); pending = rebuilt.kept; state = rebuilt.state; render(); }
    message(error.message, 4000);
  } finally {
    sending = false;
    if (room === activeRoom && pending.some(item => item.own && item.base <= Math.max(revision, knownRevision))) flush();
  }
}

function playPremove() {
  if (!premoves.length || mode !== 'online' || !canMove()) return;
  const [next, ...rest] = premoves;
  const legal = chess.moves({ square: next.from, verbose: true }).filter(move => move.to === next.to);
  // Like Lichess: a premove that no longer fits cancels the whole queue.
  if (!legal.length) { premoves = []; render(); return; }
  premoves = rest;
  perform({ type: 'move', from: next.from, to: next.to, ...(legal.some(move => move.promotion) ? { promotion: 'q' } : {}) });
}

function validHint(action) {
  const square = value => typeof value === 'string' && /^[a-h][1-8]$/.test(value);
  if (!action || typeof action !== 'object') return null;
  if (action.type === 'move' && square(action.from) && square(action.to) && (action.promotion === undefined || ['q', 'r', 'b', 'n'].includes(action.promotion))) return { type: 'move', from: action.from, to: action.to, ...(action.promotion ? { promotion: action.promotion } : {}) };
  if (action.type === 'ack' && Number.isInteger(action.noticeId)) return { type: 'ack', noticeId: action.noticeId };
  if (action.type === 'resign') return { type: 'resign' };
  return null;
}

let confirmTimer = null;
// Whether the other tab sends hints. Until it does (an older version, or no push), keep polling every second.
let heardOpponent = false;
/** Realtime hints from the other player. They only change what is shown until the server confirms. */
function onHint(event, payload) {
  if (mode !== 'online' || !room || !confirmed || !payload) return;
  if (!heardOpponent && event !== 'rematch') { heardOpponent = true; if (event !== 'hello') hint('hello', {}); }
  if (event === 'hello') { if (payload.r !== true) hint('hello', { r: true }); return; }
  if (event === 'act') {
    const action = validHint(payload.a);
    if (!action || payload.c !== other(playerColor)) return;
    if (payload.b !== revision + pending.length) { if (payload.b > revision + pending.length) poll(); return; }
    const entry = { base: payload.b, action, actor: payload.c, at: now(), own: false, since: performance.now(), index: state.moves.length };
    const next = structuredClone(state);
    if (!applyPending(next, entry, chessAt)) { poll(); return; }
    state = next;
    pending.push(entry);
    render();
    // Normally the opponent's "sync" arrives first; this covers a lost one.
    clearTimeout(confirmTimer);
    confirmTimer = setTimeout(() => { if (pending.some(item => !item.own)) poll(); }, 2500);
  } else if (event === 'sync' && Number.isInteger(payload.r) && payload.r > revision) {
    knownRevision = Math.max(knownRevision, payload.r);
    if (pending.some(entry => entry.own && entry.base <= knownRevision)) flush();
    else poll();
  } else if (event === 'rematch' && typeof payload.id === 'string' && typeof payload.invite === 'string' && state.status === 'finished') {
    acceptRematch(payload.id, payload.invite);
  }
}

// ---- Realtime push (Supabase Realtime broadcast over a plain Phoenix WebSocket) ----

const live = { socket: null, topic: null, joinedTopic: null, joined: false, joinRef: null, beat: null, ref: 0, attempt: 0, timer: null };

function pushSend(topic, event, payload, ref = String(++live.ref)) {
  if (live.socket?.readyState !== WebSocket.OPEN) return false;
  live.socket.send(JSON.stringify({ topic, event, payload, ref, join_ref: live.joinRef }));
  return true;
}

function openPush() {
  clearTimeout(live.timer);
  if (!pushUrl || live.socket || mode !== 'online' && !joining || navigator.onLine === false) return;
  const socket = new WebSocket(pushUrl);
  live.socket = socket;
  socket.onopen = () => { live.attempt = 0; subscribePush(); };
  socket.onmessage = event => {
    let data;
    try { data = JSON.parse(event.data); } catch { return; }
    if (data.event === 'phx_reply' && data.ref === live.joinRef) {
      live.joined = data.payload?.status === 'ok';
      if (!live.joined) { socket.close(); return; }
      if (announceJoin) { announceJoin = false; hint('sync', { r: revision }); }
      else hint('hello', {});
      // Anything that happened while the socket was down.
      poll();
    } else if (data.event === 'phx_reply' && data.ref === live.beat) live.beat = null;
    else if (data.event === 'broadcast' && data.topic === `realtime:${live.joinedTopic}`) onHint(data.payload?.event, data.payload?.payload);
    else if ((data.event === 'phx_error' || data.event === 'phx_close') && data.topic === `realtime:${live.joinedTopic}`) socket.close();
  };
  socket.onerror = () => socket.close();
  socket.onclose = () => {
    if (live.socket !== socket) return;
    Object.assign(live, { socket: null, joined: false, joinedTopic: null, beat: null });
    live.timer = setTimeout(openPush, Math.min(2000, 250 * 2 ** live.attempt++));
  };
}

function subscribePush() {
  if (!live.topic || live.joinedTopic === live.topic || live.socket?.readyState !== WebSocket.OPEN) return;
  if (live.joinedTopic) pushSend(`realtime:${live.joinedTopic}`, 'phx_leave', {});
  live.joined = false;
  live.joinRef = String(++live.ref);
  live.joinedTopic = live.topic;
  pushSend(`realtime:${live.topic}`, 'phx_join', { config: { broadcast: { self: false, ack: false }, presence: { key: '', enabled: false }, postgres_changes: [], private: false } }, live.joinRef);
}

function joinPush(topic) {
  if (typeof topic !== 'string' || !/^sjakk-[0-9a-f]{32}$/.test(topic)) return;
  live.topic = topic;
  if (live.socket) subscribePush(); else openPush();
}

function closePush() {
  const socket = live.socket;
  Object.assign(live, { socket: null, topic: null, joined: false, joinedTopic: null, beat: null });
  clearTimeout(live.timer);
  socket?.close();
}

function hint(event, payload) {
  if (live.joined) pushSend(`realtime:${live.joinedTopic}`, 'broadcast', { type: 'broadcast', event, payload });
}

setInterval(() => {
  if (live.socket?.readyState !== WebSocket.OPEN) return;
  // No answer to the previous heartbeat: the connection is dead even if the socket hasn't noticed.
  if (live.beat) { live.socket.close(); return; }
  live.beat = String(++live.ref);
  pushSend('phoenix', 'heartbeat', {}, live.beat);
}, 10000);

// ---- Board input: click, keyboard and drag and drop ----

function choosePremove(square) {
  focusSquare = square;
  const view = boardView();
  if (selected && selected !== square && premoveTargets(view.get, selected, playerColor).includes(square)) {
    if (premoves.length < 8) premoves.push({ from: selected, to: square });
    selected = null;
    render();
    return;
  }
  if (selected === square) selected = null;
  else if (view.get(square)?.color === playerColor) selected = square;
  else { selected = null; premoves = []; render(); return; }
  renderBoard(true);
}

function chooseSquare(square) {
  if (mode === 'local' && advanceTime(state, now())) { render(); return; }
  if (setupDialog.open || promotionDialog.open) return;
  if (!canMove()) { if (canPremove()) choosePremove(square); return; }
  focusSquare = square;
  if (selected === square) { selected = null; renderBoard(true); return; }
  if (selected) {
    const moves = chess.moves({ square: selected, verbose: true }).filter(move => move.to === square);
    if (moves.length) {
      if (moves.some(move => move.promotion)) {
        pendingPromotion = { from: selected, to: square };
        $('#promotion-options').innerHTML = ['q', 'r', 'b', 'n'].map(type => `<button type="button" class="promotion-option" data-promotion="${type}" aria-label="Velg ${pieceNames[type]}">${pieceMarkup({ type, color: state.turn })}<span>${pieceNames[type]}</span></button>`).join('');
        promotionDialog.classList.toggle('facing-black', mode === 'local' && state.turn === 'b');
        promotionDialog.showModal();
      } else perform({ type: 'move', from: selected, to: square });
      return;
    }
  }
  selected = chess.get(square)?.color === state.turn ? square : null;
  renderBoard(true);
}

// Dragging moves a fixed-position copy of the piece with transforms only, so nothing reflows while it moves.
let drag = null;
let swallowClick = false;
function draggable(square) {
  if (!fancy() || setupDialog.open || promotionDialog.open) return false;
  if (canMove()) return chess.get(square)?.color === state.turn;
  if (!canPremove()) return false;
  const view = boardView();
  // A tap on a premove target that holds an own piece (a recapture) is a premove, not a new selection.
  if (selected && selected !== square && premoveTargets(view.get, selected, playerColor).includes(square)) return false;
  return view.get(square)?.color === playerColor;
}
function paintDrag() {
  if (!drag?.ghost) return;
  drag.frame = 0;
  drag.ghost.style.transform = `translate3d(${drag.x - drag.halfWidth}px, ${drag.y - drag.halfHeight}px, 0)${board.classList.contains('opposite-player') ? ' rotate(180deg)' : ''} scale(1.12)`;
}
function endDrag() {
  if (!drag) return null;
  const ended = drag;
  drag = null;
  cancelAnimationFrame(ended.frame);
  ended.ghost?.remove();
  board.querySelector('.drag-origin')?.classList.remove('drag-origin');
  if (board.hasPointerCapture(ended.pointerId)) board.releasePointerCapture(ended.pointerId);
  return ended;
}
board.addEventListener('pointerdown', event => {
  swallowClick = false;
  if (event.button !== 0 || drag) return;
  const square = event.target.closest('[data-square]')?.dataset.square;
  if (!square || !draggable(square)) return;
  event.preventDefault();
  board.setPointerCapture(event.pointerId);
  drag = { pointerId: event.pointerId, from: square, x: event.clientX, y: event.clientY, startX: event.clientX, startY: event.clientY, moved: false, wasSelected: selected === square, ghost: null, frame: 0, halfWidth: 0, halfHeight: 0 };
  focusSquare = square;
  if (selected !== square) { selected = square; renderBoard(); }
  const pressed = squares.get(square)?.element;
  if (pressed && document.activeElement !== pressed) pressed.focus({ preventScroll: true });
});
board.addEventListener('pointermove', event => {
  if (!drag || event.pointerId !== drag.pointerId) return;
  drag.x = event.clientX; drag.y = event.clientY;
  if (!drag.moved) {
    if (Math.hypot(drag.x - drag.startX, drag.y - drag.startY) < 5) return;
    const origin = board.querySelector(`[data-square="${drag.from}"] .piece`);
    if (!origin) return;
    drag.moved = true;
    const ghost = origin.cloneNode(true);
    ghost.classList.add('drag-ghost');
    ghost.style.fontSize = getComputedStyle(origin).fontSize;
    document.body.append(ghost);
    drag.ghost = ghost;
    drag.halfWidth = ghost.offsetWidth / 2; drag.halfHeight = ghost.offsetHeight / 2;
    origin.classList.add('drag-origin');
    paintDrag();
  }
  if (!drag.frame) drag.frame = requestAnimationFrame(paintDrag);
});
board.addEventListener('pointerup', event => {
  if (!drag || event.pointerId !== drag.pointerId) return;
  const ended = endDrag();
  swallowClick = true;
  if (!ended.moved) {
    // A tap: the first one selects (already done on pointerdown), a second one deselects.
    if (ended.wasSelected) { selected = null; renderBoard(true); }
    return;
  }
  const target = document.elementFromPoint(event.clientX, event.clientY)?.closest('#board [data-square]')?.dataset.square;
  if (!target || target === ended.from) { renderBoard(); return; }
  selected = ended.from;
  skipAnimation = true;
  chooseSquare(target);
  skipAnimation = false;
});
board.addEventListener('pointercancel', event => { if (drag?.pointerId === event.pointerId) { endDrag(); renderBoard(); } });
board.addEventListener('click', event => {
  // The pointer handlers already took care of this press; keyboard presses (detail 0) always count.
  if (swallowClick && event.detail) { swallowClick = false; return; }
  const square = event.target.closest('[data-square]'); if (square) chooseSquare(square.dataset.square);
});
board.addEventListener('contextmenu', event => { if (premoves.length) { event.preventDefault(); premoves = []; selected = null; render(); } });
board.addEventListener('keydown', event => {
  if (event.key === 'Escape' && premoves.length) { premoves = []; selected = null; render(); return; }
  const steps = { ArrowRight: 1, ArrowLeft: -1, ArrowUp: -8, ArrowDown: 8 };
  if (!(event.key in steps)) return;
  event.preventDefault();
  const squares = [...board.querySelectorAll('[data-square]')];
  const index = squares.findIndex(button => button.dataset.square === focusSquare);
  const step = steps[event.key] * (mode === 'local' && flipped ? -1 : 1);
  const target = index + step;
  if (target < 0 || target >= 64 || (Math.abs(step) === 1 && Math.floor(index / 8) !== Math.floor(target / 8))) return;
  squares[index].tabIndex = -1; squares[target].tabIndex = 0; focusSquare = squares[target].dataset.square; squares[target].focus();
});
$('#promotion-options').addEventListener('click', event => {
  const button = event.target.closest('[data-promotion]');
  if (!button || !pendingPromotion) return;
  const move = { ...pendingPromotion, promotion: button.dataset.promotion, type: 'move' };
  pendingPromotion = null; promotionDialog.close(); perform(move);
});
$('#promotion-cancel').addEventListener('click', () => promotionDialog.close());
promotionDialog.addEventListener('close', () => { pendingPromotion = null; });
noticeDialog.addEventListener('cancel', event => event.preventDefault());
$('#notice-continue').addEventListener('click', () => { if (state.notices[0]) perform({ type: 'ack', noticeId: state.notices[0].id }); });
$('#flip').addEventListener('click', () => { flipped = !flipped; render(); });
$('#resign').addEventListener('click', () => { $('#resign-dialog').classList.toggle('facing-black', mode === 'local' && state.turn === 'b'); $('#resign-dialog').showModal(); });
$('#resign-cancel').addEventListener('click', () => $('#resign-dialog').close());
$('#resign-confirm').addEventListener('click', () => { $('#resign-dialog').close(); perform({ type: 'resign' }); });

$('#player-settings').innerHTML = ['w', 'b'].map(color => `<section class="time-player"><h3>${colorName(color)}</h3>${[['total', 'Partitid'], ['increment', 'Tillegg per trekk'], ['deadline', 'Trekkfrist']].map(([key, label]) => `<label>${label}<span class="input-with-unit"><input id="${color}-${key}" aria-label="${colorName(color)}: ${label}" type="number" min="0" step="any" value="${key === 'deadline' ? 60 : 0}" required /><select id="${color}-${key}-unit" aria-label="Enhet for ${colorName(color).toLowerCase()}: ${label.toLowerCase()}"><option value="1">sek</option><option value="60">min</option></select></span></label>`).join('')}</section>`).join('');
function loadSettingsForm(settings) {
  $('#variant').value = settings.variant;
  $('#minispill').value = settings.minispill ?? 'vanlig';
  for (const color of ['w', 'b']) for (const key of ['total', 'increment', 'deadline']) {
    $(`#${color}-${key}`).value = settings.players[color][key];
    $(`#${color}-${key}-unit`).value = '1';
  }
  for (const name of ['burpees', 'pushups', 'squats']) $(`#reps-${name}`).value = settings.exercises[name];
  const { total, increment } = settings.players.w;
  for (const b of document.querySelectorAll('[data-preset]')) b.setAttribute('aria-pressed', String(b.dataset.preset === `${total},${increment}`));
  refreshSetup();
}
function readSettingsForm() {
  const settings = defaults();
  settings.variant = $('#variant').value;
  settings.minispill = $('#play-mode').value === 'online' ? 'vanlig' : $('#minispill').value;
  for (const color of ['w', 'b']) for (const key of ['total', 'increment', 'deadline']) settings.players[color][key] = Number($(`#${color}-${key}`).value) * Number($(`#${color}-${key}-unit`).value);
  for (const name of ['burpees', 'pushups', 'squats']) settings.exercises[name] = Number($(`#reps-${name}`).value);
  return validateSettings(settings);
}
function refreshSetup() {
  $('#exercise-settings').hidden = $('#variant').value !== 'training';
  $('#host-color-field').hidden = $('#play-mode').value !== 'online';
  // Casinosjakk is for two people on one screen.
  $('#minispill').disabled = $('#play-mode').value === 'online';
  if ($('#play-mode').value === 'online') $('#minispill').value = 'vanlig';
  $('#start-game').textContent = $('#play-mode').value === 'online' ? 'Opprett invitasjonslenke' : 'Start parti';
  $('#setup-note').textContent = state.status === 'playing' ? (mode === 'online' ? 'Nettpartiet som pågår, fortsetter.' : 'Partiet som pågår, avsluttes.') : '';
}
function openSetup() {
  if (mode === 'local' && state.startedAt !== null) {
    const clocks = clockValues(state, now()); state.remaining = clocks.remaining; state.turnRemaining = clocks.deadline; state.startedAt = null; localSetupPause = true;
  }
  $('#setup-error').textContent = ''; refreshSetup(); setupDialog.showModal();
}
$('#settings').addEventListener('click', openSetup);
$('#setup-close').addEventListener('click', () => setupDialog.close());
setupDialog.addEventListener('close', () => { if (localSetupPause && mode === 'local' && state.status === 'playing' && !state.notices.length) state.startedAt = now(); localSetupPause = false; });
$('#variant').addEventListener('change', refreshSetup);
$('#play-mode').addEventListener('change', refreshSetup);
$('.presets').addEventListener('click', event => {
  const button = event.target.closest('[data-preset]'); if (!button) return;
  const [total, increment] = button.dataset.preset.split(',');
  for (const b of document.querySelectorAll('[data-preset]')) b.setAttribute('aria-pressed', String(b === button));
  for (const color of ['w', 'b']) { $(`#${color}-total`).value = total; $(`#${color}-total-unit`).value = '1'; $(`#${color}-increment`).value = increment; $(`#${color}-increment-unit`).value = '1'; }
});

/** Switches this tab to an online room before the server has answered; `undo` restores the previous game. */
function enterRoom(credentials, color, provisional) {
  const previous = { mode, room, revision, confirmed, pending, state, playerColor, flipped, connected };
  mode = 'online'; room = credentials; revision = -1; knownRevision = -1; confirmed = null; pending = []; parked = []; premoves = []; selected = null; shownNotice = null; localSetupPause = false; connected = true; heardOpponent = false;
  playerColor = color; flipped = color === 'b'; state = provisional; soundMoves = provisional.moves.length;
  history.replaceState(null, '', `${location.pathname}#room=${credentials.id}`);
  openPush();
  setTimeout(forbered, 0);
  return () => {
    if (room !== credentials) return;
    ({ mode, room, revision, confirmed, pending, state, playerColor, flipped, connected } = previous);
    soundMoves = state.moves.length;
    if (mode !== 'online') closePush();
    history.replaceState(null, '', room ? `${location.pathname}#room=${room.id}` : location.pathname);
    render();
  };
}

async function createRoom(settings, color, created = () => {}) {
  const credentials = { id: crypto.randomUUID(), token: token(), inviteToken: token(), color };
  storage.write(`sjakk-room:${credentials.id}`, credentials);
  // The invite link is known up front, so it shows while the server stores the room.
  const undo = enterRoom(credentials, color, createSession(settings, now(), true));
  render();
  try {
    const snapshot = await request('/api/rooms', { id: credentials.id, hostToken: credentials.token, inviteToken: credentials.inviteToken, hostColor: color, settings });
    created(credentials);
    acceptSnapshot(snapshot);
  } catch (error) { undo(); return error; }
  return null;
}

$('#setup-form').addEventListener('submit', async event => {
  event.preventDefault();
  if (busy) return;
  $('#setup-error').textContent = '';
  let settings;
  try { settings = readSettingsForm(); } catch (error) { $('#setup-error').textContent = error.message; return; }
  storage.write('sjakk-settings-v2', settings);
  if ($('#play-mode').value === 'local') {
    closePush();
    mode = 'local'; room = null; revision = -1; confirmed = null; pending = []; premoves = []; connected = true; state = createSession(settings); trukketRunde = null; trukketVarsel = null; selected = null; flipped = false; shownNotice = null; localSetupPause = false;
    history.replaceState(null, '', location.pathname); message(); setupDialog.close(); render();
    return;
  }
  setupDialog.close();
  message();
  const failure = await createRoom(settings, $('#host-color').value);
  if (failure) { openSetup(); $('#setup-error').textContent = failure.message; }
});

$('#copy-invite').addEventListener('click', async () => {
  try { await navigator.clipboard.writeText($('#invite-link').value); $('#invite-feedback').textContent = 'Kopiert! Send lenken til en venn.'; }
  catch { $('#invite-link').select(); $('#invite-feedback').textContent = 'Marker og kopier lenken ovenfor.'; }
});

// Rematch: a new room with the colours swapped. The opponent's tab joins by itself through the old room's
// push channel, which stays open until the new room exists; otherwise the invite link is shown as usual.
$('#rematch').addEventListener('click', async () => {
  if (mode !== 'online' || !room || state.status !== 'finished') return;
  const failure = await createRoom(state.settings, other(playerColor), credentials => hint('rematch', { id: credentials.id, invite: credentials.inviteToken }));
  if (failure) message(failure.message, 4000);
});

async function acceptRematch(id, inviteToken) {
  if (!/^[0-9a-f-]{36}$/i.test(id) || !/^[0-9a-f]{64}$/.test(inviteToken)) return;
  const credentials = { id, token: token() };
  storage.write(`sjakk-room:${id}`, credentials);
  try {
    const preview = await request(`/api/rooms/${id}/preview`, { inviteToken });
    await joinRoom(credentials, inviteToken, preview);
  } catch (error) { message(error.message, 4000); }
}

async function joinRoom(credentials, inviteToken, preview) {
  const provisional = createSession(preview.settings, now());
  const undo = enterRoom(credentials, preview.color, provisional);
  render();
  try {
    const snapshot = await request(`/api/rooms/${credentials.id}/join`, { inviteToken, playerToken: credentials.token });
    announceJoin = true;
    acceptSnapshot(snapshot);
  } catch (error) { undo(); throw error; }
}

async function poll() {
  if (mode !== 'online' || !room) return;
  if (polling) { pollAgain = true; return; }
  polling = true; lastPoll = performance.now();
  const activeRoom = room;
  try {
    const snapshot = await request(`/api/rooms/${room.id}`, undefined, room, 8000);
    if (room === activeRoom) acceptSnapshot(snapshot);
  } catch (error) {
    if (room === activeRoom) { if (error.status) message(error.message, 4000); else setConnected(false); }
  } finally {
    polling = false;
    if (pollAgain) { pollAgain = false; poll(); }
  }
}

function settingsSummary(settings) {
  return ['w', 'b'].map(color => { const p = settings.players[color]; return `<p><strong>${colorName(color)}:</strong> ${p.total ? formatClock(p.total * 1000) : 'ubegrenset'} partitid · +${p.increment} sek · ${p.deadline ? `${p.deadline} sek trekkfrist` : 'ingen trekkfrist'}</p>`; }).join('');
}
$('#join-game').addEventListener('click', async () => {
  if (!joining?.preview || busy) return;
  const credentials = storage.read(`sjakk-room:${joining.id}`) ?? { id: joining.id, token: token() };
  storage.write(`sjakk-room:${joining.id}`, credentials);
  const invitation = joining;
  $('#join-error').textContent = '';
  $('#join-dialog').close();
  message();
  try { await joinRoom(credentials, invitation.inviteToken, invitation.preview); joining = null; }
  catch (error) { joining = invitation; $('#join-dialog').showModal(); $('#join-error').textContent = error.message; }
});
$('#join-cancel').addEventListener('click', () => { joining = null; if (mode !== 'online') closePush(); $('#join-dialog').close(); history.replaceState(null, '', location.pathname); openSetup(); });

async function initialize() {
  try { const saved = storage.read('sjakk-settings-v2'); if (saved) loadSettingsForm(validateSettings(saved)); } catch { /* Ignore obsolete settings. */ }
  render();
  const params = new URLSearchParams(location.hash.slice(1));
  const id = params.get('room');
  const invitation = params.get('invite');
  const credentials = id && storage.read(`sjakk-room:${id}`);
  if (credentials) {
    mode = 'online'; room = credentials;
    openPush();
    try { const snapshot = await request(`/api/rooms/${id}`, undefined, room); soundMoves = snapshot.state.moves.length; parked = savedPending(id); acceptSnapshot(snapshot); if (parked.length) retry(300); return; }
    catch (error) { closePush(); mode = 'local'; room = null; connected = true; if (!invitation) message(error.message); }
  }
  if (id && invitation) {
    joining = { id, inviteToken: invitation }; $('#join-dialog').showModal();
    openPush();
    try {
      const preview = await request(`/api/rooms/${id}/preview`, { inviteToken: invitation });
      if (joining?.id !== id) return;
      joining.preview = preview;
      $('#join-description').textContent = `Du spiller ${colorName(preview.color).toLowerCase()}. Variant: ${preview.settings.variant === 'training' ? 'trening' : 'leken'}.`;
      $('#join-settings').innerHTML = settingsSummary(preview.settings); $('#join-game').disabled = false;
    } catch (error) { $('#join-error').textContent = error.message; }
  } else openSetup();
}

let expiryPoll = 0;
setInterval(() => {
  if (mode === 'local' && advanceTime(state, now())) render();
  renderClocks();
  if (mode !== 'online' || !room || !confirmed) return;
  // With push, polling is only a safety net. Without it, poll every second as before.
  const pushed = live.joined && heardOpponent && state.status !== 'waiting';
  if (performance.now() - lastPoll >= (pushed ? 10000 : 1000) && !sending) poll();
  // The server decides timeouts; ask as soon as a clock runs out.
  const clocks = clockValues(state, now());
  const expired = state.status === 'playing' && !state.notices.length && state.startedAt !== null && ((clocks.remaining[state.turn] ?? 1) <= 0 || (clocks.deadline ?? 1) <= 0);
  if (expired && performance.now() - expiryPoll > 1000) { expiryPoll = performance.now(); poll(); }
}, 100);
// A reloaded online game gets its sound ready on the first press, outside the move itself.
const warmSound = () => { if (mode === 'online') setTimeout(forbered, 0); };
addEventListener('pointerdown', warmSound, { once: true, capture: true });
addEventListener('keydown', warmSound, { once: true, capture: true });
const wake = () => { live.attempt = 0; if (!live.socket) openPush(); poll(); flush(); };
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') { wake(); if (mode === 'local' && advanceTime(state, now())) render(); } });
addEventListener('online', wake);
addEventListener('offline', () => { if (mode !== 'online') return; setConnected(false); const socket = live.socket; if (socket) { live.socket = null; Object.assign(live, { joined: false, joinedTopic: null, beat: null }); socket.close(); } });
initialize();

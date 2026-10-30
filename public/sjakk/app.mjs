import { Chess } from './vendor/chess.mjs';
import { colorName, pieceNames } from './game-logic.mjs';
import { createSession, defaults, validateSettings, applyAction, advanceTime, clockValues, formatClock, noticeFacesOpposite, other } from './session.mjs';
import { lesFen, lesRokade, trekkFor, TYPER } from './casino.mjs';

const $ = selector => document.querySelector(selector);
const apiBase = $('meta[name="chess-api-base"]')?.content ?? '/api/rooms';
const board = $('#board');
const setupDialog = $('#setup-dialog');
const noticeDialog = $('#notice-dialog');
const promotionDialog = $('#promotion-dialog');
const glyphs = { k: '♚', q: '♛', r: '♜', b: '♝', n: '♞', p: '♟' };
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
let connected = true;
let localSetupPause = false;
let joining = null;
const now = () => Date.now() + (mode === 'online' ? serverOffset : 0);
const token = () => [...crypto.getRandomValues(new Uint8Array(32))].map(v => v.toString(16).padStart(2, '0')).join('');
const storage = { read(key) { try { return JSON.parse(localStorage.getItem(key)); } catch { return null; } }, write(key, value) { try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* The current tab still works without persistent storage. */ } } };

function message(text = '') { $('#connection-status').textContent = text; $('#connection-status').hidden = !text; }
function pieceMarkup(piece) { return `<span aria-hidden="true" class="piece ${piece.color === 'w' ? 'white' : 'black'}">${glyphs[piece.type]}</span>`; }
function canMove() { return state.status === 'playing' && !state.notices.length && !busy && connected && (mode === 'local' || state.turn === playerColor); }

function renderPlayer(target, color) {
  const lost = state.moves.filter(move => move.captured && move.color !== color).map(move => move.captured);
  const active = state.status === 'playing' && state.turn === color;
  $(target).innerHTML = `<div class="player-info"><span class="player-avatar ${color === 'w' ? 'white' : 'black'}" aria-hidden="true">♟</span><div><div class="player-name">${colorName(color)}${mode === 'online' && color === playerColor ? ' · deg' : ''}</div><div class="player-meta">${lost.length} ${lost.length === 1 ? 'brikke' : 'brikker'} mistet</div></div></div><div class="captured-pieces" aria-label="Mistede brikker: ${lost.length ? lost.map(type => pieceNames[type]).join(', ') : 'ingen'}">${lost.map(type => glyphs[type]).join(' ')}</div><span class="player-clock" data-clock="${color}" role="timer" aria-label="${colorName(color)} sin partitid"></span>${active ? '<span class="turn-badge">Din tur</span>' : ''}`;
}

function renderBoard(restoreFocus = false) {
  const files = [...'abcdefgh'];
  const ranks = [8, 7, 6, 5, 4, 3, 2, 1];
  if (flipped) { files.reverse(); ranks.reverse(); }
  board.classList.toggle('opposite-player', mode === 'local' && flipped);
  const legal = selected && canMove() ? chess.moves({ square: selected, verbose: true }) : [];
  const last = state.moves.at(-1);
  board.innerHTML = ranks.flatMap((rank, row) => files.map((file, col) => {
    const square = `${file}${rank}`;
    const piece = chess.get(square);
    const destination = legal.find(move => move.to === square);
    const check = piece?.type === 'k' && piece.color === state.turn && chess.isCheck();
    const classes = ['square', (file.charCodeAt(0) - 97 + rank) % 2 === 0 ? 'light' : 'dark', selected === square ? 'selected' : '', last && [last.from, last.to].includes(square) ? 'last-move' : '', check ? 'in-check' : ''].filter(Boolean).join(' ');
    const label = `${square}${piece ? `, ${colorName(piece.color).toLowerCase()} ${pieceNames[piece.type]}` : ', tomt felt'}${destination ? ', lovlig trekk' : ''}${check ? ', i sjakk' : ''}`;
    return `<button type="button" class="${classes}" data-square="${square}" aria-label="${label}" aria-pressed="${selected === square}" aria-disabled="${!canMove()}" tabindex="${square === focusSquare ? 0 : -1}">${col === 0 ? `<span aria-hidden="true" class="coordinate rank">${rank}</span>` : ''}${row === 7 ? `<span aria-hidden="true" class="coordinate file">${file}</span>` : ''}${piece ? pieceMarkup(piece) : ''}${destination ? `<span class="${destination.captured ? 'legal-capture' : 'legal-dot'}" aria-hidden="true"></span>` : ''}</button>`;
  })).join('');
  if (restoreFocus) board.querySelector(`[data-square="${focusSquare}"]`)?.focus({ preventScroll: true });
}

function renderClocks() {
  const values = clockValues(state, now());
  for (const color of ['w', 'b']) {
    const element = $(`[data-clock="${color}"]`);
    if (element) { element.textContent = formatClock(values.remaining[color]); element.classList.toggle('urgent', values.remaining[color] !== null && values.remaining[color] <= 10000); }
  }
  $('#turn-timer').textContent = formatClock(values.deadline);
  $('#timer-state').textContent = state.status === 'finished' ? 'Ferdig' : state.startedAt === null ? 'Pause' : colorName(state.turn);
  $('#clock-increment').textContent = state.settings.players[state.turn].increment ? `+${state.settings.players[state.turn].increment} s / trekk` : '';
  const duration = state.settings.players[state.turn].deadline * 1000;
  $('#timer-progress').style.width = `${duration ? Math.min(100, values.deadline / duration * 100) : 100}%`;
  $('.clock-panel').classList.toggle('urgent', values.deadline !== null && values.deadline <= 10000 && state.status === 'playing');
}

function syncNotice() {
  const notice = state.notices[0];
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
  $('#notice-continue').disabled = busy || !connected;
  $('#notice-continue').textContent = 'Fortsett';
  $('#notice-waiting').hidden = mine;
  $('#notice-waiting').textContent = `Venter på at ${colorName(notice.recipient).toLowerCase()} trykker Fortsett.`;
}

function render() {
  document.body.classList.toggle('online', mode === 'online');
  chess = state.settings.minispill === 'casino' ? casinoBrett(state) : new Chess(state.fen);
  renderBoard(board.contains(document.activeElement));
  renderPlayer('#top-player', mode === 'online' ? other(playerColor) : 'b');
  renderPlayer('#bottom-player', mode === 'online' ? playerColor : 'w');
  const title = state.status === 'setup' ? 'Klar for et parti?' : state.status === 'waiting' ? 'Venter på en venn' : state.result?.title ?? `${colorName(state.turn)} sin tur`;
  $('#status').textContent = title;
  $('#status-detail').textContent = state.status === 'setup' ? 'Velg tid og variant for å starte.' : state.status === 'waiting' ? 'Del invitasjonslenken for å starte.' : state.result?.description ?? (state.notices.length ? 'Spillet er på pause mens beskjeden vises.' : chess.isCheck() ? `${colorName(state.turn)} står i sjakk. Beskytt kongen.` : mode === 'online' && state.turn !== playerColor ? 'Venter på motspillerens trekk.' : state.settings.minispill === 'casino' ? 'Flytt brikkene hjulene viser. Sjakk er lov – den som slår kongen, vinner.' : 'Velg en brikke for å se lovlige trekk.');
  $('#turn-piece').textContent = state.result?.icon ?? '♟';
  $('#mode-label').textContent = mode === 'online' ? `NETTSPILL · DU ER ${colorName(playerColor).toUpperCase()}` : 'PÅ SAMME SKJERM';
  $('#seat-help').textContent = mode === 'online' ? 'Hver spiller har sitt eget brett.' : 'Hvit sitter her. Svart sitter på motsatt side.';
  $('#flip').hidden = mode === 'online';
  $('#resign').hidden = state.status !== 'playing';
  $('#invite-panel').hidden = !(mode === 'online' && state.status === 'waiting' && room?.inviteToken);
  if (room?.inviteToken) $('#invite-link').value = `${location.origin}${location.pathname}#room=${room.id}&invite=${room.inviteToken}`;
  $('#move-count').textContent = `${state.moves.length} trekk`;
  $('#history').innerHTML = state.moves.length ? Array.from({ length: Math.ceil(state.moves.length / 2) }, (_, i) => `<div class="move-row"><span class="move-number">${i + 1}.</span><span>${state.moves[2 * i].san.replace('#', '')}</span><span>${(state.moves[2 * i + 1]?.san ?? '—').replace('#', '')}</span></div>`).join('') : '<p class="empty-history">Ingen trekk ennå.</p>';
  if (state.settings.minispill === 'casino' && state.moves.length) {
    // Up to three moves per turn, so group by turn instead of white/black pairs.
    const turer = [];
    for (const move of state.moves) {
      if (turer.at(-1)?.color === move.color) turer.at(-1).san.push(move.san);
      else turer.push({ color: move.color, san: [move.san] });
    }
    $('#history').innerHTML = turer.map((tur, i) => `<div class="move-row"><span class="move-number">${i + 1}.</span><span>${colorName(tur.color)}</span><span>${tur.san.join(' ')}</span></div>`).join('');
  }
  $('#history').scrollTop = $('#history').scrollHeight;
  const training = state.settings.variant === 'training';
  $('#variant-label').textContent = training ? 'EN AKTIV RUNDE' : 'EN LITEN VRI';
  $('#variant-icon').textContent = training ? '💪' : '😈';
  $('#variant-title').textContent = training ? 'En brikke mindre. En øvelse mer.' : 'En brikke mindre. Et plagg mindre.';
  $('#variant-description').textContent = training ? Object.entries(state.settings.exercises).filter(([, reps]) => reps).map(([name, reps]) => `${reps} ${name}`).join(' · ') : 'Vinneren får massasje.';
  $('#variant-prize').textContent = training ? 'Sjakk for hodet. Bevegelse for kroppen.' : 'Vinneren? Massasjetid.';
  renderCasino();
  renderClocks();
  syncNotice();
}

// ---- Casinosjakk: the board only offers the pieces the reels came up with ----

function casinoBrett(game) {
  const brett = lesFen(game.fen);
  const igjen = new Set((game.casino?.hjul ?? []).filter((_, i) => game.casino.status[i] === 'klar'));
  return {
    get: square => brett[square],
    moves: ({ square }) => { const piece = brett[square]; return piece && piece.color === game.turn && igjen.has(piece.type) ? trekkFor(brett, square, lesRokade(game.fen)) : []; },
    isCheck: () => false,
  };
}

let visteRunde = null;
let spinnTimer = null;

function renderCasino() {
  const aktiv = state.settings.minispill === 'casino' && state.casino && state.status !== 'setup';
  $('#casino-panel').hidden = !aktiv;
  if (!aktiv) return;
  const { hjul, status, runde } = state.casino;
  const reels = [...document.querySelectorAll('[data-hjul]')];
  const vis = (el, type) => { el.innerHTML = pieceMarkup({ type, color: state.turn }); };
  const ferdig = () => reels.forEach((el, i) => { vis(el, hjul[i]); el.className = `hjul ${status[i]}`; el.setAttribute('aria-label', `${pieceNames[hjul[i]]}: ${status[i] === 'klar' ? 'skal flyttes' : status[i] === 'brukt' ? 'flyttet' : 'kan ikke flytte'}`); });
  if (runde !== visteRunde) {
    // A new spin: the reels roll and stop one after another, like a slot machine.
    visteRunde = runde;
    clearInterval(spinnTimer);
    const start = performance.now();
    reels.forEach(el => { el.className = 'hjul spinner'; });
    spinnTimer = setInterval(() => {
      const t = performance.now() - start;
      reels.forEach((el, i) => { if (t < 600 + i * 350) vis(el, TYPER[Math.floor(Math.random() * TYPER.length)]); else if (el.classList.contains('spinner')) { vis(el, hjul[i]); el.className = `hjul ${status[i]} landet`; } });
      if (t >= 600 + 2 * 350) { clearInterval(spinnTimer); ferdig(); }
    }, 70);
  } else if (!reels.some(el => el.classList.contains('spinner'))) ferdig();
  const igjen = hjul.filter((_, i) => status[i] === 'klar').map(type => pieceNames[type]);
  $('#casino-tekst').textContent = state.status !== 'playing' ? '' : igjen.length ? `Flytt: ${igjen.join(', ')}` : 'Turen går videre';
}

async function request(path, data, credentials) {
  const response = await fetch(path.replace(/^\/api\/rooms/, apiBase), { method: data === undefined ? 'GET' : 'POST', headers: { ...(data !== undefined ? { 'Content-Type': 'application/json' } : {}), ...(credentials ? { Authorization: `Bearer ${credentials.token}` } : {}) }, ...(data !== undefined ? { body: JSON.stringify(data) } : {}), signal: AbortSignal.timeout(12000), cache: 'no-store' });
  if (!response.headers.get('Content-Type')?.includes('application/json')) throw new Error('Kunne ikke nå nettspillet. Prøv igjen om litt.');
  const result = await response.json();
  if (!response.ok) throw Object.assign(new Error(result.error ?? 'Kunne ikke nå nettspillet.'), { snapshot: result.state ? result : null });
  return result;
}

function acceptSnapshot(snapshot) {
  if (!room || snapshot.roomId !== room.id || snapshot.revision < revision) return;
  serverOffset = snapshot.serverNow - Date.now();
  const changed = snapshot.revision !== revision;
  revision = snapshot.revision;
  playerColor = snapshot.color;
  state = snapshot.state;
  connected = true;
  if (changed) { selected = null; flipped = playerColor === 'b'; render(); }
  else renderClocks();
}

async function perform(action) {
  if (busy) return;
  if (mode === 'local') {
    try {
      const actor = action.type === 'ack' ? state.notices[0]?.recipient : state.turn;
      applyAction(state, action, actor, now());
      selected = null;
      flipped = state.turn === 'b';
      render();
    } catch (error) { message(error.message); }
    return;
  }
  if (!connected || !room) return;
  busy = true;
  syncNotice();
  const activeRoom = room;
  try {
    const snapshot = await request(`/api/rooms/${room.id}/action`, { action, revision }, room);
    if (room === activeRoom) { acceptSnapshot(snapshot); message(); }
  } catch (error) {
    if (room === activeRoom) { if (error.snapshot) acceptSnapshot(error.snapshot); message(error.message); }
  } finally { busy = false; render(); }
}

function chooseSquare(square) {
  if (mode === 'local' && advanceTime(state, now())) { render(); return; }
  if (!canMove() || setupDialog.open || promotionDialog.open) return;
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

board.addEventListener('click', event => { const square = event.target.closest('[data-square]'); if (square) chooseSquare(square.dataset.square); });
board.addEventListener('keydown', event => {
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
$('#setup-form').addEventListener('submit', async event => {
  event.preventDefault();
  if (busy) return;
  $('#setup-error').textContent = '';
  try {
    const settings = readSettingsForm();
    if ($('#play-mode').value === 'local') {
      mode = 'local'; room = null; revision = -1; connected = true; state = createSession(settings); selected = null; flipped = false; shownNotice = null; localSetupPause = false;
      history.replaceState(null, '', location.pathname); message();
    } else {
      busy = true; $('#start-game').disabled = true;
      const credentials = { id: crypto.randomUUID(), token: token(), inviteToken: token(), color: $('#host-color').value };
      storage.write(`sjakk-room:${credentials.id}`, credentials);
      const snapshot = await request('/api/rooms', { id: credentials.id, hostToken: credentials.token, inviteToken: credentials.inviteToken, hostColor: credentials.color, settings });
      mode = 'online'; room = credentials; revision = -1; shownNotice = null; localSetupPause = false;
      history.replaceState(null, '', `${location.pathname}#room=${room.id}`);
      acceptSnapshot(snapshot); message();
    }
    storage.write('sjakk-settings-v2', settings); setupDialog.close(); render();
  } catch (error) { $('#setup-error').textContent = error.message; }
  finally { busy = false; $('#start-game').disabled = false; }
});

$('#copy-invite').addEventListener('click', async () => {
  try { await navigator.clipboard.writeText($('#invite-link').value); $('#invite-feedback').textContent = 'Kopiert! Send lenken til en venn.'; }
  catch { $('#invite-link').select(); $('#invite-feedback').textContent = 'Marker og kopier lenken ovenfor.'; }
});

async function poll() {
  if (mode !== 'online' || !room || polling || busy) return;
  polling = true;
  const activeRoom = room;
  try {
    const snapshot = await request(`/api/rooms/${room.id}`, undefined, room);
    if (room === activeRoom) {
      const reconnecting = !connected;
      acceptSnapshot(snapshot);
      if (reconnecting) { message('Tilkoblet igjen. Partiet er oppdatert.'); render(); }
    }
  } catch (error) {
    if (room === activeRoom) { connected = false; message(`Mistet forbindelsen. Prøver igjen … ${error.message}`); renderBoard(); syncNotice(); }
  } finally { polling = false; }
}

function settingsSummary(settings) {
  return ['w', 'b'].map(color => { const p = settings.players[color]; return `<p><strong>${colorName(color)}:</strong> ${p.total ? formatClock(p.total * 1000) : 'ubegrenset'} partitid · +${p.increment} sek · ${p.deadline ? `${p.deadline} sek trekkfrist` : 'ingen trekkfrist'}</p>`; }).join('');
}
$('#join-game').addEventListener('click', async () => {
  if (!joining || busy) return;
  busy = true; $('#join-game').disabled = true; $('#join-error').textContent = '';
  try {
    const credentials = storage.read(`sjakk-room:${joining.id}`) ?? { id: joining.id, token: token() };
    storage.write(`sjakk-room:${joining.id}`, credentials);
    const snapshot = await request(`/api/rooms/${joining.id}/join`, { inviteToken: joining.inviteToken, playerToken: credentials.token });
    mode = 'online'; room = credentials; revision = -1; shownNotice = null; history.replaceState(null, '', `${location.pathname}#room=${room.id}`);
    $('#join-dialog').close(); acceptSnapshot(snapshot); message();
  } catch (error) { $('#join-error').textContent = error.message; }
  finally { busy = false; $('#join-game').disabled = false; render(); }
});
$('#join-cancel').addEventListener('click', () => { $('#join-dialog').close(); history.replaceState(null, '', location.pathname); openSetup(); });

async function initialize() {
  try { const saved = storage.read('sjakk-settings-v2'); if (saved) loadSettingsForm(validateSettings(saved)); } catch { /* Ignore obsolete settings. */ }
  render();
  const params = new URLSearchParams(location.hash.slice(1));
  const id = params.get('room');
  const invitation = params.get('invite');
  const credentials = id && storage.read(`sjakk-room:${id}`);
  if (credentials) {
    mode = 'online'; room = credentials; connected = false;
    try { const snapshot = await request(`/api/rooms/${id}`, undefined, room); acceptSnapshot(snapshot); render(); return; }
    catch (error) { mode = 'local'; room = null; connected = true; if (!invitation) message(error.message); }
  }
  if (id && invitation) {
    joining = { id, inviteToken: invitation }; $('#join-dialog').showModal();
    try {
      const preview = await request(`/api/rooms/${id}/preview`, { inviteToken: invitation });
      $('#join-description').textContent = `Du spiller ${colorName(preview.color).toLowerCase()}. Variant: ${preview.settings.variant === 'training' ? 'trening' : 'leken'}.`;
      $('#join-settings').innerHTML = settingsSummary(preview.settings); $('#join-game').disabled = false;
    } catch (error) { $('#join-error').textContent = error.message; }
  } else openSetup();
}
setInterval(() => { if (mode === 'local' && advanceTime(state, now())) render(); renderClocks(); }, 100);
setInterval(poll, 1000);
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') { poll(); if (mode === 'local' && advanceTime(state, now())) render(); } });
initialize();

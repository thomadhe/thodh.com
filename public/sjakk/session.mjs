import { Chess } from './vendor/chess.mjs';
import { colorName, pieceNames, outcome } from './game-logic.mjs';

export const other = color => color === 'w' ? 'b' : 'w';
export const defaults = () => ({
  variant: 'playful',
  players: { w: { total: 0, increment: 0, deadline: 60 }, b: { total: 0, increment: 0, deadline: 60 } },
  exercises: { burpees: 5, pushups: 10, squats: 15 },
});

export function validateSettings(input) {
  if (!input || !['playful', 'training'].includes(input.variant)) throw new Error('Velg en spillvariant.');
  const settings = defaults();
  settings.variant = input.variant;
  for (const color of ['w', 'b']) for (const field of ['total', 'increment', 'deadline']) {
    const value = input.players?.[color]?.[field];
    if (typeof value !== 'number' || !Number.isFinite(value) || value < 0 || value > 604800 || (value > 0 && value < .1)) throw new Error('Tider må være 0 eller minst 0,1 sekund, opptil én uke.');
    settings.players[color][field] = Math.round(value * 1000) / 1000;
  }
  for (const exercise of Object.keys(settings.exercises)) {
    const count = input.exercises?.[exercise] ?? settings.exercises[exercise];
    if (!Number.isInteger(count) || count < 0 || count > 1000) throw new Error('Antall repetisjoner må være et heltall fra 0 til 1000.');
    settings.exercises[exercise] = count;
  }
  if (settings.variant === 'training' && !Object.values(settings.exercises).some(Boolean)) throw new Error('Velg minst én øvelse med mer enn 0 repetisjoner.');
  return settings;
}

export function createSession(settings = defaults(), now = Date.now(), waiting = false) {
  settings = validateSettings(settings);
  return { settings, moves: [], fen: new Chess().fen(), turn: 'w', remaining: { w: settings.players.w.total ? settings.players.w.total * 1000 : null, b: settings.players.b.total ? settings.players.b.total * 1000 : null }, turnRemaining: settings.players.w.deadline ? settings.players.w.deadline * 1000 : null, startedAt: waiting ? null : now, status: waiting ? 'waiting' : 'playing', notices: [], nextNotice: 1, exerciseIndex: 0, timeoutIndex: 0, result: null };
}

export function chessFrom(state) {
  const chess = new Chess();
  for (const move of state.moves) chess.move({ from: move.from, to: move.to, ...(move.promotion ? { promotion: move.promotion } : {}) });
  return chess;
}

export function clockValues(state, now) {
  const elapsed = state.startedAt === null ? 0 : Math.max(0, now - state.startedAt);
  const remaining = { ...state.remaining };
  if (remaining[state.turn] !== null) remaining[state.turn] = Math.max(0, remaining[state.turn] - elapsed);
  const deadline = state.turnRemaining === null ? null : Math.max(0, state.turnRemaining - elapsed);
  return { remaining, deadline };
}

function settle(state, now) {
  const values = clockValues(state, now);
  state.remaining = values.remaining;
  state.turnRemaining = values.deadline;
  state.startedAt = null;
}

function addNotice(state, notice) { state.notices.push({ id: state.nextNotice++, ...notice }); }

function exercise(state) {
  const choices = Object.entries(state.settings.exercises).filter(([, count]) => count > 0);
  const [name, reps] = choices[state.exerciseIndex++ % choices.length];
  return { name, reps, text: `Gjør ${reps} ${name}.` };
}

function win(state, winner, reason) {
  const training = state.settings.variant === 'training';
  const notice = { kind: 'win', recipient: winner, title: training ? 'Sterkt spilt!' : 'Massasjetid', description: `${colorName(winner)} vant${reason ? ` ${reason}` : ''}!${training ? '' : ' Tid for massasje.'}`, icon: training ? '🏆' : '♔' };
  state.result = notice;
  state.status = 'finished';
  addNotice(state, notice);
}

export function advanceTime(state, now = Date.now()) {
  if (state.status !== 'playing' || state.notices.length || state.startedAt === null) return false;
  const values = clockValues(state, now);
  const outOfTotal = values.remaining[state.turn] !== null && values.remaining[state.turn] <= 0;
  const outOfTurn = values.deadline !== null && values.deadline <= 0;
  if (!outOfTotal && !outOfTurn) return false;
  // Settle at the first expired deadline, even if the browser was asleep.
  const elapsedUntilExpiry = Math.min(state.remaining[state.turn] ?? Infinity, state.turnRemaining ?? Infinity);
  const totalFirst = state.remaining[state.turn] !== null && state.remaining[state.turn] <= (state.turnRemaining ?? Infinity);
  settle(state, state.startedAt + elapsedUntilExpiry);
  const recipient = state.turn;
  const title = state.timeoutIndex++ % 2 === 0 ? 'Titsforbrytelse' : 'Tissforbrytelse';
  if (totalFirst) {
    addNotice(state, { kind: 'timeout', recipient, title, description: `${colorName(recipient)} brukte opp partitiden.`, icon: '⏱', totalExpired: true });
    win(state, other(recipient), 'på tid');
  } else {
    const training = state.settings.variant === 'training';
    addNotice(state, { kind: 'timeout', recipient, title, description: training ? `${exercise(state).text} Trykk Fortsett når du er klar.` : 'Special kiss for å fortsette 😉', icon: training ? '💪' : '😉' });
  }
  return true;
}

export function applyAction(state, action, actor, now = Date.now()) {
  if (!['w', 'b'].includes(actor)) throw new Error('Du har ingen spillerplass i dette partiet.');
  if (advanceTime(state, now)) return state;
  if (action.type === 'ack') {
    const notice = state.notices[0];
    if (!notice || notice.id !== action.noticeId) return state;
    if (notice.recipient !== actor) throw new Error('Beskjeden må bekreftes av spilleren den gjelder.');
    state.notices.shift();
    if (notice.kind === 'timeout' && !notice.totalExpired) state.turnRemaining = state.settings.players[state.turn].deadline * 1000 || null;
    if (!state.notices.length && state.status === 'playing') state.startedAt = now;
    return state;
  }
  if (state.status !== 'playing' || state.notices.length) throw new Error('Vent til partiet er klart for neste trekk.');
  if (action.type === 'resign') {
    settle(state, now);
    win(state, other(actor), 'ved at motspilleren ga opp');
    return state;
  }
  if (actor !== state.turn) throw new Error('Det er ikke din tur.');
  if (action.type !== 'move') throw new Error('Ukjent handling.');
  const chess = chessFrom(state);
  let move;
  try { move = chess.move({ from: action.from, to: action.to, ...(action.promotion ? { promotion: action.promotion } : {}) }); }
  catch { throw new Error('Trekket er ikke lovlig.'); }
  settle(state, now);
  if (state.remaining[actor] !== null) state.remaining[actor] += state.settings.players[actor].increment * 1000;
  state.moves.push({ from: move.from, to: move.to, promotion: move.promotion, captured: move.captured, color: move.color, san: move.san });
  state.fen = chess.fen();
  state.turn = chess.turn();
  state.turnRemaining = state.settings.players[state.turn].deadline * 1000 || null;
  if (move.captured) {
    const recipient = other(actor);
    if (state.settings.variant === 'training') {
      const task = exercise(state);
      addNotice(state, { kind: 'capture', recipient, title: task.text, description: `${colorName(recipient)} mistet ${move.captured === 'r' ? 'et' : 'en'} ${pieceNames[move.captured]}. Klar for en liten treningspause?`, icon: '💪' });
    } else addNotice(state, { kind: 'capture', recipient, title: 'Ta av ett plagg! 😈', description: `${colorName(recipient)} mistet ${move.captured === 'r' ? 'et' : 'en'} ${pieceNames[move.captured]}.`, icon: '😈' });
  }
  const result = outcome(chess);
  if (result?.kind === 'win') win(state, actor);
  else if (result) {
    state.result = { ...result, recipient: actor };
    state.status = 'finished';
    addNotice(state, state.result);
  }
  if (state.status === 'playing' && !state.notices.length) state.startedAt = now;
  return state;
}

export function formatClock(ms) {
  if (ms === null) return '∞';
  const seconds = Math.ceil(Math.max(0, ms) / 1000);
  const hours = Math.floor(seconds / 3600);
  return `${hours ? `${hours}:` : ''}${hours ? String(Math.floor(seconds / 60) % 60).padStart(2, '0') : Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
}

export function noticeFacesOpposite(notice, mode) { return mode === 'local' && notice?.recipient === 'b'; }

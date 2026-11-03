import test from 'node:test';
import assert from 'node:assert/strict';
import { Chess } from '../public/sjakk/vendor/chess.mjs';
import { createSession, defaults, applyAction, applyPending, rebuild, containsAction } from '../public/sjakk/session.mjs';
import { premoveTargets } from '../public/sjakk/game-logic.mjs';

const move = (from, to) => ({ type: 'move', from, to });
const entry = (base, action, actor, index) => ({ base, action, actor, at: 1000, index });

test('unconfirmed actions are replayed on top of the server snapshot', () => {
  const server = createSession(defaults(), 0);
  const { state, kept } = rebuild(server, 1, [entry(1, move('e2', 'e4'), 'w', 0), entry(2, move('e7', 'e5'), 'b', 1)]);
  assert.equal(kept.length, 2);
  assert.deepEqual(state.moves.map(m => m.san), ['e4', 'e5']);
  // The snapshot itself is never changed.
  assert.equal(server.moves.length, 0);
});

test('a confirmed action is dropped instead of being played twice', () => {
  const server = createSession(defaults(), 0);
  applyAction(server, move('e2', 'e4'), 'w', 500);
  const { state, kept } = rebuild(server, 2, [entry(1, move('e2', 'e4'), 'w', 0), entry(2, move('e7', 'e5'), 'b', 1)]);
  assert.deepEqual(kept.map(e => e.base), [2]);
  assert.deepEqual(state.moves.map(m => m.san), ['e4', 'e5']);
});

test('a rejected action rolls back together with everything built on it', () => {
  const server = createSession(defaults(), 0);
  applyAction(server, move('d2', 'd4'), 'w', 500);
  // The opponent's hinted e4 never reached the server: the server has d4 instead, and the premove on e4 can't follow.
  const { state, kept } = rebuild(server, 2, [entry(1, move('e2', 'e4'), 'w', 0), entry(2, move('e7', 'e5'), 'b', 1), entry(3, move('g1', 'f3'), 'w', 2)]);
  assert.deepEqual(kept, []);
  assert.deepEqual(state.moves.map(m => m.san), ['d4']);
});

test('an action that no longer fits the position is not applied', () => {
  const state = createSession(defaults(), 0);
  assert.equal(applyPending(state, entry(1, move('e2', 'e5'), 'w', 0)), false);
  assert.equal(applyPending(state, entry(1, move('e7', 'e5'), 'b', 0)), false);
  assert.equal(state.moves.length, 0);
  assert.equal(applyPending(state, entry(1, { type: 'resign' }, 'b', 0)), true);
  assert.equal(state.status, 'finished');
});

test('a retried own move is recognised in the server state', () => {
  const server = createSession(defaults(), 0);
  applyAction(server, move('e2', 'e4'), 'w', 500);
  assert.equal(containsAction(server, { action: move('e2', 'e4'), actor: 'w', index: 0 }), true);
  assert.equal(containsAction(server, { action: move('d2', 'd4'), actor: 'w', index: 0 }), false);
  assert.equal(containsAction(server, { action: move('e7', 'e5'), actor: 'b', index: 1 }), false);
});

test('premove targets follow piece movement on an open board, like Lichess', () => {
  const chess = new Chess();
  const at = square => chess.get(square) || undefined;
  assert.deepEqual(premoveTargets(at, 'e2', 'w').sort(), ['d3', 'e3', 'e4', 'f3']);
  assert.deepEqual(premoveTargets(at, 'g1', 'w').sort(), ['e2', 'f3', 'h3']);
  // Blockers are ignored, and an unmoved king can premove castling.
  assert.equal(premoveTargets(at, 'a1', 'w').length, 14);
  assert.ok(premoveTargets(at, 'e1', 'w').includes('g1') && premoveTargets(at, 'e1', 'w').includes('c1'));
  assert.deepEqual(premoveTargets(at, 'e7', 'w'), []);
  assert.deepEqual(premoveTargets(at, 'e7', 'b').sort(), ['d6', 'e5', 'e6', 'f6']);
});

test('a stored action only replays on the position it was made from', () => {
  const server = createSession(defaults(), 0);
  applyAction(server, move('e2', 'e4'), 'w', 500);
  applyAction(server, move('e7', 'e5'), 'b', 600);
  // Saved after 1. e4 e5 as "Nf3 at revision 3"; the server got 1. e4 c5 instead, and Nf3 would still be legal.
  const other = createSession(defaults(), 0);
  applyAction(other, move('e2', 'e4'), 'w', 500);
  applyAction(other, move('c7', 'c5'), 'b', 600);
  const saved = { ...entry(3, move('g1', 'f3'), 'w', 2), fen: server.fen };
  assert.equal(applyPending(structuredClone(other), saved), false);
  assert.deepEqual(rebuild(other, 3, [saved]).kept, []);
  assert.equal(applyPending(structuredClone(server), saved), true);
  assert.deepEqual(rebuild(server, 3, [saved]).kept, [saved]);
  // The wrong move count is refused too, even on the same pieces.
  assert.equal(applyPending(structuredClone(server), { ...saved, index: 3 }), false);
});

test('a confirmed promotion must have the same piece', () => {
  const server = createSession(defaults(), 0);
  server.moves = [{ from: 'b7', to: 'b8', promotion: 'n', color: 'w', san: 'b8=N' }];
  assert.equal(containsAction(server, { action: { type: 'move', from: 'b7', to: 'b8', promotion: 'n' }, actor: 'w', index: 0 }), true);
  assert.equal(containsAction(server, { action: { type: 'move', from: 'b7', to: 'b8', promotion: 'q' }, actor: 'w', index: 0 }), false);
  assert.equal(containsAction(server, { action: { type: 'move', from: 'b7', to: 'b8' }, actor: 'w', index: 0 }), false);
});

test('only our own resignation counts as confirming our resign', () => {
  const resigned = createSession(defaults(), 0);
  applyAction(resigned, { type: 'resign' }, 'w', 500);
  assert.equal(containsAction(resigned, { action: { type: 'resign' }, actor: 'w', index: 0 }), true);
  // The opponent resigned at the same time: the game is finished, but not by us.
  assert.equal(containsAction(resigned, { action: { type: 'resign' }, actor: 'b', index: 0 }), false);
  // Finished by a move after the one we resigned on.
  assert.equal(containsAction(resigned, { action: { type: 'resign' }, actor: 'w', index: 1 }), false);
  const mated = createSession(defaults(), 0);
  for (const [from, to, color] of [['f2', 'f3', 'w'], ['e7', 'e5', 'b'], ['g2', 'g4', 'w'], ['d8', 'h4', 'b']]) applyAction(mated, move(from, to), color, 500);
  assert.equal(mated.status, 'finished');
  assert.equal(containsAction(mated, { action: { type: 'resign' }, actor: 'w', index: 4 }), false);
});

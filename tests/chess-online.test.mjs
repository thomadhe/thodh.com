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

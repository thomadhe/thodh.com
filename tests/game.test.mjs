import test from 'node:test';
import assert from 'node:assert/strict';
import { Chess } from '../public/sjakk/vendor/chess.mjs';
import { outcome, noticesAfterMove } from '../public/sjakk/game-logic.mjs';

test('vanlige trekk gir ingen melding, tapte brikker gir riktig spiller beskjed', () => {
  const game = new Chess();
  assert.equal(game.moves().length, 20);
  assert.deepEqual(noticesAfterMove(game, game.move('e4')), []);
  game.move('d5');
  const move = game.move('exd5');
  assert.deepEqual(noticesAfterMove(game, move).map(n => [n.title, n.description]), [['Ta av ett plagg! 😈', 'Svart mistet en bonde.']]);
  const reply = game.move('Qxd5');
  assert.equal(noticesAfterMove(game, reply)[0].description, 'Hvit mistet en bonde.');
});

test('ulovlige trekk avvises uten å endre spillet', () => {
  const game = new Chess();
  const original = game.fen();
  assert.throws(() => game.move({ from: 'e2', to: 'e5' }));
  assert.equal(game.fen(), original);
});

test('en passant viser også tap av brikke', () => {
  const game = new Chess();
  for (const move of ['e4', 'a6', 'e5', 'd5']) game.move(move);
  const move = game.move('exd6');
  assert.equal(game.get('d5'), undefined);
  assert.equal(noticesAfterMove(game, move)[0].description, 'Svart mistet en bonde.');
});

test('rokade flytter konge og tårn uten tapsmelding', () => {
  const game = new Chess();
  for (const move of ['e4', 'e5', 'Nf3', 'Nc6', 'Bc4', 'Nf6']) game.move(move);
  const move = game.move('O-O');
  assert.equal(game.get('g1').type, 'k');
  assert.equal(game.get('f1').type, 'r');
  assert.deepEqual(noticesAfterMove(game, move), []);
});

test('bondeforvandling støtter alle fire brikker og tap av tårn', () => {
  const fen = '1r5k/P7/8/8/8/8/8/7K w - - 0 1';
  const game = new Chess(fen);
  assert.deepEqual(game.moves({ square: 'a7', verbose: true }).filter(m => m.to === 'b8').map(m => m.promotion).sort(), ['b', 'n', 'q', 'r']);
  const move = game.move({ from: 'a7', to: 'b8', promotion: 'n' });
  assert.equal(game.get('b8').type, 'n');
  assert.equal(noticesAfterMove(game, move)[0].description, 'Svart mistet et tårn.');
});

test('vinnerteksten er Massasjetid og navngir riktig vinner', () => {
  const game = new Chess();
  for (const move of ['f3', 'e5', 'g4']) game.move(move);
  const move = game.move('Qh4#');
  assert.deepEqual(noticesAfterMove(game, move).map(n => n.title), ['Massasjetid']);
  assert.match(outcome(game).description, /^Svart vant!/);
  assert.equal(game.moves().length, 0);
});

test('en vinnende fangst viser plaggbeskjed før massasjetid', () => {
  const game = new Chess();
  for (const move of ['e4', 'e5', 'Bc4', 'Nc6', 'Qh5', 'Nf6']) game.move(move);
  const move = game.move('Qxf7#');
  assert.deepEqual(noticesAfterMove(game, move).map(n => n.title), ['Ta av ett plagg! 😈', 'Massasjetid']);
  assert.match(outcome(game).description, /^Hvit vant!/);
});

test('patt og utilstrekkelig materiell blir uavgjort', () => {
  assert.equal(outcome(new Chess('7k/5Q2/6K1/8/8/8/8/8 b - - 0 1')).kind, 'draw');
  assert.equal(outcome(new Chess('7k/8/8/8/8/8/8/K7 w - - 0 1')).title, 'Uavgjort');
});

test('trekkgjentakelse avslutter og nytt spill nullstiller historikk', () => {
  const game = new Chess();
  for (let i = 0; i < 2; i++) for (const move of ['Nf3', 'Nf6', 'Ng1', 'Ng8']) game.move(move);
  assert.equal(outcome(game).kind, 'draw');
  game.reset();
  assert.equal(outcome(game), null);
  assert.equal(game.history().length, 0);
  assert.equal(game.turn(), 'w');
});

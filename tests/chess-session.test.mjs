import test from 'node:test';
import assert from 'node:assert/strict';
import { createSession, defaults, applyAction, advanceTime, clockValues, validateSettings, noticeFacesOpposite } from '../public/sjakk/session.mjs';
const move = (s, from, to, time) => applyAction(s, { type: 'move', from, to }, s.turn, time);
const ack = (s, time) => applyAction(s, { type: 'ack', noticeId: s.notices[0].id }, s.notices[0].recipient, time);

test('separate partitider, tillegg og frister følger hver spiller', () => {
  const settings = defaults();
  settings.players.w = { total: 10, increment: 3, deadline: 4.5 };
  settings.players.b = { total: 600, increment: 7, deadline: 120 };
  const s = createSession(settings, 0);
  move(s, 'e2', 'e4', 2000);
  assert.deepEqual(s.remaining, { w: 11000, b: 600000 });
  assert.equal(s.turnRemaining, 120000);
  move(s, 'e7', 'e5', 10000);
  assert.deepEqual(s.remaining, { w: 11000, b: 599000 });
  assert.equal(s.turnRemaining, 4500);
});

test('tapte brikker adresseres og snus til riktig spiller, også på vinnertrekket', () => {
  const s = createSession(defaults(), 0);
  for (const [from, to] of [['e2','e4'],['e7','e5'],['f1','c4'],['b8','c6'],['d1','h5'],['g8','f6'],['h5','f7']]) move(s, from, to, 0);
  assert.deepEqual(s.notices.map(n => [n.kind, n.recipient]), [['capture','b'],['win','w']]);
  assert.equal(noticeFacesOpposite(s.notices[0], 'local'), true);
  assert.equal(noticeFacesOpposite(s.notices[1], 'local'), false);
  assert.equal(noticeFacesOpposite(s.notices[0], 'online'), false);
  assert.throws(() => applyAction(s, { type: 'ack', noticeId: s.notices[0].id }, 'w', 1000));
  ack(s, 5000); ack(s, 10000);
  assert.equal(s.startedAt, null);
});

test('frist pauser partitiden og veksler mellom tits og tiss uten dobbel melding', () => {
  const settings = defaults(); settings.players.w = { total: 100, increment: 3, deadline: 10 };
  const s = createSession(settings, 0);
  assert.equal(advanceTime(s, 30000), true);
  assert.equal(s.remaining.w, 90000);
  assert.equal(s.notices[0].title, 'Titsforbrytelse');
  assert.equal(advanceTime(s, 90000), false);
  assert.equal(s.notices.length, 1);
  assert.equal(clockValues(s, 90000).remaining.w, 90000);
  ack(s, 100000);
  assert.equal(s.turnRemaining, 10000);
  advanceTime(s, 110000);
  assert.equal(s.notices[0].title, 'Tissforbrytelse');
  assert.equal(s.remaining.w, 80000);
  assert.equal(s.turn, 'w');
});

test('oppbrukt partitid avslutter uten at et sent trekk får tillegg', () => {
  const settings = defaults(); settings.players.w = { total: 10, increment: 3, deadline: 0 };
  const s = createSession(settings, 0);
  move(s, 'e2', 'e4', 10001);
  assert.equal(s.moves.length, 0);
  assert.equal(s.status, 'finished');
  assert.equal(s.result.recipient, 'b');
  assert.equal(s.notices[0].recipient, 'w');
  ack(s, 20000); ack(s, 30000);
  assert.equal(s.startedAt, null);
});

test('trening bytter mellom valgte øvelser og pauser klokkene', () => {
  const settings = defaults(); settings.variant = 'training'; settings.exercises = { burpees: 2, pushups: 0, squats: 7 };
  const s = createSession(settings, 0);
  move(s,'e2','e4',1000); move(s,'d7','d5',2000); move(s,'e4','d5',3000);
  assert.equal(s.notices[0].title, 'Gjør 2 burpees.');
  assert.equal(s.notices[0].recipient, 'b');
  assert.equal(s.startedAt, null);
  ack(s, 100000); move(s,'d8','d5',101000);
  assert.equal(s.notices[0].title, 'Gjør 7 squats.');
  assert.equal(s.notices[0].recipient, 'w');
});

test('ventende nettspill bruker ingen tid, og ugyldige oppsett avvises', () => {
  const s = createSession(defaults(), 0, true);
  assert.equal(advanceTime(s, 99999999), false);
  const bad = defaults(); bad.players.w.total = -1;
  assert.throws(() => validateSettings(bad));
  bad.players.w.total = Infinity;
  assert.throws(() => validateSettings(bad));
  const noExercise = defaults(); noExercise.variant = 'training'; noExercise.exercises = { burpees: 0, pushups: 0, squats: 0 };
  assert.throws(() => validateSettings(noExercise));
});

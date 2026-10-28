import test from 'node:test';
import assert from 'node:assert/strict';
import { TurnClock, formatTime, timeoutNotice } from '../public/sjakk/turn-clock.mjs';

test('ett minutt er standard og fristen gjelder også ved forsinkede oppdateringer', () => {
  let now = 1000;
  const clock = new TurnClock(undefined, () => now);
  assert.equal(formatTime(clock.remaining()), '1:00');
  now += 59999;
  assert.equal(clock.expired(), false);
  assert.equal(formatTime(clock.remaining()), '0:01');
  now += 1;
  assert.equal(clock.expired(), true);
  now += 100000;
  assert.equal(clock.remaining(), 0);
});

test('meldinger pauser tiden, og fortsett gjenopptar gjenstående tid', () => {
  let now = 0;
  const clock = new TurnClock(60, () => now);
  now = 15000;
  clock.pause();
  now = 200000;
  assert.equal(clock.remaining(), 45000);
  assert.equal(clock.expired(), false);
  clock.resume();
  now += 10000;
  assert.equal(clock.remaining(), 35000);
});

test('nytt trekk eller fortsett etter tidsavbrudd gir full tid', () => {
  let now = 0;
  const clock = new TurnClock(60, () => now);
  now = 60001;
  assert.equal(clock.expired(), true);
  clock.pause();
  now += 20000;
  clock.reset();
  assert.equal(clock.remaining(), 60000);
  assert.equal(clock.expired(), false);
});

test('innstillingen gjelder både pågående og neste tur', () => {
  let now = 0;
  const clock = new TurnClock(60, () => now);
  clock.reset(120);
  assert.equal(formatTime(clock.remaining()), '2:00');
  now = 10000;
  clock.reset();
  assert.equal(clock.remaining(), 120000);
});

test('tidsavbrudd har brukerens melding', () => {
  assert.equal(timeoutNotice.title, 'Tissforbrytelse');
  assert.equal(timeoutNotice.description, 'Special kiss for å fortsette 😉');
});

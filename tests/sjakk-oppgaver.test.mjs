import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { periode, oppdater, etterPause, START, RD_MIN } from '../public/sjakk/oppgaver/glicko.mjs';
import { validerOppgave } from '../public/sjakk/oppgaver/valider.mjs';
import { Losning } from '../public/sjakk/oppgaver/oppgave.mjs';
import { dagensOppgave, nivaFor, bandForNiva, iDagOslo, dagRekke, malRating, velgOppgave, bandNaer, kortDato } from '../public/sjakk/oppgaver/utvalg.mjs';
import { nyTilstand, les, lagre, registrer, NOKKEL } from '../public/sjakk/oppgaver/lagring.mjs';

const naer = (a, b, eps, melding) => assert.ok(Math.abs(a - b) < eps, `${melding}: ${a} ≠ ${b}`);
const minne = () => { const m = new Map(); return { getItem: k => m.get(k) ?? null, setItem: (k, v) => m.set(k, String(v)) }; };

// Scholar's mate as a one-move puzzle.
const matt = { id: 'test1', fen: 'r1bqkbnr/pppp1ppp/2n5/4p3/2B1P3/5Q2/PPPP1PPP/RNB1K1NR b KQkq - 3 3', moves: ['a7a6', 'f3f7'], rating: 600, rd: 80, themes: ['mate', 'mateIn1'] };

test('Glicko-2 følger regneeksempelet i Glickmans artikkel', () => {
  const ny = periode({ rating: 1500, rd: 200, vol: 0.06 }, [
    { rating: 1400, rd: 30, score: 1 },
    { rating: 1550, rd: 100, score: 0 },
    { rating: 1700, rd: 300, score: 0 },
  ], 0.5);
  naer(ny.rating, 1464.06, 0.05, 'rating');
  naer(ny.rd, 151.52, 0.05, 'RD');
  naer(ny.vol, 0.05999, 0.00002, 'volatilitet');
});

test('ny spiller flytter seg mye, en etablert lite, og RD holder seg innenfor grensene', () => {
  const vant = oppdater(START, { rating: 1500, rd: 80 }, 1);
  assert.ok(vant.rating - 1500 > 150, 'stor gevinst med høy RD');
  assert.ok(vant.rd < START.rd);
  const tapte = oppdater(START, { rating: 1500, rd: 80 }, 0);
  naer(tapte.rating - 1500, -(vant.rating - 1500), 0.01, 'symmetrisk');
  const fast = { rating: 1800, rd: 50, vol: 0.06 };
  const liten = oppdater(fast, { rating: 1800, rd: 80 }, 1).rating - 1800;
  assert.ok(liten > 3 && liten < 15, `liten endring: ${liten}`);
  assert.ok(oppdater(fast, { rating: 1200, rd: 80 }, 1).rating - 1800 < oppdater(fast, { rating: 2200, rd: 80 }, 1).rating - 1800, 'vanskeligere gir mer');
  let s = { ...START };
  for (let i = 0; i < 200; i++) s = oppdater(s, { rating: 1500, rd: 75 }, i % 2);
  assert.ok(s.rd >= RD_MIN);
  assert.ok(etterPause({ rating: 1500, rd: 60, vol: 0.09 }, 30).rd > 60, 'RD vokser i pauser');
});

test('registrering: hint gir halv gevinst, feil gir fullt tap, og rekka nullstilles', () => {
  const a = nyTilstand(), b = nyTilstand();
  const opp = { id: 'x', rating: 1500, rd: 80 };
  const full = registrer(a, opp, { lost: true }, 1000);
  const halv = registrer(b, opp, { lost: true, hint: true }, 1000);
  naer(halv, full / 2, 1, 'halv gevinst');
  assert.equal(a.rekke, 1);
  registrer(a, { ...opp, id: 'y' }, { lost: false }, 2000);
  assert.equal(a.rekke, 0);
  assert.equal(a.besteRekke, 1);
  assert.deepEqual(a.sett, ['x', 'y']);
  assert.equal(a.antall, 2);
  assert.equal(a.losteAntall, 1);
});

test('lagret tilstand er versjonert og tåler søppel', () => {
  const lager = minne();
  const t = nyTilstand();
  registrer(t, { id: 'abc', rating: 1400, rd: 80 }, { lost: true }, 5);
  t.dagens['2026-11-02'] = { id: 'abc', niva: 1500, forsok: 1, hint: false, status: 'løst' };
  lagre(t, lager);
  assert.deepEqual(les(lager), t);
  lager.setItem(NOKKEL, '{"versjon":1,"spiller":{"rating":"høy"},"sett":[1,"ok"],"dagens":{"nei":{}}}');
  const r = les(lager);
  assert.equal(r.spiller.rating, 1500);
  assert.deepEqual(r.sett, ['ok']);
  assert.deepEqual(r.dagens, {});
  lager.setItem(NOKKEL, 'ikke json');
  assert.deepEqual(les(lager), nyTilstand());
});

test('validering godtar en riktig oppgave og avviser ulovlige trekk, feil lengde og falsk matt', () => {
  assert.equal(validerOppgave(matt).ok, true);
  assert.equal(validerOppgave({ ...matt, moves: ['a7a6', 'f3f8'] }).ok, false);
  assert.equal(validerOppgave({ ...matt, moves: ['a7a6'] }).ok, false);
  assert.equal(validerOppgave({ ...matt, moves: ['a7a6', 'f3f7', 'e8f7'] }).ok, false);
  assert.equal(validerOppgave({ ...matt, moves: ['a7a6', 'f3e3'] }).ok, false, 'ikke matt');
  assert.equal(validerOppgave({ ...matt, themes: ['mateIn2'] }).ok, false, 'feil antall trekk til matt');
  assert.equal(validerOppgave({ ...matt, fen: 'ikke en fen' }).ok, false);
  assert.equal(validerOppgave({ ...matt, moves: ['a7a6', 'f3f7; drop'] }).ok, false);
});

test('alle oppgavene i datafilene er gyldige og ligger i riktig bånd', () => {
  const indeks = JSON.parse(readFileSync(new URL('../public/sjakk/oppgaver/data/indeks.json', import.meta.url)));
  let antall = 0;
  for (const [band, n] of Object.entries(indeks.band)) {
    const rader = JSON.parse(readFileSync(new URL(`../public/sjakk/oppgaver/data/b${band}.json`, import.meta.url)));
    assert.equal(rader.length, n);
    // Replaying every puzzle takes a while; every 100th covers all bands quickly.
    for (const [i, [id, fen, moves, rating, rd, themes]] of rader.entries()) {
      assert.ok(Number(band) === 400 ? rating < 500 : Number(band) === 2900 ? rating >= 2900 : rating >= Number(band) && rating < Number(band) + 100, `${id} i bånd ${band}`);
      if (i % 100 === 0) assert.equal(validerOppgave({ fen, moves: moves.split(' '), themes: themes.split(' ') }).ok, true, id);
      assert.ok(rd > 0);
    }
    antall += n;
  }
  assert.ok(antall > 20000);
});

test('oppgavemotoren: motstanderens trekk først, riktig, feil og alternativ matt', () => {
  const L = new Losning(matt);
  assert.equal(L.farge, 'w');
  assert.equal(L.spillerTur, false);
  L.motstander();
  assert.equal(L.spillerTur, true);
  assert.equal(L.hintFelt, 'f3');
  assert.equal(L.prov({ from: 'f3', to: 'e3' }).resultat, 'feil');
  assert.equal(L.prov({ from: 'f3', to: 'f8' }), null, 'ulovlig');
  assert.equal(L.prov({ from: 'f3', to: 'f7' }).resultat, 'løst');
  assert.equal(L.ferdig, true);

  // Two ways to mate: Lichess accepts either on the final move.
  const to = { fen: '6k1/p4ppp/8/8/8/8/1Q6/K2R4 b - - 0 1', moves: ['a7a6', 'd1d8'], rating: 800, rd: 80, themes: ['mate'] };
  assert.equal(validerOppgave(to).ok, true);
  const L2 = new Losning(to);
  L2.motstander();
  assert.equal(L2.prov({ from: 'b2', to: 'b8' }).resultat, 'løst');

  const lang = { fen: 'r1bqkbnr/pppp1ppp/2n5/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 2 3', moves: ['f1c4', 'g8f6', 'f3g5', 'd7d5'], rating: 900, rd: 80, themes: [] };
  const L3 = new Losning(lang);
  L3.motstander();
  assert.equal(L3.farge, 'b');
  assert.equal(L3.prov({ from: 'g8', to: 'f6' }).resultat, 'riktig');
  L3.motstander();
  assert.equal(L3.prov({ from: 'd7', to: 'd5' }).resultat, 'løst');
  L3.ga(1);
  assert.equal(L3.spillerTur, true);
});

test('dagens oppgave er lik for alle på samme nivå og dato, og varierer med dato og nivå', () => {
  const rader = Array.from({ length: 400 }, (_, i) => [`id${String(i).padStart(3, '0')}`, matt.fen, 'a b c d', 1400 + (i % 200), 80, '']);
  const a = dagensOppgave('2026-11-02', 1500, rader);
  assert.equal(dagensOppgave('2026-11-02', 1500, [...rader].reverse()).id, a.id, 'uavhengig av rekkefølgen i filen');
  assert.equal(dagensOppgave('2026-11-02', 1500, rader).id, a.id);
  const uke = new Set(Array.from({ length: 30 }, (_, i) => dagensOppgave(`2026-11-${String(i + 1).padStart(2, '0')}`, 1500, rader).id));
  assert.equal(uke.size, 30, 'ingen gjentakelser innen en måned');
  const andre = rader.map(r => [r[0], r[1], r[2], r[3] - 200, r[4], r[5]]);
  assert.ok(dagensOppgave('2026-11-02', 1300, andre));
  assert.equal(nivaFor(1500), 1500);
  assert.equal(nivaFor(1610), 1700);
  assert.equal(nivaFor(150), 500);
  assert.equal(nivaFor(3300), 2900);
  assert.deepEqual(bandForNiva(1500), [1400, 1500]);
  assert.deepEqual(bandForNiva(500), [400, 500]);
});

test('Oslo-dato, dagsrekke og dato-tekst', () => {
  assert.equal(iDagOslo(new Date('2026-11-01T23:30:00Z')), '2026-11-02');
  assert.equal(iDagOslo(new Date('2026-07-01T21:59:00Z')), '2026-07-01');
  assert.equal(iDagOslo(new Date('2026-07-01T22:01:00Z')), '2026-07-02');
  const dagens = { '2026-10-30': { status: 'løst' }, '2026-10-31': { status: 'løst' }, '2026-11-01': { status: 'løst' } };
  assert.equal(dagRekke(dagens, '2026-11-02'), 3, 'i dag ikke spilt ennå');
  assert.equal(dagRekke({ ...dagens, '2026-11-02': { status: 'løst' } }, '2026-11-02'), 4);
  assert.equal(dagRekke({ ...dagens, '2026-11-01': { status: 'feilet' } }, '2026-11-02'), 0);
  assert.equal(kortDato('2026-11-02'), '2. nov');
});

test('vanskelighet og utvalg holder seg nær målet og hopper over sette oppgaver', () => {
  assert.equal(malRating(1500, 'enklest'), 900);
  assert.equal(malRating(1500, 'vanskeligst'), 2100);
  assert.equal(malRating(500, 'enklest'), 400);
  assert.deepEqual(bandNaer(1520, 2), [1500, 1400]);
  assert.deepEqual(bandNaer(1580, 2), [1500, 1600]);
  const rader = [['a', matt.fen, 'x y', 1490, 80, 'fork'], ['b', matt.fen, 'x y', 1510, 80, 'pin'], ['c', matt.fen, 'x y', 1900, 80, 'fork']];
  assert.equal(velgOppgave(rader, 1500, { sett: new Set(['a']), tilfeldig: () => 0 }).id, 'b');
  assert.equal(velgOppgave(rader, 1500, { tema: 'fork', sett: new Set(['a']) }).id, 'c', 'vinduet utvides');
  assert.equal(velgOppgave(rader, 1500, { sett: new Set(['a', 'b', 'c']) }), null);
});

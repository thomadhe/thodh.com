import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import nextConfig from '../next.config.ts';
import { lagKort, kortKo } from '../public/sjakk/apninger/kort.mjs';
import { lesApning } from '../public/sjakk/apninger/modell.mjs';
import { settValgt } from '../public/sjakk/apninger/repertoar.mjs';
import { NOKKEL as FREMGANG, tomFremgang } from '../public/sjakk/apninger/repetisjon.mjs';
import { KONTO } from '../public/sjakk/apninger/synk.mjs';
import { NOKKEL as OPPGAVER_LAGER, nyTilstand } from '../public/sjakk/oppgaver/lagring.mjs';
import { dagensOppgave, nivaFor } from '../public/sjakk/oppgaver/utvalg.mjs';
import { apningerHtml, finnDagens, nesteHtml, oppgaveOversikt, oppgaveStilling, oppgaverHtml, tilTreneren } from '../public/sjakk-for-1/oversikt.mjs';

const DATO = '2026-11-06';
const les = fil => JSON.parse(readFileSync(fil, 'utf8'));
const apning = id => lesApning(les(`public/sjakk/apninger/data/${id}.json`)).apning;

function uiFor(valgte, fremgang = tomFremgang()) {
  for (const a of valgte) settValgt(fremgang, a.id, true);
  const kort = lagKort(valgte);
  return { valgte: () => valgte, kort: () => kort, fremgang: () => fremgang };
}

test('the old addresses redirect for good and the new ones reach real files', async () => {
  const redirects = await nextConfig.redirects();
  for (const del of ['apninger', 'oppgaver']) assert.deepEqual(redirects.find(r => r.source === `/sjakk/${del}`), { source: `/sjakk/${del}`, destination: `/sjakk-for-1/${del}`, permanent: true });
  const rewrites = await nextConfig.rewrites();
  for (const kilde of ['/sjakk', '/sjakk-for-1', '/sjakk-for-1/apninger', '/sjakk-for-1/oppgaver']) {
    const treff = rewrites.find(r => r.source === kilde);
    assert.ok(treff, kilde);
    assert.ok(existsSync(path.join('public', treff.destination)), treff.destination);
  }
  assert.equal(rewrites.some(r => /^\/sjakk\/(apninger|oppgaver)$/.test(r.source)), false);
});

test('no chess page links to the old addresses', () => {
  const sider = ['public/sjakk', 'public/sjakk-for-1'].flatMap(mappe => readdirSync(mappe, { recursive: true }).map(fil => path.join(mappe, fil)))
    .filter(fil => /\.(html|mjs)$/.test(fil) && !fil.includes('vendor'));
  assert.ok(sider.length > 20);
  for (const fil of sider) assert.doesNotMatch(readFileSync(fil, 'utf8'), /\/sjakk\/(apninger|oppgaver)(?![\w/.-])/, fil);
});

test('saved progress keeps its keys', () => {
  assert.equal(FREMGANG, 'sjakk-apninger');
  assert.equal(KONTO, 'sjakk-apninger-konto');
  assert.equal(OPPGAVER_LAGER, 'sjakk-oppgaver-v1');
  assert.match(readFileSync('public/sjakk/apninger/app.mjs', 'utf8'), /const FANE = 'sjakk-apninger-fane';/);
});

test('the trainer\'s addresses work from the home page', () => {
  assert.equal(tilTreneren('<a href="#/repertoar/kort/hvit">'), '<a href="/sjakk-for-1/apninger#/repertoar/kort/hvit">');
  assert.equal(tilTreneren('<a href="/konto">'), '<a href="/konto">');
});

test('a new visitor is sent to build a repertoire and meets no numbers', () => {
  const ui = uiFor([]);
  assert.match(nesteHtml(ui), /Bygg repertoaret/);
  assert.match(nesteHtml(ui), /href="\/sjakk-for-1\/apninger#\/repertoar\/bygg"/);
  const apninger = apningerHtml(ui);
  assert.equal(apninger.match(/Ikke satt opp ennå/g).length, 2);
  assert.match(apninger, /#\/repertoar\/bygg\/svart/);
  const oppgaver = oppgaverHtml(oppgaveOversikt(nyTilstand(), DATO));
  assert.match(oppgaver, /Først finner vi nivået ditt/);
  assert.match(oppgaver, /3 oppgaver til/);
  assert.match(oppgaver, /#rangert/);
  assert.match(oppgaver, /#lynlop/);
  assert.doesNotMatch(oppgaver, /en-verdi/);
});

test('the numbers are the trainer\'s', () => {
  const [hvit, svart] = [apning('kongegambitt'), apning('budapest-gambitt')];
  const ui = uiFor([hvit, svart]);
  const tall = farge => kortKo(ui.kort(), ui.fremgang(), Date.now(), 0, farge).kort.length;
  const neste = nesteHtml(ui);
  assert.match(neste, new RegExp(`Hvit: ${tall('w')} kort · Svart: ${tall('b')} kort`));
  assert.match(neste, /href="\/sjakk-for-1\/apninger#\/repertoar\/kort\/hvit"/);
  assert.match(neste, /href="\/sjakk-for-1\/apninger#\/repertoar\/kort\/svart"/);
  const rom = apningerHtml(ui, { antall: 31 });
  assert.match(rom, new RegExp(`${tall('w')} klare`));
  assert.match(rom, /#\/repertoar\/hvit/);
  assert.match(rom, /Ta spørsmålene på nytt/);
  assert.match(rom, /Bla i alle 31/);
});

test('one colour chosen leaves the other to set up', () => {
  const rom = apningerHtml(uiFor([apning('kongegambitt')]));
  assert.equal(rom.match(/Ikke satt opp ennå/g).length, 1);
  assert.match(rom, /#\/repertoar\/bygg\/svart/);
});

test('today\'s puzzle and the rating come from the saved state', () => {
  const t = { ...nyTilstand(), antall: 12, losteAntall: 9, spiller: { rating: 1642, rd: 80, vol: 0.06, sist: 1 }, lynlop: { beste: 14, spilt: 3, besteDato: null } };
  const urort = oppgaveOversikt(t, DATO);
  assert.equal(urort.plassering, false);
  assert.equal(urort.niva, nivaFor(1642));
  assert.equal(urort.status, 'Ikke prøvd ennå');
  assert.equal(urort.rating, '1642');
  t.dagens = { [DATO]: { id: 'a', niva: 1700, forsok: 2, hint: true, status: 'løst' }, '2026-11-05': { id: 'b', niva: 1700, forsok: 1, hint: false, status: 'løst' } };
  const o = oppgaveOversikt(t, DATO);
  assert.equal(o.status, 'Løst på 2. forsøk med hint');
  assert.equal(o.rekke, 2);
  const html = oppgaverHtml(o, { fen: '8/8/8/8/8/8/8/K1k5 w - - 0 1', farge: 'w' });
  assert.match(html, /Nivå 1600–1800/);
  assert.match(html, /Hvit i trekket/);
  assert.match(html, /2 dager på rad/);
  assert.match(html, /Rekord 14/);
});

test('the picture is the same puzzle the puzzle page opens, after the opponent\'s move', () => {
  const t = { ...nyTilstand(), antall: 12, spiller: { rating: 1642, rd: 80, vol: 0.06, sist: 1 } };
  const rader = [...les('public/sjakk/oppgaver/data/b1600.json'), ...les('public/sjakk/oppgaver/data/b1700.json')];
  const forventet = dagensOppgave(DATO, 1700, rader);
  assert.equal(finnDagens(t, DATO, rader).id, forventet.id);
  const annen = rader.find(r => r[0] !== forventet.id);
  t.dagens[DATO] = { id: annen[0], niva: 1700, forsok: 0, hint: false, status: 'åpen' };
  assert.equal(finnDagens(t, DATO, rader).id, annen[0]);
  const { fen, farge } = oppgaveStilling(forventet);
  assert.notEqual(fen, forventet.fen);
  assert.equal(farge, fen.split(' ')[1]);
  assert.notEqual(farge, forventet.fen.split(' ')[1]);
});

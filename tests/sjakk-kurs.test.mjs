// Walkthroughs ("gjennomganger"): the course format, the voice text, timing, progress and its merge.
import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync, writeFileSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { lesApning } from '../public/sjakk/apninger/modell.mjs';
import { KURS_SCHEMA, kursMerke, kursStatus, kursTid, kursTilbys, lagKursLager, lesKurs, lesetid, linjeTekst, merkFerdig, merkKapittel, merkSted, merkTilbudt, trekkTekst, trekkTid } from '../public/sjakk/apninger/kurs.mjs';
import { FARTER, TALE_NOKKEL, lagTale, lesInnstilling, setninger, stemmeKortnavn, stemmePoeng, taleTekst, tallOrd, velgStemme } from '../public/sjakk/apninger/tale.mjs';
import { slaSammen, flettKurs, lik } from '../public/sjakk/apninger/synk.mjs';
import { lesFremgang, tomFremgang } from '../public/sjakk/apninger/repetisjon.mjs';
import { forstFra, kortKo, lagKort } from '../public/sjakk/apninger/kort.mjs';
import { gjennomgangerHtml } from '../public/sjakk-for-1/oversikt.mjs';

const DATA = 'public/sjakk/apninger/data';
const les = fil => JSON.parse(readFileSync(fil, 'utf8'));
const manifest = les(`${DATA}/manifest.json`);
const apning = id => lesApning(les(`${DATA}/${id}.json`)).apning;
const smith = apning('smith-morra');
const EKSEMPEL = les('tests/fixtures/kurs-smith-morra.json');
const kopi = () => structuredClone(EKSEMPEL);
const finnes = id => manifest.apninger.includes(id);
const lesMed = data => lesKurs(data, { apning: smith, finnes });

test('kurs: eksempelkurset leses uten feil og advarsler', () => {
  const { kurs, feil, advarsler } = lesMed(kopi());
  assert.deepEqual(feil, []);
  assert.deepEqual(advarsler, []);
  assert.equal(KURS_SCHEMA, 1);
  assert.deepEqual(kurs.kapitler.map(k => k.steg.length), [3, 4, 3]);
  assert.equal(kurs.huskeregler.length, 4);
});

test('kurs: hvert steg vet stillingen før, trekkene som spilles inn og stillingen etter', () => {
  const { kurs } = lesMed(kopi());
  const [forste, andre] = kurs.kapitler;
  assert.deepEqual(forste.start.san, ['e4', 'c5']);
  assert.deepEqual(forste.steg[0].trekk.map(m => m.san), ['d4', 'cxd4', 'c3']);
  assert.deepEqual(forste.steg[0].vist.san, ['e4', 'c5', 'd4', 'cxd4', 'c3']);
  assert.deepEqual(forste.steg[1].foer.san, forste.steg[0].vist.san);
  assert.deepEqual(forste.steg[0].piler, [{ fra: 'b1', til: 'c3', type: 'plan' }]);
  // A valg question moves nothing.
  assert.equal(forste.steg[2].vist.fen, forste.steg[2].etter.fen);
  // fra that branches off the line so far plays only the new moves; a trekk question ends on its first answer.
  const sporsmal = andre.steg[2];
  assert.deepEqual(sporsmal.trekk.map(m => m.san), ['a6']);
  assert.equal(sporsmal.vist.san.at(-1), 'a6');
  assert.equal(sporsmal.etter.san.at(-1), 'e5');
  assert.equal(sporsmal.sporsmal.riktig.san, 'e5');
  assert.deepEqual(andre.steg[3].foer.san, sporsmal.etter.san);
  assert.deepEqual(andre.steg[3].piler, [{ fra: 'd1', til: 'd8', type: 'fare' }]);
});

test('kurs: et hopp til en helt annen linje spiller bare de siste trekkene inn', () => {
  const data = kopi();
  data.kapitler[0].steg.push({ fra: 'e4 c5 d4 cxd4 c3 Nf6 e5 Nd5 Nf3 Nc6 Bc4 Nb6 Bb3 d6 exd6 Qxd6', tekst: 'Et annet sted.', alternativ: true });
  const steg = lesMed(data).kurs.kapitler[0].steg.at(-1);
  assert.equal(steg.trekk.length, 8);
  assert.equal(steg.foer.san.length, 8);
  assert.equal(trekkTekst(steg), '5.Sf3 Sc6 6.Lc4 Sb6 7.Lb3 d6 8.exd6 Dxd6');
});

test('kurs: feil i trekk, felt, piler, id-er og spørsmål blir funnet', () => {
  const tilfeller = [
    [d => { d.kapitler[0].steg[0].trekk = 'd4 cxd4 c4c3'; }, /trekk: ulovlig trekk «c4c3»/],
    [d => { d.kapitler[0].steg[0].trekk = 'd4 cxd4 Ng1f3'; }, /bør skrives «Nf3»/],
    [d => { d.kapitler[0].steg[1].fra = 'e4 c5'; }, /trekk eller fra, ikke begge/],
    [d => { d.kapitler[0].start = 'e4 c5 Ke3'; }, /start: ulovlig trekk «Ke3»/],
    [d => { d.kapitler[0].steg[0].piler = ['b1c9']; }, /ugyldig pil «b1c9»/],
    [d => { d.kapitler[0].steg[0].fare = ['x1c3']; }, /ugyldig pil «x1c3»/],
    [d => { d.kapitler[0].steg[1].felt = ['c33']; }, /ugyldig felt «c33»/],
    [d => { d.kapitler[1].id = 'ideen'; }, /id-en er brukt før/],
    [d => { d.kapitler[1].id = 'Store Bokstaver'; }, /id må være små bokstaver/],
    [d => { d.kapitler[1].steg[2].sporsmal.svar = ['Qh5']; }, /sporsmal\.svar: ulovlig trekk «Qh5»/],
    [d => { d.kapitler[0].steg[2].sporsmal.riktig = 3; }, /sporsmal\.riktig må peke/],
    [d => { delete d.kapitler[0].steg[2].sporsmal.forklaring; }, /sporsmal\.forklaring mangler/],
    [d => { d.kapitler[0].steg[2].sporsmal.type = 'fritekst'; }, /type må være trekk eller valg/],
    [d => { d.kapitler[0].steg[1].tekst = ' '; }, /mangler tekst/],
    [d => { d.apning = 'finnes-ikke'; }, /finnes ikke/],
    [d => { d.schema = 2; }, /schema må være 1/],
    [d => { d.minutter = 0; }, /minutter/],
  ];
  for (const [endre, monster] of tilfeller) {
    const data = kopi();
    endre(data);
    const { feil } = lesKurs(data, { apning: data.apning === 'smith-morra' ? smith : null, finnes });
    assert.ok(feil.some(f => monster.test(f)), `${monster} ikke blant ${JSON.stringify(feil)}`);
  }
});

test('kurs: et kapittel med feil faller bort, resten av kurset står', () => {
  const data = kopi();
  data.kapitler[1].steg[0].trekk = 'Nc6 Nf3 d6 Bc5';
  const { kurs, feil } = lesMed(data);
  assert.equal(feil.length, 1);
  assert.deepEqual(kurs.kapitler.map(k => k.id), ['ideen', 'lg4']);
  const ingenting = kopi();
  for (const k of ingenting.kapitler) k.start = 'e5';
  assert.equal(lesMed(ingenting).kurs, null);
  assert.equal(lesKurs(null).kurs, null);
});

test('kurs: et annet trekk enn treet gir advarsel, og "alternativ" sier at det er med vilje', () => {
  const data = kopi();
  data.kapitler[1].steg[0].trekk = 'Nc6 Nf3 d6 Bb5';
  let { advarsler, feil } = lesMed(data);
  assert.deepEqual(feil, []);
  assert.ok(advarsler.some(a => /viser Bb5 der treet spiller Bc4/.test(a)), advarsler.join('\n'));
  data.kapitler[1].steg[0].alternativ = true;
  ({ advarsler } = lesMed(data));
  assert.ok(!advarsler.some(a => /Bb5/.test(a)));
  // Moves the tree knows nothing about, and the opponent's moves, are free.
  const fritt = kopi();
  fritt.kapitler[1].steg[0].trekk = 'Nc6 Nf3 d6 Bc4 h6';
  assert.deepEqual(lesMed(fritt).advarsler, []);
  // A trekk question in a tree position should have the tree's move first.
  const sporsmal = kopi();
  sporsmal.kapitler[1].steg[2].sporsmal.svar = ['Nd5', 'e5'];
  assert.ok(lesMed(sporsmal).advarsler.some(a => /svaret er Nd5, men treet spiller e5/.test(a)));
  // Without the tree there is nothing to compare with.
  assert.deepEqual(lesKurs(data).advarsler.filter(a => /treet/.test(a)), []);
});

test('kurs: ukjente felt, lange tekster og feil antall huskeregler er advarsler', () => {
  const data = kopi();
  data.kapitler[0].steg[0].pil = ['b1c3'];
  data.kapitler[0].steg[1].tekst = 'Lang. '.repeat(100);
  data.huskeregler = ['Én'];
  const { advarsler, feil } = lesMed(data);
  assert.deepEqual(feil, []);
  assert.ok(advarsler.some(a => /ukjent felt «pil»/.test(a)));
  assert.ok(advarsler.some(a => /en idé per steg/.test(a)));
  assert.ok(advarsler.some(a => /huskeregler bør være 4–6/.test(a)));
});

// Every course the content agents have written, with the same checks as the verifier.
const KURS = `${DATA}/kurs`;
const kursFiler = existsSync(KURS) ? readdirSync(KURS).filter(fil => fil.endsWith('.json')) : [];
for (const fil of kursFiler) {
  test(`kurs ${fil}: gyldig, hører til en åpning og følger treet`, () => {
    const data = les(`${KURS}/${fil}`);
    assert.equal(`${data.apning}.json`, fil);
    const { kurs, feil, advarsler } = lesKurs(data, { apning: finnes(data.apning) ? apning(data.apning) : null, finnes });
    assert.deepEqual(feil, []);
    assert.ok(kurs.kapitler.length > 0);
    if (advarsler.length) console.log(`${fil}: ${advarsler.length} advarsler\n  ${advarsler.join('\n  ')}`);
  });
}

test('verifiser-kurs: godtar eksempelet og stopper på feil', () => {
  const skript = 'scripts/sjakk-apninger/verifiser-kurs.mjs';
  const ok = spawnSync(process.execPath, [skript, '--fil', 'tests/fixtures/kurs-smith-morra.json'], { encoding: 'utf8' });
  assert.equal(ok.status, 0, ok.stderr);
  assert.match(ok.stdout, /3 kapitler, 10 steg, 3 spørsmål/);
  const mappe = mkdtempSync(path.join(tmpdir(), 'kurs-'));
  try {
    const data = kopi();
    data.kapitler[0].steg[0].trekk = 'd4 d4';
    writeFileSync(path.join(mappe, 'smith-morra.json'), JSON.stringify(data));
    const feil = spawnSync(process.execPath, [skript, '--fil', path.join(mappe, 'smith-morra.json')], { encoding: 'utf8' });
    assert.equal(feil.status, 1);
    assert.match(feil.stderr, /FEIL kurs smith-morra: kapitler\[0\] «ideen» steg\[0\]: trekk: ulovlig trekk «d4»/);
  } finally { rmSync(mappe, { recursive: true, force: true }); }
  const alle = spawnSync(process.execPath, [skript], { encoding: 'utf8' });
  assert.equal(alle.status, 0, alle.stderr);
});

test('tid: teksten får tid etter lengden, aldri så kort at den ikke rekker å leses', () => {
  assert.equal(lesetid('Kort.'), 3000);
  const lang = 'ord '.repeat(40);
  assert.ok(lesetid(lang) > 15000);
  assert.ok(lesetid(lang, 1.5) < lesetid(lang));
  assert.ok(lesetid(lang, 1.5) >= 1200 + 40 * 230);
  assert.ok(lesetid(lang, 0.8) > lesetid(lang));
  assert.equal(trekkTid(1), 800);
  assert.ok(trekkTid(1.5) >= 420 && trekkTid(1.5) < 800);
  const { kurs } = lesMed(kopi());
  assert.ok(kursTid(kurs) > 60000 && kursTid(kurs) < 5 * 60000);
  assert.equal(linjeTekst(['e4', 'c5', 'Nf3']), '1.e4 c5 2.Sf3');
});

test('tale: trener-notasjonen blir norsk tale', () => {
  const tilfeller = [
    ['Etter 3.Sf3 Sc6 4.Lc4 Lc5 er 5.0-0 naturlig.', 'Etter tre springer f3, springer c6, fire løper c4, løper c5 er fem kort rokade naturlig.'],
    ['2.f4! Hvit ofrer en bonde.', 'to f4. Hvit ofrer en bonde.'],
    ['Svart spiller 3…dxc3, og vi tar med 4.Sxc3.', 'Svart spiller tre, d tar c3, og vi tar med fire springer tar c3.'],
    ['…Dd4 og …e4 før slaget.', 'dronning d4 og e4 før slaget.'],
    ['7.Lxf7+! Kxf7 8.Sg5+ Ke8 9.Dxg4', 'sju løper tar f7, sjakk, konge tar f7, åtte springer g5, sjakk, konge e8, ni dronning tar g4'],
    ['Pass på …Sf6–g4 og Sd4.', 'Pass på springer fra f6 til g4 og springer d4.'],
    ['Lang rokade: 0-0-0, og e8=D# til slutt.', 'Lang rokade: lang rokade, og e8 blir dronning, matt til slutt.'],
    ['Sbd2 og T1e1, f.eks. etter 12.h3.', 'springer b d2 og tårn 1 e1, for eksempel etter tolv h3.'],
    ['e4-bonden, d-linjen og 1950-årene.', 'e4-bonden, d-linjen og 1950-årene.'],
    ['Dette er Traxler. Se på f2.', 'Dette er Traxler. Se på f2.'],
    ['Etter 24…Txe1 er det over.', 'Etter tjuefire, tårn tar e1 er det over.'],
  ];
  for (const [inn, ut] of tilfeller) assert.equal(taleTekst(inn), ut);
  assert.equal(tallOrd(1), 'en');
  assert.equal(tallOrd(21), 'tjueen');
  assert.equal(tallOrd(40), 'førti');
  assert.deepEqual(setninger('2.f4! Hvit ofrer. Hva nå? Vi ser.'), ['to f4.', 'Hvit ofrer.', 'Hva nå?', 'Vi ser.']);
});

const STEMMER = [
  { name: 'Microsoft David - English (United States)', lang: 'en-US', localService: true },
  { name: 'Microsoft Jon - Norwegian (Bokmål) (Norway)', lang: 'nb-NO', localService: true },
  { name: 'Microsoft Finn Online (Natural) - Norwegian (Bokmål) (Norway)', lang: 'nb-NO', localService: false },
  { name: 'Microsoft Pernille Online (Natural) - Norwegian (Bokmål) (Norway)', lang: 'nb-NO', localService: false },
  { name: 'Google norsk', lang: 'no-NO', localService: false },
];

test('tale: den beste norske stemmen velges, og ingen når det ikke finnes noen', () => {
  assert.equal(velgStemme(STEMMER).name, STEMMER[3].name);
  assert.equal(velgStemme(STEMMER.slice(0, 2)).name, STEMMER[1].name);
  assert.equal(velgStemme([STEMMER[0], STEMMER[4]]).name, 'Google norsk');
  assert.equal(velgStemme([STEMMER[0], { name: 'Nynorsk', lang: 'nn-NO' }]).lang, 'nn-NO');
  assert.equal(velgStemme([STEMMER[0]]), null);
  assert.equal(velgStemme([]), null);
  assert.equal(stemmePoeng({ name: 'X', lang: 'nb_NO' }) > 0, true);
  assert.equal(stemmeKortnavn(STEMMER[3]), 'Pernille');
});

// A stand-in for speechSynthesis: it says each sentence when told to, and records what was said.
function lagSynth(stemmer = STEMMER) {
  const synth = { sagt: [], koen: [], avbrutt: 0, getVoices: () => stemmer, addEventListener() {},
    speak(y) { synth.koen.push(y); synth.sagt.push(y.text); },
    cancel() { synth.avbrutt += 1; const gamle = synth.koen; synth.koen = []; for (const y of gamle) y.onerror?.({ error: 'interrupted' }); },
    ferdig() { const y = synth.koen.shift(); y?.onend?.(); } };
  return synth;
}
class Ytring { constructor(text) { this.text = text; } }
const minne = () => { const data = new Map(); return { getItem: k => data.get(k) ?? null, setItem: (k, v) => data.set(k, v) }; };

test('tale: setning for setning, pause sier setningen på nytt, og avbrudd stopper alt', async () => {
  const synth = lagSynth();
  const tale = lagTale({ synth, Ytring, lager: minne() });
  assert.equal(tale.leser, true);
  assert.equal(tale.stemme.name, STEMMER[3].name);
  let ferdig = false;
  const kontroll = tale.si('Vi spiller 2.d4. Så kommer 3.c3!');
  kontroll.ferdig.then(() => { ferdig = true; });
  assert.deepEqual(synth.sagt, ['Vi spiller to d4.']);
  assert.equal(synth.koen[0].lang, 'nb-NO');
  kontroll.pause();
  kontroll.fortsett();
  assert.deepEqual(synth.sagt, ['Vi spiller to d4.', 'Vi spiller to d4.']);
  synth.ferdig();
  assert.equal(synth.sagt.at(-1), 'Så kommer tre c3.');
  synth.ferdig();
  await new Promise(r => setTimeout(r, 0));
  assert.equal(ferdig, true);
  // Stopped: no more sentences, and the promise never says done.
  let stoppet = false;
  const andre = tale.si('En. To.');
  andre.ferdig.then(() => { stoppet = true; });
  andre.avbryt();
  synth.ferdig();
  await new Promise(r => setTimeout(r, 0));
  assert.equal(stoppet, false);
  assert.equal(synth.sagt.at(-1), 'En.');
});

test('tale: av, tempo og ingen norsk stemme huskes og vises riktig', () => {
  const lager = minne();
  const tale = lagTale({ synth: lagSynth(), Ytring, lager });
  tale.settFart(1.25);
  tale.settPaa(false);
  assert.equal(tale.leser, false);
  assert.deepEqual(lesInnstilling(lager), { paa: false, fart: 1.25 });
  assert.deepEqual(JSON.parse(lager.getItem(TALE_NOKKEL)), { paa: false, fart: 1.25 });
  assert.deepEqual(lesInnstilling({ getItem: () => '{"fart":9}' }), { paa: true, fart: 1 });
  assert.ok(FARTER.includes(1));
  const engelsk = lagTale({ synth: lagSynth([STEMMER[0]]), Ytring });
  assert.equal(engelsk.kan, false);
  assert.equal(engelsk.leser, false);
  const ingen = lagTale({ synth: null, Ytring: null });
  assert.equal(ingen.finnes, false);
  assert.equal(ingen.lastet, true);
});

test('fremgang: kapitler, ferdig, tilbudt og stedet, med sist på hver post', () => {
  const { kurs } = lesMed(kopi());
  const fremgang = tomFremgang();
  assert.deepEqual(fremgang.kurs, {});
  assert.equal(kursTilbys(kurs, fremgang), true);
  assert.deepEqual(kursStatus(kurs, fremgang), { sett: 0, antall: 3, ferdig: false, startet: false, tilbudt: false, sted: { kapittel: 0, steg: 0 } });
  merkTilbudt(fremgang, 'smith-morra', 100);
  assert.equal(kursTilbys(kurs, fremgang), false);
  merkSted(fremgang, 'smith-morra', 'oppstillingen', 2, 150);
  assert.deepEqual(kursStatus(kurs, fremgang).sted, { kapittel: 1, steg: 2 });
  merkKapittel(fremgang, 'smith-morra', 'ideen', 200);
  merkKapittel(fremgang, 'smith-morra', 'ideen', 300);
  assert.equal(fremgang.kurs['smith-morra'].kapitler.ideen, 200);
  assert.equal(fremgang.kurs['smith-morra'].sist, 300);
  assert.equal(kursMerke(kurs, fremgang), '1 av 3 kapitler');
  merkFerdig(fremgang, 'smith-morra', 400);
  const s = kursStatus(kurs, fremgang);
  assert.equal(s.ferdig, true);
  // A finished course starts from its first chapter not seen, or the beginning.
  assert.deepEqual(s.sted, { kapittel: 1, steg: 0 });
  assert.equal(kursMerke(kurs, fremgang), 'Sett');
  // A stored place outside the course (a chapter removed) falls back.
  const rar = tomFremgang();
  merkSted(rar, 'smith-morra', 'borte', 9, 1);
  assert.deepEqual(kursStatus(kurs, rar).sted, { kapittel: 0, steg: 0 });
  // Old saved progress has no kurs key.
  const gammel = { getItem: () => JSON.stringify({ versjon: 1, linjer: {}, feil: {} }) };
  assert.deepEqual(lesFremgang(gammel).kurs, {});
});

test('synk: gjennomganger flettes – kapitler fra begge, første ferdig, nyeste sted', () => {
  const a = { ...tomFremgang(), kurs: { x: { kapitler: { k1: 10, k2: 30 }, sted: { kapittel: 'k2', steg: 1, sist: 30 }, sist: 30 }, y: { kapitler: { k1: 5 }, ferdig: 6, sist: 6 } } };
  const b = { ...tomFremgang(), kurs: { x: { kapitler: { k1: 20, k3: 40 }, ferdig: 50, tilbudt: 4, sted: { kapittel: 'k3', steg: 0, sist: 40 }, sist: 50 } } };
  const ut = slaSammen(a, b);
  assert.deepEqual(ut.kurs.x, { kapitler: { k1: 10, k2: 30, k3: 40 }, sist: 50, ferdig: 50, tilbudt: 4, sted: { kapittel: 'k3', steg: 0, sist: 40 } });
  assert.deepEqual(ut.kurs.y, a.kurs.y);
  assert.ok(lik(slaSammen(a, b), slaSammen(b, a)));
  assert.ok(lik(slaSammen(ut, ut), ut));
  assert.deepEqual(flettKurs({ kapitler: {}, sist: 1 }, { kapitler: {}, sist: 2 }), { kapitler: {}, sist: 2 });
  // A device that never saw a course keeps the other's.
  const gammel = { ...tomFremgang(), kurs: undefined };
  assert.deepEqual(slaSammen(gammel, b).kurs, b.kurs);
});

test('lagring: kurs hentes én gang, en liste sparer spørsmål, og en feil gir bare ingen gjennomgang', async () => {
  const spurt = [];
  const hent = async adresse => { spurt.push(adresse); if (adresse.includes('smith-morra')) return { ok: true, json: async () => kopi() }; if (adresse.includes('rar')) throw new Error('nett'); return { ok: false }; };
  const lager = lagKursLager({ hent, apning: id => (id === 'smith-morra' ? smith : null), logg: { warn() {} } });
  assert.equal(lager.kjent('smith-morra'), undefined);
  const [kurs, ingen, rar] = await lager.sjekk(['smith-morra', 'traxler', 'rar', 'smith-morra']);
  assert.equal(kurs.tittel, EKSEMPEL.tittel);
  assert.equal(ingen, null);
  assert.equal(rar, null);
  assert.equal(lager.kjent('traxler'), null);
  assert.equal(lager.alleKjent(['smith-morra', 'traxler']), true);
  await lager.hent('smith-morra');
  assert.equal(spurt.length, 3);
  const listet = lagKursLager({ hent, liste: () => ['smith-morra'] });
  assert.equal(await listet.hent('traxler'), null);
  assert.equal(spurt.length, 3);
  // A course for another opening than its file name is not shown there.
  const feilNavn = lagKursLager({ hent: async () => ({ ok: true, json: async () => kopi() }), logg: { warn() {} } });
  assert.equal(await feilNavn.hent('traxler'), null);
});

test('kort: etter en gjennomgang kommer åpningens nye kort først', () => {
  const kongegambitt = apning('kongegambitt');
  const kort = lagKort([kongegambitt, smith]);
  const fremgang = tomFremgang();
  const vanlig = kortKo(kort, fremgang, Date.now(), 0, 'w');
  const forst = kortKo(kort, fremgang, Date.now(), 0, 'w', 'smith-morra');
  assert.equal(forst.nyeKort.length, vanlig.nyeKort.length);
  assert.ok(forst.nyeKort.every(k => k.kilder.some(kilde => kilde.apning.id === 'smith-morra')));
  assert.ok(!vanlig.nyeKort.every(k => k.kilder.some(kilde => kilde.apning.id === 'smith-morra')));
  assert.deepEqual(forstFra(kort, null), kort);
  assert.equal(forstFra(kort, 'smith-morra').length, kort.length);
});

test('forsiden: gjennomganger for valgte åpninger, de uferdige først', () => {
  const { kurs } = lesMed(kopi());
  const andre = { ...kurs, apning: 'kongegambitt', tittel: 'Kongegambitt' };
  const fremgang = tomFremgang();
  assert.equal(gjennomgangerHtml([], fremgang), '');
  merkFerdig(fremgang, 'smith-morra', 1);
  const html = gjennomgangerHtml([{ apning: smith, kurs }, { apning: apning('kongegambitt'), kurs: andre }], fremgang);
  assert.ok(html.indexOf('kongegambitt/gjennomgang') < html.indexOf('smith-morra/gjennomgang'));
  assert.match(html, /href="\/sjakk-for-1\/apninger#\/a\/smith-morra\/gjennomgang"/);
  assert.match(html, /✓ Sett/);
  assert.match(html, /3 kapitler, ideene og planene først/);
});

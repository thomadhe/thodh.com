import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { Chess } from '../public/sjakk/vendor/chess.mjs';
import { lesApning, stilling } from '../public/sjakk/apninger/modell.mjs';
import { tomFremgang, vurderLinje, velgLinje, statusFor, noterFeil, vansker, lesFremgang, NOKKEL, INTERVALL_DAGER } from '../public/sjakk/apninger/repetisjon.mjs';
import { norsk, feilKommentar } from '../public/sjakk/apninger/trener.mjs';
import { formaterApning } from '../scripts/sjakk-apninger/format.mjs';
import { lesInfo, lagMotor, MAKS_DYBDE, MAKS_TID } from '../public/sjakk/apninger/motor.mjs';
import { hvitAndel, vurderingTekst, vurderingBeskrivelse, spillSlutt, lagretOppslag } from '../public/sjakk/apninger/evalbar.mjs';
import { fordel, krysser, kryssI, velgApning, settValgt, erValgt, valgteApninger, startNoder, velgBlandetLinje, STARTFORSLAG } from '../public/sjakk/apninger/repertoar.mjs';
import { lagKort, kortId, vurderKort, kortKo, lagOkt, svarKort, vanskeligst, forfallerIMorgen, dagStart, NYE_PER_DAG, MAKS_FORFALT, OKT_STORRELSE } from '../public/sjakk/apninger/kort.mjs';

const DATA = new URL('../public/sjakk/apninger/data/', import.meta.url);
const manifest = JSON.parse(readFileSync(new URL('manifest.json', DATA), 'utf8'));
const filer = manifest.apninger.map(id => ({ id, tekst: readFileSync(new URL(`${id}.json`, DATA), 'utf8') }));
const apninger = filer.map(({ id, tekst }) => ({ id, data: JSON.parse(tekst), ...lesApning(JSON.parse(tekst)) }));

test('manifestet peker på eksisterende åpninger, og hver gruppe har riktig farge', () => {
  assert.equal(new Set(manifest.apninger).size, manifest.apninger.length);
  for (const gruppe of manifest.grupper) for (const id of gruppe.apninger) {
    const apning = apninger.find(a => a.id === id);
    assert.ok(apning, `${gruppe.id} peker på ukjent ${id}`);
    assert.equal(apning.data.farge, gruppe.farge, `${id} ligger i feil fargegruppe`);
  }
});

for (const { id, data, apning, feil } of apninger) {
  test(`${id}: schema, lovlige linjer og forklaring på hvert repertoartrekk`, () => {
    assert.deepEqual(feil, []);
    assert.equal(data.id, id);
    assert.ok(apning.linjer.length > 0);
    for (const node of apning.noder.values()) {
      if (!node.san) continue;
      if (node.rep) for (const felt of ['hva', 'ide', 'pass']) assert.ok(node.entry[felt]?.trim(), `${node.sti} mangler ${felt}`);
      else assert.ok(node.entry.hva?.trim(), `${node.sti} mangler hva`);
    }
    // Every line replays from the initial position with chess.js and ends with our move or an explained transposition.
    for (const linje of apning.linjer) {
      const chess = new Chess();
      for (const san of [...apning.startTrekk, ...linje.noder.map(n => n.san)]) assert.ok(chess.move(san), `${linje.id}: ${san}`);
      const siste = linje.noder.at(-1);
      assert.ok(siste.rep || siste.overgang, `${linje.id} slutter på motstanderens trekk uten omstilling`);
      if (siste.overgang) assert.equal(stilling(chess.fen()), stilling(siste.overgang.fen));
    }
    for (const felle of apning.feller) {
      assert.ok(['slå', 'unngå'].includes(felle.type), `${felle.id} har ukjent type`);
      assert.equal(felle.losning[0].color, felle.side);
    }
  });

  test(`${id}: filen er i stabilt format`, () => {
    const tekst = filer.find(f => f.id === id).tekst;
    assert.equal(formaterApning(JSON.parse(tekst)), tekst.replace(/\r\n/g, '\n'));
  });
}

test('omstillinger og ulovlige trekk oppdages', () => {
  const base = { schema: 1, id: 'test', navn: 'T', kort: 'k', karakter: 'k', farge: 'w', niva: 'lett', skarphet: 1, intro: { historie: 'h', karakter: 'k', passer: 'p' }, planer: ['p'], modellideer: ['m'] };
  const rep = (sti, extra = {}) => ({ sti, hva: 'h', ide: 'i', pass: 'p', ...extra });
  const ulovlig = lesApning({ ...base, trekk: [rep('e4'), { sti: 'e4 e4', hva: 'x' }] });
  assert.match(ulovlig.feil.join(), /ulovlig trekk/);
  const feilSan = lesApning({ ...base, trekk: [rep('e2e4')] });
  assert.match(feilSan.feil.join(), /e2e4/);
  const konflikt = lesApning({ ...base, trekk: [rep('Nf3'), { sti: 'Nf3 Nf6', hva: 'x' }, rep('Nf3 Nf6 d4', { plan: 'p' }), { sti: 'Nf3 d5', hva: 'x' }, rep('Nf3 d5 d4'), { sti: 'Nf3 d5 d4 Nf6', hva: 'x' }, rep('Nf3 d5 d4 Nf6 c4', { plan: 'p' }), { sti: 'Nf3 Nf6 d4 d5', hva: 'x' }, rep('Nf3 Nf6 d4 d5 e3', { plan: 'p' })] });
  assert.match(konflikt.feil.join(), /omstilling/);
  const manglerSvar = lesApning({ ...base, trekk: [rep('e4'), { sti: 'e4 e5', hva: 'x' }] });
  assert.match(manglerSvar.feil.join(), /mangler vårt svar/);
});

test('repetisjon: feilfri runde flytter linjen opp, feil sender den tilbake', () => {
  const apning = apninger[0].apning;
  const fremgang = tomFremgang();
  const naa = Date.UTC(2026, 10, 3);
  const forste = velgLinje(apning, fremgang, naa);
  assert.equal(forste.grunn, 'ny');
  assert.equal(forste.linje, apning.linjer[0]);
  const post = vurderLinje(fremgang, apning.id, forste.linje.id, 0, naa);
  assert.equal(post.boks, 1);
  assert.equal(post.forfall, naa + INTERVALL_DAGER[1] * 86400000);
  assert.equal(velgLinje(apning, fremgang, naa, forste.linje.id).linje, apning.linjer[1]);
  // A failed line is due at once and is picked before new lines.
  vurderLinje(fremgang, apning.id, apning.linjer[1].id, 2, naa);
  assert.deepEqual(statusFor(apning, fremgang, naa), { totalt: apning.linjer.length, laert: 1, forfaller: 1, nye: apning.linjer.length - 2 });
  const neste = velgLinje(apning, fremgang, naa + 1000, apning.linjer[0].id);
  assert.equal(neste.grunn, 'repetisjon');
  assert.equal(neste.linje, apning.linjer[1]);
  // A day later the first line is due too, and the weaker box comes first.
  const senere = velgLinje(apning, fremgang, naa + 86400000 + 1);
  assert.equal(senere.linje, apning.linjer[1]);
  vurderLinje(fremgang, apning.id, forste.linje.id, 0, naa + 86400000 + 1);
  assert.equal(fremgang.linjer[`${apning.id}|${forste.linje.id}`].boks, 2);
});

test('repetisjon: ekstrarunder før forfall flytter ikke linjen opp', () => {
  const apning = apninger.find(a => a.id === 'halloween-gambitt').apning;
  const fremgang = tomFremgang();
  const naa = Date.UTC(2026, 10, 3);
  for (let runde = 0; runde < 10; runde += 1) {
    const { linje } = velgLinje(apning, fremgang, naa + runde * 60000);
    vurderLinje(fremgang, apning.id, linje.id, 0, naa + runde * 60000);
  }
  for (const linje of apning.linjer) {
    const post = fremgang.linjer[`${apning.id}|${linje.id}`];
    assert.equal(post.boks, 1, `${linje.id} gikk til boks ${post.boks}`);
    assert.equal(post.forfall, naa + INTERVALL_DAGER[1] * 86400000 + apning.linjer.indexOf(linje) * 60000);
  }
  assert.ok(Object.values(fremgang.linjer).reduce((sum, p) => sum + p.runder, 0) === 10);
  // A mistake in an extra round still sends the line back.
  const forste = apning.linjer[0].id;
  assert.equal(vurderLinje(fremgang, apning.id, forste, 1, naa + 3600000).boks, 0);
});

test('fremgang lagres versjonert og vansker telles', () => {
  const minne = new Map();
  const lager = { getItem: k => minne.get(k) ?? null, setItem: (k, v) => minne.set(k, v) };
  assert.deepEqual(lesFremgang(lager), tomFremgang());
  minne.set(NOKKEL, JSON.stringify({ versjon: 99, linjer: { x: 1 }, feil: {} }));
  assert.deepEqual(lesFremgang(lager), tomFremgang());
  minne.set(NOKKEL, '{ikke json');
  assert.deepEqual(lesFremgang(lager), tomFremgang());
  const fremgang = tomFremgang();
  noterFeil(fremgang, 'a', 'e4 e5', 'Bc4');
  noterFeil(fremgang, 'a', 'e4 e5', 'Bc4');
  noterFeil(fremgang, 'b', 'd4', 'c4');
  assert.deepEqual(vansker(fremgang).map(v => [v.apningId, v.antall]), [['a', 2], ['b', 1]]);
});

test('treneren bruker norsk notasjon og forklarer feil', () => {
  assert.equal(norsk('Nxe5'), 'Sxe5');
  assert.equal(norsk('Bb5+'), 'Lb5+');
  assert.equal(norsk('O-O-O'), '0-0-0');
  assert.equal(norsk('exd8=Q+'), 'exd8=D+');
  const kg = apninger.find(a => a.id === 'kongegambitt').apning;
  const nf3 = kg.noder.get('f4 exf4 Nf3');
  assert.match(feilKommentar('Bc4', nf3), /^Du spilte 3\.Lc4, men her vil vi spille Sf3, fordi /);
  const bc5 = kg.noder.get('f4 Bc5 Nf3');
  assert.match(feilKommentar('fxe5', bc5), /Dh4\+/);
});

// Coach text uses Norwegian piece letters (S, L, T, D); English SAN belongs only in sti/trekk.
const ENGELSK_TREKK = /(?:^|[^\p{L}\d])…?[NBRQ][a-h]?[1-8]?x?[a-h][1-8]/u;
function trenerTekster(data) {
  const ut = [['kort', data.kort], ...Object.entries(data.intro ?? {}).map(([k, v]) => [`intro.${k}`, v]), ...data.planer.map((p, i) => [`planer[${i}]`, p]), ...data.modellideer.map((p, i) => [`modellideer[${i}]`, p])];
  for (const f of data.feller ?? []) for (const k of ['navn', 'tekst', 'forklaring']) ut.push([`felle ${f.id}.${k}`, f[k]]);
  for (const s of data.sidelinjer ?? []) for (const k of ['navn', 'tekst']) ut.push([`sidelinje ${s.navn}.${k}`, s[k]]);
  for (const t of data.trekk) {
    for (const k of ['navn', 'hva', 'ide', 'pass', 'vurdering', 'plan']) ut.push([`${t.sti}.${k}`, t[k]]);
    for (const [san, v] of Object.entries(t.vanligeFeil ?? {})) ut.push([`${t.sti}.vanligeFeil.${san}`, v]);
  }
  return ut.filter(([, v]) => typeof v === 'string');
}

test('trenertekstene bruker norske brikkebokstaver', () => {
  assert.ok(ENGELSK_TREKK.test('Spill …Ba7 her.') && ENGELSK_TREKK.test('Nxe5 vinner') && !ENGELSK_TREKK.test('…La7 og Sxe5, Dh4+ og exd5'));
  const funn = apninger.flatMap(({ id, data }) => trenerTekster(data).filter(([, v]) => ENGELSK_TREKK.test(v)).map(([k, v]) => `${id} ${k}: ${v.match(ENGELSK_TREKK)[0].trim()}`));
  assert.deepEqual(funn, []);
});

const HVIT_I_TREKKET = 'r1bqkb1r/pppp1ppp/2n2n2/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4';
const SVART_I_TREKKET = 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1';

test('motorens tall snus til hvits syn, uansett hvem som er i trekket', () => {
  const linje = 'info depth 14 seldepth 20 multipv 1 score cp 35 nodes 1 nps 1 hashfull 0 time 5 pv e7e5';
  assert.deepEqual(lesInfo(linje, HVIT_I_TREKKET), { dybde: 14, verdi: { cp: 35 } });
  assert.deepEqual(lesInfo(linje, SVART_I_TREKKET), { dybde: 14, verdi: { cp: -35 } });
  assert.deepEqual(lesInfo('info depth 9 seldepth 9 multipv 1 score mate 3 pv d8h4', SVART_I_TREKKET), { dybde: 9, verdi: { matt: -3 } });
  assert.deepEqual(lesInfo('info depth 9 seldepth 9 multipv 1 score mate -2 pv d8h4', SVART_I_TREKKET), { dybde: 9, verdi: { matt: 2 } });
  assert.deepEqual(lesInfo('info depth 9 score cp 0 pv e7e5', SVART_I_TREKKET).verdi, { cp: 0 });
});

test('motorlinjer uten en sikker verdi blir ikke brukt', () => {
  for (const linje of ['info depth 12 currmove e2e4 currmovenumber 1', 'info depth 12 seldepth 15 score cp 40 lowerbound nodes 1', 'info depth 12 seldepth 15 score cp 40 upperbound nodes 1', 'info depth 12 multipv 2 score cp 40', 'info depth 0 score mate 0', 'info string NNUE evaluation', 'bestmove e2e4']) assert.equal(lesInfo(linje, HVIT_I_TREKKET), null, linje);
});

test('vurderingen skrives med desimalkomma, som i trenerens tekst', () => {
  assert.equal(vurderingTekst({ cp: 80 }), '+0,8');
  assert.equal(vurderingTekst({ cp: -130 }), '−1,3');
  assert.equal(vurderingTekst({ cp: 0 }), '0,0');
  assert.equal(vurderingTekst({ cp: -4 }), '0,0');
  assert.equal(vurderingTekst({ cp: 25000 }), '+99,0');
  assert.equal(vurderingTekst({ matt: 4 }), '#4');
  assert.equal(vurderingTekst({ matt: -4 }), '#-4');
  assert.equal(vurderingTekst({ slutt: '0-1' }), '0-1');
});

test('tekstalternativet sier hvem som står best', () => {
  assert.equal(vurderingBeskrivelse({ cp: 80 }), 'Hvit står 0,8 bonde bedre.');
  assert.equal(vurderingBeskrivelse({ cp: -130 }), 'Svart står 1,3 bonde bedre.');
  assert.equal(vurderingBeskrivelse({ cp: 12 }), 'Stillingen er omtrent lik.');
  assert.equal(vurderingBeskrivelse({ matt: -1 }), 'Svart setter matt i 1 trekk.');
  assert.equal(vurderingBeskrivelse({ slutt: '½-½' }), 'Remis.');
});

test('hvits andel følger en vinnersjansekurve, ikke rette centibønder', () => {
  assert.equal(hvitAndel({ cp: 0 }), 50);
  assert.ok(Math.abs(hvitAndel({ cp: 100 }) - 59.1) < 0.1);
  assert.ok(Math.abs(hvitAndel({ cp: 300 }) + hvitAndel({ cp: -300 }) - 100) < 1e-9);
  assert.ok(hvitAndel({ cp: 100 }) - hvitAndel({ cp: 0 }) > hvitAndel({ cp: 600 }) - hvitAndel({ cp: 500 }), 'den første bonden teller mest');
  assert.equal(hvitAndel({ cp: 5000 }), hvitAndel({ cp: 1000 }));
  assert.ok(hvitAndel({ matt: 10 }) > hvitAndel({ cp: 1000 }));
  assert.ok(hvitAndel({ matt: 1 }) > hvitAndel({ matt: 5 }));
  assert.ok(hvitAndel({ matt: -1 }) < hvitAndel({ matt: -5 }));
  assert.equal(hvitAndel({ slutt: '1-0' }), 100);
  assert.equal(hvitAndel({ slutt: '0-1' }), 0);
  assert.equal(hvitAndel({ slutt: '½-½' }), 50);
});

test('sluttstillinger trenger ikke motoren', () => {
  assert.deepEqual(spillSlutt('r1bqkb1r/pppp1Qpp/2n2n2/4p3/2B1P3/8/PPPP1PPP/RNB1K1NR b KQkq - 0 4'), { slutt: '1-0' });
  assert.deepEqual(spillSlutt('rnb1kbnr/pppp1ppp/8/4p3/6Pq/5P2/PPPPP2P/RNBQKBNR w KQkq - 1 3'), { slutt: '0-1' });
  assert.deepEqual(spillSlutt('7k/5Q2/6K1/8/8/8/8/8 b - - 0 1'), { slutt: '½-½' });
  assert.deepEqual(spillSlutt('8/8/8/4k3/8/4K3/8/8 w - - 0 1'), { slutt: '½-½' });
  assert.equal(spillSlutt(HVIT_I_TREKKET), null);
});

test('lagrede motorverdier finnes igjen på stilling, uavhengig av trekktelleren', () => {
  const fen = 'rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 2';
  const oppslag = lagretOppslag(new Map([['', { fen: 'x', entry: null }], ['e4 e5', { fen, entry: { motor: { cp: 21, dybde: 16 } } }], ['matt', { fen: HVIT_I_TREKKET, entry: { motor: { cp: 9999, dybde: 16 } } }]]));
  assert.deepEqual(oppslag(fen.replace('0 2', '4 9')), { verdi: { cp: 21 }, dybde: 16 });
  assert.equal(oppslag(HVIT_I_TREKKET), null);
  assert.equal(oppslag(SVART_I_TREKKET), null);
});

const falskWorker = () => ({ sendt: [], terminert: false, postMessage(linje) { this.sendt.push(linje); }, terminate() { this.terminert = true; }, si(linje) { this.onmessage({ data: linje }); } });
const info = (dybde, cp) => `info depth ${dybde} seldepth ${dybde} multipv 1 score cp ${cp} nodes 1 pv e2e4`;
function motorMedFalskWorker(naarFeil) {
  const worker = falskWorker();
  return { worker, motor: lagMotor({ lagWorker: () => worker, naarFeil }) };
}

test('motoren starter søket først når den er klar, med begrenset dybde og tid', t => {
  const { worker, motor } = motorMedFalskWorker();
  t.after(() => motor.avslutt());
  motor.analyser(HVIT_I_TREKKET);
  assert.deepEqual(worker.sendt, ['uci', 'isready']);
  worker.si('readyok');
  assert.deepEqual(worker.sendt.slice(2), [`position fen ${HVIT_I_TREKKET}`, `go depth ${MAKS_DYBDE} movetime ${MAKS_TID}`]);
});

test('et gammelt søk slipper aldri til på en nyere stilling', t => {
  const { worker, motor } = motorMedFalskWorker();
  t.after(() => motor.avslutt());
  const gamle = [], nye = [];
  let gammelFerdig = false, nyFerdig = false;
  motor.analyser(HVIT_I_TREKKET, { naarVerdi: v => gamle.push(v.verdi.cp), naarFerdig: () => { gammelFerdig = true; } });
  worker.si('readyok');
  worker.si(info(12, 40));
  worker.sendt.length = 0;
  motor.analyser(SVART_I_TREKKET, { naarVerdi: v => nye.push(v.verdi.cp), naarFerdig: () => { nyFerdig = true; } });
  assert.deepEqual(worker.sendt, ['stop'], 'venter på bestmove før neste søk');
  worker.si(info(13, 999));
  worker.si('bestmove e2e4');
  assert.deepEqual(gamle, [40]);
  assert.equal(gammelFerdig, false);
  assert.deepEqual(worker.sendt.slice(1), [`position fen ${SVART_I_TREKKET}`, `go depth ${MAKS_DYBDE} movetime ${MAKS_TID}`]);
  worker.si(info(12, 30));
  worker.si('bestmove e7e5');
  assert.deepEqual(nye, [-30]);
  assert.equal(nyFerdig, true);
});

test('raske bytter hopper over stillingene imellom', t => {
  const { worker, motor } = motorMedFalskWorker();
  t.after(() => motor.avslutt());
  motor.analyser(HVIT_I_TREKKET);
  worker.si('readyok');
  motor.analyser('a b - - 0 1');
  motor.analyser('c d - - 0 1');
  motor.analyser(SVART_I_TREKKET);
  assert.equal(worker.sendt.filter(l => l === 'stop').length, 1);
  worker.si('bestmove e2e4');
  assert.deepEqual(worker.sendt.filter(l => l.startsWith('position')), [`position fen ${HVIT_I_TREKKET}`, `position fen ${SVART_I_TREKKET}`]);
});

test('avbryt stopper søket og lar motoren stå stille', t => {
  const { worker, motor } = motorMedFalskWorker();
  t.after(() => motor.avslutt());
  motor.analyser(HVIT_I_TREKKET);
  worker.si('readyok');
  motor.avbryt();
  worker.si('bestmove e2e4');
  assert.equal(worker.sendt.at(-1), 'stop');
  motor.avslutt();
  assert.equal(worker.terminert, true);
});

test('en motor som krasjer eller er for treg gir seg stille', t => {
  let krasjet = 0;
  const krasj = motorMedFalskWorker(() => { krasjet += 1; });
  t.after(() => krasj.motor.avslutt());
  krasj.motor.analyser(HVIT_I_TREKKET);
  krasj.worker.onerror({});
  assert.equal(krasjet, 1);
  assert.equal(krasj.worker.terminert, true);
  krasj.motor.analyser(SVART_I_TREKKET);
  assert.equal(krasj.worker.sendt.length, 2, 'en død motor starter ikke på nytt');

  let umulig = 0;
  lagMotor({ lagWorker: () => { throw new Error('ingen Worker'); }, naarFeil: () => { umulig += 1; } }).analyser(HVIT_I_TREKKET);
  assert.equal(umulig, 1);

  let treg = 0;
  const sakte = motorMedFalskWorker(() => { treg += 1; });
  t.after(() => sakte.motor.avslutt());
  sakte.motor.analyser(HVIT_I_TREKKET);
  sakte.worker.si('readyok');
  sakte.worker.si(info(6, 10));
  sakte.worker.si('bestmove e2e4');
  assert.equal(treg, 0, 'ett grunt søk er ikke nok');
  sakte.motor.analyser(SVART_I_TREKKET);
  sakte.worker.si(info(7, 10));
  sakte.worker.si('bestmove e7e5');
  assert.equal(treg, 1);
});

// ---------- Repertoire and flashcards ----------
const finn = id => apninger.find(a => a.id === id).apning;
const alle = apninger.map(a => a.apning);
const slotMed = (slots, id) => slots.filter(slot => slot.apninger.some(a => a.id === id)).map(slot => slot.id);
const repTrekk = (sti, extra = {}) => ({ sti, hva: 'h', ide: 'i', pass: 'p', ...extra });
const svarTrekk = (sti, extra = {}) => ({ sti, hva: 'h', ...extra });
function lagTest(id, farge, start, trekk, extra = {}) {
  const { apning, feil } = lesApning({ schema: 1, id, navn: id, kort: 'k', karakter: 'k', farge, niva: 'lett', skarphet: 1, start, intro: { historie: 'h', karakter: 'k', passer: 'p' }, planer: ['p'], modellideer: ['m'], trekk, ...extra });
  assert.deepEqual(feil, []);
  return apning;
}
const NAA = new Date(2026, 10, 6, 20, 0).getTime();
const DOGN = 86400000;

test('repertoar: hver åpning finner plassen sin ut fra data', () => {
  const slots = fordel(alle);
  assert.deepEqual(slotMed(slots, 'smith-morra'), ['w-c5']);
  assert.deepEqual(slotMed(slots, 'evans-gambitt'), ['w-e5'], 'et dypt startpunkt hører til svaret på trekk 1');
  assert.deepEqual(slotMed(slots, 'pirc-modern'), ['w-d6'], 'treet når begge svarene i samme plass');
  assert.deepEqual(slotMed(slots, 'marshall'), ['b-spansk']);
  assert.deepEqual(slotMed(slots, 'traxler'), ['b-italiensk']);
  assert.deepEqual(slotMed(slots, 'e5-mot-resten'), ['b-e4']);
  assert.deepEqual(slotMed(slots, 'englund'), ['b-d4']);
  for (const { id } of apninger) assert.equal(slotMed(slots, id).length > 0, true, `${id} mangler plass`);
});

test('repertoar: nye åpninger plasseres uten å være nevnt, og resten havner i Andre', () => {
  const nye = [
    lagTest('budapest', 'b', 'd4 Nf6 c4', [repTrekk('e5', { plan: 'p' })]),
    lagTest('from', 'b', 'f4', [repTrekk('e5', { plan: 'p' })]),
    lagTest('siciliansk', 'b', 'e4 c5', [svarTrekk('Nf3'), repTrekk('Nf3 d6', { plan: 'p' })]),
    lagTest('london', 'w', '', [repTrekk('d4', { plan: 'p' })]),
    lagTest('rar', 'b', 'b3', [repTrekk('e5', { plan: 'p' })]),
    lagTest('bred', 'w', 'e4', [svarTrekk('e5'), repTrekk('e5 Nf3', { plan: 'p' }), svarTrekk('c5'), repTrekk('c5 Nf3', { plan: 'p' })]),
  ];
  const slots = fordel(nye);
  assert.deepEqual(slotMed(slots, 'budapest'), ['b-d4']);
  assert.deepEqual(slotMed(slots, 'from'), ['b-resten']);
  assert.deepEqual(slotMed(slots, 'siciliansk'), ['b-e4']);
  assert.deepEqual(slotMed(slots, 'london'), ['w-andre']);
  assert.deepEqual(slotMed(slots, 'rar'), ['b-andre']);
  assert.deepEqual(slotMed(slots, 'bred'), ['w-e5', 'w-c5']);
});

test('repertoar: to åpninger krysser bare der de krever ulike egne trekk', () => {
  assert.ok(krysser(finn('kongegambitt'), finn('evans-gambitt')), '2.f4 eller 2.Sf3');
  assert.ok(krysser(finn('marshall'), finn('schliemann')), '3…a6 eller 3…f5');
  assert.equal(krysser(finn('evans-gambitt'), finn('sg5-angrepet')), null, 'begge spiller 3.Lc4 og tar hvert sitt svar');
  assert.equal(krysser(finn('marshall'), finn('traxler')), null);
  assert.equal(krysser(finn('kongegambitt'), finn('marshall')), null, 'ulike farger');
  const { a, b } = krysser(finn('kongegambitt'), finn('evans-gambitt'));
  assert.deepEqual([a.san, b.san, a.nummer], ['f4', 'Nf3', '2.']);
});

test('repertoar: et nytt valg bytter ut det som krysser, og alt kan angres', () => {
  const fremgang = tomFremgang();
  const slot = fordel(alle).find(s => s.id === 'w-e5');
  assert.deepEqual(velgApning(fremgang, finn('evans-gambitt'), slot, NAA), []);
  assert.deepEqual(velgApning(fremgang, finn('sg5-angrepet'), slot, NAA), [], 'ulike linjer står side om side');
  assert.deepEqual(velgApning(fremgang, finn('kongegambitt'), slot, NAA).map(a => a.id), ['evans-gambitt', 'sg5-angrepet']);
  assert.deepEqual(valgteApninger(fremgang, alle).map(a => a.id), ['kongegambitt']);
  assert.deepEqual(fremgang.repertoar['evans-gambitt'], { valgt: false, sist: NAA }, 'et bortvalg huskes med tidspunkt');
  settValgt(fremgang, 'evans-gambitt', true, NAA + 1);
  assert.equal(kryssI(slot, fremgang).length, 1, 'to veier er lov når spilleren vil ha det');
  settValgt(fremgang, 'kongegambitt', false, NAA + 2);
  assert.equal(erValgt(fremgang, 'kongegambitt'), false);
  assert.deepEqual(JSON.parse(JSON.stringify(fremgang.repertoar)), fremgang.repertoar);
});

test('startforslaget finnes, men er aldri valgt på forhånd', () => {
  for (const id of STARTFORSLAG) assert.ok(finn(id), id);
  assert.deepEqual(valgteApninger(tomFremgang(), alle), []);
});

test('fremgang fra før repertoaret beholdes og får de nye feltene', () => {
  const minne = new Map([[NOKKEL, JSON.stringify({ versjon: 1, linjer: { 'a|b': { boks: 3, forfall: 5, sist: 4, runder: 2, feilfrie: 2 } }, feil: { a: {} }, feller: { 'a|f': { lost: 1, feil: 0 } } })]]);
  const fremgang = lesFremgang({ getItem: k => minne.get(k) ?? null, setItem() {} });
  assert.equal(fremgang.linjer['a|b'].boks, 3);
  assert.deepEqual(fremgang.feller, { 'a|f': { lost: 1, feil: 0 } });
  assert.deepEqual(fremgang.repertoar, {});
  assert.deepEqual(fremgang.kort, {});
});

test('kort: hopper over de to første egne trekkene, alt før start og tvungne stillinger', () => {
  const kort = lagKort([finn('smith-morra')]);
  const vei = kort.map(k => k.kilder[0].forTrekk.join(' '));
  assert.ok(vei.includes('e4 c5 d4 cxd4'), 'trekk 3 er det første kortet');
  assert.ok(!vei.includes('e4 c5') && !vei.includes(''), 'trekk 1 og 2 blir ikke kort');
  assert.ok(kort.every(k => Number(k.fen.split(' ')[5]) >= 3));
  const evans = lagKort([finn('evans-gambitt')]);
  assert.ok(evans.some(k => k.trekk.includes('b4')), 'trekk 4 teller selv om det er det første i treet');
  const svart = lagKort([finn('marshall')]);
  assert.ok(svart.every(k => k.fen.split(' ')[1] === 'b' && k.farge === 'b'));
});

test('kort: kun ett lovlig trekk gir ikke kort', () => {
  const apning = lagTest('tvang', 'b', 'a3 a6 e4 f5 Qh5+', [repTrekk('g6'), svarTrekk('g6 Qf3'), repTrekk('g6 Qf3 Nf6', { plan: 'p' })]);
  assert.deepEqual(lagKort([apning]).map(k => k.trekk), [['Nf6']]);
});

test('kort: omstillinger slås sammen, og to valg i samme stilling godtar begge', () => {
  const a = lagTest('a', 'w', 'e4 e5 Nf3 Nc6', [repTrekk('Bc4'), svarTrekk('Bc4 Bc5'), repTrekk('Bc4 Bc5 O-O', { plan: 'p' })]);
  const b = lagTest('b', 'w', 'Nf3 Nc6 e4 e5', [repTrekk('Bc4'), svarTrekk('Bc4 Bc5'), repTrekk('Bc4 Bc5 c3', { plan: 'p' })]);
  const kort = lagKort([a, b]);
  assert.equal(kort.length, 2, 'to stillinger, selv om veiene inn er ulike');
  const [forste, andre] = kort;
  assert.deepEqual(forste.trekk, ['Bc4']);
  assert.equal(forste.kilder.length, 2);
  assert.deepEqual(andre.trekk, ['O-O', 'c3']);
  assert.equal(kortId(forste.fen, 'w'), forste.id);
  assert.ok(!forste.id.includes(' 0 3|') && forste.id.endsWith('|w'), 'nøkkelen er uten trekktellere');
});

test('kort: feller blir kort i fellens stilling, med godta', () => {
  const smith = lagKort([finn('smith-morra')]);
  const felle = finn('smith-morra').feller[0];
  const kort = smith.find(k => k.id === kortId(felle.fen, 'w'));
  assert.ok(kort, 'fella har et kort');
  assert.ok(kort.trekk.includes(felle.losning[0].san));
  for (const san of felle.godta) assert.ok(kort.trekk.includes(san), san);
  const kilde = kort.kilder.find(k => k.felle);
  assert.equal(kilde.linje, felle.navn);
  assert.ok(kilde.forTrekk.length >= 4);
});

test('kort: navnet på linjen røper ikke svaret', () => {
  const apning = lagTest('navn', 'w', 'e4 e5 Nf3 Nc6', [repTrekk('Bc4', { navn: 'Riktig svar' }), svarTrekk('Bc4 Bc5', { navn: 'Italiensk' }), repTrekk('Bc4 Bc5 c3', { navn: 'Også svaret', plan: 'p' })]);
  assert.deepEqual(lagKort([apning]).map(k => k.kilder[0].linje), ['Hovedlinjen', 'Italiensk']);
});

test('kort: Leitner per stilling med de samme intervallene', () => {
  const fremgang = tomFremgang();
  const idag = dagStart(NAA);
  assert.equal(vurderKort(fremgang, 'k', 'riktig', NAA).boks, 1);
  assert.equal(fremgang.kort.k.forfall, dagStart(NAA, 1), 'i morgen tidlig, selv om økta var sent i dag');
  assert.equal(fremgang.kort.k.sist, NAA);
  assert.equal(vurderKort(fremgang, 'k', 'riktig', NAA + DOGN).boks, 2);
  assert.equal(fremgang.kort.k.forfall, dagStart(NAA + DOGN, INTERVALL_DAGER[2]));
  assert.equal(vurderKort(fremgang, 'k', 'hint', NAA + 4 * DOGN).boks, 2, 'hint holder kortet i samme boks');
  assert.equal(fremgang.kort.k.forfall, dagStart(NAA + 4 * DOGN, INTERVALL_DAGER[2]));
  for (let i = 0; i < 9; i += 1) vurderKort(fremgang, 'k', 'riktig', NAA + i * 40 * DOGN);
  assert.equal(fremgang.kort.k.boks, INTERVALL_DAGER.length - 1);
  assert.equal(vurderKort(fremgang, 'k', 'feil', NAA + 400 * DOGN).boks, 1, 'feil sender til boks 1, ikke 0');
  assert.equal(fremgang.kort.k.forfall, dagStart(NAA + 400 * DOGN, 1));
  assert.equal(fremgang.kort.k.forst, NAA);
  assert.equal(vurderKort(fremgang, 'ny', 'hint', NAA).boks, 0);
  assert.equal(vurderKort(fremgang, 'ny2', 'feil', NAA).boks, 1);
  assert.ok(idag < NAA);
  assert.deepEqual(JSON.parse(JSON.stringify(fremgang.kort)), fremgang.kort);
});

const falskeKort = (antall, apning = finn('kongegambitt')) => Array.from({ length: antall }, (_, i) => ({ id: `k${i}`, farge: 'w', fen: `x w - - 0 ${i + 3}`, trekk: ['a'], kilder: [{ apning, sti: 'f4', san: 'a' }] }));

test('kort: nye kort er begrenset per dag', () => {
  const fremgang = tomFremgang();
  const kort = falskeKort(40);
  assert.equal(kortKo(kort, fremgang, NAA).nye, NYE_PER_DAG);
  for (const k of kortKo(kort, fremgang, NAA).kort.slice(0, 4)) vurderKort(fremgang, k.id, 'riktig', NAA);
  assert.equal(kortKo(kort, fremgang, NAA + 1000).nye, NYE_PER_DAG - 4);
  assert.equal(kortKo(kort, fremgang, dagStart(NAA, 1) + 1000).nye, NYE_PER_DAG, 'en ny dag gir nye kort');
  assert.equal(kortKo(kort, fremgang, NAA + 1000, 1).nye, 2 * NYE_PER_DAG - 4, 'Ta flere gir rom til flere');
});

test('kort: etter lang fravær vises bare taket, de mest forsinkede først, og nye venter', () => {
  const fremgang = tomFremgang();
  const kort = falskeKort(50);
  kort.forEach((k, i) => { fremgang.kort[k.id] = { boks: i % 2 ? 5 : 1, forfall: NAA - 100 * DOGN, sist: NAA - 200 * DOGN, forst: NAA - 300 * DOGN, riktige: 1, feil: 0 }; });
  kort.push(...falskeKort(60).slice(50));
  const ko = kortKo(kort, fremgang, NAA);
  assert.equal(ko.forfalte, MAKS_FORFALT);
  assert.equal(ko.nye, 0);
  assert.equal(ko.pause, true);
  assert.equal(ko.flere, true);
  assert.equal(fremgang.kort[ko.kort[0].id].boks, 1, 'relativt sett er boks 1 mest forsinket');
  assert.equal(Object.keys(fremgang.kort).length, 50, 'ingenting nullstilles');
  assert.equal(kortKo(kort, fremgang, NAA, 1).forfalte, 50, 'Ta flere henter resten');
  for (const k of ko.kort) vurderKort(fremgang, k.id, 'riktig', NAA);
  const etter = kortKo(kort, fremgang, NAA + 1000);
  assert.equal(etter.forfalte, 0, 'taket er brukt opp for i dag');
  assert.equal(etter.flere, true);
  assert.equal(etter.nye, NYE_PER_DAG, 'køen er under taket, så nye kort slipper til igjen');
});

test('kort: ei økt er på rundt tolv kort, og feil kommer tilbake uten ny vurdering', () => {
  const fremgang = tomFremgang();
  const kort = falskeKort(20);
  assert.equal(lagOkt(kort, () => 0).ko.length, OKT_STORRELSE);
  const okt = lagOkt(kort.slice(0, 6), () => 0.5);
  const [forste, andre] = okt.ko;
  svarKort(okt, forste, 'feil', fremgang, NAA);
  assert.equal(fremgang.kort[forste.id].boks, 1);
  okt.ko.shift();
  assert.equal(okt.ko.indexOf(forste), 3, 'tre andre kort først');
  svarKort(okt, andre, 'hint', fremgang, NAA);
  okt.ko.shift();
  while (okt.ko[0] !== forste) { svarKort(okt, okt.ko[0], 'riktig', fremgang, NAA); okt.ko.shift(); }
  const riktigeFor = okt.riktige;
  const post = { ...fremgang.kort[forste.id] };
  assert.equal(svarKort(okt, forste, 'feil', fremgang, NAA + 1000), null, 'andre forsøk teller ikke');
  okt.ko.shift();
  assert.ok(okt.ko.includes(forste), 'og den kommer tilbake til den sitter');
  while (okt.ko.length) { svarKort(okt, okt.ko[0], 'riktig', fremgang, NAA + 2000); okt.ko.shift(); }
  assert.deepEqual(fremgang.kort[forste.id], post, 'ingen ekstra repetisjon');
  assert.ok(okt.riktige >= riktigeFor);
  assert.equal(okt.riktige, 4);
  assert.equal(okt.hint, 1);
  assert.equal(okt.totalt, 6);
  assert.deepEqual(vanskeligst(okt).map(v => [v.kort.id, v.antall]), [[forste.id, 2]]);
});

test('kort: forfaller i morgen teller det som faktisk kommer', () => {
  const fremgang = tomFremgang();
  const kort = falskeKort(3);
  vurderKort(fremgang, kort[0].id, 'feil', NAA);
  vurderKort(fremgang, kort[1].id, 'riktig', NAA);
  vurderKort(fremgang, kort[1].id, 'riktig', NAA);
  assert.equal(forfallerIMorgen(kort, fremgang, NAA), 1);
  assert.equal(kortKo(kort, fremgang, dagStart(NAA, 1) + 1).forfalte, 1, 'neste dag er kortet klart');
});

test('blandet øving: starter fra trekk 1 og lar motstanderen velge etter vekt', () => {
  const smith = finn('smith-morra');
  const start = startNoder(smith);
  assert.deepEqual(start.map(n => [n.san, n.rep, n.nummer]), [['e4', true, '1.'], ['c5', false, '1…']]);
  assert.deepEqual(start.map(n => n.sti), [null, '']);
  const valgte = [finn('kongegambitt'), smith, finn('fransk-fremstot')];
  const tall = {};
  let f = 0.123;
  const tilfeldig = () => { f = (f * 9301 + 0.49297) % 1; return f; };
  for (let i = 0; i < 400; i += 1) { const { apning } = velgBlandetLinje(valgte, tomFremgang(), { naa: NAA, tilfeldig }); tall[apning.id] = (tall[apning.id] ?? 0) + 1; }
  assert.ok(tall['smith-morra'] > tall['fransk-fremstot'] && tall.kongegambitt > tall['fransk-fremstot'], JSON.stringify(tall));
  const valg = velgBlandetLinje(valgte, tomFremgang(), { naa: NAA, tilfeldig });
  assert.equal(valg.noder[0].san, 'e4');
  assert.equal(valg.grunn, 'ny');
  const svart = velgBlandetLinje([finn('marshall')], tomFremgang(), { naa: NAA, tilfeldig: () => 0 });
  assert.deepEqual(svart.noder.slice(0, 5).map(n => n.rep), [false, true, false, true, false]);
});

test('blandet øving: linjer til repetisjon kommer først, på tvers av åpningene', () => {
  const valgte = [finn('kongegambitt'), finn('smith-morra')];
  const fremgang = tomFremgang();
  const linje = finn('smith-morra').linjer[2];
  vurderLinje(fremgang, 'smith-morra', linje.id, 2, NAA - DOGN);
  const valg = velgBlandetLinje(valgte, fremgang, { naa: NAA, tilfeldig: () => 0.99 });
  assert.equal(valg.grunn, 'repetisjon');
  assert.equal(valg.linje, linje);
  assert.equal(valg.nokkel, `smith-morra|${linje.id}`);
  const annen = velgBlandetLinje(valgte, fremgang, { naa: NAA, forrige: valg.nokkel, tilfeldig: () => 0.99 });
  assert.notEqual(annen.nokkel, valg.nokkel);
  assert.equal(annen.grunn, 'ny');
});

test('blandet øving: et annet valgt trekk gir en linje som følger det', () => {
  const valgte = [finn('kongegambitt'), finn('evans-gambitt')];
  const valg = velgBlandetLinje(valgte, tomFremgang(), { naa: NAA, spilt: ['e4', 'e5', 'Nf3'], tilfeldig: () => 0.5 });
  assert.equal(valg.apning.id, 'evans-gambitt');
  assert.equal(velgBlandetLinje(valgte, tomFremgang(), { naa: NAA, spilt: ['e4', 'e5', 'd4'] }), null, 'et trekk utenfor repertoaret er en feil');
  assert.equal(velgBlandetLinje(valgte, tomFremgang(), { naa: NAA, farge: 'b' }), null);
});

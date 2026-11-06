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
import { fordel, krysser, kryssI, velgApning, settValgt, erValgt, valgteApninger, startNoder, velgBlandetLinje, STARTFORSLAG, FORSLAG, fargeFra, motsatt, startFane, repertoarAdresse, oktAdresse, flereAdresse, blandetAdresse, treningAdresse, byggAdresse, svarDekning, dekningTekst, hullTekst, omtrentProsent, slotVekt, svarAndel, byggSteg, forsteSteg, nabostSteg, alternativer, veiInnTrekk, veiVekt, SLOTS } from '../public/sjakk/apninger/repertoar.mjs';
import { lagKort, kortId, vurderKort, kortKo, nesteEkstra, lagOkt, svarKort, vanskeligst, forfallerIMorgen, dagStart, NYE_PER_DAG, NYE_VALG, NYE_I_OKT, FRITT, OVELSE_STORRELSE, valgtTempo, lagOvelse, ovelseRekke, MAKS_FORFALT, OKT_STORRELSE, vistKort, introSett, merkIntro, laerteKort, nyePerDag, settTempo, nesteSteg, oktInnhold, oktTekst, medFarge, klarTekst, delerNye, kortStatus } from '../public/sjakk/apninger/kort.mjs';
import { forsteSetning, helTrekk } from '../public/sjakk/apninger/ui.mjs';
import { sporSegmenter, segmentNavn, segmentVed, nesteSegment } from '../public/sjakk/apninger/spor.mjs';

import { lagSynk, slaSammen, lik, KONTO } from '../public/sjakk/apninger/synk.mjs';

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
  assert.deepEqual(FORSLAG.w, ['kongegambitt', 'smith-morra'], 'fransk er spillerens eget valg');
  assert.deepEqual(FORSLAG.b, ['e5-mot-resten', 'traxler', 'schliemann', 'budapest-gambitt']);
  assert.deepEqual(STARTFORSLAG, [...FORSLAG.w, ...FORSLAG.b]);
  for (const [farge, ider] of Object.entries(FORSLAG)) for (const id of ider) assert.equal(finn(id)?.farge, farge, id);
  assert.deepEqual(valgteApninger(tomFremgang(), alle), []);
});

test('startforslaget for svart henger sammen: ingen kryss, og det kan angres uten spor av valg', () => {
  const svarte = FORSLAG.b.map(finn);
  svarte.forEach((a, i) => svarte.slice(i + 1).forEach(b => assert.equal(krysser(a, b), null, `${a.id} og ${b.id}`)));
  const fremgang = tomFremgang();
  for (const id of FORSLAG.b) settValgt(fremgang, id, true, NAA);
  const slots = fordel(alle);
  assert.ok(svarDekning(slots, fremgang, 'b').prosent > 50);
  assert.equal(svarDekning(slots, fremgang, 'w').valgte, 0, 'hvit er urørt');
  for (const id of FORSLAG.b) settValgt(fremgang, id, false, NAA);
  assert.deepEqual(valgteApninger(fremgang, alle), []);
});

test('farger: adressene er lenkbare, og gamle lenker betyr det de alltid har gjort', () => {
  assert.equal(repertoarAdresse('w'), '#/repertoar/hvit');
  assert.equal(repertoarAdresse('b'), '#/repertoar/svart');
  assert.equal(repertoarAdresse(null), '#/repertoar');
  assert.equal(oktAdresse(null), '#/repertoar/kort', 'uten farge er det begge');
  assert.equal(oktAdresse('b'), '#/repertoar/kort/svart');
  assert.equal(flereAdresse(null), '#/repertoar/kort/flere');
  assert.equal(flereAdresse('w'), '#/repertoar/kort/hvit/flere');
  assert.equal(blandetAdresse(null), '#/repertoar/ov');
  assert.equal(blandetAdresse('b'), '#/repertoar/ov/svart');
  assert.equal(treningAdresse(null, 'rekke'), '#/repertoar/trening/alle/rekke');
  assert.equal(treningAdresse('b', 'stokket'), '#/repertoar/trening/svart/stokket');
  assert.equal(byggAdresse('w'), '#/repertoar/bygg');
  assert.equal(byggAdresse('b'), '#/repertoar/bygg/svart');
  for (const [ord, farge] of [['hvit', 'w'], ['svart', 'b'], ['w', 'w'], ['b', 'b']]) assert.equal(fargeFra(ord), farge, ord);
  for (const ord of [undefined, '', 'flere', 'bygg', 'toString']) assert.equal(fargeFra(ord), null, ord);
  assert.equal(motsatt('w'), 'b');
});

test('farger: fanen huskes, og uten minne åpner den der spilleren har noe', () => {
  const hvit = { farge: 'w' }, svart = { farge: 'b' };
  assert.equal(startFane('b', [hvit]), 'b', 'det som er husket, går foran');
  assert.equal(startFane('w', [svart]), 'w');
  assert.equal(startFane(null, []), 'w');
  assert.equal(startFane(null, [svart]), 'b');
  assert.equal(startFane(null, [hvit, svart]), 'w');
  assert.equal(startFane('tull', [svart]), 'b', 'ukjent verdi er som intet minne');
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

test('kort: egne trekk i start teller, så to valgte åpninger kan skille lag der', () => {
  const kort = lagKort([finn('skotsk-gambitt'), finn('evans-gambitt')]);
  const skille = kort.find(k => k.kilder.some(kilde => kilde.forTrekk.join(' ') === 'e4 e5 Nf3 Nc6'));
  assert.deepEqual([...skille.trekk].sort(), ['Bc4', 'd4']);
  const evans = lagKort([finn('evans-gambitt')]).find(k => k.kilder[0].forTrekk.join(' ') === 'e4 e5 Nf3 Nc6');
  assert.deepEqual(evans.trekk, ['Bc4']);
  assert.equal(evans.kilder[0].node, undefined);
});

test('kort: «Ta flere» gir alltid kort, også når dagens nye er brukt opp fra før', () => {
  const fremgang = tomFremgang();
  const kort = falskeKort(20);
  for (const k of kort.slice(0, 12)) vurderKort(fremgang, k.id, 'riktig', NAA);
  assert.equal(kortKo(kort, fremgang, NAA, 1).kort.length, 0, 'ett steg holder ikke');
  const ekstra = nesteEkstra(kort, fremgang, NAA, 0);
  assert.equal(ekstra, 2);
  assert.equal(kortKo(kort, fremgang, NAA, ekstra).nye, 6);
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

test('kort: hver åpning i datamappen gir kort som stemmer med brettet', () => {
  for (const apning of alle) {
    for (const kort of lagKort([apning])) {
      assert.equal(kort.farge, apning.farge);
      assert.equal(kort.fen.split(' ')[1], kort.farge, `${apning.id}: feil side i trekket`);
      for (const kilde of kort.kilder) {
        const chess = new Chess();
        for (const san of kilde.forTrekk) chess.move(san);
        assert.equal(kortId(chess.fen(), kort.farge), kort.id, `${apning.id}: ${kilde.forTrekk.join(' ')}`);
        const trekk = chess.move(kilde.san);
        assert.deepEqual([trekk.from, trekk.to], [kilde.fra, kilde.til], `${apning.id}: ${kilde.san}`);
        assert.ok(kilde.linje, `${apning.id}: linjen mangler navn`);
        if (kilde.node) assert.ok(kilde.node.entry.ide, `${apning.id}: ${kilde.san} mangler idé`);
      }
    }
  }
});

test('blandet øving: starttrekkene røper ikke åpningen før motstanderen har svart', () => {
  const [hvit, svar] = startNoder(finn('smith-morra'));
  assert.ok(!hvit.entry.hva.includes('Smith') && !hvit.entry.ide.includes('Smith'), 'mitt første trekk er nøytralt');
  assert.ok(svar.entry.hva.includes('Smith-Morra'), 'navnet kommer med svaret');
  const dypt = startNoder(finn('marshall')).filter(n => !n.rep).map(n => n.entry.hva.includes('Marshall'));
  assert.deepEqual(dypt.slice(0, -1).filter(Boolean), [], 'bare det siste svaret før treet navngir åpningen');
  assert.equal(dypt.at(-1), true);
});

test('synk: to enheter flettes post for post, og det nyeste vinner', () => {
  const a = { ...tomFremgang(), kort: { x: { boks: 3, sist: 200 }, y: { boks: 1, sist: 100 } }, repertoar: { evans: { valgt: false, sist: 300 } }, feil: { evans: { s: { antall: 2 } } }, feller: { f: { lost: 5 } } };
  const b = { ...tomFremgang(), kort: { x: { boks: 1, sist: 100 }, z: { boks: 2, sist: 150 } }, repertoar: { evans: { valgt: true, sist: 100 } }, feil: { evans: { s: { antall: 5 }, t: { antall: 1 } } }, feller: { f: { lost: 9 } } };
  const ut = slaSammen(a, b);
  assert.equal(ut.kort.x.boks, 3);
  assert.deepEqual(Object.keys(ut.kort).sort(), ['x', 'y', 'z']);
  assert.equal(ut.repertoar.evans.valgt, false, 'et bortvalg som er nyere, står');
  assert.equal(ut.feil.evans.s.antall, 5);
  assert.equal(ut.feil.evans.t.antall, 1);
  assert.equal(ut.feller.f.lost, 9);
  assert.ok(lik(slaSammen(a, b), slaSammen(b, a)), 'rekkefølgen spiller ingen rolle');
  assert.ok(lik(slaSammen(ut, ut), ut));
});

function falskSynk({ svar, lokal = tomFremgang(), eier = null }) {
  const lagret = new Map(eier ? [[KONTO, eier]] : []);
  const logg = { kall: [], status: [], fremgang: lokal };
  const synk = lagSynk({
    lager: { getItem: k => lagret.get(k) ?? null, setItem: (k, v) => lagret.set(k, v) },
    hent: () => logg.fremgang,
    sett: ny => { logg.fremgang = ny; },
    status: s => logg.status.push(s),
    vent: 0,
    nettet: async (_, valg = {}) => { const metode = valg.method ?? 'GET'; logg.kall.push({ metode, kropp: valg.body && JSON.parse(valg.body) }); const [status, data] = svar(metode, logg.kall.length); return { status, ok: status < 300, json: async () => data }; },
  });
  return { synk, logg };
}

test('synk: utlogget spiller sender ingenting og beholder fremgangen', async () => {
  const lokal = { ...tomFremgang(), kort: { x: { sist: 1 } } };
  const { synk, logg } = falskSynk({ svar: () => [401, {}], lokal });
  await synk.start();
  synk.endret();
  await synk.send();
  assert.deepEqual(logg.status, ['ute']);
  assert.deepEqual(logg.kall.map(k => k.metode), ['GET']);
  assert.equal(logg.fremgang, lokal);
});

test('synk: første innlogging flettes og lastes opp, og serverfeil lar fremgangen stå', async () => {
  const lokal = { ...tomFremgang(), kort: { x: { boks: 1, sist: 1 } } };
  const fjern = { ...tomFremgang(), kort: { y: { boks: 2, sist: 2 } } };
  const { synk, logg } = falskSynk({ lokal, svar: metode => (metode === 'GET' ? [200, { userId: 'u', revision: 4, state: fjern }] : [200, { revision: 5 }]) });
  await synk.start();
  assert.deepEqual(Object.keys(logg.fremgang.kort).sort(), ['x', 'y']);
  const put = logg.kall.find(k => k.metode === 'PUT');
  assert.equal(put.kropp.revision, 4);
  assert.deepEqual(Object.keys(put.kropp.state.kort).sort(), ['x', 'y']);
  const nede = falskSynk({ lokal, svar: () => [503, {}] });
  await nede.synk.start();
  assert.deepEqual(nede.logg.status, [null]);
  assert.equal(nede.logg.fremgang, lokal);
});

test('synk: ingenting nytt gir ingen opplasting, selv om databasen har stokket nøklene', async () => {
  const lokal = { ...tomFremgang(), kort: { a: { boks: 1, sist: 1 } } };
  const fjern = { kort: { a: { sist: 1, boks: 1 } }, feil: {}, linjer: {}, feller: {}, versjon: 1, repertoar: {} };
  const { synk, logg } = falskSynk({ lokal, svar: () => [200, { userId: 'u', revision: 2, state: fjern }] });
  await synk.start();
  assert.deepEqual(logg.kall.map(k => k.metode), ['GET']);
  assert.equal(logg.fremgang, lokal);
});

test('synk: en konflikt henter og flettes på nytt, og en annen konto arver ikke fremgangen', async () => {
  const lokal = { ...tomFremgang(), kort: { x: { sist: 1 } } };
  const annen = { ...tomFremgang(), kort: { y: { sist: 2 } } };
  const { synk, logg } = falskSynk({ lokal, svar: (metode, n) => (metode === 'GET' ? [200, { userId: 'u', revision: n, state: n === 1 ? null : annen }] : n === 2 ? [409, { code: 'conflict' }] : [200, { revision: 9 }]) });
  await synk.start();
  assert.deepEqual(logg.kall.map(k => k.metode), ['GET', 'PUT', 'GET', 'PUT']);
  assert.deepEqual(Object.keys(logg.kall[3].kropp.state.kort).sort(), ['x', 'y']);
  assert.equal(logg.kall[3].kropp.revision, 3);
  const bytte = falskSynk({ lokal, eier: 'a', svar: () => [200, { userId: 'b', revision: 1, state: annen }] });
  await bytte.synk.start();
  assert.deepEqual(Object.keys(bytte.logg.fremgang.kort), ['y']);
  assert.ok(!bytte.logg.kall.some(k => k.metode === 'PUT'));
});

// ---------- Guided flow, teaching and pace ----------
const medValg = (...ider) => { const fremgang = tomFremgang(); for (const id of ider) settValgt(fremgang, id, true, NAA); return fremgang; };

test('dekning: tallene går opp i hundre, og bare det som faktisk er besvart teller', () => {
  for (const farge of ['w', 'b']) assert.equal(SLOTS.filter(slot => slot.farge === farge).reduce((sum, slot) => sum + slotVekt(slot), 0), 100, farge);
  const slots = fordel(alle);
  assert.equal(svarDekning(slots, tomFremgang(), 'w').prosent, 0);
  const hvit = svarDekning(slots, medValg('kongegambitt', 'smith-morra'), 'w');
  assert.equal(Math.round(hvit.prosent), 64);
  assert.equal(hvit.hull.slot.id, 'w-e6');
  assert.equal(dekningTekst(hvit, 'w'), 'Du har svar på omtrent 65 % av det motstanderen spiller mot 1.e4.', 'ingen falsk presisjon');
  assert.equal(hullTekst(hvit.hull), 'Størst hull: 1…e6, omtrent 15 %.');
  const smal = svarDekning(slots, medValg('evans-gambitt'), 'w');
  assert.ok(smal.prosent > 5 && smal.prosent < 15, 'Evans svarer bare på en del av 1…e5');
  assert.equal(smal.hull.slot.id, 'w-c5');
  assert.match(hullTekst({ ...smal.hull, dekket: 0.3 }), /delvis/);
  const to = svarDekning(slots, medValg('kongegambitt', 'wienergambitt'), 'w');
  assert.equal(to.prosent, 30, 'to svar på samme trekk teller én gang');
  assert.equal(svarDekning(slots, medValg('kongegambitt'), 'b').valgte, 0, 'fargene holdes hver for seg');
  assert.deepEqual([omtrentProsent(0), omtrentProsent(2), omtrentProsent(4), omtrentProsent(64)], ['0 %', 'under 5 %', 'omtrent 5 %', 'omtrent 65 %']);
  const alt = medValg(...['smith-morra', 'kongegambitt', 'fransk-fremstot', 'caro-kann-fremstot', 'skandinavisk', 'aljechin', 'pirc-modern']);
  assert.equal(svarDekning(slots, alt, 'w').hull, null);
  assert.match(dekningTekst(svarDekning(slots, alt, 'w'), 'w'), /det aller meste/);
});

test('dekning: et valg som stenger veien til en dypere plass dekker den også', () => {
  const slots = fordel(alle);
  const islandsk = svarDekning(slots, medValg('islandsk-gambitt'), 'b');
  assert.equal(Math.round(islandsk.prosent), 45, 'hele 1.e4, selv om spansk aldri oppstår');
  assert.equal(islandsk.hull.slot.id, 'b-d4');
  const marshall = svarDekning(slots, medValg('marshall'), 'b');
  assert.equal(Math.round(marshall.prosent), 15);
  assert.equal(marshall.hull.slot.id, 'b-d4');
  assert.equal(Math.round(svarDekning(slots, medValg('marshall', 'budapest-gambitt'), 'b').prosent), 53, 'spansk alene er ikke hele 1.e4');
  assert.equal(svarDekning(slots, medValg('marshall', 'budapest-gambitt'), 'b').hull.slot.id, 'b-e4');
  assert.equal(svarAndel(slots.find(s => s.id === 'b-e4')), 45);
  assert.equal(slotVekt(slots.find(s => s.id === 'b-e4')), 20);
});

test('bygg: størst først, hvit før svart, og alt fra datamappen er med', () => {
  const slots = fordel(alle);
  const steg = byggSteg(slots);
  assert.deepEqual(steg.slice(0, 3).map(s => s.id), ['w-c5', 'w-e5', 'w-e6']);
  assert.deepEqual(steg.filter(s => s.farge === 'b').map(s => s.id).slice(0, 4), ['b-e4', 'b-spansk', 'b-italiensk', 'b-d4']);
  assert.ok(steg.findIndex(s => s.farge === 'b') > steg.findLastIndex(s => s.farge === 'w'));
  for (const { id } of apninger) assert.ok(steg.some(slot => slot.apninger.some(a => a.id === id)), `${id} kan ikke velges i flyten`);
  const nye = fordel([...alle, lagTest('ny-hvit', 'w', '', [repTrekk('d4', { plan: 'p' })])]);
  assert.equal(byggSteg(nye).filter(s => s.farge === 'w').at(-1).id, 'w-andre', 'en ny åpning finner veien inn uten å nevnes');
});

test('bygg: frem og tilbake, og spørsmål som ikke lenger gjelder hoppes over', () => {
  const slots = fordel(alle);
  const fremgang = tomFremgang();
  assert.equal(forsteSteg(slots, fremgang, 'w').id, 'w-c5');
  assert.equal(nabostSteg(slots, fremgang, 'w-c5', 1).id, 'w-e5');
  assert.equal(nabostSteg(slots, fremgang, 'w-e5', -1).id, 'w-c5');
  assert.equal(nabostSteg(slots, fremgang, 'w-c5', -1), null);
  const sisteHvit = byggSteg(slots).filter(s => s.farge === 'w').at(-1);
  assert.equal(nabostSteg(slots, fremgang, sisteHvit.id, 1), null, 'hvit stopper før svart');
  assert.equal(nabostSteg(slots, fremgang, 'b-e4', 1).id, 'b-spansk');
  const islandsk = medValg('islandsk-gambitt');
  assert.equal(nabostSteg(slots, islandsk, 'b-e4', 1).id, 'b-d4', 'etter 1…d5 blir det aldri spansk');
  assert.equal(nabostSteg(slots, islandsk, 'b-d4', -1).id, 'b-e4');
  const begge = medValg('islandsk-gambitt', 'e5-mot-resten');
  assert.equal(nabostSteg(slots, begge, 'b-e4', 1).id, 'b-spansk', 'to veier holder begge åpne');
  const hull = medValg('smith-morra', 'fransk-fremstot');
  assert.equal(forsteSteg(slots, hull, 'w', { bareHull: true }).id, 'w-e5');
  assert.equal(nabostSteg(slots, hull, 'w-e5', 1, { bareHull: true }).id, 'w-c6', 'bare det som står tomt');
});

test('bygg: forslag og det som dekker mest kommer først, og det som er valgt fra før ligger øverst', () => {
  const slot = fordel(alle).find(s => s.id === 'w-e5');
  assert.deepEqual(alternativer(slot, tomFremgang()).slice(0, 3).map(a => a.id), ['kongegambitt', 'dansk-gambitt', 'wienergambitt'].sort((a, b) => slot.apninger.findIndex(x => x.id === a) - slot.apninger.findIndex(x => x.id === b)));
  assert.equal(alternativer(slot, medValg('halloween-gambitt'))[0].id, 'halloween-gambitt');
  assert.equal(alternativer(slot, tomFremgang()).length, slot.apninger.length);
  assert.deepEqual(veiInnTrekk(finn('smith-morra')), ['e4', 'c5', 'd4', 'cxd4', 'c3']);
});

test('tekst: første setning stopper ikke på trekk, og alle åpninger har en', () => {
  assert.equal(forsteSetning('2.f4! Hvit ofrer en bonde. Det er gøy.'), '2.f4! Hvit ofrer en bonde.');
  assert.equal(forsteSetning('Med 3.Lc4 og ca. 2 bønder. Så videre.'), 'Med 3.Lc4 og ca. 2 bønder.');
  assert.equal(forsteSetning('Ingen slutt her'), 'Ingen slutt her');
  for (const apning of alle) for (const tekst of [apning.kort, apning.intro.karakter]) assert.ok(forsteSetning(tekst).length > 20, apning.id);
  assert.equal(helTrekk('svarer 1…e5?'), 'svarer <span class="ap-helt">1…e5?</span>');
});

test('sannsynlighet: det vanligste svaret og vekt nedover veien', () => {
  const smith = finn('smith-morra');
  assert.equal(veiVekt(smith, ['e4', 'c5']), 0.34);
  assert.ok(veiVekt(smith, ['e4', 'c5', 'd4', 'cxd4', 'c3', 'dxc3']) < 0.34);
  const a = lagTest('vekt', 'w', 'e4 e5', [repTrekk('Nf3'), svarTrekk('Nf3 Nc6', { vekt: 3 }), repTrekk('Nf3 Nc6 Bc4', { plan: 'p' }), svarTrekk('Nf3 d6', { vekt: 1 }), repTrekk('Nf3 d6 d4', { plan: 'p' })]);
  assert.ok(Math.abs(veiVekt(a, ['e4', 'e5', 'Nf3', 'Nc6']) - 0.3 * 0.75) < 1e-9);
  assert.ok(Math.abs(veiVekt(a, ['e4', 'e5', 'Nf3', 'd6']) - 0.3 * 0.25) < 1e-9);
  assert.ok(Math.abs(veiVekt(a, ['e4', 'e5', 'Nf3', 'f6', 'd4', 'Nc6', 'Bc4', 'a6']) - 0.3 * 0.25 ** 3) < 1e-9, 'utenfor treet teller hvert trekk som sjeldent');
  for (const apning of alle) for (const kort of lagKort([apning])) assert.ok(kort.vekt > 0, `${apning.id}: ${kort.id}`);
});

test('nye kort: hovedlinjer mot de vanligste svarene først, som en historie', () => {
  const valgte = [finn('fransk-fremstot'), finn('kongegambitt'), finn('smith-morra')];
  const fremgang = tomFremgang();
  settTempo(fremgang, 15, NAA);
  const kort = lagKort(valgte);
  const nye = kortKo(kort, fremgang, NAA, 100).nyeKort;
  assert.equal(nye.length, kort.length);
  assert.equal(nye[0].kilder[0].apning.id, 'smith-morra', 'mest vanlige svar først');
  assert.deepEqual(nye[0].trekk, ['c3']);
  assert.deepEqual(nye[1].trekk, ['Nxc3'], 'og videre nedover samme linje');
  assert.equal(nye[1].kilder[0].forTrekk.join(' '), 'e4 c5 d4 cxd4 c3 dxc3');
  const plass = id => nye.findIndex(k => k.kilder[0].apning.id === id);
  assert.ok(plass('kongegambitt') < plass('fransk-fremstot'), '1…e5 før 1…e6');
  // A side line never comes before the main line it leaves.
  const smith = nye.filter(k => k.kilder[0].node);
  for (const [i, k] of smith.entries()) {
    const forelder = k.kilder[0].node.forelder.forelder;
    const tidligere = forelder?.sti ? smith.findIndex(x => x.kilder.some(kilde => kilde.node === forelder)) : -1;
    assert.ok(tidligere < i, k.kilder[0].sti);
  }
});

test('nye kort: det som allerede er lært, og kort utenfor repertoaret, står urørt', () => {
  const fremgang = tomFremgang();
  const kort = lagKort([finn('smith-morra')]);
  const gammel = { boks: 3, forfall: NAA + 5 * DOGN, sist: NAA - DOGN, forst: NAA - 9 * DOGN, riktige: 3, feil: 0 };
  fremgang.kort[kort[0].id] = gammel;
  fremgang.kort.utenfor = { ...gammel };
  const ko = kortKo(kort, fremgang, NAA);
  assert.ok(!ko.nyeKort.includes(kort[0]));
  assert.ok(ko.nyeKort.length);
  assert.equal(fremgang.kort[kort[0].id], gammel);
  assert.equal(fremgang.kort.utenfor.boks, 3);
  assert.equal(Object.keys(fremgang.kort).length, 2);
});

test('læring: et nytt kort vises først, og testes noen kort senere', () => {
  const fremgang = tomFremgang();
  const nye = falskeKort(6);
  const okt = lagOkt([], () => 0.5, nye);
  assert.equal(okt.totalt, 6);
  assert.equal(okt.ko.length, 12, 'hvert kort står to ganger');
  assert.deepEqual(okt.ko.map(k => k.id), ['k0', 'k1', 'k2', 'k0', 'k1', 'k2', 'k3', 'k4', 'k5', 'k3', 'k4', 'k5'], 'i rekkefølge, litt om gangen');
  for (const kort of nye) {
    const forste = okt.ko.indexOf(kort), andre = okt.ko.lastIndexOf(kort);
    assert.ok(andre - forste >= 3, 'to andre kort imellom');
  }
  assert.ok(okt.laer.has('k0'));
  vistKort(okt, nye[0], fremgang, NAA);
  assert.deepEqual(fremgang.kort.k0, { boks: 0, forfall: dagStart(NAA), sist: NAA, forst: NAA, riktige: 0, feil: 0, vist: NAA });
  assert.ok(!okt.laer.has('k0'));
  assert.ok(okt.vist.has('k0'));
  assert.equal(svarKort(okt, nye[0], 'riktig', fremgang, NAA + 1000).boks, 1, 'først testen gir første boks');
  assert.equal(fremgang.kort.k0.forst, NAA);
  assert.equal(fremgang.kort.k0.forfall, dagStart(NAA, 1));
});

test('læring: repetisjoner stokkes og fordeles mellom de nye, og ingen ny test kommer før kortet er vist', () => {
  const rep = falskeKort(8).map(k => ({ ...k, id: `r${k.id}` }));
  const nye = falskeKort(6);
  const okt = lagOkt(rep, () => 0.3, nye);
  assert.equal(okt.totalt, 14);
  assert.equal(okt.ko.length, 20);
  assert.ok(okt.ko[0].id.startsWith('r'), 'økta begynner med noe kjent');
  const sett = new Set();
  for (const kort of okt.ko) {
    if (kort.id.startsWith('r')) continue;
    if (!sett.has(kort.id)) { sett.add(kort.id); assert.equal(sett.size, nye.indexOf(kort) + 1, 'historien holder rekkefølgen'); }
  }
  assert.deepEqual(new Set(okt.ko.filter(k => k.id.startsWith('r')).map(k => k.id)), new Set(rep.map(k => k.id)));
  assert.notDeepEqual(okt.ko.filter(k => k.id.startsWith('r')).map(k => k.id), rep.map(k => k.id));
});

test('læring: et kort som er vist men ikke testet, venter på testen sin, og teller som dagens nye', () => {
  const fremgang = tomFremgang();
  const kort = falskeKort(10);
  const okt = lagOkt([], () => 0.5, kort.slice(0, 2));
  vistKort(okt, kort[0], fremgang, NAA);
  const ko = kortKo(kort, fremgang, NAA + 1000);
  assert.deepEqual(ko.klare.map(k => k.id), ['k0'], 'den kan testes, men aldri læres på nytt');
  assert.equal(ko.nye, NYE_PER_DAG - 1);
  assert.ok(!ko.nyeKort.includes(kort[0]));
  assert.equal(forfallerIMorgen(kort, fremgang, NAA), 0);
});

test('læring: gammel fremgang læres aldri på nytt', () => {
  const fremgang = tomFremgang();
  const kort = lagKort([finn('smith-morra')]);
  fremgang.kort[kort[0].id] = { boks: 2, forfall: NAA - 1000, sist: NAA - 3 * DOGN, forst: NAA - 9 * DOGN, riktige: 2, feil: 0 };
  const ko = kortKo(kort, fremgang, NAA);
  const okt = lagOkt(ko.klare, () => 0.5, ko.nyeKort);
  assert.ok(!okt.laer.has(kort[0].id));
  assert.equal(okt.ko.filter(k => k === kort[0]).length, 1);
  assert.ok(okt.ko.every(k => fremgang.kort[k.id] || okt.laer.has(k.id)), 'alt som ikke er kjent, skal vises først');
});

test('læring: en feil i testen kommer tilbake uten at kortet vises som nytt igjen', () => {
  const fremgang = tomFremgang();
  const kort = falskeKort(3);
  const okt = lagOkt([], () => 0.5, kort);
  for (const k of kort) { vistKort(okt, k, fremgang, NAA); okt.ko.shift(); }
  svarKort(okt, kort[0], 'feil', fremgang, NAA);
  okt.ko.shift();
  assert.equal(okt.ko.at(-1), kort[0]);
  assert.equal(okt.laer.size, 0);
  assert.equal(fremgang.kort.k0.forst, NAA);
});

test('en økt holder det knappen lover', () => {
  const ko = kortKo(falskeKort(40), tomFremgang(), NAA);
  assert.deepEqual(oktInnhold(ko), { repetisjoner: 0, nye: 6, etterpa: 0 });
  assert.deepEqual(oktInnhold({ forfalte: 30, nye: 15 }), { repetisjoner: OKT_STORRELSE, nye: 15, etterpa: 18 }, 'de rolige tempoene får plass i én økt');
  assert.deepEqual(oktInnhold({ forfalte: 0, nye: 40 }), { repetisjoner: 0, nye: NYE_I_OKT, etterpa: 25 });
  assert.equal(oktTekst({ repetisjoner: 8, nye: 6 }), '8 repetisjoner og 6 nye');
  assert.equal(oktTekst({ repetisjoner: 1, nye: 1 }), '1 repetisjon og 1 ny');
  assert.equal(oktTekst({ repetisjoner: 0, nye: 6 }), '6 nye kort');
  assert.equal(oktTekst({ repetisjoner: 0, nye: 1 }), '1 nytt kort');
  assert.equal(oktTekst({ repetisjoner: 3, nye: 0 }), '3 repetisjoner');
  const okt = lagOkt(falskeKort(30), () => 0.5, falskeKort(60).slice(30));
  assert.equal(okt.totalt, OKT_STORRELSE + NYE_I_OKT);
});

const fargeKort = (hvite, svarte) => [...falskeKort(hvite).map(k => ({ ...k, id: `w${k.id}`, farge: 'w' })), ...falskeKort(svarte).map(k => ({ ...k, id: `b${k.id}`, farge: 'b' }))];
const forfalt = (fremgang, kort) => { for (const k of kort) fremgang.kort[k.id] = { boks: 2, forfall: NAA - 86400000, sist: NAA - 5 * 86400000, forst: NAA - 9 * 86400000, riktige: 2, feil: 0 }; };

test('farger: en økt for svart viser bare svarts kort', () => {
  const kort = fargeKort(10, 10);
  const fremgang = tomFremgang();
  forfalt(fremgang, [...kort.slice(0, 3), ...kort.slice(10, 12)]);
  const ko = kortKo(kort, fremgang, NAA, 0, 'b');
  assert.ok(ko.kort.length > 0);
  assert.ok(ko.kort.every(k => k.farge === 'b'));
  assert.equal(ko.forfalte, 2);
  assert.equal(kortKo(kort, fremgang, NAA).forfalte, 5, 'uten farge er det begge, som før');
  assert.deepEqual(medFarge(kort, null), kort);
  assert.equal(medFarge(kort, 'w').length, 10);
});

test('farger: filteret rører ikke timeplanen', () => {
  const kort = fargeKort(8, 8);
  const fremgang = tomFremgang();
  forfalt(fremgang, kort.slice(0, 4));
  const for_ = JSON.stringify(fremgang);
  for (const farge of ['w', 'b', null]) {
    kortKo(kort, fremgang, NAA, 0, farge);
    nesteEkstra(kort, fremgang, NAA, 0, farge);
    kortStatus(medFarge(kort, farge), fremgang, kortKo(kort, fremgang, NAA, 0, farge));
  }
  assert.equal(JSON.stringify(fremgang), for_);
  const ko = kortKo(kort, fremgang, NAA, 0, 'w');
  const okt = lagOkt(ko.klare, () => 0.5, ko.nyeKort);
  assert.ok(okt.ko.every(k => k.farge === 'w'));
  const post = svarKort(okt, ko.klare[0], 'riktig', fremgang, NAA);
  assert.equal(post.boks, 3, 'et svar flytter kortet akkurat som i ei økt for begge');
});

test('farger: dagens nye kort er ett tall for begge', () => {
  const kort = fargeKort(10, 10);
  const fremgang = tomFremgang();
  assert.equal(kortKo(kort, fremgang, NAA, 0, 'w').nye, NYE_PER_DAG);
  assert.equal(kortKo(kort, fremgang, NAA, 0, 'b').nye, NYE_PER_DAG);
  assert.ok(delerNye(kortKo(kort, fremgang, NAA, 0, 'w'), kortKo(kort, fremgang, NAA, 0, 'b'), kortKo(kort, fremgang, NAA)), 'knappen sier fra at de deles');
  const hvite = kortKo(kort, fremgang, NAA, 0, 'w').nyeKort;
  const okt = lagOkt([], () => 0.5, hvite.slice(0, 4));
  for (const k of hvite.slice(0, 4)) vistKort(okt, k, fremgang, NAA);
  assert.equal(kortKo(kort, fremgang, NAA, 0, 'b').nye, NYE_PER_DAG - 4, 'hvite nye kort teller også for svart');
  assert.equal(kortKo(kort, fremgang, NAA).nye, NYE_PER_DAG - 4);
});

test('farger: pausen etter fravær gjelder hele repertoaret, og «Ta flere» finner kort i fargen', () => {
  const kort = fargeKort(MAKS_FORFALT, 5);
  const fremgang = tomFremgang();
  forfalt(fremgang, kort.slice(0, MAKS_FORFALT));
  const svart = kortKo(kort, fremgang, NAA, 0, 'b');
  assert.equal(svart.pause, true, 'hvits etterslep holder også nye svarte kort tilbake');
  assert.equal(svart.nye, 0);
  assert.equal(svart.kort.length, 0);
  const uten = tomFremgang();
  const alleNye = fargeKort(6, 6);
  const forste = kortKo(alleNye, uten, NAA, 0, 'w').nyeKort;
  for (const k of forste) uten.kort[k.id] = { boks: 1, forfall: NAA + 86400000, sist: NAA, forst: NAA, riktige: 1, feil: 0 };
  assert.equal(kortKo(alleNye, uten, NAA, 0, 'b').kort.length, 0, 'dagens nye er brukt opp på hvit');
  const ekstra = nesteEkstra(alleNye, uten, NAA, 0, 'b');
  assert.ok(kortKo(alleNye, uten, NAA, ekstra, 'b').kort.every(k => k.farge === 'b'));
  assert.ok(kortKo(alleNye, uten, NAA, ekstra, 'b').kort.length > 0);
});

test('farger: det knappen og fanen sier', () => {
  assert.equal(klarTekst(12, 8), 'Hvit: 12 kort · Svart: 8 kort');
  assert.equal(klarTekst(1, 0), 'Hvit: 1 kort · Svart: ingen kort');
  const kort = fargeKort(5, 5);
  const fremgang = tomFremgang();
  forfalt(fremgang, kort.slice(0, 2));
  const hvite = medFarge(kort, 'w');
  assert.deepEqual(kortStatus(hvite, fremgang, kortKo(kort, fremgang, NAA, 0, 'w')), { totalt: 5, klare: 5, nye: 3, laert: 2 });
  assert.deepEqual(kortStatus(medFarge(kort, 'b'), fremgang, kortKo(kort, fremgang, NAA, 0, 'b')), { totalt: 5, klare: 5, nye: 5, laert: 0 });
});

test('neste steg: alltid én ting å gjøre', () => {
  assert.deepEqual(nesteSteg(0, null), { type: 'bygg' });
  assert.deepEqual(nesteSteg(2, { forfalte: 8, nye: 6, flere: true }), { type: 'okt', repetisjoner: 8, nye: 6, etterpa: 0 });
  assert.deepEqual(nesteSteg(2, { forfalte: 0, nye: 0, flere: true }), { type: 'flere' });
  assert.deepEqual(nesteSteg(2, { forfalte: 0, nye: 0, flere: false }), { type: 'ov' });
});

test('tempo: 6 er standard, og valget styrer dagens nye', () => {
  const fremgang = tomFremgang();
  const kort = falskeKort(40);
  assert.equal(nyePerDag(fremgang), 6);
  assert.deepEqual(NYE_VALG, [6, 10, 15, 25, 40, FRITT]);
  settTempo(fremgang, 15, NAA);
  assert.deepEqual(fremgang.tempo, { nye: 15, sist: NAA });
  assert.equal(kortKo(kort, fremgang, NAA).nye, 15);
  assert.equal(kortKo(kort, fremgang, NAA, 1).nye, 30, 'Ta flere følger tempoet');
  fremgang.tempo = { nye: 999, sist: NAA };
  assert.equal(nyePerDag(fremgang), 6, 'noe ukjent gir standarden');
  assert.equal(nyePerDag({}), 6);
});

test('introen vises én gang per åpning, og kort teller som lært etter testen', () => {
  const fremgang = tomFremgang();
  assert.equal(introSett(fremgang, 'a'), false);
  merkIntro(fremgang, 'a', NAA);
  assert.equal(introSett(fremgang, 'a'), true);
  assert.equal(introSett(fremgang, 'b'), false);
  const kort = falskeKort(3);
  const okt = lagOkt([], () => 0.5, kort);
  vistKort(okt, kort[0], fremgang, NAA);
  assert.equal(laerteKort(kort, fremgang), 0);
  svarKort(okt, kort[0], 'riktig', fremgang, NAA);
  assert.equal(laerteKort(kort, fremgang), 1);
});

test('fremgang fra før læringen får de nye feltene og beholder alt', () => {
  const minne = new Map([[NOKKEL, JSON.stringify({ versjon: 1, linjer: {}, feil: {}, feller: {}, repertoar: { a: { valgt: true, sist: 1 } }, kort: { k: { boks: 2, forfall: 1, sist: 1, forst: 1, riktige: 2, feil: 0 } } })]]);
  const fremgang = lesFremgang({ getItem: k => minne.get(k) ?? null, setItem() {} });
  assert.deepEqual(fremgang.introer, {});
  assert.deepEqual(fremgang.tempo, {});
  assert.equal(fremgang.kort.k.boks, 2);
  assert.equal(fremgang.repertoar.a.valgt, true);
  assert.equal(nyePerDag(fremgang), NYE_PER_DAG);
});

test('synk: tempo og introer flettes, det nyeste tempoet vinner, og alt overlever', () => {
  const a = { ...tomFremgang(), tempo: { nye: 15, sist: 300 }, introer: { x: { sist: 5 } }, kort: { k: { boks: 0, sist: 10, vist: 10 } } };
  const b = { ...tomFremgang(), tempo: { nye: 10, sist: 200 }, introer: { y: { sist: 6 } }, kort: { k: { boks: 1, sist: 20, vist: 10 } } };
  const ut = slaSammen(a, b);
  assert.equal(ut.tempo.nye, 15);
  assert.deepEqual(Object.keys(ut.introer).sort(), ['x', 'y']);
  assert.equal(ut.kort.k.boks, 1, 'testen på den andre enheten teller');
  assert.ok(lik(slaSammen(a, b), slaSammen(b, a)));
  assert.ok(lik(slaSammen(ut, ut), ut));
  const gammel = { ...tomFremgang(), introer: undefined, tempo: undefined };
  assert.equal(slaSammen(gammel, a).tempo.nye, 15, 'en enhet uten feltet tar det fra den andre');
  assert.deepEqual(slaSammen(gammel, gammel).tempo, {});
  assert.equal(slaSammen(tomFremgang(), { ...tomFremgang(), tempo: { nye: 10, sist: 1 } }).tempo.nye, 10, 'et valg slår standarden');
});

test('synk: et tempo fra en annen enhet kommer fram og lastes ikke opp på nytt', async () => {
  const fjern = { ...tomFremgang(), tempo: { nye: 10, sist: 5 }, introer: { x: { sist: 5 } } };
  const { synk, logg } = falskSynk({ svar: () => [200, { userId: 'u', revision: 2, state: fjern }] });
  await synk.start();
  assert.equal(nyePerDag(logg.fremgang), 10);
  assert.equal(introSett(logg.fremgang, 'x'), true);
  assert.deepEqual(logg.kall.map(k => k.metode), ['GET']);
});

test('kort: hver felle og hvert kort kan vises, med noe å si og en pil å følge', () => {
  for (const apning of alle) for (const kort of lagKort([apning])) {
    const kilde = kort.kilder.find(k => k.node) ?? kort.kilder.find(k => !k.godtatt);
    assert.ok(kilde, `${apning.id}: et kort uten hovedtrekk`);
    assert.ok(kilde.fra && kilde.til);
    if (kilde.felle && !kilde.node) assert.ok(kilde.felle.tekst && kilde.felle.forklaring);
    else if (kilde.node) assert.ok(kilde.node.entry.hva && kilde.node.entry.ide);
  }
});

test('tempo: mange kort per dag, og «Så mange jeg vil» har ingen grense', () => {
  const fremgang = tomFremgang();
  const kort = falskeKort(120);
  settTempo(fremgang, 40, NAA);
  assert.equal(kortKo(kort, fremgang, NAA).nye, 40);
  settTempo(fremgang, FRITT, NAA);
  assert.equal(valgtTempo(fremgang), FRITT);
  assert.equal(nyePerDag(fremgang), Infinity);
  assert.equal(JSON.parse(JSON.stringify(fremgang.tempo)).nye, FRITT, 'tåler lagring');
  const ko = kortKo(kort, fremgang, NAA);
  assert.equal(ko.nye, 120);
  assert.equal(ko.flere, false);
  assert.equal(lagOkt(ko.klare, () => 0.5, ko.nyeKort).totalt, NYE_I_OKT, 'ei økt er en porsjon');
  const tatt = ko.nyeKort.slice(0, NYE_I_OKT);
  const okt = lagOkt([], () => 0.5, tatt);
  for (const k of tatt) { vistKort(okt, k, fremgang, NAA); svarKort(okt, k, 'riktig', fremgang, NAA); }
  assert.equal(kortKo(kort, fremgang, NAA).nye, 120 - NYE_I_OKT, 'neste porsjon er klar med én gang');
});

test('tempo: pausen etter lang fravær gjelder bare de rolige tempoene', () => {
  const kort = falskeKort(70);
  const fremgang = tomFremgang();
  kort.slice(0, 50).forEach(k => { fremgang.kort[k.id] = { boks: 2, forfall: NAA - 100 * DOGN, sist: NAA - 200 * DOGN, forst: NAA - 300 * DOGN, riktige: 1, feil: 0 }; });
  for (const rolig of [6, 10, 15]) {
    settTempo(fremgang, rolig, NAA);
    const ko = kortKo(kort, fremgang, NAA);
    assert.equal(ko.pause, true, String(rolig));
    assert.equal(ko.nye, 0);
    assert.equal(ko.forfalte, MAKS_FORFALT);
  }
  for (const [tempo, nye] of [[25, 20], [40, 20], [FRITT, 20]]) {
    settTempo(fremgang, tempo, NAA);
    const ko = kortKo(kort, fremgang, NAA);
    assert.equal(ko.pause, false, String(tempo));
    assert.equal(ko.nye, nye);
    assert.equal(ko.forfalte, 50, 'ingen tak spilleren står fast bak');
  }
});

test('spolelinje: ett segment per kort, med resultat, og det som kommer er stengt', () => {
  const fremgang = tomFremgang();
  const nye = falskeKort(3);
  const rep = falskeKort(5).slice(3).map(k => { fremgang.kort[k.id] = { boks: 1, forfall: NAA - 1, sist: NAA - DOGN, forst: NAA - DOGN, riktige: 1, feil: 0 }; return k; });
  const okt = lagOkt(rep, () => 0.5, nye);
  assert.equal(okt.kortliste.length, 5, 'et nytt kort står to ganger i køen, men er ett segment');
  assert.deepEqual(sporSegmenter(okt, okt.ko[0].id).map(s => s.apen), [true, false, false, false, false]);
  vistKort(okt, nye[0], fremgang, NAA);
  svarKort(okt, rep[0], 'riktig', fremgang, NAA);
  svarKort(okt, rep[1], 'feil', fremgang, NAA);
  const status = id => sporSegmenter(okt).find(s => s.kort.id === id).status;
  assert.deepEqual([status('k0'), status('k3'), status('k4'), status('k1')], ['vist', 'riktig', 'feil', 'ny']);
  svarKort(okt, nye[0], 'hint', fremgang, NAA);
  assert.equal(status('k0'), 'hint', 'testen avgjør fargen');
  svarKort(okt, rep[1], 'riktig', fremgang, NAA);
  assert.equal(status('k4'), 'feil', 'første svar står, som i vurderingen');
});

test('spolelinje: navnet sier hvor og hvordan, men aldri trekket', () => {
  const kort = lagKort([finn('smith-morra')]).slice(0, 2);
  const okt = lagOkt(kort, () => 0.5);
  okt.resultat.set(kort[0].id, 'hint');
  const segmenter = sporSegmenter(okt, kort[1].id);
  const her = okt.kortliste.indexOf(kort[0]);
  assert.equal(segmentNavn(segmenter[her], her, 2), `Kort ${her + 1} av 2: Smith-Morra-gambitt, riktig med hint`);
  const annen = 1 - her;
  assert.match(segmentNavn(segmenter[annen], annen, 2), /ikke tatt ennå, du er her$/);
  for (const k of lagKort([finn('smith-morra')])) assert.ok(!segmentNavn({ kort: k, status: 'ny', aktiv: false }, 0, 1).includes(k.kilder[0].san), 'trekket røpes ikke');
});

test('spolelinje: en finger lander på nærmeste kort som kan åpnes, og piltastene hopper over det stengte', () => {
  const s = apen => ({ apen });
  const segmenter = [s(true), s(false), s(true), s(true), s(false), s(false)];
  assert.equal(segmentVed(segmenter, 0), 0);
  assert.equal(segmentVed(segmenter, 0.4), 2);
  assert.equal(segmentVed(segmenter, 0.99), 3, 'forbi det siste går ikke');
  assert.equal(segmentVed(segmenter, -3), 0);
  assert.equal(segmentVed(segmenter, 7), 3);
  assert.equal(segmentVed([s(false)], 0.5), -1);
  assert.equal(nesteSegment(segmenter, 0, 1), 2);
  assert.equal(nesteSegment(segmenter, 3, 1), 3);
  assert.equal(nesteSegment(segmenter, 2, -1), 0);
  assert.equal(nesteSegment(segmenter, 0, -1), 0);
});

test('øving: rører verken bokser, forfall, feil eller introer', () => {
  const fremgang = tomFremgang();
  const kort = falskeKort(4);
  vurderKort(fremgang, kort[0].id, 'riktig', NAA);
  vurderKort(fremgang, kort[1].id, 'riktig', NAA);
  const for_ = JSON.stringify(fremgang);
  const okt = lagOvelse(kort, fremgang);
  assert.equal(okt.ovelse, true);
  assert.deepEqual([...okt.laer], ['k2', 'k3'], 'det ingen har lært, vises først');
  assert.equal(okt.ko.length, 4, 'her vises et ukjent kort én gang');
  assert.equal(svarKort(okt, kort[0], 'feil', fremgang, NAA + 1), null);
  assert.equal(okt.resultat.get('k0'), 'feil');
  assert.equal(okt.bom.size, 1);
  okt.ko.shift();
  assert.ok(okt.ko.includes(kort[0]), 'en bom kommer tilbake her også');
  svarKort(okt, kort[1], 'riktig', fremgang, NAA + 1);
  vistKort(okt, kort[2], fremgang, NAA + 1);
  assert.ok(!okt.laer.has('k2'));
  assert.equal(JSON.stringify(fremgang), for_, 'fremgangen er helt lik');
});

test('øving: i rekkefølge følger historien, stokket gjør det ikke, og alt er med', () => {
  const kort = lagKort([finn('smith-morra')]);
  const rekke = ovelseRekke(kort);
  assert.deepEqual(rekke[0].trekk, ['c3']);
  assert.deepEqual(rekke[1].trekk, ['Nxc3']);
  assert.equal(new Set(rekke).size, kort.length);
  let f = 0.37;
  const stokket = ovelseRekke(kort, { stokket: true, tilfeldig: () => { f = (f * 9301 + 0.49297) % 1; return f; } });
  assert.equal(new Set(stokket).size, kort.length);
  assert.notDeepEqual(stokket.map(k => k.id), rekke.map(k => k.id));
  assert.ok(OVELSE_STORRELSE >= 20);
});

test('repetering: de samme kortene som øving, og bare bommene når det er det spilleren vil', () => {
  const fremgang = tomFremgang();
  const kort = falskeKort(3);
  const okt = lagOkt(kort, () => 0.5);
  for (const k of kort) vurderKort(fremgang, k.id, 'riktig', NAA);
  svarKort(okt, kort[1], 'feil', fremgang, NAA + 5);
  const for_ = JSON.stringify(fremgang);
  const alle3 = lagOvelse(okt.kortliste, fremgang);
  assert.equal(alle3.ko.length, 3);
  assert.equal(alle3.laer.size, 0, 'kjente kort spørres rett');
  const bom = lagOvelse([...okt.bom.values()].map(v => v.kort), fremgang);
  assert.deepEqual(bom.ko.map(k => k.id), ['k1']);
  for (const k of alle3.ko.slice()) svarKort(alle3, k, 'riktig', fremgang, NAA + 9);
  assert.equal(JSON.stringify(fremgang), for_);
});

test('kort: et nytt kort testes aldri rett etter at det ble vist', () => {
  for (const antall of [2, 4, 7, 10, 13, 15]) {
    const { ko } = lagOkt([], () => 0, falskeKort(antall));
    for (const kort of new Set(ko)) {
      const plasser = ko.flatMap((k, i) => (k === kort ? [i] : []));
      assert.equal(plasser.length, 2, `${antall} nye: vises og testes`);
      assert.ok(plasser[1] - plasser[0] > 1, `${antall} nye: noe imellom`);
    }
  }
  const alene = falskeKort(1);
  assert.deepEqual(lagOkt([], () => 0, alene).ko, alene, 'et kort helt alene venter med testen');
  assert.equal(lagOkt(falskeKort(3).slice(1), () => 0, alene).ko.filter(k => k === alene[0]).length, 2, 'med repetisjoner imellom testes det i samme økt');
});

test('kort: å vise et kort overskriver ikke fremgang som kom fra en annen enhet', () => {
  const fremgang = tomFremgang();
  const [kort] = falskeKort(1);
  const okt = lagOkt([], () => 0, [kort]);
  fremgang.kort[kort.id] = { boks: 3, forfall: NAA, sist: NAA, forst: NAA, riktige: 3, feil: 0 };
  vistKort(okt, kort, fremgang, NAA + 1000);
  assert.equal(fremgang.kort[kort.id].boks, 3);
});

test('kort: en strøket test teller ikke som lært, og et kort som venter på testen er stengt i sporet', () => {
  const fremgang = tomFremgang();
  const kort = falskeKort(3);
  const okt = lagOkt([], () => 0, kort);
  vistKort(okt, kort[0], fremgang, NAA);
  okt.ko.shift();
  assert.equal(sporSegmenter(okt, okt.ko[0].id)[0].apen, false, 'svaret skal ikke kunne ses rett før testen');
  vurderKort(fremgang, kort[0].id, 'feil', NAA);
  assert.equal(fremgang.kort[kort[0].id].boks, 1);
  assert.equal(laerteKort(kort, fremgang), 0);
  vurderKort(fremgang, kort[0].id, 'riktig', NAA);
  assert.equal(laerteKort(kort, fremgang), 1);
});

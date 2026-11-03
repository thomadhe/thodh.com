import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { Chess } from '../public/sjakk/vendor/chess.mjs';
import { lesApning, stilling } from '../public/sjakk/apninger/modell.mjs';
import { tomFremgang, vurderLinje, velgLinje, statusFor, noterFeil, vansker, lesFremgang, NOKKEL, INTERVALL_DAGER } from '../public/sjakk/apninger/repetisjon.mjs';
import { norsk, feilKommentar } from '../public/sjakk/apninger/trener.mjs';
import { formaterApning } from '../scripts/sjakk-apninger/format.mjs';

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

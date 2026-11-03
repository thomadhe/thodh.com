// Verifies every opening file: schema and legal lines (chess.js), and optionally soundness with Stockfish.
//   node scripts/sjakk-apninger/verifiser.mjs                      – schema + legality only
//   node scripts/sjakk-apninger/verifiser.mjs --motor <engine.js> [--dybde 16] [--skriv] [--bare id,id]
// --skriv stores the engine verdict on each repertoire move ("motor") and writes rapport.json.
import { readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Chess } from '../../public/sjakk/vendor/chess.mjs';
import { lesApning } from '../../public/sjakk/apninger/modell.mjs';
import { formaterApning } from './format.mjs';
import { startMotor, MATT } from './motor.mjs';

const ROT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const DATA = path.join(ROT, 'public/sjakk/apninger/data');
const GRENSE = 100;
const args = process.argv.slice(2);
const flagg = navn => args.includes(navn);
const verdi = (navn, standard) => { const i = args.indexOf(navn); return i >= 0 ? args[i + 1] : standard; };
const motorFil = verdi('--motor', process.env.SJAKK_MOTOR);
const dybde = Number(verdi('--dybde', 16));
const bare = verdi('--bare', '')?.split(',').filter(Boolean);
const skriv = flagg('--skriv');
const cacheFil = verdi('--cache', path.join(tmpdir(), 'sjakk-apninger-motorcache.json'));

const manifest = JSON.parse(await readFile(path.join(DATA, 'manifest.json'), 'utf8'));
let feilTotalt = 0;
const apninger = [];
for (const id of manifest.apninger) {
  let data;
  try { data = JSON.parse(await readFile(path.join(DATA, `${id}.json`), 'utf8')); } catch (error) { console.error(`FEIL ${id}: ${error.message}`); feilTotalt += 1; continue; }
  const { apning, feil } = lesApning(data);
  if (data.id !== id) feil.push(`${id}: id i filen er ${data.id}`);
  feilTotalt += feil.length;
  for (const f of feil) console.error(`FEIL ${f}`);
  if (apning) apninger.push({ data, apning });
  console.log(`${feil.length ? '✗' : '✓'} ${id}: ${apning?.linjer.length ?? 0} linjer, ${apning?.stillinger ?? 0} stillinger, ${apning ? [...apning.noder.values()].filter(n => n.rep).length : 0} repertoartrekk, ${apning?.feller.length ?? 0} feller`);
}
for (const gruppe of manifest.grupper) for (const id of gruppe.apninger) if (!manifest.apninger.includes(id)) { console.error(`FEIL gruppe ${gruppe.id}: ukjent åpning ${id}`); feilTotalt += 1; }
if (feilTotalt) { console.error(`${feilTotalt} feil.`); process.exit(1); }
if (!motorFil) { console.log('Ingen motor oppgitt – hoppet over Stockfish-sjekken.'); process.exit(0); }

let cache = {};
try { cache = JSON.parse(await readFile(cacheFil, 'utf8')); } catch { /* First run. */ }
const motor = await startMotor(motorFil, { threads: Number(verdi('--threads', 6)), hash: 256 });
console.log(`Motor: ${motor.navn}, dybde ${dybde}`);
const uciFor = m => `${m.from}${m.to}${m.promotion ?? ''}`;
const sanFor = (fen, uci) => new Chess(fen).move({ from: uci.slice(0, 2), to: uci.slice(2, 4), promotion: uci[4] })?.san;

// Score of the best move and of the given move, both from the mover's point of view.
async function vurder(fen, uci) {
  const nokkel = `${dybde}|${fen}|${uci}`;
  if (cache[nokkel]) return cache[nokkel];
  const best = await motor.analyser(fen, { dybde });
  const bestScore = best.linjer[0]?.score ?? 0;
  const trekkScore = best.best === uci ? bestScore : (await motor.analyser(fen, { dybde, trekk: uci })).linjer[0]?.score ?? -MATT;
  const resultat = { best: sanFor(fen, best.best), bestScore, trekkScore: Math.min(trekkScore, bestScore) };
  cache[nokkel] = resultat;
  return resultat;
}
const tilCp = score => Math.max(-9999, Math.min(9999, score));

const rapport = { dato: new Date().toISOString().slice(0, 10), motor: motor.navn, dybde, grenseCp: GRENSE, sjekker: ['schema', 'lovlige trekk og korrekt SAN (chess.js)', 'omstillinger (samme stilling gir samme repertoartrekk)', `Stockfish dybde ${dybde} på hvert repertoartrekk og hvert felletrekk`], ikkeKjort: ['Lichess opening explorer: krever innlogging (HTTP 401 uten token), derfor ikke brukt – ingen konto opprettet'], apninger: [] };
let analysert = 0;
for (const { data, apning } of apninger) {
  if (bare?.length && !bare.includes(apning.id)) continue;
  const flagget = [];
  const repNoder = [...apning.noder.values()].filter(n => n.rep);
  for (const node of repNoder) {
    const fen = node.forelder.fen;
    const uci = uciFor({ from: node.fra, to: node.til, promotion: new Chess(fen).move(node.san).promotion });
    const v = await vurder(fen, uci);
    analysert += 1;
    const tap = Math.max(0, tilCp(v.bestScore) - tilCp(v.trekkScore));
    const cp = tilCp(node.farge === 'w' ? v.trekkScore : -v.trekkScore);
    node.entry.motor = { cp, tap, best: v.best, dybde };
    if (tap > GRENSE) flagget.push({ sti: node.sti, trekk: node.san, tap, best: v.best, cp, kommentert: Boolean(node.entry.vurdering) });
    process.stdout.write('.');
  }
  const felleSjekk = [];
  for (const felle of apning.feller) {
    const chess = new Chess(felle.fen);
    for (const m of felle.losning) {
      if (m.color === felle.side) {
        const v = await vurder(chess.fen(), uciFor(m));
        const tap = Math.max(0, tilCp(v.bestScore) - tilCp(v.trekkScore));
        if (tap > 50) felleSjekk.push({ felle: felle.id, trekk: m.san, tap, best: v.best });
      }
      chess.move(m.san);
    }
  }
  console.log(`\n${apning.id}: ${repNoder.length} repertoartrekk, ${flagget.length} flagget (> ${GRENSE} cp)${felleSjekk.length ? `, ${felleSjekk.length} felletrekk ikke best` : ''}`);
  for (const f of flagget) console.log(`  ⚑ ${f.sti}: ${f.trekk} taper ${f.tap} cp (best ${f.best}, eval ${f.cp})${f.kommentert ? ' – ærlig vurdering finnes' : ' – MANGLER vurdering'}`);
  for (const f of felleSjekk) console.log(`  ⚑ felle ${f.felle}: ${f.trekk} taper ${f.tap} cp (best ${f.best})`);
  rapport.apninger.push({ id: apning.id, linjer: apning.linjer.length, stillinger: apning.stillinger, repertoartrekk: repNoder.length, flagget, felleSjekk });
  if (skriv) await writeFile(path.join(DATA, `${apning.id}.json`), formaterApning(data));
  await writeFile(cacheFil, JSON.stringify(cache));
}
motor.avslutt();
rapport.totalt = { repertoartrekk: analysert, flagget: rapport.apninger.reduce((s, a) => s + a.flagget.length, 0) };
if (skriv && !bare?.length) await writeFile(path.join(ROT, 'scripts/sjakk-apninger/rapport.json'), `${JSON.stringify(rapport, null, 2)}\n`);
console.log(`Ferdig: ${analysert} repertoartrekk analysert, ${rapport.totalt.flagget} flagget.`);

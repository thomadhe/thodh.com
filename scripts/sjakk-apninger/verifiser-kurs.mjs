// Verifies the walkthroughs ("gjennomganger", format in KURS.md): every move, jump, start and answer with chess.js,
// squares and arrows, ids, that the opening exists, and that the course teaches the tree's move where the tree has one.
//   node scripts/sjakk-apninger/verifiser-kurs.mjs                 – every file in public/sjakk/apninger/data/kurs/
//   node scripts/sjakk-apninger/verifiser-kurs.mjs --fil <sti>     – one file anywhere (a draft, a test fixture)
//   --streng also fails on warnings.
// Errors make the course (or the chapter) disappear in the trainer; warnings are things a person should look at.
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { lesApning } from '../../public/sjakk/apninger/modell.mjs';
import { kursTid, lesKurs } from '../../public/sjakk/apninger/kurs.mjs';

const ROT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const DATA = path.join(ROT, 'public/sjakk/apninger/data');
const KURS = path.join(DATA, 'kurs');
const args = process.argv.slice(2);
const verdi = navn => { const i = args.indexOf(navn); return i >= 0 ? args[i + 1] : null; };
const streng = args.includes('--streng');

const manifest = JSON.parse(await readFile(path.join(DATA, 'manifest.json'), 'utf8'));
const apninger = new Map();
async function apning(id) {
  if (!manifest.apninger.includes(id)) return null;
  if (!apninger.has(id)) apninger.set(id, lesApning(JSON.parse(await readFile(path.join(DATA, `${id}.json`), 'utf8'))).apning);
  return apninger.get(id);
}

let filer;
const en = verdi('--fil');
if (en) filer = [path.resolve(en)];
else {
  try { filer = (await readdir(KURS)).filter(fil => fil.endsWith('.json')).sort().map(fil => path.join(KURS, fil)); } catch { filer = []; }
}
if (!filer.length) { console.log('Ingen gjennomganger å sjekke ennå.'); process.exit(0); }

let feilTotalt = 0, advarslerTotalt = 0;
for (const fil of filer) {
  const navn = path.relative(ROT, fil);
  let data;
  try { data = JSON.parse(await readFile(fil, 'utf8')); } catch (error) { console.error(`FEIL ${navn}: ${error.message}`); feilTotalt += 1; continue; }
  const id = path.basename(fil, '.json');
  const feil = [];
  if (!en && data.apning !== id) feil.push(`kurs ${data.apning}: filen heter ${id}.json, men apning er ${data.apning}`);
  const egen = typeof data.apning === 'string' ? await apning(data.apning) : null;
  const svar = lesKurs(data, { apning: egen, finnes: apningId => manifest.apninger.includes(apningId) });
  feil.push(...svar.feil);
  for (const f of feil) console.error(`FEIL ${f}`);
  for (const a of svar.advarsler) console.warn(`ADVARSEL ${a}`);
  feilTotalt += feil.length;
  advarslerTotalt += svar.advarsler.length;
  const { kurs } = svar;
  const steg = kurs ? kurs.kapitler.reduce((sum, k) => sum + k.steg.length, 0) : 0;
  const sporsmal = kurs ? kurs.kapitler.reduce((sum, k) => sum + k.steg.filter(s => s.sporsmal).length, 0) : 0;
  console.log(`${feil.length ? '✗' : '✓'} ${navn}: ${kurs?.kapitler.length ?? 0} kapitler, ${steg} steg, ${sporsmal} spørsmål, oppgitt ${data.minutter ?? '?'} min, anslått ${kurs ? Math.round(kursTid(kurs) / 60000) : '?'} min${svar.advarsler.length ? `, ${svar.advarsler.length} advarsler` : ''}`);
}
// The trainer asks only for the courses listed, once the manifest lists them.
if (!en && Array.isArray(manifest.kurs)) {
  const ider = filer.map(fil => path.basename(fil, '.json'));
  for (const id of ider) if (!manifest.kurs.includes(id)) { console.error(`FEIL manifest.kurs mangler ${id}, så treneren viser den ikke`); feilTotalt += 1; }
  for (const id of manifest.kurs) if (!ider.includes(id)) { console.error(`FEIL manifest.kurs nevner ${id}, men data/kurs/${id}.json finnes ikke`); feilTotalt += 1; }
}
if (feilTotalt || (streng && advarslerTotalt)) { console.error(`${feilTotalt} feil, ${advarslerTotalt} advarsler.`); process.exit(1); }
console.log(advarslerTotalt ? `Ingen feil, ${advarslerTotalt} advarsler.` : 'Ingen feil.');

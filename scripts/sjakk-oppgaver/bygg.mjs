// Builds the puzzle data for /sjakk-for-1/oppgaver from the Lichess puzzle database (CC0).
//
//   node scripts/sjakk-oppgaver/bygg.mjs --input <lichess_db_puzzle.csv.zst> --out public/sjakk/oppgaver/data [--per-band 2000]
//
// The download is untrusted: it is streamed, every field is checked, and every kept
// puzzle is replayed with chess.js before it is written.
import { createReadStream } from 'node:fs';
import { mkdir, writeFile, readdir, rm, open } from 'node:fs/promises';
import path from 'node:path';
import readline from 'node:readline';
import zlib from 'node:zlib';
import { parseArgs } from 'node:util';
import { Readable } from 'node:stream';
import { validerOppgave } from '../../public/sjakk/oppgaver/valider.mjs';
import { TEMAER } from '../../public/sjakk/oppgaver/temaer.mjs';
import { BAND_MIN, BAND_MAX, bandFor } from '../../public/sjakk/oppgaver/utvalg.mjs';

const { values } = parseArgs({ options: { input: { type: 'string' }, out: { type: 'string' }, 'per-band': { type: 'string', default: '2000' } } });
if (!values.input || !values.out) throw new Error('Bruk: --input <fil.csv.zst> --out <mappe>');
const PER_BAND = Number(values['per-band']);
if (!Number.isInteger(PER_BAND) || PER_BAND < 1 || PER_BAND > 10000) throw new Error('--per-band må være 1–10000');

// Strict first; the loose tier only fills bands that lack well-tested puzzles.
const TIERS = [
  { rd: 75, popularity: 90, plays: 2000 },
  { rd: 80, popularity: 85, plays: 1000 },
  { rd: 95, popularity: 70, plays: 300 },
];
const MAX_RATING = 3200;
const FEN = /^[1-8pnbrqkPNBRQK/]{15,71} [wb] (-|[KQkq]{1,4}) (-|[a-h][36]) \d{1,3} \d{1,4}$/;
const ID = /^[0-9A-Za-z]{5,8}$/;

function hash(text) {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) { h ^= text.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}

const buckets = new Map();
const seen = { rows: 0, malformed: 0, passed: 0 };
function keep(band, tier, row) {
  const key = `${band}:${tier}`;
  const list = buckets.get(key) ?? [];
  list.push(row);
  // Keep the lowest hashes: a stable pseudo-random sample that fits in memory.
  if (list.length > PER_BAND * 4) { list.sort((a, b) => a.h - b.h); list.length = Math.ceil(PER_BAND * 1.3); }
  buckets.set(key, list);
}

// Lichess writes the file with pzstd: skippable frames between the data frames, which
// node:zlib does not accept. Walk the frame headers and stream only the data frames.
async function dataFrames(file) {
  const handle = await open(file);
  const ranges = [];
  try {
    const { size } = await handle.stat();
    const b = Buffer.alloc(18);
    const read = async (n, at) => { const { bytesRead } = await handle.read(b, 0, n, at); if (bytesRead < n) throw new Error('Avkuttet zstd-fil'); return b; };
    let at = 0;
    while (at < size) {
      const magic = (await read(4, at)).readUInt32LE(0);
      if ((magic & 0xfffffff0) === 0x184d2a50) { at += 8 + (await read(8, at)).readUInt32LE(4); continue; }
      if (magic !== 0xfd2fb528) throw new Error(`Ukjent zstd-ramme ved ${at}`);
      const fhd = (await read(5, at))[4];
      const fcsFlag = fhd >> 6, single = (fhd >> 5) & 1, checksum = (fhd >> 2) & 1, dictFlag = fhd & 3;
      let pos = at + 5 + (single ? 0 : 1) + [0, 1, 2, 4][dictFlag] + [single ? 1 : 0, 2, 4, 8][fcsFlag];
      for (;;) {
        const h = await read(3, pos);
        const header = h[0] | (h[1] << 8) | (h[2] << 16);
        const type = (header >> 1) & 3, blockSize = header >> 3;
        if (type === 3) throw new Error('Ugyldig zstd-blokk');
        pos += 3 + (type === 1 ? 1 : blockSize);
        if (header & 1) break;
      }
      pos += checksum ? 4 : 0;
      ranges.push([at, pos - 1]);
      at = pos;
    }
  } finally { await handle.close(); }
  return Readable.from((async function* () {
    for (const [start, end] of ranges) yield* createReadStream(file, { start, end });
  })());
}
const input = (await dataFrames(path.resolve(values.input))).pipe(zlib.createZstdDecompress());
const lines = readline.createInterface({ input, crlfDelay: Infinity });
let header = null;
for await (const line of lines) {
  if (!header) { header = line.split(','); continue; }
  seen.rows++;
  const f = line.split(',');
  if (f.length !== header.length) { seen.malformed++; continue; }
  const [id, fen, moves, rating, rd, popularity, plays, themes] = f;
  const r = Number(rating), d = Number(rd), p = Number(popularity), n = Number(plays);
  if (!ID.test(id) || !FEN.test(fen) || ![r, d, p, n].every(Number.isFinite) || moves.length > 200 || themes.length > 400) { seen.malformed++; continue; }
  if (r > MAX_RATING) continue;
  const tier = TIERS.findIndex(t => d <= t.rd && p >= t.popularity && n >= t.plays);
  if (tier < 0) continue;
  seen.passed++;
  const kept = themes.split(' ').filter(t => Object.hasOwn(TEMAER, t));
  keep(bandFor(r), tier, { id, fen, moves: moves.split(' '), rating: Math.round(r), rd: Math.round(d), themes: kept, h: hash(id) });
}

const outDir = path.resolve(values.out);
await mkdir(outDir, { recursive: true });
for (const name of await readdir(outDir)) if (/^b\d{3,4}\.json$|^indeks\.json$/.test(name)) await rm(path.join(outDir, name));

const indeks = { versjon: 1, kilde: 'https://database.lichess.org/#puzzles', lisens: 'CC0', bygget: new Date().toISOString().slice(0, 10), band: {}, temaer: {} };
const rejected = {};
let total = 0;
for (let band = BAND_MIN; band <= BAND_MAX; band += 100) {
  const chosen = [];
  const fromTier = [];
  for (let tier = 0; tier < TIERS.length && chosen.length < PER_BAND; tier++) {
    const list = (buckets.get(`${band}:${tier}`) ?? []).sort((a, b) => a.h - b.h);
    for (const row of list) {
      if (chosen.length >= PER_BAND) break;
      const check = validerOppgave(row);
      if (!check.ok) { rejected[check.grunn] = (rejected[check.grunn] ?? 0) + 1; continue; }
      chosen.push(row);
    }
    fromTier.push(chosen.length - fromTier.reduce((a, b) => a + b, 0));
  }
  chosen.sort((a, b) => a.rating - b.rating || a.id.localeCompare(b.id));
  const rows = chosen.map(o => [o.id, o.fen, o.moves.join(' '), o.rating, o.rd, o.themes.join(' ')]);
  await writeFile(path.join(outDir, `b${band}.json`), JSON.stringify(rows));
  indeks.band[band] = rows.length;
  for (const o of chosen) for (const t of o.themes) (indeks.temaer[t] ??= {})[band] = (indeks.temaer[t][band] ?? 0) + 1;
  total += rows.length;
  console.log(`${band}: ${rows.length} (per nivå: ${fromTier.join('/')})`);
}
await writeFile(path.join(outDir, 'indeks.json'), JSON.stringify(indeks));
console.log({ ...seen, total, rejected });

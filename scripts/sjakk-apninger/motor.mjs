// Minimal UCI driver for a Stockfish build that runs as `node <engine.js>` (npm "stockfish") or a native binary.
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import path from 'node:path';

export const MATT = 100000;

export function finnMotor(argv = process.argv) {
  const flagg = argv.indexOf('--motor');
  const kandidat = flagg >= 0 ? argv[flagg + 1] : process.env.SJAKK_MOTOR;
  if (!kandidat) throw new Error('Oppgi motoren med --motor <sti> eller SJAKK_MOTOR (npm-pakken «stockfish» installert utenfor repoet, f.eks. bin/stockfish-19.js).');
  if (!existsSync(kandidat)) throw new Error(`Finner ikke motoren: ${kandidat}`);
  return path.resolve(kandidat);
}

export async function startMotor(fil, { threads = 4, hash = 256 } = {}) {
  const js = fil.endsWith('.js');
  const prosess = spawn(js ? process.execPath : fil, js ? [fil] : [], { stdio: ['pipe', 'pipe', 'inherit'] });
  let buffer = '';
  let lytter = null;
  prosess.stdout.on('data', chunk => {
    buffer += chunk;
    let i;
    while ((i = buffer.indexOf('\n')) >= 0) {
      const linje = buffer.slice(0, i).trim();
      buffer = buffer.slice(i + 1);
      lytter?.(linje);
    }
  });
  const send = kommando => prosess.stdin.write(`${kommando}\n`);
  const vent = (test, samle) => new Promise(resolve => { lytter = linje => { samle?.(linje); if (test(linje)) { lytter = null; resolve(linje); } }; });
  let navn = 'ukjent motor';
  send('uci');
  await vent(l => l === 'uciok', l => { if (l.startsWith('id name ')) navn = l.slice(8); });
  send(`setoption name Threads value ${threads}`);
  send(`setoption name Hash value ${hash}`);
  send('isready');
  await vent(l => l === 'readyok');

  // Score is from the side to move's point of view, in centipawns (mate mapped to ±MATT).
  async function analyser(fen, { dybde = 16, trekk = null, multipv = 1 } = {}) {
    send(`setoption name MultiPV value ${multipv}`);
    send(`position fen ${fen}`);
    const linjer = new Map();
    send(`go depth ${dybde}${trekk ? ` searchmoves ${trekk}` : ''}`);
    const slutt = await vent(l => l.startsWith('bestmove'), l => {
      const m = l.match(/^info .*?depth (\d+) .*?multipv (\d+) .*?score (cp|mate) (-?\d+)(?: (?:lower|upper)bound)? .*? pv (.+)$/);
      if (!m) return;
      const verdi = m[3] === 'cp' ? Number(m[4]) : Math.sign(Number(m[4]) || -1) * (MATT - Math.abs(Number(m[4])) * 100);
      linjer.set(Number(m[2]), { dybde: Number(m[1]), score: verdi, matt: m[3] === 'mate' ? Number(m[4]) : null, pv: m[5].split(' ') });
    });
    const best = slutt.split(' ')[1];
    return { best, linjer: [...linjer.entries()].sort((a, b) => a[0] - b[0]).map(([, v]) => v) };
  }

  return { navn, analyser, avslutt: () => { send('quit'); setTimeout(() => prosess.kill(), 500); } };
}

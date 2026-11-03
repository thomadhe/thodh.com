// Prints the engine's top moves for one or more SAN paths, for authoring opening data.
// node scripts/sjakk-apninger/utforsk.mjs --motor <engine> [--dybde 16] [--multipv 3] "e4 e5 f4" "e4 c5 d4"
import { Chess } from '../../public/sjakk/vendor/chess.mjs';
import { spill, deltSti } from '../../public/sjakk/apninger/modell.mjs';
import { finnMotor, startMotor, MATT } from './motor.mjs';

const args = process.argv.slice(2);
const verdi = (navn, standard) => { const i = args.indexOf(navn); return i >= 0 ? Number(args[i + 1]) : standard; };
const stier = args.filter((a, i) => !a.startsWith('--') && !['--motor', '--dybde', '--multipv'].includes(args[i - 1]));
const motor = await startMotor(finnMotor(), { threads: 6 });
const vis = (score, hvit) => { const s = hvit ? score : -score; return Math.abs(s) > MATT - 10000 ? `${s > 0 ? '+' : '-'}M${Math.round((MATT - Math.abs(s)) / 100)}` : (s / 100).toFixed(2); };
for (const sti of stier) {
  let chess;
  try { ({ chess } = spill(deltSti(sti))); } catch (error) { console.log(`${sti}\n  ${error.message}`); continue; }
  const fen = chess.fen();
  const resultat = await motor.analyser(fen, { dybde: verdi('--dybde', 16), multipv: verdi('--multipv', 3) });
  const hvit = fen.split(' ')[1] === 'w';
  const linjer = resultat.linjer.map(l => {
    const c = new Chess(fen);
    const san = l.pv.slice(0, 6).map(uci => c.move({ from: uci.slice(0, 2), to: uci.slice(2, 4), promotion: uci[4] })?.san).join(' ');
    return `  ${vis(l.score, hvit).padStart(6)}  ${san}`;
  });
  console.log(`${sti}\n${linjer.join('\n')}`);
}
motor.avslutt();

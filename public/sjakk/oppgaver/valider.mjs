// Checks a Lichess puzzle with chess.js: the FEN is the position before the opponent's
// move, the first move is the opponent's, then the solver and the opponent alternate,
// and the solver plays the last move.
import { Chess } from '../vendor/chess.mjs';

const UCI = /^[a-h][1-8][a-h][1-8][qrbn]?$/;

export const tilTrekk = uci => ({ from: uci.slice(0, 2), to: uci.slice(2, 4), ...(uci[4] ? { promotion: uci[4] } : {}) });

export function validerOppgave({ fen, moves, themes = [] }) {
  if (!Array.isArray(moves) || moves.length < 2) return { ok: false, grunn: 'for få trekk' };
  if (moves.length % 2) return { ok: false, grunn: 'løseren gjør ikke siste trekk' };
  let chess;
  try { chess = new Chess(fen); } catch { return { ok: false, grunn: 'ugyldig FEN' }; }
  for (const [i, uci] of moves.entries()) {
    if (!UCI.test(uci)) return { ok: false, grunn: `ugyldig trekk ${uci}` };
    if (chess.isGameOver()) return { ok: false, grunn: `partiet er slutt før trekk ${i + 1}` };
    try { chess.move(tilTrekk(uci)); } catch { return { ok: false, grunn: `ulovlig trekk ${uci}` }; }
  }
  const matt = themes.find(t => /^mate(In\d)?$/.test(t));
  if (matt && !chess.isCheckmate()) return { ok: false, grunn: 'siste trekk er ikke matt' };
  const iN = themes.map(t => t.match(/^mateIn(\d)$/)).find(Boolean);
  // Lichess tags five moves or more as mateIn5.
  if (iN && (iN[1] === '5' ? moves.length / 2 < 5 : Number(iN[1]) !== moves.length / 2)) return { ok: false, grunn: 'feil antall trekk til matt' };
  return { ok: true, fen: chess.fen() };
}

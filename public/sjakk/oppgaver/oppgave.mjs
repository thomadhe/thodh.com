// One puzzle being solved: the opponent's first move, then the solver's moves are checked
// against the Lichess solution. Like Lichess, any move that gives mate also solves it.
import { Chess } from '../vendor/chess.mjs';
import { tilTrekk } from './valider.mjs';

export const uciFor = ({ from, to, promotion }) => `${from}${to}${promotion ?? ''}`;

export class Losning {
  constructor(oppgave) {
    this.oppgave = oppgave;
    // Every position along the solution, so it can be replayed and stepped through.
    this.stillinger = [{ fen: oppgave.fen, siste: null, san: null }];
    const c = new Chess(oppgave.fen);
    for (const uci of oppgave.moves) {
      const m = c.move(tilTrekk(uci));
      this.stillinger.push({ fen: c.fen(), siste: { from: m.from, to: m.to }, san: m.san });
    }
    this.farge = new Chess(this.stillinger[1].fen).turn();
    this.start();
  }

  /** Back to the position before the opponent's first move. */
  start() { this.ply = 0; this.chess = new Chess(this.oppgave.fen); this.ferdig = false; }

  get siste() { return this.stillinger[this.ply].siste; }
  get antallTrekk() { return this.oppgave.moves.length / 2; }
  get neste() { return this.oppgave.moves[this.ply]; }
  get spillerTur() { return !this.ferdig && this.ply % 2 === 1; }

  /** Plays the opponent's move (the first move, or the reply after a correct move). */
  motstander() {
    const m = this.chess.move(tilTrekk(this.oppgave.moves[this.ply]));
    this.ply++;
    return m;
  }

  /** Checks the solver's move: 'riktig' (reply follows), 'løst', 'feil' or null if illegal. */
  prov(trekk) {
    if (!this.spillerTur) return null;
    const prove = new Chess(this.chess.fen());
    let m;
    try { m = prove.move(trekk); } catch { return null; }
    if (uciFor(trekk) !== this.neste && !prove.isCheckmate()) return { resultat: 'feil', trekk: m };
    this.chess = prove;
    this.ply++;
    if (this.ply >= this.oppgave.moves.length || prove.isCheckmate()) { this.ferdig = true; return { resultat: 'løst', trekk: m }; }
    return { resultat: 'riktig', trekk: m };
  }

  /** The square of the piece to move next, for the hint. */
  get hintFelt() { return this.spillerTur ? this.neste.slice(0, 2) : null; }

  /** Jumps to a position on the solution line (for "Vis løsning"). */
  ga(ply) {
    this.ply = Math.max(0, Math.min(this.oppgave.moves.length, ply));
    this.chess = new Chess(this.stillinger[this.ply].fen);
    this.ferdig = this.ply >= this.oppgave.moves.length;
  }
}

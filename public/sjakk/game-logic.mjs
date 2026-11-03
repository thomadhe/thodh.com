export const pieceNames = { p: 'bonde', n: 'springer', b: 'løper', r: 'tårn', q: 'dronning', k: 'konge' };
export const colorName = color => color === 'w' ? 'Hvit' : 'Svart';

export function outcome(game) {
  if (game.isCheckmate()) return { kind: 'win', title: 'Massasjetid', description: `${colorName(game.turn() === 'w' ? 'b' : 'w')} vant! Tid for massasje.`, icon: '♔' };
  if (!game.isGameOver()) return null;
  let reason = 'Partiet endte uavgjort.';
  if (game.isStalemate()) reason = 'Ingen lovlige trekk, og kongen er ikke i sjakk.';
  else if (game.isInsufficientMaterial()) reason = 'Det er for få brikker igjen til at noen kan vinne.';
  else if (game.isThreefoldRepetition()) reason = 'Samme stilling har oppstått tre ganger.';
  else if (game.isDrawByFiftyMoves()) reason = '50 trekk fra hver spiller uten bondetrekk eller en slått brikke.';
  return { kind: 'draw', title: 'Uavgjort', description: reason, icon: '½' };
}

export function noticesAfterMove(game, move) {
  const notices = [];
  if (move.captured) {
    const name = pieceNames[move.captured];
    notices.push({ kind: 'capture', title: 'Ta av ett plagg! 😈', description: `${colorName(move.color === 'w' ? 'b' : 'w')} mistet ${move.captured === 'r' ? 'et' : 'en'} ${name}.`, icon: '😈' });
  }
  const result = outcome(game);
  if (result) notices.push(result);
  return notices;
}

const files = 'abcdefgh';
const at = (file, rank) => file >= 0 && file < 8 && rank >= 0 && rank < 8 ? `${files[file]}${rank + 1}` : null;

/** Premove destinations as on Lichess: how the piece moves on an open board, ignoring blockers. */
export function premoveTargets(pieceAt, square, color) {
  const piece = pieceAt(square);
  if (!piece || piece.color !== color) return [];
  const file = files.indexOf(square[0]), rank = Number(square[1]) - 1;
  const targets = [];
  const add = (f, r) => { const target = at(f, r); if (target) targets.push(target); };
  const rays = { b: [[1, 1], [1, -1], [-1, 1], [-1, -1]], r: [[1, 0], [-1, 0], [0, 1], [0, -1]] };
  rays.q = [...rays.b, ...rays.r];
  if (rays[piece.type]) for (const [df, dr] of rays[piece.type]) for (let i = 1; i < 8; i++) add(file + df * i, rank + dr * i);
  if (piece.type === 'n') for (const [df, dr] of [[1, 2], [2, 1], [2, -1], [1, -2], [-1, -2], [-2, -1], [-2, 1], [-1, 2]]) add(file + df, rank + dr);
  if (piece.type === 'k') {
    for (const df of [-1, 0, 1]) for (const dr of [-1, 0, 1]) if (df || dr) add(file + df, rank + dr);
    const home = color === 'w' ? 0 : 7;
    if (rank === home && file === 4) for (const [rookFile, target] of [[7, 6], [0, 2]]) {
      const rook = pieceAt(at(rookFile, home));
      if (rook?.type === 'r' && rook.color === color) add(target, home);
    }
  }
  if (piece.type === 'p') {
    const step = color === 'w' ? 1 : -1;
    add(file, rank + step);
    if (rank === (color === 'w' ? 1 : 6)) add(file, rank + 2 * step);
    add(file - 1, rank + step); add(file + 1, rank + step);
  }
  return targets;
}

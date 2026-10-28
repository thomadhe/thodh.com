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

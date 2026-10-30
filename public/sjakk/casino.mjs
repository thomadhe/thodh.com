// Casinosjakk: each turn three reels spin a piece type each (equal odds), and the player moves one piece
// of every type that came up – up to three moves per turn. There are no check rules: you may stand in
// check, and whoever captures the king wins. Castling is a king move (needs a king on the reels, an
// unmoved king and rook and empty squares between). No en passant; pawns promote as usual.

export const TYPER = ['p', 'n', 'b', 'r', 'q', 'k'];
const FILER = 'abcdefgh';

const felt = (fil, rad) => `${FILER[fil]}${rad + 1}`;
const posisjon = rute => [FILER.indexOf(rute[0]), Number(rute[1]) - 1];

/** Pieces from the placement part of a FEN: { e1: { type: 'k', color: 'w' }, ... }. */
export function lesFen(fen) {
  const brett = {};
  fen.split(' ')[0].split('/').forEach((rad, i) => {
    let fil = 0;
    for (const tegn of rad) {
      if (/\d/.test(tegn)) fil += Number(tegn);
      else brett[felt(fil++, 7 - i)] = { type: tegn.toLowerCase(), color: tegn === tegn.toLowerCase() ? 'b' : 'w' };
    }
  });
  return brett;
}

/** Castling rights from a FEN, e.g. 'KQkq' → Set { 'K', 'Q', 'k', 'q' }. */
export function lesRokade(fen) {
  const felt = fen.split(' ')[2] ?? '-';
  return new Set(felt === '-' ? [] : [...felt]);
}

export function skrivFen(brett, tur, rokade = new Set()) {
  const rader = [];
  for (let rad = 7; rad >= 0; rad--) {
    let tekst = '';
    let tomme = 0;
    for (let fil = 0; fil < 8; fil++) {
      const brikke = brett[felt(fil, rad)];
      if (!brikke) { tomme++; continue; }
      if (tomme) { tekst += tomme; tomme = 0; }
      tekst += brikke.color === 'w' ? brikke.type.toUpperCase() : brikke.type;
    }
    rader.push(tekst + (tomme || ''));
  }
  const rettigheter = ['K', 'Q', 'k', 'q'].filter(r => rokade.has(r)).join('') || '-';
  return `${rader.join('/')} ${tur} ${rettigheter} - 0 1`;
}

const RETNINGER = {
  n: [[1, 2], [2, 1], [2, -1], [1, -2], [-1, -2], [-2, -1], [-2, 1], [-1, 2]],
  b: [[1, 1], [1, -1], [-1, 1], [-1, -1]],
  r: [[1, 0], [-1, 0], [0, 1], [0, -1]],
};
RETNINGER.q = [...RETNINGER.b, ...RETNINGER.r];
RETNINGER.k = RETNINGER.q;
const GLIDER = new Set(['b', 'r', 'q']);

/** Every move the piece on `fra` can make, ignoring check. Captures may take the king. */
export function trekkFor(brett, fra, rokade = new Set()) {
  const brikke = brett[fra];
  if (!brikke) return [];
  const [fil, rad] = posisjon(fra);
  const trekk = [];
  const inni = (f, r) => f >= 0 && f < 8 && r >= 0 && r < 8;
  const legg = (f, r) => {
    const til = felt(f, r);
    const der = brett[til];
    if (der?.color === brikke.color) return false;
    const siste = brikke.type === 'p' && (r === 7 || r === 0);
    trekk.push({ from: fra, to: til, piece: brikke.type, color: brikke.color, ...(der ? { captured: der.type } : {}), ...(siste ? { promotion: 'q' } : {}) });
    return !der;
  };
  if (brikke.type === 'p') {
    const fram = brikke.color === 'w' ? 1 : -1;
    const start = brikke.color === 'w' ? 1 : 6;
    if (inni(fil, rad + fram) && !brett[felt(fil, rad + fram)]) {
      legg(fil, rad + fram);
      if (rad === start && !brett[felt(fil, rad + 2 * fram)]) legg(fil, rad + 2 * fram);
    }
    for (const side of [-1, 1]) {
      const mal = inni(fil + side, rad + fram) && brett[felt(fil + side, rad + fram)];
      if (mal && mal.color !== brikke.color) legg(fil + side, rad + fram);
    }
    return trekk;
  }
  if (brikke.type === 'k') {
    // Castling: the king jumps two squares and the rook lands on the other side of it.
    const hvit = brikke.color === 'w';
    const rad1 = hvit ? '1' : '8';
    if (fra === `e${rad1}`) {
      for (const [rett, rute, tomme] of [[hvit ? 'K' : 'k', 'h', 'fg'], [hvit ? 'Q' : 'q', 'a', 'bcd']]) {
        const taarn = brett[`${rute}${rad1}`];
        if (rokade.has(rett) && taarn?.type === 'r' && taarn.color === brikke.color && [...tomme].every(f => !brett[`${f}${rad1}`])) {
          trekk.push({ from: fra, to: `${rute === 'h' ? 'g' : 'c'}${rad1}`, piece: 'k', color: brikke.color, castle: rett.toUpperCase() });
        }
      }
    }
  }
  for (const [df, dr] of RETNINGER[brikke.type]) {
    let f = fil + df;
    let r = rad + dr;
    while (inni(f, r)) {
      if (!legg(f, r) || !GLIDER.has(brikke.type)) break;
      f += df;
      r += dr;
    }
  }
  return trekk;
}

/** Whether `farge` has any piece of `type` that can move. */
export function kanFlytte(brett, farge, type, rokade) {
  return Object.entries(brett).some(([rute, b]) => b.color === farge && b.type === type && trekkFor(brett, rute, rokade).length > 0);
}

/** Three reels, every piece type equally likely. */
export function spinn(tilfeldig = Math.random) {
  return Array.from({ length: 3 }, () => TYPER[Math.floor(tilfeldig() * TYPER.length)]);
}

/** Moves the piece and returns the new board (input untouched). */
export function utfor(brett, trekk, forvandling = 'q') {
  const nytt = { ...brett };
  const brikke = nytt[trekk.from];
  delete nytt[trekk.from];
  nytt[trekk.to] = trekk.promotion ? { type: forvandling, color: brikke.color } : brikke;
  if (trekk.castle) {
    const rad = trekk.to[1];
    const [fraT, tilT] = trekk.castle === 'K' ? [`h${rad}`, `f${rad}`] : [`a${rad}`, `d${rad}`];
    nytt[tilT] = nytt[fraT];
    delete nytt[fraT];
  }
  return nytt;
}

/** Castling rights after a move: moving the king or a rook, or taking a rook at home, ends them. */
export function nyRokade(rokade, trekk) {
  const igjen = new Set(rokade);
  const tap = { e1: 'KQ', h1: 'K', a1: 'Q', e8: 'kq', h8: 'k', a8: 'q' };
  for (const rute of [trekk.from, trekk.to]) for (const r of tap[rute] ?? '') igjen.delete(r);
  return igjen;
}

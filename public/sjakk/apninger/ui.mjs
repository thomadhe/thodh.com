// Small building blocks shared by the views.
import { Chess } from '../vendor/chess.mjs';
import { trekkNummer } from './modell.mjs';
import { AVATAR, norsk } from './trener.mjs';

export const FARGE = { w: 'Hvit', b: 'Svart' };
export const NIVA = { lett: 'Lett', middels: 'Middels', vanskelig: 'Krevende' };
export const flertall = (n, en, flere) => `${n} ${n === 1 ? en : flere}`;

export function startNotasjon(apning) {
  const chess = new Chess();
  return apning.startTrekk.map(san => { const nr = trekkNummer(chess.fen()); const m = chess.move(san); return (m.color === 'w' ? nr : '') + norsk(m.san); }).join(' ');
}
export const stiTekst = noder => noder.map((n, i) => (n.farge === 'w' || i === 0 ? n.nummer : '') + norsk(n.san)).join(' ');
// SAN moves from the initial position as "1.e4 e5 2.Sf3".
export const sanTekst = sans => sans.map((san, i) => (i % 2 ? '' : `${i / 2 + 1}.`) + norsk(san)).join(' ');

export const trenerBoble = (innhold, { stemning = '', live = true } = {}) => `<div class="ap-boble ${stemning}"><span class="ap-avatar">${AVATAR}</span><div class="ap-boble-tekst" ${live ? 'aria-live="polite"' : ''}>${innhold}</div></div>`;
export const skarphet = apning => `<span class="ap-skarphet" aria-label="Skarphet ${apning.skarphet} av 5">${'<i class="på"></i>'.repeat(apning.skarphet)}${'<i></i>'.repeat(5 - apning.skarphet)}</span>`;

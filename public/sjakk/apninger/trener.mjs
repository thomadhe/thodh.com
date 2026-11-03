// The coach: Norwegian move notation and the texts Tora says.
export const TRENER = { navn: 'Tora', rolle: 'åpningstreneren din' };

export const AVATAR = `<svg viewBox="0 0 64 64" aria-hidden="true" focusable="false"><circle cx="32" cy="32" r="31" fill="#4b2a3b" stroke="#e8a4bc" stroke-width="2"/><path d="M14 30c0-12 8-20 18-20s18 8 18 20c0 3-1 5-2 7-2-9-7-14-16-14s-14 5-16 14c-1-2-2-4-2-7z" fill="#2b1c2d"/><circle cx="32" cy="10" r="6" fill="#2b1c2d"/><ellipse cx="32" cy="35" rx="13" ry="14" fill="#f2d3c4"/><path d="M19 32c2-8 7-11 13-11s11 3 13 11c-4-4-8-6-13-6s-9 2-13 6z" fill="#2b1c2d"/><circle cx="27" cy="35" r="1.8" fill="#2b1c2d"/><circle cx="37" cy="35" r="1.8" fill="#2b1c2d"/><path d="M27 42c3 3 7 3 10 0" stroke="#b7557c" stroke-width="2" fill="none" stroke-linecap="round"/><circle cx="23" cy="40" r="2.5" fill="#e8a4bc" opacity=".5"/><circle cx="41" cy="40" r="2.5" fill="#e8a4bc" opacity=".5"/><path d="M14 64c2-9 9-14 18-14s16 5 18 14z" fill="#b7557c"/><text x="45" y="60" font-size="13" fill="#fff7e9" font-family="Georgia, serif">♞</text></svg>`;

const BRIKKE = { N: 'S', B: 'L', R: 'T', Q: 'D', K: 'K' };
export function norsk(san) {
  if (!san) return '';
  return san.replace(/^O-O-O/, '0-0-0').replace(/^O-O/, '0-0').replace(/^[NBRQK]/, b => BRIKKE[b]).replace(/=([NBRQ])/, (_, b) => `=${BRIKKE[b]}`);
}
export const medNummer = node => `${node.nummer}${norsk(node.san)}`;

// Moves and squares (d4, exd5, Sf3) keep their case at the start of a sentence.
const TREKK = /^([KDTLS]?[a-h]?x?[a-h][1-8]|0-0)/;
export const stor = tekst => (tekst && !TREKK.test(tekst) ? tekst[0].toUpperCase() + tekst.slice(1) : tekst ?? '');
const esc = tekst => String(tekst).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
export { esc };

export function motorTekst(motor, farge) {
  if (!motor || typeof motor.cp !== 'number') return '';
  const cp = motor.cp;
  const tall = Math.abs(cp) >= 9000 ? (cp > 0 ? 'matt for hvit' : 'matt for svart') : `${cp > 0 ? '+' : cp < 0 ? '−' : '±'}${(Math.abs(cp) / 100).toFixed(1).replace('.', ',')}`;
  const forDeg = farge === 'w' ? cp : -cp;
  const dom = Math.abs(cp) < 35 ? 'omtrent likt' : forDeg > 0 ? (Math.abs(cp) < 90 ? 'litt bedre for deg' : 'klart bedre for deg') : (Math.abs(cp) < 90 ? 'litt bedre for motstanderen' : 'klart bedre for motstanderen');
  let tekst = `Motoren (dybde ${motor.dybde}): ${tall} – ${dom}.`;
  if (motor.tap >= 60 && motor.best) tekst += ` Motoren foretrekker ${norsk(motor.best)} (ca. ${(motor.tap / 100).toFixed(1).replace('.', ',')} bonde bedre).`;
  return tekst;
}

// Explanation card for a move in the tree.
export function forklaring(node, farge) {
  const e = node.entry;
  const deler = [`<p class="ap-sier"><strong>${esc(medNummer(node))}</strong> ${esc(e.hva)}</p>`];
  if (e.ide) deler.push(`<p><span class="ap-etikett">Idé</span>${esc(stor(e.ide))}</p>`);
  if (e.pass) deler.push(`<p><span class="ap-etikett fare">Pass på</span>${esc(stor(e.pass))}</p>`);
  if (e.vurdering) deler.push(`<p><span class="ap-etikett ærlig">Ærlig talt</span>${esc(e.vurdering)}</p>`);
  const motor = motorTekst(e.motor, farge);
  if (motor) deler.push(`<p class="ap-motor">${esc(motor)}</p>`);
  if (e.plan && !node.barn.length) deler.push(`<p><span class="ap-etikett plan">Planen videre</span>${esc(e.plan)}</p>`);
  return deler.join('');
}

const forsteLiten = tekst => (/^[A-ZÆØÅ][a-zæøå]/.test(tekst) && !TREKK.test(tekst) && !/^(Morphy|Fischer|Kasparov|Carlsen|Marshall|Capablanca|Spassky|Steinitz|Tal)\b/.test(tekst) ? tekst[0].toLowerCase() + tekst.slice(1) : tekst);

// "Du spilte …, men her vil vi …, fordi …"
export function feilKommentar(spilt, riktig) {
  const vanlig = riktig.entry.vanligeFeil?.[spilt];
  const deres = `${riktig.nummer}${norsk(spilt)}`;
  if (vanlig) return `Du spilte ${deres}. ${vanlig} Her vil vi spille ${norsk(riktig.san)}.`;
  return `Du spilte ${deres}, men her vil vi spille ${norsk(riktig.san)}, fordi ${forsteLiten(riktig.entry.ide)}`;
}

export const ROS = ['Riktig!', 'Akkurat.', 'Sånn ja!', 'Helt rett.', 'Nettopp.', 'Godt husket!'];
export const hilsen = timer => (timer < 10 ? 'God morgen' : timer < 18 ? 'Hei' : 'God kveld');

// What the home page says, worked out from the data the trainer and the puzzles save. Pure: nothing here touches the page.
import { Chess } from '../sjakk/vendor/chess.mjs';
import { kortStatus, medFarge } from '../sjakk/apninger/kort.mjs';
import { klareKort, nesteStegHtml } from '../sjakk/apninger/kort-okt.mjs';
import { byggAdresse, repertoarAdresse } from '../sjakk/apninger/repertoar.mjs';
import { FARGE, flertall, miniBrett } from '../sjakk/apninger/ui.mjs';
import { visRating } from '../sjakk/oppgaver/glicko.mjs';
import { PLASSERING, resultatTekst } from '../sjakk/oppgaver/lagring.mjs';
import { dagRekke, dagensOppgave, lesRad, nivaFor } from '../sjakk/oppgaver/utvalg.mjs';

export const APNINGER = '/sjakk-for-1/apninger';
export const OPPGAVER = '/sjakk-for-1/oppgaver';

// The trainer's addresses are hashes on its own page. From here they need the page as well.
export const tilTreneren = html => html.replaceAll('href="#/', `href="${APNINGER}#/`);

const stor = tekst => tekst[0].toUpperCase() + tekst.slice(1);

const rad = ({ adresse, merke = '', tittel, tekst, verdi = '', spor = null, klasse = '' }) => `<a class="en-rad ${klasse}" href="${adresse}">${merke}<span class="en-rad-tekst"><b>${tittel}</b><span>${tekst}</span>${spor === null ? '' : `<span class="ap-spor"><span style="width:${spor}%"></span></span>`}</span>${verdi ? `<span class="en-verdi">${verdi}</span>` : ''}<span class="en-pil" aria-hidden="true">›</span></a>`;

function fargeRad(ui, farge) {
  const merke = `<span class="ap-fane-merke ${farge}" aria-hidden="true"></span>`;
  const valgte = medFarge(ui.valgte(), farge);
  if (!valgte.length) return rad({ adresse: `${APNINGER}${byggAdresse(farge)}`, klasse: 'en-under', merke, tittel: FARGE[farge], tekst: 'Ikke satt opp ennå', verdi: 'Sett opp' });
  const { totalt, klare, laert } = kortStatus(medFarge(ui.kort(), farge), ui.fremgang(), klareKort(ui, farge));
  return rad({ adresse: `${APNINGER}${repertoarAdresse(farge)}`, klasse: 'en-under', merke, tittel: FARGE[farge], tekst: `${flertall(valgte.length, 'åpning', 'åpninger')} · ${laert} av ${flertall(totalt, 'kort', 'kort')} lært`, verdi: klare ? `${klare} klare` : '', spor: totalt ? Math.round(laert / totalt * 100) : 0 });
}

// antall is how many openings the library holds, once it is known.
export function apningerHtml(ui, { venter = false, antall = null } = {}) {
  const harValgt = ui.valgte().length > 0;
  return [
    rad({ adresse: `${APNINGER}${repertoarAdresse(null)}`, tittel: 'Mitt repertoar', tekst: 'Det du selv har valgt å spille' }),
    ...(venter ? ['<p class="en-henter" role="status">Henter repertoaret …</p>'] : ['w', 'b'].map(farge => fargeRad(ui, farge))),
    rad({ adresse: `${APNINGER}${byggAdresse(null)}`, tittel: 'Bygg repertoaret', tekst: harValgt ? 'Ta spørsmålene på nytt' : 'Noen korte spørsmål, ett om gangen' }),
    rad({ adresse: `${APNINGER}#/`, tittel: 'Alle åpninger', tekst: antall ? `Bla i alle ${antall}` : 'Bla i hele biblioteket' }),
  ].join('');
}

// Today's puzzle and rating as saved. Before the placement is done, the level is not known yet.
export function oppgaveOversikt(t, dato) {
  const dagens = t.dagens[dato] ?? null;
  return {
    plassering: !dagens && t.antall < PLASSERING,
    igjen: PLASSERING - t.antall,
    niva: dagens?.niva ?? nivaFor(t.spiller.rating),
    lost: dagens?.status === 'løst',
    status: dagens ? stor(resultatTekst(dagens)) : 'Ikke prøvd ennå',
    rekke: dagRekke(t.dagens, dato),
    rating: t.antall ? visRating(t.spiller) : null,
    antall: t.antall,
    losteAntall: t.losteAntall,
    rekord: t.lynlop.beste,
  };
}

// The same puzzle the puzzle page will show, whether it has been started or not.
export function finnDagens(t, dato, rader) {
  const lagret = t.dagens[dato];
  const treff = lagret && rader.find(r => r[0] === lagret.id);
  return treff ? lesRad(treff) : dagensOppgave(dato, lagret?.niva ?? nivaFor(t.spiller.rating), rader);
}

// A puzzle starts with the opponent's move, so the player's position is the one after it.
export function oppgaveStilling(oppgave) {
  const chess = new Chess(oppgave.fen);
  const [trekk] = oppgave.moves;
  chess.move({ from: trekk.slice(0, 2), to: trekk.slice(2, 4), promotion: trekk[4] });
  return { fen: chess.fen(), farge: chess.turn() };
}

function dagensHtml(o, stilling) {
  const brett = o.plassering ? miniBrett(new Chess().fen()) : stilling ? miniBrett(stilling.fen, stilling.farge) : '<span class="en-tomt-brett"></span>';
  const linjer = o.plassering
    ? `<span>Først finner vi nivået ditt.</span><span>${flertall(o.igjen, 'oppgave', 'oppgaver')} til, så er den klar.</span>`
    : `<span>Nivå ${o.niva - 100}–${o.niva + 100}${stilling ? ` · ${FARGE[stilling.farge]} i trekket` : ''}</span><span class="${o.lost ? 'en-lost' : ''}">${o.status}</span>${o.rekke ? `<span>🔥 ${flertall(o.rekke, 'dag', 'dager')} på rad</span>` : ''}`;
  return `<a class="en-dagens" href="${OPPGAVER}#dagens"><span class="en-brett">${brett}</span><span class="en-rad-tekst"><b>Dagens oppgave</b>${linjer}</span><span class="en-pil" aria-hidden="true">›</span></a>`;
}

export function oppgaverHtml(o, stilling = null) {
  return [
    dagensHtml(o, stilling),
    rad({ adresse: `${OPPGAVER}#rangert`, tittel: 'Rangert', tekst: o.antall ? `${o.losteAntall} av ${o.antall} løst` : 'Oppgaver som følger nivået ditt', verdi: o.rating ?? '' }),
    rad({ adresse: `${OPPGAVER}#lynlop`, tittel: 'Lynløp', tekst: 'Tre minutter, og tre feil er nok', verdi: o.rekord ? `Rekord ${o.rekord}` : '' }),
  ].join('');
}

// The one thing to do next is the trainer's own box, so the two can never disagree.
export const nesteHtml = ui => tilTreneren(nesteStegHtml(ui));

export const venterHtml = '<section class="ap-neste" aria-label="Neste steg"><div class="ap-neste-tekst"><p class="eyebrow">NESTE STEG</p><h2>Dagens økt</h2><p role="status">Henter kortene dine …</p></div></section>';
export const feilHtml = `<section class="ap-neste" aria-label="Neste steg"><div class="ap-neste-tekst"><p class="eyebrow">NESTE STEG</p><h2>Dagens økt</h2><p>Klarte ikke å hente kortene her. De ligger trygt i åpningene.</p></div><div class="ap-neste-knapper"><a class="button primary" href="${APNINGER}">Til åpningene ▶</a></div></section>`;

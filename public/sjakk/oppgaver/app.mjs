import { Chess } from '../vendor/chess.mjs';
import { lagBrett } from './brett.mjs';
import { Losning } from './oppgave.mjs';
import { les, lagre, registrer, markerSett, resultatTekst, PLASSERING } from './lagring.mjs';
import { VANSKELIGHET, malRating, bandNaer, bandFor, velgOppgave, lesRad, nivaFor, bandForNiva, dagensOppgave, iDagOslo, kortDato, dagRekke, leggTilDager } from './utvalg.mjs';
import { FORELOPIG_RD, visRating } from './glicko.mjs';
import { TEMAER, TEMAGRUPPER } from './temaer.mjs';
import { lyd, trekklyd, lydPa, settLyd } from './lyd.mjs';

const $ = s => document.querySelector(s);
const DATA = new URL('./data/', import.meta.url);
const LYNLOP_MS = 180_000;
const LYNLOP_FEIL = 3;
const FANER = ['dagens', 'rangert', 'lynlop'];
const vent = ms => new Promise(r => setTimeout(r, ms));
const esc = s => String(s).replace(/[&<>"']/g, c => `&#${c.charCodeAt(0)};`);
const fargenavn = c => (c === 'w' ? 'hvit' : 'svart');
const stor = s => s[0].toUpperCase() + s.slice(1);
const fortegn = n => (n > 0 ? `+${n}` : n < 0 ? `−${-n}` : '±0');

const t = les();
let fane = null;
let okt = null;
let indeks = null;
let lynlop = { status: 'klar' };
let delt = false;

// ---- Data: one JSON file per 100-point band, fetched when needed ----

const band = new Map();
function hentBand(b) {
  if (!band.has(b)) {
    band.set(b, fetch(new URL(`b${b}.json`, DATA)).then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
      .catch(feil => { band.delete(b); throw feil; }));
  }
  return band.get(b);
}
const hentBandene = async liste => (await Promise.all(liste.map(hentBand))).flat();

async function finnOppgave(id, b) {
  const rad = (await hentBand(b)).find(r => r[0] === id);
  return rad ? lesRad(rad) : null;
}

// ---- The board and one puzzle at a time ----

const brett = lagBrett($('#brett'), {
  kanFlytte: () => Boolean(okt?.losning?.spillerTur) && (okt.status === 'spiller' || okt.status === 'feil') && (okt.type !== 'lynlop' || lynlop.status === 'spiller'),
  vedTrekk,
});

function visStilling(ekstra = {}) {
  const L = okt.losning;
  brett.vis({ chess: L.chess, siste: L.siste, hint: null, markering: null, ...ekstra });
}

async function startOppgave(o, oppgave) {
  o.oppgave = oppgave;
  o.losning = new Losning(oppgave);
  Object.assign(o, { status: 'motstander', registrert: false, endring: null, hint: false, feil: 0, riktig: false, manuell: false });
  brett.vis({ chess: o.losning.chess, orientering: o.losning.farge, siste: null, hint: null, markering: null });
  vis();
  await spillForste(o);
}

// Each async sequence (opening move, reply, solution playback) carries a generation; a newer one
// or the end of a Lynløp makes older sequences stop after their next await.
const nyGenerasjon = o => (o.gen = (o.gen ?? 0) + 1)
const gjelder = (o, g) => okt === o && o.gen === g && (o.type !== 'lynlop' || lynlop.status === 'spiller')

/** Shows the starting position, then slides in the opponent's move so the player sees what happened. */
async function spillForste(o) {
  const L = o.losning;
  const g = nyGenerasjon(o);
  L.start();
  o.status = 'motstander';
  o.riktig = false;
  visStilling();
  vis();
  await vent(o.type === 'lynlop' ? 200 : 550);
  if (!gjelder(o, g)) return;
  await brett.animer(L.neste.slice(0, 2), L.neste.slice(2, 4));
  if (!gjelder(o, g)) return;
  const m = L.motstander();
  o.forste = m.san;
  o.svar = null;
  trekklyd(m, L.chess);
  o.status = 'spiller';
  visStilling();
  vis();
}

async function vedTrekk(trekk) {
  const o = okt;
  const L = o?.losning;
  const r = L?.prov(trekk);
  if (!r) return;
  if (r.resultat === 'feil') { feilTrekk(o, trekk); return; }
  trekklyd(r.trekk, L.chess);
  o.status = r.resultat === 'løst' ? 'løst' : 'motstander';
  o.riktig = true;
  visStilling({ markering: { felt: r.trekk.to, type: 'riktig' } });
  if (r.resultat === 'løst') { lost(o); return; }
  const g = o.gen;
  vis();
  await vent(o.type === 'lynlop' ? 150 : 380);
  if (!gjelder(o, g)) return;
  await brett.animer(L.neste.slice(0, 2), L.neste.slice(2, 4), 220);
  if (!gjelder(o, g)) return;
  const m = L.motstander();
  o.svar = m.san;
  trekklyd(m, L.chess);
  o.status = 'spiller';
  visStilling();
  vis();
}

async function feilTrekk(o, trekk) {
  const L = o.losning;
  lyd.feil();
  o.feil++;
  if (o.type === 'dagens') { const d = dagensData(); if (d.status === 'åpen') { d.forsok++; lagre(t); } }
  if (['rangert', 'plassering'].includes(o.type) && !o.registrert) registrerResultat(o, false);
  // Show the wrong move for a moment, then take it back.
  const vist = new Chess(L.chess.fen());
  vist.move(trekk);
  o.status = 'viser-feil';
  brett.vis({ chess: vist, siste: { from: trekk.from, to: trekk.to }, hint: null, markering: { felt: trekk.to, type: 'feil' } });
  if (o.type === 'lynlop') { lynlopFeil(o); return; }
  const g = o.gen;
  vis();
  await vent(850);
  if (!gjelder(o, g)) return;
  o.status = 'feil';
  visStilling();
  vis();
}

function lost(o) {
  lyd.lost();
  if (o.type === 'lynlop') { lynlopLost(o); return; }
  if (['rangert', 'plassering'].includes(o.type) && !o.registrert) registrerResultat(o, true);
  if (o.type === 'dagens') {
    const d = dagensData();
    if (d.status === 'åpen') { d.forsok++; d.status = 'løst'; lagre(t); }
  }
  vis();
}

function registrerResultat(o, lostOppgave) {
  o.endring = registrer(t, o.oppgave, { lost: lostOppgave, hint: o.hint });
  o.registrert = true;
  t.aktiv = null;
  lagre(t);
}

function brukHint() {
  const o = okt;
  if (!o?.losning.spillerTur || o.status !== 'spiller' && o.status !== 'feil') return;
  o.hint = true;
  if (o.type === 'dagens') { const d = dagensData(); if (d.status === 'åpen') { d.hint = true; lagre(t); } }
  brett.vis({ hint: o.losning.hintFelt });
  vis();
}

async function visLosning() {
  const o = okt;
  if (!o?.losning) return;
  if (['rangert', 'plassering'].includes(o.type) && !o.registrert) registrerResultat(o, false);
  if (o.type === 'dagens') { const d = dagensData(); if (d.status === 'åpen') { d.status = 'feilet'; lagre(t); } }
  const L = o.losning;
  const g = nyGenerasjon(o);
  o.status = 'løsning';
  if (L.ply === 0) L.ga(1);
  visStilling();
  vis();
  // Play the rest of the line once, slowly; the arrows step through it afterwards.
  while (L.ply < L.oppgave.moves.length) {
    await vent(700);
    if (!gjelder(o, g) || o.status !== 'løsning' || o.manuell) return;
    await brett.animer(L.neste.slice(0, 2), L.neste.slice(2, 4), 240);
    if (!gjelder(o, g) || o.status !== 'løsning' || o.manuell) return;
    trekklyd(L.motstander(), L.chess);
    visStilling();
    vis();
  }
}

function steg(ply) {
  const o = okt;
  if (o?.status !== 'løsning') return;
  o.manuell = true;
  o.losning.ga(ply);
  visStilling();
  vis();
}

function provIgjen() {
  const o = okt;
  if (!o?.losning) return;
  o.manuell = false;
  if (o.status === 'feil') { o.status = 'spiller'; vis(); brett.fokuser(); return; }
  spillForste(o);
}

// ---- Rated puzzles (and the placement before the first daily puzzle) ----

async function nesteRangert(type = 'rangert') {
  const o = { type, status: 'laster' };
  okt = o;
  vis();
  try {
    let oppgave = t.aktiv ? await finnOppgave(t.aktiv.id, t.aktiv.band) : null;
    if (!oppgave) {
      const mal = malRating(t.spiller.rating, type === 'plassering' ? 'normal' : t.vanskelighet);
      const tema = type === 'rangert' ? t.tema : '';
      const sett = new Set(t.sett);
      for (const antall of tema ? [2, 4, 8] : [2, 4]) {
        oppgave = velgOppgave(await hentBandene(bandNaer(mal, antall)), mal, { sett, tema });
        if (oppgave) break;
      }
      // Everything nearby has been seen (or the theme is rare): allow repeats, then any theme.
      const naer = await hentBandene(bandNaer(mal, 2));
      oppgave ??= velgOppgave(naer, mal, { tema }) ?? velgOppgave(naer, mal, { sett });
      if (!oppgave) throw new Error('Fant ingen oppgave');
      t.aktiv = { id: oppgave.id, band: bandFor(oppgave.rating) };
      lagre(t);
    }
    if (okt !== o) return;
    markerSett(t, oppgave.id);
    await startOppgave(o, oppgave);
  } catch {
    if (okt === o) { o.status = 'datafeil'; vis(); }
  }
}

// ---- Daily puzzle ----

const iDag = () => iDagOslo();
const dagensData = () => t.dagens[okt?.dato ?? iDag()];

async function startDagens() {
  const dato = iDag();
  let d = t.dagens[dato];
  if (!d && t.antall < PLASSERING) { nesteRangert('plassering'); return; }
  const o = { type: 'dagens', status: 'laster', dato };
  okt = o;
  delt = false;
  vis();
  try {
    let oppgave;
    if (d) {
      const rader = await hentBandene(bandForNiva(d.niva));
      const rad = rader.find(r => r[0] === d.id);
      oppgave = rad ? lesRad(rad) : dagensOppgave(dato, d.niva, rader);
      if (!rad && d.status === 'åpen') { d.id = oppgave.id; lagre(t); }
    } else {
      const niva = nivaFor(t.spiller.rating);
      oppgave = dagensOppgave(dato, niva, await hentBandene(bandForNiva(niva)));
      d = t.dagens[dato] = { id: oppgave.id, niva, forsok: 0, hint: false, status: 'åpen' };
      markerSett(t, oppgave.id);
      lagre(t);
    }
    if (okt !== o) return;
    if (d.status === 'åpen') { await startOppgave(o, oppgave); return; }
    // Already finished today: show the final position.
    o.oppgave = oppgave;
    o.losning = new Losning(oppgave);
    o.losning.ga(oppgave.moves.length);
    o.status = d.status === 'løst' ? 'løst' : 'løsning';
    o.manuell = true;
    brett.vis({ chess: o.losning.chess, orientering: o.losning.farge, siste: o.losning.siste, hint: null, markering: null });
    vis();
  } catch {
    if (okt === o) { o.status = 'datafeil'; vis(); }
  }
}

function delTekst(dato, d) {
  const rekke = dagRekke(t.dagens, dato);
  return [
    `Dagens sjakkoppgave · ${kortDato(dato)} · ${resultatTekst(d)} ${d.status === 'løst' ? '♞' : '♟'}`,
    `Nivå ${d.niva}${rekke > 1 ? ` · 🔥 ${rekke} dager på rad` : ''}`,
    'thodh.com/sjakk-for-1/oppgaver',
  ].join('\n');
}

async function del() {
  const d = dagensData();
  if (!d) return;
  const tekst = delTekst(okt.dato, d);
  try {
    if (navigator.share && matchMedia('(pointer: coarse)').matches) { await navigator.share({ text: tekst }); return; }
    await navigator.clipboard.writeText(tekst);
    delt = true;
    vis();
    setTimeout(() => { delt = false; vis(); }, 1800);
  } catch { /* The user dismissed the share sheet. */ }
}

// ---- Lynløp: three minutes, harder each puzzle, three mistakes and it ends ----

const lynlopMal = nr => Math.min(2950, 600 + nr * 55);

function startLynlop() {
  lynlop = { status: 'spiller', slutt: performance.now() + LYNLOP_MS, poeng: 0, feil: 0, nr: 0, brukt: new Set(), logg: [], nyRekord: false };
  lyd.riktig();
  nesteLynlop();
}

async function nesteLynlop() {
  if (lynlop.status !== 'spiller') return;
  const o = { type: 'lynlop', status: 'laster' };
  okt = o;
  const mal = lynlopMal(lynlop.nr);
  try {
    const oppgave = velgOppgave(await hentBandene(bandNaer(mal, 2)), mal, { sett: lynlop.brukt });
    hentBand(bandFor(mal + 150)).catch(() => {});
    if (okt !== o || lynlop.status !== 'spiller') return;
    lynlop.brukt.add(oppgave.id);
    lynlop.nr++;
    await startOppgave(o, oppgave);
  } catch {
    if (okt === o) { o.status = 'datafeil'; vis(); }
  }
}

async function lynlopLost(o) {
  if (lynlop.status !== 'spiller') return;
  lynlop.poeng++;
  lynlop.logg.push({ id: o.oppgave.id, rating: o.oppgave.rating, lost: true });
  vis();
  await vent(350);
  if (okt === o) nesteLynlop();
}

async function lynlopFeil(o) {
  if (lynlop.status !== 'spiller') return;
  const lop = lynlop;
  lynlop.feil++;
  lynlop.logg.push({ id: o.oppgave.id, rating: o.oppgave.rating, lost: false });
  vis();
  if (lynlop.feil >= LYNLOP_FEIL) { await vent(700); if (lynlop === lop && lynlop.status === 'spiller') avsluttLynlop('feil'); return; }
  await vent(650);
  if (okt === o && lynlop === lop) nesteLynlop();
}

function avsluttLynlop(grunn) {
  if (lynlop.status !== 'spiller') return;
  lynlop.status = 'ferdig';
  lynlop.grunn = grunn;
  t.lynlop.spilt++;
  if (lynlop.poeng > t.lynlop.beste) { t.lynlop.beste = lynlop.poeng; t.lynlop.besteDato = iDag(); lynlop.nyRekord = lynlop.poeng > 0; }
  lagre(t);
  if (okt?.losning) okt.status = 'ferdig';
  if (lynlop.nyRekord) lyd.lost();
  vis();
}

function lynlopTid() {
  return Math.max(0, lynlop.slutt - performance.now());
}

setInterval(() => {
  if (lynlop.status !== 'spiller') return;
  if (lynlopTid() <= 0) { avsluttLynlop('tid'); return; }
  visKlokke();
}, 100);

function visKlokke() {
  const el = $('#lynlop-klokke');
  el.hidden = fane !== 'lynlop' || lynlop.status !== 'spiller';
  if (el.hidden) return;
  const ms = lynlopTid();
  const s = Math.ceil(ms / 1000);
  el.innerHTML = `<span>${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}</span><small>${lynlop.poeng} løst${lynlop.feil ? ` · ${lynlop.feil} feil` : ''}</small>`;
  el.classList.toggle('urgent', ms <= 20_000);
}

// ---- Drawing the panel ----

function knapp(handling, tekst, { klasse = 'secondary', deaktivert = false, etikett } = {}) {
  return `<button type="button" class="button ${klasse}" data-handling="${handling}"${deaktivert ? ' disabled' : ''}${etikett ? ` aria-label="${esc(etikett)}"` : ''}>${tekst}</button>`;
}

function sparkline() {
  const punkter = [1500, ...t.historikk.map(h => h.r)].slice(-40);
  if (punkter.length < 3) return '<p class="liten">Kurven over ratingen din kommer etter noen oppgaver.</p>';
  const [b, h, p] = [240, 48, 4];
  const min = Math.min(...punkter), maks = Math.max(...punkter);
  const spenn = Math.max(20, maks - min);
  const xy = punkter.map((r, i) => [p + (i / (punkter.length - 1)) * (b - 2 * p), p + (1 - (r - min) / spenn) * (h - 2 * p)]);
  const [sx, sy] = xy.at(-1);
  return `<figure class="sparkline"><svg viewBox="0 0 ${b} ${h}" role="img" aria-label="Ratingutvikling for de siste ${punkter.length - 1} oppgavene: fra ${punkter[0]} til ${punkter.at(-1)}, lavest ${min}, høyest ${maks}."><polyline points="${xy.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ')}" /><circle cx="${sx.toFixed(1)}" cy="${sy.toFixed(1)}" r="3.5" /></svg><figcaption><span>Lavest ${min}</span><span>Høyest ${maks}</span></figcaption></figure>`;
}

function temaValg() {
  const totalt = tema => Object.values(indeks?.temaer?.[tema] ?? {}).reduce((a, b) => a + b, 0);
  const grupper = TEMAGRUPPER.map(([navn, temaer]) => {
    const synlige = temaer.filter(k => !indeks || totalt(k) >= 200);
    return synlige.length ? `<optgroup label="${navn}">${synlige.map(k => `<option value="${k}"${t.tema === k ? ' selected' : ''}>${TEMAER[k]}</option>`).join('')}</optgroup>` : '';
  }).join('');
  return `<label class="felt">Tema<select id="tema"><option value="">Blandet (alle temaer)</option>${grupper}</select></label>`;
}

function oppgaveInfo(o) {
  if (!o?.oppgave || !['løst', 'feil', 'løsning', 'ferdig'].includes(o.status)) return '';
  const temaer = o.oppgave.themes.filter(k => TEMAER[k] && !(k === 'mate' && o.oppgave.themes.some(m => m.startsWith('mateIn')))).map(k => (k === 'mate' ? 'Matt' : TEMAER[k]));
  return `<section class="kort oppgave-info"><h2>Om oppgaven</h2><p><strong>Rating ${o.oppgave.rating}</strong>${temaer.length ? ` · ${temaer.join(' · ')}` : ''}</p><a class="lenke" href="https://lichess.org/training/${esc(o.oppgave.id)}" target="_blank" rel="noopener">Se oppgave ${esc(o.oppgave.id)} på Lichess ↗</a></section>`;
}

function ratingKort(o) {
  const endring = o?.registrert && o.endring !== null ? `<span class="endring ${o.endring > 0 ? 'opp' : o.endring < 0 ? 'ned' : ''}">${fortegn(o.endring)}</span>` : '';
  const prosent = t.antall ? Math.round((t.losteAntall / t.antall) * 100) : 0;
  return `<section class="kort rating-kort" aria-label="Din oppgaverating"><div class="rating-topp"><div><p class="eyebrow">OPPGAVERATING</p><p class="rating-tall">${visRating(t.spiller)}${endring}</p></div><p class="liten rd">${t.spiller.rd > FORELOPIG_RD ? 'Foreløpig – blir sikrere for hver oppgave' : `± ${Math.round(t.spiller.rd * 2)}`}</p></div>${sparkline()}<dl class="tall-rad"><div><dt>Løst</dt><dd>${t.losteAntall} av ${t.antall}${t.antall ? ` <small>(${prosent} %)</small>` : ''}</dd></div><div><dt>Rekke</dt><dd>${t.rekke}</dd></div><div><dt>Beste rekke</dt><dd>${t.besteRekke}</dd></div></dl></section>`;
}

function panelRangert(o) {
  const mal = malRating(t.spiller.rating, t.vanskelighet);
  return `${ratingKort(o)}
    <section class="kort"><h2 id="vansk-tittel">Vanskelighet</h2><div class="segment" role="group" aria-labelledby="vansk-tittel">${VANSKELIGHET.map(v => `<button type="button" data-vanskelighet="${v.id}" aria-pressed="${t.vanskelighet === v.id}">${v.navn}${v.avvik ? `<small>${fortegn(v.avvik)}</small>` : ''}</button>`).join('')}</div><p class="liten">Oppgaver rundt ${mal} i rating.</p>${temaValg()}<p class="liten">💡 Hint viser hvilken brikke som skal flyttes. Løser du oppgaven med hint, får du halv ratinggevinst. Ett feil trekk teller som feil, men du kan prøve igjen uten rating.</p></section>
    ${oppgaveInfo(o)}`;
}

function sisteSyvDager(dato) {
  return `<ol class="uke" aria-label="Siste sju dager">${Array.from({ length: 7 }, (_, i) => {
    const dag = leggTilDager(dato, i - 6);
    const s = t.dagens[dag]?.status;
    const navn = new Intl.DateTimeFormat('nb-NO', { timeZone: 'UTC', weekday: 'short' }).format(new Date(`${dag}T00:00:00Z`)).replace(/\.$/, '');
    return `<li class="${s === 'løst' ? 'lost' : s === 'feilet' ? 'feilet' : ''}${dag === dato ? ' i-dag' : ''}"><span aria-hidden="true">${s === 'løst' ? '✓' : s === 'feilet' ? '✕' : '·'}</span><small>${navn}</small><span class="sr-only">${kortDato(dag)}: ${s === 'løst' ? 'løst' : s === 'feilet' ? 'ikke løst' : 'ikke spilt'}</span></li>`;
  }).join('')}</ol>`;
}

function panelDagens(o) {
  const dato = iDag();
  const lang = new Intl.DateTimeFormat('nb-NO', { timeZone: 'UTC', weekday: 'long', day: 'numeric', month: 'long' }).format(new Date(`${dato}T00:00:00Z`));
  if (o?.type === 'plassering') {
    return `<section class="kort dagens-kort"><p class="eyebrow">DAGENS OPPGAVE · ${lang.toUpperCase()}</p><h2>Først: finn nivået ditt</h2><p>Løs ${PLASSERING} oppgaver, så får du dagens oppgave på ditt nivå. Alle på samme nivå får samme oppgave i dag.</p><div class="plassering" aria-label="Plassering ${Math.min(t.antall + 1, PLASSERING)} av ${PLASSERING}">${Array.from({ length: PLASSERING }, (_, i) => `<span class="${i < t.antall ? 'ferdig' : i === t.antall ? 'na' : ''}"></span>`).join('')}</div><p class="liten">Oppgave ${Math.min(t.antall + (o.registrert ? 0 : 1), PLASSERING)} av ${PLASSERING}. Disse teller på ratingen din.</p></section>${ratingKort(o)}`;
  }
  const d = t.dagens[dato];
  const rekke = dagRekke(t.dagens, dato);
  const ferdig = d && d.status !== 'åpen';
  return `<section class="kort dagens-kort"><p class="eyebrow">DAGENS OPPGAVE · ${lang.toUpperCase()}</p>
    <h2>${d ? `Nivå ${d.niva - 100}–${d.niva + 100}` : 'Dagens oppgave'}</h2>
    <p>${d ? 'Nivået er valgt ut fra oppgaveratingen din. Alle på samme nivå får samme oppgave i dag.' : ''}</p>
    ${ferdig ? `<p class="resultat ${d.status === 'løst' ? 'ok' : ''}">${stor(resultatTekst(d))}.</p><div class="del-rad">${knapp('del', delt ? 'Kopiert ✓' : 'Del resultat', { klasse: 'primary' })}</div><pre class="del-forhand" aria-label="Teksten som deles">${esc(delTekst(dato, d))}</pre><p class="liten">Ny oppgave ved midnatt.</p>` : d?.forsok ? `<p class="liten">Feil så langt: ${d.forsok}. Rekka holder så lenge du løser den uten å se løsningen.</p>` : ''}
    </section>
    <section class="kort"><div class="rekke-topp"><h2>Dager på rad</h2><span class="rekke-tall">${rekke ? `🔥 ${rekke}` : '0'}</span></div>${sisteSyvDager(dato)}<p class="liten">Dagens oppgave er uten rating. Øv videre under <a class="lenke" href="#rangert" data-fane="rangert">Rangert</a>.</p></section>
    ${oppgaveInfo(o)}`;
}

function panelLynlop() {
  const regler = `<p>Tre minutter. Oppgavene starter lett og blir vanskeligere for hver ny. Tre feil, og løpet er over. Ingen hint – bare fart.</p>`;
  if (lynlop.status === 'klar') {
    return `<section class="kort lynlop-kort"><p class="eyebrow">LYNLØP</p><h2>Hvor mange rekker du?</h2>${regler}<p class="rekord">Rekorden din: <strong>${t.lynlop.beste}</strong>${t.lynlop.besteDato ? ` <small>(${kortDato(t.lynlop.besteDato)})</small>` : ''}</p></section>`;
  }
  const feil = Array.from({ length: LYNLOP_FEIL }, (_, i) => `<span class="${i < lynlop.feil ? 'brukt' : ''}" aria-hidden="true">✕</span>`).join('');
  const logg = lynlop.logg.length ? `<ol class="lynlop-logg" aria-label="Oppgavene i løpet">${lynlop.logg.map(l => `<li class="${l.lost ? 'ok' : 'bom'}"><a href="https://lichess.org/training/${esc(l.id)}" target="_blank" rel="noopener" aria-label="${l.lost ? 'Løst' : 'Bom'}, rating ${l.rating}">${l.rating}</a></li>`).join('')}</ol>` : '';
  if (lynlop.status === 'spiller') {
    return `<section class="kort lynlop-kort"><p class="eyebrow">LYNLØP</p><div class="lynlop-tall"><div><span class="stort">${lynlop.poeng}</span><small>løst</small></div><div class="feil-merker" aria-label="${lynlop.feil} av ${LYNLOP_FEIL} feil">${feil}</div></div>${logg}${knapp('avslutt-lynlop', 'Avslutt løpet')}</section>`;
  }
  const hoyeste = Math.max(0, ...lynlop.logg.filter(l => l.lost).map(l => l.rating));
  return `<section class="kort lynlop-kort"><p class="eyebrow">LYNLØP</p><h2>${lynlop.grunn === 'tid' ? 'Tiden er ute!' : lynlop.grunn === 'feil' ? 'Tre feil – løpet er over' : 'Løpet er avsluttet'}</h2><div class="lynlop-tall"><div><span class="stort">${lynlop.poeng}</span><small>løst</small></div><div><span class="stort">${t.lynlop.beste}</span><small>rekord</small></div></div>${lynlop.nyRekord ? '<p class="resultat ok">Ny rekord! 🎉</p>' : ''}${hoyeste ? `<p class="liten">Vanskeligste løste oppgave: ${hoyeste}.</p>` : ''}${logg}</section>`;
}

function statusTekst(o) {
  const L = o?.losning;
  const farge = L ? fargenavn(L.farge) : '';
  const motpart = L ? fargenavn(L.farge === 'w' ? 'b' : 'w') : '';
  if (!o) return fane === 'lynlop' ? ['Lynløp', 'Tre minutter på deg. Trykk Start når du er klar.'] : ['Velg en oppgave', ''];
  if (o.status === 'datafeil') return ['Fikk ikke hentet oppgaver', 'Sjekk nettet og prøv igjen.'];
  if (o.status === 'laster') return ['Henter oppgave …', ''];
  if (o.type === 'lynlop' && lynlop.status === 'ferdig') return [lynlop.grunn === 'tid' ? 'Tiden er ute!' : 'Løpet er over', `Du løste ${lynlop.poeng} ${lynlop.poeng === 1 ? 'oppgave' : 'oppgaver'}.`];
  if (o.status === 'motstander') return o.riktig ? ['Riktig!', `${stor(motpart)} svarer …`] : [`${stor(motpart)} trekker …`, `Du spiller ${farge}. Se hva som skjer.`];
  if (o.status === 'viser-feil') return ['Ikke det trekket', o.type === 'lynlop' ? 'Neste oppgave kommer.' : ''];
  if (o.status === 'spiller') {
    const hint = o.hint ? ` Hint: flytt brikken på ${L.hintFelt}.` : '';
    return [o.riktig ? 'Riktig! Fortsett.' : 'Din tur', `${o.riktig ? (o.svar ? `${stor(motpart)} svarte ${o.svar}. ` : '') : o.forste ? `${stor(motpart)} spilte ${o.forste}. ` : ''}Finn det beste trekket for ${farge}.${hint}`];
  }
  if (o.status === 'feil') {
    const rating = o.type !== 'dagens' && o.endring !== null && o.feil === 1 ? ` ${fortegn(o.endring)} i rating.` : '';
    return ['Feil trekk', `${rating} Prøv igjen${o.type === 'dagens' ? '' : ' uten rating'}, eller se løsningen.`.trim()];
  }
  if (o.status === 'løst' && o.type === 'lynlop') return ['Løst!', 'Neste oppgave kommer …'];
  if (o.status === 'løst') {
    const del = o.type === 'dagens' ? `Dagens oppgave er ${resultatTekst(dagensData())}.` : o.endring !== null && o.feil === 0 ? `${fortegn(o.endring)} i rating${o.hint ? ' (halv gevinst med hint)' : ''}.` : 'Godt løst – denne gangen uten rating.';
    return ['Løst!', del];
  }
  if (o.status === 'løsning') {
    const ply = L.ply;
    const san = L.stillinger[ply]?.san;
    return ['Løsningen', ply ? `Trekk ${ply} av ${L.oppgave.moves.length}: ${san}` : 'Utgangsstillingen.'];
  }
  return ['', ''];
}

function kontroller(o) {
  if (fane === 'lynlop') return lynlop.status === 'spiller' ? '' : knapp('start-lynlop', lynlop.status === 'klar' ? '⚡ Start Lynløp' : '⚡ Spill igjen', { klasse: 'primary' });
  if (!o?.losning || o.status === 'laster') return o?.status === 'datafeil' ? knapp('last-pa-nytt', 'Prøv igjen', { klasse: 'primary' }) : '';
  const L = o.losning;
  if (o.type === 'lynlop') return '';
  const neste = o.type === 'dagens' ? '' : knapp('neste', o.type === 'plassering' && t.antall >= PLASSERING ? 'Til dagens oppgave →' : 'Neste oppgave →', { klasse: 'primary' });
  switch (o.status) {
    case 'motstander':
    case 'viser-feil':
    case 'spiller': {
      const aktiv = o.status === 'spiller';
      return `${knapp('hint', '💡 Hint', { deaktivert: !aktiv || o.hint })}${knapp('losning', 'Vis løsning', { deaktivert: !aktiv })}`;
    }
    case 'feil': return `${knapp('prov-igjen', 'Prøv igjen')}${knapp('losning', 'Vis løsning')}${neste}`;
    case 'løst': return `${knapp('prov-igjen', '↺ Spill på nytt')}${neste}`;
    case 'løsning': {
      const n = L.oppgave.moves.length;
      return `<div class="stegknapper" role="group" aria-label="Bla i løsningen">${knapp('steg-start', '⏮', { deaktivert: L.ply === 0, etikett: 'Til start' })}${knapp('steg-tilbake', '◀', { deaktivert: L.ply === 0, etikett: 'Ett trekk tilbake' })}${knapp('steg-frem', '▶', { deaktivert: L.ply >= n, etikett: 'Ett trekk frem' })}</div>${knapp('prov-igjen', 'Prøv selv')}${neste}`;
    }
    default: return '';
  }
}

// Only redraw when something changed, so an open select or focus is left alone.
function settHtml(el, html) {
  if (el.dataset.html === html) return;
  el.dataset.html = html;
  el.innerHTML = html;
}

function vis() {
  const o = okt;
  for (const knappen of document.querySelectorAll('[role="tab"]')) {
    const valgt = knappen.dataset.fane === fane;
    knappen.setAttribute('aria-selected', String(valgt));
    knappen.tabIndex = valgt ? 0 : -1;
    knappen.disabled = !valgt && lynlop.status === 'spiller';
  }
  $('#panel').setAttribute('aria-labelledby', `fane-${fane}`);
  const [tittel, detalj] = statusTekst(o);
  $('#status').textContent = tittel;
  $('#status-detalj').textContent = detalj;
  const tur = $('#tur-brikke');
  tur.textContent = o?.status === 'løst' ? '✓' : o?.status === 'feil' || o?.status === 'viser-feil' ? '✕' : '♟';
  tur.className = `turn-piece ${o?.losning?.farge === 'b' && !['løst', 'feil', 'viser-feil'].includes(o.status) ? 'black' : ''} ${o?.status === 'løst' ? 'ok' : o?.status?.includes('feil') ? 'bom' : ''}`;
  const fokus = document.activeElement?.dataset?.handling ?? document.activeElement?.id;
  settHtml($('#kontroller'), kontroller(o));
  settHtml($('#panel'), fane === 'dagens' ? panelDagens(o) : fane === 'rangert' ? panelRangert(o) : panelLynlop());
  if (fokus) (document.querySelector(`[data-handling="${fokus}"]:not(:disabled)`) ?? document.getElementById(fokus))?.focus({ preventScroll: true });
  document.body.classList.toggle('lynlop-aktiv', fane === 'lynlop' && lynlop.status === 'spiller');
  visKlokke();
  $('#lyd').textContent = lydPa() ? '🔊 Lyd på' : '🔇 Lyd av';
}

// ---- Tabs and events ----

function byttFane(ny, { historikk = true } = {}) {
  if (!FANER.includes(ny) || lynlop.status === 'spiller') return;
  fane = ny;
  if (historikk) history.replaceState(null, '', `#${ny}`);
  okt = null;
  if (ny === 'dagens') startDagens();
  else if (ny === 'rangert') nesteRangert();
  else {
    if (lynlop.status === 'ferdig') lynlop = { status: 'klar' };
    brett.vis({ chess: new Chess(), orientering: 'w', siste: null, hint: null, markering: null });
    vis();
  }
}

$('.faner').addEventListener('click', e => { const b = e.target.closest('[data-fane]'); if (b) byttFane(b.dataset.fane); });
$('.faner').addEventListener('keydown', e => {
  const steg = { ArrowRight: 1, ArrowLeft: -1 }[e.key];
  if (!steg) return;
  const i = FANER.indexOf(fane);
  const ny = FANER[(i + steg + FANER.length) % FANER.length];
  byttFane(ny);
  document.getElementById(`fane-${ny}`)?.focus();
});

const handlinger = {
  hint: brukHint,
  losning: visLosning,
  'prov-igjen': provIgjen,
  neste: () => (okt?.type === 'plassering' && t.antall >= PLASSERING ? startDagens() : nesteRangert(okt?.type === 'plassering' ? 'plassering' : 'rangert')),
  'steg-start': () => steg(0),
  'steg-tilbake': () => steg(okt.losning.ply - 1),
  'steg-frem': () => steg(okt.losning.ply + 1),
  del,
  'start-lynlop': startLynlop,
  'avslutt-lynlop': () => avsluttLynlop('avbrutt'),
  'last-pa-nytt': () => byttFane(fane),
};

document.addEventListener('click', e => {
  const b = e.target.closest('[data-handling]');
  if (b && !b.disabled) { handlinger[b.dataset.handling]?.(); return; }
  const v = e.target.closest('[data-vanskelighet]');
  if (v) { t.vanskelighet = v.dataset.vanskelighet; lagre(t); byttOppgaveHvisUrort(); return; }
  const lenke = e.target.closest('#panel [data-fane]');
  if (lenke) { e.preventDefault(); byttFane(lenke.dataset.fane); }
});
document.addEventListener('change', e => {
  if (e.target.id === 'tema') { t.tema = e.target.value; lagre(t); byttOppgaveHvisUrort(); }
});

/** A new difficulty or theme takes effect at once if the current puzzle has not been touched. */
function byttOppgaveHvisUrort() {
  const o = okt;
  if (o?.type === 'rangert' && !o.registrert && !o.riktig && !o.hint && ['spiller', 'motstander', 'laster'].includes(o.status)) {
    t.aktiv = null;
    nesteRangert();
  } else vis();
}

document.addEventListener('keydown', e => {
  if (e.target.closest?.('input, select, textarea, dialog') || e.ctrlKey || e.metaKey || e.altKey) return;
  if (okt?.status === 'løsning' && (e.key === 'ArrowLeft' || e.key === 'ArrowRight') && !e.target.closest?.('#brett, .faner')) {
    e.preventDefault();
    steg(okt.losning.ply + (e.key === 'ArrowRight' ? 1 : -1));
  }
});

$('#lyd').addEventListener('click', () => { settLyd(!lydPa()); vis(); });
addEventListener('hashchange', () => { const ny = location.hash.slice(1); if (ny !== fane) byttFane(ny, { historikk: false }); });

fetch(new URL('indeks.json', DATA)).then(r => (r.ok ? r.json() : null)).then(i => { indeks = i; if (fane === 'rangert') vis(); }).catch(() => {});

const fraLenke = location.hash.slice(1);
byttFane(FANER.includes(fraLenke) ? fraLenke : t.dagens[iDag()]?.status === 'løst' ? 'rangert' : 'dagens');

// "Gjennomgang": a course played like a short video on the board. Tora talks, the pieces move, arrows show the plans,
// and now and then the player has to answer. The course itself is read and checked in kurs.mjs.
import { TRENER, esc, norsk } from './trener.mjs';
import { flertall, trenerBoble } from './ui.mjs';
import { trekkNummer } from './modell.mjs';
import { introSett, merkIntro } from './kort.mjs';
import { kursStatus, lesetid, linjeTekst, merkFerdig, merkKapittel, merkSted, trekkTekst, trekkTid } from './kurs.mjs';
import { lagSpor } from './spor.mjs';
import { FARTER, lagTale, stemmeKortnavn } from './tale.mjs';
import { erValgt, fordel, settValgt, velgApning } from './repertoar.mjs';
import { startKortFor } from './kort-okt.mjs';

const EVAL_BRYTER = 'sjakk-apninger-evalbar-gjennomgang';
// A pause after speech, so one step does not run straight into the next.
const ETTER_TALE = 450;
const KAPITTELKORT = 1700;

const svg = innhold => `<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false">${innhold}</svg>`;
const IKON = {
  spill: svg('<path d="M8 5.5v13l10.5-6.5z" fill="currentColor"/>'),
  pause: svg('<path d="M7.5 5.5h3v13h-3zM13.5 5.5h3v13h-3z" fill="currentColor"/>'),
  igjen: svg('<path d="M5 12a7 7 0 1 0 2.1-5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M5 4v4.5h4.5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>'),
  forrige: svg('<path d="M6.5 5.5v13M18 5.5v13L9 12z" fill="currentColor" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/>'),
  neste: svg('<path d="M17.5 5.5v13M6 5.5v13L15 12z" fill="currentColor" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/>'),
  lyd: svg('<path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" fill="currentColor"/><path d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>'),
  stum: svg('<path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" fill="currentColor"/><path d="M15.5 9.5l5 5m0-5l-5 5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>'),
};
const fartTekst = fart => `${String(fart).replace('.', ',')}×`;
const rolig = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

// One voice for the whole visit: the browser loads its voices once.
let tale = null;
let naarTaleEndret = () => {};
const hentTale = lager => (tale ??= lagTale({ lager, naarEndret: () => naarTaleEndret() }));

// Builds the player on a board page. Returns { avslutt } for when the player leaves.
export function visGjennomgang(ui, { apning, kurs, brett, evalbar, panel, linje, avspiller, kom = '' }) {
  const stemme = hentTale(ui.lager);
  const ramme = brett.ramme;
  const start = kursStatus(kurs, ui.fremgang());
  const tilstand = { k: start.sted.kapittel, i: start.sted.steg, fase: 'plakat', statisk: true, resultat: new Map(), forsok: 0, hint: false };
  let spiller = false;
  let gen = 0;
  let snakk = null;
  const nedtellinger = new Set();
  // Waits on speech that is switched off midway, so the step goes on with the text alone.
  const lesingAv = new Set();

  // ---------- Frame ----------
  avspiller.hidden = false;
  ui.main.classList.add('ap-gj-aktiv');
  avspiller.innerHTML = `<div class="ap-gj-spor"></div><div class="ap-gj-knapper">
    <button type="button" class="ap-gj-knapp" data-gj="forrige" aria-label="Forrige steg">${IKON.forrige}</button>
    <button type="button" class="ap-gj-knapp ap-gj-spill" data-gj="spill"></button>
    <button type="button" class="ap-gj-knapp" data-gj="neste" aria-label="Neste steg">${IKON.neste}</button>
    <span class="ap-gj-teller" aria-hidden="true"></span>
    <button type="button" class="ap-gj-knapp" data-gj="tale"></button>
    <button type="button" class="ap-gj-knapp ap-gj-fart" data-gj="fart"></button>
  </div>`;
  panel.innerHTML = `<header class="ap-gj-hode"><p class="eyebrow"></p><h2></h2></header>
    ${trenerBoble('', { live: false })}
    <div class="ap-gj-handling"></div>
    <section class="ap-gj-kapitler" aria-label="Kapitler"><ol></ol></section>
    <p class="ap-gj-stemme"></p>`;
  const el = {
    spor: avspiller.querySelector('.ap-gj-spor'),
    spill: avspiller.querySelector('[data-gj="spill"]'),
    forrige: avspiller.querySelector('[data-gj="forrige"]'),
    neste: avspiller.querySelector('[data-gj="neste"]'),
    teller: avspiller.querySelector('.ap-gj-teller'),
    tale: avspiller.querySelector('[data-gj="tale"]'),
    fart: avspiller.querySelector('[data-gj="fart"]'),
    eyebrow: panel.querySelector('.ap-gj-hode .eyebrow'),
    tittel: panel.querySelector('.ap-gj-hode h2'),
    boble: panel.querySelector('.ap-boble'),
    tekst: panel.querySelector('.ap-boble-tekst'),
    handling: panel.querySelector('.ap-gj-handling'),
    kapitler: panel.querySelector('.ap-gj-kapitler ol'),
    stemme: panel.querySelector('.ap-gj-stemme'),
  };
  // The text is announced when a step changes, never while the clock runs.
  el.tekst.setAttribute('aria-live', 'polite');
  const spor = lagSpor(el.spor, { naarValgt: i => gaaTil(tilstand.k, i), navn: segmentNavn, etikett: 'Stegene i kapitlet. Piltastene går frem og tilbake.' });
  evalbar.brukBryter(EVAL_BRYTER, false);
  evalbar.hold(false);

  const kapittel = (k = tilstand.k) => kurs.kapitler[k];
  const steg = () => kapittel().steg[tilstand.i];
  const sisteKapittel = () => tilstand.k === kurs.kapitler.length - 1;

  // ---------- Clock and voice ----------
  // A wait that stands still while the player has paused. A new step makes every old wait worthless (gen).
  function vent(ms) {
    return new Promise(svar => {
      const n = { igjen: ms, start: 0, t: null };
      n.gaa = () => { if (n.t !== null) return; n.start = performance.now(); n.t = setTimeout(() => { nedtellinger.delete(n); svar(); }, Math.max(0, n.igjen)); };
      n.stans = () => { if (n.t === null) return; clearTimeout(n.t); n.t = null; n.igjen -= performance.now() - n.start; };
      nedtellinger.add(n);
      if (spiller) n.gaa();
    });
  }
  // Speech for one text; resolves when it is said, at once when nothing is read aloud.
  function si(tekst) {
    snakk?.avbryt();
    snakk = null;
    if (!stemme.leser) return Promise.resolve();
    const denne = stemme.si(tekst);
    snakk = denne;
    if (!spiller) denne.pause();
    return Promise.race([denne.ferdig, new Promise(svar => lesingAv.add(svar))]).then(() => vent(ETTER_TALE));
  }
  function avbryt() {
    gen += 1;
    for (const n of nedtellinger) clearTimeout(n.t);
    nedtellinger.clear();
    lesingAv.clear();
    snakk?.avbryt();
    snakk = null;
    ui.settTrekk(null);
    ramme.querySelector('.ap-kapittelkort')?.remove();
    el.spor.classList.remove('ap-gj-fyller');
  }
  function settSpiller(ja) {
    spiller = ja;
    for (const n of nedtellinger) (ja ? n.gaa : n.stans)();
    if (ja) snakk?.fortsett(); else snakk?.pause();
    el.spor.classList.toggle('ap-gj-stans', !ja);
    ramme.classList.toggle('ap-gj-pauset', !ja);
    tegnKnapper();
  }

  // ---------- Drawing ----------
  function vis(pos, { piler = [], merket = [], laast = true, gli = false } = {}) {
    brett.sett({ fen: pos.fen, sist: pos.sist, orientering: apning.farge, piler, merket, laast, gli: gli && !rolig() });
    linje.textContent = linjeTekst(pos.san);
    linje.scrollLeft = linje.scrollWidth;
  }
  function tekst(html, stemning = '') {
    el.boble.className = `ap-boble ${stemning}`;
    el.tekst.innerHTML = html;
  }
  function hode() {
    const k = tilstand.k;
    if (tilstand.fase === 'slutt') { el.eyebrow.textContent = 'GJENNOMGANG · FERDIG'; el.tittel.textContent = kurs.tittel; return; }
    if (tilstand.fase === 'plakat') { el.eyebrow.textContent = `GJENNOMGANG · ${flertall(kurs.kapitler.length, 'KAPITTEL', 'KAPITLER')} · CA. ${kurs.minutter} MIN`; el.tittel.textContent = kurs.tittel; return; }
    el.eyebrow.textContent = `KAPITTEL ${k + 1} AV ${kurs.kapitler.length}`;
    el.tittel.textContent = kapittel(k).tittel;
  }
  function segmentNavn(segment, plass, antall) {
    const status = { ny: '', sett: ', sett', naa: '', riktig: ', riktig svar', hint: ', riktig med hint', feil: ', bom', vist: ', vist' }[segment.status] ?? '';
    return `Steg ${plass + 1} av ${antall}${segment.sporsmal ? ', spørsmål' : ''}${status}${segment.aktiv ? ', du er her' : ''}`;
  }
  function tegnSpor() {
    const k = tilstand.k;
    const slutt = tilstand.fase === 'kapittelslutt' || tilstand.fase === 'slutt';
    const segmenter = kapittel(k).steg.map((s, i) => {
      const svar = tilstand.resultat.get(`${k}:${i}`);
      const status = svar ?? (slutt || i < tilstand.i ? 'sett' : i === tilstand.i && tilstand.fase !== 'plakat' ? 'naa' : 'ny');
      return { status, aktiv: !slutt && i === tilstand.i, apen: true, sporsmal: Boolean(s.sporsmal), klasse: s.sporsmal ? 'ap-gj-q' : '' };
    });
    spor.tegn(segmenter, slutt ? -1 : tilstand.i);
  }
  // The step's segment fills up as its time runs, like a video's bar.
  function fyll(ms) {
    const segment = el.spor.children[tilstand.i];
    if (!segment || rolig()) return;
    el.spor.classList.remove('ap-gj-fyller');
    void el.spor.offsetWidth;
    el.spor.style.setProperty('--ap-gj-tid', `${Math.round(ms)}ms`);
    el.spor.classList.add('ap-gj-fyller');
  }
  function tegnKnapper() {
    const { fase } = tilstand;
    const ikon = fase === 'slutt' ? IKON.igjen : spiller ? IKON.pause : IKON.spill;
    const navn = fase === 'slutt' ? 'Se gjennomgangen igjen' : fase === 'kapittelslutt' ? 'Spill neste kapittel' : spiller ? 'Pause' : 'Spill av';
    el.spill.innerHTML = ikon;
    el.spill.setAttribute('aria-label', `${navn} (mellomrom)`);
    el.spill.title = navn;
    const forst = tilstand.k === 0 && tilstand.i === 0 && !['kapittelslutt', 'slutt'].includes(fase);
    el.forrige.disabled = forst || fase === 'plakat';
    el.neste.disabled = fase === 'slutt';
    el.teller.textContent = fase === 'slutt' ? 'Ferdig' : fase === 'plakat' ? `${kurs.minutter} min` : fase === 'kapittelslutt' ? `Kapittel ${tilstand.k + 1} ✓` : `${tilstand.i + 1} / ${kapittel().steg.length}`;
    el.tale.innerHTML = stemme.paa && stemme.kan ? IKON.lyd : IKON.stum;
    el.tale.disabled = !stemme.kan;
    el.tale.setAttribute('aria-pressed', String(stemme.paa && stemme.kan));
    el.tale.setAttribute('aria-label', 'Les opp');
    el.tale.title = !stemme.kan ? 'Ingen norsk stemme' : stemme.paa ? 'Leser opp – trykk for bare tekst' : 'Bare tekst – trykk for å lese opp';
    el.fart.textContent = fartTekst(stemme.fart);
    el.fart.setAttribute('aria-label', `Tempo ${fartTekst(stemme.fart)}. Trykk for å bytte.`);
    el.fart.title = 'Tempo';
  }
  function tegnStemme() {
    let linje = '';
    if (!stemme.lastet) linje = '';
    else if (!stemme.finnes) linje = 'Nettleseren kan ikke lese opp, så det blir bare tekst.';
    else if (!stemme.kan) linje = 'Fant ingen norsk stemme i nettleseren, så det blir bare tekst.';
    else linje = `${TRENER.navn} leses opp med stemmen ${esc(stemmeKortnavn(stemme.stemme) || stemme.stemme.name)} fra nettleseren.${stemme.paa ? '' : ' Opplesing er av.'}`;
    el.stemme.innerHTML = linje;
  }
  function tegnKapitler() {
    const status = kursStatus(kurs, ui.fremgang());
    const post = ui.fremgang().kurs?.[kurs.apning];
    const fokus = el.kapitler.contains(document.activeElement) ? document.activeElement.dataset.kap : null;
    el.kapitler.innerHTML = kurs.kapitler.map((kap, k) => {
      const sett = Boolean(post?.kapitler?.[kap.id]);
      const her = k === tilstand.k && tilstand.fase !== 'plakat' && tilstand.fase !== 'slutt';
      return `<li><button type="button" class="ap-gj-kap${her ? ' her' : ''}${sett ? ' sett' : ''}" data-kap="${k}"${her ? ' aria-current="step"' : ''}><span class="ap-gj-kap-nr" aria-hidden="true">${sett ? '✓' : k + 1}</span><span class="ap-gj-kap-tekst"><b>${esc(kap.tittel)}</b><small>${flertall(kap.steg.length, 'steg', 'steg')}${kap.steg.some(s => s.sporsmal) ? ` · ${flertall(kap.steg.filter(s => s.sporsmal).length, 'spørsmål', 'spørsmål')}` : ''}${sett ? ' · sett' : ''}</small></span></button></li>`;
    }).join('');
    el.kapitler.closest('section').setAttribute('aria-label', `Kapitler, ${status.sett} av ${status.antall} sett`);
    el.kapitler.querySelectorAll('[data-kap]').forEach(knapp => knapp.addEventListener('click', () => { settSpiller(true); kjor(Number(knapp.dataset.kap), 0); }));
    if (fokus !== null) el.kapitler.querySelector(`[data-kap="${fokus}"]`)?.focus({ preventScroll: true });
  }
  const tegnAlt = () => { hode(); tegnSpor(); tegnKnapper(); tegnKapitler(); };

  function lagreSted() {
    merkSted(ui.fremgang(), apning.id, kapittel().id, tilstand.i);
    ui.lagre({ synk: false });
  }

  // ---------- Steps ----------
  const brettVist = s => vis(s.vist, { piler: s.piler, merket: s.felt });
  const stegHtml = s => `<p class="ap-sier">${esc(s.tekst)}</p>${s.trekk.length ? `<p class="sr-only">På brettet: ${esc(trekkTekst(s))}.</p>` : ''}`;

  // Plays a step: the moves in, the arrows, the text and its time. animer false shows the moves at once.
  async function kjor(k, i, { animer = true } = {}) {
    avbryt();
    const g = gen;
    const nyttKapittel = k !== tilstand.k || tilstand.fase === 'plakat' || tilstand.fase === 'kapittelslutt' || tilstand.fase === 'slutt';
    Object.assign(tilstand, { k, i, fase: 'steg', statisk: false, forsok: 0, hint: false });
    ramme.querySelector('.ap-plakat')?.remove();
    const s = steg();
    lagreSted();
    tegnAlt();
    el.handling.innerHTML = '';
    ui.respons();
    evalbar.hold(false);
    if (i === 0 && animer && nyttKapittel) {
      vis(kapittel().start);
      tekst(`<p class="eyebrow">KAPITTEL ${k + 1}</p><p class="ap-sier"><strong>${esc(kapittel().tittel)}</strong></p>`);
      if (!rolig()) {
        ramme.insertAdjacentHTML('beforeend', `<div class="ap-kapittelkort" aria-hidden="true"><span>Kapittel ${k + 1}</span><b>${esc(kapittel().tittel)}</b></div>`);
      }
      await Promise.all([vent(KAPITTELKORT), si(`Kapittel ${k + 1}: ${kapittel().tittel}${/[.!?]$/.test(kapittel().tittel) ? '' : '.'}`)]);
      if (g !== gen) return;
      ramme.querySelector('.ap-kapittelkort')?.remove();
    }
    tekst(stegHtml(s));
    const fart = stemme.fart;
    // A question is read when it is asked, after its moves.
    const tale = s.sporsmal ? null : si(s.tekst);
    const trekkMs = s.trekk.length && animer && !rolig() ? s.trekk.length * trekkTid(fart) : 0;
    fyll(trekkMs + lesetid(s.tekst, fart));
    if (trekkMs) {
      vis(s.foer);
      await vent(Math.min(350, trekkTid(fart) / 2));
      for (const [j, m] of s.trekk.entries()) {
        if (g !== gen) return;
        vis({ fen: m.after, sist: { from: m.from, to: m.to }, san: [...s.foer.san, ...s.trekk.slice(0, j + 1).map(t => t.san)] }, { gli: true });
        await vent(trekkTid(fart));
      }
      if (g !== gen) return;
    }
    if (s.sporsmal) { sporsmal(s); return; }
    brettVist(s);
    await Promise.all([vent(Math.max(1400, lesetid(s.tekst, fart) - trekkMs / 2)), tale]);
    if (g !== gen) return;
    videre();
  }

  // A step shown whole and still, as after a seek while paused. Play reads it and goes on.
  function statisk(k, i) {
    avbryt();
    Object.assign(tilstand, { k, i, fase: 'steg', statisk: true, forsok: 0, hint: false });
    ramme.querySelector('.ap-plakat')?.remove();
    const s = steg();
    lagreSted();
    tegnAlt();
    el.handling.innerHTML = '';
    ui.respons();
    evalbar.hold(false);
    tekst(stegHtml(s));
    if (s.sporsmal) { sporsmal(s); return; }
    brettVist(s);
  }

  function gaaTil(k, i) { if (spiller) kjor(k, i); else statisk(k, i); }

  function videre() {
    if (tilstand.i + 1 < kapittel().steg.length) kjor(tilstand.k, tilstand.i + 1);
    else kapittelSlutt();
  }

  // ---------- Questions ----------
  function sporsmal(s) {
    const q = s.sporsmal;
    tilstand.fase = 'sporsmal';
    tilstand.statisk = false;
    evalbar.hold(true);
    tegnKnapper();
    el.spor.classList.remove('ap-gj-fyller');
    if (q.type === 'trekk') {
      vis(s.vist, { piler: s.piler, merket: s.felt, laast: false });
      tekst(`<p class="eyebrow">SPØRSMÅL</p><p class="ap-sier">${esc(s.tekst)}</p><p class="ap-gjor">Spill trekket på brettet.</p>`);
      el.handling.innerHTML = `<div class="ap-kontroller ap-rad"><button type="button" class="button secondary" data-q="hint">Hint</button><button type="button" class="button secondary" data-q="vis">Vis meg</button></div>`;
      el.handling.querySelector('[data-q="hint"]').addEventListener('click', () => hint(s));
      el.handling.querySelector('[data-q="vis"]').addEventListener('click', () => visMeg(s));
      ui.settTrekk(trekk => svarTrekk(s, trekk));
      // On a phone the panel is under the board; the question stays in sight in the line right under it.
      ui.respons(`Spørsmål: ${s.tekst}`);
      si(s.tekst);
      return;
    }
    brettVist(s);
    tekst(`<p class="eyebrow">SPØRSMÅL</p><p class="ap-sier">${esc(s.tekst)}</p>`);
    el.handling.innerHTML = `<div class="ap-gj-valg" role="group" aria-label="Svaralternativer">${q.valg.map((v, n) => `<button type="button" class="ap-gj-alt" data-valg="${n}"><span class="ap-gj-alt-nr" aria-hidden="true">${n + 1}</span><span>${esc(v)}</span></button>`).join('')}</div>`;
    el.handling.querySelectorAll('[data-valg]').forEach(knapp => knapp.addEventListener('click', () => svarValg(s, Number(knapp.dataset.valg))));
    ui.respons(`Spørsmål: ${s.tekst} Svarene står under.`);
    si(`${s.tekst} ${q.valg.map((v, n) => `${n + 1}: ${v}`).join('. ')}.`);
  }

  const noter = status => { const nokkel = `${tilstand.k}:${tilstand.i}`; if (!tilstand.resultat.has(nokkel)) tilstand.resultat.set(nokkel, status); };

  function hint(s) {
    tilstand.hint = true;
    vis(s.vist, { piler: s.piler, merket: [...s.felt, s.sporsmal.riktig.from], laast: false });
    const knapp = el.handling.querySelector('[data-q="hint"]');
    if (knapp) { knapp.disabled = true; knapp.textContent = 'Brikken er merket'; }
    const linjeHint = s.sporsmal.hint ? `<p><span class="ap-etikett">Hint</span>${esc(s.sporsmal.hint)}</p>` : '';
    tekst(`<p class="eyebrow">SPØRSMÅL</p><p class="ap-sier">${esc(s.tekst)}</p>${linjeHint}<p class="ap-gjor">Brikken som skal flyttes, er merket.</p>`, tilstand.forsok ? 'feil' : '');
    ui.respons(`Brikken er merket.${s.sporsmal.hint ? ` ${s.sporsmal.hint}` : ''}`);
    if (s.sporsmal.hint) si(s.sporsmal.hint);
  }

  function svarTrekk(s, trekk) {
    const q = s.sporsmal;
    if (!q.svar.includes(trekk.san)) {
      tilstand.forsok += 1;
      noter('feil');
      tegnSpor();
      brett.rist();
      const merket = tilstand.hint || tilstand.forsok >= 2 ? [...s.felt, q.riktig.from] : s.felt;
      vis(s.vist, { piler: [...s.piler, { fra: trekk.from, til: trekk.to, type: 'fare' }], merket, laast: false });
      const hjelp = tilstand.forsok >= 2 && q.hint ? `<p><span class="ap-etikett">Hint</span>${esc(q.hint)}</p>` : '';
      tekst(`<p class="eyebrow">SPØRSMÅL</p><p class="ap-sier">${esc(norsk(trekk.san))} er ikke det jeg ser etter. ${tilstand.forsok >= 2 ? 'Brikken som skal flyttes, er merket.' : 'Prøv igjen, eller ta et hint.'}</p>${hjelp}<p class="ap-kilde">${esc(s.tekst)}</p>`, 'feil');
      ui.respons(`${norsk(trekk.san)} er ikke det jeg ser etter. ${tilstand.forsok >= 2 ? `Brikken er merket.${q.hint ? ` ${q.hint}` : ''}` : 'Prøv igjen.'}`, 'feil');
      si(`Ikke helt. ${tilstand.forsok >= 2 && q.hint ? q.hint : 'Prøv igjen.'}`);
      if (tilstand.forsok >= 2) { tilstand.hint = true; const knapp = el.handling.querySelector('[data-q="hint"]'); if (knapp) { knapp.disabled = true; knapp.textContent = 'Brikken er merket'; } }
      return;
    }
    noter(tilstand.hint ? 'hint' : 'riktig');
    const annet = trekk.san !== q.riktig.san;
    const ros = tilstand.hint ? 'Riktig, med litt hjelp.' : 'Riktig!';
    const nr = trekkNummer(s.vist.fen);
    ui.respons(`${ros} ${nr}${norsk(trekk.san)}`, 'bra');
    vis(s.etter, { piler: annet ? [{ fra: q.riktig.from, til: q.riktig.to, type: 'hint' }] : [], gli: !annet });
    forklar(s, `<p class="ap-sier"><strong>${ros}</strong> ${annet ? `${esc(nr + norsk(trekk.san))} virker også. Vi går videre med ${esc(nr + norsk(q.riktig.san))}.` : `${esc(nr + norsk(trekk.san))}.`}</p>`, 'bra', annet ? `${ros} Vi går videre med ${norsk(q.riktig.san)}.` : ros);
  }

  function visMeg(s) {
    noter('vist');
    vis(s.etter, { piler: [{ fra: s.sporsmal.riktig.from, til: s.sporsmal.riktig.to, type: 'hint' }], gli: true });
    const trekk = trekkNummer(s.vist.fen) + norsk(s.sporsmal.riktig.san);
    ui.respons(`Trekket er ${trekk}.`);
    forklar(s, `<p class="ap-sier">Trekket er <strong>${esc(trekk)}</strong>.</p>`, '', `Trekket er ${trekk}.`);
  }

  function svarValg(s, n) {
    const q = s.sporsmal;
    const riktig = n === q.riktig;
    noter(riktig ? 'riktig' : 'feil');
    ui.respons(riktig ? 'Riktig!' : `Ikke helt. Svaret er: ${q.valg[q.riktig]}.`, riktig ? 'bra' : 'feil');
    el.handling.querySelectorAll('[data-valg]').forEach(knapp => {
      const m = Number(knapp.dataset.valg);
      knapp.disabled = true;
      if (m === q.riktig) knapp.classList.add('riktig');
      if (m === n && !riktig) knapp.classList.add('feil');
      if (m === n) knapp.setAttribute('aria-pressed', 'true');
    });
    forklar(s, `<p class="ap-sier"><strong>${riktig ? 'Riktig!' : 'Ikke helt.'}</strong>${riktig ? '' : ` Svaret er: ${esc(q.valg[q.riktig])}.`}</p>`, riktig ? 'bra' : 'feil', riktig ? 'Riktig!' : `Ikke helt. Svaret er: ${q.valg[q.riktig]}.`, false);
  }

  // After an answer: why, then on. The board is the right answer's position, so the next step starts from there.
  async function forklar(s, topp, stemning, sagt, fjernKnapper = true) {
    avbryt();
    const g = gen;
    tilstand.fase = 'svar';
    evalbar.hold(false);
    tegnSpor();
    tegnKnapper();
    tekst(`${topp}<p>${esc(s.sporsmal.forklaring)}</p>`, stemning);
    const siste = tilstand.i + 1 >= kapittel().steg.length;
    const videreKnapp = `<div class="ap-kontroller ap-okt-neste"><button type="button" class="button primary" data-q="videre">${siste ? 'Fullfør kapitlet ▶' : 'Fortsett ▶'}</button></div>`;
    if (fjernKnapper) el.handling.innerHTML = videreKnapp;
    else el.handling.insertAdjacentHTML('beforeend', videreKnapp);
    const knapp = el.handling.querySelector('[data-q="videre"]');
    knapp.addEventListener('click', () => { settSpiller(true); videre(); });
    if (document.activeElement === document.body || el.handling.contains(document.activeElement) || ramme.contains(document.activeElement)) knapp.focus({ preventScroll: true });
    fyll(lesetid(s.sporsmal.forklaring, stemme.fart));
    await Promise.all([vent(lesetid(s.sporsmal.forklaring, stemme.fart)), si(`${sagt} ${s.sporsmal.forklaring}`)]);
    if (g !== gen) return;
    videre();
  }

  // ---------- Chapter and course end ----------
  function kapittelSlutt() {
    avbryt();
    ui.respons();
    merkKapittel(ui.fremgang(), apning.id, kapittel().id);
    ui.lagre();
    if (sisteKapittel()) { slutt(); return; }
    tilstand.fase = 'kapittelslutt';
    const s = kapittel().steg.at(-1);
    vis(s.etter, { piler: s.sporsmal ? [] : s.piler, merket: s.sporsmal ? [] : s.felt });
    settSpiller(false);
    tegnAlt();
    const neste = kurs.kapitler[tilstand.k + 1];
    tekst(`<p class="eyebrow">KAPITTEL ${tilstand.k + 1} ER SETT</p><p class="ap-sier"><strong>Godt.</strong> Neste kapittel er «${esc(neste.tittel)}».</p><p>Ta en pust i bakken, eller fortsett med en gang.</p>`, 'bra');
    el.handling.innerHTML = `<div class="ap-kontroller ap-okt-neste"><button type="button" class="button primary" data-q="neste-kap">Neste kapittel: ${esc(neste.tittel)} ▶</button></div>`;
    const knapp = el.handling.querySelector('[data-q="neste-kap"]');
    knapp.addEventListener('click', () => { settSpiller(true); kjor(tilstand.k + 1, 0); });
    if (el.handling.contains(document.activeElement) || avspiller.contains(document.activeElement) || document.activeElement === document.body) knapp.focus({ preventScroll: true });
  }

  let kvittering = '';
  function slutt() {
    avbryt();
    ui.respons();
    merkFerdig(ui.fremgang(), apning.id);
    // The cards' short introduction says less than the walkthrough just did. A player with no cards yet still gets it, for how the cards work.
    if (Object.keys(ui.fremgang().kort).length && !introSett(ui.fremgang(), apning.id)) merkIntro(ui.fremgang(), apning.id);
    ui.lagre();
    tilstand.fase = 'slutt';
    const s = kapittel().steg.at(-1);
    vis(s.etter);
    // Played to the end: the rules are read too, and then the player stands still.
    const lest = spiller;
    tegnAlt();
    tegnSlutt();
    if (lest) si(`Det var gjennomgangen. Her er det viktigste å huske. ${kurs.huskeregler.join(' ')}`).then(() => { if (tilstand.fase === 'slutt') settSpiller(false); });
    else settSpiller(false);
  }
  function tegnSlutt() {
    const valgt = erValgt(ui.fremgang(), apning.id);
    tekst(`<p class="eyebrow">HUSKEREGLER</p><p class="ap-sier"><strong>Da har du sett hele gjennomgangen.</strong> Her er det viktigste å ta med seg:</p><ol class="ap-gj-regler">${kurs.huskeregler.map(r => `<li>${esc(r)}</li>`).join('')}</ol>`, 'bra');
    const tilOkt = kom.startsWith('#/repertoar/kort');
    el.handling.innerHTML = `${kvittering ? `<p class="ap-bygg-kvittering" role="status">${esc(kvittering)}</p>` : ''}<div class="ap-kontroller ap-gj-slutt">
      ${valgt ? '<p class="ap-gj-valgt">✓ I repertoaret ditt</p>' : '<button type="button" class="button secondary" data-slutt="legg">Legg til i repertoaret</button>'}
      <button type="button" class="button primary" data-slutt="kort">Start kortene ▶</button>
      <div class="ap-gj-sluttlenker"><button type="button" class="ap-lenke" data-slutt="igjen">Se igjen fra start</button>${tilOkt ? ` · <a href="${kom}">Tilbake til dagens økt</a>` : ''} · <a href="#/a/${apning.id}/laer">Bla i trekkene</a></div>
    </div>`;
    el.handling.querySelector('[data-slutt="legg"]')?.addEventListener('click', () => { leggTil(); tegnSlutt(); el.handling.querySelector('[data-slutt="kort"]')?.focus({ preventScroll: true }); });
    el.handling.querySelector('[data-slutt="kort"]').addEventListener('click', () => { if (!erValgt(ui.fremgang(), apning.id)) leggTil(); location.hash = startKortFor(ui, apning); });
    el.handling.querySelector('[data-slutt="igjen"]').addEventListener('click', () => { kvittering = ''; settSpiller(true); kjor(0, 0); });
  }
  function leggTil() {
    const fremgang = ui.fremgang();
    const slot = fordel(ui.alle()).find(s => s.apninger.includes(apning));
    const byttet = slot ? velgApning(fremgang, apning, slot) : (settValgt(fremgang, apning.id, true), []);
    ui.lagre();
    kvittering = byttet.length ? `${apning.navn} er med i repertoaret, i stedet for ${byttet.map(a => a.navn).join(' og ')}.` : `${apning.navn} er med i repertoaret.`;
  }

  // ---------- Controls ----------
  function spillPause() {
    const { fase } = tilstand;
    if (fase === 'slutt') { kvittering = ''; settSpiller(true); kjor(0, 0); return; }
    if (fase === 'plakat') { settSpiller(true); kjor(tilstand.k, tilstand.i); return; }
    if (fase === 'kapittelslutt') { settSpiller(true); kjor(tilstand.k + 1, 0); return; }
    if (spiller) { settSpiller(false); return; }
    settSpiller(true);
    if (tilstand.statisk && fase === 'steg') kjor(tilstand.k, tilstand.i, { animer: false });
  }
  function forrige() {
    const { fase, k, i } = tilstand;
    if (fase === 'plakat') return;
    if (fase === 'kapittelslutt' || fase === 'slutt') { gaaTil(k, kapittel(k).steg.length - 1); return; }
    if (i > 0) gaaTil(k, i - 1);
    else if (k > 0) gaaTil(k - 1, kapittel(k - 1).steg.length - 1);
    else gaaTil(0, 0);
  }
  function neste() {
    const { fase, k, i } = tilstand;
    if (fase === 'slutt') return;
    if (fase === 'plakat') { gaaTil(k, i); return; }
    if (fase === 'kapittelslutt') { gaaTil(k + 1, 0); return; }
    if (i + 1 < kapittel().steg.length) gaaTil(k, i + 1);
    else kapittelSlutt();
  }

  el.spill.addEventListener('click', spillPause);
  el.forrige.addEventListener('click', forrige);
  el.neste.addEventListener('click', neste);
  el.tale.addEventListener('click', () => {
    stemme.settPaa(!stemme.paa);
    if (!stemme.paa) { for (const svar of lesingAv) svar(); lesingAv.clear(); }
    // Switched on mid-step: the step is read from the start. Switched off: the clock goes on with the text alone.
    if (stemme.paa && spiller && tilstand.fase === 'steg') kjor(tilstand.k, tilstand.i, { animer: false });
  });
  el.fart.addEventListener('click', () => { stemme.settFart(FARTER[(FARTER.indexOf(stemme.fart) + 1) % FARTER.length]); });
  naarTaleEndret = () => { tegnKnapper(); tegnStemme(); };

  ui.settTast(event => {
    if (event.target.closest?.('.ap-brett, input, select, textarea')) return;
    if (event.altKey || event.ctrlKey || event.metaKey) return;
    const paKnapp = event.target.closest?.('button, a');
    if ((event.key === ' ' || event.key === 'k') && !paKnapp) { event.preventDefault(); spillPause(); }
    else if (event.key === 'ArrowLeft') { event.preventDefault(); forrige(); }
    else if (event.key === 'ArrowRight') { event.preventDefault(); neste(); }
    else if (/^[1-5]$/.test(event.key) && tilstand.fase === 'sporsmal' && steg().sporsmal?.type === 'valg') {
      const knapp = el.handling.querySelector(`[data-valg="${Number(event.key) - 1}"]`);
      if (knapp && !knapp.disabled) { event.preventDefault(); knapp.click(); }
    }
  });

  // ---------- The poster ----------
  function plakat() {
    const s = kapittel().steg[tilstand.i];
    vis(tilstand.i ? s.foer : kapittel().start);
    const merke = start.ferdig ? 'Se igjen' : start.startet ? `Fortsett · kapittel ${tilstand.k + 1}` : 'Spill av';
    ramme.insertAdjacentHTML('beforeend', `<button type="button" class="ap-plakat"><span class="ap-plakat-knapp" aria-hidden="true">${start.ferdig ? IKON.igjen : IKON.spill}</span><span class="ap-plakat-tekst">${merke}</span><small>${flertall(kurs.kapitler.length, 'kapittel', 'kapitler')} · ca. ${kurs.minutter} min</small></button>`);
    ramme.querySelector('.ap-plakat').addEventListener('click', spillPause);
    const fortsetter = start.startet && !start.ferdig;
    tekst(`<p class="ap-sier">Brettet spiller av og jeg forklarer, steg for steg. Innimellom spør jeg deg, og da venter jeg på svaret ditt. Du kan pause og spole når du vil.</p>${fortsetter ? `<p class="ap-kilde">Du har sett ${start.sett} av ${flertall(start.antall, 'kapittel', 'kapitler')}. Vi fortsetter der du slapp.</p>` : start.ferdig ? '<p class="ap-kilde">Du har sett hele. Se den igjen, eller velg et kapittel.</p>' : ''}<p class="ap-kilde">Tastatur: mellomrom spiller og pauser, piltastene blar.</p>`);
    tegnAlt();
    tegnStemme();
  }
  plakat();

  return {
    avslutt() {
      avbryt();
      spiller = false;
      naarTaleEndret = () => {};
      ramme.querySelector('.ap-plakat')?.remove();
      ramme.classList.remove('ap-gj-pauset');
      evalbar.brukBryter(null);
      evalbar.hold(false);
      ui.respons();
      avspiller.hidden = true;
      ui.main.classList.remove('ap-gj-aktiv');
      avspiller.innerHTML = '';
      ui.settTast(null);
    },
  };
}

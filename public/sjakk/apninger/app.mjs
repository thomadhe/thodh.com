import { Chess } from '../vendor/chess.mjs';
import { lesApning, trekkNummer, veiTil } from './modell.mjs';
import { lagBrett, piler } from './brett.mjs';
import { lagEvalbar, lagretOppslag, KREDITT } from './evalbar.mjs';
import { TRENER, norsk, medNummer, forklaring, feilKommentar, ROS, esc, hilsen } from './trener.mjs';
import { FARGE, NIVA, flertall, skarphet, startNotasjon, stiTekst, trenerBoble } from './ui.mjs';
import * as rep from './repetisjon.mjs';
import { valgteApninger, velgBlandetLinje } from './repertoar.mjs';
import { lagKort } from './kort.mjs';
import { visRepertoar } from './repertoar-side.mjs';
import { klareKort, visKortokt } from './kort-okt.mjs';

const DATA = '/sjakk/apninger/data/';
const main = document.querySelector('#innhold');
const lager = (() => { try { return window.localStorage; } catch { return { getItem: () => null, setItem() {} }; } })();
let manifest = null;
const apninger = new Map();
let fremgang = rep.lesFremgang(lager);
let fargeFilter = 'alle';
let timer = null;
let brett = null;
let evalbar = null;
let tilstand = {};
let tastLytter = null;
let ventende = null;
let oppslag = () => null;
let kortMinne = { nokkel: null, kort: [] };

const lagre = () => rep.lagreFremgang(lager, fremgang);
const tilfeldig = liste => liste[Math.floor(Math.random() * liste.length)];
const stopp = () => { clearTimeout(timer); timer = null; };
const fjernEvalbar = () => { evalbar?.avslutt(); evalbar = null; };

const oppslagMinne = new WeakMap();
function oppslagFor(apning) {
  if (!oppslagMinne.has(apning)) oppslagMinne.set(apning, lagretOppslag(apning.noder));
  return oppslagMinne.get(apning);
}

// Board, evaluation bar and panel. Everything with a board uses this, so the layout stays the same.
function lagBrettside(topp) {
  main.innerHTML = `${topp}<div class="ap-oppsett"><section class="ap-brettsone" aria-label="Brett"><div id="ap-brett"></div><div id="ap-eval"></div><p id="ap-respons" class="ap-respons" aria-hidden="true" hidden></p><p id="ap-linje" class="ap-linje"></p></section><aside id="ap-panel" class="ap-panel"></aside></div><p class="ap-fotnote">${KREDITT}</p>`;
  fjernEvalbar();
  evalbar = lagEvalbar(main.querySelector('#ap-eval'), { lager });
  brett = lagBrett(main.querySelector('#ap-brett'), { naarTrekk: trekk => tilstand.naarTrekk?.(trekk), naarStilling: (fen, orientering) => evalbar.settStilling(fen, { orientering, lagret: oppslag(fen) }) });
}

const alleApninger = () => [...apninger.values()];
const valgte = () => valgteApninger(fremgang, alleApninger());
function repertoarKort() {
  const utvalg = valgte();
  const nokkel = utvalg.map(apning => apning.id).join();
  if (nokkel !== kortMinne.nokkel) kortMinne = { nokkel, kort: lagKort(utvalg) };
  return kortMinne.kort;
}

// What the repertoire page and the flashcards need from the app, so they can live in their own files.
const ui = {
  main,
  alle: alleApninger,
  valgte,
  kort: repertoarKort,
  fremgang: () => fremgang,
  lagre,
  stopp,
  etter(ms, gjor) { stopp(); timer = setTimeout(gjor, ms); },
  settTast(lytter) { tastLytter = lytter; },
  settTrekk(lytter) { tilstand.naarTrekk = lytter; },
  brettside(topp) { tilstand = {}; lagBrettside(topp); return { brett, evalbar, panel: panel(), linje: linjeFelt() }; },
  brettBort() { brett = null; fjernEvalbar(); },
  brukOppslag(apning) { oppslag = oppslagFor(apning); },
  respons,
  apneStilling(apning, node) { gaaTil(`#/a/${apning.id}/laer`, () => visLaer(apning, node)); },
};

async function last() {
  const svar = await fetch(`${DATA}manifest.json`);
  manifest = await svar.json();
  const filer = await Promise.all(manifest.apninger.map(id => fetch(`${DATA}${id}.json`).then(r => r.json())));
  for (const data of filer) {
    const { apning, feil } = lesApning(data);
    if (feil.length) console.warn(`Åpningen ${data.id} har feil:`, feil);
    if (apning) apninger.set(apning.id, apning);
  }
}

// ---------- Library ----------
function visBibliotek() {
  stopp();
  brett = null;
  fjernEvalbar();
  document.title = 'Åpninger · Sjakk for to';
  const naa = Date.now();
  let forfalt = 0, laert = 0, totalt = 0;
  for (const apning of apninger.values()) { const s = rep.statusFor(apning, fremgang, naa); forfalt += s.forfaller; laert += s.laert; totalt += s.totalt; }
  const vansker = rep.vansker(fremgang).map(v => { const apning = apninger.get(v.apningId); const node = apning?.noder.get(v.sti); const riktig = node?.barn[0]; return riktig ? `<li><a href="#/a/${apning.id}/ov">${esc(apning.navn)}: ${esc(medNummer(riktig))}</a> <span>(${flertall(v.antall, 'bom', 'bom')})</span></li>` : ''; }).join('');
  const intro = laert === 0
    ? `${hilsen(new Date().getHours())}! Jeg er ${TRENER.navn}, ${TRENER.rolle}. Velg en åpning, så går vi gjennom hvert trekk sammen – hva det gjør, hvorfor vi spiller det og hva du må passe på. Når du er klar, øver vi til det sitter.`
    : `${hilsen(new Date().getHours())} igjen! Du har lært ${flertall(laert, 'linje', 'linjer')} av ${totalt}. ${forfalt ? `${flertall(forfalt, 'linje venter', 'linjer venter')} på repetisjon – la oss ta dem først.` : 'Ingen linjer venter på repetisjon akkurat nå. Lær noe nytt, eller prøv en felle!'}`;
  const grupper = manifest.grupper.filter(g => fargeFilter === 'alle' || g.farge === fargeFilter);
  main.innerHTML = `
    <section class="ap-hero">${trenerBoble(`<p class="eyebrow">${TRENER.navn.toUpperCase()} · ÅPNINGSTRENER</p><h1>Åpninger med angrepslyst</h1><p>${esc(intro)}</p>${vansker ? `<p class="ap-vansker-tittel">Dette sliter du mest med:</p><ul class="ap-vansker">${vansker}</ul>` : ''}`, { live: false })}</section>
    ${repertoarInngang()}
    <div class="ap-filter" role="group" aria-label="Velg farge">${[['alle', 'Alle'], ['w', 'Som hvit'], ['b', 'Som svart']].map(([v, t]) => `<button type="button" data-farge="${v}" aria-pressed="${fargeFilter === v}">${t}</button>`).join('')}</div>
    ${grupper.map(g => `<section class="ap-gruppe" aria-labelledby="g-${g.id}"><h2 id="g-${g.id}">${esc(g.navn)}</h2><p class="ap-gruppe-tekst">${esc(g.tekst)}</p><div class="ap-kortliste">${g.apninger.map(id => apninger.get(id)).filter(Boolean).map(kort).join('')}</div></section>`).join('')}
    <p class="ap-fotnote">Alle linjer er spilt gjennom og sjekket med sjakkmotoren Stockfish. Gambiter er ofte litt tvilsomme objektivt – ${TRENER.navn} sier fra om det, trekk for trekk.</p>`;
  main.querySelectorAll('[data-farge]').forEach(knapp => knapp.addEventListener('click', () => { fargeFilter = knapp.dataset.farge; visBibliotek(); main.querySelector(`[data-farge="${fargeFilter}"]`)?.focus(); }));
}

// The way in at the top of the library, with the cards one tap away.
function repertoarInngang() {
  const antall = valgte().length;
  if (!antall) return '<a class="ap-inngang" href="#/repertoar"><span class="ap-inngang-tekst"><b>Mitt repertoar</b><span>Velg favorittene dine mot hvert svar, med hvit og svart.</span></span><span class="button secondary">Sett opp</span></a>';
  const klare = klareKort(ui).kort.length;
  return `<div class="ap-inngang"><a class="ap-inngang-tekst" href="#/repertoar"><b>Mitt repertoar</b><span>${flertall(antall, 'åpning', 'åpninger')} · ${klare ? flertall(klare, 'kort klart', 'kort klare') : 'ingen kort klare nå'}</span></a>${klare ? `<a class="button primary" href="#/repertoar/kort">Start kort ▶</a>` : '<a class="button secondary" href="#/repertoar">Åpne</a>'}</div>`;
}

function kort(apning) {
  const s = rep.statusFor(apning, fremgang);
  const andel = s.totalt ? Math.round(s.laert / s.totalt * 100) : 0;
  return `<a class="ap-kort" href="#/a/${apning.id}/laer">
    <span class="ap-kort-topp"><span class="ap-farge ${apning.farge}">${FARGE[apning.farge]}</span><span class="ap-eco">${esc(apning.eco ?? '')}</span></span>
    <h3>${esc(apning.navn)}</h3>
    <p>${esc(apning.kort)}</p>
    <span class="ap-merker"><span>${NIVA[apning.niva]}</span><span>${esc(apning.karakter)}</span>${skarphet(apning)}</span>
    <span class="ap-fremdrift"><span class="ap-spor"><span style="width:${andel}%"></span></span><span>${s.laert}/${s.totalt} linjer lært${s.forfaller ? ` · <b>${s.forfaller} til repetisjon</b>` : ''}</span></span>
  </a>`;
}

// ---------- Opening view ----------
function visApning(id, fane) {
  stopp();
  const apning = apninger.get(id);
  if (!apning) { location.hash = '#/'; return; }
  document.title = `${apning.navn} · Åpninger`;
  const faner = [['om', 'Om åpningen'], ['laer', 'Lær'], ['ov', 'Øv'], ['feller', `Feller${apning.feller.length ? ` (${apning.feller.length})` : ''}`]];
  const nyVisning = tilstand.apningId !== id || !main.querySelector('.ap-oppsett');
  if (nyVisning) {
    oppslag = oppslagFor(apning);
    lagBrettside(`
      <nav class="ap-tilbake"><a href="#/">← Alle åpninger</a></nav>
      <header class="ap-apning-topp"><p class="eyebrow">${FARGE[apning.farge].toUpperCase()}${apning.eco ? ` · ${esc(apning.eco)}` : ''}</p><h1>${esc(apning.navn)}</h1><p class="ap-startlinje">${apning.startTrekk.length ? `Starter etter ${esc(startNotasjon(apning))}` : 'Fra utgangsstillingen'}</p></header>
      <nav class="ap-faner" aria-label="Del av åpningen">${faner.map(([f, t]) => `<a href="#/a/${id}/${f}" data-fane="${f}">${t}</a>`).join('')}</nav>`);
  }
  evalbar.hold(false);
  main.querySelectorAll('[data-fane]').forEach(a => { if (a.dataset.fane === fane) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current'); });
  tilstand = { apningId: id, fane, apning };
  const etter = ventende;
  ventende = null;
  if (etter) etter();
  else if (fane === 'om') visOm(apning);
  else if (fane === 'ov') startOv(apning);
  else if (fane === 'feller') visFeller(apning);
  else visLaer(apning, apning.rot);
}

// Switch tab and then show a specific view (hashchange fires after microtasks, so the view waits for it).
function gaaTil(hash, vis) {
  if (location.hash === hash) { vis(); return; }
  ventende = vis;
  location.hash = hash;
}

// Keep keyboard focus on the equivalent control when the panel re-renders.
const FOKUSNOKLER = ['data-nav', 'data-barn', 'data-ov', 'data-f', 'data-s', 'data-felle', 'data-gaa', 'data-side'];
function fokusNokkel() {
  const el = document.activeElement;
  if (!el || !panel()?.contains(el)) return null;
  const attr = FOKUSNOKLER.find(a => el.hasAttribute(a));
  return attr ? `[${attr}="${el.getAttribute(attr)}"]` : 'button';
}
function gjenopprettFokus(nokkel) {
  if (nokkel) (panel().querySelector(nokkel) ?? panel().querySelector('button:not([disabled])'))?.focus({ preventScroll: true });
}

const panel = () => main.querySelector('#ap-panel');
const linjeFelt = () => main.querySelector('#ap-linje');
// On narrow screens the panel sits below the board, so a one-line echo of the coach's answer is shown right under it.
function respons(tekst = '', stemning = '') {
  const el = main.querySelector('#ap-respons');
  if (!el) return;
  el.textContent = tekst;
  el.className = `ap-respons ${stemning}`;
  el.hidden = !tekst;
}

function settLinje(apning, noder, aktiv, klikk) {
  const start = apning.startTrekk.length ? `<span class="ap-start">${esc(startNotasjon(apning))}</span> ` : '';
  linjeFelt().innerHTML = start + noder.map((n, i) => `<button type="button" class="ap-trekk${n === aktiv ? ' aktiv' : ''}" data-i="${i}">${esc((n.farge === 'w' || i === 0 ? n.nummer : '') + norsk(n.san))}</button>`).join(' ');
  if (klikk) linjeFelt().querySelectorAll('[data-i]').forEach(k => k.addEventListener('click', () => klikk(noder[Number(k.dataset.i)])));
  else linjeFelt().querySelectorAll('[data-i]').forEach(k => { k.disabled = true; });
  linjeFelt().scrollLeft = linjeFelt().scrollWidth;
}

function visOm(apning) {
  respons();
  brett.sett({ fen: apning.startFen, orientering: apning.farge, laast: true });
  settLinje(apning, [], null);
  const i = apning.intro;
  panel().innerHTML = `
    ${trenerBoble(`<p>${esc(i.karakter)}</p>`, { live: false })}
    <section class="ap-seksjon"><h2>Historien</h2><p>${esc(i.historie)}</p></section>
    <section class="ap-seksjon"><h2>Passer for deg som …</h2><p>${esc(i.passer)}</p></section>
    <section class="ap-seksjon"><h2>Typiske planer</h2><ul>${apning.planer.map(p => `<li>${esc(p)}</li>`).join('')}</ul></section>
    <section class="ap-seksjon"><h2>Modellideer</h2><ul>${apning.modellideer.map(p => `<li>${esc(p)}</li>`).join('')}</ul></section>
    ${apning.sidelinjer.length ? `<section class="ap-seksjon"><h2>Sidelinjer og beslektede ideer</h2>${apning.sidelinjer.map((s, n) => `<div class="ap-sidelinje"><h3>${esc(s.navn)}</h3><p class="ap-notasjon">${esc(startNotasjon(apning))} ${esc(stiFraTrekk(apning, s.trekk))}</p><p>${esc(s.tekst)}</p>${s.kilde ? `<p class="ap-kilde">Kilde: ${esc(s.kilde)}</p>` : ''}<button type="button" class="button secondary" data-side="${n}">Spill gjennom</button></div>`).join('')}</section>` : ''}
    <section class="ap-seksjon"><h2>I tall</h2><p>${flertall(apning.linjer.length, 'linje', 'linjer')} å øve på, ${apning.stillinger} ulike stillinger og ${flertall(apning.feller.length, 'felle', 'feller')}.</p></section>
    <a class="button primary ap-bred" href="#/a/${apning.id}/laer">Start å lære</a>`;
  panel().querySelectorAll('[data-side]').forEach(k => k.addEventListener('click', () => { gaaTil(`#/a/${apning.id}/laer`, () => visSidelinje(apning, apning.sidelinjer[Number(k.dataset.side)], 0)); }));
}

function stiFraTrekk(apning, trekk) {
  const chess = new Chess(apning.startFen);
  return trekk.map((m, i) => { const nr = trekkNummer(chess.fen()); chess.move(m.san); return (m.color === 'w' || i === 0 ? nr : '') + norsk(m.san); }).join(' ');
}

// ---------- Learn ----------
function visLaer(apning, node, melding = '') {
  const fokus = fokusNokkel();
  stopp();
  tilstand.fane = 'laer';
  respons();
  const neste = node.barn;
  const vaarTur = neste.length === 1 && neste[0].rep;
  const plan = [...piler(node.entry?.piler), ...piler(node.entry?.fare, 'fare')];
  if (vaarTur) plan.push({ fra: neste[0].fra, til: neste[0].til, type: 'hint' });
  brett.sett({ fen: node.fen, orientering: apning.farge, sist: node.san ? { from: node.fra, to: node.til } : null, piler: plan, merket: node.entry?.felt ?? [], laast: !neste.length });
  const vei = veiTil(node);
  settLinje(apning, vei, node, n => visLaer(apning, n));
  tilstand.naarTrekk = trekk => {
    const treff = neste.find(b => b.san === trekk.san);
    if (treff) visLaer(apning, treff);
    else { brett.rist(); visLaer(apning, node, `${norsk(trekk.san)} er ikke med i repertoaret her. ${vaarTur ? `Vi spiller ${medNummer(neste[0])} – prøv det, eller trykk Neste.` : 'Velg et av motstanderens svar under.'}`); }
  };
  let tekst;
  if (!node.san) tekst = `<p class="ap-sier">${esc(apning.intro.karakter)}</p><p>${apning.startTrekk.length ? `Vi starter etter ${esc(startNotasjon(apning))}. ` : ''}Grønne piler viser planer, oransje viser trusler, og den rosa pilen er neste trekk i repertoaret. Du kan også spille trekket selv på brettet.</p>`;
  else tekst = forklaring(node, apning.farge);
  if (node.overgang) tekst += `<p class="ap-overgang"><span class="ap-etikett plan">Omstilling</span>Samme stilling oppstår etter ${esc(stiTekst(veiTil(node.overgang)))}. Vi fortsetter derfra.</p>`;
  if (melding) tekst = `<p class="ap-varsel" role="alert">${esc(melding)}</p>` + tekst;
  const valg = !neste.length
    ? (node.overgang ? `<button type="button" class="button primary" data-gaa="overgang">Gå til ${esc(medNummer(node.overgang))} ▶</button>` : `<p class="ap-slutt">Slutten av denne linjen.</p><a class="button primary" href="#/a/${apning.id}/ov">Øv på åpningen</a>`)
    : vaarTur
      ? `<button type="button" class="button primary ap-neste" data-barn="0">Neste: ${esc(medNummer(neste[0]))} ▶</button>`
      : `<p class="ap-valg-tittel">${neste.length > 1 ? 'Motstanderen kan svare:' : 'Motstanderen svarer:'}</p><div class="ap-valg">${[...neste].map((b, i) => ({ b, i })).sort((x, y) => (y.b.entry.vekt ?? 1) - (x.b.entry.vekt ?? 1)).map(({ b, i }, plass) => `<button type="button" class="button ${plass === 0 ? 'primary' : 'secondary'}" data-barn="${i}"><b>${esc(medNummer(b))}</b>${b.entry.navn ? ` · ${esc(b.entry.navn)}` : ''}${plass === 0 && neste.length > 1 ? ' <small>vanligst</small>' : ''}</button>`).join('')}</div>`;
  panel().innerHTML = `${trenerBoble(tekst)}<div class="ap-kontroller">${valg}</div><div class="ap-navigasjon"><button type="button" class="button secondary" data-nav="start" ${node.san ? '' : 'disabled'} aria-label="Til start">⏮</button><button type="button" class="button secondary" data-nav="tilbake" ${node.san ? '' : 'disabled'}>◀ Tilbake</button><button type="button" class="button secondary" data-nav="frem" ${neste.length ? '' : 'disabled'}>Frem ▶</button></div><p class="ap-tips">Tips: piltastene ← → blar når brettet ikke har fokus.</p>`;
  gjenopprettFokus(fokus);
  const frem = () => { if (!neste.length) return; const mest = [...neste].sort((x, y) => (y.entry.vekt ?? 1) - (x.entry.vekt ?? 1))[0]; visLaer(apning, mest); };
  panel().querySelectorAll('[data-barn]').forEach(k => k.addEventListener('click', () => visLaer(apning, neste[Number(k.dataset.barn)])));
  panel().querySelector('[data-gaa]')?.addEventListener('click', () => visLaer(apning, node.overgang));
  panel().querySelector('[data-nav="start"]').addEventListener('click', () => visLaer(apning, apning.rot));
  panel().querySelector('[data-nav="tilbake"]').addEventListener('click', () => visLaer(apning, node.forelder ?? apning.rot));
  panel().querySelector('[data-nav="frem"]').addEventListener('click', frem);
  tastLytter = event => {
    if (event.target.closest?.('.ap-brett, input, select, textarea')) return;
    if (event.key === 'ArrowRight') { event.preventDefault(); frem(); }
    if (event.key === 'ArrowLeft' && node.san) { event.preventDefault(); visLaer(apning, node.forelder); }
  };
}

function visSidelinje(apning, linje, i) {
  const fokus = fokusNokkel();
  stopp();
  tilstand.fane = 'laer';
  respons();
  const chess = new Chess(apning.startFen);
  for (const m of linje.trekk.slice(0, i)) chess.move(m.san);
  const sist = linje.trekk[i - 1];
  brett.sett({ fen: chess.fen(), orientering: apning.farge, sist: sist ? { from: sist.from, to: sist.to } : null, laast: true });
  linjeFelt().textContent = `${startNotasjon(apning)} ${stiFraTrekk(apning, linje.trekk.slice(0, i))}`;
  linjeFelt().scrollLeft = linjeFelt().scrollWidth;
  tilstand.naarTrekk = null;
  panel().innerHTML = `${trenerBoble(`<p class="eyebrow">SIDELINJE</p><p class="ap-sier"><strong>${esc(linje.navn)}</strong></p><p>${esc(linje.tekst)}</p>${linje.kilde ? `<p class="ap-kilde">Kilde: ${esc(linje.kilde)}</p>` : ''}<p>Trekk ${i} av ${linje.trekk.length}.</p>`)}<div class="ap-navigasjon to"><button type="button" class="button secondary" data-s="-1" ${i ? '' : 'disabled'}>◀ Tilbake</button><button type="button" class="button secondary" data-s="1" ${i < linje.trekk.length ? '' : 'disabled'}>Frem ▶</button></div><a class="button secondary ap-bred" href="#/a/${apning.id}/om">Tilbake til åpningen</a>`;
  panel().querySelectorAll('[data-s]').forEach(k => k.addEventListener('click', () => visSidelinje(apning, linje, i + Number(k.dataset.s))));
  gjenopprettFokus(fokus);
  tastLytter = event => {
    if (event.target.closest?.('.ap-brett, input, select, textarea')) return;
    if (event.key === 'ArrowRight' && i < linje.trekk.length) visSidelinje(apning, linje, i + 1);
    if (event.key === 'ArrowLeft' && i) visSidelinje(apning, linje, i - 1);
  };
}

// ---------- Practice ----------
function startOv(apning, forrigeId = null) {
  stopp();
  const { linje, grunn } = rep.velgLinje(apning, fremgang, Date.now(), forrigeId);
  tilstand = { ...tilstand, fane: 'ov', ov: { linje, grunn, i: 0, feil: 0, forsok: 0, vist: false, melding: null, stemning: '' } };
  spillOv(apning);
}

function ovStatus(apning) {
  const s = rep.statusFor(apning, fremgang);
  return `<div class="ap-ovstatus"><span><b>${s.laert}</b>/${s.totalt} lært</span><span><b>${s.forfaller}</b> til repetisjon</span><span><b>${s.nye}</b> nye</span></div>`;
}

function spillOv(apning) {
  const fokus = fokusNokkel();
  const ov = tilstand.ov;
  const { linje, blandet } = ov;
  const noder = ov.noder ?? linje.noder;
  const forrige = ov.i ? noder[ov.i - 1] : ov.rot ?? apning.rot;
  const neste = noder[ov.i];
  const ferdig = !neste;
  const linjeNavn = blandet ? `${apning.navn} · ${linje.navn}` : linje.navn;
  const videre = () => (blandet ? startBlandet(blandet.farge, blandet.nokkel) : startOv(apning, linje.id));
  if (blandet) oppslag = oppslagFor(apning);
  const ekstraPiler = ov.feilPil ? [ov.feilPil] : [];
  if (ov.vist && neste) ekstraPiler.push({ fra: neste.fra, til: neste.til, type: 'hint' });
  brett.sett({ fen: forrige.fen, orientering: apning.farge, sist: forrige.san ? { from: forrige.fra, to: forrige.til } : null, piler: ekstraPiler, laast: ferdig || !neste.rep });
  settLinje(blandet ? { startTrekk: [] } : apning, noder.slice(0, ov.i), forrige, null);
  const grunn = { repetisjon: 'Repetisjon', ny: 'Ny linje', ekstra: 'Ekstrarunde' }[ov.grunn];
  let tekst;
  if (ferdig) {
    const post = rep.linjePost(fremgang, apning.id, linje.id);
    const nar = post.boks === 0 ? 'Den kommer tilbake snart, så vi får den til å sitte.' : `Neste repetisjon om ${flertall(rep.dagerTil(post.forfall), 'dag', 'dager')}.`;
    const siste = linje.noder.at(-1);
    tekst = `<p class="eyebrow">${esc(grunn)} · ${esc(linjeNavn)}</p><p class="ap-sier"><strong>${ov.feil ? `Linjen er gjennomført med ${flertall(ov.feil, 'feil', 'feil')}.` : 'Feilfritt! Linjen sitter.'}</strong> ${nar}</p>${siste.entry.plan ? `<p><span class="ap-etikett plan">Planen videre</span>${esc(siste.entry.plan)}</p>` : ''}${siste.overgang ? `<p><span class="ap-etikett plan">Omstilling</span>Her går vi over i ${esc(stiTekst(veiTil(siste.overgang)))} – den øver vi på i en annen linje.</p>` : ''}`;
  } else if (ov.melding) tekst = ov.melding;
  else if (neste.rep) tekst = `<p class="eyebrow">${esc(grunn)} · ${esc(linjeNavn)}</p><p class="ap-sier">${ov.i === 0 ? 'Vi begynner.' : ''} Din tur – hva spiller vi i repertoaret her?</p>`;
  else tekst = `<p class="eyebrow">${esc(grunn)} · ${esc(linjeNavn)}</p><p class="ap-sier">Motstanderen tenker …</p>`;
  const knapper = ferdig
    ? `<button type="button" class="button primary" data-ov="neste">Neste linje ▶</button><button type="button" class="button secondary" data-ov="laer">Se linjen i Lær</button>`
    : neste.rep ? `<button type="button" class="button secondary" data-ov="vis">${ov.vist ? 'Trekket vises' : 'Vis trekket'}</button><button type="button" class="button secondary" data-ov="hopp">Ny linje</button>` : '';
  respons(ferdig ? (ov.feil ? `Gjennomført med ${flertall(ov.feil, 'feil', 'feil')}.` : 'Feilfritt! Linjen sitter.') : ov.kort ?? (neste.rep ? 'Din tur.' : 'Motstanderen tenker …'), ferdig ? (ov.feil ? '' : 'bra') : ov.stemning);
  const egne = blandet ? [] : rep.vansker({ feil: { [apning.id]: fremgang.feil[apning.id] ?? {} } }, 2).map(v => apning.noder.get(v.sti)?.barn[0]).filter(Boolean);
  panel().innerHTML = `${trenerBoble(tekst, { stemning: ov.stemning })}<div class="ap-kontroller ap-rad">${knapper}</div>${blandet ? blandetStatus() : ovStatus(apning)}${egne.length ? `<p class="ap-tips">${TRENER.navn} har lagt merke til at du oftest bommer på ${egne.map(n => esc(medNummer(n))).join(' og ')}.</p>` : ''}`;
  panel().querySelector('[data-ov="neste"]')?.addEventListener('click', videre);
  // Skipping after a mistake still counts the line as failed, so it comes back soon.
  panel().querySelector('[data-ov="hopp"]')?.addEventListener('click', () => { if (ov.feil) { rep.vurderLinje(fremgang, apning.id, linje.id, ov.feil); lagre(); } videre(); });
  panel().querySelector('[data-ov="laer"]')?.addEventListener('click', () => gaaTil(`#/a/${apning.id}/laer`, () => visLaer(apning, linje.noder.at(-1))));
  panel().querySelector('[data-ov="vis"]')?.addEventListener('click', () => { if (!ov.vist) { ov.vist = true; ov.feil += 1; notertFeil('(vis)'); } spillOv(apning); });
  gjenopprettFokus(fokus);
  tastLytter = null;
  // The moves before the tree have no place in the mistake list.
  function notertFeil(san) {
    if (forrige.sti === null || forrige.sti === undefined) return;
    rep.noterFeil(fremgang, apning.id, forrige.sti, san);
    lagre();
  }
  tilstand.naarTrekk = trekk => {
    if (ferdig || !neste.rep) return;
    // Another chosen opening is no mistake: the drill follows the move that was played.
    const annen = blandet && trekk.san !== neste.san ? velgBlandetLinje(valgte(), fremgang, { farge: apning.farge, spilt: [...noder.slice(0, ov.i).map(n => n.san), trekk.san] }) : null;
    if (annen) {
      Object.assign(ov, { linje: annen.linje, noder: annen.noder, grunn: annen.grunn, blandet: { ...blandet, nokkel: annen.nokkel } });
      spillOv(annen.apning);
      tilstand.naarTrekk(trekk);
      return;
    }
    if (trekk.san === neste.san) {
      ov.i += 1; ov.forsok = 0; ov.vist = false; ov.feilPil = null; ov.stemning = 'bra';
      const ros = tilfeldig(ROS);
      ov.melding = `<p class="ap-sier"><strong>${ros}</strong> ${esc(medNummer(neste))} – ${esc(neste.entry.hva)}</p>`;
      ov.kort = `${ros} ${medNummer(neste)}`;
      if (ov.i >= noder.length) { rep.vurderLinje(fremgang, apning.id, linje.id, ov.feil); lagre(); }
      spillOv(apning);
      return;
    }
    ov.forsok += 1;
    ov.feil += 1;
    ov.stemning = 'feil';
    notertFeil(trekk.san);
    ov.feilPil = { fra: trekk.from, til: trekk.to, type: 'fare' };
    if (ov.forsok >= 2) ov.vist = true;
    ov.kort = `${neste.nummer}${norsk(trekk.san)} er ikke repertoartrekket – ${ov.vist ? 'følg den rosa pilen' : 'prøv igjen'}.`;
    ov.melding = `<p class="ap-sier">${esc(feilKommentar(trekk.san, neste))}</p><p>${ov.vist ? 'Den rosa pilen viser trekket. Spill det på brettet.' : 'Prøv igjen!'}</p>`;
    brett.rist();
    spillOv(apning);
  };
  if (!ferdig && !neste.rep) {
    timer = setTimeout(() => {
      ov.i += 1; ov.feilPil = null;
      const svar = noder[ov.i];
      ov.stemning = '';
      ov.kort = svar ? `Motstanderen spilte ${medNummer(neste)}. Din tur.` : null;
      ov.melding = svar ? `<p class="eyebrow">${esc(grunn)} · ${esc(linjeNavn)}</p><p class="ap-sier">Motstanderen spilte <strong>${esc(medNummer(neste))}</strong>. ${esc(neste.entry.hva)}</p><p>Din tur.</p>` : null;
      if (!svar) { rep.vurderLinje(fremgang, apning.id, linje.id, ov.feil); lagre(); }
      spillOv(apning);
    }, ov.i === 0 ? 700 : 550);
  }
}

// ---------- Mixed drill ----------
const BLANDET_TITTEL = { w: 'Øv repertoaret som hvit', b: 'Øv repertoaret som svart' };

function blandetStatus() {
  const s = valgte().map(apning => rep.statusFor(apning, fremgang)).reduce((sum, d) => ({ totalt: sum.totalt + d.totalt, laert: sum.laert + d.laert, forfaller: sum.forfaller + d.forfaller, nye: sum.nye + d.nye }), { totalt: 0, laert: 0, forfaller: 0, nye: 0 });
  return `<div class="ap-ovstatus"><span><b>${s.laert}</b>/${s.totalt} lært</span><span><b>${s.forfaller}</b> til repetisjon</span><span><b>${s.nye}</b> nye</span></div>`;
}

function visBlandet(farge) {
  const utvalg = valgte().filter(apning => !farge || apning.farge === farge);
  if (!utvalg.length) { location.hash = '#/repertoar'; return; }
  const tittel = BLANDET_TITTEL[farge] ?? 'Øv hele repertoaret';
  document.title = `${tittel} · Åpninger`;
  tilstand = {};
  lagBrettside(`<nav class="ap-tilbake"><a href="#/repertoar">← Mitt repertoar</a></nav><header class="ap-apning-topp"><p class="eyebrow">MITT REPERTOAR</p><h1>${tittel}</h1><p class="ap-startlinje">Fra første trekk. Motstanderen velger, og du følger åpningen du har valgt.</p></header>`);
  startBlandet(farge);
}

function startBlandet(farge, forrige = null) {
  stopp();
  const valg = velgBlandetLinje(valgte(), fremgang, { farge, forrige });
  tilstand = { ...tilstand, fane: 'ov', ov: { linje: valg.linje, noder: valg.noder, rot: { fen: new Chess().fen(), san: null, sti: null }, grunn: valg.grunn, blandet: { farge, nokkel: valg.nokkel }, i: 0, feil: 0, forsok: 0, vist: false, melding: null, stemning: '' } };
  spillOv(valg.apning);
}

// ---------- Traps ----------
function visFeller(apning, valgt = null) {
  const fokus = fokusNokkel();
  stopp();
  tastLytter = null;
  tilstand.naarTrekk = null;
  if (!valgt) {
    evalbar.hold(false);
    brett.sett({ fen: apning.startFen, orientering: apning.farge, laast: true });
    settLinje(apning, [], null);
    respons();
    panel().innerHTML = apning.feller.length
      ? `${trenerBoble(`<p class="ap-sier">Feller er korte drill: finn trekkene som straffer en vanlig feil – eller unngå fella selv.</p>`, { live: false })}<div class="ap-felleliste">${apning.feller.map((f, i) => `<button type="button" class="ap-felle" data-felle="${i}"><span>${f.type === 'unngå' ? 'Unngå' : 'Slå til'}${fremgang.feller?.[`${apning.id}|${f.id}`] ? ' · ✓ løst' : ''}</span><b>${esc(f.navn)}</b></button>`).join('')}</div>`
      : trenerBoble('<p>Ingen feller for denne åpningen ennå.</p>', { live: false });
    panel().querySelectorAll('[data-felle]').forEach(k => k.addEventListener('click', () => visFeller(apning, { felle: apning.feller[Number(k.dataset.felle)], i: 0, feil: 0, melding: '' })));
    gjenopprettFokus(fokus);
    return;
  }
  const { felle } = valgt;
  const chess = new Chess(felle.fen);
  // An accepted alternative ('godta') replaces the main move, so the board and notation show what was played.
  const spilt = valgt.spilt ? [valgt.spilt, ...felle.losning.slice(1)] : felle.losning;
  for (const m of spilt.slice(0, valgt.i)) chess.move(m.san);
  const sist = valgt.i ? spilt[valgt.i - 1] : felle.forTrekk.at(-1);
  const ferdig = valgt.i >= felle.losning.length;
  const minTur = !ferdig && felle.losning[valgt.i].color === felle.side;
  // The number would give the trap away, so the bar waits until it is solved.
  evalbar.hold(!ferdig);
  brett.sett({ fen: chess.fen(), orientering: felle.side, sist: sist ? { from: sist.from, to: sist.to } : null, laast: !minTur, piler: valgt.vis && !ferdig ? [{ fra: felle.losning[valgt.i].from, til: felle.losning[valgt.i].to, type: 'hint' }] : [] });
  linjeFelt().textContent = `${startNotasjon(apning)} ${stiFraTrekk(apning, [...felle.forTrekk, ...spilt.slice(0, valgt.i)])}`;
  linjeFelt().scrollLeft = linjeFelt().scrollWidth;
  respons(ferdig ? (valgt.feil ? 'Løst!' : 'Perfekt – rett i fella!') : valgt.kort ?? '', ferdig ? 'bra' : valgt.stemning ?? '');
  const tekst = ferdig
    ? `<p class="ap-sier"><strong>${valgt.feil ? 'Løst!' : 'Perfekt – rett i fella!'}</strong></p>${valgt.spilt ? `<p>Du spilte ${esc(norsk(valgt.spilt.san))} – det holder også. Hovedtrekket er ${esc(norsk(felle.losning[0].san))}.</p>` : ''}<p>${esc(felle.forklaring)}</p>`
    : `<p class="eyebrow">${felle.type === 'unngå' ? 'UNNGÅ FELLA' : 'SLÅ TIL'} · ${esc(felle.navn)}</p>${valgt.melding || `<p class="ap-sier">${esc(felle.tekst)}</p>`}`;
  panel().innerHTML = `${trenerBoble(tekst, { stemning: valgt.stemning ?? '' })}<div class="ap-kontroller ap-rad">${ferdig ? '<button type="button" class="button primary" data-f="liste">Flere feller</button><button type="button" class="button secondary" data-f="igjen">Ta den igjen</button>' : '<button type="button" class="button secondary" data-f="vis">Vis trekket</button><button type="button" class="button secondary" data-f="liste">Alle feller</button>'}</div>`;
  panel().querySelector('[data-f="liste"]').addEventListener('click', () => visFeller(apning));
  panel().querySelector('[data-f="igjen"]')?.addEventListener('click', () => visFeller(apning, { felle, i: 0, feil: 0 }));
  panel().querySelector('[data-f="vis"]')?.addEventListener('click', () => visFeller(apning, { ...valgt, vis: true, feil: valgt.feil + 1 }));
  gjenopprettFokus(fokus);
  if (ferdig) { (fremgang.feller ??= {})[`${apning.id}|${felle.id}`] = { lost: Date.now(), feil: valgt.feil }; lagre(); return; }
  if (!minTur) { timer = setTimeout(() => visFeller(apning, { ...valgt, i: valgt.i + 1, vis: false, kort: `Motstanderen svarte ${norsk(felle.losning[valgt.i].san)}. Fortsett!`, melding: `<p class="ap-sier">Motstanderen svarte ${esc(norsk(felle.losning[valgt.i].san))}. Fortsett!</p>` }), 600); return; }
  tilstand.naarTrekk = trekk => {
    const riktig = felle.losning[valgt.i];
    // Single-move 'avoid' drills may accept other safe moves.
    if (valgt.i === 0 && felle.losning.length === 1 && felle.godta?.includes(trekk.san)) { visFeller(apning, { ...valgt, i: 1, stemning: 'bra', spilt: trekk }); return; }
    const ros = tilfeldig(ROS);
    if (trekk.san === riktig.san) visFeller(apning, { ...valgt, i: valgt.i + 1, vis: false, stemning: 'bra', kort: `${ros} ${norsk(trekk.san)}.`, melding: `<p class="ap-sier"><strong>${ros}</strong> ${esc(norsk(trekk.san))}.</p>` });
    else { brett.rist(); visFeller(apning, { ...valgt, feil: valgt.feil + 1, vis: valgt.feil >= 1, stemning: 'feil', kort: `${norsk(trekk.san)} er ikke det sterkeste – prøv igjen.`, melding: `<p class="ap-sier">${esc(norsk(trekk.san))} er ikke det sterkeste her. ${valgt.feil >= 1 ? 'Den rosa pilen viser veien.' : 'Se etter sjakker, slag og trusler.'}</p>` }); }
  };
}

// ---------- Routing ----------
function rute() {
  const [, side, id, fane] = location.hash.split('/');
  tastLytter = null;
  stopp();
  if (side === 'a' && id) visApning(id, ['om', 'laer', 'ov', 'feller'].includes(fane) ? fane : 'laer');
  else if (side === 'repertoar' && id === 'kort') visKortokt(ui);
  else if (side === 'repertoar' && id === 'ov') visBlandet(['w', 'b'].includes(fane) ? fane : null);
  else if (side === 'repertoar') { tilstand = {}; ui.brettBort(); visRepertoar(ui); }
  else { tilstand = {}; visBibliotek(); }
}

document.addEventListener('keydown', event => tastLytter?.(event));
window.addEventListener('hashchange', () => { rute(); main.focus({ preventScroll: true }); window.scrollTo({ top: 0 }); });
window.addEventListener('storage', event => { if (event.key === rep.NOKKEL) fremgang = rep.lesFremgang(lager); });

try {
  await last();
  rute();
} catch (error) {
  console.error(error);
  main.innerHTML = '<p class="form-error" role="alert">Klarte ikke å hente åpningene. Prøv å laste siden på nytt.</p>';
}

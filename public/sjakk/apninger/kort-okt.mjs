// A flashcard session: drops the player into positions from the repertoire, one card at a time.
import { Chess } from '../vendor/chess.mjs';
import { piler } from './brett.mjs';
import { INTERVALL_DAGER, noterFeil } from './repetisjon.mjs';
import { forfallerIMorgen, kortKo, lagOkt, svarKort, vanskeligst } from './kort.mjs';
import { ROS, esc, feilKommentar, medNummer, norsk, stor } from './trener.mjs';
import { flertall, sanTekst, trenerBoble } from './ui.mjs';

const STEG = 300;
const FORSTE_PAUSE = 380;
const HALVTREKK = 4;
const HALVTREKK_IGJEN = 2;

// Every "Ta flere" lasts until the page reloads.
let ekstra = 0;

export const klareKort = ui => kortKo(ui.kort(), ui.fremgang(), Date.now(), ekstra);
const rolig = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
const tilfeldig = liste => liste[Math.floor(Math.random() * liste.length)];
const tilbake = '<nav class="ap-tilbake"><a href="#/repertoar">← Mitt repertoar</a></nav>';

function nesteGang(post) {
  const dager = INTERVALL_DAGER[post.boks];
  if (!dager) return 'Den kommer snart igjen.';
  return dager === 1 ? 'Neste gang i morgen.' : `Neste gang om ${dager} dager.`;
}

// What stays on screen after every answer: why the move is played, and the plan at the end of a line.
function forklaringFor(kort, san, { ideErSagt = false } = {}) {
  const kilder = kort.kilder.filter(kilde => kilde.san === san);
  const node = kilder.find(kilde => kilde.node)?.node;
  const felle = kilder.find(kilde => kilde.felle)?.felle;
  const deler = [];
  if (node?.entry.ide && !ideErSagt) deler.push(`<p><span class="ap-etikett">Idé</span>${esc(stor(node.entry.ide))}</p>`);
  if (node?.entry.vurdering) deler.push(`<p><span class="ap-etikett ærlig">Ærlig talt</span>${esc(node.entry.vurdering)}</p>`);
  if (node?.entry.plan && !node.barn.length) deler.push(`<p><span class="ap-etikett plan">Planen videre</span>${esc(node.entry.plan)}</p>`);
  if (felle) {
    deler.push(`<p><span class="ap-etikett fare">Felle</span>${esc(felle.forklaring)}</p>`);
    if (felle.losning.length > 1) deler.push(`<p class="ap-kilde">Hele løsningen: ${esc(felle.losning.map(m => norsk(m.san)).join(' '))}</p>`);
  }
  return deler.join('');
}

function feilTekst(kort, spilt) {
  const hoved = kort.kilder.find(kilde => kilde.node) ?? kort.kilder[0];
  const andre = kort.trekk.filter(san => san !== hoved.san);
  const tillegg = andre.length ? ` ${andre.map(norsk).join(' og ')} er også i repertoaret ditt.` : '';
  if (hoved.node) return feilKommentar(spilt, hoved.node) + tillegg;
  return `Du spilte ${norsk(spilt)}, men her er ${norsk(hoved.san)} trekket.${tillegg}`;
}

// The screen without a board: nothing chosen, nothing ready, or the session summary.
function tekstSide(ui, innhold) {
  ui.brettBort();
  ui.main.innerHTML = `${tilbake}<section class="ap-hero ap-rep-hero">${trenerBoble(innhold, { live: false })}</section>`;
}

function intetKlart(ui, ko) {
  const iMorgen = forfallerIMorgen(ui.kort(), ui.fremgang());
  tekstSide(ui, `<p class="eyebrow">KORT</p><h1>Ingen kort akkurat nå</h1><p>${iMorgen ? `Godt jobbet! ${flertall(iMorgen, 'kort kommer', 'kort kommer')} tilbake i morgen.` : 'Godt jobbet! Du er à jour.'}</p>${ko.flere ? '<button type="button" class="button primary" data-flere>Ta flere</button>' : '<a class="button secondary" href="#/repertoar">Til repertoaret</a>'}`);
  ui.main.querySelector('[data-flere]')?.addEventListener('click', () => { ekstra += 1; visKortokt(ui); });
}

function oppsummering(ui, okt) {
  const fremgang = ui.fremgang();
  const iMorgen = forfallerIMorgen(ui.kort(), fremgang);
  const tunge = vanskeligst(okt);
  const igjen = klareKort(ui);
  const dom = okt.riktige === okt.totalt ? 'Alt satt på første forsøk!' : okt.riktige * 2 >= okt.totalt ? 'Godt jobbet. Det som glapp, tar vi igjen snart.' : 'Dette var harde kort, og det er derfor vi øver. De kommer tilbake til de sitter.';
  const flere = igjen.kort.length || igjen.flere;
  tekstSide(ui, `<p class="eyebrow">KORT · FERDIG</p><h1>${esc(dom)}</h1>`);
  ui.main.insertAdjacentHTML('beforeend', `
    <div class="ap-ovstatus ap-okt-tall"><span><b>${okt.riktige}</b>av ${okt.totalt} riktig</span><span><b>${okt.hint}</b>med hint</span><span><b>${iMorgen}</b>i morgen</span></div>
    ${tunge.length ? `<section class="ap-gruppe ap-okt-tunge"><h2>Disse var tyngst</h2><ul class="ap-felleliste">${tunge.map(({ kort, antall }, i) => { const kilde = kort.kilder[0]; return `<li><button type="button" class="ap-felle" data-tung="${i}"><span>${esc(kilde.apning.navn)} · ${flertall(antall, 'bom', 'bom')}</span><b>${esc(kilde.linje)}</b><small>${esc(sanTekst(kilde.forTrekk))}</small></button></li>`; }).join('')}</ul></section>` : ''}
    <div class="ap-kontroller ap-rad ap-okt-slutt">${flere ? '<button type="button" class="button primary" data-flere>Ta flere</button>' : ''}<a class="button ${flere ? 'secondary' : 'primary'}" href="#/repertoar">Til repertoaret</a></div>`);
  ui.main.querySelector('[data-flere]')?.addEventListener('click', () => { if (!igjen.kort.length) ekstra += 1; visKortokt(ui); });
  ui.main.querySelectorAll('[data-tung]').forEach(knapp => knapp.addEventListener('click', () => {
    const kilde = tunge[Number(knapp.dataset.tung)].kort.kilder[0];
    if (kilde.node) ui.apneStilling(kilde.apning, kilde.node.forelder);
    else location.hash = `#/a/${kilde.apning.id}/feller`;
  }));
}

export function visKortokt(ui) {
  ui.stopp();
  ui.settTast(null);
  document.title = 'Kort · Åpninger';
  if (!ui.valgte().length) {
    tekstSide(ui, `<p class="eyebrow">KORT</p><h1>Velg åpningene dine først</h1><p>Kortene kommer fra repertoaret ditt, så vi begynner der.</p><a class="button primary" href="#/repertoar">Til repertoaret</a>`);
    return;
  }
  const ko = klareKort(ui);
  if (!ko.kort.length) { intetKlart(ui, ko); return; }

  const okt = lagOkt(ko.kort);
  const { brett, evalbar, panel, linje } = ui.brettside(`<header class="ap-okt-topp"><a href="#/repertoar">← Avslutt</a><span class="ap-okt-teller" id="ap-okt-teller"></span><span class="ap-spor"><span id="ap-okt-fremdrift"></span></span></header>`);
  const teller = ui.main.querySelector('#ap-okt-teller');
  const fremdrift = ui.main.querySelector('#ap-okt-fremdrift');
  let aktiv = null;

  // Plays the last half-moves in, so the player arrives in the position and is not just shown it.
  function spillInn(kort, kilde, naarFerdig) {
    const chess = new Chess();
    const fener = [chess.fen()];
    const trekk = kilde.forTrekk.map(san => { const m = chess.move(san); fener.push(chess.fen()); return m; });
    const sist = i => (i ? { from: trekk[i - 1].from, to: trekk[i - 1].to } : null);
    const siste = trekk.length;
    let i = rolig() ? siste : Math.max(0, siste - (okt.vurdert.has(kort.id) ? HALVTREKK_IGJEN : HALVTREKK));
    brett.sett({ fen: fener[i], orientering: kort.farge, sist: sist(i), laast: i < siste });
    if (i === siste) { naarFerdig(sist(i)); return; }
    const steg = () => {
      i += 1;
      brett.sett({ fen: fener[i], sist: sist(i), laast: i < siste, gli: true });
      if (i < siste) ui.etter(STEG, steg);
      else naarFerdig(sist(i));
    };
    ui.etter(FORSTE_PAUSE, steg);
  }

  function visSporsmal() {
    const { kort, kilde, igjen, ny } = aktiv;
    const eyebrow = `${esc(kilde.apning.navn.toUpperCase())} · ${esc(kilde.linje)}`;
    const sporsmal = kilde.felle && !kilde.node ? esc(kilde.felle.tekst) : igjen ? 'Denne tar vi en gang til. Hva spiller du?' : ny ? 'Ny stilling. Hva spiller du her?' : 'Hva spiller du her?';
    panel.innerHTML = `${trenerBoble(`<p class="eyebrow">${eyebrow}</p><p class="ap-sier">${sporsmal}</p>`)}<div class="ap-kontroller ap-rad"><button type="button" class="button secondary" data-hint ${aktiv.klar && !aktiv.hint ? '' : 'disabled'}>${aktiv.hint ? 'Brikken er merket' : 'Hint'}</button></div>`;
    panel.querySelector('[data-hint]').addEventListener('click', () => {
      aktiv.hint = true;
      brett.sett({ sist: aktiv.sist, merket: kort.kilder.map(k => k.fra) });
      ui.respons('Brikken er merket.');
      visSporsmal();
    });
  }

  function visKort() {
    const kort = okt.ko[0];
    if (!kort) { oppsummering(ui, okt); return; }
    const kilde = kort.kilder.find(k => k.node) ?? kort.kilder[0];
    aktiv = { kort, kilde, igjen: okt.vurdert.has(kort.id), ny: !ui.fremgang().kort[kort.id], hint: false, klar: false, sist: null };
    ui.brukOppslag(kilde.apning);
    evalbar.hold(true);
    ui.settTrekk(null);
    ui.settTast(null);
    ui.respons();
    teller.textContent = aktiv.igjen ? `En gang til · ${okt.ko.length} igjen` : `Kort ${okt.vurdert.size + 1} av ${okt.totalt}`;
    fremdrift.style.width = `${Math.round(okt.vurdert.size / okt.totalt * 100)}%`;
    linje.textContent = sanTekst(kilde.forTrekk);
    linje.scrollLeft = linje.scrollWidth;
    visSporsmal();
    spillInn(kort, kilde, sist => {
      aktiv.klar = true;
      aktiv.sist = sist;
      ui.settTrekk(svar);
      visSporsmal();
    });
  }

  function svar(trekk) {
    const { kort, kilde, sist, hint, igjen } = aktiv;
    const fremgang = ui.fremgang();
    const riktig = kort.trekk.includes(trekk.san);
    const post = svarKort(okt, kort, riktig ? (hint ? 'hint' : 'riktig') : 'feil', fremgang);
    if (!riktig && !igjen && kilde.node) noterFeil(fremgang, kilde.apning.id, kilde.sti, trekk.san);
    ui.lagre();
    ui.settTrekk(null);
    let tekst;
    if (riktig) {
      const treff = kort.kilder.find(k => k.san === trekk.san && k.node) ?? kort.kilder.find(k => k.san === trekk.san);
      const etter = new Chess(brett.chess.fen());
      etter.move(trekk.san);
      brett.sett({ fen: etter.fen(), sist: { from: trekk.from, to: trekk.to }, laast: true, piler: piler(treff.node?.entry.piler), gli: true });
      const ros = hint ? 'Riktig, med litt hjelp.' : tilfeldig(ROS);
      const hva = treff.node ? ` ${esc(medNummer(treff.node))} – ${esc(treff.node.entry.hva)}` : ` ${esc(norsk(trekk.san))}.`;
      tekst = `<p class="ap-sier"><strong>${ros}</strong>${hva}</p>${forklaringFor(kort, trekk.san)}`;
      ui.respons(`${ros} ${norsk(trekk.san)}`, 'bra');
    } else {
      brett.rist();
      brett.sett({ sist, laast: true, piler: [{ fra: trekk.from, til: trekk.to, type: 'fare' }, ...kort.kilder.map(k => ({ fra: k.fra, til: k.til, type: 'hint' }))] });
      const vanlig = kilde.node?.entry.vanligeFeil?.[trekk.san];
      tekst = `<p class="ap-sier">${esc(feilTekst(kort, trekk.san))}</p>${forklaringFor(kort, kilde.san, { ideErSagt: !vanlig })}`;
      ui.respons(`Her vil vi spille ${norsk(kilde.san)}.`, 'feil');
    }
    evalbar.hold(false);
    const fremover = !riktig ? 'Den kommer tilbake om litt.' : post ? (hint ? `Den blir stående der den var. ${nesteGang(post)}` : nesteGang(post)) : 'Nå satt den.';
    const siste = okt.ko.length === 1;
    panel.innerHTML = `${trenerBoble(`<p class="eyebrow">${esc(kilde.apning.navn.toUpperCase())} · ${esc(kilde.linje)}</p>${tekst}<p class="ap-kilde">${fremover}</p>`, { stemning: riktig ? 'bra' : 'feil' })}<div class="ap-kontroller ap-okt-neste"><button type="button" class="button primary" data-neste>${siste ? 'Se oppsummering ▶' : 'Neste kort ▶'}</button></div>`;
    const neste = () => { okt.ko.shift(); visKort(); };
    const knapp = panel.querySelector('[data-neste]');
    knapp.addEventListener('click', neste);
    // A keyboard player moves on with the button; everyone else has Enter anyway, without a focus ring.
    if (ui.main.querySelector('.ap-brett :focus-visible')) knapp.focus({ preventScroll: true });
    ui.settTast(event => {
      if (event.key === 'Enter' && !event.target.closest?.('a, button:not(.square)')) { event.preventDefault(); neste(); }
    });
  }

  visKort();
}

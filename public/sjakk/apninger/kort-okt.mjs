// A flashcard session: drops the player into positions from the repertoire, one card at a time.
import { Chess } from '../vendor/chess.mjs';
import { piler } from './brett.mjs';
import { INTERVALL_DAGER, noterFeil } from './repetisjon.mjs';
import { dagStart, forfallerIMorgen, introSett, kortKo, lagOkt, merkIntro, nesteEkstra, nesteSteg, oktTekst, svarKort, vanskeligst, vistKort } from './kort.mjs';
import { ROS, esc, feilKommentar, medNummer, norsk, stor } from './trener.mjs';
import { flertall, forsteSetning, sanTekst, startNotasjon, trenerBoble } from './ui.mjs';
import { veiInnTrekk } from './repertoar.mjs';

const STEG = 300;
const FORSTE_PAUSE = 380;
const HALVTREKK = 4;
const HALVTREKK_IGJEN = 2;

// "Ta flere" lasts for the day, or until the page reloads.
let ekstra = { dag: 0, antall: 0 };
const ekstraIDag = naa => (ekstra.dag === dagStart(naa) ? ekstra.antall : 0);

export function klareKort(ui) {
  const naa = Date.now();
  return kortKo(ui.kort(), ui.fremgang(), naa, ekstraIDag(naa));
}

export function taFlere(ui) {
  const naa = Date.now();
  ekstra = { dag: dagStart(naa), antall: nesteEkstra(ui.kort(), ui.fremgang(), naa, ekstraIDag(naa)) };
  visKortokt(ui);
}

// The one button at the top of the library and the repertoire page. It always says what to do next.
export function nesteStegHtml(ui) {
  const valgte = ui.valgte().length;
  const steg = nesteSteg(valgte, valgte ? klareKort(ui) : null);
  const boks = ({ eyebrow, tittel, tekst, knapper }) => `<section class="ap-neste" aria-label="Neste steg"><div class="ap-neste-tekst"><p class="eyebrow">${eyebrow}</p><h2>${tittel}</h2><p>${tekst}</p></div><div class="ap-neste-knapper">${knapper}</div></section>`;
  if (steg.type === 'bygg') return boks({ eyebrow: 'KOM I GANG', tittel: 'Bygg repertoaret', tekst: 'Noen korte spørsmål, ett om gangen. Så vet jeg hva jeg skal lære deg.', knapper: '<a class="button primary" href="#/repertoar/bygg">Begynn ▶</a>' });
  if (steg.type === 'okt') return boks({ eyebrow: 'NESTE STEG', tittel: 'Dagens økt', tekst: esc(oktTekst(steg)), knapper: '<a class="button primary" href="#/repertoar/kort">Start ▶</a>' });
  const iMorgen = forfallerIMorgen(ui.kort(), ui.fremgang());
  const senere = iMorgen ? `${flertall(iMorgen, 'kort kommer', 'kort kommer')} tilbake i morgen.` : 'Ingen kort venter nå.';
  if (steg.type === 'flere') return boks({ eyebrow: 'NESTE STEG', tittel: 'Dagens økt er gjort', tekst: `${senere} Har du lyst på mer, står nye kort klare.`, knapper: '<a class="button primary" href="#/repertoar/kort/flere">Ta flere nye kort ▶</a><a class="button secondary" href="#/repertoar/ov">Blandet øving</a>' });
  return boks({ eyebrow: 'NESTE STEG', tittel: 'Dagens økt er gjort', tekst: `${senere} Har du lyst på mer, kan du øve hele repertoaret fra første trekk.`, knapper: '<a class="button primary" href="#/repertoar/ov">Blandet øving ▶</a>' });
}

const rolig = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
const tilfeldig = liste => liste[Math.floor(Math.random() * liste.length)];
const tilbake = '<nav class="ap-tilbake"><a href="#/repertoar">← Mitt repertoar</a></nav>';

function nesteGang(post) {
  const dager = INTERVALL_DAGER[post.boks];
  if (!dager) return 'Den kommer snart igjen.';
  return dager === 1 ? 'Neste gang i morgen.' : `Neste gang om ${dager} dager.`;
}

// What stays on screen after every answer: why the move is played, and the plan at the end of a line.
function forklaringFor(kort, san, { ideErSagt = false, felleErSagt = false } = {}) {
  const kilder = kort.kilder.filter(kilde => kilde.san === san);
  const node = kilder.find(kilde => kilde.node)?.node;
  const felle = kilder.find(kilde => kilde.felle)?.felle;
  const inn = kilder.find(kilde => kilde.innledning);
  const deler = [];
  if (inn && !node) deler.push(`<p><span class="ap-etikett">Idé</span>Dette trekket tar deg inn i ${esc(inn.apning.navn)}.</p>`);
  if (node?.entry.ide && !ideErSagt) deler.push(`<p><span class="ap-etikett">Idé</span>${esc(stor(node.entry.ide))}</p>`);
  if (node?.entry.vurdering) deler.push(`<p><span class="ap-etikett ærlig">Ærlig talt</span>${esc(node.entry.vurdering)}</p>`);
  if (node?.entry.plan && !node.barn.length) deler.push(`<p><span class="ap-etikett plan">Planen videre</span>${esc(node.entry.plan)}</p>`);
  if (felle && !felleErSagt) {
    deler.push(`<p><span class="ap-etikett fare">Felle</span>${esc(felle.forklaring)}</p>`);
    if (felle.losning.length > 1) deler.push(`<p class="ap-kilde">Hele løsningen: ${esc(felle.losning.map(m => norsk(m.san)).join(' '))}</p>`);
  }
  return deler.join('');
}

// What the player is shown before playing a new move: the opponent's last move, then ours and why.
function laerTekst(kort, kilde) {
  const { node, felle, apning, san } = kilde;
  if (felle && !node) return `<p class="ap-sier">${esc(felle.tekst)}</p><p class="ap-sier">Trekket er <strong>${esc(norsk(san))}</strong>.</p><p><span class="ap-etikett fare">Felle</span>${esc(felle.forklaring)}</p>`;
  if (!node) return `<p class="ap-sier">Her spiller vi <strong>${esc(norsk(san))}</strong>.</p><p><span class="ap-etikett">Idé</span>Dette trekket tar deg inn i ${esc(apning.navn)}.</p>`;
  const motstander = node.forelder?.san ? `<p class="ap-motstander">${esc(medNummer(node.forelder))}: ${esc(node.forelder.entry.hva)}</p>` : '';
  return `${motstander}<p class="ap-sier"><strong>${esc(medNummer(node))}</strong> – ${esc(node.entry.hva)}</p><p><span class="ap-etikett">Idé</span>${esc(stor(node.entry.ide))}</p>`;
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
  tekstSide(ui, `<p class="eyebrow">DAGENS ØKT</p><h1>Ingen kort akkurat nå</h1><p>${iMorgen ? `Godt jobbet! ${iMorgen} kort kommer tilbake i morgen.` : 'Godt jobbet! Nå er du ajour.'}</p><div class="ap-tekst-knapper">${ko.flere ? '<button type="button" class="button primary" data-flere>Ta flere nye kort</button><a class="button secondary" href="#/repertoar/ov">Blandet øving</a>' : '<a class="button primary" href="#/repertoar/ov">Blandet øving</a><a class="button secondary" href="#/repertoar">Til repertoaret</a>'}</div>`);
  ui.main.querySelector('[data-flere]')?.addEventListener('click', () => taFlere(ui));
}

function oppsummering(ui, okt) {
  const fremgang = ui.fremgang();
  const iMorgen = forfallerIMorgen(ui.kort(), fremgang);
  const tunge = vanskeligst(okt);
  const igjen = klareKort(ui);
  const dom = okt.riktige === okt.totalt ? 'Alt satt på første forsøk!' : okt.riktige * 2 >= okt.totalt ? 'Godt jobbet. Det som glapp, tar vi igjen snart.' : 'Dette var harde kort, og det er derfor vi øver. De kommer tilbake til de sitter.';
  const flere = igjen.kort.length || igjen.flere;
  const laert = okt.vist.size ? `<p>Du lærte ${flertall(okt.vist.size, 'nytt trekk', 'nye trekk')}. De kommer tilbake i morgen, så de får satt seg.</p>` : '';
  tekstSide(ui, `<p class="eyebrow">DAGENS ØKT · FERDIG</p><h1>${esc(dom)}</h1>${laert}`);
  ui.main.insertAdjacentHTML('beforeend', `
    <div class="ap-ovstatus ap-okt-tall"><span><b>${okt.riktige}</b>av ${okt.totalt} riktig</span><span><b>${okt.hint}</b>med hint</span><span><b>${iMorgen}</b>i morgen</span></div>
    ${tunge.length ? `<section class="ap-gruppe ap-okt-tunge"><h2>Disse var tyngst</h2><ul class="ap-felleliste">${tunge.map(({ kort, antall }, i) => { const kilde = kort.kilder[0]; return `<li><button type="button" class="ap-felle" data-tung="${i}"><span>${esc(kilde.apning.navn)} · ${flertall(antall, 'bom', 'bom')}</span><b>${esc(kilde.linje)}</b><small>${esc(sanTekst(kilde.forTrekk))}</small></button></li>`; }).join('')}</ul></section>` : ''}
    <div class="ap-kontroller ap-rad ap-okt-slutt">${flere ? `<button type="button" class="button primary" data-flere>${igjen.kort.length ? `Fortsett med ${flertall(igjen.kort.length, 'kort', 'kort')} til` : 'Ta flere'}</button>` : ''}<a class="button ${flere ? 'secondary' : 'primary'}" href="#/repertoar">Til repertoaret</a></div>`);
  ui.main.querySelector('[data-flere]')?.addEventListener('click', () => { if (igjen.kort.length) visKortokt(ui); else taFlere(ui); });
  ui.main.querySelectorAll('[data-tung]').forEach(knapp => knapp.addEventListener('click', () => {
    const { kilder } = tunge[Number(knapp.dataset.tung)].kort;
    const kilde = kilder.find(k => k.node) ?? kilder[0];
    if (kilde.node) ui.apneStilling(kilde.apning, kilde.node.forelder);
    else location.hash = `#/a/${kilde.apning.id}/${kilde.felle ? 'feller' : 'laer'}`;
  }));
}

export function visKortokt(ui) {
  ui.stopp();
  ui.settTast(null);
  document.title = 'Dagens økt · Åpninger';
  if (!ui.valgte().length) {
    tekstSide(ui, `<p class="eyebrow">DAGENS ØKT</p><h1>Velg åpningene dine først</h1><p>Kortene kommer fra repertoaret ditt, så vi begynner der.</p><a class="button primary" href="#/repertoar/bygg">Bygg repertoaret</a>`);
    return;
  }
  const ko = klareKort(ui);
  if (!ko.kort.length) { intetKlart(ui, ko); return; }

  const okt = lagOkt(ko.klare, Math.random, ko.nyeKort);
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
    const { kort, kilde, igjen, fersk } = aktiv;
    // A trap's name can be the answer ("Rokade mot …Sxe4"), so it waits until the card is answered.
    const eyebrow = `${esc(kilde.apning.navn.toUpperCase())} · ${kilde.felle ? 'Felle' : esc(kilde.linje)}`;
    const sporsmal = kilde.felle && !kilde.node ? esc(kilde.felle.tekst) : igjen ? 'Denne tar vi en gang til. Hva spiller du?' : fersk ? 'Husker du denne? Hva spiller du her?' : 'Hva spiller du her?';
    panel.innerHTML = `${trenerBoble(`<p class="eyebrow">${eyebrow}</p><p class="ap-sier">${sporsmal}</p>`)}<div class="ap-kontroller ap-rad"><button type="button" class="button secondary" data-hint ${aktiv.klar && !aktiv.hint ? '' : 'disabled'}>${aktiv.hint ? 'Brikken er merket' : 'Hint'}</button></div>`;
    panel.querySelector('[data-hint]').addEventListener('click', () => {
      aktiv.hint = true;
      brett.sett({ sist: aktiv.sist, merket: kort.kilder.map(k => k.fra) });
      ui.respons('Brikken er merket.');
      visSporsmal();
    });
  }

  const visPiler = () => [...new Map(aktiv.kort.kilder.filter(k => !k.godtatt).map(k => [k.san, { fra: k.fra, til: k.til, type: 'hint' }])).values()];

  // A new card: the arrow shows the move, the coach says why, and the player plays it.
  function visLaering() {
    const { kort, kilde, klar } = aktiv;
    const eyebrow = `NYTT TREKK · ${esc(kilde.apning.navn.toUpperCase())} · ${esc(kilde.linje)}`;
    panel.innerHTML = trenerBoble(`<p class="eyebrow">${eyebrow}</p>${laerTekst(kort, kilde)}<p class="ap-gjor">${klar ? 'Din tur: spill trekket på brettet, der pilen viser.' : 'Se på stillingen først.'}</p>`);
  }

  function laertTrekk(trekk) {
    const { kort, kilde, sist } = aktiv;
    if (!kort.trekk.includes(trekk.san)) {
      brett.rist();
      brett.sett({ sist, piler: visPiler() });
      ui.respons(`Følg den rosa pilen: ${norsk(kilde.san)}.`, 'feil');
      return;
    }
    vistKort(okt, kort, ui.fremgang());
    ui.lagre();
    ui.settTrekk(null);
    spillPaBrettet(trekk, kort, kilde);
    const ros = tilfeldig(['Sånn ja!', 'Akkurat sånn.', 'Fint!']);
    ui.respons(`${ros} ${norsk(trekk.san)}`, 'bra');
    evalbar.hold(false);
    fremover(`<p class="eyebrow">${esc(kilde.apning.navn.toUpperCase())} · ${esc(kilde.linje)}</p><p class="ap-sier"><strong>${ros}</strong> Nå har du spilt ${esc(norsk(trekk.san))} selv.</p>${forklaringFor(kort, trekk.san, { ideErSagt: true, felleErSagt: true })}<p class="ap-kilde">Om litt spør jeg deg om den igjen.</p>`, 'bra');
  }

  function spillPaBrettet(trekk, kort, kilde) {
    const treff = kort.kilder.find(k => k.san === trekk.san && k.node) ?? kort.kilder.find(k => k.san === trekk.san);
    const etter = new Chess(brett.chess.fen());
    etter.move(trekk.san);
    brett.sett({ fen: etter.fen(), sist: { from: trekk.from, to: trekk.to }, laast: true, piler: piler(treff.node?.entry.piler), gli: true });
    linje.textContent = sanTekst([...kilde.forTrekk, trekk.san]);
    linje.scrollLeft = linje.scrollWidth;
    return treff;
  }

  // The answer stays on screen until the player moves on.
  function fremover(tekst, stemning) {
    const siste = okt.ko.length === 1;
    panel.innerHTML = `${trenerBoble(tekst, { stemning })}<div class="ap-kontroller ap-okt-neste"><button type="button" class="button primary" data-neste>${siste ? 'Se oppsummering ▶' : 'Neste ▶'}</button></div>`;
    const knapp = panel.querySelector('[data-neste]');
    const neste = () => { const tastatur = knapp.matches(':focus-visible'); okt.ko.shift(); okt.gjort += 1; visKort(tastatur); };
    knapp.addEventListener('click', neste);
    // A keyboard player moves on with the button; everyone else has Enter anyway, without a focus ring.
    if (ui.main.querySelector('.ap-brett :focus-visible')) knapp.focus({ preventScroll: true });
    ui.settTast(event => {
      if (event.key === 'Enter' && !event.target.closest?.('a, button:not(.square)')) { event.preventDefault(); neste(); }
    });
  }

  // Once per opening, the first time a session teaches from it.
  function visIntro(apning, videre) {
    const forstegang = !Object.keys(ui.fremgang().kort).length;
    merkIntro(ui.fremgang(), apning.id);
    ui.lagre();
    ui.brukOppslag(apning);
    ui.settTrekk(null);
    ui.respons();
    evalbar.hold(true);
    brett.sett({ fen: apning.startFen, orientering: apning.farge, laast: true });
    linje.textContent = sanTekst(veiInnTrekk(apning));
    linje.scrollLeft = 0;
    teller.textContent = 'Kort fortalt';
    const slik = forstegang ? `<p class="ap-kilde">Slik gjør vi det: Jeg viser deg trekkene ett og ett, og du spiller dem selv. Etter noen kort spør jeg deg om dem igjen.</p>` : '';
    panel.innerHTML = `${trenerBoble(`<p class="eyebrow">KORT FORTALT · ${esc(apning.navn.toUpperCase())}</p><p class="ap-sier">${esc(forsteSetning(apning.intro.karakter))}</p><p><span class="ap-etikett plan">Planen</span>${esc(apning.planer[0])}</p>${apning.startTrekk.length ? `<p class="ap-kilde">Vi starter etter ${esc(startNotasjon(apning))}.</p>` : ''}${slik}`)}<div class="ap-kontroller ap-okt-neste"><button type="button" class="button primary" data-videre>Vis meg trekkene ▶</button><a class="ap-mer" href="#/a/${apning.id}/om">Les mer om ${esc(apning.navn)}</a></div>`;
    panel.querySelector('[data-videre]').addEventListener('click', videre);
    ui.settTast(event => {
      if (event.key === 'Enter' && !event.target.closest?.('a, button:not(.square)')) { event.preventDefault(); videre(); }
    });
  }

  function visKort(tastatur = false) {
    const kort = okt.ko[0];
    ui.settTast(null);
    if (!kort) { oppsummering(ui, okt); return; }
    const kilde = kort.kilder.find(k => k.node) ?? kort.kilder.find(k => !k.godtatt) ?? kort.kilder[0];
    const laer = okt.laer.has(kort.id);
    if (laer && !introSett(ui.fremgang(), kilde.apning.id)) { visIntro(kilde.apning, () => visKort(tastatur)); return; }
    aktiv = { kort, kilde, laer, igjen: okt.vurdert.has(kort.id), fersk: okt.vist.has(kort.id), hint: false, klar: false, sist: null };
    ui.brukOppslag(kilde.apning);
    evalbar.hold(true);
    ui.settTrekk(null);
    ui.respons();
    const merke = laer ? 'Nytt trekk' : aktiv.igjen ? 'En gang til' : aktiv.fersk ? 'Husker du?' : 'Repetisjon';
    teller.textContent = `${merke} · ${okt.gjort + 1} av ${okt.gjort + okt.ko.length}`;
    fremdrift.style.width = `${Math.round(okt.gjort / (okt.gjort + okt.ko.length) * 100)}%`;
    linje.textContent = sanTekst(kilde.forTrekk);
    linje.scrollLeft = linje.scrollWidth;
    if (laer) visLaering(); else visSporsmal();
    spillInn(kort, kilde, sist => {
      aktiv.klar = true;
      aktiv.sist = sist;
      if (laer) {
        ui.settTrekk(laertTrekk);
        brett.sett({ sist, piler: visPiler() });
        ui.respons(`Spill ${norsk(kilde.san)}: følg den rosa pilen.`);
        visLaering();
      } else {
        ui.settTrekk(svar);
        visSporsmal();
      }
      if (tastatur) ui.main.querySelector('.ap-brett [tabindex="0"]')?.focus({ preventScroll: true });
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
      const treff = spillPaBrettet(trekk, kort, kilde);
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
    const hvaNa = !riktig ? 'Den kommer tilbake om litt.' : post ? (hint ? `Den blir stående der den var. ${nesteGang(post)}` : nesteGang(post)) : 'Nå satt den.';
    fremover(`<p class="eyebrow">${esc(kilde.apning.navn.toUpperCase())} · ${esc(kilde.linje)}</p>${tekst}<p class="ap-kilde">${hvaNa}</p>`, riktig ? 'bra' : 'feil');
  }

  visKort();
}

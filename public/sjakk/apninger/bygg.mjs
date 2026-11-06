// "Bygg repertoaret": one question at a time, the biggest reply first, so nobody has to understand the slots to get started.
// Each question has its own address, so going back works, and a question can be opened on its own from a gap on the repertoire page.
import { Chess } from '../vendor/chess.mjs';
import { TRENER, esc } from './trener.mjs';
import { flertall, forsteSetning, helTrekk, miniBrett, sanTekst, skarphet, trenerBoble } from './ui.mjs';
import { STARTFORSLAG, alternativer, byggSteg, dekningTekst, erValgt, fordel, forsteSteg, hullTekst, nabostSteg, omtrentProsent, settValgt, svarAndel, svarDekning, veiInnTrekk, velgApning } from './repertoar.mjs';
import { lagKort, nyePerDag } from './kort.mjs';

const VISTE = 3;
const FARGE_NAVN = { w: 'SOM HVIT', b: 'SOM SVART' };
const adresse = (slot, bareHull) => `#/repertoar/bygg/${slot.id}${bareHull ? '/hull' : ''}`;

let helListe = null;
let kvittering = '';

const kortMinne = new WeakMap();
export function kortFor(apning) {
  if (!kortMinne.has(apning)) kortMinne.set(apning, lagKort([apning]));
  return kortMinne.get(apning);
}

function omfang(apning, tempo) {
  const antall = kortFor(apning).length;
  const dager = Math.ceil(antall / tempo);
  return `${flertall(antall, 'kort', 'kort')} å lære, ${dager > 1 ? `rundt ${dager} dager` : 'én dag'}`;
}

function fenEtter(sans) {
  const chess = new Chess();
  for (const san of sans) chess.move(san);
  return chess.fen();
}

function valgKort(apning, fremgang) {
  const valgt = erValgt(fremgang, apning.id);
  const vei = veiInnTrekk(apning);
  const merke = valgt ? '<span class="ap-alt-merke valgt">Valgt</span>' : STARTFORSLAG.includes(apning.id) ? `<span class="ap-alt-merke">${TRENER.navn}s forslag</span>` : '';
  return `<li class="ap-alt">
    <button type="button" class="ap-alt-knapp" aria-pressed="${valgt}" data-ta="${apning.id}">
      ${miniBrett(fenEtter(vei), apning.farge)}
      <span class="ap-alt-tekst">
        <span class="ap-alt-navn"><b>${esc(apning.navn)}</b>${merke}</span>
        <span class="ap-veiinn">${esc(sanTekst(vei))}</span>
        <span class="ap-alt-setning">${esc(forsteSetning(apning.kort))}</span>
        <span class="ap-merker"><span class="ap-skarp">Skarphet ${skarphet(apning)}</span><span>${esc(omfang(apning, nyePerDag(fremgang)))}</span></span>
      </span>
    </button>
    <a class="ap-apne" href="#/a/${apning.id}/om" aria-label="Les om ${esc(apning.navn)}">Les om</a>
  </li>`;
}

function dekningLinje(slots, fremgang, farge) {
  const dekning = svarDekning(slots, fremgang, farge);
  if (!dekning.valgte) return '';
  return `<p class="ap-bygg-dekning"><span class="ap-spor"><span style="width:${Math.round(dekning.prosent / 5) * 5}%"></span></span>${esc(dekningTekst(dekning, farge))}</p>`;
}

function etterSiste(farge) { return `#/repertoar/bygg/${farge === 'w' ? 'hvit-klar' : 'ferdig'}`; }

function visSporsmal(ui, slots, slot, bareHull) {
  const fremgang = ui.fremgang();
  const steg = byggSteg(slots).filter(s => s.farge === slot.farge);
  const nummer = steg.indexOf(slot) + 1;
  const liste = alternativer(slot, fremgang);
  const vis = helListe === slot.id ? liste : liste.slice(0, VISTE);
  const harValg = slot.apninger.some(apning => erValgt(fremgang, apning.id));
  const andel = svarAndel(slot);
  const sporsmal = slot.sporsmal ?? (slot.linjer.length ? `Hva vil du spille når motstanderen svarer ${slot.mot}?` : 'Vil du ha med noe mer?');
  const foran = slot.farge === 'w' && nummer === 1 ? '<p>Som hvit åpner du med 1.e4. Nå velger vi hva du spiller mot hvert svar, det vanligste først.</p>' : '';
  const hvorOfte = andel ? `<p>Det møter du i ${esc(omtrentProsent(andel))} av partiene ${slot.farge === 'w' ? 'mot 1.e4' : 'som svart'}. Tallet er et grovt anslag.</p>` : '';
  const merkelapp = liste.length === 1 ? `<p>Her har jeg ett forslag. Ta det, eller hopp over.</p>` : '';
  const forrige = nabostSteg(slots, fremgang, slot.id, -1, { bareHull });
  const tilbake = forrige ? adresse(forrige, bareHull) : slot.farge === 'b' && !bareHull ? '#/repertoar/bygg/hvit-klar' : '#/repertoar';
  const videre = () => { const neste = nabostSteg(slots, ui.fremgang(), slot.id, 1, { bareHull }); return neste ? adresse(neste, bareHull) : etterSiste(slot.farge); };
  ui.main.innerHTML = `
    <header class="ap-okt-topp ap-bygg-topp"><a href="#/repertoar">← Ferdig for nå</a><span class="ap-okt-teller">${slot.farge === 'w' ? 'Hvit' : 'Svart'} · ${nummer} av ${steg.length}</span><span class="ap-spor"><span style="width:${Math.round(nummer / steg.length * 100)}%"></span></span></header>
    ${kvittering ? `<p class="ap-bygg-kvittering" role="status">${esc(kvittering)}</p>` : ''}
    <section class="ap-hero ap-bygg-hero">${trenerBoble(`<p class="eyebrow">BYGG REPERTOARET · ${FARGE_NAVN[slot.farge]}</p><h1>${helTrekk(esc(sporsmal))}</h1>${foran}${hvorOfte}${merkelapp}`, { live: false })}</section>
    <ul class="ap-alternativer">${vis.map(apning => valgKort(apning, fremgang)).join('')}</ul>
    ${vis.length < liste.length ? `<button type="button" class="ap-lenke ap-bygg-flere" data-alle>Vis alle ${liste.length} åpningene her</button>` : ''}
    <div class="ap-bygg-knapper"><a class="button secondary" href="${tilbake}">◀ Tilbake</a><button type="button" class="button secondary" data-hopp>${harValg ? 'Behold og gå videre ▶' : 'Hopp over ▶'}</button></div>
    ${harValg ? '<p class="ap-bygg-fjern"><button type="button" class="ap-lenke" data-fjern>Fjern valget her</button></p>' : ''}
    ${dekningLinje(slots, fremgang, slot.farge)}`;
  kvittering = '';

  ui.main.querySelector('[data-alle]')?.addEventListener('click', () => { helListe = slot.id; visSporsmal(ui, slots, slot, bareHull); ui.main.querySelector('.ap-alternativer button')?.focus({ preventScroll: true }); });
  ui.main.querySelector('[data-hopp]').addEventListener('click', () => { location.hash = videre(); });
  ui.main.querySelector('[data-fjern]')?.addEventListener('click', () => {
    for (const apning of slot.apninger) if (erValgt(ui.fremgang(), apning.id)) settValgt(ui.fremgang(), apning.id, false);
    ui.lagre();
    visSporsmal(ui, slots, slot, bareHull);
  });
  ui.main.querySelectorAll('[data-ta]').forEach(knapp => knapp.addEventListener('click', () => {
    const apning = slot.apninger.find(a => a.id === knapp.dataset.ta);
    const naa = ui.fremgang();
    if (!erValgt(naa, apning.id)) {
      const byttet = velgApning(naa, apning, slot);
      ui.lagre();
      kvittering = byttet.length ? `${apning.navn} er med, i stedet for ${byttet.map(a => a.navn).join(' og ')}.` : `${apning.navn} er med.`;
    }
    helListe = null;
    location.hash = videre();
  }));
}

function valgListe(slots, fremgang, farge) {
  const rader = byggSteg(slots).filter(slot => slot.farge === farge).map(slot => {
    const valgte = slot.apninger.filter(apning => erValgt(fremgang, apning.id));
    return `<li><a href="${adresse(slot)}"><span>Mot ${esc(slot.mot)}</span><b${valgte.length ? '' : ' class="tom"'}>${valgte.length ? esc(valgte.map(a => a.navn).join(' og ')) : 'Ikke valgt'}</b></a></li>`;
  });
  return `<ul class="ap-bygg-liste">${rader.join('')}</ul>`;
}

function hullLinje(slots, fremgang, farge) {
  const { hull, valgte } = svarDekning(slots, fremgang, farge);
  return hull && valgte ? `<p>${esc(hullTekst(hull))}</p>` : '';
}

function visHvitKlar(ui, slots) {
  const fremgang = ui.fremgang();
  const dekning = svarDekning(slots, fremgang, 'w');
  const tittel = dekning.valgte ? 'Da er hvit på plass' : 'Du hoppet over hvit';
  const svart = forsteSteg(slots, fremgang, 'b');
  ui.main.innerHTML = `
    <section class="ap-hero ap-bygg-hero ap-rep-hero">${trenerBoble(`<p class="eyebrow">BYGG REPERTOARET · SOM HVIT</p><h1>${tittel}</h1>${dekning.valgte ? `<p>${esc(dekningTekst(dekning, 'w'))}</p>${hullLinje(slots, fremgang, 'w')}` : '<p>Det er helt greit. Du kan ta svart nå, eller gå tilbake og velge.</p>'}`, { live: false })}</section>
    ${valgListe(slots, fremgang, 'w')}
    <div class="ap-bygg-knapper ap-bygg-slutt">${svart ? '<a class="button primary" href="#/repertoar/bygg/svart">Fortsett med svart ▶</a>' : ''}${dekning.valgte ? `<a class="button ${svart ? 'secondary' : 'primary'}" href="#/repertoar/kort">Stopp her og start dagens økt</a>` : '<a class="button secondary" href="#/repertoar">Til repertoaret</a>'}</div>`;
}

function visFerdig(ui, slots) {
  const fremgang = ui.fremgang();
  const hvit = svarDekning(slots, fremgang, 'w');
  const svart = svarDekning(slots, fremgang, 'b');
  const noe = hvit.valgte || svart.valgte;
  const linjer = [[hvit, 'w'], [svart, 'b']].filter(([d]) => d.valgte).map(([d, farge]) => `<p>${esc(dekningTekst(d, farge))}</p>`).join('');
  ui.main.innerHTML = `
    <section class="ap-hero ap-bygg-hero ap-rep-hero">${trenerBoble(`<p class="eyebrow">BYGG REPERTOARET</p><h1>${noe ? 'Da er repertoaret klart' : 'Ingenting er valgt ennå'}</h1>${noe ? `${linjer}<p>Nå lærer jeg deg trekkene, litt hver dag. Du kan bytte når du vil.</p>` : '<p>Det går fint. Start på nytt når du er klar, eller se gjennom alt selv.</p>'}`, { live: false })}</section>
    <section class="ap-gruppe"><h2>Som hvit</h2>${valgListe(slots, fremgang, 'w')}</section>
    <section class="ap-gruppe"><h2>Som svart</h2>${valgListe(slots, fremgang, 'b')}</section>
    <div class="ap-bygg-knapper ap-bygg-slutt">${noe ? '<a class="button primary" href="#/repertoar/kort">Start dagens økt ▶</a><a class="button secondary" href="#/repertoar">Til repertoaret</a>' : '<a class="button primary" href="#/repertoar/bygg">Start på nytt</a><a class="button secondary" href="#/repertoar">Til repertoaret</a>'}</div>`;
}

export function visBygg(ui, hvor, modus) {
  ui.brettBort();
  document.title = 'Bygg repertoaret · Åpninger';
  const slots = fordel(ui.alle());
  const fremgang = ui.fremgang();
  if (hvor === 'hvit-klar') { visHvitKlar(ui, slots); return; }
  if (hvor === 'ferdig') { visFerdig(ui, slots); return; }
  const slot = hvor === 'svart' || !hvor ? forsteSteg(slots, fremgang, hvor === 'svart' ? 'b' : 'w') : slots.find(s => s.id === hvor && s.apninger.length);
  if (!slot) { location.hash = hvor === 'svart' ? '#/repertoar/bygg/ferdig' : '#/repertoar'; return; }
  visSporsmal(ui, slots, slot, modus === 'hull');
}

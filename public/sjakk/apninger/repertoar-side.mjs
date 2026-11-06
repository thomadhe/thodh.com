// "Mitt repertoar": one slot per opponent reply, for White and Black.
import { TRENER, esc, norsk } from './trener.mjs';
import { NIVA, flertall, sanTekst, skarphet, trenerBoble } from './ui.mjs';
import { STARTFORSLAG, dekningTekst, erValgt, fordel, hullTekst, kryssI, settValgt, svarDekning, veiInnTrekk, velgApning } from './repertoar.mjs';
import { nesteStegHtml } from './kort-okt.mjs';
import { FRITT, NYE_VALG, laerteKort, settTempo, valgtTempo } from './kort.mjs';
import { kortFor } from './bygg.mjs';

const SEKSJONER = [
  { farge: 'w', tittel: 'Som hvit', tekst: 'Du åpner med 1.e4. Velg hva du vil spille mot hvert svar.' },
  { farge: 'b', tittel: 'Som svart', tekst: 'Velg svaret ditt på det hvit åpner med.' },
];

let apen = null;
let melding = null;
let angre = null;
let fjernet = null;

// Cards, since that is where the daily work happens. A card's progress stays whether the opening is chosen or not.
function statusTekst(apning, fremgang, naa = Date.now()) {
  const kort = kortFor(apning);
  const klare = kort.filter(k => fremgang.kort[k.id]?.forfall <= naa).length;
  return `${laerteKort(kort, fremgang)} av ${flertall(kort.length, 'kort', 'kort')} lært${klare && erValgt(fremgang, apning.id) ? ` · <b>${klare} til repetisjon</b>` : ''}`;
}

function valgRad(apning, slot, fremgang) {
  const valgt = erValgt(fremgang, apning.id);
  return `<li class="ap-valgrad">
    <button type="button" class="ap-valgknapp" aria-pressed="${valgt}" data-velg="${slot.id}|${apning.id}">
      <span class="ap-hake" aria-hidden="true"></span>
      <span class="ap-valginnhold"><b>${esc(apning.navn)}</b><span class="ap-veiinn">${esc(sanTekst(veiInnTrekk(apning)))}</span><span class="ap-merker"><span>${NIVA[apning.niva]}</span><span>${esc(apning.karakter)}</span>${skarphet(apning)}</span><span class="ap-valgstatus">${statusTekst(apning, fremgang)}</span></span>
    </button>
    <a class="ap-apne" href="#/a/${apning.id}/om" aria-label="Les om ${esc(apning.navn)}">Les om</a>
  </li>`;
}

function kryssNotat(slot, fremgang) {
  const kryss = kryssI(slot, fremgang)[0];
  if (!kryss) return '';
  const { a, b } = kryss.kryss;
  return `<p class="ap-notat">Her har du to veier: ${esc(`${a.nummer}${norsk(a.san)}`)} og ${esc(`${b.nummer}${norsk(b.san)}`)}. Det går fint. Kortene godtar begge, og i blandet øving følger jeg det du spiller.</p>`;
}

function slotHtml(slot, fremgang) {
  const valgte = slot.apninger.filter(apning => erValgt(fremgang, apning.id));
  const erApen = apen === slot.id;
  const hode = `<span class="ap-slot-navn">${esc(slot.navn)}</span><span class="ap-slot-mot">${esc(slot.mot)}</span>`;
  if (!slot.apninger.length) return `<section class="ap-slot ap-slot-tom"><div class="ap-slot-topp">${hode}</div><p class="ap-slot-rolig">Ingen åpninger her ennå.</p></section>`;
  const nyMelding = melding?.slotId === slot.id ? `<p class="ap-notat" role="status">${esc(melding.tekst)} <button type="button" class="ap-lenke" data-behold="${slot.id}">${melding.ider.length > 1 ? 'Behold alle' : 'Behold begge'}</button></p>` : '';
  return `<section class="ap-slot${erApen ? ' apen' : ''}${valgte.length ? ' fylt' : ''}">
    <button type="button" class="ap-slot-topp" data-slot="${slot.id}" aria-expanded="${erApen}">${hode}<span class="ap-slot-handling">${erApen ? 'Lukk' : valgte.length ? 'Endre' : 'Velg'}</span></button>
    ${valgte.length && !erApen ? `<ul class="ap-slot-valgte">${valgte.map(apning => `<li><a href="#/a/${apning.id}/laer"><b>${esc(apning.navn)}</b><span>${statusTekst(apning, fremgang)}</span></a><button type="button" class="ap-fjern" data-fjern="${apning.id}" aria-label="Fjern ${esc(apning.navn)}">Fjern</button></li>`).join('')}</ul>` : ''}
    ${fjernet?.slotId === slot.id ? `<p class="ap-notat" role="status">${esc(fjernet.navn)} er tatt ut. Fremgangen ligger trygt om du velger den igjen. <button type="button" class="ap-lenke" data-angre-fjern>Angre</button></p>` : ''}
    ${erApen ? `<ul class="ap-valgliste">${slot.apninger.map(apning => valgRad(apning, slot, fremgang)).join('')}</ul>${nyMelding}` : ''}
    ${kryssNotat(slot, fremgang)}
  </section>`;
}

function dekningRad(slots, fremgang, farge) {
  const dekning = svarDekning(slots, fremgang, farge);
  const tittel = farge === 'w' ? 'Som hvit' : 'Som svart';
  const start = farge === 'w' ? '#/repertoar/bygg' : '#/repertoar/bygg/svart';
  if (!dekning.valgte) return `<div class="ap-dekning-rad"><h3>${tittel}</h3><p>Ingenting valgt ennå. <a href="${start}">Sett opp ${farge === 'w' ? 'hvit' : 'svart'}</a></p></div>`;
  const { hull } = dekning;
  return `<div class="ap-dekning-rad"><h3>${tittel}</h3><span class="ap-spor"><span style="width:${Math.round(dekning.prosent / 5) * 5}%"></span></span><p>${esc(dekningTekst(dekning, farge))}</p>${hull ? `<p class="ap-dekning-hull">${esc(hullTekst(hull))} <a href="#/repertoar/bygg/${hull.slot.id}/hull">Velg et svar</a></p>` : ''}</div>`;
}

function dekningHtml(ui, slots) {
  if (!ui.valgte().length) return '';
  const fremgang = ui.fremgang();
  return `<section class="ap-dekning" aria-label="Hvor mye repertoaret dekker">${dekningRad(slots, fremgang, 'w')}${dekningRad(slots, fremgang, 'b')}</section>`;
}

function handlinger(ui) {
  const valgte = ui.valgte();
  if (!valgte.length) return '';
  const farger = new Set(valgte.map(apning => apning.farge));
  const tempo = valgtTempo(ui.fremgang());
  return `<div class="ap-handlinger">
    <section class="ap-handling">
      <p class="eyebrow">BLANDET ØVING</p>
      <h2>Øv hele repertoaret</h2>
      <p>Fra første trekk. Motstanderen velger, og du følger åpningen du har valgt.</p>
      <div class="ap-handling-knapper"><a class="button secondary" href="#/repertoar/ov">Øv ▶</a>${farger.size > 1 ? '<a class="button secondary" href="#/repertoar/ov/w">Bare hvit</a><a class="button secondary" href="#/repertoar/ov/b">Bare svart</a>' : ''}</div>
    </section>
    <section class="ap-handling">
      <p class="eyebrow">TEMPO</p>
      <h2>Nye kort per dag</h2>
      <p>${tempo === FRITT ? 'Ingen grense på nye kort. Du bestemmer selv når det er nok.' : 'Repetisjoner kommer i tillegg. Ta heller få og husk dem.'}</p>
      <div class="ap-filter ap-tempo" role="group" aria-label="Nye kort per dag">${NYE_VALG.map(antall => `<button type="button" data-tempo="${antall}" aria-pressed="${tempo === antall}">${antall === FRITT ? 'Så mange jeg vil' : antall}</button>`).join('')}</div>
    </section>
    <section class="ap-handling">
      <p class="eyebrow">ØV FRITT</p>
      <h2>Øv på alle kort</h2>
      <p>Så ofte du vil, utenom dagens plan. Teller ikke på timeplanen.</p>
      <div class="ap-handling-knapper"><a class="button secondary" href="#/repertoar/trening/alle/rekke">I rekkefølge</a><a class="button secondary" href="#/repertoar/trening/alle/stokket">Stokket</a></div>
    </section>
  </div>`;
}

function forslagHtml(ui, slots, valgtNaa) {
  if (valgtNaa) return `<aside class="ap-forslag" role="status"><p>Da er ${flertall(valgtNaa.length, 'åpning', 'åpninger')} på plass. Ombestemte du deg?</p><button type="button" class="button secondary" data-angre>Angre</button></aside>`;
  const fremgang = ui.fremgang();
  const utvalg = STARTFORSLAG.map(id => ui.alle().find(apning => apning.id === id)).filter(Boolean);
  if (!utvalg.length || slots.some(slot => slot.farge === 'w' && slot.apninger.some(apning => erValgt(fremgang, apning.id)))) return '';
  const navn = utvalg.map(apning => `${apning.navn} mot ${slots.find(slot => slot.apninger.includes(apning)).mot}`);
  return `<aside class="ap-forslag"><div><p class="eyebrow">ET FORSLAG FRA ${TRENER.navn.toUpperCase()}</p><p>Usikker på hvor du skal begynne? ${esc(navn.join(', '))}. Du kan bytte når du vil.</p></div><button type="button" class="button secondary" data-forslag>${utvalg.length === 2 ? 'Velg begge' : 'Velg den'}</button></aside>`;
}

export function visRepertoar(ui, fokus = null) {
  const { main } = ui;
  // A note about the last tap belongs to this visit.
  if (!fokus) fjernet = null;
  const fremgang = ui.fremgang();
  const slots = fordel(ui.alle());
  document.title = 'Mitt repertoar · Åpninger';
  const antall = ui.valgte().length;
  const valgtNaa = angre;
  angre = null;
  const intro = antall ? `Du har valgt ${flertall(antall, 'åpning', 'åpninger')}. Trykk på et svar for å bytte, så følger kortene og øvingen etter.` : 'Her setter vi sammen det du faktisk vil spille. Jeg stiller deg noen korte spørsmål, og du kan bytte når du vil.';
  main.innerHTML = `
    <nav class="ap-tilbake"><a href="#/">← Alle åpninger</a></nav>
    <section class="ap-hero ap-rep-hero">${trenerBoble(`<p class="eyebrow">${TRENER.navn.toUpperCase()} · MITT REPERTOAR</p><h1>Mitt repertoar</h1><p>${esc(intro)}</p>`, { live: false })}</section>
    ${nesteStegHtml(ui)}
    ${dekningHtml(ui, slots)}
    ${forslagHtml(ui, slots, valgtNaa)}
    ${handlinger(ui)}
    ${SEKSJONER.map(({ farge, tittel, tekst }) => `<section class="ap-gruppe"><h2>${tittel}</h2><p class="ap-gruppe-tekst">${tekst} <a href="${farge === 'w' ? '#/repertoar/bygg' : '#/repertoar/bygg/svart'}">Ta spørsmålene ${antall ? 'på nytt' : 'i stedet'}</a></p><div class="ap-slotliste">${slots.filter(slot => slot.farge === farge && (slot.linjer.length || slot.apninger.length)).map(slot => slotHtml(slot, fremgang)).join('')}</div></section>`).join('')}`;

  const tegn = nyttFokus => visRepertoar(ui, nyttFokus);
  main.querySelectorAll('[data-slot]').forEach(knapp => knapp.addEventListener('click', () => {
    apen = apen === knapp.dataset.slot ? null : knapp.dataset.slot;
    melding = null;
    fjernet = null;
    tegn(`[data-slot="${knapp.dataset.slot}"]`);
  }));
  main.querySelectorAll('[data-velg]').forEach(knapp => knapp.addEventListener('click', () => {
    const [slotId, apningId] = knapp.dataset.velg.split('|');
    const slot = slots.find(s => s.id === slotId);
    const apning = slot.apninger.find(a => a.id === apningId);
    const naa = ui.fremgang();
    melding = null;
    fjernet = null;
    if (erValgt(naa, apningId)) { settValgt(naa, apningId, false); fjernet = { slotId, id: apningId, navn: apning.navn }; }
    else {
      const byttet = velgApning(naa, apning, slot);
      if (byttet.length) melding = { slotId, ider: byttet.map(a => a.id), tekst: `Byttet ut ${byttet.map(a => a.navn).join(' og ')} med ${apning.navn}, siden de krever ulike trekk.` };
    }
    ui.lagre();
    tegn(`[data-velg="${knapp.dataset.velg}"]`);
  }));
  main.querySelectorAll('[data-fjern]').forEach(knapp => knapp.addEventListener('click', () => {
    const slot = slots.find(s => knapp.closest('.ap-slot').querySelector(`[data-slot="${s.id}"]`));
    const apning = slot.apninger.find(a => a.id === knapp.dataset.fjern);
    settValgt(ui.fremgang(), apning.id, false);
    fjernet = { slotId: slot.id, id: apning.id, navn: apning.navn };
    melding = null;
    ui.lagre();
    tegn('[data-angre-fjern]');
  }));
  main.querySelector('[data-angre-fjern]')?.addEventListener('click', () => {
    settValgt(ui.fremgang(), fjernet.id, true);
    const { slotId } = fjernet;
    fjernet = null;
    ui.lagre();
    tegn(`[data-slot="${slotId}"]`);
  });
  main.querySelectorAll('[data-tempo]').forEach(knapp => knapp.addEventListener('click', () => {
    settTempo(ui.fremgang(), NYE_VALG.find(antall => String(antall) === knapp.dataset.tempo));
    ui.lagre();
    tegn(`[data-tempo="${knapp.dataset.tempo}"]`);
  }));
  main.querySelector('[data-behold]')?.addEventListener('click', () => {
    for (const id of melding.ider) settValgt(ui.fremgang(), id, true);
    melding = null;
    ui.lagre();
    tegn(`[data-slot="${apen}"]`);
  });
  main.querySelector('[data-forslag]')?.addEventListener('click', () => {
    angre = STARTFORSLAG.filter(id => ui.alle().some(apning => apning.id === id));
    for (const id of angre) settValgt(ui.fremgang(), id, true);
    ui.lagre();
    tegn('[data-angre]');
  });
  main.querySelector('[data-angre]')?.addEventListener('click', () => {
    for (const id of valgtNaa) settValgt(ui.fremgang(), id, false);
    ui.lagre();
    tegn('[data-forslag]');
  });
  if (fokus) main.querySelector(fokus)?.focus({ preventScroll: true });
}

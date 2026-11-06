// "Mitt repertoar": one slot per opponent reply, for White and Black.
import { TRENER, esc, norsk } from './trener.mjs';
import { NIVA, flertall, sanTekst, skarphet, trenerBoble } from './ui.mjs';
import { statusFor } from './repetisjon.mjs';
import { STARTFORSLAG, erValgt, fordel, kryssI, settValgt, velgApning } from './repertoar.mjs';
import { klareKort } from './kort-okt.mjs';
import { forfallerIMorgen } from './kort.mjs';

const SEKSJONER = [
  { farge: 'w', tittel: 'Som hvit', tekst: 'Du åpner med 1.e4. Velg hva du vil spille mot hvert svar.' },
  { farge: 'b', tittel: 'Som svart', tekst: 'Velg svaret ditt på det hvit åpner med.' },
];

let apen = null;
let melding = null;
let angre = null;

// The way into an opening, up to and including our first move in the tree.
function veiInn(apning) {
  const sans = [...apning.startTrekk];
  for (let node = apning.rot.barn[0]; node; node = node.barn[0]) {
    sans.push(node.san);
    if (node.rep) break;
  }
  return sanTekst(sans);
}

function statusTekst(apning, fremgang) {
  const s = statusFor(apning, fremgang);
  return `${s.laert}/${s.totalt} linjer lært${s.forfaller ? ` · <b>${s.forfaller} til repetisjon</b>` : ''}`;
}

function valgRad(apning, slot, fremgang) {
  const valgt = erValgt(fremgang, apning.id);
  return `<li class="ap-valgrad">
    <button type="button" class="ap-valgknapp" aria-pressed="${valgt}" data-velg="${slot.id}|${apning.id}">
      <span class="ap-hake" aria-hidden="true"></span>
      <span class="ap-valginnhold"><b>${esc(apning.navn)}</b><span class="ap-veiinn">${esc(veiInn(apning))}</span><span class="ap-merker"><span>${NIVA[apning.niva]}</span><span>${esc(apning.karakter)}</span>${skarphet(apning)}</span><span class="ap-valgstatus">${statusTekst(apning, fremgang)}</span></span>
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
    ${valgte.length && !erApen ? `<ul class="ap-slot-valgte">${valgte.map(apning => `<li><a href="#/a/${apning.id}/laer"><b>${esc(apning.navn)}</b><span>${statusTekst(apning, fremgang)}</span></a></li>`).join('')}</ul>` : ''}
    ${erApen ? `<ul class="ap-valgliste">${slot.apninger.map(apning => valgRad(apning, slot, fremgang)).join('')}</ul>${nyMelding}` : ''}
    ${kryssNotat(slot, fremgang)}
  </section>`;
}

function handlinger(ui) {
  const valgte = ui.valgte();
  if (!valgte.length) return '';
  const ko = klareKort(ui);
  const iMorgen = forfallerIMorgen(ui.kort(), ui.fremgang());
  const klare = ko.kort.length;
  const delt = [ko.forfalte ? `${ko.forfalte} til repetisjon` : '', ko.nye ? flertall(ko.nye, 'ny', 'nye') : ''].filter(Boolean).join(' · ');
  const farger = new Set(valgte.map(apning => apning.farge));
  return `<div class="ap-handlinger">
    <section class="ap-handling">
      <p class="eyebrow">KORT</p>
      <h2>${klare ? flertall(klare, 'kort klart', 'kort klare') : 'Ingen kort klare nå'}</h2>
      <p>${klare ? esc(delt) : iMorgen ? `${flertall(iMorgen, 'kort kommer', 'kort kommer')} i morgen.` : 'Du er à jour.'}${ko.pause ? ' Nye kort venter til køen er kortere.' : ''}</p>
      ${klare ? '<a class="button primary" href="#/repertoar/kort">Start kort ▶</a>' : ko.flere ? '<a class="button secondary" href="#/repertoar/kort">Ta flere</a>' : ''}
    </section>
    <section class="ap-handling">
      <p class="eyebrow">BLANDET ØVING</p>
      <h2>Øv hele repertoaret</h2>
      <p>Fra første trekk. Motstanderen velger, og du følger åpningen du har valgt.</p>
      <div class="ap-handling-knapper"><a class="button primary" href="#/repertoar/ov">Øv ▶</a>${farger.size > 1 ? '<a class="button secondary" href="#/repertoar/ov/w">Bare hvit</a><a class="button secondary" href="#/repertoar/ov/b">Bare svart</a>' : ''}</div>
    </section>
  </div>`;
}

function forslagHtml(ui, slots, valgtNaa) {
  if (valgtNaa) return `<aside class="ap-forslag" role="status"><p>Da er ${flertall(valgtNaa.length, 'åpning', 'åpninger')} på plass. Ombestemte du deg?</p><button type="button" class="button secondary" data-angre>Angre</button></aside>`;
  const fremgang = ui.fremgang();
  const utvalg = STARTFORSLAG.map(id => ui.alle().find(apning => apning.id === id)).filter(Boolean);
  if (!utvalg.length || slots.some(slot => slot.farge === 'w' && slot.apninger.some(apning => erValgt(fremgang, apning.id)))) return '';
  const navn = utvalg.map(apning => `${apning.navn} mot ${slots.find(slot => slot.apninger.includes(apning)).mot}`);
  return `<aside class="ap-forslag"><div><p class="eyebrow">ET FORSLAG FRA ${TRENER.navn.toUpperCase()}</p><p>Usikker på hvor du skal begynne? ${esc(navn.join(', '))}. Du kan bytte når du vil.</p></div><button type="button" class="button secondary" data-forslag>Velg ${utvalg.length === 3 ? 'disse tre' : 'disse'}</button></aside>`;
}

export function visRepertoar(ui, fokus = null) {
  const { main } = ui;
  const fremgang = ui.fremgang();
  const slots = fordel(ui.alle());
  document.title = 'Mitt repertoar · Åpninger';
  const antall = ui.valgte().length;
  const valgtNaa = angre;
  angre = null;
  const intro = antall ? `Du har valgt ${flertall(antall, 'åpning', 'åpninger')}. Trykk på et svar for å bytte, så følger kortene og øvingen etter.` : 'Her setter vi sammen det du faktisk vil spille: ett valg mot hvert svar, med hvit og svart. Velg i ditt tempo, og bytt når du vil.';
  main.innerHTML = `
    <nav class="ap-tilbake"><a href="#/">← Alle åpninger</a></nav>
    <section class="ap-hero ap-rep-hero">${trenerBoble(`<p class="eyebrow">${TRENER.navn.toUpperCase()} · MITT REPERTOAR</p><h1>Mitt repertoar</h1><p>${esc(intro)}</p>`, { live: false })}</section>
    ${handlinger(ui)}
    ${forslagHtml(ui, slots, valgtNaa)}
    ${SEKSJONER.map(({ farge, tittel, tekst }) => `<section class="ap-gruppe"><h2>${tittel}</h2><p class="ap-gruppe-tekst">${tekst}</p><div class="ap-slotliste">${slots.filter(slot => slot.farge === farge && (slot.linjer.length || slot.apninger.length)).map(slot => slotHtml(slot, fremgang)).join('')}</div></section>`).join('')}`;

  const tegn = nyttFokus => visRepertoar(ui, nyttFokus);
  main.querySelectorAll('[data-slot]').forEach(knapp => knapp.addEventListener('click', () => {
    apen = apen === knapp.dataset.slot ? null : knapp.dataset.slot;
    melding = null;
    tegn(`[data-slot="${knapp.dataset.slot}"]`);
  }));
  main.querySelectorAll('[data-velg]').forEach(knapp => knapp.addEventListener('click', () => {
    const [slotId, apningId] = knapp.dataset.velg.split('|');
    const slot = slots.find(s => s.id === slotId);
    const apning = slot.apninger.find(a => a.id === apningId);
    const naa = ui.fremgang();
    melding = null;
    if (erValgt(naa, apningId)) settValgt(naa, apningId, false);
    else {
      const byttet = velgApning(naa, apning, slot);
      if (byttet.length) melding = { slotId, ider: byttet.map(a => a.id), tekst: `Byttet ut ${byttet.map(a => a.navn).join(' og ')} med ${apning.navn}, siden de krever ulike trekk.` };
    }
    ui.lagre();
    tegn(`[data-velg="${knapp.dataset.velg}"]`);
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

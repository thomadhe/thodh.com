// "Mitt repertoar": one tab per colour, with a slot per opponent reply. Practice follows the open tab, and "Begge" is one tap away.
import { TRENER, esc, norsk } from './trener.mjs';
import { FARGE, NIVA, flertall, sanTekst, skarphet, trenerBoble } from './ui.mjs';
import { FORSLAG, blandetAdresse, byggAdresse, dekningTekst, erValgt, fordel, hullTekst, kryssI, repertoarAdresse, settValgt, startFane, svarDekning, treningAdresse, veiInnTrekk, velgApning } from './repertoar.mjs';
import { klareKort, nesteStegHtml } from './kort-okt.mjs';
import { FRITT, NYE_VALG, kortStatus, laerteKort, medFarge, settTempo, valgtTempo } from './kort.mjs';
import { kortFor } from './bygg.mjs';

const SEKSJONER = {
  w: { tittel: 'Som hvit', tekst: 'Du åpner med 1.e4. Velg hva du vil spille mot hvert svar.' },
  b: { tittel: 'Som svart', tekst: 'Velg svaret ditt på det hvit åpner med.' },
};
const FORSLAG_TEKST = {
  w: 'Usikker på hvor du skal begynne? Da foreslår jeg disse. Du kan bytte når du vil.',
  b: 'Her blir det åpne stillinger og taktikk, og du tar motstanderen med ut på dypt vann tidlig. Du kan bytte når du vil.',
};
const navnPa = farge => FARGE[farge].toLowerCase();

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

// The colour's coverage, its biggest gap and its cards. A colour with nothing chosen has the next-step box to go on.
function dekningHtml(ui, slots, farge) {
  const fremgang = ui.fremgang();
  const dekning = svarDekning(slots, fremgang, farge);
  if (!dekning.valgte) return '';
  const { hull } = dekning;
  const { totalt, klare, nye, laert } = kortStatus(medFarge(ui.kort(), farge), fremgang, klareKort(ui, farge));
  return `<section class="ap-dekning" aria-label="Hvor mye ${navnPa(farge)} dekker">
    <div class="ap-dekning-rad"><span class="ap-spor"><span style="width:${Math.round(dekning.prosent / 5) * 5}%"></span></span><p>${esc(dekningTekst(dekning, farge))}</p>${hull ? `<p class="ap-dekning-hull">${esc(hullTekst(hull))} <a href="#/repertoar/bygg/${hull.slot.id}/hull">Velg et svar</a></p>` : ''}</div>
    <div class="ap-ovstatus"><span><b>${klare}</b>klare nå</span><span><b>${nye}</b>nye</span><span><b>${laert}</b>av ${totalt} lært</span></div>
  </section>`;
}

function handlinger(ui, farge) {
  const valgte = ui.valgte();
  if (!medFarge(valgte, farge).length) return '';
  const begge = new Set(valgte.map(apning => apning.farge)).size > 1;
  const tempo = valgtTempo(ui.fremgang());
  return `<div class="ap-handlinger">
    <section class="ap-handling">
      <p class="eyebrow">BLANDET ØVING</p>
      <h2>Øv alt som ${navnPa(farge)}</h2>
      <p>Fra første trekk. Motstanderen velger, og du følger åpningen du har valgt.</p>
      <div class="ap-handling-knapper"><a class="button secondary" href="${blandetAdresse(farge)}">Øv ${navnPa(farge)} ▶</a>${begge ? `<a class="button secondary" href="${blandetAdresse(null)}">Begge</a>` : ''}</div>
    </section>
    <section class="ap-handling">
      <p class="eyebrow">TEMPO</p>
      <h2>Nye kort per dag</h2>
      <p>${tempo === FRITT ? 'Ingen grense på nye kort. Du bestemmer selv når det er nok.' : 'Ett tall for begge fargene. Repetisjoner kommer i tillegg.'}</p>
      <div class="ap-filter ap-tempo" role="group" aria-label="Nye kort per dag">${NYE_VALG.map(antall => `<button type="button" data-tempo="${antall}" aria-pressed="${tempo === antall}">${antall === FRITT ? 'Så mange jeg vil' : antall}</button>`).join('')}</div>
    </section>
    <section class="ap-handling">
      <p class="eyebrow">ØV FRITT</p>
      <h2>Øv på alle kort</h2>
      <p>Så ofte du vil, utenom dagens plan. Teller ikke på timeplanen.</p>
      <div class="ap-handling-knapper"><a class="button secondary" href="${treningAdresse(farge, 'rekke')}">I rekkefølge</a><a class="button secondary" href="${treningAdresse(farge, 'stokket')}">Stokket</a></div>
      ${begge ? `<p class="ap-begge-linje">Begge: <a href="${treningAdresse(null, 'rekke')}">i rekkefølge</a> · <a href="${treningAdresse(null, 'stokket')}">stokket</a></p>` : ''}
    </section>
  </div>`;
}

const forslagKnapp = antall => (antall === 1 ? 'Velg den' : antall === 2 ? 'Velg begge' : `Velg alle ${antall}`);

function forslagHtml(ui, slots, farge, valgtNaa) {
  if (valgtNaa) return `<aside class="ap-forslag" role="status"><p>Da er ${flertall(valgtNaa.length, 'åpning', 'åpninger')} på plass. Ombestemte du deg?</p><button type="button" class="button secondary" data-angre>Angre</button></aside>`;
  const fremgang = ui.fremgang();
  const utvalg = FORSLAG[farge].map(id => ui.alle().find(apning => apning.id === id)).filter(Boolean);
  if (!utvalg.length || slots.some(slot => slot.farge === farge && slot.apninger.some(apning => erValgt(fremgang, apning.id)))) return '';
  const rader = utvalg.map(apning => `<li><span>${esc(slots.find(slot => slot.apninger.includes(apning)).navn)}</span><b>${esc(apning.navn)}</b></li>`).join('');
  return `<aside class="ap-forslag"><div><p class="eyebrow">ET FORSLAG FRA ${TRENER.navn.toUpperCase()}</p><p>${esc(FORSLAG_TEKST[farge])}</p><ul class="ap-forslag-liste">${rader}</ul></div><button type="button" class="button secondary" data-forslag>${forslagKnapp(utvalg.length)}</button></aside>`;
}

function fanerHtml(ui, farge) {
  const valgte = ui.valgte();
  const fane = f => {
    const klare = medFarge(valgte, f).length ? klareKort(ui, f).kort.length : 0;
    return `<a href="${repertoarAdresse(f)}"${f === farge ? ' aria-current="page"' : ''}${klare ? ` aria-label="${FARGE[f]}, ${flertall(klare, 'kort', 'kort')} klare"` : ''}><span class="ap-fane-merke ${f}" aria-hidden="true"></span>${FARGE[f]}${klare ? `<span class="ap-fane-tall" aria-hidden="true">${klare}</span>` : ''}</a>`;
  };
  return `<nav class="ap-rep-faner" aria-label="Velg farge">${fane('w')}${fane('b')}</nav>`;
}

export function visRepertoar(ui, fane = null, fokus = null) {
  const { main } = ui;
  const farge = fane ?? startFane(ui.lagretFane(), ui.valgte());
  ui.huskFane(farge);
  // A note about the last tap belongs to this visit.
  if (!fokus) fjernet = null;
  const fremgang = ui.fremgang();
  const slots = fordel(ui.alle());
  document.title = `Mitt repertoar · ${FARGE[farge]} · Åpninger`;
  const antall = medFarge(ui.valgte(), farge).length;
  // The undo belongs to the colour the suggestion was taken on, and to the very next drawing.
  const valgtNaa = angre?.farge === farge ? angre.ider : null;
  angre = null;
  const intro = antall ? `Du har valgt ${flertall(antall, 'åpning', 'åpninger')} som ${navnPa(farge)}. Trykk på et svar for å bytte, så følger kortene og øvingen etter.` : `Her setter vi sammen det du faktisk vil spille som ${navnPa(farge)}. Jeg stiller deg noen korte spørsmål, og du kan bytte når du vil.`;
  const { tittel, tekst } = SEKSJONER[farge];
  main.innerHTML = `
    <nav class="ap-tilbake"><a href="#/">← Alle åpninger</a></nav>
    <h1 class="ap-rep-tittel">Mitt repertoar</h1>
    ${fanerHtml(ui, farge)}
    <section class="ap-hero ap-rep-hero">${trenerBoble(`<p>${esc(intro)}</p>`, { live: false })}</section>
    ${nesteStegHtml(ui, farge)}
    ${dekningHtml(ui, slots, farge)}
    ${forslagHtml(ui, slots, farge, valgtNaa)}
    <section class="ap-gruppe"><h2>${tittel}</h2><p class="ap-gruppe-tekst">${tekst} <a href="${byggAdresse(farge)}">Ta spørsmålene ${antall ? 'på nytt' : 'i stedet'}</a></p><div class="ap-slotliste">${slots.filter(slot => slot.farge === farge && (slot.linjer.length || slot.apninger.length)).map(slot => slotHtml(slot, fremgang)).join('')}</div></section>
    ${handlinger(ui, farge)}`;

  const tegn = nyttFokus => visRepertoar(ui, farge, nyttFokus);
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
    angre = { farge, ider: FORSLAG[farge].filter(id => ui.alle().some(apning => apning.id === id)) };
    for (const id of angre.ider) settValgt(ui.fremgang(), id, true);
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

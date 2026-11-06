// The home of everything you do alone. It saves nothing of its own: the numbers are the trainer's and the puzzles'.
import { lesApning } from '../sjakk/apninger/modell.mjs';
import { lagKort } from '../sjakk/apninger/kort.mjs';
import { erValgt } from '../sjakk/apninger/repertoar.mjs';
import { NOKKEL as FREMGANG, lagreFremgang, lesFremgang } from '../sjakk/apninger/repetisjon.mjs';
import { lagSynk } from '../sjakk/apninger/synk.mjs';
import { hilsen } from '../sjakk/apninger/trener.mjs';
import { NOKKEL as OPPGAVE_LAGER, les } from '../sjakk/oppgaver/lagring.mjs';
import { bandForNiva, iDagOslo } from '../sjakk/oppgaver/utvalg.mjs';
import { apningerHtml, feilHtml, finnDagens, nesteHtml, oppgaveOversikt, oppgaveStilling, oppgaverHtml, venterHtml } from './oversikt.mjs';

const APNING_DATA = '/sjakk/apninger/data/';
const OPPGAVE_DATA = '/sjakk/oppgaver/data/';
const $ = valg => document.querySelector(valg);
const lager = (() => { try { return window.localStorage; } catch { return { getItem: () => null, setItem() {} }; } })();

let fremgang = lesFremgang(lager);
let manifest = null;
let feilet = false;
const apninger = new Map();
let kortMinne = { nokkel: null, kort: [] };
let stilling = null;
let stillingFor = null;

const harValgt = () => Object.values(fremgang.repertoar).some(post => post?.valgt === true);
const valgte = () => (manifest?.apninger ?? []).map(id => apninger.get(id)).filter(apning => apning && erValgt(fremgang, apning.id));

function kort() {
  const utvalg = valgte();
  const nokkel = utvalg.map(apning => apning.id).join();
  if (nokkel !== kortMinne.nokkel) kortMinne = { nokkel, kort: lagKort(utvalg) };
  return kortMinne.kort;
}

const ui = { valgte, kort, fremgang: () => fremgang };

// Only the chosen openings: the cards need nothing else, and a new visitor needs no trees at all.
async function lastValgte() {
  try {
    if (!manifest) {
      const svar = await fetch(`${APNING_DATA}manifest.json`);
      if (!svar.ok) throw new Error(`manifest ${svar.status}`);
      manifest = await svar.json();
    }
    const mangler = manifest.apninger.filter(id => erValgt(fremgang, id) && !apninger.has(id));
    const filer = await Promise.all(mangler.map(id => fetch(`${APNING_DATA}${id}.json`).then(r => (r.ok ? r.json() : null)).catch(() => null)));
    for (const data of filer.filter(Boolean)) {
      const { apning } = lesApning(data);
      if (apning) apninger.set(apning.id, apning);
    }
    feilet = false;
  } catch {
    feilet = true;
  }
}

// The picture of today's puzzle comes last. Without it the page says the same.
async function hentStilling(t, dato, oversikt) {
  const nokkel = `${dato}|${oversikt.niva}|${t.dagens[dato]?.id ?? ''}`;
  if (oversikt.plassering || nokkel === stillingFor || navigator.connection?.saveData) return;
  stillingFor = nokkel;
  try {
    const rader = (await Promise.all(bandForNiva(oversikt.niva).map(band => fetch(`${OPPGAVE_DATA}b${band}.json`).then(r => (r.ok ? r.json() : []))))).flat();
    const oppgave = finnDagens(t, dato, rader);
    stilling = oppgave ? oppgaveStilling(oppgave) : null;
  } catch {
    stilling = null;
  }
  tegn();
}

// Only what changed is replaced, so a redraw does not take the keyboard away from a link.
const vist = new Map();
function sett(valg, html) {
  if (vist.get(valg) === html) return;
  vist.set(valg, html);
  $(valg).innerHTML = html;
}

function tegn() {
  const venter = harValgt() && !manifest && !feilet;
  const dato = iDagOslo();
  const t = les(lager);
  const oversikt = oppgaveOversikt(t, dato);
  $('#en-dato').textContent = new Intl.DateTimeFormat('nb-NO', { timeZone: 'Europe/Oslo', weekday: 'long', day: 'numeric', month: 'long' }).format(new Date()).toUpperCase();
  $('#en-hilsen').textContent = `${hilsen(new Date().getHours())}!`;
  $('#en-intro').hidden = harValgt() || t.antall > 0;
  sett('#en-neste', venter ? venterHtml : feilet && harValgt() ? feilHtml : nesteHtml(ui));
  sett('#en-apninger', apningerHtml(ui, { venter, antall: manifest?.apninger.length }));
  sett('#en-oppgaver', oppgaverHtml(oversikt, stilling));
  hentStilling(t, dato, oversikt);
}

function visKonto(status) {
  const felt = $('#ap-konto');
  felt.hidden = !status;
  if (status === 'inne') felt.innerHTML = 'Repertoaret er lagret på <a href="/konto">kontoen din</a>.';
  if (status === 'ute') felt.innerHTML = 'Vil du ha repertoaret på alle enhetene dine? <a href="/logg-inn?neste=/sjakk-for-1">Logg inn</a>.';
}

async function oppdater() {
  await lastValgte();
  tegn();
}

const synk = lagSynk({ lager, hent: () => fremgang, status: visKonto, sett(ny) { fremgang = ny; lagreFremgang(lager, fremgang); oppdater(); } });

function lesPaNytt() {
  fremgang = lesFremgang(lager);
  oppdater();
}

// Coming back from a session, in this tab or from another, the numbers have moved.
window.addEventListener('storage', event => { if ([FREMGANG, OPPGAVE_LAGER].includes(event.key)) lesPaNytt(); });
window.addEventListener('pageshow', event => { if (event.persisted) lesPaNytt(); });
document.addEventListener('visibilitychange', () => {
  const synlig = document.visibilityState === 'visible';
  if (synlig) lesPaNytt();
  synk.synlig(synlig);
});

tegn();
await oppdater();
synk.start();

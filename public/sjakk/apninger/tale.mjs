// Tora's voice: the coach's text made speakable, the best Norwegian voice the browser has, and speech that can pause and stop.
// Only the browser's own speech (Web Speech API). A step could later bring its own recorded sound; si() takes the whole step for that reason.

const BRIKKE = { K: 'konge', D: 'dronning', T: 'tårn', L: 'løper', S: 'springer' };
const ENER = ['null', 'en', 'to', 'tre', 'fire', 'fem', 'seks', 'sju', 'åtte', 'ni', 'ti', 'elleve', 'tolv', 'tretten', 'fjorten', 'femten', 'seksten', 'sytten', 'atten', 'nitten'];
const TIERE = ['', '', 'tjue', 'tretti', 'førti', 'femti', 'seksti', 'sytti', 'åtti', 'nitti'];

export function tallOrd(n) {
  if (!Number.isInteger(n) || n < 0 || n > 99) return String(n);
  if (n < 20) return ENER[n];
  return TIERE[Math.floor(n / 10)] + (n % 10 ? ENER[n % 10] : '');
}

const FORKORTELSER = [[/\bf\.eks\./g, 'for eksempel'], [/\bbl\.a\./g, 'blant annet'], [/\bdvs\./g, 'det vil si'], [/\bosv\./g, 'og så videre'], [/\bca\./g, 'cirka'], [/\bevt\./g, 'eventuelt'], [/\bmht\./g, 'med hensyn til']];
const UTENFOR = '(?<![\\p{L}\\p{N}])';
const ETTER = '(?![\\p{L}\\p{N}])';
// A move in the coach's notation, with an optional move number in front: "3.Sf3", "4…Lc5", "…Dd4", "exd5", "0-0", "e8=D+".
const TREKK = new RegExp(`${UTENFOR}(?:(\\d{1,3})\\s?(\\.\\.\\.|…|\\.)\\s?|(…|\\.\\.\\.))?(0-0-0|O-O-O|0-0|O-O|([KDTLS])([a-h]?[1-8]?)(x?)([a-h][1-8])|([a-h])(?:x([a-h][1-8])|([1-8]))(?:=([DTLS]))?)([+#])?([!?]{1,2})?${ETTER}`, 'gu');
// What follows a move is another move, not a new sentence.
const NESTE_TREKK = /^\s+(?:\d{1,3}\s?(?:\.\.\.|…|\.)\s?|…)?(?:[KDTLS][a-h1-8x]|0-0|O-O)/;
// A piece's route: "Sf6–g4" or "f2-f4".
const VEI = new RegExp(`${UTENFOR}(?:…|\\.\\.\\.)?([KDTLS])?([a-h][1-8])[–-]([a-h][1-8])${ETTER}`, 'gu');

function trekkOrd(m) {
  const [, nummer, skille, , kjerne, brikke, presis, slag, mal, fil, slagMal, rad, forvandling, sjakk] = m;
  let ord;
  if (/^[0O]-[0O]-[0O]$/.test(kjerne)) ord = 'lang rokade';
  else if (/^[0O]-[0O]$/.test(kjerne)) ord = 'kort rokade';
  else if (brikke) ord = `${BRIKKE[brikke]} ${presis ? `${presis} ` : ''}${slag ? 'tar ' : ''}${mal}`;
  else ord = `${slagMal ? `${fil} tar ${slagMal}` : `${fil}${rad}`}${forvandling ? ` blir ${BRIKKE[forvandling]}` : ''}`;
  if (sjakk) ord += sjakk === '#' ? ', matt' : ', sjakk';
  if (nummer) ord = `${tallOrd(Number(nummer))}${skille === '.' ? '' : ','} ${ord}`;
  return ord;
}

// "Etter 3.Sf3 Sc6 4.Lc4 Lc5 er 5.0-0 naturlig" becomes "Etter tre springer f3, springer c6, fire løper c4, løper c5 er fem kort rokade naturlig".
export function taleTekst(tekst) {
  let ut = String(tekst ?? '');
  for (const [monster, erstatning] of FORKORTELSER) ut = ut.replace(monster, erstatning);
  ut = ut.replace(VEI, (_, brikke, fra, til) => `${brikke ? `${BRIKKE[brikke]} ` : ''}fra ${fra} til ${til}`);
  // Each move is marked, so moves that follow each other get a short pause between them.
  ut = ut.replace(TREKK, (...args) => {
    // The match and its 14 groups, then where it stands and the whole text.
    const m = args.slice(0, 15);
    const etter = args[16].slice(args[15] + m[0].length);
    // "2.f4! Hvit ofrer": the mark is not read, but the sentence still ends. "Lxf7+! Kxf7" goes on.
    const slutt = m[14] && (!etter.trim() || (/^\s+\p{Lu}/u.test(etter) && !NESTE_TREKK.test(etter))) ? '.' : '';
    return `\u0001${trekkOrd(m)}${slutt}\u0002`;
  });
  return ut.replace(/\u0002[ \t]+\u0001/g, ', ').replace(/[\u0001\u0002]/g, '').replace(/\s{2,}/g, ' ').trim();
}

// Sentences, so speech can stop and pick up again at a sentence, and long texts do not trip the browser.
export const setninger = tekst => taleTekst(tekst).split(/(?<=[.!?:])\s+(?=\S)/u).filter(s => s.trim());

// The best Norwegian voice: Bokmål before Norwegian before Nynorsk, natural and online voices first.
export function stemmePoeng(stemme) {
  const sprak = String(stemme?.lang ?? '').toLowerCase().replace('_', '-');
  const navn = String(stemme?.name ?? '').toLowerCase();
  let poeng;
  if (sprak === 'nb-no' || sprak === 'nb') poeng = 100;
  else if (sprak === 'no-no' || sprak === 'no') poeng = 90;
  else if (sprak.startsWith('nb-') || sprak.startsWith('no-')) poeng = 80;
  else if (sprak.startsWith('nn')) poeng = 40;
  else if (/norsk|norwegian|bokmål/.test(navn)) poeng = 60;
  else return -1;
  if (/natural|neural|naturlig/.test(navn)) poeng += 20;
  if (/online/.test(navn) || stemme.localService === false) poeng += 8;
  if (/google/.test(navn)) poeng += 4;
  // Tora is a woman; the voices with a name are told apart by it.
  if (/pernille|iselin|hulda|nora|liv/.test(navn)) poeng += 2;
  return poeng;
}
export function velgStemme(stemmer = []) {
  let best = null, bestPoeng = -1;
  for (const stemme of stemmer) { const p = stemmePoeng(stemme); if (p > bestPoeng) { best = stemme; bestPoeng = p; } }
  return best;
}
// "Microsoft Pernille Online (Natural) - Norwegian (Bokmål) (Norway)" → "Pernille".
export const stemmeKortnavn = stemme => (String(stemme?.name ?? '').replace(/^(Microsoft|Google|Apple)\s+/i, '').match(/^[\p{L}-]+/u)?.[0] ?? '');

// Roughly how long a sentence takes to say, for the watchdog: some browsers never say a sentence is done.
const taletid = (setning, fart) => (1200 + setning.split(/\s+/).length * 420) / fart;

export const TALE_NOKKEL = 'sjakk-apninger-tale';
export const FARTER = [0.8, 1, 1.25, 1.5];

export function lesInnstilling(lager) {
  try {
    const data = JSON.parse(lager?.getItem(TALE_NOKKEL));
    return { paa: data?.paa !== false, fart: FARTER.includes(data?.fart) ? data.fart : 1 };
  } catch { return { paa: true, fart: 1 }; }
}

// synth is window.speechSynthesis (or a stand-in in tests). Ytring is the SpeechSynthesisUtterance class.
export function lagTale({ synth = globalThis.speechSynthesis, Ytring = globalThis.SpeechSynthesisUtterance, lager = null, naarEndret = () => {} } = {}) {
  let innstilling = lesInnstilling(lager);
  let stemme = null;
  let lastet = false;
  let aktiv = null;
  const finnes = Boolean(synth && Ytring);

  function oppdater() {
    const liste = synth.getVoices?.() ?? [];
    if (liste.length) lastet = true;
    const ny = velgStemme(liste);
    if (ny !== stemme) { stemme = ny; naarEndret(); }
  }
  if (finnes) {
    oppdater();
    synth.addEventListener?.('voiceschanged', () => { lastet = true; oppdater(); naarEndret(); });
    // Some browsers never fire the event when there are no voices at all.
    setTimeout(() => { if (!lastet) { lastet = true; naarEndret(); } }, 1500);
  }
  const lagre = () => { try { lager?.setItem(TALE_NOKKEL, JSON.stringify(innstilling)); } catch { /* The setting lasts for this visit. */ } };

  // One run of speech. ferdig resolves when the last sentence is said, or never when it is stopped.
  function si(steg) {
    aktiv?.avbryt();
    const deler = setninger(typeof steg === 'string' ? steg : steg.tekst);
    let i = 0, pauset = false, stoppet = false, vakt = null, runde = 0;
    let ferdigSvar;
    const ferdig = new Promise(svar => { ferdigSvar = svar; });
    const kjor = () => {
      clearTimeout(vakt);
      if (stoppet || pauset) return;
      if (i >= deler.length || !stemme) { if (aktiv === kontroll) aktiv = null; ferdigSvar(); return; }
      const denne = ++runde;
      const ytring = new Ytring(deler[i]);
      ytring.voice = stemme;
      ytring.lang = stemme.lang;
      ytring.rate = innstilling.fart;
      const videre = () => { if (denne !== runde || stoppet || pauset) return; i += 1; kjor(); };
      ytring.onend = videre;
      ytring.onerror = event => { if (!['interrupted', 'canceled'].includes(event?.error)) videre(); };
      vakt = setTimeout(videre, taletid(deler[i], innstilling.fart) * 2 + 3000);
      synth.speak(ytring);
    };
    const kontroll = {
      ferdig,
      // Pausing stops the sentence; going on says it again from its start. synth.pause() is not to be trusted.
      pause() { if (stoppet || pauset) return; pauset = true; runde += 1; clearTimeout(vakt); synth.cancel(); },
      fortsett() { if (stoppet || !pauset) return; pauset = false; kjor(); },
      avbryt() { if (stoppet) return; stoppet = true; runde += 1; clearTimeout(vakt); synth.cancel(); if (aktiv === kontroll) aktiv = null; },
      get pauset() { return pauset; },
    };
    aktiv = kontroll;
    synth.cancel();
    kjor();
    return kontroll;
  }

  return {
    get finnes() { return finnes; },
    get lastet() { return lastet || !finnes; },
    get stemme() { return stemme; },
    get kan() { return finnes && Boolean(stemme); },
    get paa() { return innstilling.paa; },
    get fart() { return innstilling.fart; },
    // Whether this step should be read: switched on and a Norwegian voice to read it with.
    get leser() { return innstilling.paa && finnes && Boolean(stemme); },
    settPaa(paa) { innstilling = { ...innstilling, paa }; lagre(); if (!paa) aktiv?.avbryt(); naarEndret(); },
    settFart(fart) { innstilling = { ...innstilling, fart }; lagre(); naarEndret(); },
    si,
    stopp() { aktiv?.avbryt(); },
  };
}

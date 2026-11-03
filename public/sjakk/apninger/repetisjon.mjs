// Leitner-style spaced repetition per line, plus mistake tracking. Pure functions; storage is passed in.
export const NOKKEL = 'sjakk-apninger';
export const VERSJON = 1;
export const INTERVALL_DAGER = [0, 1, 3, 7, 16, 35];
const DAG = 86400000;

export const tomFremgang = () => ({ versjon: VERSJON, linjer: {}, feil: {}, feller: {} });

export function lesFremgang(lager) {
  try {
    const data = JSON.parse(lager.getItem(NOKKEL));
    if (data?.versjon === VERSJON && data.linjer && data.feil) return { ...tomFremgang(), ...data };
  } catch { /* Corrupt or missing progress starts fresh. */ }
  return tomFremgang();
}

export function lagreFremgang(lager, fremgang) {
  try { lager.setItem(NOKKEL, JSON.stringify(fremgang)); } catch { /* Private mode: progress lasts for this tab only. */ }
}

const nokkel = (apningId, linjeId) => `${apningId}|${linjeId}`;
export const linjePost = (fremgang, apningId, linjeId) => fremgang.linjer[nokkel(apningId, linjeId)] ?? null;

// A clean run moves the line up one box; any mistake sends it back to box 0 (due again right away).
// A clean extra round on a line that is not due yet keeps its box and due date.
export function vurderLinje(fremgang, apningId, linjeId, feil, naa = Date.now()) {
  const forrige = linjePost(fremgang, apningId, linjeId);
  if (!feil && forrige && forrige.forfall > naa) {
    const post = { ...forrige, sist: naa, runder: (forrige.runder ?? 0) + 1 };
    fremgang.linjer[nokkel(apningId, linjeId)] = post;
    return post;
  }
  const boks = feil ? 0 : Math.min(INTERVALL_DAGER.length - 1, (forrige?.boks ?? 0) + 1);
  const post = { boks, forfall: naa + INTERVALL_DAGER[boks] * DAG, sist: naa, runder: (forrige?.runder ?? 0) + 1, feilfrie: (forrige?.feilfrie ?? 0) + (feil ? 0 : 1) };
  fremgang.linjer[nokkel(apningId, linjeId)] = post;
  return post;
}

export function noterFeil(fremgang, apningId, sti, san, naa = Date.now()) {
  const liste = (fremgang.feil[apningId] ??= {});
  const post = (liste[sti] ??= { antall: 0, spilt: {} });
  post.antall += 1;
  post.spilt[san] = (post.spilt[san] ?? 0) + 1;
  post.sist = naa;
}

export function statusFor(apning, fremgang, naa = Date.now()) {
  let laert = 0, forfaller = 0, nye = 0;
  for (const linje of apning.linjer) {
    const post = linjePost(fremgang, apning.id, linje.id);
    if (!post) nye += 1;
    else {
      if (post.boks >= 1) laert += 1;
      if (post.forfall <= naa) forfaller += 1;
    }
  }
  return { totalt: apning.linjer.length, laert, forfaller, nye };
}

// Due lines first (weakest box, oldest due), then new lines in tree order, then the next to fall due.
export function velgLinje(apning, fremgang, naa = Date.now(), forrigeId = null) {
  const kandidater = apning.linjer.map((linje, rekkefolge) => ({ linje, rekkefolge, post: linjePost(fremgang, apning.id, linje.id) }));
  const andre = kandidater.length > 1 ? kandidater.filter(k => k.linje.id !== forrigeId) : kandidater;
  const forfalt = andre.filter(k => k.post && k.post.forfall <= naa).sort((a, b) => a.post.boks - b.post.boks || a.post.forfall - b.post.forfall);
  if (forfalt.length) return { linje: forfalt[0].linje, grunn: 'repetisjon' };
  const nye = andre.filter(k => !k.post);
  if (nye.length) return { linje: nye[0].linje, grunn: 'ny' };
  const neste = [...andre].sort((a, b) => a.post.forfall - b.post.forfall)[0];
  return { linje: neste.linje, grunn: 'ekstra' };
}

// The positions the player trips over most, across all openings.
export function vansker(fremgang, grense = 3) {
  const alle = [];
  for (const [apningId, liste] of Object.entries(fremgang.feil)) for (const [sti, post] of Object.entries(liste)) alle.push({ apningId, sti, ...post });
  return alle.sort((a, b) => b.antall - a.antall || (b.sist ?? 0) - (a.sist ?? 0)).slice(0, grense);
}

export const dagerTil = (tid, naa = Date.now()) => Math.max(0, Math.round((tid - naa) / DAG));

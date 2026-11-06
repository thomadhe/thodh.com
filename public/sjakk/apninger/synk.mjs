// Optional account sync. The trainer lives in localStorage; signed-in players also get it on their other devices.
// Every entry carries its own time, so two devices merge entry by entry and neither overwrites the other.
import { tomFremgang } from './repetisjon.mjs';

export const API = '/sjakk/api/apninger';
export const KONTO = 'sjakk-apninger-konto';
const VENT = 2500;
const NY_SJEKK = 30000;
const MAKS_FORSOK = 3;
const MAKS_KEEPALIVE = 60000;

const nyest = felt => (a, b) => ((b?.[felt] ?? 0) > (a?.[felt] ?? 0) ? b : a);
const flest = (a, b) => ((b?.antall ?? 0) > (a?.antall ?? 0) ? b : a);

function flett(a = {}, b = {}, velg) {
  const ut = { ...a };
  for (const [nokkel, verdi] of Object.entries(b)) ut[nokkel] = nokkel in ut ? velg(ut[nokkel], verdi) : verdi;
  return ut;
}

export function slaSammen(a, b) {
  return {
    ...tomFremgang(),
    linjer: flett(a.linjer, b.linjer, nyest('sist')),
    feil: flett(a.feil, b.feil, (x, y) => flett(x, y, flest)),
    feller: flett(a.feller, b.feller, nyest('lost')),
    repertoar: flett(a.repertoar, b.repertoar, nyest('sist')),
    kort: flett(a.kort, b.kort, nyest('sist')),
  };
}

const sortert = verdi => {
  if (Array.isArray(verdi)) return verdi.map(sortert);
  if (!verdi || typeof verdi !== 'object') return verdi;
  return Object.fromEntries(Object.keys(verdi).sort().map(nokkel => [nokkel, sortert(verdi[nokkel])]));
};
// The database stores keys in its own order.
export const lik = (a, b) => JSON.stringify(sortert(a)) === JSON.stringify(sortert(b));

// status gets 'inne' (signed in), 'ute' (signed out) or null (no answer: say nothing).
export function lagSynk({ lager, hent, sett, status, nettet = (...args) => fetch(...args), vent = VENT, klokke = Date.now }) {
  let konto = null;
  let revision = 0;
  let skitten = false;
  let opptatt = false;
  let timer = null;
  let sjekket = 0;

  async function hentOgFlett() {
    const svar = await nettet(API, { credentials: 'same-origin', cache: 'no-store' });
    if (svar.status === 401) { konto = null; return false; }
    if (!svar.ok) throw new Error(`synk ${svar.status}`);
    const data = await svar.json();
    const lokal = hent();
    const fjern = data.state ? { ...tomFremgang(), ...data.state } : tomFremgang();
    // What another account left on this device stays out of this account.
    const eier = lager.getItem(KONTO);
    const flettet = eier && eier !== data.userId ? fjern : slaSammen(fjern, lokal);
    konto = data.userId;
    revision = data.revision;
    sjekket = klokke();
    lager.setItem(KONTO, konto);
    if (!lik(flettet, fjern)) skitten = true;
    if (!lik(flettet, lokal)) sett(flettet);
    return true;
  }

  async function send() {
    if (!konto || opptatt || !skitten) return;
    opptatt = true;
    try {
      for (let forsok = 0; skitten && konto && forsok < MAKS_FORSOK; forsok += 1) {
        skitten = false;
        const kropp = JSON.stringify({ userId: konto, revision, state: hent() });
        const svar = await nettet(API, { method: 'PUT', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, body: kropp, keepalive: kropp.length < MAKS_KEEPALIVE });
        if (svar.ok) { revision = (await svar.json()).revision; continue; }
        const { code } = await svar.json().catch(() => ({}));
        if (code === 'conflict') { skitten = true; await hentOgFlett(); continue; }
        skitten = true;
        if (svar.status === 401 || code === 'account_changed') { konto = null; status('ute'); }
        return;
      }
    } catch {
      skitten = true;
    } finally {
      opptatt = false;
    }
  }

  async function sjekk() {
    try {
      status(await hentOgFlett() ? 'inne' : 'ute');
      await send();
    } catch {
      if (!konto) status(null);
    }
  }

  return {
    start: sjekk,
    send,
    endret() {
      skitten = true;
      clearTimeout(timer);
      if (konto) timer = setTimeout(send, vent);
    },
    // Leaving the page saves now; coming back picks up what the other device did.
    synlig(erSynlig) {
      if (!erSynlig) { clearTimeout(timer); return send(); }
      return konto && klokke() - sjekket > NY_SJEKK ? sjekk() : undefined;
    },
  };
}

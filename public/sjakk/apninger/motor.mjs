// Stockfish in a Web Worker (lite, single-threaded WASM). One search at a time: a new position stops the running
// search and waits for its bestmove before it starts, so an old result can never land on a newer position.
export const MAKS_DYBDE = 18;
export const MAKS_TID = 2500;
const MIN_DYBDE = 10;
const OPPSTART_FRIST = 30000;
const SVAR_FRIST = 4000;

// UCI scores are from the side to move. Everything from here on is from White's view.
export function lesInfo(linje, fen) {
  const treff = /^info .*?\bdepth (\d+) .*?\bscore (cp|mate) (-?\d+)( lowerbound| upperbound)?/.exec(linje);
  if (!treff || treff[4] || treff[1] === '0' || /\bmultipv [2-9]/.test(linje)) return null;
  const tall = Number(treff[3]);
  const hvit = fen.split(' ')[1] === 'b' && tall ? -tall : tall;
  return { dybde: Number(treff[1]), verdi: treff[2] === 'cp' ? { cp: hvit } : { matt: hvit } };
}

const nyWorker = () => new Worker(new URL('../vendor/stockfish-19-lite-single.js', import.meta.url));

// naarFeil fires once if the engine fails to load, stops answering or is too slow to be useful.
export function lagMotor({ lagWorker = nyWorker, naarFeil = () => {} } = {}) {
  let worker = null;
  let klar = false;
  let sok = null;
  let neste = null;
  let vakt = null;
  let trege = 0;
  let dod = false;

  function rydd() {
    clearTimeout(vakt);
    worker?.terminate();
    worker = null;
    klar = false;
    sok = null;
    neste = null;
  }
  function feil() {
    if (dod) return;
    dod = true;
    rydd();
    naarFeil();
  }
  const settVakt = ms => { clearTimeout(vakt); vakt = setTimeout(feil, ms); };

  function kjor() {
    sok = { ...neste, dybde: 0, avbrutt: false };
    neste = null;
    worker.postMessage(`position fen ${sok.fen}`);
    worker.postMessage(`go depth ${MAKS_DYBDE} movetime ${MAKS_TID}`);
    settVakt(MAKS_TID + SVAR_FRIST);
  }
  function stoppSok() {
    if (!sok || sok.avbrutt) return;
    sok.avbrutt = true;
    worker.postMessage('stop');
  }

  function fikkLinje(linje) {
    if (linje === 'readyok' && !klar) {
      klar = true;
      clearTimeout(vakt);
      if (neste) kjor();
    } else if (sok && linje.startsWith('info ')) {
      const info = sok.avbrutt ? null : lesInfo(linje, sok.fen);
      if (!info) return;
      sok.dybde = info.dybde;
      sok.naarVerdi?.(info);
    } else if (sok && linje.startsWith('bestmove')) {
      clearTimeout(vakt);
      const ferdig = sok;
      sok = null;
      if (!ferdig.avbrutt) {
        trege = ferdig.dybde < MIN_DYBDE ? trege + 1 : 0;
        if (trege >= 2) { feil(); return; }
        ferdig.naarFerdig?.();
      }
      if (neste) kjor();
    }
  }

  function start() {
    try {
      const ny = lagWorker();
      worker = ny;
      ny.onmessage = event => { if (ny === worker) fikkLinje(String(event.data)); };
      ny.onerror = event => { event.preventDefault?.(); if (ny === worker) feil(); };
      ny.postMessage('uci');
      ny.postMessage('isready');
      settVakt(OPPSTART_FRIST);
    } catch { feil(); }
  }

  return {
    analyser(fen, { naarVerdi, naarFerdig } = {}) {
      if (dod) return;
      neste = { fen, naarVerdi, naarFerdig };
      if (!worker) start();
      if (dod || !klar) return;
      if (sok) stoppSok();
      else kjor();
    },
    avbryt() { neste = null; stoppSok(); },
    avslutt() { rydd(); },
  };
}

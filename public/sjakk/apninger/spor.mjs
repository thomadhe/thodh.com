// The session's progress bar, which also goes back: one segment per card, coloured by result.
// Dragging, tapping and the arrow keys all end in naarValgt; what a card shows is up to the session.
import { esc } from './trener.mjs';

const STATUS = { ny: 'ikke tatt ennå', vist: 'vist', riktig: 'riktig', hint: 'riktig med hint', feil: 'bom' };

// A card can be opened once it has been shown. The ones still to come stay shut, and so does one waiting
// for its test or a new try: a peek at the answer would make the test worth nothing.
export function sporSegmenter(okt, aktivId = null) {
  const venter = new Set(okt.ko.slice(1).map(kort => kort.id));
  return okt.kortliste.map(kort => {
    const status = okt.resultat.get(kort.id) ?? 'ny';
    const aktiv = kort.id === aktivId;
    return { kort, status, aktiv, apen: aktiv || (status !== 'ny' && !venter.has(kort.id)) };
  });
}

// The name says where and how it went, never the move, so a screen reader gives nothing away before the answer.
export function segmentNavn(segment, plass, antall) {
  const kilde = segment.kort.kilder.find(k => k.node) ?? segment.kort.kilder[0];
  return `Kort ${plass + 1} av ${antall}: ${kilde.apning.navn}, ${STATUS[segment.status]}${segment.aktiv ? ', du er her' : ''}`;
}

// Where a finger on the bar lands: the segment under it, or the closest one that can be opened.
export function segmentVed(segmenter, andel) {
  const onsket = Math.min(segmenter.length - 1, Math.max(0, Math.floor(andel * segmenter.length)));
  let best = -1;
  segmenter.forEach((segment, i) => { if (segment.apen && (best < 0 || Math.abs(i - onsket) < Math.abs(best - onsket))) best = i; });
  return best;
}

// One step with the arrow keys, over the cards that are shut.
export function nesteSegment(segmenter, fra, retning) {
  for (let i = fra + retning; i >= 0 && i < segmenter.length; i += retning) if (segmenter[i].apen) return i;
  return fra;
}

export function lagSpor(rot, { naarValgt }) {
  let segmenter = [];
  let vist = -1;
  let dra = null;
  rot.classList.add('ap-skrubb');
  rot.setAttribute('role', 'group');
  rot.setAttribute('aria-label', 'Kortene i økta. Piltastene går frem og tilbake.');

  function oppdater() {
    const knapper = rot.children;
    segmenter.forEach((segment, i) => {
      const knapp = knapper[i];
      knapp.className = `ap-segment s-${segment.status}${segment.aktiv ? ' aktiv' : ''}${i === vist ? ' ser' : ''}`;
      knapp.disabled = !segment.apen;
      knapp.tabIndex = i === vist ? 0 : -1;
      knapp.setAttribute('aria-label', segmentNavn(segment, i, segmenter.length));
      if (i === vist) knapp.setAttribute('aria-current', 'step'); else knapp.removeAttribute('aria-current');
    });
  }

  function velg(i) {
    if (i < 0 || i === vist) return;
    naarValgt(i);
  }

  function underFinger(event) {
    const { left, width } = rot.getBoundingClientRect();
    return segmentVed(segmenter, (event.clientX - left) / width);
  }

  // Up and down scrolls the page, sideways drags the bar.
  rot.addEventListener('pointerdown', event => {
    if (event.button !== 0 || !segmenter.length) return;
    dra = event.pointerId;
    rot.setPointerCapture?.(dra);
    velg(underFinger(event));
  });
  rot.addEventListener('pointermove', event => { if (event.pointerId === dra) velg(underFinger(event)); });
  const slipp = event => { if (event.pointerId === dra) dra = null; };
  rot.addEventListener('pointerup', slipp);
  rot.addEventListener('pointercancel', slipp);
  // Pointer input is handled above; this path is for keyboard activation.
  rot.addEventListener('click', event => {
    if (event.detail !== 0) return;
    const knapp = event.target.closest('.ap-segment');
    if (knapp) velg([...rot.children].indexOf(knapp));
  });

  return {
    tegn(nye, nyVist) {
      const fokus = rot.contains(document.activeElement);
      if (nye.length !== segmenter.length) rot.innerHTML = nye.map(() => '<button type="button" class="ap-segment"></button>').join('');
      segmenter = nye;
      vist = nyVist;
      oppdater();
      if (fokus) rot.children[vist]?.focus({ preventScroll: true });
    },
    flytt(retning) { velg(nesteSegment(segmenter, vist, retning)); },
    gaaTil(i) { velg(i); },
    get antall() { return segmenter.length; },
  };
}

export const statusTekst = status => esc(STATUS[status]);

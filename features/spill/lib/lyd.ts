"use client"

import { useSyncExternalStore } from "react"

// Small synthesized sound effects (Web Audio, no files): a rising chime, a soft buzz and counting ticks.
// The on/off choice is shared by all games and remembered in localStorage.

const NOKKEL = "spill:lyd"
const HENDELSE = "spill-lyd"
let ctx: AudioContext | null = null

function lesPa() {
  try {
    return localStorage.getItem(NOKKEL) !== "av"
  } catch {
    return true
  }
}

export function settLyd(pa: boolean) {
  try {
    localStorage.setItem(NOKKEL, pa ? "pa" : "av")
  } catch {}
  window.dispatchEvent(new Event(HENDELSE))
}

function abonner(varsle: () => void) {
  window.addEventListener(HENDELSE, varsle)
  window.addEventListener("storage", varsle)
  return () => {
    window.removeEventListener(HENDELSE, varsle)
    window.removeEventListener("storage", varsle)
  }
}

/** Whether sound effects are on. */
export function useLydPa() {
  return useSyncExternalStore(abonner, lesPa, () => true)
}

function kontekst() {
  ctx ??= new AudioContext()
  if (ctx.state === "suspended") void ctx.resume()
  return ctx
}

type Tone = { type?: OscillatorType; volum?: number; til?: number }

function tone(frekvens: number, start: number, varighet: number, { type = "sine", volum = 0.15, til }: Tone = {}) {
  const c = kontekst()
  const t0 = c.currentTime + start
  const o = c.createOscillator()
  const g = c.createGain()
  o.type = type
  o.frequency.setValueAtTime(frekvens, t0)
  if (til) o.frequency.exponentialRampToValueAtTime(til, t0 + varighet)
  g.gain.setValueAtTime(0.0001, t0)
  g.gain.exponentialRampToValueAtTime(volum, t0 + 0.012)
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + varighet)
  o.connect(g).connect(c.destination)
  o.start(t0)
  o.stop(t0 + varighet + 0.03)
}

/** A short burst of filtered noise, for the soft thud under the "bonk". */
function stoy(start: number, varighet: number, volum: number, frekvens: number) {
  const c = kontekst()
  const t0 = c.currentTime + start
  const buffer = c.createBuffer(1, Math.ceil(c.sampleRate * varighet), c.sampleRate)
  const data = buffer.getChannelData(0)
  for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / data.length, 3)
  const kilde = c.createBufferSource()
  const filter = c.createBiquadFilter()
  const g = c.createGain()
  kilde.buffer = buffer
  filter.type = "bandpass"
  filter.frequency.value = frekvens
  g.gain.value = volum
  kilde.connect(filter).connect(g).connect(c.destination)
  kilde.start(t0)
}

function spill(lag: () => void) {
  if (typeof window === "undefined" || !lesPa()) return
  try {
    lag()
  } catch {
    // Audio can be blocked until the first user gesture; the game works without it.
  }
}

// "Myk pop": round, bubbly sounds — a rising plop when right, a soft falling bonk when wrong.
export const lyder = {
  riktig: () =>
    spill(() => {
      tone(420, 0, 0.12, { volum: 0.25, til: 880 })
      tone(660, 0.1, 0.18, { volum: 0.2, til: 1320 })
    }),
  feil: () =>
    spill(() => {
      tone(260, 0, 0.28, { volum: 0.3, til: 110 })
      stoy(0, 0.06, 0.08, 400)
    }),
  /** A counting tick; hoyde (0–1) raises the pitch as a count nears its end. */
  tikk: (hoyde = 0) => spill(() => tone(1300 + 900 * hoyde, 0, 0.02, { volum: 0.05 })),
  velg: () => spill(() => tone(520, 0, 0.05, { volum: 0.1, til: 640 })),
  /** A plop whose pitch follows how close a guess was (0 = far, 1 = almost there). */
  naer: (styrke: number) =>
    spill(() => {
      const f = 240 + 640 * Math.min(1, Math.max(0, styrke))
      tone(f, 0, 0.14, { volum: 0.22, til: f * 1.6 })
    }),
  /** A short plop for each find in the map quizzes. */
  treff: () => spill(() => tone(600, 0, 0.09, { volum: 0.18, til: 1000 })),
  /** Three rising plops for solving the whole thing. */
  seier: () =>
    spill(() => {
      tone(420, 0, 0.12, { volum: 0.22, til: 840 })
      tone(560, 0.1, 0.12, { volum: 0.22, til: 1120 })
      tone(700, 0.2, 0.22, { volum: 0.24, til: 1400 })
    }),
  /** Crisp two-note chime for incoming friend duel challenges. */
  varsel: () =>
    spill(() => {
      tone(587.33, 0, 0.13, { type: "triangle", volum: 0.18 })
      tone(880, 0.11, 0.22, { type: "triangle", volum: 0.2 })
    }),
  /** Dramatic sub-bass drop + golden shimmer chord for a landed Rizzler Finisher. */
  rizzler: () =>
    spill(() => {
      tone(130, 0, 0.48, { type: "triangle", volum: 0.34, til: 44 })
      tone(82, 0.02, 0.46, { type: "sine", volum: 0.3, til: 38 })
      stoy(0, 0.09, 0.14, 180)
      tone(523.25, 0.06, 0.22, { type: "triangle", volum: 0.16 })
      tone(659.25, 0.12, 0.24, { type: "triangle", volum: 0.16 })
      tone(783.99, 0.18, 0.28, { type: "triangle", volum: 0.18 })
      tone(1046.5, 0.24, 0.38, { type: "sine", volum: 0.2 })
      tone(1318.5, 0.3, 0.42, { type: "sine", volum: 0.15 })
    }),
  /** Comical falling trombone slide when someone cracks a smile during Rizzler Finisher. */
  rizzFeil: () =>
    spill(() => {
      tone(311, 0, 0.18, { type: "sawtooth", volum: 0.14, til: 294 })
      tone(277, 0.18, 0.18, { type: "sawtooth", volum: 0.14, til: 262 })
      tone(247, 0.36, 0.34, { type: "sawtooth", volum: 0.15, til: 175 })
      stoy(0.36, 0.08, 0.08, 320)
    }),
}

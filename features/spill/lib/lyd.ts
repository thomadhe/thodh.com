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

function spill(lag: () => void) {
  if (typeof window === "undefined" || !lesPa()) return
  try {
    lag()
  } catch {
    // Audio can be blocked until the first user gesture; the game works without it.
  }
}

export const lyder = {
  riktig: () =>
    spill(() => {
      tone(659.3, 0, 0.14, { type: "triangle", volum: 0.2 })
      tone(987.8, 0.08, 0.3, { type: "triangle", volum: 0.2 })
    }),
  feil: () =>
    spill(() => {
      tone(196, 0, 0.32, { type: "sawtooth", volum: 0.05, til: 130 })
      tone(98, 0, 0.34, { type: "sine", volum: 0.16, til: 70 })
    }),
  tikk: () => spill(() => tone(2100, 0, 0.025, { type: "square", volum: 0.015 })),
  velg: () => spill(() => tone(520, 0, 0.06, { type: "triangle", volum: 0.08 })),
}

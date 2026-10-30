"use client"

import { ArrowUp } from "lucide-react"
import { useRef, useState } from "react"
import type { Land } from "../lib/geografi"
import { fargetone, naerhetsfarge, type Fargeanker } from "../lib/farger"
import { avstand, forslag, naerhet, retning } from "../lib/geografi-svar"
import { Knapp } from "./spill-ramme"

// Shared by the "guess the country" games (Omriss, Canvas): the guess field with suggestions and the
// Worldle-style result rows with distance, direction and a colour bar.

const PILER = ["⬆️", "↗️", "➡️", "↘️", "⬇️", "↙️", "⬅️", "↖️"]
const pil = (grader: number) => PILER[Math.round(grader / 45) % 8]

const km = (n: number) => `${Math.round(n).toLocaleString("nb-NO")} km`

/**
 * Clueless-style bar: how full and how green the row is. Most guesses land between 50 and 100 %, so that
 * range is stretched: ≤ 50 % is a red stub, ~75 % orange, ~90 % yellow, 97 %+ green.
 */
export function styrke(p: number) {
  return Math.min(1, Math.max(0, (p - 50) / 50)) ** 1.5
}

/** Proximity % → hue: red far away, orange ~85 %, yellow ~93 %, green for neighbours (97 %+). */
const ANKER: Fargeanker = [
  [60, 4],
  [75, 16],
  [85, 28],
  [91, 46],
  [95, 56],
  [97, 140],
]

export function GjetningsRad({ gjett, fasit }: { gjett: Land; fasit: Land }) {
  const riktig = gjett.id === fasit.id
  const d = avstand(gjett, fasit)
  const p = riktig ? 100 : naerhet(d)
  const s = riktig ? 1 : styrke(p)
  const farge = naerhetsfarge(fargetone(ANKER, p))
  return (
    <li className="relative h-11 overflow-hidden rounded-xl bg-neutral-100 text-sm">
      <span className="absolute inset-y-0 left-0 transition-[width] duration-700 ease-out" style={{ width: `${6 + 94 * s}%`, background: farge }} />
      <span className="relative grid h-full grid-cols-[1fr_auto_auto_3rem] items-center gap-3 px-3.5 text-neutral-950 [text-shadow:0_1px_1px_rgb(0_0_0/0.35)]">
        <span className="truncate font-medium">{gjett.navn}</span>
        <span className="font-mono text-xs tabular-nums">{riktig ? "" : km(d)}</span>
        <span className="flex w-5 justify-center">
          {riktig ? "🎉" : <ArrowUp className="h-4 w-4" style={{ transform: `rotate(${retning(gjett, fasit)}deg)` }} />}
        </span>
        <span className="text-right font-mono text-xs font-semibold tabular-nums">{p} %</span>
      </span>
    </li>
  )
}

/** One line of the share text: five squares for closeness and an arrow, or a party for the answer. */
export function delRad(gjett: Land, fasit: Land) {
  if (gjett.id === fasit.id) return "🟩🟩🟩🟩🟩🎉"
  const p = naerhet(avstand(gjett, fasit))
  const hele = Math.floor(p / 20)
  const halv = p % 20 >= 10 ? 1 : 0
  return "🟩".repeat(hele) + "🟨".repeat(halv) + "⬜".repeat(5 - hele - halv) + pil(retning(gjett, fasit))
}

/** Text field with country suggestions; Enter picks the highlighted one. */
export function LandVelger({
  utelat,
  onVelg,
  deaktivert = false,
  plassholder = "Hvilket land?",
  id,
}: {
  utelat: string[]
  onVelg: (l: Land) => void
  deaktivert?: boolean
  plassholder?: string
  id: string
}) {
  const [tekst, setTekst] = useState("")
  const [valgt, setValgt] = useState(0)
  const felt = useRef<HTMLInputElement>(null)
  const treff = forslag(tekst).filter((l) => !utelat.includes(l.id))

  const velg = (l: Land | undefined) => {
    if (!l || deaktivert) return
    setTekst("")
    setValgt(0)
    onVelg(l)
    felt.current?.focus()
  }

  return (
    <form
      className="relative flex gap-2"
      onSubmit={(e) => {
        e.preventDefault()
        velg(treff[valgt])
      }}
    >
      <input
        ref={felt}
        value={tekst}
        onChange={(e) => {
          setTekst(e.target.value)
          setValgt(0)
        }}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown") setValgt((v) => Math.min(v + 1, treff.length - 1))
          if (e.key === "ArrowUp") setValgt((v) => Math.max(v - 1, 0))
        }}
        placeholder={plassholder}
        disabled={deaktivert}
        autoComplete="off"
        autoCorrect="off"
        spellCheck={false}
        enterKeyHint="send"
        role="combobox"
        aria-expanded={treff.length > 0}
        aria-controls={id}
        aria-label="Gjett et land"
        className="h-12 min-w-0 flex-1 rounded-2xl border border-black/10 bg-[var(--spill-flate)] px-4 text-base text-neutral-950 shadow-sm outline-none transition placeholder:text-neutral-400 focus:border-neutral-900 disabled:opacity-50"
      />
      <Knapp type="submit" disabled={!treff.length || deaktivert} className="h-12 rounded-2xl">
        Gjett
      </Knapp>
      {treff.length && !deaktivert ? (
        <ul id={id} role="listbox" className="absolute top-14 right-0 left-0 z-10 overflow-hidden rounded-2xl border border-black/10 bg-[var(--spill-flate)] py-1 shadow-xl">
          {treff.map((l, i) => (
            <li key={l.id} role="option" aria-selected={i === valgt}>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => velg(l)}
                className={`w-full px-4 py-2 text-left text-sm ${i === valgt ? "bg-neutral-100 text-neutral-950" : "text-neutral-700"}`}
              >
                {l.navn}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </form>
  )
}

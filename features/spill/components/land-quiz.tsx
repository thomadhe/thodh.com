"use client"

import { Lightbulb } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { land, type Land } from "../lib/geografi"
import { finnSvar, kanBliLengre, landEtterId, type QuizModus } from "../lib/geografi-svar"
import { Knapp, Kort } from "./spill-ramme"
import { Verdenskart } from "./verdenskart"

// Sporcle-style typing quiz: every correct answer lights up on the map, no Enter needed. Practice mode
// has no clock, and hints point out a missing country and reveal its answer letter by letter.

const TID = 15 * 60 * 1000
/** An exact answer that could still grow into another one ("us" → "Usbekistan") waits this long. */
const VENT_MS = 900
const FARGE: Record<QuizModus, string> = { land: "#22d3ee", hovedsteder: "#e879f9" }
const MANGLET = "#f43f5e"
const HINT = "#fbbf24"
const KONTINENTER = ["Europa", "Asia", "Afrika", "Nord-Amerika", "Sør-Amerika", "Oseania"]

type Status = "klar" | "spiller" | "ferdig"
type Hint = { id: string; bokstaver: number }

function klokke(ms: number) {
  const s = Math.max(0, Math.ceil(ms / 1000))
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`
}

function lesRekord(modus: QuizModus) {
  try {
    return Number(localStorage.getItem(`quiz:${modus}:rekord`)) || 0
  } catch {
    return 0
  }
}

const svarFor = (modus: QuizModus, l: Land) => (modus === "land" ? l.navn : l.hovedstad)

export function LandQuiz({ modus }: { modus: QuizModus }) {
  const [status, setStatus] = useState<Status>("klar")
  const [ovelse, setOvelse] = useState(false)
  const [funnet, setFunnet] = useState<string[]>([])
  const [tekst, setTekst] = useState("")
  const [start, setStart] = useState(0)
  const [naa, setNaa] = useState(0)
  const [rekord, setRekord] = useState(0)
  const [hint, setHint] = useState<Hint | null>(null)
  const [antallHint, setAntallHint] = useState(0)
  const felt = useRef<HTMLInputElement>(null)
  const vent = useRef<ReturnType<typeof setTimeout> | null>(null)

  const brukt = naa - start
  const igjen = status === "spiller" ? TID - brukt : status === "klar" ? TID : 0
  const funnetSett = new Set(funnet)
  const total = land.length

  useEffect(() => {
    // Read after hydration; localStorage is not available on the server.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setRekord(lesRekord(modus))
  }, [modus])

  useEffect(() => () => {
    if (vent.current) clearTimeout(vent.current)
  }, [])

  const avslutt = (antall: number) => {
    setStatus("ferdig")
    setHint(null)
    // Practice rounds and rounds with hints don't count as records.
    if (!ovelse && antallHint === 0 && antall > lesRekord(modus)) {
      try {
        localStorage.setItem(`quiz:${modus}:rekord`, String(antall))
      } catch {}
      setRekord(antall)
    }
  }

  useEffect(() => {
    if (status !== "spiller") return
    const t = setInterval(() => {
      const n = Date.now()
      setNaa(n)
      // Ends on time, or once everything is found (checked here so it also covers delayed answers).
      if (funnet.length === total || (!ovelse && n - start >= TID)) {
        clearInterval(t)
        avslutt(funnet.length)
      }
    }, 250)
    return () => clearInterval(t)
    // avslutt only reads stable values and the current count.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, start, ovelse, funnet.length])

  const begynn = (utenTid: boolean) => {
    const n = Date.now()
    setOvelse(utenTid)
    setFunnet([])
    setTekst("")
    setHint(null)
    setAntallHint(0)
    setNaa(n)
    setStart(n)
    setStatus("spiller")
    requestAnimationFrame(() => felt.current?.focus())
  }

  const godta = (ider: string[]) => {
    if (vent.current) clearTimeout(vent.current)
    setFunnet((f) => [...f, ...ider.filter((id) => !f.includes(id))])
    setHint((h) => (h && ider.includes(h.id) ? null : h))
    setTekst("")
  }

  const skriv = (verdi: string) => {
    if (vent.current) clearTimeout(vent.current)
    setTekst(verdi)
    const nye = finnSvar(modus, verdi).filter((id) => !funnetSett.has(id))
    if (!nye.length) return
    if (kanBliLengre(modus, verdi, funnetSett)) vent.current = setTimeout(() => godta(nye), VENT_MS)
    else godta(nye)
  }

  const visHint = () => {
    const mal = hint && !funnetSett.has(hint.id) ? landEtterId.get(hint.id) : undefined
    if (mal) {
      setHint({ id: mal.id, bokstaver: Math.min(hint!.bokstaver + 1, svarFor(modus, mal).length) })
    } else {
      const igjen = land.filter((l) => !funnetSett.has(l.id))
      if (!igjen.length) return
      setHint({ id: igjen[Math.floor(Math.random() * igjen.length)].id, bokstaver: 1 })
    }
    setAntallHint((n) => n + 1)
    felt.current?.focus()
  }

  const farger: Record<string, string> = {}
  for (const id of funnet) farger[id] = FARGE[modus]
  if (hint && status === "spiller") farger[hint.id] = HINT
  if (status === "ferdig") for (const l of land) if (!funnetSett.has(l.id)) farger[l.id] = MANGLET

  const titler: Record<string, string> = {}
  for (const l of land) {
    if (status === "ferdig" || funnetSett.has(l.id)) titler[l.id] = modus === "land" ? l.navn : `${l.hovedstad} · ${l.navn}`
  }

  const siste = funnet.at(-1)
  const sisteLand = siste ? landEtterId.get(siste) : undefined
  const manglet = land.filter((l) => !funnetSett.has(l.id))
  const fremhevet = status === "spiller" ? [...(siste ? [siste] : []), ...(hint ? [hint.id] : [])] : undefined

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex flex-1 items-baseline gap-5">
          <p className="font-[family-name:var(--font-visning)] text-3xl font-extrabold tabular-nums tracking-tight text-neutral-950">
            {funnet.length}
            <span className="text-neutral-400">/{total}</span>
          </p>
          <p
            className={`font-mono text-2xl tabular-nums ${status === "spiller" && !ovelse && igjen < 60_000 ? "text-rose-500" : "text-neutral-600"}`}
            role="timer"
          >
            {status === "spiller" && ovelse ? klokke(brukt) : klokke(igjen)}
          </p>
          {status === "spiller" && ovelse ? <span className="font-mono text-[11px] uppercase tracking-widest text-neutral-400">Øving</span> : null}
        </div>
        {status === "spiller" ? (
          <div className="flex gap-2">
            <Knapp variant="sekundar" onClick={visHint} disabled={!manglet.length}>
              <Lightbulb className="h-4 w-4" />
              Hint{antallHint ? ` (${antallHint})` : ""}
            </Knapp>
            <Knapp variant="sekundar" onClick={() => avslutt(funnet.length)}>
              {ovelse ? "Avslutt" : "Gi opp"}
            </Knapp>
          </div>
        ) : (
          <div className="flex gap-2">
            <Knapp variant="sekundar" onClick={() => begynn(true)}>
              Øv uten tid
            </Knapp>
            <Knapp onClick={() => begynn(false)}>{status === "klar" ? "Start" : "Igjen"}</Knapp>
          </div>
        )}
      </div>

      {status === "spiller" ? (
        <form
          className="flex items-center gap-3"
          onSubmit={(e) => {
            e.preventDefault()
            const nye = finnSvar(modus, tekst).filter((id) => !funnetSett.has(id))
            if (nye.length) godta(nye)
          }}
        >
          <input
            ref={felt}
            value={tekst}
            onChange={(e) => skriv(e.target.value)}
            placeholder={modus === "land" ? "Skriv et land" : "Skriv en hovedstad"}
            autoCapitalize="none"
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            aria-label={modus === "land" ? "Skriv et land" : "Skriv en hovedstad"}
            className="h-12 min-w-0 flex-1 rounded-2xl border border-black/10 bg-[var(--spill-flate)] px-4 text-base text-neutral-950 shadow-sm outline-none transition placeholder:text-neutral-400 focus:border-neutral-900"
          />
          <p className="hidden w-52 truncate text-sm text-neutral-500 sm:block" aria-live="polite">
            {sisteLand ? (modus === "land" ? `✓ ${sisteLand.navn}` : `✓ ${sisteLand.hovedstad} (${sisteLand.navn})`) : ""}
          </p>
        </form>
      ) : null}

      {status === "ferdig" ? (
        <Kort className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
          <p className="text-neutral-900">
            {funnet.length === total ? "Alle sammen! 🎉" : `${funnet.length} av ${total}`}
            {ovelse ? <span className="ml-3 font-mono text-xs text-neutral-500">øving · {klokke(brukt)}</span> : null}
            {antallHint ? <span className="ml-3 font-mono text-xs text-neutral-500">{antallHint} hint</span> : null}
            {rekord ? <span className="ml-3 font-mono text-xs text-neutral-500">Rekord {rekord}</span> : null}
          </p>
          {manglet.length ? <p className="font-mono text-[11px] text-rose-700">{manglet.length} manglet – se rødt under</p> : null}
        </Kort>
      ) : null}

      <Verdenskart farger={farger} titler={titler} fremhevet={fremhevet} />

      {status === "klar" && rekord ? <p className="text-center font-mono text-[11px] text-neutral-500">Rekord {rekord}</p> : null}

      <Tabell
        modus={modus}
        funnet={funnetSett}
        ferdig={status === "ferdig"}
        siste={status === "spiller" ? siste : undefined}
        hint={status === "spiller" ? hint : null}
      />
    </div>
  )
}

const alfabetisk = (a: Land, b: Land) => a.navn.localeCompare(b.navn, "nb")

/**
 * Sporcle-style answer table: one column per continent, every country in alphabetical order. Slots stay
 * blank until found (a hint shows the first letters); when the quiz ends the missed ones turn red.
 */
function Tabell({
  modus,
  funnet,
  ferdig,
  siste,
  hint,
}: {
  modus: QuizModus
  funnet: Set<string>
  ferdig: boolean
  siste?: string
  hint: Hint | null
}) {
  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 lg:grid-cols-6">
      {KONTINENTER.map((k) => {
        const liste = land.filter((l) => l.kontinent === k).sort(alfabetisk)
        const n = liste.filter((l) => funnet.has(l.id)).length
        return (
          <section key={k} aria-label={k}>
            <p className="mb-1.5 flex justify-between font-mono text-[10px] uppercase tracking-widest text-neutral-400">
              <span>{k}</span>
              <span className={n === liste.length ? "text-neutral-900" : ""}>
                {n}/{liste.length}
              </span>
            </p>
            <ol className="space-y-0.5">
              {liste.map((l) => {
                const svar = svarFor(modus, l)
                const hintet = hint?.id === l.id && !funnet.has(l.id)
                const stil = funnet.has(l.id)
                  ? l.id === siste
                    ? "bg-neutral-900 text-neutral-50"
                    : "bg-neutral-100 text-neutral-900"
                  : hintet
                    ? "bg-amber-100 text-amber-900 ring-1 ring-amber-400"
                    : ferdig
                      ? "bg-rose-50 text-rose-700"
                      : "bg-neutral-100/50"
                const vist = funnet.has(l.id) || ferdig ? svar : hintet ? `${svar.slice(0, hint!.bokstaver)}…` : ""
                return (
                  <li key={l.id} className={`flex h-6 items-center gap-1.5 truncate rounded px-1.5 text-xs transition-colors ${stil}`}>
                    {modus === "hovedsteder" ? <span className="shrink-0 text-neutral-400">{l.navn}:</span> : null}
                    <span className="truncate">{vist}</span>
                  </li>
                )
              })}
            </ol>
          </section>
        )
      })}
    </div>
  )
}

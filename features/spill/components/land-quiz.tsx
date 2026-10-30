"use client"

import { useEffect, useRef, useState } from "react"
import { land } from "../lib/geografi"
import { finnSvar, landEtterId, type QuizModus } from "../lib/geografi-svar"
import { Knapp, Kort } from "./spill-ramme"
import { Verdenskart } from "./verdenskart"

// Sporcle-style typing quiz: every correct answer lights up on the map, no Enter needed.

const TID = 15 * 60 * 1000
const FARGE: Record<QuizModus, string> = { land: "#22d3ee", hovedsteder: "#e879f9" }
const MANGLET = "#f43f5e"
const KONTINENTER = ["Europa", "Asia", "Afrika", "Nord-Amerika", "Sør-Amerika", "Oseania"]

type Status = "klar" | "spiller" | "ferdig"

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

export function LandQuiz({ modus }: { modus: QuizModus }) {
  const [status, setStatus] = useState<Status>("klar")
  const [funnet, setFunnet] = useState<string[]>([])
  const [tekst, setTekst] = useState("")
  const [slutt, setSlutt] = useState(0)
  const [naa, setNaa] = useState(0)
  const [rekord, setRekord] = useState(0)
  const [visManglet, setVisManglet] = useState(false)
  const felt = useRef<HTMLInputElement>(null)

  const igjen = status === "spiller" ? slutt - naa : status === "klar" ? TID : 0
  const funnetSett = new Set(funnet)
  const total = land.length

  useEffect(() => {
    // Read after hydration; localStorage is not available on the server.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setRekord(lesRekord(modus))
  }, [modus])

  const avslutt = (antall: number) => {
    setStatus("ferdig")
    if (antall > lesRekord(modus)) {
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
      if (n >= slutt) {
        clearInterval(t)
        avslutt(funnet.length)
      }
    }, 250)
    return () => clearInterval(t)
    // avslutt only reads stable values and the current count.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, slutt, funnet.length])

  const start = () => {
    const n = Date.now()
    setFunnet([])
    setTekst("")
    setVisManglet(false)
    setNaa(n)
    setSlutt(n + TID)
    setStatus("spiller")
    requestAnimationFrame(() => felt.current?.focus())
  }

  const skriv = (verdi: string) => {
    const nye = finnSvar(modus, verdi).filter((id) => !funnetSett.has(id))
    if (!nye.length) {
      setTekst(verdi)
      return
    }
    const alle = [...funnet, ...nye]
    setFunnet(alle)
    setTekst("")
    if (alle.length === total) avslutt(alle.length)
  }

  const farger: Record<string, string> = {}
  for (const id of funnet) farger[id] = FARGE[modus]
  if (status === "ferdig") for (const l of land) if (!funnetSett.has(l.id)) farger[l.id] = MANGLET

  const titler: Record<string, string> = {}
  for (const l of land) {
    if (status === "ferdig" || funnetSett.has(l.id)) titler[l.id] = modus === "land" ? l.navn : `${l.hovedstad} · ${l.navn}`
  }

  const siste = funnet.at(-1)
  const sisteLand = siste ? landEtterId.get(siste) : undefined
  const manglet = land.filter((l) => !funnetSett.has(l.id))

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <div className="flex flex-1 items-baseline gap-5">
          <p className="font-[family-name:var(--font-visning)] text-3xl font-extrabold tabular-nums tracking-tight text-neutral-950">
            {funnet.length}
            <span className="text-neutral-400">/{total}</span>
          </p>
          <p
            className={`font-mono text-2xl tabular-nums ${status === "spiller" && igjen < 60_000 ? "text-rose-500" : "text-neutral-600"}`}
            role="timer"
          >
            {klokke(igjen)}
          </p>
        </div>
        {status === "spiller" ? (
          <Knapp variant="sekundar" onClick={() => avslutt(funnet.length)}>
            Gi opp
          </Knapp>
        ) : (
          <Knapp onClick={start}>{status === "klar" ? "Start" : "Igjen"}</Knapp>
        )}
      </div>

      {status === "spiller" ? (
        <div className="flex items-center gap-3">
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
        </div>
      ) : null}

      {status === "ferdig" ? (
        <Kort className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
          <p className="text-neutral-900">
            {funnet.length === total ? "Alle sammen! 🎉" : `${funnet.length} av ${total}`}
            {rekord ? <span className="ml-3 font-mono text-xs text-neutral-500">Rekord {rekord}</span> : null}
          </p>
          {manglet.length ? (
            <button
              type="button"
              onClick={() => setVisManglet((v) => !v)}
              className="font-mono text-[11px] uppercase tracking-widest text-neutral-500 hover:text-neutral-900"
            >
              {visManglet ? "Skjul" : `Vis de ${manglet.length} du manglet`}
            </button>
          ) : null}
        </Kort>
      ) : null}

      <Verdenskart farger={farger} titler={titler} fremhevet={status === "spiller" && siste ? [siste] : undefined} />

      <ul className="flex flex-wrap justify-center gap-x-4 gap-y-1 font-mono text-[11px] text-neutral-500">
        {KONTINENTER.map((k) => {
          const alle = land.filter((l) => l.kontinent === k)
          const n = alle.filter((l) => funnetSett.has(l.id)).length
          return (
            <li key={k} className={n === alle.length ? "text-neutral-900" : ""}>
              {k} {n}/{alle.length}
            </li>
          )
        })}
        {status === "klar" && rekord ? <li>· Rekord {rekord}</li> : null}
      </ul>

      {status === "ferdig" && visManglet ? (
        <div className="columns-2 gap-6 text-sm sm:columns-3">
          {KONTINENTER.map((k) => {
            const liste = manglet.filter((l) => l.kontinent === k)
            if (!liste.length) return null
            return (
              <div key={k} className="mb-4 break-inside-avoid">
                <p className="mb-1 font-mono text-[10px] uppercase tracking-widest text-neutral-400">{k}</p>
                <ul className="space-y-0.5 text-neutral-700">
                  {liste.map((l) => (
                    <li key={l.id}>{modus === "land" ? l.navn : `${l.hovedstad} – ${l.navn}`}</li>
                  ))}
                </ul>
              </div>
            )
          })}
        </div>
      ) : null}
    </div>
  )
}

"use client"

import { Search } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { formaterDato } from "../lib/dag"
import { useDagligTilstand, type Resultat } from "../lib/lagring"
import { lyder } from "../lib/lyd"
import { SOKET_FORSOK, type Bokstavsvar } from "../lib/soket"
import { DelKnapp, Kort } from "./spill-ramme"

type Rad = { ord: string; farger: Bokstavsvar[] }
type Tilstand = { v: 1; rader: Rad[]; svar?: string; resultat: Resultat }
const tom = (): Tilstand => ({ v: 1, rader: [], resultat: { status: "pagar" } })

const TASTATUR = ["qwertyuiopå", "asdfghjkløæ", "⏎zxcvbnm⌫"]
const RANG: Record<Bokstavsvar, number> = { ikke: 1, plass: 2, riktig: 3 }
const RUTE: Record<Bokstavsvar, string> = {
  riktig: "border-emerald-600 bg-emerald-600 text-white",
  plass: "border-amber-500 bg-amber-500 text-white",
  ikke: "border-neutral-100 bg-neutral-100 text-neutral-500",
}
const EMOJI: Record<Bokstavsvar, string> = { riktig: "🟩", plass: "🟨", ikke: "⬜" }

async function spor<T>(body: unknown): Promise<T> {
  const svar = await fetch("/spill/api/soket", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
  const data = await svar.json().catch(() => ({ melding: "Noe gikk galt." }))
  if (!svar.ok) throw new Error(data.melding ?? "Noe gikk galt.")
  return data as T
}

export function Soket({ dato, prompt, lengde }: { dato: string; prompt: string; lengde: number }) {
  const { verdi, lastet, oppdater } = useDagligTilstand<Tilstand>("soket", dato, tom)
  const [tekst, setTekst] = useState("")
  const [melding, setMelding] = useState<string | null>(null)
  const [opptatt, setOpptatt] = useState(false)
  const [rist, setRist] = useState(0)
  const ferdig = verdi.resultat.status !== "pagar"

  // The answer is fetched when the game ends, and again after a reload if that was lost.
  const trengerSvar = lastet && ferdig && !verdi.svar
  useEffect(() => {
    if (!trengerSvar) return
    spor<{ svar: string }>({ type: "fasit", dato })
      .then((s) => oppdater((t) => ({ ...t, svar: s.svar })))
      .catch(() => undefined)
  }, [trengerSvar, dato, oppdater])

  const send = async () => {
    if (ferdig || opptatt) return
    if ([...tekst].length !== lengde) {
      setMelding(`Ordet har ${lengde} bokstaver.`)
      setRist((n) => n + 1)
      return
    }
    setOpptatt(true)
    setMelding(null)
    try {
      const { farger } = await spor<{ farger: Bokstavsvar[] }>({ type: "gjett", dato, ord: tekst })
      const vunnet = farger.every((f) => f === "riktig")
      const n = verdi.rader.length + 1
      oppdater((t) => {
        if (t.resultat.status !== "pagar") return t
        const rader = [...t.rader, { ord: tekst, farger }]
        if (vunnet) return { ...t, rader, svar: tekst, resultat: { status: "vunnet", etikett: `${n}/${SOKET_FORSOK}`, poeng: SOKET_FORSOK + 1 - n } }
        if (n >= SOKET_FORSOK) return { ...t, rader, resultat: { status: "tapt", etikett: `X/${SOKET_FORSOK}`, poeng: 0 } }
        return { ...t, rader }
      })
      farger.forEach((_, i) => setTimeout(() => lyder.tikk(i / lengde), i * 180))
      setTimeout(() => (vunnet ? lyder.seier() : n >= SOKET_FORSOK ? lyder.feil() : undefined), lengde * 180 + 150)
      setTekst("")
    } catch (e) {
      setMelding((e as Error).message)
    } finally {
      setOpptatt(false)
    }
  }

  const trykk = (tast: string) => {
    if (ferdig) return
    if (tast === "⏎") void send()
    else if (tast === "⌫") setTekst((t) => [...t].slice(0, -1).join(""))
    else setTekst((t) => ([...t].length < lengde ? t + tast : t))
  }

  // Physical keyboard too.
  const trykkRef = useRef(trykk)
  useEffect(() => {
    trykkRef.current = trykk
  })
  useEffect(() => {
    const ved = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return
      if (e.key === "Enter") trykkRef.current("⏎")
      else if (e.key === "Backspace") trykkRef.current("⌫")
      else if (/^[a-zæøå]$/i.test(e.key)) trykkRef.current(e.key.toLowerCase())
      else return
      e.preventDefault()
    }
    window.addEventListener("keydown", ved)
    return () => window.removeEventListener("keydown", ved)
  }, [])

  if (!lastet) return <div className="h-96 animate-pulse rounded-3xl bg-white/5" />

  const tasteFarge = new Map<string, Bokstavsvar>()
  for (const r of verdi.rader) {
    ;[...r.ord].forEach((b, i) => {
      const f = r.farger[i]
      if (!tasteFarge.has(b) || RANG[f] > RANG[tasteFarge.get(b)!]) tasteFarge.set(b, f)
    })
  }

  const delTekst = [
    `Søket · ${formaterDato(dato, "kort")} · ${verdi.resultat.status === "vunnet" ? verdi.rader.length : "X"}/${SOKET_FORSOK}`,
    ...verdi.rader.map((r) => r.farger.map((f) => EMOJI[f]).join("")),
    "thodh.com/spill/soket",
  ].join("\n")

  return (
    <div className="flex flex-col gap-4">
      {/* A search box with the last word missing. */}
      <Kort className="flex items-center gap-3 px-5 py-4">
        <Search className="h-5 w-5 shrink-0 text-neutral-400" />
        <p className="min-w-0 flex-1 text-lg text-neutral-950">
          {prompt}{" "}
          <span className={`font-semibold ${ferdig ? (verdi.resultat.status === "vunnet" ? "text-emerald-700" : "text-rose-700") : "text-neutral-400"}`}>
            {ferdig && verdi.svar ? verdi.svar : "_".repeat(lengde).split("").join(" ")}
          </span>
        </p>
      </Kort>

      <div className="mx-auto flex flex-col gap-1.5">
        {Array.from({ length: SOKET_FORSOK }, (_, r) => {
          const rad = verdi.rader[r]
          const aktiv = !ferdig && r === verdi.rader.length
          const bokstaver = rad ? [...rad.ord] : aktiv ? [...tekst] : []
          return (
            // The key changes on each failed submit so the shake animation replays.
            <div key={aktiv ? `r${r}-${rist}` : r} className={`flex gap-1.5 ${aktiv && rist ? "sok-rist" : ""}`}>
              {Array.from({ length: lengde }, (_, i) => {
                const f = rad?.farger[i]
                return (
                  <span
                    key={i}
                    className={`flex h-12 w-11 items-center justify-center rounded-lg border-2 text-xl font-bold uppercase sm:h-14 sm:w-12 ${
                      f ? `sok-snu ${RUTE[f]}` : bokstaver[i] ? "border-neutral-500 text-neutral-950" : "border-neutral-200"
                    }`}
                    style={f ? { animationDelay: `${i * 180}ms` } : undefined}
                  >
                    {bokstaver[i] ?? ""}
                  </span>
                )
              })}
            </div>
          )
        })}
      </div>

      {melding ? (
        <p className="text-center font-mono text-[11px] text-neutral-500" role="status">
          {melding}
        </p>
      ) : null}

      {ferdig ? (
        <Kort className="px-6 py-6 text-center">
          <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-neutral-400">
            {verdi.resultat.status === "vunnet" ? "Riktig!" : "Svaret var"}
          </p>
          <p className="mt-1 text-2xl font-semibold tracking-tight text-neutral-950">
            {prompt} {verdi.svar ?? "…"}
          </p>
          <div className="mt-5 flex justify-center">
            <DelKnapp tekst={delTekst} />
          </div>
        </Kort>
      ) : (
        <div className="flex flex-col items-center gap-1.5" aria-label="Tastatur">
          {TASTATUR.map((rad) => (
            <div key={rad} className="flex gap-1">
              {[...rad].map((tast) => {
                const f = tasteFarge.get(tast)
                const bred = tast === "⏎" || tast === "⌫"
                return (
                  <button
                    key={tast}
                    type="button"
                    onClick={() => trykk(tast)}
                    disabled={opptatt}
                    aria-label={tast === "⏎" ? "Gjett" : tast === "⌫" ? "Slett" : tast}
                    className={`flex h-12 items-center justify-center rounded-md text-sm font-semibold uppercase transition active:scale-95 ${
                      bred ? "w-12 sm:w-14" : "w-7 sm:w-9"
                    } ${f ? RUTE[f] : "bg-neutral-300 text-neutral-950 hover:bg-neutral-400"}`}
                  >
                    {tast}
                  </button>
                )
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

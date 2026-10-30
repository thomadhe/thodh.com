"use client"

import { Lightbulb } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { filmtitler, type Filmtittel } from "../data/emovi/titler"
import { formaterDato } from "../lib/dag"
import { useDagligTilstand, type Resultat } from "../lib/lagring"
import { lyder } from "../lib/lyd"
import { DelKnapp, Knapp, Kort, sekundarKnapp } from "./spill-ramme"

// Emovi: five emojis, one film, three guesses. Each wrong guess (or the hint button) unlocks a hint:
// year, then director and leads, then genre.

const FORSOK = 3
const HINT = 3

type Gjetning = Filmtittel & { riktig: boolean }
type Tilstand = { v: 1; gjetninger: Gjetning[]; hint: string[]; fasit?: Filmtittel; resultat: Resultat }
const tom = (): Tilstand => ({ v: 1, gjetninger: [], hint: [], resultat: { status: "pagar" } })

async function spor<T>(body: unknown): Promise<T> {
  const svar = await fetch("/spill/api/emovi", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
  const data = await svar.json().catch(() => ({ melding: "Noe gikk galt." }))
  if (!svar.ok) throw new Error(data.melding ?? "Noe gikk galt.")
  return data as T
}

const enkel = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9æøå ]/g, "")

function FilmVelger({ utelat, onVelg, deaktivert }: { utelat: Filmtittel[]; onVelg: (f: Filmtittel) => void; deaktivert: boolean }) {
  const [tekst, setTekst] = useState("")
  const [valgt, setValgt] = useState(0)
  const felt = useRef<HTMLInputElement>(null)
  const q = enkel(tekst).trim()
  const treff =
    q.length < 2
      ? []
      : filmtitler
          .filter((f) => !utelat.some((u) => u.tittel === f.tittel && u.aar === f.aar))
          .filter((f) => enkel(f.tittel).includes(q))
          .sort((a, b) => Number(!enkel(a.tittel).startsWith(q)) - Number(!enkel(b.tittel).startsWith(q)))
          .slice(0, 7)

  const velg = (f: Filmtittel | undefined) => {
    if (!f || deaktivert) return
    setTekst("")
    setValgt(0)
    onVelg(f)
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
        placeholder="Hvilken film?"
        disabled={deaktivert}
        autoComplete="off"
        spellCheck={false}
        role="combobox"
        aria-expanded={treff.length > 0}
        aria-controls="emovi-forslag"
        aria-label="Søk etter en film"
        className="h-12 min-w-0 flex-1 rounded-2xl border border-black/10 bg-[var(--spill-flate)] px-4 text-base text-neutral-950 shadow-sm outline-none transition placeholder:text-neutral-400 focus:border-neutral-900"
      />
      <Knapp type="submit" disabled={!treff.length || deaktivert} className="h-12 rounded-2xl">
        Gjett
      </Knapp>
      {treff.length ? (
        <ul id="emovi-forslag" role="listbox" className="absolute top-14 right-0 left-0 z-10 overflow-hidden rounded-2xl border border-black/10 bg-[var(--spill-flate)] py-1 shadow-xl">
          {treff.map((f, i) => (
            <li key={`${f.tittel}-${f.aar}`} role="option" aria-selected={i === valgt}>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => velg(f)}
                className={`flex w-full justify-between px-4 py-2 text-left text-sm ${i === valgt ? "bg-neutral-100 text-neutral-950" : "text-neutral-700"}`}
              >
                <span>{f.tittel}</span>
                <span className="font-mono text-xs text-neutral-400">{f.aar}</span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </form>
  )
}

export function Emovi({ dato, emoji }: { dato: string; emoji: string }) {
  const { verdi, lastet, oppdater } = useDagligTilstand<Tilstand>("emovi", dato, tom)
  const [opptatt, setOpptatt] = useState(false)
  const [melding, setMelding] = useState<string | null>(null)
  const ferdig = verdi.resultat.status !== "pagar"

  const trengerFasit = lastet && ferdig && !verdi.fasit
  useEffect(() => {
    if (!trengerFasit) return
    spor<Filmtittel>({ type: "fasit", dato })
      .then((f) => oppdater((t) => ({ ...t, fasit: f })))
      .catch(() => undefined)
  }, [trengerFasit, dato, oppdater])

  const nesteHint = async () => {
    if (verdi.hint.length >= HINT) return
    const { tekst } = await spor<{ tekst: string }>({ type: "hint", dato, nr: verdi.hint.length + 1 })
    oppdater((t) => (t.hint.length >= HINT || t.hint.includes(tekst) ? t : { ...t, hint: [...t.hint, tekst] }))
  }

  const gjett = async (f: Filmtittel) => {
    if (ferdig || opptatt) return
    setOpptatt(true)
    setMelding(null)
    try {
      const { riktig } = await spor<{ riktig: boolean }>({ type: "gjett", dato, tittel: f.tittel, aar: f.aar })
      const n = verdi.gjetninger.length + 1
      oppdater((t) => {
        if (t.resultat.status !== "pagar") return t
        const gjetninger = [...t.gjetninger, { ...f, riktig }]
        if (riktig) return { ...t, gjetninger, fasit: f, resultat: { status: "vunnet", etikett: `${n}/${FORSOK}`, poeng: FORSOK + 1 - n } }
        if (n >= FORSOK) return { ...t, gjetninger, resultat: { status: "tapt", etikett: `X/${FORSOK}`, poeng: 0 } }
        return { ...t, gjetninger }
      })
      if (riktig) lyder.seier()
      else {
        lyder.feil()
        setMelding("Feil film!")
        if (n < FORSOK) await nesteHint()
      }
    } catch (e) {
      setMelding((e as Error).message)
    } finally {
      setOpptatt(false)
    }
  }

  if (!lastet) return <div className="h-96 animate-pulse rounded-3xl bg-white/5" />

  const delTekst = [
    `Emovi · ${formaterDato(dato, "kort")} · ${verdi.resultat.status === "vunnet" ? verdi.gjetninger.length : "X"}/${FORSOK}`,
    emoji,
    Array.from({ length: FORSOK }, (_, i) => (verdi.gjetninger[i] ? (verdi.gjetninger[i].riktig ? "🟩" : "🟥") : "⬜")).join(""),
    "thodh.com/spill/emovi",
  ].join("\n")

  return (
    <div className="flex flex-col gap-4">
      <Kort className="px-4 py-8 text-center">
        <p className="text-5xl leading-tight tracking-[0.2em] sm:text-6xl" role="img" aria-label="Dagens emojier">
          {emoji}
        </p>
      </Kort>

      {verdi.hint.length ? (
        <ul className="flex flex-col gap-1.5">
          {verdi.hint.map((h, i) => (
            <li key={i} className="mel-inn flex items-center gap-2 rounded-xl bg-amber-50 px-4 py-2.5 text-sm text-amber-900">
              <Lightbulb className="h-4 w-4 shrink-0" />
              {h}
            </li>
          ))}
        </ul>
      ) : null}

      {ferdig ? (
        <Kort className="px-6 py-6 text-center">
          <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-neutral-400">
            {verdi.resultat.status === "vunnet" ? "Riktig!" : "Filmen var"}
          </p>
          <p className="mt-1 text-3xl font-semibold tracking-tight text-neutral-950">{verdi.fasit?.tittel ?? "…"}</p>
          {verdi.fasit ? <p className="mt-1 text-sm text-neutral-500">{verdi.fasit.aar}</p> : null}
          <div className="mt-5 flex justify-center">
            <DelKnapp tekst={delTekst} />
          </div>
        </Kort>
      ) : (
        <>
          <FilmVelger utelat={verdi.gjetninger} onVelg={gjett} deaktivert={opptatt} />
          <div className="flex items-center justify-between px-1">
            <p className="font-mono text-[11px] text-neutral-500" role="status">
              {melding ?? `Forsøk ${verdi.gjetninger.length + 1} av ${FORSOK}`}
            </p>
            {verdi.hint.length < HINT ? (
              <button type="button" onClick={() => void nesteHint()} className={sekundarKnapp}>
                Få et hint
              </button>
            ) : null}
          </div>
        </>
      )}

      {verdi.gjetninger.length ? (
        <ul className="flex flex-col gap-1.5">
          {verdi.gjetninger.map((g, i) => (
            <li
              key={i}
              className={`flex items-center justify-between rounded-xl px-4 py-2.5 text-sm ${g.riktig ? "bg-emerald-600 text-white" : "bg-rose-600/90 text-white"}`}
            >
              <span>
                {g.riktig ? "✓" : "✕"} {g.tittel}
              </span>
              <span className="font-mono text-xs opacity-80">{g.aar}</span>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}

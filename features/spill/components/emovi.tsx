"use client"

import { Lightbulb } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { filmtitler, type Filmtittel } from "../data/emovi/titler"
import { formaterDato } from "../lib/dag"
import { useDagligTilstand, type Resultat } from "../lib/lagring"
import { lyder } from "../lib/lyd"
import { DelKnapp, Knapp, Kort, sekundarKnapp } from "./spill-ramme"

// Emovi: five emojis, one film, six tries shared by guesses and hints. A hint costs a try:
// year, then director and leads, then genre. After all three hints you may give up.

const FORSOK = 6
const HINT = 3

type Gjetning = Filmtittel & { riktig: boolean }
/** `plakat` is the poster URL once known (null: none), fetched with the answer. */
type Tilstand = { v: 1; gjetninger: Gjetning[]; hint: string[]; fasit?: Filmtittel; plakat?: string | null; resultat: Resultat }
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
  // Guesses and hints share the tries; a hint is only offered while a guess would still be left after it.
  const brukt = verdi.gjetninger.length + verdi.hint.length
  const igjen = FORSOK - brukt
  const kanHint = !ferdig && verdi.hint.length < HINT && igjen > 1

  const trengerFasit = lastet && ferdig && (!verdi.fasit || verdi.plakat === undefined)
  useEffect(() => {
    if (!trengerFasit) return
    spor<Filmtittel & { plakat: string | null }>({ type: "fasit", dato })
      .then(({ tittel, aar, plakat }) => oppdater((t) => ({ ...t, fasit: { tittel, aar }, plakat })))
      .catch(() => undefined)
  }, [trengerFasit, dato, oppdater])

  const nesteHint = async () => {
    if (!kanHint || opptatt) return
    setOpptatt(true)
    setMelding(null)
    try {
      const { tekst } = await spor<{ tekst: string }>({ type: "hint", dato, nr: verdi.hint.length + 1 })
      lyder.velg()
      oppdater((t) =>
        t.resultat.status !== "pagar" || t.hint.length >= HINT || t.hint.includes(tekst) || t.gjetninger.length + t.hint.length >= FORSOK - 1
          ? t
          : { ...t, hint: [...t.hint, tekst] },
      )
    } catch (e) {
      setMelding((e as Error).message)
    } finally {
      setOpptatt(false)
    }
  }

  const giOpp = () => {
    if (ferdig || kanHint) return
    lyder.feil()
    oppdater((t) => (t.resultat.status !== "pagar" ? t : { ...t, resultat: { status: "tapt", etikett: `X/${FORSOK}`, poeng: 0 } }))
  }

  const gjett = async (f: Filmtittel) => {
    if (ferdig || opptatt) return
    setOpptatt(true)
    setMelding(null)
    try {
      const { riktig, plakat } = await spor<{ riktig: boolean; plakat?: string | null }>({ type: "gjett", dato, tittel: f.tittel, aar: f.aar })
      oppdater((t) => {
        if (t.resultat.status !== "pagar") return t
        const n = t.gjetninger.length + t.hint.length + 1
        const gjetninger = [...t.gjetninger, { ...f, riktig }]
        if (riktig) return { ...t, gjetninger, fasit: f, plakat: plakat ?? null, resultat: { status: "vunnet", etikett: `${n}/${FORSOK}`, poeng: FORSOK + 1 - n } }
        if (n >= FORSOK) return { ...t, gjetninger, resultat: { status: "tapt", etikett: `X/${FORSOK}`, poeng: 0 } }
        return { ...t, gjetninger }
      })
      if (riktig) lyder.seier()
      else {
        lyder.feil()
        setMelding("Feil film!")
      }
    } catch (e) {
      setMelding((e as Error).message)
    } finally {
      setOpptatt(false)
    }
  }

  if (!lastet) return <div className="h-96 animate-pulse rounded-3xl bg-white/5" />

  const delTekst = [
    `Emovi · ${formaterDato(dato, "kort")} · ${verdi.resultat.status === "vunnet" ? brukt : "X"}/${FORSOK}`,
    emoji,
    [...verdi.hint.map(() => "💡"), ...verdi.gjetninger.map((g) => (g.riktig ? "🟩" : "🟥")), ...Array<string>(Math.max(0, igjen)).fill("⬜")].join(""),
    "thodh.com/spill/emovi",
  ].join("\n")

  return (
    <div className="flex flex-col gap-4">
      <Kort className="px-3 py-8">
        {/* One emoji per cell so the five always sit on one line, shrinking on narrow screens. */}
        <p className="flex flex-nowrap items-center justify-center gap-[2vw] sm:gap-3" role="img" aria-label="Dagens emojier">
          {[...new Intl.Segmenter("nb", { granularity: "grapheme" }).segment(emoji)].map((s, i) => (
            <span key={i} className="text-[clamp(2rem,12vw,3.75rem)] leading-none" aria-hidden="true">
              {s.segment}
            </span>
          ))}
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
          {verdi.plakat ? (
            // eslint-disable-next-line @next/next/no-img-element -- poster hotlinked from Wikipedia
            <img src={verdi.plakat} alt={`Plakat for ${verdi.fasit?.tittel ?? "filmen"}`} className="mel-inn mx-auto mb-4 h-56 w-auto rounded-lg shadow-lg" />
          ) : null}
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
              {melding ?? (igjen === 1 ? "Siste forsøk" : `${igjen} forsøk igjen`)}
            </p>
            {kanHint ? (
              <button type="button" onClick={() => void nesteHint()} disabled={opptatt} className={sekundarKnapp}>
                Hint (−1 forsøk)
              </button>
            ) : (
              <button type="button" onClick={giOpp} className={sekundarKnapp}>
                Gi opp
              </button>
            )}
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

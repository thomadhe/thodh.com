"use client"

import { useEffect, useRef, useState, useSyncExternalStore } from "react"
import type { StavebienWord } from "../data/types"
import { formaterDato } from "../lib/dag"
import { useDagligTilstand, useResultater, type Resultat } from "../lib/lagring"
import { erRiktigStavet, LIV } from "../lib/stavebien-regler"
import { DelKnapp, Knapp, Kort } from "./spill-ramme"

type Tilstand = { svar: string[]; resultat: Resultat }
const tom = (): Tilstand => ({ svar: [], resultat: { status: "pagar" } })

function abonnerStemmer(varsle: () => void) {
  if (!("speechSynthesis" in window)) return () => {}
  speechSynthesis.addEventListener("voiceschanged", varsle)
  return () => speechSynthesis.removeEventListener("voiceschanged", varsle)
}

function finnNorskStemme() {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return undefined
  const stemmer = speechSynthesis.getVoices()
  return (
    stemmer.find((v) => /^(nb|no)(-|_|$)/i.test(v.lang)) ?? stemmer.find((v) => /^nn(-|_|$)/i.test(v.lang))
  )
}

/** "ja" / "nei" / "laster" — whether a Norwegian voice is installed. */
function useNorskStemme() {
  return useSyncExternalStore(
    abonnerStemmer,
    () => {
      if (!("speechSynthesis" in window)) return "nei"
      if (speechSynthesis.getVoices().length === 0) return "laster"
      return finnNorskStemme() ? "ja" : "nei"
    },
    () => "laster",
  )
}

function si(tekst: string, sakte = false) {
  const stemme = finnNorskStemme()
  if (!stemme) return
  speechSynthesis.cancel()
  const u = new SpeechSynthesisUtterance(tekst)
  u.voice = stemme
  u.lang = stemme.lang
  u.rate = sakte ? 0.55 : 0.85
  speechSynthesis.speak(u)
}

function Hjerter({ igjen }: { igjen: number }) {
  return (
    <span className="flex gap-1" aria-label={`${igjen} liv igjen`}>
      {Array.from({ length: LIV }, (_, i) => (
        <span key={i} className={`text-base transition ${i < igjen ? "" : "opacity-20 grayscale"}`} aria-hidden="true">
          ❤️
        </span>
      ))}
    </span>
  )
}

function Sammenlign({ svar, fasit }: { svar: string; fasit: string }) {
  // Letter-by-letter marks are enough feedback for single words.
  return (
    <span className="font-mono tracking-wider">
      {[...fasit].map((t, i) => (
        <span key={i} className={svar[i]?.toLowerCase() === t ? "text-emerald-700" : "rounded bg-rose-100 text-rose-700"}>
          {t}
        </span>
      ))}
    </span>
  )
}

export function Stavebien({ dato, ord }: { dato: string; ord: StavebienWord[] }) {
  const { verdi, lastet, oppdater } = useDagligTilstand<Tilstand>("stavebien", dato, tom)
  const stemme = useNorskStemme()
  const [tekst, setTekst] = useState("")
  const [vist, setVist] = useState<Set<"definisjon" | "setning" | "opprinnelse">>(new Set())
  const [tilbakemelding, setTilbakemelding] = useState<number | null>(null)
  const felt = useRef<HTMLInputElement>(null)

  const feil = verdi.svar.filter((s, i) => !erRiktigStavet(s, ord[i])).length
  const igjen = LIV - feil
  const indeks = verdi.svar.length
  const ferdig = (indeks >= ord.length || igjen <= 0) && tilbakemelding === null
  const visIndeks = tilbakemelding ?? indeks
  const naa = ord[Math.min(visIndeks, ord.length - 1)]

  useEffect(() => {
    if (tilbakemelding === null) felt.current?.focus()
  }, [tilbakemelding, indeks])

  const utenStemme = stemme === "nei"
  const synlig = (n: "definisjon" | "setning" | "opprinnelse") => vist.has(n) || (utenStemme && n !== "opprinnelse")

  const send = (e: React.FormEvent) => {
    e.preventDefault()
    const svar = tekst.trim()
    if (!svar || tilbakemelding !== null || ferdig) return
    const n = indeks
    oppdater((t) => {
      if (t.svar.length !== n) return t
      const alle = [...t.svar, svar]
      const riktige = alle.filter((s, i) => erRiktigStavet(s, ord[i])).length
      const feil = alle.length - riktige
      const slutt = alle.length >= ord.length || feil >= LIV
      return {
        svar: alle,
        resultat: slutt
          ? { status: riktige === ord.length ? "vunnet" : "ferdig", etikett: `${riktige}/${ord.length}`, poeng: riktige }
          : { status: "pagar", etikett: `${alle.length}/${ord.length} ord` },
      }
    })
    setTilbakemelding(n)
    setTekst("")
  }

  const neste = () => {
    setTilbakemelding(null)
    setVist(new Set())
  }

  if (!lastet) return <div className="h-96 animate-pulse rounded-3xl bg-white/60" />
  if (ferdig) return <Resultat dato={dato} ord={ord} svar={verdi.svar} />

  const svart = tilbakemelding !== null ? verdi.svar[tilbakemelding] : undefined
  const riktig = svart !== undefined && erRiktigStavet(svart, naa)

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex gap-1" aria-label={`Ord ${visIndeks + 1} av ${ord.length}`}>
          {ord.map((o, i) => {
            const s = verdi.svar[i]
            const farge =
              s === undefined
                ? i === visIndeks
                  ? "bg-neutral-900"
                  : "bg-black/10"
                : erRiktigStavet(s, o)
                  ? "bg-emerald-500"
                  : "bg-rose-500"
            return <span key={i} className={`h-1.5 w-5 rounded-full ${farge}`} />
          })}
        </div>
        <Hjerter igjen={igjen} />
      </div>

      <Kort className="px-5 py-7 text-center sm:px-8">
        <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-neutral-400">
          Ord {visIndeks + 1} av {ord.length} · Nivå {naa.level}
        </p>

        {utenStemme ? (
          <p className="mx-auto mt-4 max-w-sm rounded-2xl bg-amber-50 px-4 py-3 text-xs leading-5 text-amber-900">
            Fant ingen norsk stemme i nettleseren, så du får definisjon og eksempel i stedet. På Windows kan du legge til
            «Norsk bokmål» under Innstillinger → Tid og språk → Tale.
          </p>
        ) : (
          <div className="mt-5 flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => si(naa.word)}
              disabled={stemme !== "ja"}
              className="flex h-20 w-20 items-center justify-center rounded-full bg-yellow-300 text-3xl shadow-sm transition hover:scale-105 hover:bg-yellow-400 active:scale-95 disabled:opacity-50"
              aria-label="Hør ordet"
            >
              🔊
            </button>
            <button
              type="button"
              onClick={() => si(naa.word, true)}
              disabled={stemme !== "ja"}
              className="flex h-11 w-11 items-center justify-center rounded-full border border-black/10 bg-white text-base transition hover:bg-neutral-50 disabled:opacity-50"
              aria-label="Hør ordet sakte"
              title="Sakte"
            >
              🐢
            </button>
          </div>
        )}

        <p className="mt-4 font-mono text-[11px] text-neutral-400">{naa.word.length} bokstaver</p>

        <div className="mt-5 flex flex-wrap justify-center gap-1.5">
          {(
            [
              ["definisjon", "Definisjon"],
              ["setning", "Eksempel"],
              ["opprinnelse", "Opprinnelse"],
            ] as const
          ).map(([n, etikett]) => (
            <button
              key={n}
              type="button"
              onClick={() => setVist((s) => new Set(s).add(n))}
              className={`rounded-full px-3 py-1.5 font-mono text-[10px] uppercase tracking-widest transition ${
                synlig(n) ? "bg-neutral-900 text-white" : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
              }`}
            >
              {etikett}
            </button>
          ))}
        </div>
        <div className="mt-4 space-y-2 text-left text-sm leading-6 text-neutral-700">
          {synlig("definisjon") ? <p>{naa.definition}</p> : null}
          {synlig("setning") ? (
            <p className="italic text-neutral-500">
              {naa.sentence.split("___").map((del, i, deler) => (
                <span key={i}>
                  {del}
                  {i < deler.length - 1 ? (
                    svart !== undefined ? (
                      <strong className="not-italic text-neutral-900">{naa.word}</strong>
                    ) : (
                      <span className="inline-block w-14 border-b border-neutral-400 align-baseline" />
                    )
                  ) : null}
                </span>
              ))}
            </p>
          ) : null}
          {synlig("opprinnelse") ? <p className="font-mono text-xs text-neutral-500">{naa.origin}</p> : null}
        </div>
      </Kort>

      {svart !== undefined ? (
        <Kort className={`px-5 py-5 text-center ${riktig ? "border-emerald-200 bg-emerald-50" : "border-rose-200 bg-rose-50"}`}>
          <p className={`text-lg font-semibold ${riktig ? "text-emerald-800" : "text-rose-700"}`}>
            {riktig ? "Riktig! 🐝" : "Ikke helt"}
          </p>
          {!riktig ? (
            <div className="mt-2 space-y-1 text-sm text-neutral-600">
              <p>
                Du skrev: <span className="font-mono line-through decoration-rose-400">{svart}</span>
              </p>
              <p>
                Riktig: <Sammenlign svar={svart} fasit={naa.word} />
              </p>
            </div>
          ) : null}
          <Knapp className="mt-4 min-w-36" onClick={neste} autoFocus>
            {indeks >= ord.length || igjen <= 0 ? "Se resultat" : "Neste ord"}
          </Knapp>
        </Kort>
      ) : (
        <form onSubmit={send} className="flex gap-2">
          <input
            ref={felt}
            value={tekst}
            onChange={(e) => setTekst(e.target.value)}
            placeholder="Stav ordet"
            autoCapitalize="none"
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            enterKeyHint="done"
            aria-label="Stav ordet"
            className="h-12 min-w-0 flex-1 rounded-2xl border border-black/10 bg-white px-4 text-base tracking-wide text-neutral-950 shadow-sm outline-none transition placeholder:text-neutral-400 focus:border-neutral-900"
          />
          <Knapp type="submit" disabled={!tekst.trim()} className="h-12 rounded-2xl">
            Stav
          </Knapp>
        </form>
      )}
    </div>
  )
}

function Resultat({ dato, ord, svar }: { dato: string; ord: StavebienWord[]; svar: string[] }) {
  const alle = useResultater("stavebien")
  const riktige = svar.filter((s, i) => erRiktigStavet(s, ord[i])).length
  const ferdige = Object.values(alle).filter((r) => r.status !== "pagar" && typeof r.poeng === "number")
  const snitt = ferdige.length ? ferdige.reduce((s, r) => s + (r.poeng ?? 0), 0) / ferdige.length : riktige
  const delTekst = [
    `Stavebien · ${formaterDato(dato, "kort")}`,
    `${riktige}/${ord.length}`,
    ord.map((o, i) => (svar[i] === undefined ? "⬜" : erRiktigStavet(svar[i], o) ? "🟨" : "🟥")).join(""),
    "thodh.com/spill",
  ].join("\n")

  return (
    <div className="flex flex-col gap-4">
      <Kort className="px-6 py-8 text-center">
        <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-neutral-400">Dagens resultat</p>
        <p className="mt-3 text-6xl font-semibold tabular-nums tracking-tight text-neutral-950">
          {riktige}
          <span className="text-2xl text-neutral-400">/{ord.length}</span>
        </p>
        <p className="mt-2 text-sm text-neutral-500">
          {riktige === ord.length ? "Feilfritt! Du er dagens bie. 🐝" : riktige >= 7 ? "Sterkt stavet." : "Ordene ble vanskelige."}
        </p>
        <div className="mt-6 grid grid-cols-2 gap-3 text-left">
          <div className="rounded-2xl bg-neutral-50 p-3">
            <p className="font-mono text-[10px] uppercase tracking-wider text-neutral-400">Ditt snitt</p>
            <p className="mt-1 text-lg font-semibold tabular-nums">{snitt.toLocaleString("nb-NO", { maximumFractionDigits: 1 })}</p>
          </div>
          <div className="rounded-2xl bg-neutral-50 p-3">
            <p className="font-mono text-[10px] uppercase tracking-wider text-neutral-400">Spilt</p>
            <p className="mt-1 text-lg font-semibold tabular-nums">{ferdige.length || 1} {(ferdige.length || 1) === 1 ? "dag" : "dager"}</p>
          </div>
        </div>
      </Kort>

      <Kort className="divide-y divide-black/5">
        {ord.map((o, i) => {
          const s = svar[i]
          const ok = s !== undefined && erRiktigStavet(s, o)
          return (
            <div key={o.word} className="flex items-center gap-3 px-5 py-3">
              <span
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] text-white ${
                  s === undefined ? "bg-neutral-300" : ok ? "bg-emerald-500" : "bg-rose-500"
                }`}
              >
                {s === undefined ? "–" : ok ? "✓" : "✕"}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-neutral-900">{o.word}</p>
                <p className="truncate text-xs text-neutral-500">{o.definition}</p>
              </div>
              {s !== undefined && !ok ? <span className="font-mono text-xs text-rose-600 line-through">{s}</span> : null}
              <span className="font-mono text-[10px] text-neutral-400">N{o.level}</span>
            </div>
          )
        })}
      </Kort>

      <div className="flex justify-center">
        <DelKnapp tekst={delTekst} />
      </div>
    </div>
  )
}

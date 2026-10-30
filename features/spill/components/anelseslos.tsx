"use client"

import { useEffect, useRef, useState } from "react"
import { formaterDato } from "../lib/dag"
import { fargetone, naerhetsfarge, type Fargeanker } from "../lib/farger"
import { useDagligTilstand, type Resultat } from "../lib/lagring"
import { lyder } from "../lib/lyd"
import { DelKnapp, Knapp, Kort } from "./spill-ramme"

type Gjetning = { ord: string; avstand: number; hint?: boolean }
// v3: new similarity model. Older saves hold ranks from the old model and start fresh.
type Tilstand = {
  v: 3
  gjetninger: Gjetning[]
  fasit?: { ord: string; naermeste: string[] }
  resultat: Resultat
}

const tom = (): Tilstand => ({ v: 3, gjetninger: [], resultat: { status: "pagar" } })

// Lessgames-style rows: coloured bar, light text on top. The colour blends from green (top 50) through
// yellow (~300) and orange (~1500) to red, on a log scale of the rank.
const ANKER: Fargeanker = [
  [0, 145],
  [Math.log10(50), 128],
  [Math.log10(300), 56],
  [Math.log10(1500), 30],
  [Math.log10(5000), 6],
]
const farge = (avstand: number) => naerhetsfarge(fargetone(ANKER, Math.log10(avstand)))

/** Bar length: close words fill almost the whole row (#6 ≈ 95 %), the long tail shrinks fast. */
function andelFor(avstand: number, antall: number) {
  return Math.max(0.04, 1 - (Math.log(avstand) / Math.log(antall)) ** 1.8)
}

function Rad({ g, antall, fremhevet }: { g: Gjetning; antall: number; fremhevet?: boolean }) {
  const andel = andelFor(g.avstand, antall)
  const bar = farge(g.avstand)
  return (
    <li
      className={`relative flex h-11 items-center overflow-hidden rounded-xl bg-neutral-100 px-3.5 transition ${
        fremhevet ? "ring-2 ring-neutral-900" : ""
      }`}
    >
      <span className="absolute inset-y-0 left-0 transition-[width] duration-500" style={{ width: `${andel * 100}%`, background: bar }} />
      <span className="relative flex-1 truncate text-[15px] font-medium text-neutral-950 [text-shadow:0_1px_1px_rgb(0_0_0/0.35)]">
        {g.ord}
        {g.hint ? <span className="ml-2 font-mono text-[10px] uppercase tracking-wider opacity-70">hint</span> : null}
      </span>
      <span className="relative font-mono text-sm tabular-nums text-neutral-950 [text-shadow:0_1px_1px_rgb(0_0_0/0.35)]">
        {g.avstand === 1 ? "🏆" : g.avstand.toLocaleString("nb-NO")}
      </span>
    </li>
  )
}

async function spor<T>(body: unknown): Promise<T> {
  const svar = await fetch("/spill/api/anelseslos", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
  const data = await svar.json().catch(() => ({ melding: "Noe gikk galt. Prøv igjen." }))
  if (!svar.ok) throw new Error(data.melding ?? "Noe gikk galt.")
  return data as T
}

export function Anelseslos({ dato, antall }: { dato: string; antall: number }) {
  const { verdi, lastet, oppdater } = useDagligTilstand<Tilstand>("anelseslos", dato, tom)
  const [tekst, setTekst] = useState("")
  const [melding, setMelding] = useState<string | null>(null)
  const [siste, setSiste] = useState<string | null>(null)
  const [opptatt, setOpptatt] = useState(false)
  const [bekreftGiOpp, setBekreftGiOpp] = useState(false)
  const felt = useRef<HTMLInputElement>(null)

  const ferdig = verdi.resultat.status !== "pagar"
  const sortert = [...verdi.gjetninger].sort((a, b) => a.avstand - b.avstand)
  const beste = sortert[0]?.avstand ?? null
  const antallGjett = verdi.gjetninger.filter((g) => !g.hint).length
  const antallHint = verdi.gjetninger.length - antallGjett
  const sisteGjetning = verdi.gjetninger.find((g) => g.ord === siste)

  // The answer is fetched after the result is saved, and again after a reload if that request was lost.
  const trengerFasit = lastet && ferdig && !verdi.fasit
  useEffect(() => {
    if (!trengerFasit) return
    let aktiv = true
    spor<{ ord: string; naermeste: string[] }>({ type: "fasit", dato })
      .then((f) => {
        if (aktiv) oppdater((t) => ({ ...t, fasit: f }))
      })
      .catch(() => undefined)
    return () => {
      aktiv = false
    }
  }, [trengerFasit, dato, oppdater])

  const leggTil = (g: Gjetning) => {
    if (g.avstand === 1) lyder.seier()
    else lyder.naer(andelFor(g.avstand, antall))
    // A winning guess and the win itself are stored in the same update.
    oppdater((t) => {
      if (t.gjetninger.some((x) => x.ord === g.ord)) return t
      const gjetninger = [...t.gjetninger, g]
      if (g.avstand !== 1) return { ...t, gjetninger }
      const n = gjetninger.filter((x) => !x.hint).length
      return { ...t, gjetninger, resultat: { status: "vunnet", etikett: `${n} gjetninger`, poeng: n } }
    })
    setSiste(g.ord)
  }

  const send = async (e: React.FormEvent) => {
    e.preventDefault()
    const ord = tekst.trim().toLowerCase()
    if (!ord || opptatt || ferdig) return
    setMelding(null)
    if (verdi.gjetninger.some((g) => g.ord === ord)) {
      setSiste(ord)
      setMelding(`Du har allerede prøvd «${ord}».`)
      setTekst("")
      return
    }
    setOpptatt(true)
    try {
      const svar = await spor<{ ok: true; ord: string; avstand: number } | { ok: false; melding: string }>({
        type: "gjett",
        dato,
        ord,
      })
      if (!svar.ok) {
        setMelding(svar.melding)
        return
      }
      setTekst("")
      if (svar.ord !== ord) setMelding(`Tolket som «${svar.ord}».`)
      if (verdi.gjetninger.some((g) => g.ord === svar.ord)) {
        setSiste(svar.ord)
        setMelding(`Du har allerede prøvd «${svar.ord}».`)
        return
      }
      leggTil({ ord: svar.ord, avstand: svar.avstand })
    } catch (err) {
      setMelding((err as Error).message)
    } finally {
      setOpptatt(false)
      felt.current?.focus()
    }
  }

  const hentHint = async () => {
    if (opptatt || ferdig) return
    setOpptatt(true)
    setMelding(null)
    try {
      const h = await spor<{ ord: string; avstand: number }>({
        type: "hint",
        dato,
        beste,
        gjettet: verdi.gjetninger.map((g) => g.ord),
      })
      leggTil({ ...h, hint: true })
    } catch (err) {
      setMelding((err as Error).message)
    } finally {
      setOpptatt(false)
    }
  }

  const giOpp = () => {
    setBekreftGiOpp(false)
    oppdater((t) => (t.resultat.status === "pagar" ? { ...t, resultat: { status: "tapt", etikett: "Ga opp" } } : t))
  }

  if (!lastet) return <div className="h-96 animate-pulse rounded-3xl bg-white/5" />

  const delTekst = [
    `Anelsesløs · ${formaterDato(dato, "kort")}`,
    verdi.resultat.status === "vunnet"
      ? `Funnet på ${antallGjett} gjetninger${antallHint ? ` og ${antallHint} hint` : ""}`
      : `Ga opp etter ${antallGjett} gjetninger`,
    [...verdi.gjetninger]
      .filter((g) => !g.hint)
      .map((g) => (g.avstand === 1 ? "🟩" : g.avstand <= 50 ? "🟢" : g.avstand <= 300 ? "🟡" : g.avstand <= 1500 ? "🟠" : "🔴"))
      .slice(-30)
      .join(""),
    "thodh.com/spill",
  ].join("\n")

  return (
    <div className="flex flex-col gap-4">
      {ferdig ? (
        <Kort className="px-6 py-7 text-center">
          <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-neutral-400">
            {verdi.resultat.status === "vunnet" ? "Du fant det!" : "Dagens ord var"}
          </p>
          <p className="mt-2 text-4xl font-semibold tracking-tight text-neutral-950">{verdi.fasit?.ord ?? "…"}</p>
          <p className="mt-2 text-sm text-neutral-500">
            {antallGjett} gjetninger{antallHint ? ` · ${antallHint} hint` : ""}
          </p>
          {verdi.fasit?.naermeste.length ? (
            <p className="mx-auto mt-4 max-w-sm text-xs leading-5 text-neutral-500">
              Nærmeste ord: {verdi.fasit.naermeste.join(", ")}
            </p>
          ) : null}
          <div className="mt-5 flex justify-center">
            <DelKnapp tekst={delTekst} />
          </div>
        </Kort>
      ) : (
        <form onSubmit={send} className="flex gap-2">
          <input
            ref={felt}
            value={tekst}
            onChange={(e) => setTekst(e.target.value)}
            placeholder="Skriv et engelsk ord"
            autoFocus
            autoCapitalize="none"
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            enterKeyHint="send"
            aria-label="Gjett et engelsk ord"
            className="h-12 min-w-0 flex-1 rounded-2xl border border-black/10 bg-[var(--spill-flate)] px-4 text-base text-neutral-950 shadow-sm outline-none transition placeholder:text-neutral-400 focus:border-neutral-900"
          />
          <Knapp type="submit" disabled={opptatt || !tekst.trim()} className="h-12 rounded-2xl">
            Gjett
          </Knapp>
        </form>
      )}

      <div className="flex min-h-5 items-center justify-between gap-3 px-1">
        <p className="font-mono text-[11px] text-neutral-500" role="status">
          {melding ?? (verdi.gjetninger.length ? `Gjetninger: ${antallGjett}${antallHint ? ` · Hint: ${antallHint}` : ""}` : "")}
        </p>
        {!ferdig ? (
          <div className="flex shrink-0 gap-1">
            <button
              type="button"
              onClick={hentHint}
              disabled={opptatt}
              className="rounded-full px-3 py-1 font-mono text-[11px] uppercase tracking-widest text-neutral-500 transition hover:bg-black/5 hover:text-neutral-900 disabled:opacity-40"
            >
              Hint
            </button>
            {bekreftGiOpp ? (
              <button
                type="button"
                onClick={giOpp}
                className="rounded-full bg-rose-600 px-3 py-1 font-mono text-[11px] uppercase tracking-widest text-white"
              >
                Sikker?
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setBekreftGiOpp(true)}
                disabled={opptatt || verdi.gjetninger.length === 0}
                className="rounded-full px-3 py-1 font-mono text-[11px] uppercase tracking-widest text-neutral-500 transition hover:bg-black/5 hover:text-neutral-900 disabled:opacity-40"
              >
                Gi opp
              </button>
            )}
          </div>
        ) : null}
      </div>

      {sisteGjetning && !ferdig ? (
        <ul>
          <Rad g={sisteGjetning} antall={antall} fremhevet />
        </ul>
      ) : null}

      {sortert.length ? (
        <ul className="flex flex-col gap-1.5">
          {sortert.map((g) => (
            <Rad key={g.ord} g={g} antall={antall} />
          ))}
        </ul>
      ) : (
        <Kort className="px-6 py-8 text-center">
          <p className="text-sm text-neutral-600">Jo nærmere i betydning, jo lavere tall.</p>
          <div className="mx-auto mt-5 flex max-w-xs flex-col gap-1.5 text-left">
            <Rad g={{ ord: "apple", avstand: 1 }} antall={antall} />
            <Rad g={{ ord: "fruit", avstand: 4 }} antall={antall} />
            <Rad g={{ ord: "food", avstand: 120 }} antall={antall} />
            <Rad g={{ ord: "car", avstand: 6400 }} antall={antall} />
          </div>
          <p className="mt-3 font-mono text-[10px] text-neutral-400">Hvis ordet var «apple»</p>
        </Kort>
      )}
    </div>
  )
}

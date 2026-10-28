"use client"

import { useEffect, useRef, useState } from "react"
import { formaterDato } from "../lib/dag"
import { formaterVerdi } from "../lib/format"
import { useDagligTilstand, useResultater, type Resultat } from "../lib/lagring"
import type { MelItem, MelKategori, MelRunde } from "../lib/mer-eller-mindre"
import { DelKnapp, Knapp, Kort } from "./spill-ramme"

// v2: fixed daily slots. Older saves belong to other rounds, fail the shape check and start fresh.
type Tilstand = { v: 2; svar: (0 | 1)[]; resultat: Resultat }

const tom = (): Tilstand => ({ v: 2, svar: [], resultat: { status: "pagar" } })
const VIS_SVAR_MS = 1500

function Teller({ verdi, format }: { verdi: number; format: MelKategori["format"] }) {
  const [vist, setVist] = useState(format === "year" ? verdi : 0)
  useEffect(() => {
    if (format === "year") return
    let ramme = 0
    const start = performance.now()
    const steg = (t: number) => {
      const p = Math.min(1, (t - start) / 650)
      setVist(verdi * (1 - Math.pow(1 - p, 3)))
      if (p < 1) ramme = requestAnimationFrame(steg)
    }
    ramme = requestAnimationFrame(steg)
    return () => cancelAnimationFrame(ramme)
  }, [verdi, format])
  return <>{formaterVerdi(format === "decimal" ? Math.round(vist * 10) / 10 : vist, format)}</>
}

function Bilde({ item, format }: { item: MelItem; format: MelKategori["bildeformat"] }) {
  const [feilet, setFeilet] = useState(false)
  const storrelse = format === "portrett" ? "aspect-[2/3] w-full max-w-36" : "aspect-square w-full max-w-40"
  if (!item.bilde || feilet) {
    return (
      <span
        className={`flex items-center justify-center rounded-2xl bg-neutral-50 text-5xl leading-none transition group-hover:scale-[1.02] ${storrelse}`}
        aria-hidden="true"
      >
        {item.emoji}
      </span>
    )
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element -- remote pictures from several hosts, sized by CSS
    <img
      src={item.bilde}
      alt=""
      loading="eager"
      referrerPolicy="no-referrer"
      onError={() => setFeilet(true)}
      className={`rounded-2xl bg-neutral-100 object-cover shadow-sm transition group-hover:scale-[1.02] ${storrelse}`}
    />
  )
}

function ValgKort({
  item,
  kategori,
  onVelg,
  avslort,
  vinner,
  valgt,
  tast,
}: {
  item: MelRunde["a"]
  kategori: MelKategori
  onVelg: () => void
  avslort: boolean
  vinner: boolean
  valgt: boolean
  tast: string
}) {
  const ramme = !avslort
    ? "border-black/5 hover:-translate-y-0.5 hover:border-black/15 hover:shadow-md"
    : vinner
      ? "border-emerald-500 bg-emerald-50"
      : valgt
        ? "border-rose-400 bg-rose-50"
        : "border-black/5 opacity-70"
  return (
    <button
      type="button"
      onClick={onVelg}
      disabled={avslort}
      className={`group relative flex min-h-56 flex-col items-center justify-start rounded-3xl border-2 bg-[var(--spill-flate)] px-3 pt-5 pb-4 text-center transition duration-200 disabled:cursor-default ${ramme}`}
    >
      <span className="absolute top-3 left-3 hidden h-5 w-5 items-center justify-center rounded-md border border-black/10 font-mono text-[10px] text-neutral-400 sm:flex">
        {tast}
      </span>
      {avslort && valgt ? (
        <span
          className={`absolute top-3 right-3 flex h-6 w-6 items-center justify-center rounded-full text-xs text-white ${
            vinner ? "bg-emerald-500" : "bg-rose-500"
          }`}
        >
          {vinner ? "✓" : "✕"}
        </span>
      ) : null}
      <Bilde key={item.name} item={item} format={kategori.bildeformat} />
      <span className="mt-4 text-[15px] font-semibold leading-tight tracking-tight text-neutral-950">{item.name}</span>
      {item.detail ? <span className="mt-1 font-mono text-[10px] text-neutral-400">{item.detail}</span> : null}
      <span
        className={`mt-4 min-h-12 text-lg font-semibold tabular-nums tracking-tight transition ${
          avslort ? (vinner ? "text-emerald-700" : "text-neutral-700") : "text-transparent"
        }`}
      >
        {avslort ? (
          <>
            <Teller verdi={item.value} format={kategori.format} />
            {kategori.unit ? <span className="block text-[11px] font-normal text-neutral-500">{kategori.unit}</span> : null}
          </>
        ) : (
          "?"
        )}
      </span>
    </button>
  )
}

function Fremdrift({ kategorier, svar }: { kategorier: MelKategori[]; svar: (0 | 1)[] }) {
  let i = 0
  return (
    <div className="flex gap-1.5" aria-label={`${svar.length} av ${kategorier.length * 5} runder`}>
      {kategorier.map((k) => (
        <div key={k.id} className="flex flex-1 gap-0.5">
          {k.runder.map((r) => {
            const n = i++
            const s = svar[n]
            const farge = s === undefined ? "bg-black/10" : s === r.fasit ? "bg-emerald-500" : "bg-rose-500"
            return <span key={n} className={`h-1.5 flex-1 rounded-full transition-colors ${farge}`} />
          })}
        </div>
      ))}
    </div>
  )
}

export function MerEllerMindre({ dato, kategorier }: { dato: string; kategorier: MelKategori[] }) {
  const { verdi, lastet, oppdater } = useDagligTilstand<Tilstand>("mer-eller-mindre", dato, tom)
  const runder = kategorier.flatMap((k, ki) => k.runder.map((r, nr) => ({ ...r, kategori: k, ki, nr })))
  const totalt = runder.length
  const [visning, setVisning] = useState<number | null>(null)
  const [klareKategorier, setKlare] = useState<Set<number>>(new Set())
  const tidsur = useRef<ReturnType<typeof setTimeout> | null>(null)

  const neste = verdi.svar.length
  const aktiv = visning ?? neste
  const ferdig = neste >= totalt && visning === null
  const runde = runder[Math.min(aktiv, totalt - 1)]
  const visOverskrift = !ferdig && visning === null && runde.nr === 0 && !klareKategorier.has(runde.ki)

  useEffect(() => () => {
    if (tidsur.current) clearTimeout(tidsur.current)
  }, [])

  const velg = (valg: 0 | 1) => {
    if (visning !== null || ferdig || visOverskrift) return
    const n = neste
    oppdater((t) => {
      if (t.svar.length !== n) return t
      const svar = [...t.svar, valg]
      if (svar.length < totalt) return { v: 2, svar, resultat: { status: "pagar", etikett: `${svar.length}/${totalt} runder` } }
      const poeng = svar.filter((s, i) => s === runder[i].fasit).length
      return { v: 2, svar, resultat: { status: "ferdig", etikett: `${poeng}/${totalt}`, poeng } }
    })
    setVisning(n)
    tidsur.current = setTimeout(() => setVisning(null), VIS_SVAR_MS)
  }

  const gaVidere = () => {
    if (tidsur.current) clearTimeout(tidsur.current)
    setVisning(null)
  }

  // Keyboard: 1/← picks left, 2/→ picks right, Enter/space continues.
  const tastRef = useRef({ velg, gaVidere, visOverskrift, visning, ki: runde?.ki })
  useEffect(() => {
    tastRef.current = { velg, gaVidere, visOverskrift, visning, ki: runde?.ki }
  })
  useEffect(() => {
    const ved = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLElement && e.target.closest("input, textarea, [contenteditable]")) return
      const t = tastRef.current
      if (t.visOverskrift && (e.key === "Enter" || e.key === " ")) {
        e.preventDefault()
        setKlare((s) => new Set(s).add(t.ki))
      } else if (t.visning !== null && (e.key === "Enter" || e.key === " ")) {
        e.preventDefault()
        t.gaVidere()
      } else if (e.key === "1" || e.key === "ArrowLeft") t.velg(0)
      else if (e.key === "2" || e.key === "ArrowRight") t.velg(1)
    }
    window.addEventListener("keydown", ved)
    return () => window.removeEventListener("keydown", ved)
  }, [])

  if (!lastet) return <div className="h-96 animate-pulse rounded-3xl bg-white/5" />

  if (ferdig) return <Resultater dato={dato} kategorier={kategorier} svar={verdi.svar} />

  const svart = visning !== null ? verdi.svar[visning] : undefined

  return (
    <div className="flex flex-1 flex-col gap-5">
      <Fremdrift kategorier={kategorier} svar={verdi.svar} />

      {visOverskrift ? (
        <Kort className="flex flex-1 flex-col items-center justify-center px-6 py-14 text-center">
          <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-neutral-400">
            Kategori {runde.ki + 1} av {kategorier.length}
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-neutral-950">{runde.kategori.title}</h2>
          <p className="mt-2 max-w-xs text-sm leading-6 text-neutral-500">{runde.kategori.question}</p>
          <Knapp className="mt-8 min-w-40" onClick={() => setKlare((s) => new Set(s).add(runde.ki))} autoFocus>
            {neste === 0 ? "Start" : "Fortsett"}
          </Knapp>
          <p className="mt-6 font-mono text-[10px] text-neutral-400">Kilde: {runde.kategori.source}</p>
        </Kort>
      ) : (
        <>
          <div className="text-center">
            <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-neutral-400">
              {runde.kategori.title} · {runde.nr + 1}/{runde.kategori.runder.length}
            </p>
            <h2 className="mt-2 text-lg font-semibold tracking-tight text-neutral-950">{runde.kategori.question}</h2>
          </div>

          <div className="relative grid grid-cols-2 gap-3">
            <ValgKort
              item={runde.a}
              kategori={runde.kategori}
              onVelg={() => velg(0)}
              avslort={svart !== undefined}
              vinner={runde.fasit === 0}
              valgt={svart === 0}
              tast="1"
            />
            <ValgKort
              item={runde.b}
              kategori={runde.kategori}
              onVelg={() => velg(1)}
              avslort={svart !== undefined}
              vinner={runde.fasit === 1}
              valgt={svart === 1}
              tast="2"
            />
            <span className="pointer-events-none absolute top-1/2 left-1/2 flex h-9 w-9 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-black/5 bg-[var(--spill-flate)] font-mono text-[10px] uppercase text-neutral-500 shadow-sm">
              eller
            </span>
          </div>

          <Forhandslast runde={runder[aktiv + 1]} />

          <div className="flex h-11 items-center justify-center">
            {svart !== undefined ? (
              <button
                type="button"
                onClick={gaVidere}
                className={`font-mono text-[11px] uppercase tracking-widest transition ${
                  svart === runde.fasit ? "text-emerald-700" : "text-rose-600"
                }`}
              >
                {svart === runde.fasit ? "Riktig!" : "Feil"} · Neste →
              </button>
            ) : (
              <p className="font-mono text-[11px] text-neutral-400">
                Poeng: {verdi.svar.filter((s, i) => s === runder[i].fasit).length}
              </p>
            )}
          </div>
          <Kreditering runde={runde} />
        </>
      )}
    </div>
  )
}

/** Warms the browser cache so the next pair appears without a flash. */
function Forhandslast({ runde }: { runde?: MelRunde }) {
  useEffect(() => {
    for (const item of runde ? [runde.a, runde.b] : []) if (item.bilde) new Image().src = item.bilde
  }, [runde])
  return null
}

const kildenavn = (url: string) => {
  const vert = new URL(url).hostname
  if (vert.includes("deezer")) return "Deezer"
  if (vert.includes("tvmaze")) return "TVmaze"
  if (vert.includes("commons")) return "Wikimedia Commons"
  return "Wikipedia"
}

/** Every picture links to its source page, where author and licence are listed. */
function Kreditering({ runde }: { runde: MelRunde }) {
  const kilder = [runde.a, runde.b].filter((x) => x.bilde && x.kilde)
  if (!kilder.length) return null
  return (
    <p className="text-center font-mono text-[9px] text-neutral-400">
      Bilder:{" "}
      {kilder.map((x, i) => (
        <span key={x.name}>
          {i > 0 ? " · " : null}
          <a href={x.kilde} target="_blank" rel="noreferrer" className="underline decoration-neutral-300 hover:text-neutral-600">
            {x.name}
          </a>{" "}
          ({kildenavn(x.kilde!)})
        </span>
      ))}
    </p>
  )
}

function Resultater({ dato, kategorier, svar }: { dato: string; kategorier: MelKategori[]; svar: (0 | 1)[] }) {
  const alle = useResultater("mer-eller-mindre")
  let i = 0
  const rader = kategorier.map((k) => {
    const merker = k.runder.map((r) => svar[i++] === r.fasit)
    return { k, merker, riktige: merker.filter(Boolean).length }
  })
  const poeng = rader.reduce((s, r) => s + r.riktige, 0)
  const totalt = rader.reduce((s, r) => s + r.merker.length, 0)
  const ferdige = Object.values(alle).filter((r) => r.status === "ferdig" && typeof r.poeng === "number")
  const snitt = ferdige.length ? ferdige.reduce((s, r) => s + (r.poeng ?? 0), 0) / ferdige.length : poeng
  const omtale =
    poeng >= 23 ? "Helt rått." : poeng >= 19 ? "Sterkt!" : poeng >= 15 ? "Godt jobba." : poeng >= 11 ? "Ikke verst." : "Det var en tøff dag."

  const delTekst = [
    `Mer eller mindre · ${formaterDato(dato, "kort")}`,
    `${poeng}/${totalt}`,
    ...rader.map((r) => `${r.merker.map((m) => (m ? "🟩" : "🟥")).join("")} ${r.k.title}`),
    "thodh.com/spill",
  ].join("\n")

  return (
    <div className="flex flex-col gap-4">
      <Kort className="px-6 py-8 text-center">
        <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-neutral-400">Dagens resultat</p>
        <p className="mt-3 text-6xl font-semibold tabular-nums tracking-tight text-neutral-950">
          {poeng}
          <span className="text-2xl text-neutral-400">/{totalt}</span>
        </p>
        <p className="mt-2 text-sm text-neutral-500">{omtale}</p>
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
        {rader.map(({ k, merker, riktige }) => (
          <div key={k.id} className="flex items-center gap-3 px-5 py-3.5">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-neutral-900">{k.title}</p>
              <p className="truncate font-mono text-[10px] text-neutral-400">{k.source}</p>
            </div>
            <div className="flex gap-1">
              {merker.map((m, j) => (
                <span key={j} className={`h-4 w-4 rounded ${m ? "bg-emerald-500" : "bg-rose-500"}`} />
              ))}
            </div>
            <span className="w-8 text-right font-mono text-xs tabular-nums text-neutral-500">{riktige}/{merker.length}</span>
          </div>
        ))}
      </Kort>

      <div className="flex justify-center gap-2">
        <DelKnapp tekst={delTekst} />
      </div>
    </div>
  )
}

"use client"

import { useEffect, useRef, useState } from "react"
import { flushSync } from "react-dom"
import { formaterDato, iDagOslo, leggTilDager } from "../lib/dag"
import {
  AARSTALL_REFERANSE,
  ANTALL,
  avvik,
  formaterTall,
  GJETTELOS_START,
  KATEGORIER,
  MAKS_SUM,
  poengTrinn,
  tolkGjett,
  type Fasit,
  type SporsmalVisning,
} from "../lib/gjettelos"
import { useDagligTilstand, useResultater, type Resultat } from "../lib/lagring"
import { lyder } from "../lib/lyd"
import { DelKnapp, Knapp, Kort } from "./spill-ramme"

// Gjetteløs: five number questions a day. The page only has the questions; each guess goes to the server,
// which sends back the answer, its source and the points.

type Svar = { g: number; f: Fasit }
type Tilstand = {
  v: 1
  svar: Svar[]
  /** How many answers the player has moved on from. One less than `svar.length` while an answer is shown. */
  videre: number
  resultat: Resultat
}

const tom = (): Tilstand => ({ v: 1, svar: [], videre: 0, resultat: { status: "pagar" } })

const AKSENT = "#818cf8"
const TELL_MS = 1100

const FAKTORER = [
  { navn: "tusen", ord: "tusen" },
  { navn: "mill.", ord: "mill." },
  { navn: "mrd.", ord: "mrd." },
]

async function spor(body: { dato: string; nr: number; gjett: number }): Promise<Fasit> {
  const svar = await fetch("/spill/api/gjettelos", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
  const data = await svar.json().catch(() => ({ melding: "Noe gikk galt." }))
  if (!svar.ok) throw new Error(data.melding ?? "Noe gikk galt.")
  return data as Fasit
}

const sum = (svar: Svar[]) => svar.reduce((s, x) => s + x.f.poeng, 0)
const enhetTekst = (s: SporsmalVisning) => (s.aarstall ? "" : s.enhet)
const medEnhet = (n: number, s: SporsmalVisning) => [formaterTall(n, s.aarstall), enhetTekst(s)].filter(Boolean).join(" ")

/** A source as a link when it is a URL, otherwise its name. */
function Kilde({ kilde }: { kilde: string }) {
  if (!/^https?:\/\//.test(kilde)) return <>{kilde}</>
  return (
    <a href={kilde} target="_blank" rel="noreferrer" className="underline decoration-neutral-300 underline-offset-2 hover:text-neutral-800">
      {new URL(kilde).hostname.replace(/^www\./, "")}
    </a>
  )
}

function KategoriMerke({ s }: { s: SporsmalVisning }) {
  const k = KATEGORIER[s.kategori]
  return (
    <span className="inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.18em] text-neutral-500">
      <span className="h-2 w-2 rounded-full" style={{ background: k.farge }} />
      {k.navn}
      <span className="tracking-[0.05em] text-neutral-700" aria-label={`Vanskelighet ${s.vansk} av 3`}>
        {"●".repeat(s.vansk)}
        <span className="text-neutral-300">{"●".repeat(3 - s.vansk)}</span>
      </span>
    </span>
  )
}

/** Five segments that fill with each answer's points. */
function Fremdrift({ svar, aktiv }: { svar: Svar[]; aktiv: number | null }) {
  return (
    <ol className="flex flex-1 gap-1.5" aria-label={`${svar.length} av ${ANTALL} spørsmål besvart`}>
      {Array.from({ length: ANTALL }, (_, i) => {
        const s = svar[i]
        const trinn = s ? poengTrinn(s.f.poeng) : null
        return (
          <li key={i} className="flex min-w-0 flex-1 flex-col gap-1">
            <span className={`relative h-2 overflow-hidden rounded-full bg-neutral-100 ${aktiv === i ? "ring-2 ring-[#818cf8]/60 ring-offset-1 ring-offset-[var(--spill-flate)]" : ""}`}>
              {s ? (
                <span
                  className="absolute inset-y-0 left-0 rounded-full transition-[width] duration-700 ease-out"
                  style={{ width: `${Math.max(4, s.f.poeng)}%`, background: trinn!.farge }}
                />
              ) : null}
            </span>
            <span className="text-center font-mono text-[10px] tabular-nums text-neutral-400">{s ? s.f.poeng : "·"}</span>
          </li>
        )
      })}
    </ol>
  )
}

// Races up and then crawls the last stretch, as in Mer eller mindre.
const myk = (p: number) => (p >= 1 ? 1 : (1 - Math.pow(2, -9 * p)) / (1 - Math.pow(2, -9)))

/** Counts the answer up from zero with soft ticks, then calls `onFerdig`. Years appear at once. */
function Teller({ verdi, aarstall, animer, onFerdig }: { verdi: number; aarstall: boolean; animer: boolean; onFerdig: () => void }) {
  const [vist, setVist] = useState(animer && !aarstall ? 0 : verdi)
  const [landet, setLandet] = useState(!animer)
  const ferdig = useRef(onFerdig)
  useEffect(() => {
    ferdig.current = onFerdig
  })
  useEffect(() => {
    if (!animer || aarstall) {
      ferdig.current()
      return
    }
    let ramme = 0
    let sisteTikk = -Infinity
    const start = performance.now()
    const steg = (t: number) => {
      const p = Math.min(1, (t - start) / TELL_MS)
      setVist(verdi * myk(p))
      if (p < 1 && t - sisteTikk >= 40 + 220 * p * p) {
        sisteTikk = t
        lyder.tikk(p)
      }
      if (p < 1) ramme = requestAnimationFrame(steg)
      else {
        setVist(verdi)
        setLandet(true)
        ferdig.current()
      }
    }
    ramme = requestAnimationFrame(steg)
    return () => cancelAnimationFrame(ramme)
  }, [verdi, aarstall, animer])
  // Round the running number to the answer's precision so decimals do not flicker.
  const desimaler = verdi < 1e7 && !Number.isInteger(verdi) ? (String(verdi).split(".")[1]?.length ?? 0) : 0
  const avrundet = landet ? verdi : Number(vist.toFixed(desimaler))
  return <span className={`inline-block ${landet && animer ? "mel-landet" : ""}`}>{formaterTall(avrundet, aarstall)}</span>
}

/**
 * Where the guess landed on a log scale around the answer: ÷10 on the left, ×10 on the right. Years use how
 * long ago they were, with earlier years to the left.
 */
function Maaler({ gjett, fasit, aarstall, vis }: { gjett: number; fasit: number; aarstall: boolean; vis: boolean }) {
  const forhold = aarstall ? (AARSTALL_REFERANSE - fasit) / Math.max(0.01, AARSTALL_REFERANSE - gjett) : gjett / fasit
  const x = Math.max(-1, Math.min(1, Math.log10(forhold)))
  const prosent = 50 + x * 46
  const merker = aarstall
    ? [
        { x: 0, tekst: "tidligere" },
        { x: 1, tekst: "" },
        { x: 2, tekst: "fasit" },
        { x: 3, tekst: "" },
        { x: 4, tekst: "senere" },
      ]
    : [
        { x: 0, tekst: "÷10" },
        { x: 1, tekst: "÷2" },
        { x: 2, tekst: "fasit" },
        { x: 3, tekst: "×2" },
        { x: 4, tekst: "×10" },
      ]
  const plass = [4, 50 - Math.log10(2) * 46, 50, 50 + Math.log10(2) * 46, 96]
  return (
    <div className="pt-1" aria-hidden="true">
      <div className="relative h-8">
        <div className="absolute inset-x-[4%] top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-gradient-to-r from-rose-500/60 via-emerald-400/90 to-rose-500/60" />
        {plass.map((p, i) => (
          <span key={i} className={`absolute top-1/2 w-px -translate-y-1/2 bg-neutral-400 ${i === 2 ? "h-6 bg-neutral-950" : "h-3"}`} style={{ left: `${p}%` }} />
        ))}
        <span
          className="absolute top-1/2 flex h-5 w-5 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-[var(--spill-flate)] shadow transition-[left,opacity] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]"
          style={{ left: `${vis ? prosent : 50}%`, opacity: vis ? 1 : 0, background: AKSENT }}
        />
      </div>
      <div className="relative h-4 font-mono text-[10px] text-neutral-400">
        {merker.map((m) => (
          <span key={m.x} className="absolute -translate-x-1/2 whitespace-nowrap" style={{ left: `${plass[m.x]}%` }}>
            {m.tekst}
          </span>
        ))}
      </div>
    </div>
  )
}

function streak(resultater: Record<string, Resultat>, iDag: string) {
  let n = 0
  const iDagFerdig = resultater[iDag] && resultater[iDag].status !== "pagar"
  for (let d = iDagFerdig ? iDag : leggTilDager(iDag, -1); d >= GJETTELOS_START; d = leggTilDager(d, -1)) {
    const r = resultater[d]
    if (!r || r.status === "pagar") break
    n++
  }
  return n
}

function Statistikk() {
  const resultater = useResultater("gjettelos")
  const ferdige = Object.values(resultater).filter((r) => r.status !== "pagar" && typeof r.poeng === "number")
  const snitt = ferdige.length ? ferdige.reduce((s, r) => s + (r.poeng ?? 0), 0) / ferdige.length : 0
  const tall = [
    { navn: "Spilt", verdi: String(ferdige.length) },
    { navn: "Snitt", verdi: Math.round(snitt).toLocaleString("nb-NO") },
    { navn: "Beste", verdi: String(Math.max(0, ...ferdige.map((r) => r.poeng ?? 0))) },
    { navn: "På rad", verdi: String(streak(resultater, iDagOslo())) },
  ]
  return (
    <dl className="grid grid-cols-4 gap-1 text-center">
      {tall.map((t) => (
        <div key={t.navn} className="min-w-0">
          <dd className="truncate text-sm font-semibold tabular-nums text-neutral-950">{t.verdi}</dd>
          <dt className="font-mono text-[10px] uppercase tracking-wider text-neutral-400">{t.navn}</dt>
        </div>
      ))}
    </dl>
  )
}

export function Gjettelos({ dato, sporsmal, repris = false }: { dato: string; sporsmal: SporsmalVisning[]; repris?: boolean }) {
  const { verdi: t, lastet, oppdater } = useDagligTilstand<Tilstand>("gjettelos", dato, tom)
  const [tekst, setTekst] = useState("")
  const [opptatt, setOpptatt] = useState(false)
  const [melding, setMelding] = useState<string | null>(null)
  // The answer just given counts up; one shown after a reload appears at once.
  const [fersk, setFersk] = useState<number | null>(null)
  const [talt, setTalt] = useState(false)
  const felt = useRef<HTMLInputElement>(null)
  const handling = useRef<HTMLDivElement>(null)

  const ferdig = t.resultat.status !== "pagar"
  const visNr = t.videre < t.svar.length ? t.videre : null
  const nr = Math.min(t.svar.length, ANTALL - 1)
  const s = sporsmal[visNr ?? nr]
  const tolket = tolkGjett(tekst, s.aarstall)
  const oppsummering = ferdig && visNr === null

  const send = async () => {
    if (opptatt || visNr !== null || ferdig) return
    if (tolket === null) {
      setMelding(s.aarstall ? "Skriv et årstall, for eksempel 1905." : "Skriv et tall større enn null, for eksempel 2 500 eller 1,5 mill.")
      return
    }
    const n = t.svar.length
    setOpptatt(true)
    setMelding(null)
    lyder.velg()
    try {
      const f = await spor({ dato, nr: n, gjett: tolket })
      setTalt(false)
      setFersk(n)
      oppdater((x) => {
        if (x.svar.length !== n) return x
        const svar = [...x.svar, { g: tolket, f }]
        const poeng = sum(svar)
        return {
          ...x,
          svar,
          resultat: svar.length < ANTALL ? { status: "pagar", etikett: `${svar.length}/${ANTALL} svar` } : { status: "ferdig", etikett: `${poeng}/${MAKS_SUM}`, poeng },
        }
      })
      setTekst("")
    } catch (e) {
      setMelding((e as Error).message)
    } finally {
      setOpptatt(false)
    }
  }

  const videre = () => {
    // Render the next question and focus its field inside the tap, so phones raise the keyboard.
    flushSync(() => oppdater((x) => (x.videre < x.svar.length ? { ...x, videre: x.videre + 1 } : x)))
    felt.current?.focus({ preventScroll: true })
  }

  const landet = () => {
    setTalt(true)
    const svar = visNr !== null ? t.svar[visNr] : undefined
    if (!svar || fersk !== visNr) return
    const p = svar.f.poeng
    if (p >= 90) lyder.seier()
    else if (p >= 65) lyder.riktig()
    else if (p >= 35) lyder.naer(p / 100)
    else lyder.feil()
  }

  // Focus follows the game: the field while guessing, the button that goes on while an answer is shown.
  useEffect(() => {
    if (!lastet || ferdig) return
    if (visNr === null) felt.current?.focus({ preventScroll: true })
  }, [lastet, ferdig, visNr])
  useEffect(() => {
    if (visNr !== null && (talt || fersk !== visNr)) handling.current?.querySelector("button")?.focus({ preventScroll: true })
  }, [talt, visNr, fersk])

  if (!lastet) return <div key="laster" className="h-96 animate-pulse rounded-3xl bg-white/5" />

  const total = sum(t.svar)

  if (oppsummering) return <Oppsummering dato={dato} sporsmal={sporsmal} svar={t.svar} />

  const vist = visNr !== null ? t.svar[visNr] : null
  const animer = vist !== null && fersk === visNr
  const ferdigVist = vist !== null && (!animer || talt)
  const trinn = vist ? poengTrinn(vist.f.poeng) : null

  return (
    <div className="flex flex-col gap-3">
      <p role="status" aria-live="polite" className="sr-only">
        {vist ? `Fasit: ${medEnhet(vist.f.fasit, s)}. Du gjettet ${medEnhet(vist.g, s)}. ${vist.f.poeng} poeng.` : ""}
      </p>

      <Kort className="flex items-center gap-4 px-4 py-3">
        <Fremdrift svar={t.svar} aktiv={visNr ?? nr} />
        <p className="shrink-0 text-right font-mono text-sm font-semibold tabular-nums text-neutral-950">
          {total}
          <span className="text-neutral-400">/{MAKS_SUM}</span>
        </p>
      </Kort>

      <Kort key={`${visNr ?? nr}-${vist ? "svar" : "sporsmal"}`} className="mel-inn p-5">
        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
          <KategoriMerke s={s} />
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-neutral-400">
            {(visNr ?? nr) + 1} av {ANTALL}
            {repris ? " · Repris" : ""}
          </p>
        </div>
        <h2 className="mt-3 font-[family-name:var(--font-visning)] text-[1.35rem] leading-snug font-extrabold tracking-[-0.03em] text-neutral-950 sm:text-[1.5rem]">
          {s.tekst}
        </h2>

        {vist ? (
          <div className="mt-5 space-y-4">
            <div className="flex items-end justify-between gap-4">
              <div className="min-w-0">
                <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-neutral-400">Fasit{vist.f.ca ? " (ca.)" : ""}</p>
                <p className="mt-1 text-3xl font-semibold tabular-nums tracking-tight text-neutral-950 sm:text-4xl">
                  <Teller verdi={vist.f.fasit} aarstall={s.aarstall} animer={animer} onFerdig={landet} />
                </p>
                {enhetTekst(s) ? <p className="text-sm text-neutral-500">{enhetTekst(s)}</p> : null}
              </div>
              <div
                className={`flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-2xl text-[#0b1016] transition duration-300 ${ferdigVist ? "mel-pop opacity-100" : "scale-75 opacity-0"}`}
                style={{ background: trinn!.farge }}
              >
                <span className="text-2xl leading-none font-bold tabular-nums">{vist.f.poeng}</span>
                <span className="mt-0.5 font-mono text-[9px] font-semibold uppercase tracking-wider opacity-70">poeng</span>
              </div>
            </div>

            <Maaler gjett={vist.g} fasit={vist.f.fasit} aarstall={s.aarstall} vis={ferdigVist} />

            <p className="text-sm text-neutral-700">
              Du gjettet <span className="font-semibold tabular-nums text-neutral-950">{medEnhet(vist.g, s)}</span>
              <span className="text-neutral-500"> · {avvik(vist.g, vist.f.fasit, s.aarstall)}</span>
              {ferdigVist ? <span className="text-neutral-500"> · {trinn!.ord}</span> : null}
            </p>
            {vist.f.info ? <p className="text-sm leading-6 text-neutral-600">{vist.f.info}</p> : null}
            <p className="font-mono text-[10px] leading-4 text-neutral-400">
              Kilde: <Kilde kilde={vist.f.kilde} />
              {vist.f.per ? ` · per ${vist.f.per}` : ""}
            </p>
            <div ref={handling} className="flex justify-end">
              <Knapp onClick={videre} className="min-w-36">
                {t.svar.length >= ANTALL ? "Se resultatet" : "Neste"}
              </Knapp>
            </div>
          </div>
        ) : (
          <form
            className="mt-5 space-y-3"
            onSubmit={(e) => {
              e.preventDefault()
              void send()
            }}
          >
            <label className="flex h-14 items-center gap-2 rounded-2xl border border-black/10 bg-neutral-50 px-4 transition focus-within:border-[#818cf8]">
              <input
                ref={felt}
                value={tekst}
                onChange={(e) => {
                  setTekst(e.target.value)
                  setMelding(null)
                }}
                maxLength={40}
                inputMode={s.aarstall ? "numeric" : "decimal"}
                autoComplete="off"
                autoCorrect="off"
                spellCheck={false}
                enterKeyHint="go"
                placeholder={s.aarstall ? "Årstall" : "Ditt anslag"}
                aria-label={s.aarstall ? "Årstall" : `Ditt anslag i ${s.enhet}`}
                className="h-full min-w-0 flex-1 bg-transparent text-xl font-semibold tabular-nums text-neutral-950 outline-none placeholder:font-normal placeholder:text-neutral-400"
              />
              {enhetTekst(s) ? <span className="shrink-0 text-sm text-neutral-500">{enhetTekst(s)}</span> : null}
            </label>

            <div className="flex min-h-9 flex-wrap items-center gap-2">
              {s.aarstall
                ? null
                : FAKTORER.map((f) => (
                    <button
                      key={f.navn}
                      type="button"
                      onClick={() => {
                        const uten = tekst.replace(/\s*(?:tusen|k|mill\.?|millioner|mrd\.?|milliarder)\s*$/i, "").trim()
                        setTekst(`${uten || "1"} ${f.ord}`)
                        setMelding(null)
                        felt.current?.focus({ preventScroll: true })
                      }}
                      className="h-8 rounded-full border border-black/10 bg-neutral-100/70 px-3 font-mono text-[11px] text-neutral-700 transition hover:border-black/25 hover:text-neutral-950"
                    >
                      + {f.navn}
                    </button>
                  ))}
              <p className="ml-auto min-w-0 truncate font-mono text-[11px] tabular-nums text-neutral-500" aria-live="polite">
                {tekst.trim() && tolket !== null ? `= ${medEnhet(tolket, s)}` : ""}
              </p>
            </div>

            {melding ? <p className="font-mono text-[11px] text-rose-500">{melding}</p> : null}

            <button
              type="submit"
              disabled={opptatt || !tekst.trim()}
              className="inline-flex h-12 w-full items-center justify-center rounded-full bg-[#818cf8] text-sm font-semibold text-[#0b1016] transition hover:bg-[#a5b4fc] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
            >
              {opptatt ? "Sjekker …" : "Gjett"}
            </button>
            {t.svar.length === 0 ? (
              <p className="text-center font-mono text-[10px] text-neutral-400">Opptil 100 poeng per spørsmål. Halvparten eller dobbelt gir 50.</p>
            ) : null}
          </form>
        )}
      </Kort>
    </div>
  )
}

function Oppsummering({ dato, sporsmal, svar }: { dato: string; sporsmal: SporsmalVisning[]; svar: Svar[] }) {
  const total = sum(svar)
  const omtale =
    total >= 450 ? "Utrolig treffsikkert." : total >= 380 ? "Sterkt anslått!" : total >= 300 ? "Godt gjettet." : total >= 200 ? "Ikke verst." : "Tallene var vriene i dag."
  const delTekst = [
    `Gjetteløs · ${formaterDato(dato, "kort")} · ${total}/${MAKS_SUM}`,
    svar.map((x) => poengTrinn(x.f.poeng).emoji).join(""),
    svar.map((x) => x.f.poeng).join(" · "),
    "thodh.com/spill/gjettelos",
  ].join("\n")

  return (
    <div className="mel-inn flex flex-col gap-3">
      <Kort className="px-5 py-6 text-center">
        <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-neutral-400">Dagens resultat</p>
        <p className="mt-2 text-6xl font-semibold tabular-nums tracking-tight text-neutral-950">
          {total}
          <span className="text-2xl text-neutral-400">/{MAKS_SUM}</span>
        </p>
        <p className="mt-2 text-sm text-neutral-500">{omtale}</p>
        <p className="mt-3 text-lg tracking-[0.2em]" aria-hidden="true">
          {svar.map((x) => poengTrinn(x.f.poeng).emoji).join("")}
        </p>
        <div className="mt-4 flex justify-center">
          <DelKnapp tekst={delTekst} />
        </div>
      </Kort>
      <Kort className="px-4 py-3">
        <Statistikk />
      </Kort>
      <ul className="flex flex-col gap-1.5">
        {svar.map((x, i) => {
          const s = sporsmal[i]
          const trinn = poengTrinn(x.f.poeng)
          return (
            <li key={i} className="rounded-2xl border border-black/5 bg-[var(--spill-flate)] px-4 py-3">
              <div className="flex items-start gap-3">
                <div className="min-w-0 flex-1">
                  <KategoriMerke s={s} />
                  <p className="mt-1 text-sm font-medium text-neutral-900">{s.tekst}</p>
                  <p className="mt-1 text-sm text-neutral-500">
                    Fasit <span className="font-semibold tabular-nums text-neutral-900">{x.f.ca ? "ca. " : ""}{medEnhet(x.f.fasit, s)}</span>
                    <span className="block sm:inline">
                      <span className="max-sm:hidden"> · </span>du: <span className="tabular-nums">{medEnhet(x.g, s)}</span>
                    </span>
                  </p>
                  <p className="mt-1 font-mono text-[10px] text-neutral-400">
                    Kilde: <Kilde kilde={x.f.kilde} />
                    {x.f.per ? ` · per ${x.f.per}` : ""}
                  </p>
                </div>
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl font-bold tabular-nums text-[#0b1016]" style={{ background: trinn.farge }}>
                  {x.f.poeng}
                </span>
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

"use client"

import {
  Coffee,
  Coins,
  Cpu,
  Earth,
  Flag,
  HeartPulse,
  Landmark,
  Leaf,
  Medal,
  Palette,
  PawPrint,
  Rocket,
  Shapes,
  Trophy,
  type LucideIcon,
} from "lucide-react"
import { Outfit } from "next/font/google"
import { useEffect, useLayoutEffect, useRef, useState, type ChangeEvent } from "react"
import { flushSync } from "react-dom"
import { formaterDato, iDagOslo, leggTilDager } from "../lib/dag"
import {
  ANTALL,
  avstand,
  avvik,
  erKjentKategori,
  formaterPoeng,
  formaterFullt,
  formaterTall,
  GJETTELOS_START,
  grupperInndata,
  kategoriInfo,
  markorEtterGruppering,
  MAKS_SUM,
  NULL_VED,
  poengForAvstand,
  poengTrinn,
  SKILLE,
  summer,
  tolkGjett,
  type Fasit,
  type KjentKategori,
  type SporsmalVisning,
} from "../lib/gjettelos"
import { useDagligTilstand, useResultater, type Resultat } from "../lib/lagring"
import { lyder } from "../lib/lyd"
import { DelKnapp } from "./spill-ramme"

// Gjetteløs: five number questions a day. The page only has the questions; each guess goes to the server,
// which sends back the answer, its source and the points.

/** Geometric sans for Gjetteløs only: many weights, and figures that hold up at display size. */
const skrift = Outfit({ subsets: ["latin"], display: "swap" })

type Svar = { g: number; f: Fasit }
type Tilstand = {
  v: 1
  svar: Svar[]
  /** How many answers the player has moved on from. One less than `svar.length` while an answer is shown. */
  videre: number
  resultat: Resultat
}

const tom = (): Tilstand => ({ v: 1, svar: [], videre: 0, resultat: { status: "pagar" } })

const TELL_MS = 1100
const FLATE = "rounded-[28px] border border-white/[0.07] bg-[var(--spill-flate)]"
const STOR_KNAPP =
  "inline-flex h-14 w-full items-center justify-center rounded-2xl bg-neutral-950 text-base font-semibold text-[#18191b] shadow-[0_1px_0_rgb(255_255_255/0.4)_inset] transition hover:bg-white active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-40"

const IKONER: Record<KjentKategori, LucideIcon> = {
  norge: Flag,
  verden: Earth,
  historie: Landmark,
  sport: Trophy,
  rommet: Rocket,
  teknologi: Cpu,
  kultur: Palette,
  okonomi: Coins,
  kropp: HeartPulse,
  rekorder: Medal,
  hverdag: Coffee,
  natur: Leaf,
  dyr: PawPrint,
}

function KategoriIkon({ kategori, className }: { kategori: string; className?: string }) {
  const Ikon = erKjentKategori(kategori) ? IKONER[kategori] : Shapes
  return <Ikon className={className} strokeWidth={2} aria-hidden="true" />
}

async function spor(body: { dato: string; nr: number; gjett: number }): Promise<Fasit> {
  const svar = await fetch("/spill/api/gjettelos", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
  const data = await svar.json().catch(() => ({ melding: "Noe gikk galt." }))
  if (!svar.ok) throw new Error(data.melding ?? "Noe gikk galt.")
  return data as Fasit
}

const sum = (svar: Svar[]) => summer(svar.map((x) => x.f.poeng))
const enhetTekst = (s: SporsmalVisning) => (s.aarstall ? "" : s.enhet)
const medEnhet = (n: number, s: SporsmalVisning) => [formaterTall(n, s.aarstall), enhetTekst(s)].filter(Boolean).join(" ")
const nummer = (i: number) => String(i + 1).padStart(2, "0")

/** A source as a link when it is a URL, otherwise its name. */
function Kilde({ kilde }: { kilde: string }) {
  if (!/^https?:\/\//.test(kilde)) return <>{kilde}</>
  return (
    <a href={kilde} target="_blank" rel="noreferrer" className="underline decoration-neutral-300 underline-offset-2 hover:text-neutral-800">
      {new URL(kilde).hostname.replace(/^www\./, "")}
    </a>
  )
}

/** The day's five categories as icons; the current one is lit, answered ones take their score's colour. */
function Kategorirad({ sporsmal, svar, aktiv, total }: { sporsmal: SporsmalVisning[]; svar: Svar[]; aktiv: number | null; total: number }) {
  return (
    <div className="flex items-stretch gap-2">
      <ol className="flex flex-1 gap-1 rounded-2xl border border-white/[0.06] bg-white/[0.03] p-1" aria-label={`${svar.length} av ${ANTALL} spørsmål besvart`}>
        {sporsmal.map((s, i) => {
          const x = svar[i]
          const pa = aktiv === i
          const farge = x && !pa ? poengTrinn(x.f.poeng).farge : undefined
          return (
            <li
              key={i}
              aria-current={pa ? "step" : undefined}
              aria-label={`${nummer(i)} ${kategoriInfo(s.kategori).navn}${x ? `, ${formaterPoeng(x.f.poeng)} poeng` : ""}`}
              className={`relative flex h-11 min-w-0 flex-1 items-center justify-center rounded-xl transition-colors duration-300 ${
                pa ? "bg-neutral-950 text-[#18191b] shadow-sm" : x ? "" : "text-neutral-400"
              }`}
              style={farge ? { color: farge } : undefined}
            >
              <KategoriIkon kategori={s.kategori} className="h-[18px] w-[18px]" />
              {x && !pa ? <span className="absolute bottom-1 h-1 w-1 rounded-full" style={{ background: farge }} /> : null}
            </li>
          )
        })}
      </ol>
      <div className="flex w-[4.5rem] shrink-0 flex-col items-center justify-center rounded-2xl border border-white/[0.06] bg-white/[0.03] leading-none">
        <span className="text-[17px] font-semibold tabular-nums text-neutral-950">{formaterPoeng(total)}</span>
        <span className="mt-1 text-[10px] font-medium uppercase tracking-[0.12em] text-neutral-400">av {MAKS_SUM}</span>
      </div>
    </div>
  )
}

/** Category, the running score and the question number along the top of the card. */
function Topplinje({ s, nr, repris }: { s: SporsmalVisning; nr: number; repris: boolean }) {
  const k = kategoriInfo(s.kategori)
  return (
    <div className="flex items-center gap-3 text-[13px] text-neutral-500">
      <span className="flex min-w-0 flex-1 items-center gap-1.5">
        <KategoriIkon kategori={s.kategori} className="h-4 w-4 shrink-0 text-neutral-700" />
        <span className="truncate">{k.navn}</span>
      </span>
      <span className="shrink-0 text-right font-semibold tabular-nums text-neutral-800">
        {repris ? <span className="font-normal text-neutral-400">repris · </span> : null}
        {nr + 1}/{ANTALL}
      </span>
    </div>
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
  const desimaler = verdi < 1e6 && !Number.isInteger(verdi) ? (String(verdi).split(".")[1]?.length ?? 0) : 0
  const avrundet = landet ? verdi : Number(vist.toFixed(desimaler))
  return <span className={`inline-block ${landet && animer ? "mel-landet" : ""}`}>{formaterTall(avrundet, aarstall)}</span>
}

/** The widest distance the curve shows, either way: where the points reach zero. */
const KANT = Math.log10(NULL_VED)
const KURVE_H = 64
const kurveX = (x: number) => ((Math.max(-KANT, Math.min(KANT, x)) + KANT) / (2 * KANT)) * 100
const kurveY = (poeng: number) => KURVE_H - 4 - (poeng / 100) * (KURVE_H - 12)
const KURVE = Array.from({ length: 97 }, (_, i) => {
  const x = -KANT + (2 * KANT * i) / 96
  return `${i ? "L" : "M"}${kurveX(x).toFixed(2)} ${kurveY(poengForAvstand(x)).toFixed(2)}`
}).join(" ")

/**
 * The scoring curve on a log scale, from a hundred times too low to a hundred times too high, with a dot where the
 * guess landed. Years are drawn on their steeper scale, earlier to the left.
 */
function Kurve({ gjett, fasit, aarstall, farge, vis }: { gjett: number; fasit: number; aarstall: boolean; farge: string; vis: boolean }) {
  const x = avstand(gjett, fasit, aarstall) ?? KANT
  const poeng = poengForAvstand(x)
  const venstre = vis ? kurveX(x) : 50
  const topp = vis ? kurveY(poeng) : kurveY(100)
  const merker = aarstall
    ? [
        { x: -1, tekst: "For tidlig" },
        { x: 0, tekst: "Riktig år" },
        { x: 1, tekst: "For sent" },
      ]
    : [
        { x: -1, tekst: "10× lavt" },
        { x: 0, tekst: "Fasit" },
        { x: 1, tekst: "10× høyt" },
      ]
  return (
    <div aria-hidden="true">
      <div className="relative" style={{ height: KURVE_H }}>
        <svg viewBox={`0 0 100 ${KURVE_H}`} preserveAspectRatio="none" className="absolute inset-0 h-full w-full overflow-visible">
          <defs>
            <linearGradient id="gjettelos-fyll" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor={farge} stopOpacity={vis ? 0.32 : 0.12} />
              <stop offset="100%" stopColor={farge} stopOpacity="0" />
            </linearGradient>
          </defs>
          {[-1, -Math.log10(2), 0, Math.log10(2), 1].map((m) => (
            <line
              key={m}
              x1={kurveX(m)}
              x2={kurveX(m)}
              y1={kurveY(100) - 4}
              y2={KURVE_H - 4}
              stroke="currentColor"
              className={m === 0 ? "text-neutral-400" : "text-neutral-200"}
              strokeDasharray="2 3"
              vectorEffect="non-scaling-stroke"
            />
          ))}
          <path d={`${KURVE} L100 ${KURVE_H - 4} L0 ${KURVE_H - 4} Z`} fill="url(#gjettelos-fyll)" className="transition-opacity duration-500" />
          <path d={KURVE} fill="none" stroke="currentColor" strokeWidth="1.75" className="text-neutral-600" vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
          <line x1="0" x2="100" y1={KURVE_H - 4} y2={KURVE_H - 4} stroke="currentColor" className="text-neutral-200" vectorEffect="non-scaling-stroke" />
        </svg>
        <span
          className="absolute w-px -translate-x-1/2 transition-[left,top,opacity] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]"
          style={{ left: `${venstre}%`, top: topp, bottom: 4, opacity: vis ? 0.7 : 0, background: farge }}
        />
        <span
          className="absolute flex h-5 w-5 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-[3px] border-[var(--spill-flate)] transition-[left,top,opacity] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]"
          style={{ left: `${venstre}%`, top: topp, opacity: vis ? 1 : 0, background: farge, boxShadow: `0 0 0 4px ${farge}40, 0 0 18px ${farge}` }}
        />
      </div>
      <div className="relative mt-1.5 h-4 text-[11px] font-medium text-neutral-400">
        {merker.map((m) => (
          <span key={m.x} className="absolute -translate-x-1/2 whitespace-nowrap" style={{ left: `${kurveX(m.x)}%` }}>
            {m.tekst}
          </span>
        ))}
      </div>
    </div>
  )
}

/** One of the two big numbers under the question: the answer or the guess. */
function Tall({ etikett, children, enhet }: { etikett: string; children: React.ReactNode; enhet: string }) {
  return (
    <div className="min-w-0">
      <p className="text-[13px] text-neutral-500">{etikett}</p>
      <p className="mt-1 flex flex-wrap items-baseline gap-x-1.5 leading-none">
        <span className="whitespace-nowrap text-[clamp(1.45rem,6.6vw,2.25rem)] font-bold tracking-[-0.02em] text-neutral-950 tabular-nums">{children}</span>
        {enhet ? <span className="text-sm font-medium text-neutral-500">{enhet}</span> : null}
      </p>
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
    { navn: "Snitt", verdi: formaterPoeng(snitt) },
    { navn: "Beste", verdi: formaterPoeng(Math.max(0, ...ferdige.map((r) => r.poeng ?? 0))) },
    { navn: "På rad", verdi: String(streak(resultater, iDagOslo())) },
  ]
  return (
    <dl className="grid grid-cols-4 gap-1 text-center">
      {tall.map((t) => (
        <div key={t.navn} className="flex min-w-0 flex-col-reverse">
          <dt className="mt-1 text-[11px] font-medium text-neutral-400">{t.navn}</dt>
          <dd className="truncate text-lg font-semibold tabular-nums text-neutral-950">{t.verdi}</dd>
        </div>
      ))}
    </dl>
  )
}

const erSletting = (type: string | undefined) => type === "deleteContentBackward" || type === "deleteContentForward"

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
  // Where the caret goes once the grouped text is in the field. A new object every keystroke, so the effect
  // runs even when grouping gives back the text that was already there.
  const [markor, setMarkor] = useState<{ pos: number } | null>(null)

  const ferdig = t.resultat.status !== "pagar"
  const visNr = t.videre < t.svar.length ? t.videre : null
  const nr = Math.min(t.svar.length, ANTALL - 1)
  const s = sporsmal[visNr ?? nr]
  const tolket = tolkGjett(tekst, s.aarstall)
  const oppsummering = ferdig && visNr === null

  useLayoutEffect(() => {
    if (markor && felt.current && document.activeElement === felt.current) felt.current.setSelectionRange(markor.pos, markor.pos)
  }, [markor])

  const skriv = (e: ChangeEvent<HTMLInputElement>) => {
    setMelding(null)
    let verdi = e.target.value
    if (s.aarstall) {
      setTekst(verdi)
      return
    }
    let pos = e.target.selectionStart ?? verdi.length
    // Deleting just a thousand separator would come straight back with the grouping: take the digit beside it.
    const type = (e.nativeEvent as InputEvent).inputType
    if (erSletting(type) && tekst[pos] === SKILLE && verdi === tekst.slice(0, pos) + tekst.slice(pos + 1)) {
      const bak = type === "deleteContentBackward"
      let i = bak ? pos - 1 : pos
      while (i >= 0 && i < verdi.length && /\s/.test(verdi[i])) i += bak ? -1 : 1
      if (i >= 0 && i < verdi.length) {
        verdi = verdi.slice(0, i) + verdi.slice(i + 1)
        pos = bak ? i : pos
      }
    }
    const gruppert = grupperInndata(verdi)
    setTekst(gruppert)
    setMarkor({ pos: markorEtterGruppering(gruppert, verdi.slice(0, pos)) })
  }

  const send = async () => {
    if (opptatt || visNr !== null || ferdig) return
    if (tolket === null) {
      setMelding(s.aarstall ? "Skriv et årstall, for eksempel 1905." : "Skriv et tall større enn null, for eksempel 2 500.")
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
          resultat:
            svar.length < ANTALL
              ? { status: "pagar", etikett: `${svar.length}/${ANTALL} svar` }
              : { status: "ferdig", etikett: `${formaterPoeng(poeng)}/${MAKS_SUM}`, poeng },
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
    if (p >= 85) lyder.seier()
    else if (p >= 60) lyder.riktig()
    else if (p >= 30) lyder.naer(p / 100)
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

  if (!lastet) return <div key="laster" className={`${skrift.className} h-[30rem] animate-pulse rounded-[28px] bg-white/5`} />

  if (oppsummering) return <Oppsummering dato={dato} sporsmal={sporsmal} svar={t.svar} />

  const total = sum(t.svar)
  const aktivNr = visNr ?? nr
  const vist = visNr !== null ? t.svar[visNr] : null
  const animer = vist !== null && fersk === visNr
  const ferdigVist = vist !== null && (!animer || talt)
  const trinn = vist ? poengTrinn(vist.f.poeng) : null
  // The running score in the card counts this answer only once it has landed.
  const lopende = vist && !ferdigVist ? summer([total, -vist.f.poeng]) : total
  // The other way of writing what was typed: "1 500 000" reads as "1,5 mill." and "1,5 mill" as "1 500 000".
  const annenForm =
    tolket === null || s.aarstall ? null : /[a-zæøå]/i.test(tekst) ? formaterFullt(tolket) : formaterTall(tolket)
  const visAnnenForm = annenForm !== null && annenForm.replace(/\s/g, "") !== tekst.replace(/\s/g, "")

  return (
    <div className={`${skrift.className} flex flex-col gap-3`}>
      <p role="status" aria-live="polite" className="sr-only">
        {vist ? `Fasit: ${medEnhet(vist.f.fasit, s)}. Du gjettet ${medEnhet(vist.g, s)}. ${formaterPoeng(vist.f.poeng)} poeng.` : ""}
      </p>

      <Kategorirad sporsmal={sporsmal} svar={t.svar} aktiv={aktivNr} total={vist && !ferdigVist ? lopende : total} />

      {vist ? (
        <>
          <section
            key={`${aktivNr}-svar`}
            className={`${FLATE} mel-inn relative overflow-hidden p-5 sm:p-6`}
            style={{ backgroundImage: ferdigVist ? `radial-gradient(130% 85% at 0% 0%, ${trinn!.farge}45, transparent 72%)` : undefined }}
          >
            <Topplinje s={s} nr={aktivNr} repris={repris} />

            <div className="mt-5 flex items-end justify-between gap-4">
              <div>
                <p
                  className={`text-[clamp(3.5rem,17vw,4.75rem)] leading-[0.9] font-bold tracking-[-0.04em] tabular-nums transition duration-300 ${ferdigVist ? "mel-pop opacity-100" : "opacity-0"}`}
                  style={{ color: trinn!.farge }}
                >
                  {formaterPoeng(vist.f.poeng)}
                </p>
              </div>
              <div className={`pb-1 text-right transition-opacity duration-300 ${ferdigVist ? "opacity-100" : "opacity-0"}`}>
                <p className="text-[17px] leading-tight font-semibold text-neutral-950">{avvik(vist.g, vist.f.fasit, s.aarstall)}</p>
              </div>
            </div>

            <div className="mt-6">
              <h2 className="text-[1.05rem] leading-snug font-medium text-neutral-800">{s.tekst}</h2>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-4 border-t border-white/[0.07] pt-4">
              <Tall etikett={vist.f.ca ? "Fasit (ca.)" : "Fasit"} enhet={enhetTekst(s)}>
                <Teller verdi={vist.f.fasit} aarstall={s.aarstall} animer={animer} onFerdig={landet} />
              </Tall>
              <Tall etikett="Ditt svar" enhet={enhetTekst(s)}>
                {formaterTall(vist.g, s.aarstall)}
              </Tall>
            </div>

            <div className="mt-6">
              <Kurve gjett={vist.g} fasit={vist.f.fasit} aarstall={s.aarstall} farge={trinn!.farge} vis={ferdigVist} />
            </div>

            {vist.f.info ? <p className="mt-5 text-sm leading-6 text-neutral-700">{vist.f.info}</p> : null}
            <p className="mt-3 text-[11px] leading-4 text-neutral-400">
              Kilde: <Kilde kilde={vist.f.kilde} />
              {vist.f.per ? ` · per ${vist.f.per}` : ""}
            </p>
          </section>
          <div ref={handling}>
            <button type="button" onClick={videre} className={STOR_KNAPP}>
              {t.svar.length >= ANTALL ? "Se resultatet" : "Neste spørsmål"}
            </button>
          </div>
        </>
      ) : (
        <form
          className="flex flex-col gap-3"
          onSubmit={(e) => {
            e.preventDefault()
            void send()
          }}
        >
          <section key={`${aktivNr}-sporsmal`} className={`${FLATE} mel-inn p-5 sm:p-6`}>
            <Topplinje s={s} nr={aktivNr} repris={repris} />
            <h2 className="mt-6 text-[clamp(1.4rem,6vw,1.75rem)] leading-[1.2] font-semibold tracking-[-0.015em] text-neutral-950">{s.tekst}</h2>

            <label className="mt-6 flex h-16 items-center gap-3 rounded-2xl border border-white/10 bg-[rgb(0_0_0/0.24)] px-4 transition focus-within:border-white/35 focus-within:bg-[rgb(0_0_0/0.34)]">
              <input
                ref={felt}
                value={tekst}
                onChange={skriv}
                maxLength={40}
                inputMode={s.aarstall ? "numeric" : "decimal"}
                autoComplete="off"
                autoCorrect="off"
                spellCheck={false}
                enterKeyHint="go"
                placeholder={s.aarstall ? "Årstall" : "Ditt svar"}
                aria-label={s.aarstall ? "Årstall" : `Ditt svar i ${s.enhet}`}
                className="h-full min-w-0 flex-1 bg-transparent text-[1.75rem] font-semibold tracking-[-0.01em] text-neutral-950 tabular-nums outline-none placeholder:text-xl placeholder:font-normal placeholder:text-neutral-400"
              />
              {enhetTekst(s) ? <span className="max-w-[40%] shrink-0 truncate text-sm font-medium text-neutral-500">{enhetTekst(s)}</span> : null}
            </label>

            <p className="mt-2 min-h-5 text-[13px] tabular-nums" aria-live="polite">
              {melding ? (
                <span className="text-rose-400">{melding}</span>
              ) : visAnnenForm ? (
                <span className="text-neutral-500">
                  = {annenForm} {enhetTekst(s)}
                </span>
              ) : null}
            </p>
          </section>
          <button type="submit" disabled={opptatt || !tekst.trim()} className={STOR_KNAPP}>
            {opptatt ? "Sjekker …" : "Gjett"}
          </button>
        </form>
      )}
    </div>
  )
}

function Oppsummering({ dato, sporsmal, svar }: { dato: string; sporsmal: SporsmalVisning[]; svar: Svar[] }) {
  const total = sum(svar)
  const snitt = poengTrinn(total / ANTALL)
  const omtale =
    total >= 450 ? "Utrolig treffsikkert." : total >= 380 ? "Sterkt anslått!" : total >= 300 ? "Godt gjettet." : total >= 200 ? "Ikke verst." : "Tallene var vriene i dag."
  const delTekst = [
    `Gjetteløs · ${formaterDato(dato, "kort")} · ${formaterPoeng(total)}/${MAKS_SUM}`,
    svar.map((x) => poengTrinn(x.f.poeng).emoji).join(""),
    svar.map((x) => formaterPoeng(x.f.poeng)).join(" · "),
    "thodh.com/spill/gjettelos",
  ].join("\n")

  return (
    <div className={`${skrift.className} mel-inn flex flex-col gap-3`}>
      <section
        className={`${FLATE} px-5 pt-5 pb-6 text-center`}
        style={{ backgroundImage: `radial-gradient(120% 90% at 50% 0%, ${snitt.farge}40, transparent 72%)` }}
      >
        <p className="text-[13px] font-medium text-neutral-500">Dagens resultat · {formaterDato(dato, "kort")}</p>
        <p className="mt-3 leading-none">
          <span className="text-[clamp(4rem,20vw,5.5rem)] font-bold tracking-[-0.045em] tabular-nums" style={{ color: snitt.farge }}>
            {formaterPoeng(total)}
          </span>
          <span className="ml-1 text-2xl font-semibold text-neutral-400">/{MAKS_SUM}</span>
        </p>
        <p className="mt-3 text-[15px] text-neutral-700">{omtale}</p>
        <p className="mt-3 text-lg tracking-[0.2em]" aria-hidden="true">
          {svar.map((x) => poengTrinn(x.f.poeng).emoji).join("")}
        </p>
        <div className="mt-4 flex justify-center">
          <DelKnapp tekst={delTekst} />
        </div>
      </section>
      <section className={`${FLATE} px-4 py-4`}>
        <Statistikk />
      </section>
      <ul className="flex flex-col gap-2">
        {svar.map((x, i) => {
          const s = sporsmal[i]
          const trinn = poengTrinn(x.f.poeng)
          return (
            <li key={i} className="flex items-start gap-3 rounded-[22px] border border-white/[0.06] bg-[var(--spill-flate)] px-4 py-3.5">
              <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/[0.05] text-neutral-700">
                <KategoriIkon kategori={s.kategori} className="h-4 w-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[12px] text-neutral-500">
                  {nummer(i)} · {kategoriInfo(s.kategori).navn}
                </p>
                <p className="mt-0.5 text-sm leading-snug font-medium text-neutral-900">{s.tekst}</p>
                <p className="mt-1.5 text-[13px] text-neutral-500">
                  Fasit{" "}
                  <span className="font-semibold tabular-nums text-neutral-900">
                    {x.f.ca ? "ca. " : ""}
                    {medEnhet(x.f.fasit, s)}
                  </span>
                  <span className="block sm:inline">
                    <span className="max-sm:hidden"> · </span>Ditt svar <span className="tabular-nums text-neutral-700">{medEnhet(x.g, s)}</span>
                  </span>
                </p>
                <p className="mt-1 text-[11px] text-neutral-400">
                  {avvik(x.g, x.f.fasit, s.aarstall)} · Kilde: <Kilde kilde={x.f.kilde} />
                  {x.f.per ? ` · per ${x.f.per}` : ""}
                </p>
              </div>
              <span className="shrink-0 pt-0.5 text-xl font-bold tabular-nums tracking-[-0.02em]" style={{ color: trinn.farge }}>
                {formaterPoeng(x.f.poeng)}
              </span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

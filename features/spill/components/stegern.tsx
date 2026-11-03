"use client"

import { Lock, LockOpen, Timer, TimerOff } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { formaterDato, iDagOslo, leggTilDager } from "../lib/dag"
import { useDagligTilstand, useResultater, type Resultat } from "../lib/lagring"
import { lyder } from "../lib/lyd"
import { GJENTA_DM, hoppDm, MAKS_DM, meter, NIVAAER, NORMALE, SEKUNDER, STEGERN_START, type Nivaa, type Vurdering } from "../lib/stegern"
import { DelKnapp, Knapp, Kort } from "./spill-ramme"
import { Bane, type Hopp } from "./stegern-bane"

// 6/7-stegern: seven open prompts ("Nevn en frukt"). The server rates each answer from common to rare, and
// Stegern jumps that far. Question 6 asks what you answered on one of the first five; get it right and the
// final, worth 1.7 times as much, opens.

/** One answer: the text, its tier, the answer it matched and the top and rarest answers for the reveal. */
type Svar = { t: string; n: Nivaa; treff: string | null; v: string[]; s: string[]; a: number }
type Tilstand = {
  v: 1
  startet: boolean
  klokke: boolean
  /** The question on screen: 0–4 normal, 5 the repeat, 6 the final. */
  nr: number
  /** Whether that question is waiting for an answer. */
  apen: boolean
  /** When the open question's time runs out (epoch ms), 0 without the clock. */
  frist: number
  svar: Svar[]
  /** Which earlier question (1–5) number 6 asks about; 0 until it comes up. */
  sjetteNr: number
  sjette: { t: string; ok: boolean } | null
  finale: string
  finaleSvar: Svar | null
  resultat: Resultat
}

const tom = (): Tilstand => ({
  v: 1,
  startet: false,
  klokke: true,
  nr: 0,
  apen: false,
  frist: 0,
  svar: [],
  sjetteNr: 0,
  sjette: null,
  finale: "",
  finaleSvar: null,
  resultat: { status: "pagar" },
})

async function spor<T>(body: unknown): Promise<T> {
  const svar = await fetch("/spill/api/67-stegern", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
  const data = await svar.json().catch(() => ({ melding: "Noe gikk galt." }))
  if (!svar.ok) throw new Error(data.melding ?? "Noe gikk galt.")
  return data as T
}

const tilSvar = (t: string, v: Vurdering): Svar => ({ t, n: v.nivaa, treff: v.treff, v: v.vanligste, s: v.sjeldneste, a: v.antall })

function hoppene(t: Tilstand): Hopp[] {
  const ut: Hopp[] = t.svar.map((s) => ({ dm: hoppDm(s.n), nivaa: s.n, type: "vanlig" }))
  if (t.sjette) ut.push({ dm: t.sjette.ok ? GJENTA_DM : hoppDm(0), nivaa: t.sjette.ok ? 5 : 0, type: "gjenta" })
  if (t.finaleSvar) ut.push({ dm: hoppDm(t.finaleSvar.n, true), nivaa: t.finaleSvar.n, type: "finale" })
  return ut
}

const sumDm = (t: Tilstand) => hoppene(t).reduce((s, h) => s + h.dm, 0)

function ferdigResultat(t: Tilstand): Tilstand {
  const dm = sumDm(t)
  return { ...t, apen: false, frist: 0, resultat: { status: t.sjette?.ok ? "vunnet" : "ferdig", etikett: meter(dm), poeng: dm / 10 } }
}

/** A tier as a small coloured pill. */
function Merke({ n, finale = false }: { n: Nivaa; finale?: boolean }) {
  return (
    <span className="inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-[11px] font-bold text-[#0b1016]" style={{ background: NIVAAER[n].farge }}>
      {NIVAAER[n].navn}
      <span className="ml-1 font-mono font-semibold opacity-75">+{meter(hoppDm(n, finale)).replace(" m", "")}</span>
    </span>
  )
}

/** Seven dots for the day's questions: tier colours for the answered ones, a lock on the final. */
function Fremdrift({ t }: { t: Tilstand }) {
  const prikker = Array.from({ length: 7 }, (_, i) => {
    const s = i < NORMALE ? t.svar[i] : i === 6 ? t.finaleSvar : null
    const farge = s ? NIVAAER[s.n].farge : i === 5 && t.sjette ? NIVAAER[t.sjette.ok ? 5 : 0].farge : null
    return { i, farge, aktiv: t.startet && t.nr === i && t.resultat.status === "pagar" }
  })
  return (
    <ol className="flex items-center gap-1.5" aria-label="Spørsmål">
      {prikker.map(({ i, farge, aktiv }) => (
        <li
          key={i}
          className={`flex h-6 w-6 items-center justify-center rounded-full font-mono text-[10px] font-bold transition ${farge ? "text-[#0b1016]" : "bg-neutral-100 text-neutral-500"} ${aktiv ? "ring-2 ring-neutral-950 ring-offset-2 ring-offset-[var(--spill-flate)]" : ""}`}
          style={farge ? { background: farge } : undefined}
          aria-label={`Spørsmål ${i + 1}`}
        >
          {i === 6 && !t.finale ? <Lock className={`h-3 w-3 ${t.sjette ? "" : "opacity-60"}`} /> : i === 5 ? "↺" : i + 1}
        </li>
      ))}
    </ol>
  )
}

function Avsloring({ s, finale = false }: { s: Svar; finale?: boolean }) {
  return (
    <div className="space-y-1 font-mono text-[11px] leading-5 text-neutral-500">
      {s.v.length ? (
        <p>
          <span className="text-neutral-400">Vanligst:</span> <span className="text-neutral-800">{s.v.join(", ")}</span>
        </p>
      ) : null}
      {s.s.length ? (
        <p>
          <span className="text-neutral-400">Sjeldnest:</span> <span className="text-neutral-800">{s.s.join(", ")}</span>
        </p>
      ) : null}
      <p className="text-neutral-400">
        {s.a} godkjente svar{finale ? " · finalen teller 1,7×" : ""}
      </p>
    </div>
  )
}

function streak(resultater: Record<string, Resultat>, iDag: string) {
  let n = 0
  const iDagFerdig = resultater[iDag] && resultater[iDag].status !== "pagar"
  for (let d = iDagFerdig ? iDag : leggTilDager(iDag, -1); d >= STEGERN_START; d = leggTilDager(d, -1)) {
    const r = resultater[d]
    if (!r || r.status === "pagar") break
    n++
  }
  return n
}

function Statistikk() {
  const resultater = useResultater("67-stegern")
  const ferdige = Object.values(resultater).filter((r) => r.status !== "pagar" && typeof r.poeng === "number")
  const snitt = ferdige.length ? ferdige.reduce((s, r) => s + (r.poeng ?? 0), 0) / ferdige.length : 0
  const beste = Math.max(0, ...ferdige.map((r) => r.poeng ?? 0))
  const tall = [
    { navn: "Spilt", verdi: String(ferdige.length) },
    { navn: "Snitt", verdi: meter(Math.round(snitt * 10)) },
    { navn: "Beste", verdi: meter(Math.round(beste * 10)) },
    { navn: "Finaler", verdi: String(ferdige.filter((r) => r.status === "vunnet").length) },
    { navn: "På rad", verdi: String(streak(resultater, iDagOslo())) },
  ]
  return (
    <dl className="grid grid-cols-5 gap-1 text-center">
      {tall.map((t) => (
        <div key={t.navn} className="min-w-0">
          <dd className="truncate text-sm font-semibold tabular-nums text-neutral-950">{t.verdi}</dd>
          <dt className="font-mono text-[10px] uppercase tracking-wider text-neutral-400">{t.navn}</dt>
        </div>
      ))}
    </dl>
  )
}

export function Stegern({ dato, sporsmal }: { dato: string; sporsmal: string[] }) {
  const { verdi: t, lastet, oppdater } = useDagligTilstand<Tilstand>("67-stegern", dato, tom)
  const [tekst, setTekst] = useState("")
  const [opptatt, setOpptatt] = useState(false)
  const [melding, setMelding] = useState<string | null>(null)
  const [oppsummering, setOppsummering] = useState(false)
  const [na, setNa] = useState(() => Date.now())
  const felt = useRef<HTMLInputElement>(null)
  const ferdig = t.resultat.status !== "pagar"

  // A game that was already over when the page loaded opens on the summary.
  const [lastetFerdig, setLastetFerdig] = useState<boolean | null>(null)
  useEffect(() => {
    if (!lastet || lastetFerdig !== null) return
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLastetFerdig(ferdig)
  }, [lastet, lastetFerdig, ferdig])
  const sammendrag = ferdig && (oppsummering || lastetFerdig === true)

  const igjen = t.apen && t.frist ? Math.max(0, Math.ceil((t.frist - na) / 1000)) : null

  const send = async (verdi: string) => {
    if (opptatt || !t.apen || ferdig) return
    const svarTekst = verdi.trim().slice(0, 80)
    setOpptatt(true)
    setMelding(null)
    lyder.velg()
    try {
      if (t.nr === 5) {
        const tidligere = t.svar[t.sjetteNr - 1]?.t ?? ""
        const r = await spor<{ riktig: boolean; finale?: string }>({ type: "gjenta", dato, tidligere, svar: svarTekst })
        window.setTimeout(() => (r.riktig ? lyder.seier() : lyder.feil()), 700)
        oppdater((x) => {
          if (x.nr !== 5 || !x.apen) return x
          const neste = { ...x, apen: false, frist: 0, sjette: { t: svarTekst, ok: r.riktig }, finale: r.finale ?? "" }
          return r.riktig ? neste : ferdigResultat(neste)
        })
      } else {
        const nr = t.nr
        const v = await spor<Vurdering>({ type: "svar", dato, nr, svar: svarTekst })
        const lyd = v.nivaa === 0 ? lyder.feil : v.nivaa >= 4 ? lyder.seier : v.nivaa >= 2 ? lyder.riktig : () => lyder.naer(0.4)
        window.setTimeout(lyd, 650)
        oppdater((x) => {
          if (x.nr !== nr || !x.apen) return x
          const s = tilSvar(svarTekst, v)
          if (nr === 6) return ferdigResultat({ ...x, finaleSvar: s })
          return { ...x, apen: false, frist: 0, svar: [...x.svar.slice(0, nr), s] }
        })
      }
      setTekst("")
    } catch (e) {
      setMelding((e as Error).message)
    } finally {
      setOpptatt(false)
    }
  }

  const neste = async () => {
    setMelding(null)
    const frist = t.klokke ? Date.now() + SEKUNDER * 1000 : 0
    if (t.nr === 4 && !t.sjetteNr) {
      setOpptatt(true)
      try {
        const { n } = await spor<{ n: number }>({ type: "sjette", dato })
        oppdater((x) => (x.nr === 4 && !x.apen ? { ...x, nr: 5, apen: true, frist: x.klokke ? Date.now() + SEKUNDER * 1000 : 0, sjetteNr: n } : x))
      } catch (e) {
        setMelding((e as Error).message)
      } finally {
        setOpptatt(false)
      }
      return
    }
    oppdater((x) => {
      if (x.apen || x.resultat.status !== "pagar") return x
      if (x.nr === 5 && !x.sjette?.ok) return x
      return { ...x, nr: x.nr + 1, apen: true, frist }
    })
  }

  const start = () => {
    lyder.velg()
    oppdater((x) => (x.startet ? x : { ...x, startet: true, nr: 0, apen: true, frist: x.klokke ? Date.now() + SEKUNDER * 1000 : 0 }))
  }

  // The clock: tick while a question is open, and send whatever is typed when time runs out.
  const tidUte = t.apen && t.frist > 0 && igjen === 0
  useEffect(() => {
    if (!t.apen || !t.frist) return
    const id = window.setInterval(() => setNa(Date.now()), 250)
    return () => window.clearInterval(id)
  }, [t.apen, t.frist])
  const sistTikk = useRef<number | null>(null)
  useEffect(() => {
    if (igjen === null || igjen > 5 || igjen === sistTikk.current) return
    sistTikk.current = igjen
    if (igjen > 0) lyder.tikk(1 - igjen / 5)
  }, [igjen])
  const sendRef = useRef(send)
  useEffect(() => {
    sendRef.current = send
  })
  useEffect(() => {
    if (tidUte && lastet) void sendRef.current(felt.current?.value ?? "")
  }, [tidUte, lastet])

  // Keep the keyboard up between questions on phones: focus the field whenever a question opens.
  useEffect(() => {
    if (t.apen && lastet) felt.current?.focus({ preventScroll: true })
  }, [t.apen, t.nr, lastet])

  // Enter moves on once an answer has been revealed.
  useEffect(() => {
    const ved = (e: KeyboardEvent) => {
      if (e.key !== "Enter" || e.repeat || (e.target as HTMLElement | null)?.closest("button, a, input")) return
      if (!t.startet) start()
      else if (!t.apen && !ferdig) void neste()
      else if (ferdig && !sammendrag) setOppsummering(true)
    }
    window.addEventListener("keydown", ved)
    return () => window.removeEventListener("keydown", ved)
  })

  if (!lastet) return <div className="h-96 animate-pulse rounded-3xl bg-white/5" />

  const hopp = hoppene(t)
  const total = sumDm(t)
  const sporsmalTekst = t.nr === 5 ? `Hva svarte du på spørsmål ${t.sjetteNr}?` : t.nr === 6 ? t.finale : sporsmal[t.nr]
  const sisteSvar = t.nr === 6 ? t.finaleSvar : t.nr < NORMALE ? t.svar[t.nr] : null

  const delTekst = [
    `6/7-stegern · ${formaterDato(dato, "kort")} · ${meter(total)}`,
    `${t.svar.map((s) => NIVAAER[s.n].emoji).join("")} ${t.sjette?.ok ? "🔓" : "🔒"}${t.finaleSvar ? ` ${NIVAAER[t.finaleSvar.n].emoji}` : ""}`,
    "thodh.com/spill/67-stegern",
  ].join("\n")

  return (
    <div className="flex flex-col gap-3">
      <Kort className="overflow-hidden">
        <div className="flex items-center justify-between gap-3 px-4 pt-3">
          <Fremdrift t={t} />
          <p className="font-mono text-sm font-semibold tabular-nums text-neutral-950">{meter(total)}</p>
        </div>
        <div className="mt-2">
          <Bane hopp={hopp} oversikt={sammendrag} />
        </div>
      </Kort>

      {!t.startet ? (
        <Kort className="mel-inn space-y-4 p-5">
          <div>
            <p className="font-[family-name:var(--font-visning)] text-2xl font-extrabold tracking-[-0.03em] text-neutral-950">Sjeldne svar, lange hopp.</p>
            <p className="mt-1 text-sm leading-6 text-neutral-600">
              Fem spørsmål der alt som passer er riktig. Svarer du det alle sier, tar Stegern et kort steg. Finner du noe få tenker på, flyr han.
            </p>
          </div>
          <ul className="space-y-1.5 text-sm leading-6 text-neutral-600">
            <li>
              <span className="font-semibold text-neutral-900">Spørsmål 6</span> spør hva du svarte på ett av de fem første. Husker du det, låses finalen opp.
            </li>
            <li>
              <span className="font-semibold text-neutral-900">Finalen</span> teller 1,7 ganger. En perfekt dag er nøyaktig {meter(MAKS_DM)}.
            </li>
          </ul>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => oppdater((x) => ({ ...x, klokke: !x.klokke }))}
              aria-pressed={t.klokke}
              className="inline-flex items-center gap-2 rounded-full border border-black/10 px-3.5 py-2 font-mono text-[11px] uppercase tracking-widest text-neutral-700 transition hover:border-black/25"
            >
              {t.klokke ? <Timer className="h-4 w-4" /> : <TimerOff className="h-4 w-4" />}
              {t.klokke ? `${SEKUNDER} s per spørsmål` : "Uten klokke"}
            </button>
            <Knapp onClick={start}>Start</Knapp>
          </div>
        </Kort>
      ) : sammendrag ? (
        <Oppsummering t={t} sporsmal={sporsmal} total={total} delTekst={delTekst} />
      ) : (
        <Kort key={`${t.nr}-${t.apen}`} className="mel-inn p-4">
          <div className="flex items-baseline justify-between gap-3">
            <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-neutral-400">
              {t.nr === 5 ? "Spørsmål 6 · husker du?" : t.nr === 6 ? "Finale · 1,7×" : `Spørsmål ${t.nr + 1} av 5`}
            </p>
            {igjen !== null ? <p className={`font-mono text-sm font-semibold tabular-nums ${igjen <= 5 ? "text-rose-500" : "text-neutral-500"}`}>{igjen} s</p> : null}
          </div>
          <p className="mt-1 font-[family-name:var(--font-visning)] text-[1.45rem] leading-tight font-extrabold tracking-[-0.03em] text-neutral-950">{sporsmalTekst}</p>
          {t.apen && t.frist ? (
            <div className="mt-3 h-1 overflow-hidden rounded-full bg-neutral-100">
              <div
                className={`h-full rounded-full transition-[width] duration-300 ease-linear ${igjen !== null && igjen <= 5 ? "bg-rose-500" : "bg-lime-400"}`}
                style={{ width: `${Math.max(0, Math.min(1, (t.frist - na) / (SEKUNDER * 1000))) * 100}%` }}
              />
            </div>
          ) : null}

          {t.apen ? (
            <form
              className="mt-3 flex gap-2"
              onSubmit={(e) => {
                e.preventDefault()
                void send(tekst)
              }}
            >
              <input
                ref={felt}
                value={tekst}
                onChange={(e) => setTekst(e.target.value)}
                maxLength={80}
                autoComplete="off"
                autoCorrect="off"
                spellCheck={false}
                enterKeyHint="go"
                placeholder={t.nr === 5 ? "Samme svar som da" : "Skriv et svar"}
                aria-label="Svar"
                className="h-11 min-w-0 flex-1 rounded-full border border-black/10 bg-neutral-50 px-4 text-base text-neutral-950 outline-none placeholder:text-neutral-400 focus:border-lime-400"
              />
              <Knapp type="submit" disabled={opptatt} className="bg-lime-400 text-[#0b1016] hover:bg-lime-300">
                Hopp!
              </Knapp>
            </form>
          ) : null}
          {t.apen && t.nr === 5 ? <p className="mt-2 font-mono text-[11px] text-neutral-500">Svarte du ingenting da, hopper du med tomt felt nå.</p> : null}
          {melding ? <p className="mt-2 font-mono text-[11px] text-rose-500">{melding}</p> : null}

          {!t.apen && t.nr === 5 && t.sjette ? (
            <div className="mt-3 space-y-3">
              <div className="flex items-center gap-2">
                {t.sjette.ok ? <LockOpen className="h-5 w-5 text-lime-400" /> : <Lock className="h-5 w-5 text-rose-500" />}
                <p className="text-sm text-neutral-800">
                  {t.sjette.ok ? "Riktig husket! Finalen er låst opp." : "Det var ikke det du svarte. Løpet er over."}
                </p>
              </div>
              <p className="font-mono text-[11px] text-neutral-500">
                Da: «{t.svar[t.sjetteNr - 1]?.t || "ingenting"}» · nå: «{t.sjette.t || "ingenting"}»
              </p>
              <div className="flex justify-end">
                {t.sjette.ok ? <Knapp onClick={neste}>Til finalen</Knapp> : <Knapp onClick={() => setOppsummering(true)}>Se resultatet</Knapp>}
              </div>
            </div>
          ) : !t.apen && sisteSvar ? (
            <div className="mt-3 space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <Merke n={sisteSvar.n} finale={t.nr === 6} />
                <p className="min-w-0 text-sm text-neutral-800">
                  {sisteSvar.treff ? (
                    <>
                      <span className="font-semibold">{sisteSvar.treff}</span>
                      {sisteSvar.treff.toLowerCase() !== sisteSvar.t.toLowerCase() ? <span className="text-neutral-500"> (du skrev «{sisteSvar.t}»)</span> : null}
                    </>
                  ) : sisteSvar.t ? (
                    <>
                      «{sisteSvar.t}» er ikke på lista.
                    </>
                  ) : (
                    "Ikke noe svar."
                  )}
                </p>
              </div>
              <Avsloring s={sisteSvar} finale={t.nr === 6} />
              <div className="flex justify-end">
                {ferdig ? <Knapp onClick={() => setOppsummering(true)}>Se resultatet</Knapp> : <Knapp onClick={neste} disabled={opptatt}>{t.nr === 4 ? "Spørsmål 6" : "Neste"}</Knapp>}
              </div>
            </div>
          ) : null}
        </Kort>
      )}
    </div>
  )
}

function Oppsummering({ t, sporsmal, total, delTekst }: { t: Tilstand; sporsmal: string[]; total: number; delTekst: string }) {
  const rader = t.svar.map((s, i) => ({ nr: i + 1, tekst: sporsmal[i], s, finale: false }))
  if (t.finaleSvar) rader.push({ nr: 7, tekst: t.finale, s: t.finaleSvar, finale: true })
  const perfekt = total >= MAKS_DM
  return (
    <div className="mel-inn flex flex-col gap-3">
      <Kort className="flex items-center gap-3 px-4 py-3">
        <div className="min-w-0 flex-1">
          <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-neutral-400">{perfekt ? "Six seven!" : t.sjette?.ok ? "Alle sju hopp" : "Seks hopp"}</p>
          <p className="text-3xl font-semibold tabular-nums text-neutral-950">
            {meter(total)}
            <span className="text-lg text-neutral-400"> / {meter(MAKS_DM)}</span>
          </p>
        </div>
        <DelKnapp tekst={delTekst} />
      </Kort>
      <Kort className="px-4 py-3">
        <Statistikk />
      </Kort>
      <ul className="flex flex-col gap-1.5">
        {rader.slice(0, NORMALE).map((r) => (
          <li key={r.nr} className="rounded-2xl border border-black/5 bg-[var(--spill-flate)] px-4 py-3">
            <div className="flex items-start gap-3">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full font-mono text-[10px] font-bold text-[#0b1016]" style={{ background: NIVAAER[r.s.n].farge }}>
                {r.nr}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-neutral-900">{r.tekst}</p>
                <p className="mt-0.5 truncate text-sm text-neutral-500">{r.s.treff ?? (r.s.t ? `«${r.s.t}»` : "Ikke noe svar")}</p>
              </div>
              <Merke n={r.s.n} finale={r.finale} />
            </div>
            <div className="mt-2 pl-8">
              <Avsloring s={r.s} finale={r.finale} />
            </div>
          </li>
        ))}
        {t.sjette ? (
          <li className="flex items-center gap-3 rounded-2xl border border-black/5 bg-[var(--spill-flate)] px-4 py-3">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[#0b1016]" style={{ background: NIVAAER[t.sjette.ok ? 5 : 0].farge }}>
              {t.sjette.ok ? <LockOpen className="h-3 w-3" /> : <Lock className="h-3 w-3" />}
            </span>
            <p className="min-w-0 flex-1 text-sm text-neutral-900">
              Spørsmål 6: hva svarte du på {t.sjetteNr}?
              <span className="block truncate text-neutral-500">«{t.sjette.t || "ingenting"}» {t.sjette.ok ? "– husket!" : `– du svarte «${t.svar[t.sjetteNr - 1]?.t || "ingenting"}»`}</span>
            </p>
            <span className="font-mono text-sm font-semibold tabular-nums text-neutral-950">+{meter(t.sjette.ok ? GJENTA_DM : hoppDm(0)).replace(" m", "")}</span>
          </li>
        ) : null}
        {rader.slice(NORMALE).map((r) => (
          <li key={r.nr} className="rounded-2xl border border-black/5 bg-[var(--spill-flate)] px-4 py-3">
            <div className="flex items-start gap-3">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full font-mono text-[10px] font-bold text-[#0b1016]" style={{ background: NIVAAER[r.s.n].farge }}>
                {r.nr}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-neutral-900">{r.tekst}</p>
                <p className="mt-0.5 truncate text-sm text-neutral-500">{r.s.treff ?? (r.s.t ? `«${r.s.t}»` : "Ikke noe svar")}</p>
              </div>
              <Merke n={r.s.n} finale={r.finale} />
            </div>
            <div className="mt-2 pl-8">
              <Avsloring s={r.s} finale={r.finale} />
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}

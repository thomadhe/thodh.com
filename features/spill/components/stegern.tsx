"use client"

import { Lock, LockOpen, Timer, TimerOff } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { flushSync } from "react-dom"
import { formaterDato, iDagOslo, leggTilDager } from "../lib/dag"
import { useDagligTilstand, useResultater, type Resultat } from "../lib/lagring"
import { lyder } from "../lib/lyd"
import { GJENTA_DM, hoppDm, MAKS_DM, meter, NIVAAER, NORMALE, SEKUNDER, STEGERN_START, type Nivaa, type Vurdering } from "../lib/stegern"
import { Bane, tidTilLanding, type Hopp } from "./stegern-bane"
import { Avsloring, DelKnapp, DuellInngang, Klokke, NivaaMerke } from "./stegern-ui"

// 6/7-stegern: seven open prompts ("Nevn en frukt"). The server rates each answer from common to rare, and
// Stegern jumps that far. Question 6 asks what you answered on one of the first five; get it right and the
// final, worth 1.7 times as much, opens.

/**
 * One answer: the text, its tier, the answer it matched, the top and rarest answers for the reveal and the
 * server's receipt, which question 6 shows to prove what was answered.
 */
type Svar = { t: string; n: Nivaa; treff: string | null; v: string[]; s: string[]; a: number; k?: string }
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
  /** The server's ticket to the final, given when question 6 is right. */
  billett?: string
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

const tilSvar = (t: string, v: Vurdering & { kvittering?: string }): Svar => ({ t, n: v.nivaa, treff: v.treff, v: v.vanligste, s: v.sjeldneste, a: v.antall, k: v.kvittering })

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

/** Seven chips for the day's questions: tier colours for the answered ones, a lock on the final. */
function Fremdrift({ t }: { t: Tilstand }) {
  const prikker = Array.from({ length: 7 }, (_, i) => {
    const s = i < NORMALE ? t.svar[i] : i === 6 ? t.finaleSvar : null
    const farge = s ? NIVAAER[s.n].farge : i === 5 && t.sjette ? NIVAAER[t.sjette.ok ? 5 : 0].farge : null
    return { i, farge, aktiv: t.startet && t.nr === i && t.resultat.status === "pagar" }
  })
  return (
    <ol className="flex min-w-0 items-center gap-1" aria-label="Spørsmål">
      {prikker.map(({ i, farge, aktiv }) => (
        <li
          key={i}
          className={`px-brikke ${farge ? "text-[#0b1020]" : aktiv ? "bg-white text-[#0b1020]" : "bg-[#121a45]/90 text-[#a5b4e8]"}`}
          style={farge ? { background: farge } : undefined}
          aria-label={`Spørsmål ${i + 1}`}
          aria-current={aktiv ? "step" : undefined}
        >
          {i === 6 && !t.finale ? <Lock className={`h-3 w-3 ${t.sjette ? "" : "opacity-60"}`} /> : i === 5 ? "↺" : i + 1}
        </li>
      ))}
    </ol>
  )
}

const avsloring = (s: Svar, finale = false) => <Avsloring vanligste={s.v} sjeldneste={s.s} antall={s.a} finale={finale} />

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
        <div key={t.navn} className="flex min-w-0 flex-col-reverse gap-0.5">
          <dt className="px-etikett text-[11px] tracking-[0.03em] text-[#a5b4e8]">{t.navn}</dt>
          <dd className="px-skrift truncate text-[15px] font-semibold tabular-nums text-white">{t.verdi.replace(" m", "")}</dd>
        </div>
      ))}
    </dl>
  )
}

export function Stegern({ dato, sporsmal, repris = false }: { dato: string; sporsmal: string[]; repris?: boolean }) {
  const { verdi: t, lastet, oppdater } = useDagligTilstand<Tilstand>("67-stegern", dato, tom)
  const [tekst, setTekst] = useState("")
  const [opptatt, setOpptatt] = useState(false)
  const [melding, setMelding] = useState<string | null>(null)
  const [oppsummering, setOppsummering] = useState(false)
  const [na, setNa] = useState(() => Date.now())
  const felt = useRef<HTMLInputElement>(null)
  const handling = useRef<HTMLDivElement>(null)
  // Set once an answer is judged, so the reveal's button takes focus.
  const tilKnapp = useRef(false)
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
        const tidligere = t.svar[t.sjetteNr - 1]
        const r = await spor<{ riktig: boolean; finale?: string; billett?: string }>({
          type: "gjenta",
          dato,
          tidligere: tidligere?.t ?? "",
          kvittering: tidligere?.k ?? "",
          svar: svarTekst,
        })
        const hopp: Hopp = { dm: r.riktig ? GJENTA_DM : hoppDm(0), nivaa: r.riktig ? 5 : 0, type: "gjenta" }
        window.setTimeout(() => (r.riktig ? lyder.seier() : lyder.feil()), tidTilLanding(hopp))
        oppdater((x) => {
          if (x.nr !== 5 || !x.apen) return x
          const neste = { ...x, apen: false, frist: 0, sjette: { t: svarTekst, ok: r.riktig }, finale: r.finale ?? "", billett: r.billett }
          return r.riktig ? neste : ferdigResultat(neste)
        })
      } else {
        const nr = t.nr
        const v = await spor<Vurdering & { kvittering?: string }>({ type: "svar", dato, nr, svar: svarTekst, billett: nr === 6 ? t.billett : undefined })
        const lyd = v.nivaa === 0 ? lyder.feil : v.nivaa >= 4 ? lyder.seier : v.nivaa >= 2 ? lyder.riktig : () => lyder.naer(0.4)
        window.setTimeout(lyd, tidTilLanding({ dm: hoppDm(v.nivaa, nr === 6), nivaa: v.nivaa, type: nr === 6 ? "finale" : "vanlig" }))
        oppdater((x) => {
          if (x.nr !== nr || !x.apen) return x
          const s = tilSvar(svarTekst, v)
          if (nr === 6) return ferdigResultat({ ...x, finaleSvar: s })
          return { ...x, apen: false, frist: 0, svar: [...x.svar.slice(0, nr), s] }
        })
        // Ask which question number 6 is about while the fifth answer is shown, so moving on needs no wait.
        if (nr === 4 && !t.sjetteNr) {
          spor<{ n: number }>({ type: "sjette", dato })
            .then(({ n }) => oppdater((x) => (x.sjetteNr ? x : { ...x, sjetteNr: n })))
            .catch(() => {})
        }
      }
      tilKnapp.current = true
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
    // Render the next question now and focus its field while still inside the tap: iOS only raises the
    // keyboard for focus that happens synchronously in a user gesture.
    flushSync(() =>
      oppdater((x) => {
        if (x.apen || x.resultat.status !== "pagar") return x
        if (x.nr === 5 && !x.sjette?.ok) return x
        return { ...x, nr: x.nr + 1, apen: true, frist }
      }),
    )
    felt.current?.focus({ preventScroll: true })
  }

  const start = () => {
    lyder.velg()
    flushSync(() => oppdater((x) => (x.startet ? x : { ...x, startet: true, nr: 0, apen: true, frist: x.klokke ? Date.now() + SEKUNDER * 1000 : 0 })))
    felt.current?.focus({ preventScroll: true })
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

  // After an answer, focus moves to the button that goes on, so Enter, Space and screen readers land there.
  useEffect(() => {
    if (!tilKnapp.current || t.apen) return
    tilKnapp.current = false
    handling.current?.querySelector("button")?.focus()
  })

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

  if (!lastet) return <div key="laster" className="px-panel h-[260px] motion-safe:animate-pulse" />

  const hopp = hoppene(t)
  const total = sumDm(t)
  const sporsmalTekst = t.nr === 5 ? `Hva svarte du på spørsmål ${t.sjetteNr}?` : t.nr === 6 ? t.finale : sporsmal[t.nr]
  const sisteSvar = t.nr === 6 ? t.finaleSvar : t.nr < NORMALE ? t.svar[t.nr] : null
  // Read out by screen readers when an answer is judged.
  const kunngjoring =
    !t.startet || t.apen
      ? ""
      : t.nr === 5 && t.sjette
        ? t.sjette.ok
          ? `Riktig husket! Stegern hopper ${meter(GJENTA_DM)}, og finalen er låst opp.`
          : "Det var ikke det du svarte. Løpet er over."
        : sisteSvar
          ? `${NIVAAER[sisteSvar.n].navn}, ${meter(hoppDm(sisteSvar.n, t.nr === 6))}. ${sisteSvar.treff ?? (sisteSvar.t ? `«${sisteSvar.t}» er ikke på lista.` : "Ikke noe svar.")}`
          : ""

  const delTekst = [
    `6/7-stegern · ${formaterDato(dato, "kort")} · ${meter(total)}`,
    `${t.svar.map((s) => NIVAAER[s.n].emoji).join("")} ${t.sjette?.ok ? "🔓" : "🔒"}${t.finaleSvar ? ` ${NIVAAER[t.finaleSvar.n].emoji}` : ""}`,
    "thodh.com/spill/67-stegern",
  ].join("\n")

  return (
    <div className="flex flex-col gap-4">
      <p role="status" aria-live="polite" className="sr-only">
        {kunngjoring}
      </p>
      <div className="px-panel overflow-hidden">
        <Bane lopere={[{ id: "stegern", hopp, farge: 0 }]} oversikt={sammendrag} vekker={`${tekst}|${t.nr}|${t.apen}`} etikett={`Stegern har hoppet ${meter(total)}`}>
          {t.startet ? (
            <div className="pointer-events-none absolute inset-x-0 top-0 flex items-center justify-between gap-2 p-2">
              <Fremdrift t={t} />
              <p className="px-neon px-neon-liten shrink-0 text-[22px] leading-none tabular-nums">
                {meter(total).replace(" m", "")}
                <span className="text-[14px]"> M</span>
              </p>
            </div>
          ) : (
            <div className="pointer-events-none absolute inset-x-0 top-4 text-center">
              <p className="px-neon text-[32px] leading-none sm:text-[40px]">6/7-STEGERN</p>
              <p className="px-etikett mt-2 inline-block bg-[#050817]/70 px-1.5 py-1 text-[#ffd0f4]">
                {formaterDato(dato)}
                {repris ? " · repris" : ""}
              </p>
            </div>
          )}
        </Bane>
      </div>

      {!t.startet ? (
        <>
          <section className="px-panel px-hopp-inn space-y-4 p-4">
            <div>
              {repris ? <p className="px-merke mb-2 bg-[#263370] text-[#c7d2fe]">Repris · spørsmålene har vært brukt før</p> : null}
              <h2 className="px-skrift text-[26px] leading-tight font-bold text-white">Sjeldne svar, lange hopp.</h2>
              <p className="mt-1.5 text-sm leading-6 text-[#b9c3ea]">
                Fem spørsmål der alt som passer er riktig. Svarer du det alle sier, tar Stegern et kort steg. Finner du noe få tenker på, flyr han.
              </p>
            </div>
            <ul className="space-y-2 text-sm leading-6 text-[#b9c3ea]">
              <li className="flex gap-2.5">
                <span className="px-brikke mt-0.5 h-5 w-5 bg-[#facc15] text-[11px] text-[#0b1020]">↺</span>
                <span>
                  <span className="font-semibold text-white">Spørsmål 6</span> spør hva du svarte på ett av de fem første. Husker du det, låses finalen opp.
                </span>
              </li>
              <li className="flex gap-2.5">
                <span className="px-brikke mt-0.5 h-5 w-5 bg-[#e879f9] text-[11px] text-[#0b1020]">7</span>
                <span>
                  <span className="font-semibold text-white">Finalen</span> teller 1,7 ganger. En perfekt dag er nøyaktig {meter(MAKS_DM)}.
                </span>
              </li>
            </ul>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <button type="button" onClick={() => oppdater((x) => ({ ...x, klokke: !x.klokke }))} aria-pressed={t.klokke} title={t.klokke ? `${SEKUNDER} sekunder per spørsmål` : "Ingen tidsfrist"} className="px-knapp px-knapp-mork px-knapp-liten">
                {t.klokke ? <Timer className="h-4 w-4" /> : <TimerOff className="h-4 w-4" />}
                {t.klokke ? `Klokke ${SEKUNDER} s` : "Uten klokke"}
              </button>
              <button type="button" className="px-knapp min-w-[132px]" onClick={start}>
                Start ▶
              </button>
            </div>
          </section>
          <DuellInngang />
        </>
      ) : sammendrag ? (
        <Oppsummering t={t} sporsmal={sporsmal} total={total} delTekst={delTekst} />
      ) : (
        <section key={`${t.nr}-${t.apen}`} className={`px-panel px-hopp-inn p-4 ${t.nr === 6 ? "px-panel-rosa" : ""}`}>
          <div className="flex items-center justify-between gap-3">
            <p className="px-etikett">
              {t.nr === 5 ? "Spørsmål 6 · husker du?" : t.nr === 6 ? "Finale · 1,7×" : `Spørsmål ${t.nr + 1} av 5`}
              {repris ? " · repris" : ""}
            </p>
            {igjen !== null ? <p className={`px-skrift text-[22px] leading-none font-bold tabular-nums ${igjen <= 5 ? "text-[#ff4fd8]" : "text-white"}`}>{igjen}</p> : null}
          </div>
          <p className="mt-2 text-[22px] leading-[1.25] font-semibold tracking-[-0.01em] text-balance text-white sm:text-[24px]">{sporsmalTekst}</p>
          {t.apen && t.frist ? (
            <div className="mt-3">
              <Klokke igjenMs={t.frist - na} />
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
                className="px-felt h-[50px] min-w-0 flex-1 px-3"
              />
              <button type="submit" disabled={opptatt} className="px-knapp h-[50px]">
                Hopp!
              </button>
            </form>
          ) : null}
          {t.apen && t.nr === 5 ? <p className="mt-2 text-[13px] text-[#a5b4e8]">Svarte du ingenting da, hopper du med tomt felt nå.</p> : null}
          {melding ? <p className="mt-2 text-[13px] font-medium text-[#fda4af]">{melding}</p> : null}

          {!t.apen && t.nr === 5 && t.sjette ? (
            <div className="mt-3 space-y-3">
              <div className="flex items-center gap-2">
                <span className="px-brikke" style={{ background: NIVAAER[t.sjette.ok ? 5 : 0].farge }}>
                  {t.sjette.ok ? <LockOpen className="h-3.5 w-3.5 text-[#0b1020]" /> : <Lock className="h-3.5 w-3.5 text-[#0b1020]" />}
                </span>
                <p className="text-[16px] leading-6 font-semibold text-white">{t.sjette.ok ? "Riktig husket! Finalen er låst opp." : "Det var ikke det du svarte. Løpet er over."}</p>
              </div>
              <p className="text-[13px] text-[#a5b4e8]">
                Da: «{t.svar[t.sjetteNr - 1]?.t || "ingenting"}» · nå: «{t.sjette.t || "ingenting"}»
              </p>
              <div ref={handling} className="flex justify-end">
                {t.sjette.ok ? (
                  <button type="button" className="px-knapp px-knapp-rosa" onClick={neste}>
                    Til finalen ▶
                  </button>
                ) : (
                  <button type="button" className="px-knapp" onClick={() => setOppsummering(true)}>
                    Se resultatet
                  </button>
                )}
              </div>
            </div>
          ) : !t.apen && sisteSvar ? (
            <div className="mt-3 space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <NivaaMerke n={sisteSvar.n} finale={t.nr === 6} />
                <p className="min-w-0 text-[16px] leading-6 font-semibold text-white">
                  {sisteSvar.treff ? (
                    <>
                      {sisteSvar.treff}
                      {sisteSvar.treff.toLowerCase() !== sisteSvar.t.toLowerCase() ? <span className="text-[#a5b4e8]"> (du skrev «{sisteSvar.t}»)</span> : null}
                    </>
                  ) : sisteSvar.t ? (
                    <>«{sisteSvar.t}» er ikke på lista.</>
                  ) : (
                    "Ikke noe svar."
                  )}
                </p>
              </div>
              {avsloring(sisteSvar, t.nr === 6)}
              <div ref={handling} className="flex justify-end">
                {ferdig ? (
                  <button type="button" className="px-knapp" onClick={() => setOppsummering(true)}>
                    Se resultatet
                  </button>
                ) : (
                  <button type="button" className="px-knapp" onClick={neste} disabled={opptatt}>
                    {t.nr === 4 ? "Spørsmål 6 ▶" : "Neste ▶"}
                  </button>
                )}
              </div>
            </div>
          ) : null}
        </section>
      )}
    </div>
  )
}

function Rad({ nr, tekst, s, finale }: { nr: number; tekst: string; s: Svar; finale: boolean }) {
  return (
    <li className="px-panel px-panel-dempet px-3.5 py-3">
      <div className="flex items-start gap-3">
        <span className="px-brikke mt-0.5 h-5 w-5 text-[11px] text-[#0b1020]" style={{ background: NIVAAER[s.n].farge }}>
          {nr}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-white">{tekst}</p>
          <p className="mt-0.5 truncate text-[15px] font-semibold text-[#c7d2fe]">{s.treff ?? (s.t ? `«${s.t}»` : "Ikke noe svar")}</p>
        </div>
        <NivaaMerke n={s.n} finale={finale} />
      </div>
      <div className="mt-2 pl-8">{avsloring(s, finale)}</div>
    </li>
  )
}

function Oppsummering({ t, sporsmal, total, delTekst }: { t: Tilstand; sporsmal: string[]; total: number; delTekst: string }) {
  const rader = t.svar.map((s, i) => ({ nr: i + 1, tekst: sporsmal[i], s, finale: false }))
  if (t.finaleSvar) rader.push({ nr: 7, tekst: t.finale, s: t.finaleSvar, finale: true })
  const perfekt = total >= MAKS_DM
  return (
    <div className="px-hopp-inn flex flex-col gap-4">
      <section className="px-panel px-panel-rosa p-4">
        <div className="flex items-end justify-between gap-3">
          <div className="min-w-0">
            <p className="px-etikett text-[#ffb3ee]">{perfekt ? "Six seven!" : t.sjette?.ok ? "Alle sju hopp" : "Seks hopp"}</p>
            <p className="mt-1.5 whitespace-nowrap">
              <span className="px-neon text-[40px] leading-none tabular-nums">{meter(total).replace(" m", "")}</span>
              <span className="px-skrift text-[20px] text-[#a5b4e8]"> / {meter(MAKS_DM).replace(" m", "")} M</span>
            </p>
          </div>
          <DelKnapp tekst={delTekst}>Del</DelKnapp>
        </div>
        <div className="mt-4 border-t-[3px] border-dotted border-[#263370] pt-3">
          <Statistikk />
        </div>
      </section>
      <ul className="flex flex-col gap-2">
        {rader.slice(0, NORMALE).map((r) => (
          <Rad key={r.nr} {...r} />
        ))}
        {t.sjette ? (
          <li className="px-panel px-panel-dempet flex items-center gap-3 px-3.5 py-3">
            <span className="px-brikke h-5 w-5 text-[#0b1020]" style={{ background: NIVAAER[t.sjette.ok ? 5 : 0].farge }}>
              {t.sjette.ok ? <LockOpen className="h-3 w-3" /> : <Lock className="h-3 w-3" />}
            </span>
            <p className="min-w-0 flex-1 text-sm text-white">
              Spørsmål 6: hva svarte du på {t.sjetteNr}?
              <span className="block truncate text-[15px] font-semibold text-[#c7d2fe]">
                «{t.sjette.t || "ingenting"}» {t.sjette.ok ? "– husket!" : `– du svarte «${t.svar[t.sjetteNr - 1]?.t || "ingenting"}»`}
              </span>
            </p>
            <span className="px-skrift text-[16px] font-semibold tabular-nums text-white">+{meter(t.sjette.ok ? GJENTA_DM : hoppDm(0)).replace(" m", "")}</span>
          </li>
        ) : null}
        {rader.slice(NORMALE).map((r) => (
          <Rad key={r.nr} {...r} />
        ))}
      </ul>
      <DuellInngang />
    </div>
  )
}

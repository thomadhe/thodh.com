"use client"

import {
  AlertTriangle,
  ArrowLeft,
  Crown,
  Download,
  Flame,
  Lightbulb,
  Loader2,
  RotateCcw,
  Sparkles,
  Trophy,
} from "lucide-react"
import { useCallback, useEffect, useMemo, useState } from "react"
import { lyder } from "../lib/lyd"
import {
  regnDuellUtfall,
  type MoggernDeltaker,
  type MoggernRapport,
  type SpillerSluttResultat,
} from "../lib/moggern/duell"
import { lastNedDuellKortPng, type DuellKortSpiller } from "../lib/moggern/duell-kort"
import { DELPOENG_LISTE, formaterBonus, formaterMoggernPoeng } from "../lib/moggern/poeng"
import {
  ANSVARSFRASKRIVELSE_PAAMINNELSE,
  lagTipsOgDiss,
  rangForPoeng,
  uttrykkDom,
  vinnerLinje,
} from "../lib/moggern/tekster"
import { MFLATE, MKNAPP, MKNAPP_SEKUNDAR } from "./moggern-forklaring"
import { DelKnapp } from "./spill-ramme"

function useTelleOpp(maal: number, varighetMs = 850): number {
  const [verdi, setVerdi] = useState(0)
  useEffect(() => {
    if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setVerdi(maal)
      return
    }
    let rammeId = 0
    const start = performance.now()
    const steg = (na: number) => {
      const t = Math.min(1, (na - start) / varighetMs)
      const myk = 1 - (1 - t) ** 3
      setVerdi(Math.round(maal * myk * 10) / 10)
      if (t < 1) rammeId = requestAnimationFrame(steg)
    }
    rammeId = requestAnimationFrame(steg)
    return () => cancelAnimationFrame(rammeId)
  }, [maal, varighetMs])
  return verdi
}

function SpillerResultatKort({
  res,
  erMeg,
  erVinner,
  motstanderNavn,
  motstanderPoeng,
  bildeUrl,
  solo,
  fro,
}: {
  res: SpillerSluttResultat
  erMeg: boolean
  erVinner: boolean
  motstanderNavn: string
  motstanderPoeng?: number | null
  bildeUrl?: string | null
  solo?: boolean
  fro: string
}) {
  const maaling = res.offisiell
  const vistPoeng = useTelleOpp(maaling?.ok ? maaling.total : 0)
  const rang = maaling?.ok ? rangForPoeng(maaling.total) : null
  const dom = useMemo(() => (maaling?.ok ? uttrykkDom(maaling.uttrykkSnitt) : null), [maaling])
  const tipsOgDiss = useMemo(() => {
    if (!maaling?.ok) return null
    const moggetMed =
      !solo && typeof motstanderPoeng === "number"
        ? Math.max(0, Math.round((motstanderPoeng - maaling.total) * 10) / 10)
        : undefined
    return lagTipsOgDiss({
      delpoeng: maaling.delpoeng,
      lysStatus: maaling.lysStatus,
      kvalitet: maaling.kvalitet,
      total: maaling.total,
      moggetMed,
      fro: `${fro}:${res.deltaker.id}`,
    })
  }, [maaling, solo, motstanderPoeng, fro, res.deltaker.id])

  return (
    <section
      className={`${MFLATE} mel-inn flex min-w-0 flex-col gap-4 overflow-hidden p-4 sm:gap-5 sm:p-6 ${
        erVinner ? "!border-lime-300/35 shadow-[0_0_40px_rgb(190_242_100/0.10)]" : ""
      }`}
    >
      <div className="flex min-w-0 items-start justify-between gap-2.5 sm:gap-3">
        <div className="flex min-w-0 flex-1 items-center gap-2.5 sm:gap-3.5">
          {bildeUrl ? (
            <div className="relative h-16 w-14 shrink-0 overflow-hidden rounded-2xl border border-white/12 bg-[#111214] shadow-[0_6px_18px_rgb(0_0_0/0.35)] sm:h-20 sm:w-16">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={bildeUrl} alt={`Peak Mog for ${res.deltaker.navn}`} className="h-full w-full object-cover" />
              <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent px-1 pt-2 pb-0.5 text-center text-[9px] font-semibold tracking-wide text-lime-200">
                Peak
              </span>
            </div>
          ) : null}

          <div className="min-w-0 flex-1">
            <div className="flex min-w-0 items-center gap-1.5 sm:gap-2">
              {erVinner ? <Crown className="h-4 w-4 shrink-0 text-lime-300" aria-hidden="true" /> : null}
              <h3 className="truncate text-lg font-semibold tracking-[-0.03em] text-neutral-950 sm:text-xl">
                {res.deltaker.navn}
                {erMeg && !solo ? <span className="ml-1.5 text-xs font-normal tracking-normal text-neutral-500">(deg)</span> : null}
              </h3>
            </div>
            <p className="mt-1 break-words text-[11px] leading-4 text-neutral-500 tabular-nums sm:text-xs">
              {solo
                ? "15 sekunders solo-test · kun i din nettleser"
                : res.kilde === "motstander"
                  ? `Målt av ${motstanderNavn}${res.egenMaaling?.ok ? ` · egen måling: ${formaterMoggernPoeng(res.egenMaaling.total)}` : ""}`
                  : res.kilde === "egen"
                    ? "Kunne ikke måle over video — viser egen måling"
                    : "For få frontale bilder til å beregne poeng"}
            </p>
            {bildeUrl ? <p className="mt-0.5 text-[10px] text-neutral-500/80">Øyeblikksbilde · lagres aldri</p> : null}
          </div>
        </div>

        {maaling?.ok ? (
          <div className="shrink-0 text-right">
            <p className="text-[2.35rem] leading-[0.9] font-semibold tracking-[-0.05em] text-neutral-950 tabular-nums sm:text-[3.25rem]">
              {formaterMoggernPoeng(vistPoeng)}
            </p>
            <p className="mt-1 text-[11px] font-medium text-neutral-500">av 10</p>
          </div>
        ) : null}
      </div>

      {rang ? (
        <div className="mel-pop min-w-0 rounded-[20px] border border-white/[0.06] bg-[#1f2124] p-3.5 sm:rounded-[22px] sm:p-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`inline-flex max-w-full items-center gap-1.5 rounded-full px-3 py-1 text-sm font-semibold tracking-[-0.01em] ${rang.farge}`}>
              <Sparkles className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              <span className="truncate">{rang.tittel}</span>
            </span>
            {maaling && maaling.uttrykkBonus !== 0 ? (
              <span
                className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold tabular-nums ${
                  maaling.uttrykkBonus > 0 ? "bg-lime-300/15 text-lime-300" : "bg-rose-500/15 text-rose-300"
                }`}
              >
                Mog-uttrykk {formaterBonus(maaling.uttrykkBonus)}
              </span>
            ) : null}
            {maaling && maaling.finisherBonus && maaling.finisherBonus > 0 ? (
              <span className="inline-flex items-center gap-1 rounded-full border border-amber-300/40 bg-amber-300/20 px-2.5 py-1 text-xs font-bold text-amber-200 tabular-nums">
                🤫 Rizzler-finisher {formaterBonus(maaling.finisherBonus)}
              </span>
            ) : maaling && maaling.finisherBonus && maaling.finisherBonus < 0 ? (
              <span className="inline-flex items-center gap-1 rounded-full border border-rose-400/30 bg-rose-500/15 px-2.5 py-1 text-xs font-semibold text-rose-200 tabular-nums">
                😂 Rizz failed {formaterBonus(maaling.finisherBonus)}
              </span>
            ) : null}
          </div>
          <p className="mt-2.5 break-words text-[13px] leading-5 text-neutral-700">{rang.linje}</p>
          {dom ? (
            <p
              className={`mt-2.5 break-words rounded-xl border px-3 py-2 text-xs leading-5 font-medium ${
                dom.positiv
                  ? "border-lime-300/20 bg-lime-300/[0.08] text-lime-200"
                  : "border-rose-400/20 bg-rose-500/[0.08] text-rose-200"
              }`}
            >
              {dom.tekst}
            </p>
          ) : null}
        </div>
      ) : (
        <div className="break-words rounded-[20px] border border-amber-400/25 bg-amber-400/10 p-3.5 text-xs leading-5 text-amber-100 sm:rounded-[22px] sm:p-4">
          Fikk bare {maaling?.kvalitet.gyldigeRammer ?? 0} gyldige frontale bilder. Se rett inn i kameraet i godt lys neste runde!
        </div>
      )}

      {!solo && res.stortAvvik && res.motstanderMaaling?.ok && res.egenMaaling?.ok ? (
        <div className="flex min-w-0 items-start gap-2.5 rounded-[20px] border border-amber-400/30 bg-amber-400/10 p-3.5 text-xs leading-5 text-amber-100 sm:rounded-[22px] sm:p-4">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" aria-hidden="true" />
          <div className="min-w-0 flex-1 break-words">
            <p className="font-semibold">Uenighet mellom nettleserne ({formaterMoggernPoeng(res.avvik)} poeng forskjell)</p>
            <p className="mt-0.5 text-amber-200/85">
              {motstanderNavn} målte <strong>{formaterMoggernPoeng(res.motstanderMaaling.total)}</strong> · Du målte deg selv til{" "}
              <strong>{formaterMoggernPoeng(res.egenMaaling.total)}</strong>. (Duellen bruker motstanderens måling.)
            </p>
          </div>
        </div>
      ) : null}

      {maaling?.ok ? (
        <div className="min-w-0 space-y-2">
          <p className="text-xs font-medium text-neutral-500">7 delpoeng</p>
          <ul className="space-y-1.5">
            {DELPOENG_LISTE.map((d) => {
              const p = maaling.delpoeng[d.id]
              const bredde = Math.max(4, Math.min(100, Math.round(p * 10)))
              const barFarge =
                p >= 8 ? "bg-lime-300" : p >= 6 ? "bg-cyan-400" : p >= 4.5 ? "bg-amber-300" : "bg-rose-400"
              return (
                <li key={d.id} className="space-y-0.5">
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <span className="truncate text-neutral-700">{d.navn}</span>
                    <span className="shrink-0 font-semibold text-neutral-950 tabular-nums">{formaterMoggernPoeng(p)}</span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/[0.07]">
                    <div className={`h-full rounded-full transition-all duration-700 ${barFarge}`} style={{ width: `${bredde}%` }} />
                  </div>
                </li>
              )
            })}
          </ul>
        </div>
      ) : null}

      {tipsOgDiss ? (
        <div className="mt-auto min-w-0 space-y-2.5 border-t border-white/[0.07] pt-4">
          <div className="min-w-0 rounded-[20px] border border-rose-400/20 bg-rose-500/10 p-3.5 sm:rounded-[22px] sm:p-4">
            <p className="flex items-center gap-1.5 text-xs font-semibold text-rose-300">
              <Flame className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              {tipsOgDiss.dissFraLys ? "Dagens lys-diss" : "Dagens diss"}
            </p>
            <p className="mt-1.5 break-words text-sm leading-6 font-medium text-neutral-950 sm:text-[15px]">«{tipsOgDiss.diss}»</p>
          </div>

          <div className="min-w-0 rounded-[20px] border border-white/[0.06] bg-[#1f2124] p-3.5 sm:rounded-[22px] sm:p-4">
            <p className="flex items-center gap-1.5 text-xs font-semibold text-lime-300">
              <Lightbulb className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              Slik mogger du mer
            </p>
            <ul className="mt-2 space-y-1.5 text-xs leading-5 text-neutral-700">
              {tipsOgDiss.tips.map((t, i) => (
                <li key={i} className="flex min-w-0 gap-2">
                  <span className="shrink-0 text-lime-300">•</span>
                  <span className="min-w-0 break-words">{t}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : null}
    </section>
  )
}

export function MoggernResultat({
  kode,
  runde,
  deltakere,
  rapporter,
  meg,
  erVert,
  onOmkamp,
  solo = false,
  soloResultat = null,
  onTilbakeTilRom,
  bilder = {},
  stilling = {},
  dagensBeste = null,
}: {
  kode: string
  runde: number
  deltakere: MoggernDeltaker[]
  rapporter: Record<string, MoggernRapport>
  meg: string | null
  erVert: boolean
  onOmkamp: () => void
  solo?: boolean
  soloResultat?: SpillerSluttResultat | null
  onTilbakeTilRom?: () => void
  bilder?: Record<string, string | null>
  stilling?: Record<string, number>
  dagensBeste?: { poeng: number; nyRekord: boolean } | null
}) {
  const [lasterKort, setLasterKort] = useState(false)
  const utfall = useMemo(() => {
    if (solo && soloResultat) {
      return {
        spillere: [soloResultat],
        vinnerId: null,
        uavgjort: false,
        beggeHarResultat: !!soloResultat.offisiell?.ok,
      }
    }
    return regnDuellUtfall(deltakere, rapporter)
  }, [solo, soloResultat, deltakere, rapporter])

  const fro = solo ? `solo:${kode}:${runde}` : `${kode}:${runde}`

  useEffect(() => {
    lyder.seier()
  }, [runde, solo])

  const hovedLinje = useMemo(() => {
    if (solo) {
      const s = utfall.spillere[0]
      if (!s?.offisiell?.ok) {
        return "Solo-testen er ferdig! For få gyldige frontale bilder."
      }
      const rang = rangForPoeng(s.offisiell.total)
      return `${s.deltaker.navn} landet på ${formaterMoggernPoeng(s.offisiell.total)}/10 — ${rang.tittel}!`
    }
    if (!utfall.beggeHarResultat || utfall.spillere.length !== 2) {
      return "Runden er ferdig! En eller begge hadde for få gyldige frontale bilder."
    }
    const [a, b] = utfall.spillere
    return vinnerLinje(
      { navn: a.deltaker.navn, poeng: a.offisiell!.total },
      { navn: b.deltaker.navn, poeng: b.offisiell!.total },
    )
  }, [solo, utfall])

  const stillingTekst = useMemo(() => {
    if (solo || deltakere.length !== 2) return null
    const s0 = stilling[deltakere[0].id] ?? 0
    const s1 = stilling[deltakere[1].id] ?? 0
    if (s0 + s1 === 0) return null
    return `${deltakere[0].navn} ${s0} – ${s1} ${deltakere[1].navn}`
  }, [solo, deltakere, stilling])

  const deleTekst = useMemo(() => {
    const linjer = [solo ? "Moggern (Solo-test) · thodh.com" : "Moggern · thodh.com", hovedLinje]
    for (const s of utfall.spillere) {
      if (s.offisiell?.ok) {
        const rang = rangForPoeng(s.offisiell.total)
        const finisherTag =
          s.offisiell.finisherBonus && s.offisiell.finisherBonus > 0
            ? " · 🤫 Rizzler-finisher"
            : s.offisiell.finisherBonus && s.offisiell.finisherBonus < 0
              ? " · 😂 Rizz failed"
              : ""
        linjer.push(`${s.deltaker.navn}: ${formaterMoggernPoeng(s.offisiell.total)}/10 (${rang.tittel})${finisherTag}`)
      }
    }
    if (stillingTekst) linjer.push(`Stilling i rommet: ${stillingTekst}`)
    linjer.push("(Alt her er tull.)")
    return linjer.join("\n")
  }, [solo, hovedLinje, utfall.spillere, stillingTekst])

  const kanLasteNedKort = utfall.spillere.some((s) => s.offisiell?.ok)

  const lastNedKort = useCallback(async () => {
    if (!kanLasteNedKort || lasterKort) return
    setLasterKort(true)
    try {
      const kortSpillere: DuellKortSpiller[] = utfall.spillere
        .filter((s) => s.offisiell?.ok)
        .map((s) => {
          const maaling = s.offisiell!
          const dom = uttrykkDom(maaling.uttrykkSnitt)
          const mot = utfall.spillere.find((x) => x.deltaker.id !== s.deltaker.id)
          const motPoeng = mot?.offisiell?.ok ? mot.offisiell.total : null
          const moggetMed =
            !solo && typeof motPoeng === "number"
              ? Math.max(0, Math.round((motPoeng - maaling.total) * 10) / 10)
              : undefined
          const td = lagTipsOgDiss({
            delpoeng: maaling.delpoeng,
            lysStatus: maaling.lysStatus,
            kvalitet: maaling.kvalitet,
            total: maaling.total,
            moggetMed,
            fro: `${fro}:${s.deltaker.id}`,
          })
          return {
            navn: s.deltaker.navn,
            poeng: maaling.total,
            erVinner: !solo && utfall.vinnerId === s.deltaker.id,
            bildeUrl: bilder[s.deltaker.id] ?? null,
            uttrykkTekst: dom?.tekst ?? null,
            diss: td.diss,
            finisherBonus: maaling.finisherBonus,
          }
        })
      await lastNedDuellKortPng({
        tittel: hovedLinje,
        underTittel: solo
          ? `Moggern Solo-test · 15 s`
          : `Moggern · Rom ${kode} · Runde ${runde + 1}${stillingTekst ? ` · ${stillingTekst}` : ""}`,
        spillere: kortSpillere,
        filnavn: solo ? `moggern-solo-${kode.toLowerCase()}.png` : `moggern-duell-${kode.toLowerCase()}-r${runde + 1}.png`,
      })
    } finally {
      setLasterKort(false)
    }
  }, [kanLasteNedKort, lasterKort, utfall, fro, solo, bilder, hovedLinje, kode, runde, stillingTekst])

  return (
    <section className="flex w-full min-w-0 flex-col gap-4 sm:gap-5" aria-live="polite">
      <div
        className={`${MFLATE} mel-inn min-w-0 overflow-hidden bg-[radial-gradient(120%_90%_at_50%_0%,rgb(190_242_100/0.13),transparent_70%),var(--spill-flate)] px-4 py-6 text-center sm:px-6 sm:py-10`}
      >
        <div className="flex flex-wrap items-center justify-center gap-2">
          <p className="text-xs font-medium text-lime-300 tabular-nums">
            {solo ? "Solo-test · 15 sekunder" : `Resultat · Runde ${runde + 1}`}
          </p>
          {stillingTekst ? (
            <span className="inline-flex max-w-full items-center gap-1 rounded-full border border-white/10 bg-white/[0.05] px-2.5 py-0.5 text-[11px] font-semibold text-neutral-800 tabular-nums">
              <span className="truncate">{stillingTekst}</span>
            </span>
          ) : null}
          {dagensBeste ? (
            <span
              className={`inline-flex max-w-full items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold tabular-nums ${
                dagensBeste.nyRekord
                  ? "bg-lime-300 text-[#18191b]"
                  : "border border-white/10 bg-white/[0.05] text-neutral-700"
              }`}
            >
              <Trophy className="h-3 w-3 shrink-0" aria-hidden="true" />
              <span className="truncate">
                {dagensBeste.nyRekord
                  ? `Ny dagsrekord: ${formaterMoggernPoeng(dagensBeste.poeng)}`
                  : `Dagens beste: ${formaterMoggernPoeng(dagensBeste.poeng)}`}
              </span>
            </span>
          ) : null}
        </div>

        <h2 className="mx-auto mt-2.5 max-w-2xl break-words text-[1.45rem] leading-[1.15] font-semibold tracking-[-0.035em] text-neutral-950 sm:text-[2.6rem]">
          {hovedLinje}
        </h2>
        <div className="mt-5 flex flex-wrap items-center justify-center gap-2 sm:mt-6 sm:gap-2.5">
          {solo ? (
            <>
              <button type="button" onClick={onOmkamp} className={`${MKNAPP} max-w-full px-5 sm:px-6`}>
                <RotateCcw className="h-4 w-4 shrink-0" aria-hidden="true" />
                Prøv igjen (15 s)
              </button>
              {onTilbakeTilRom ? (
                <button type="button" onClick={onTilbakeTilRom} className={`${MKNAPP_SEKUNDAR} max-w-full px-4 sm:px-5`}>
                  <ArrowLeft className="h-4 w-4 shrink-0" aria-hidden="true" />
                  Tilbake til rommet
                </button>
              ) : null}
            </>
          ) : erVert ? (
            <button type="button" onClick={onOmkamp} className={`${MKNAPP} max-w-full px-5 sm:px-6`}>
              <RotateCcw className="h-4 w-4 shrink-0" aria-hidden="true" />
              Omkamp
            </button>
          ) : (
            <span className="inline-flex min-h-11 max-w-full items-center justify-center rounded-full border border-white/[0.07] bg-white/[0.03] px-4 py-2 text-center text-xs leading-4 text-neutral-600">
              Venter på at verten starter omkamp …
            </span>
          )}
          {kanLasteNedKort ? (
            <button
              type="button"
              onClick={() => void lastNedKort()}
              disabled={lasterKort}
              className={`${MKNAPP_SEKUNDAR} max-w-full px-4 sm:px-5`}
            >
              {lasterKort ? <Loader2 className="h-4 w-4 shrink-0 animate-spin" aria-hidden="true" /> : <Download className="h-4 w-4 shrink-0" aria-hidden="true" />}
              {solo ? "Last ned kort (PNG)" : "Last ned duellkort"}
            </button>
          ) : null}
          <DelKnapp tekst={deleTekst} />
        </div>
      </div>

      <div className={solo ? "mx-auto w-full min-w-0 max-w-xl" : "grid w-full min-w-0 grid-cols-1 gap-4 md:grid-cols-2"}>
        {utfall.spillere.map((s) => {
          const mot = utfall.spillere.find((x) => x.deltaker.id !== s.deltaker.id)
          return (
            <SpillerResultatKort
              key={s.deltaker.id}
              res={s}
              erMeg={s.deltaker.id === meg}
              erVinner={!solo && utfall.vinnerId === s.deltaker.id}
              motstanderNavn={mot?.deltaker.navn ?? "Motstanderen"}
              motstanderPoeng={mot?.offisiell?.ok ? mot.offisiell.total : null}
              bildeUrl={bilder[s.deltaker.id] ?? null}
              solo={solo}
              fro={fro}
            />
          )
        })}
      </div>

      <p className="break-words px-2 text-center text-xs leading-5 text-neutral-500">{ANSVARSFRASKRIVELSE_PAAMINNELSE}</p>
    </section>
  )
}

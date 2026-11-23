"use client"

import { AlertTriangle, Crown, Flame, Lightbulb, RotateCcw, Sparkles } from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import {
  regnDuellUtfall,
  type MoggernDeltaker,
  type MoggernRapport,
  type SpillerSluttResultat,
} from "../lib/moggern/duell"
import { DELPOENG_LISTE, formaterBonus, formaterMoggernPoeng } from "../lib/moggern/poeng"
import {
  ANSVARSFRASKRIVELSE_PAAMINNELSE,
  lagTipsOgDiss,
  rangForPoeng,
  vinnerLinje,
} from "../lib/moggern/tekster"
import { lyder } from "../lib/lyd"
import { MFLATE, MKNAPP } from "./moggern-forklaring"
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
  fro,
}: {
  res: SpillerSluttResultat
  erMeg: boolean
  erVinner: boolean
  motstanderNavn: string
  fro: string
}) {
  const maaling = res.offisiell
  const vistPoeng = useTelleOpp(maaling?.ok ? maaling.total : 0)
  const rang = maaling?.ok ? rangForPoeng(maaling.total) : null
  const tipsOgDiss = useMemo(
    () =>
      maaling?.ok
        ? lagTipsOgDiss({
            delpoeng: maaling.delpoeng,
            lysStatus: maaling.lysStatus,
            kvalitet: maaling.kvalitet,
            fro: `${fro}:${res.deltaker.id}`,
          })
        : null,
    [maaling, fro, res.deltaker.id],
  )

  return (
    <section
      className={`${MFLATE} mel-inn flex flex-col gap-5 p-5 sm:p-6 ${
        erVinner ? "!border-lime-300/35 shadow-[0_0_40px_rgb(190_242_100/0.10)]" : ""
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            {erVinner ? <Crown className="h-4 w-4 shrink-0 text-lime-300" aria-hidden="true" /> : null}
            <h3 className="truncate text-xl font-semibold tracking-[-0.03em] text-neutral-950">
              {res.deltaker.navn}
              {erMeg ? <span className="ml-1.5 text-xs font-normal tracking-normal text-neutral-500">(deg)</span> : null}
            </h3>
          </div>
          <p className="mt-1 text-xs text-neutral-500 tabular-nums">
            {res.kilde === "motstander"
              ? `Målt av ${motstanderNavn}${res.egenMaaling?.ok ? ` · egen måling: ${formaterMoggernPoeng(res.egenMaaling.total)}` : ""}`
              : res.kilde === "egen"
                ? "Kunne ikke måle over video — viser egen måling"
                : "For få frontale bilder til å beregne poeng"}
          </p>
        </div>

        {maaling?.ok ? (
          <div className="text-right">
            <p className="text-[3.25rem] leading-[0.9] font-semibold tracking-[-0.05em] text-neutral-950 tabular-nums">
              {formaterMoggernPoeng(vistPoeng)}
            </p>
            <p className="mt-1 text-[11px] font-medium text-neutral-500">av 10</p>
          </div>
        ) : null}
      </div>

      {rang ? (
        <div className="mel-pop rounded-[22px] border border-white/[0.06] bg-[#1f2124] p-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-semibold tracking-[-0.01em] ${rang.farge}`}>
              <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
              {rang.tittel}
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
          </div>
          <p className="mt-2.5 text-[13px] leading-5 text-neutral-700">{rang.linje}</p>
        </div>
      ) : (
        <div className="rounded-[22px] border border-amber-400/25 bg-amber-400/10 p-4 text-xs leading-5 text-amber-100">
          Fikk bare {maaling?.kvalitet.gyldigeRammer ?? 0} gyldige frontale bilder. Se rett inn i kameraet i godt lys neste runde!
        </div>
      )}

      {res.stortAvvik && res.motstanderMaaling?.ok && res.egenMaaling?.ok ? (
        <div className="flex items-start gap-2.5 rounded-[22px] border border-amber-400/30 bg-amber-400/10 p-4 text-xs leading-5 text-amber-100">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" aria-hidden="true" />
          <div>
            <p className="font-semibold">Uenighet mellom nettleserne ({formaterMoggernPoeng(res.avvik)} poeng forskjell)</p>
            <p className="mt-0.5 text-amber-200/85">
              {motstanderNavn} målte <strong>{formaterMoggernPoeng(res.motstanderMaaling.total)}</strong> · Du målte deg selv til{" "}
              <strong>{formaterMoggernPoeng(res.egenMaaling.total)}</strong>. (Duellen bruker motstanderens måling.)
            </p>
          </div>
        </div>
      ) : null}

      {maaling?.ok ? (
        <div className="space-y-2">
          <p className="text-xs font-medium text-neutral-500">7 delpoeng</p>
          <ul className="space-y-1.5">
            {DELPOENG_LISTE.map((d) => {
              const p = maaling.delpoeng[d.id]
              const bredde = Math.max(4, Math.min(100, Math.round(p * 10)))
              const barFarge =
                p >= 8 ? "bg-lime-300" : p >= 6 ? "bg-cyan-400" : p >= 4.5 ? "bg-amber-300" : "bg-rose-400"
              return (
                <li key={d.id} className="space-y-0.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-neutral-700">{d.navn}</span>
                    <span className="font-semibold text-neutral-950 tabular-nums">{formaterMoggernPoeng(p)}</span>
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
        <div className="mt-auto space-y-2.5 border-t border-white/[0.07] pt-4">
          <div className="rounded-[22px] border border-rose-400/20 bg-rose-500/10 p-4">
            <p className="flex items-center gap-1.5 text-xs font-semibold text-rose-300">
              <Flame className="h-3.5 w-3.5" aria-hidden="true" />
              {tipsOgDiss.dissFraLys ? "Dagens lys-diss" : "Dagens diss"}
            </p>
            <p className="mt-1.5 text-[15px] leading-6 font-medium text-neutral-950">«{tipsOgDiss.diss}»</p>
          </div>

          <div className="rounded-[22px] border border-white/[0.06] bg-[#1f2124] p-4">
            <p className="flex items-center gap-1.5 text-xs font-semibold text-lime-300">
              <Lightbulb className="h-3.5 w-3.5" aria-hidden="true" />
              Slik mogger du mer
            </p>
            <ul className="mt-2 space-y-1.5 text-xs leading-5 text-neutral-700">
              {tipsOgDiss.tips.map((t, i) => (
                <li key={i} className="flex gap-2">
                  <span className="text-lime-300">•</span>
                  <span>{t}</span>
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
}: {
  kode: string
  runde: number
  deltakere: MoggernDeltaker[]
  rapporter: Record<string, MoggernRapport>
  meg: string | null
  erVert: boolean
  onOmkamp: () => void
}) {
  const utfall = useMemo(() => regnDuellUtfall(deltakere, rapporter), [deltakere, rapporter])
  const fro = `${kode}:${runde}`

  useEffect(() => {
    lyder.seier()
  }, [runde])

  const hovedLinje = useMemo(() => {
    if (!utfall.beggeHarResultat || utfall.spillere.length !== 2) {
      return "Runden er ferdig! En eller begge hadde for få gyldige frontale bilder."
    }
    const [a, b] = utfall.spillere
    return vinnerLinje(
      { navn: a.deltaker.navn, poeng: a.offisiell!.total },
      { navn: b.deltaker.navn, poeng: b.offisiell!.total },
    )
  }, [utfall])

  const deleTekst = useMemo(() => {
    const linjer = ["Moggern · thodh.com", hovedLinje]
    for (const s of utfall.spillere) {
      if (s.offisiell?.ok) {
        const rang = rangForPoeng(s.offisiell.total)
        linjer.push(`${s.deltaker.navn}: ${formaterMoggernPoeng(s.offisiell.total)}/10 (${rang.tittel})`)
      }
    }
    linjer.push("(Alt her er tull.)")
    return linjer.join("\n")
  }, [hovedLinje, utfall.spillere])

  return (
    <section className="flex flex-col gap-5" aria-live="polite">
      <div
        className={`${MFLATE} mel-inn bg-[radial-gradient(120%_90%_at_50%_0%,rgb(190_242_100/0.13),transparent_70%),var(--spill-flate)] px-6 py-8 text-center sm:py-10`}
      >
        <p className="text-xs font-medium text-lime-300 tabular-nums">Resultat · Runde {runde + 1}</p>
        <h2 className="mx-auto mt-2.5 max-w-2xl text-[1.75rem] leading-[1.1] font-semibold tracking-[-0.035em] text-neutral-950 sm:text-[2.6rem]">
          {hovedLinje}
        </h2>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-2.5">
          {erVert ? (
            <button type="button" onClick={onOmkamp} className={MKNAPP}>
              <RotateCcw className="h-4 w-4" aria-hidden="true" />
              Omkamp
            </button>
          ) : (
            <span className="inline-flex h-11 items-center rounded-full border border-white/[0.07] bg-white/[0.03] px-5 text-xs text-neutral-600">
              Venter på at verten starter omkamp …
            </span>
          )}
          <DelKnapp tekst={deleTekst} />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {utfall.spillere.map((s) => {
          const mot = utfall.spillere.find((x) => x.deltaker.id !== s.deltaker.id)
          return (
            <SpillerResultatKort
              key={s.deltaker.id}
              res={s}
              erMeg={s.deltaker.id === meg}
              erVinner={utfall.vinnerId === s.deltaker.id}
              motstanderNavn={mot?.deltaker.navn ?? "Motstanderen"}
              fro={fro}
            />
          )
        })}
      </div>

      <p className="text-center text-xs leading-5 text-neutral-500">{ANSVARSFRASKRIVELSE_PAAMINNELSE}</p>
    </section>
  )
}

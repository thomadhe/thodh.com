"use client"

import { AlertTriangle, Crown, Flame, Lightbulb, RotateCcw, Sparkles } from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import {
  regnDuellUtfall,
  type MoggernDeltaker,
  type MoggernRapport,
  type SpillerSluttResultat,
} from "../lib/moggern/duell"
import { DELPOENG_LISTE, formaterMoggernPoeng } from "../lib/moggern/poeng"
import {
  ANSVARSFRASKRIVELSE_PAAMINNELSE,
  lagTipsOgDiss,
  rangForPoeng,
  vinnerLinje,
} from "../lib/moggern/tekster"
import { lyder } from "../lib/lyd"
import { DelKnapp, Knapp, Kort } from "./spill-ramme"

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
    <Kort
      className={`mel-inn flex flex-col gap-4 p-5 ${
        erVinner ? "border-lime-400/45 shadow-[0_0_32px_rgb(163_230_53/0.12)]" : "border-white/10"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            {erVinner ? <Crown className="h-4 w-4 shrink-0 text-lime-400" aria-hidden="true" /> : null}
            <h3 className="truncate font-[family-name:var(--font-visning)] text-xl font-extrabold text-neutral-950">
              {res.deltaker.navn}
              {erMeg ? <span className="ml-1.5 font-sans text-xs font-normal text-neutral-500">(deg)</span> : null}
            </h3>
          </div>
          <p className="mt-0.5 font-mono text-[11px] text-neutral-500">
            {res.kilde === "motstander"
              ? `Målt av ${motstanderNavn}${res.egenMaaling?.ok ? ` · egen måling: ${formaterMoggernPoeng(res.egenMaaling.total)}` : ""}`
              : res.kilde === "egen"
                ? "Kunne ikke måle over video — viser egen måling"
                : "For få frontale bilder til å beregne poeng"}
          </p>
        </div>

        {maaling?.ok ? (
          <div className="text-right">
            <p className="font-[family-name:var(--font-visning)] text-4xl leading-none font-black tabular-nums text-neutral-950">
              {formaterMoggernPoeng(vistPoeng)}
            </p>
            <p className="mt-0.5 font-mono text-[10px] uppercase tracking-widest text-neutral-500">av 10</p>
          </div>
        ) : null}
      </div>

      {rang ? (
        <div className="mel-pop rounded-2xl bg-black/25 p-3.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 font-[family-name:var(--font-visning)] text-sm font-extrabold tracking-tight ${rang.farge}`}>
              <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
              {rang.tittel}
            </span>
          </div>
          <p className="mt-2 text-xs leading-5 text-neutral-700">{rang.linje}</p>
        </div>
      ) : (
        <div className="rounded-2xl border border-amber-400/25 bg-amber-400/10 p-3.5 text-xs leading-5 text-amber-100">
          Fikk bare {maaling?.kvalitet.gyldigeRammer ?? 0} gyldige frontale bilder. Se rett inn i kameraet i godt lys neste runde!
        </div>
      )}

      {res.stortAvvik && res.motstanderMaaling?.ok && res.egenMaaling?.ok ? (
        <div className="flex items-start gap-2.5 rounded-2xl border border-amber-400/30 bg-amber-400/10 p-3 text-xs leading-5 text-amber-100">
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
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-neutral-500">7 delpoeng</p>
          <ul className="space-y-1.5">
            {DELPOENG_LISTE.map((d) => {
              const p = maaling.delpoeng[d.id]
              const bredde = Math.max(4, Math.min(100, Math.round(p * 10)))
              const barFarge =
                p >= 8 ? "bg-lime-400" : p >= 6 ? "bg-cyan-400" : p >= 4.5 ? "bg-amber-300" : "bg-rose-400"
              return (
                <li key={d.id} className="space-y-0.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-neutral-700">{d.navn}</span>
                    <span className="font-mono font-semibold tabular-nums text-neutral-950">{formaterMoggernPoeng(p)}</span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                    <div className={`h-full rounded-full transition-all duration-700 ${barFarge}`} style={{ width: `${bredde}%` }} />
                  </div>
                </li>
              )
            })}
          </ul>
        </div>
      ) : null}

      {tipsOgDiss ? (
        <div className="mt-auto space-y-3 border-t border-white/10 pt-3">
          <div className="rounded-2xl border border-rose-400/25 bg-rose-500/10 p-3.5">
            <p className="flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-rose-300">
              <Flame className="h-3.5 w-3.5" aria-hidden="true" />
              {tipsOgDiss.dissFraLys ? "Dagens lys-diss" : "Dagens diss"}
            </p>
            <p className="mt-1.5 text-sm leading-5 font-medium text-neutral-950">«{tipsOgDiss.diss}»</p>
          </div>

          <div className="rounded-2xl bg-black/20 p-3.5">
            <p className="flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-lime-400">
              <Lightbulb className="h-3.5 w-3.5" aria-hidden="true" />
              Slik mogger du mer
            </p>
            <ul className="mt-2 space-y-1.5 text-xs leading-5 text-neutral-700">
              {tipsOgDiss.tips.map((t, i) => (
                <li key={i} className="flex gap-2">
                  <span className="font-mono text-lime-400">•</span>
                  <span>{t}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : null}
    </Kort>
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
      <Kort className="mel-inn border-lime-400/30 bg-[radial-gradient(ellipse_at_top,rgb(163_230_53/0.14),transparent_65%),var(--spill-flate)] p-6 text-center">
        <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-lime-400">Resultat · Runde {runde + 1}</p>
        <h2 className="mt-2 font-[family-name:var(--font-visning)] text-2xl font-extrabold tracking-tight text-neutral-950 sm:text-4xl">
          {hovedLinje}
        </h2>
        <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
          {erVert ? (
            <Knapp onClick={onOmkamp} className="!bg-lime-400 !font-bold !text-neutral-950 hover:!bg-lime-300">
              <RotateCcw className="h-4 w-4" aria-hidden="true" />
              Omkamp
            </Knapp>
          ) : (
            <span className="rounded-full border border-white/10 bg-black/25 px-4 py-2 text-xs text-neutral-600">
              Venter på at verten starter omkamp …
            </span>
          )}
          <DelKnapp tekst={deleTekst} />
        </div>
      </Kort>

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

      <p className="text-center font-mono text-[11px] leading-5 text-neutral-500">{ANSVARSFRASKRIVELSE_PAAMINNELSE}</p>
    </section>
  )
}

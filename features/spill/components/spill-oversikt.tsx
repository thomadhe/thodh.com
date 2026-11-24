"use client"

import { CalendarDays, ChevronDown, ChevronLeft, ChevronRight, FolderOpen } from "lucide-react"
import Link from "next/link"
import { useState } from "react"
import { useSprak, useT } from "@/lib/sprak"
import { dagNummer, formaterDato, iDagOslo, leggTilDager, START_DATO } from "../lib/dag"
import { useAlleResultater, type Resultat } from "../lib/lagring"
import { erHovedSpill, HOVED_SPILL_IDER, quizer, spill, spillTekst, type Spill } from "../lib/spill"
import { illustrasjoner } from "./illustrasjoner"
import { Kalender } from "./kalender"

function rekke(resultater: Record<string, Resultat>, iDag: string) {
  let n = 0
  const iDagFerdig = resultater[iDag] && resultater[iDag].status !== "pagar"
  for (let d = iDagFerdig ? iDag : leggTilDager(iDag, -1); d >= START_DATO; d = leggTilDager(d, -1)) {
    const r = resultater[d]
    if (!r || r.status === "pagar") break
    n++
  }
  return n
}

function Flis({ s, dato, iDag, resultater }: { s: Spill; dato: string; iDag: string; resultater: Record<string, Resultat> }) {
  const sprak = useSprak()
  const t = useT()
  const tekst = spillTekst(s, sprak)
  const valgt = resultater[dato]
  const dager = rekke(resultater, iDag)
  const Illustrasjon = illustrasjoner[s.id]
  const status = !valgt
    ? null
    : valgt.status === "pagar"
      ? { tekst: t("Påbegynt", "In progress"), stil: "bg-amber-300 text-neutral-950" }
      : { tekst: valgt.etikett ?? t("Ferdig", "Done"), stil: valgt.status === "tapt" ? "bg-rose-500 text-white" : "bg-emerald-400 text-neutral-950" }

  return (
    <Link
      href={dato === iDag ? s.href : `${s.href}?dato=${dato}`}
      className="group relative flex min-h-40 flex-col items-center gap-5 rounded-2xl bg-[#2b2d31] px-5 pt-6 pb-7 shadow-[0_2px_0_rgba(0,0,0,0.35)] transition duration-200 hover:-translate-y-0.5 hover:bg-[#33363b] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:min-h-52"
    >
      <h2 className="font-[family-name:var(--font-visning)] text-[1.7rem] leading-none font-extrabold tracking-[-0.04em] text-neutral-50 sm:text-[1.9rem]">
        {tekst.navn}
      </h2>
      <div className="flex flex-1 items-center justify-center transition duration-200 group-hover:scale-[1.04]">
        <Illustrasjon />
      </div>
      {sprak === "en" && s.norskInnhold ? (
        <span className="absolute top-3 left-3 rounded-full border border-white/10 bg-black/30 px-2 py-0.5 font-mono text-[9px] font-medium text-neutral-400">
          🇳🇴 NO
        </span>
      ) : null}
      {status || dager > 1 ? (
        <div className="absolute top-3 right-3 flex flex-col items-end gap-1">
          {status ? (
            <span className={`rounded-full px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider ${status.stil}`}>
              {status.tekst}
            </span>
          ) : null}
          {dager > 1 ? <span className="font-mono text-[10px] text-neutral-400">🔥 {dager}</span> : null}
        </div>
      ) : null}
      <span className="sr-only">{tekst.kort}</span>
    </Link>
  )
}

export function SpillOversikt({ dato }: { dato: string }) {
  const sprak = useSprak()
  const t = useT()
  const iDag = iDagOslo()
  const alle = useAlleResultater()
  const [visKalender, setVisKalender] = useState(false)
  const [visFlere, setVisFlere] = useState(false)
  const erIDag = dato === iDag
  const lenke = (d: string) => (d === iDag ? "/spill" : `/spill?dato=${d}`)
  const pil = "flex h-10 w-10 items-center justify-center rounded-full border border-white/10 text-neutral-300 transition hover:bg-white/10"

  const synlige = spill.filter((s) => !s.start || dato >= s.start)
  const hovedSpill = synlige.filter((s) => erHovedSpill(s.id))
  const arkivSpill = synlige.filter((s) => !erHovedSpill(s.id))

  return (
    <>
      <div className="flex items-center justify-center gap-2">
        {dato > START_DATO ? (
          <Link href={lenke(leggTilDager(dato, -1))} className={pil} aria-label={t("Forrige dag", "Previous day")}>
            <ChevronLeft className="h-4 w-4" />
          </Link>
        ) : (
          <span className="h-10 w-10" />
        )}
        <button
          type="button"
          onClick={() => setVisKalender((v) => !v)}
          aria-expanded={visKalender}
          className="flex h-10 items-center gap-2 rounded-full border border-white/10 px-4 text-sm text-neutral-200 transition hover:bg-white/10"
        >
          <CalendarDays className="h-4 w-4 text-neutral-400" />
          <span className="first-letter:uppercase">{formaterDato(dato, "lang", sprak)}</span>
          <span className="font-mono text-[10px] uppercase tracking-widest text-neutral-500">
            #{dagNummer(dato) + 1}
          </span>
        </button>
        {!erIDag ? (
          <Link href={lenke(leggTilDager(dato, 1))} className={pil} aria-label={t("Neste dag", "Next day")}>
            <ChevronRight className="h-4 w-4" />
          </Link>
        ) : (
          <span className="h-10 w-10" />
        )}
      </div>
      {!erIDag ? (
        <p className="-mt-3 text-center">
          <Link href="/spill" className="font-mono text-[11px] uppercase tracking-widest text-neutral-400 underline-offset-4 hover:text-white hover:underline">
            {t("Til dagens spill →", "Go to today's games →")}
          </Link>
        </p>
      ) : null}

      {visKalender ? (
        <section className="mx-auto w-full max-w-sm rounded-2xl bg-white p-5 text-neutral-900 shadow-xl">
          <p className="mb-3 font-mono text-[11px] font-medium uppercase tracking-[0.22em] text-neutral-400">
            {t("Spill tidligere dager", "Play previous days")}
          </p>
          <Kalender spillIder={[...HOVED_SPILL_IDER]} href="/spill" valgt={dato} />
        </section>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        {hovedSpill.map((s) => (
          <Flis key={s.id} s={s} dato={dato} iDag={iDag} resultater={alle[s.id] ?? {}} />
        ))}
      </div>

      <section className="flex flex-col gap-4 pt-2">
        <button
          type="button"
          onClick={() => setVisFlere((v) => !v)}
          aria-expanded={visFlere}
          className="mx-auto inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-medium text-neutral-300 transition hover:border-white/20 hover:bg-white/[0.08] hover:text-white"
        >
          <FolderOpen className="h-3.5 w-3.5 text-neutral-400" aria-hidden="true" />
          <span>
            {t("Flere spill", "More games")} ({arkivSpill.length + quizer.length})
          </span>
          <ChevronDown className={`h-3.5 w-3.5 transition-transform ${visFlere ? "rotate-180" : ""}`} aria-hidden="true" />
        </button>

        {visFlere ? (
          <div className="flex flex-col gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              {arkivSpill.map((s) => (
                <Flis key={s.id} s={s} dato={dato} iDag={iDag} resultater={alle[s.id] ?? {}} />
              ))}
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {quizer.map((q) => {
                const tekst = spillTekst(q, sprak)
                return (
                  <Link
                    key={q.id}
                    href={q.href}
                    className="flex items-center justify-between gap-3 rounded-2xl border border-white/[0.07] bg-[#26282c] px-5 py-4 transition hover:border-white/20 hover:bg-[#2f3237]"
                  >
                    <div>
                      <p className="text-sm font-semibold text-neutral-100">{tekst.navn}</p>
                      <p className="mt-0.5 text-xs text-neutral-400">{tekst.kort}</p>
                    </div>
                    <span className="font-mono text-xs text-neutral-400">→</span>
                  </Link>
                )
              })}
            </div>
          </div>
        ) : null}
      </section>
    </>
  )
}

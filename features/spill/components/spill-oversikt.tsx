"use client"

import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react"
import Link from "next/link"
import { useState } from "react"
import { dagNummer, formaterDato, iDagOslo, leggTilDager, START_DATO } from "../lib/dag"
import { useAlleResultater, type Resultat } from "../lib/lagring"
import { spill, type Spill } from "../lib/spill"
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
  const valgt = resultater[dato]
  const dager = rekke(resultater, iDag)
  const Illustrasjon = illustrasjoner[s.id]
  const status = !valgt
    ? null
    : valgt.status === "pagar"
      ? { tekst: "Påbegynt", stil: "bg-amber-300 text-neutral-950" }
      : { tekst: valgt.etikett ?? "Ferdig", stil: valgt.status === "tapt" ? "bg-rose-500 text-white" : "bg-emerald-400 text-neutral-950" }

  return (
    <Link
      href={dato === iDag ? s.href : `${s.href}?dato=${dato}`}
      className="group relative flex min-h-40 flex-col items-center gap-5 rounded-2xl bg-[#2b2d31] px-5 pt-6 pb-7 shadow-[0_2px_0_rgba(0,0,0,0.35)] transition duration-200 hover:-translate-y-0.5 hover:bg-[#33363b] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:min-h-52"
    >
      <h2 className="font-[family-name:var(--font-visning)] text-[1.7rem] leading-none font-extrabold tracking-[-0.04em] text-neutral-50 sm:text-[1.9rem]">
        {s.navn}
      </h2>
      <div className="flex flex-1 items-center justify-center transition duration-200 group-hover:scale-[1.04]">
        <Illustrasjon />
      </div>
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
      <span className="sr-only">{s.kort}</span>
    </Link>
  )
}

export function SpillOversikt({ dato }: { dato: string }) {
  const iDag = iDagOslo()
  const alle = useAlleResultater()
  const [visKalender, setVisKalender] = useState(false)
  const erIDag = dato === iDag
  const lenke = (d: string) => (d === iDag ? "/spill" : `/spill?dato=${d}`)
  const pil = "flex h-10 w-10 items-center justify-center rounded-full border border-white/10 text-neutral-300 transition hover:bg-white/10"

  return (
    <>
      <div className="flex items-center justify-center gap-2">
        {dato > START_DATO ? (
          <Link href={lenke(leggTilDager(dato, -1))} className={pil} aria-label="Forrige dag">
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
          <span className="first-letter:uppercase">{formaterDato(dato)}</span>
          <span className="font-mono text-[10px] uppercase tracking-widest text-neutral-500">
            #{dagNummer(dato) + 1}
          </span>
        </button>
        {!erIDag ? (
          <Link href={lenke(leggTilDager(dato, 1))} className={pil} aria-label="Neste dag">
            <ChevronRight className="h-4 w-4" />
          </Link>
        ) : (
          <span className="h-10 w-10" />
        )}
      </div>
      {!erIDag ? (
        <p className="-mt-3 text-center">
          <Link href="/spill" className="font-mono text-[11px] uppercase tracking-widest text-neutral-400 underline-offset-4 hover:text-white hover:underline">
            Til dagens spill →
          </Link>
        </p>
      ) : null}

      {visKalender ? (
        <section className="mx-auto w-full max-w-sm rounded-2xl bg-white p-5 text-neutral-900 shadow-xl">
          <p className="mb-3 font-mono text-[11px] font-medium uppercase tracking-[0.22em] text-neutral-400">Spill tidligere dager</p>
          <Kalender spillIder={spill.map((s) => s.id)} href="/spill" valgt={dato} />
        </section>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        {spill.map((s) => (
          <Flis key={s.id} s={s} dato={dato} iDag={iDag} resultater={alle[s.id] ?? {}} />
        ))}
      </div>
    </>
  )
}

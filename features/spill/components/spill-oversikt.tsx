"use client"

import Link from "next/link"
import { dagNummer, formaterDato, iDagOslo, leggTilDager, START_DATO } from "../lib/dag"
import { useAlleResultater, type Resultat } from "../lib/lagring"
import { spill, type Spill } from "../lib/spill"
import { Kalender } from "./kalender"

function Rad({
  s,
  dato,
  iDag,
  resultater,
}: {
  s: Spill
  dato: string
  iDag: string
  resultater: Record<string, Resultat>
}) {
  const valgt = resultater[dato]
  let rekke = 0
  const iDagFerdig = resultater[iDag] && resultater[iDag].status !== "pagar"
  for (let d = iDagFerdig ? iDag : leggTilDager(iDag, -1); d >= START_DATO; d = leggTilDager(d, -1)) {
    const r = resultater[d]
    if (!r || r.status === "pagar") break
    rekke++
  }
  const status = !valgt
    ? { tekst: "Ikke spilt", stil: "bg-neutral-100 text-neutral-500" }
    : valgt.status === "pagar"
      ? { tekst: "Påbegynt", stil: "bg-amber-50 text-amber-700" }
      : {
          tekst: valgt.etikett ?? "Ferdig",
          stil: valgt.status === "tapt" ? "bg-rose-50 text-rose-700" : "bg-emerald-50 text-emerald-700",
        }

  return (
    <Link
      href={dato === iDag ? s.href : `${s.href}?dato=${dato}`}
      className="group flex items-center gap-4 p-5 transition-colors hover:bg-neutral-50 sm:p-6"
    >
      <span
        aria-hidden="true"
        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-xl font-semibold transition group-hover:scale-105 ${s.farge}`}
      >
        {s.ikon}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <h2 className="text-[15px] font-semibold tracking-tight text-neutral-950">{s.navn}</h2>
          <span className={`rounded-full px-2 py-0.5 font-mono text-[10px] font-medium uppercase tracking-wider ${status.stil}`}>
            {status.tekst}
          </span>
        </div>
        <p className="mt-1 text-sm leading-6 text-neutral-500">{s.kort}</p>
        {rekke > 1 ? <p className="mt-1 font-mono text-[10px] text-neutral-400">{rekke} dager på rad</p> : null}
      </div>
      <span aria-hidden="true" className="text-neutral-300 transition group-hover:translate-x-0.5 group-hover:text-neutral-500">
        →
      </span>
    </Link>
  )
}

export function SpillOversikt({ dato }: { dato: string }) {
  const iDag = iDagOslo()
  const alle = useAlleResultater()
  const erIDag = dato === iDag
  const lenke = (d: string) => (d === iDag ? "/spill" : `/spill?dato=${d}`)

  return (
    <>
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-neutral-400">
            Dag {dagNummer(dato) + 1}
            {erIDag ? " · i dag" : " · arkiv"}
          </p>
          <p className="mt-1 text-lg font-semibold first-letter:uppercase tracking-tight text-neutral-950">
            {formaterDato(dato)}
          </p>
        </div>
        <nav className="flex items-center gap-1" aria-label="Bytt dag">
          {dato > START_DATO ? (
            <Link
              href={lenke(leggTilDager(dato, -1))}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-black/5 bg-white text-neutral-600 transition hover:bg-neutral-50"
              aria-label="Forrige dag"
            >
              ‹
            </Link>
          ) : null}
          {!erIDag ? (
            <>
              <Link
                href={lenke(leggTilDager(dato, 1))}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-black/5 bg-white text-neutral-600 transition hover:bg-neutral-50"
                aria-label="Neste dag"
              >
                ›
              </Link>
              <Link
                href="/spill"
                className="ml-1 rounded-full bg-neutral-950 px-3 py-2 font-mono text-[10px] uppercase tracking-widest text-white"
              >
                I dag
              </Link>
            </>
          ) : null}
        </nav>
      </div>

      <div className="overflow-hidden rounded-3xl border border-black/5 bg-white">
        {spill.map((s, i) => (
          <div key={s.id}>
            {i > 0 ? <div className="h-px bg-black/5" /> : null}
            <Rad s={s} dato={dato} iDag={iDag} resultater={alle[s.id] ?? {}} />
          </div>
        ))}
      </div>

      <section className="rounded-3xl border border-black/5 bg-white p-5 sm:p-6">
        <p className="font-mono text-[11px] font-medium uppercase tracking-[0.22em] text-neutral-400">Kalender</p>
        <h2 className="mt-2 mb-4 text-xl font-semibold tracking-tight text-neutral-950">Spill tidligere dager</h2>
        <Kalender spillIder={spill.map((s) => s.id)} href="/spill" valgt={dato} />
      </section>
    </>
  )
}

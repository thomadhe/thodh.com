"use client"

import Link from "next/link"
import { useState } from "react"
import { START_DATO, iDagOslo } from "../lib/dag"
import { useAlleResultater, type Resultat } from "../lib/lagring"
import { spill, type SpillId } from "../lib/spill"

const UKEDAGER = ["Ma", "Ti", "On", "To", "Fr", "Lø", "Sø"]

function maanedNavn(aar: number, maaned: number) {
  return new Intl.DateTimeFormat("nb-NO", { month: "long", year: "numeric", timeZone: "UTC" }).format(
    new Date(Date.UTC(aar, maaned, 1)),
  )
}

const stil: Record<Resultat["status"], string> = {
  vunnet: "bg-emerald-500 text-white hover:bg-emerald-600",
  tapt: "bg-rose-500 text-white hover:bg-rose-600",
  ferdig: "bg-neutral-900 text-white hover:bg-neutral-700",
  pagar: "bg-amber-100 text-amber-900 ring-1 ring-inset ring-amber-300 hover:bg-amber-200",
}

const prikk: Record<Resultat["status"], string> = {
  vunnet: "bg-emerald-500",
  tapt: "bg-rose-500",
  ferdig: "bg-neutral-900",
  pagar: "bg-amber-400",
}

/**
 * Month calendar of playable days. With one game each day is coloured by its result;
 * with several games (the /spill hub) each day shows one dot per game.
 */
export function Kalender({ spillIder, href, valgt }: { spillIder: SpillId[]; href: string; valgt: string }) {
  const alle = useAlleResultater()
  const enkelt = spillIder.length === 1
  const iDag = iDagOslo()
  const [aar, setAar] = useState(() => Number(valgt.slice(0, 4)))
  const [maaned, setMaaned] = useState(() => Number(valgt.slice(5, 7)) - 1)

  const forste = START_DATO.slice(0, 7)
  const sist = iDag.slice(0, 7)
  const denne = `${aar}-${String(maaned + 1).padStart(2, "0")}`
  const flytt = (steg: number) => {
    const d = new Date(Date.UTC(aar, maaned + steg, 1))
    setAar(d.getUTCFullYear())
    setMaaned(d.getUTCMonth())
  }

  const dagerIMaaned = new Date(Date.UTC(aar, maaned + 1, 0)).getUTCDate()
  const forskyvning = (new Date(Date.UTC(aar, maaned, 1)).getUTCDay() + 6) % 7
  const celler = [...Array(forskyvning).fill(null), ...Array.from({ length: dagerIMaaned }, (_, i) => i + 1)]

  const ferdigeSpill = (dato: string) => spillIder.filter((id) => {
    const r = alle[id]?.[dato]
    return r && r.status !== "pagar"
  }).length
  const spilte = spillIder.reduce(
    (sum, id) => sum + Object.values(alle[id] ?? {}).filter((r) => r.status !== "pagar").length,
    0,
  )

  return (
    <div>
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => flytt(-1)}
          disabled={denne <= forste}
          className="flex h-8 w-8 items-center justify-center rounded-full text-neutral-500 transition hover:bg-neutral-100 disabled:opacity-30"
          aria-label="Forrige måned"
        >
          ‹
        </button>
        <p className="text-sm font-semibold capitalize tracking-tight text-neutral-900">{maanedNavn(aar, maaned)}</p>
        <button
          type="button"
          onClick={() => flytt(1)}
          disabled={denne >= sist}
          className="flex h-8 w-8 items-center justify-center rounded-full text-neutral-500 transition hover:bg-neutral-100 disabled:opacity-30"
          aria-label="Neste måned"
        >
          ›
        </button>
      </div>

      <div className="mt-3 grid grid-cols-7 gap-1.5 text-center">
        {UKEDAGER.map((d) => (
          <span key={d} className="font-mono text-[10px] uppercase tracking-wider text-neutral-400">
            {d}
          </span>
        ))}
        {celler.map((dag, i) => {
          if (dag === null) return <span key={`tom-${i}`} />
          const dato = `${denne}-${String(dag).padStart(2, "0")}`
          const resultat = enkelt ? alle[spillIder[0]]?.[dato] : undefined
          const spillbar = dato >= START_DATO && dato <= iDag
          const erValgt = dato === valgt
          const ring = erValgt ? "outline-2 outline-offset-2 outline-neutral-900" : ""
          if (!spillbar) {
            return (
              <span key={dato} className="flex aspect-square items-center justify-center rounded-xl text-xs text-neutral-300">
                {dag}
              </span>
            )
          }
          const alleFerdige = !enkelt && ferdigeSpill(dato) === spillIder.length
          const bakgrunn = resultat
            ? stil[resultat.status]
            : alleFerdige
              ? "bg-emerald-50 text-emerald-900 hover:bg-emerald-100"
              : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200"
          return (
            <Link
              key={dato}
              href={dato === iDag ? href : `${href}?dato=${dato}`}
              title={resultat?.etikett}
              aria-label={
                enkelt
                  ? `${dag}. ${resultat?.etikett ?? "Ikke spilt"}`
                  : `${dag}. ${ferdigeSpill(dato)} av ${spillIder.length} spill ferdig`
              }
              aria-current={erValgt ? "date" : undefined}
              className={`relative flex aspect-square items-center justify-center rounded-xl text-xs font-medium transition ${ring} ${bakgrunn}`}
            >
              <span className={enkelt ? "" : "-translate-y-1"}>{dag}</span>
              {enkelt ? (
                dato === iDag ? <span className="absolute bottom-1 h-1 w-1 rounded-full bg-current opacity-70" /> : null
              ) : (
                <span className="absolute bottom-1.5 flex gap-0.5">
                  {spillIder.map((id) => {
                    const r = alle[id]?.[dato]
                    return <span key={id} className={`h-1 w-1 rounded-full ${r ? prikk[r.status] : "bg-black/15"}`} />
                  })}
                </span>
              )}
            </Link>
          )
        })}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 font-mono text-[10px] uppercase tracking-wider text-neutral-400">
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-emerald-500" /> Klart
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-rose-500" /> Bom
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-neutral-900" /> Ferdig
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-amber-300" /> Påbegynt
        </span>
        <span className="ml-auto">{spilte} spilt</span>
      </div>
      {!enkelt ? (
        <p className="mt-2 font-mono text-[10px] leading-4 text-neutral-400">
          Prikkene viser {spill.filter((s) => spillIder.includes(s.id)).map((s) => s.navn).join(", ")} – i den
          rekkefølgen.
        </p>
      ) : null}
    </div>
  )
}

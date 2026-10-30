"use client"

import { useState } from "react"
import { formaterDato } from "../lib/dag"
import type { Omrade as Land } from "../lib/geografi"
import { omrader } from "../lib/geografi"
import { avstand, landEtterId, naerhet, omrissNokkel } from "../lib/geografi-svar"
import { useDagligTilstand, type Resultat } from "../lib/lagring"
import { lyder } from "../lib/lyd"
import { delRad, GjetningsRad, LandVelger, styrke } from "./land-gjetting"
import { OmrissBonus } from "./omriss-bonus"
import { DelKnapp, Kort } from "./spill-ramme"

const FORSOK = 6

/** Marks an outline that is a territory rather than a state, so nobody looks among the countries only. */
export function TerritoriumMerke() {
  return (
    <span className="absolute top-3 left-3 rounded-full bg-amber-100 px-2.5 py-1 font-mono text-[11px] text-amber-900" title="Ikke et selvstendig land">
      Territorium
    </span>
  )
}

/** "Danmark" for Greenland: the state a territory belongs to, if any. */
export const tilhorerNavn = (o: Land) => (o.tilhorer ? landEtterId.get(o.tilhorer)?.navn : undefined)

type Tilstand = { v: 1; gjetninger: string[]; resultat: Resultat }
const tom = (): Tilstand => ({ v: 1, gjetninger: [], resultat: { status: "pagar" } })

export function Omriss({ dato, form, nokkel }: { dato: string; form: string; nokkel: string }) {
  const { verdi, lastet, oppdater } = useDagligTilstand<Tilstand>("omriss", dato, tom)
  const [melding, setMelding] = useState<string | null>(null)

  const fasit = omrader.find((l) => omrissNokkel(l.id, dato) === nokkel)!
  const gjettet = verdi.gjetninger.map((id) => landEtterId.get(id)!).filter(Boolean)
  const ferdig = verdi.resultat.status !== "pagar"

  const gjett = (l: Land) => {
    if (ferdig) return
    if (verdi.gjetninger.includes(l.id)) {
      setMelding(`Du har allerede gjettet ${l.navn}.`)
      return
    }
    setMelding(null)
    if (l.id === fasit.id) lyder.seier()
    else if (verdi.gjetninger.length + 1 >= FORSOK) lyder.feil()
    else lyder.naer(styrke(naerhet(avstand(l, fasit))))
    oppdater((t) => {
      if (t.resultat.status !== "pagar" || t.gjetninger.includes(l.id)) return t
      const gjetninger = [...t.gjetninger, l.id]
      const n = gjetninger.length
      if (l.id === fasit.id) return { ...t, gjetninger, resultat: { status: "vunnet", etikett: `${n}/${FORSOK}`, poeng: FORSOK + 1 - n } }
      if (n >= FORSOK) return { ...t, gjetninger, resultat: { status: "tapt", etikett: `X/${FORSOK}`, poeng: 0 } }
      return { ...t, gjetninger }
    })
  }

  if (!lastet) return <div className="h-96 animate-pulse rounded-3xl bg-white/5" />

  const delTekst = [
    `Omriss · ${formaterDato(dato, "kort")} · ${verdi.resultat.status === "vunnet" ? gjettet.length : "X"}/${FORSOK}`,
    ...gjettet.map((g) => delRad(g, fasit)),
    "thodh.com/spill/omriss",
  ].join("\n")

  return (
    <div className="flex flex-col gap-4">
      <Kort className="relative flex items-center justify-center p-6">
        <svg viewBox="0 0 200 200" className="h-56 w-56 sm:h-64 sm:w-64" role="img" aria-label="Omrisset av dagens land">
          <path d={form} className="fill-sky-400" />
        </svg>
        {fasit.suveren ? null : <TerritoriumMerke />}
      </Kort>

      {ferdig ? (
        <Kort className="px-6 py-6 text-center">
          <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-neutral-400">
            {verdi.resultat.status === "vunnet" ? "Riktig!" : "Det var"}
          </p>
          <p className="mt-1 text-3xl font-semibold tracking-tight text-neutral-950">{fasit.navn}</p>
          <p className="mt-1 text-sm text-neutral-500">
            Hovedstad: {fasit.hovedstad}
            {tilhorerNavn(fasit) ? ` · tilhører ${tilhorerNavn(fasit)}` : ""}
          </p>
          <div className="mt-5 flex justify-center">
            <DelKnapp tekst={delTekst} />
          </div>
        </Kort>
      ) : (
        <LandVelger id="omriss-forslag" utelat={verdi.gjetninger} onVelg={gjett} />
      )}

      {melding ? (
        <p className="px-1 font-mono text-[11px] text-neutral-500" role="status">
          {melding}
        </p>
      ) : null}

      <ul className="flex flex-col gap-1.5">
        {gjettet.map((g) => (
          <GjetningsRad key={g.id} gjett={g} fasit={fasit} />
        ))}
        {!ferdig
          ? Array.from({ length: FORSOK - gjettet.length }, (_, i) => (
              <li key={i} className="h-11 rounded-xl border border-dashed border-neutral-200" />
            ))
          : null}
      </ul>

      {ferdig ? <OmrissBonus fasit={fasit} dato={dato} /> : null}
    </div>
  )
}

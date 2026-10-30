"use client"

import { useState } from "react"
import { formaterDato, stokk } from "../lib/dag"
import type { Omrade as Land } from "../lib/geografi"
import { omrader } from "../lib/geografi"
import { avstand, landEtterId, naerhet, skjultNokkel } from "../lib/geografi-svar"
import { useDagligTilstand, type Resultat } from "../lib/lagring"
import { lyder } from "../lib/lyd"
import { delRad, GjetningsRad, LandVelger, styrke } from "./land-gjetting"
import { DelKnapp, Kort } from "./spill-ramme"

// Canvas: a flag hidden under 24 tiles (6 × 4). Tiles open in a random order that is the same for
// everyone that day, more of them after each wrong guess, and about a quarter is still hidden before
// the sixth and last guess.

const KOLONNER = 6
const RADER = 4
const RUTER = KOLONNER * RADER
const FORSOK = 6
/** Tiles visible before guess 1, 2, … 6: the first guess is blind, then +1, +1, +1, +2, +3 (0, 1, 2, 3, 5, 8). */
const SYNLIGE = [0, 1, 2, 3, 5, 8]

// v2: 24 tiles that open by themselves; v1 saves (12 tiles you picked) start fresh.
type Tilstand = { v: 2; gjetninger: string[]; resultat: Resultat }
const tom = (): Tilstand => ({ v: 2, gjetninger: [], resultat: { status: "pagar" } })

export function Canvas({ dato, nokkel }: { dato: string; nokkel: string }) {
  const { verdi, lastet, oppdater } = useDagligTilstand<Tilstand>("canvas", dato, tom)
  const [lastetBilde, setLastetBilde] = useState(false)

  const fasit = omrader.find((l) => skjultNokkel("canvas", l.id, dato) === nokkel)!
  const gjettet = verdi.gjetninger.map((id) => landEtterId.get(id)!).filter(Boolean)
  const ferdig = verdi.resultat.status !== "pagar"
  const rekkefolge = stokk(
    Array.from({ length: RUTER }, (_, i) => i),
    `canvas:${dato}`,
  )
  const antallApne = ferdig ? RUTER : SYNLIGE[Math.min(gjettet.length, FORSOK - 1)]
  const apne = new Set(rekkefolge.slice(0, antallApne))

  const gjett = (l: Land) => {
    if (ferdig || verdi.gjetninger.includes(l.id)) return
    const riktig = l.id === fasit.id
    if (riktig) lyder.seier()
    else if (verdi.gjetninger.length + 1 >= FORSOK) lyder.feil()
    else lyder.naer(styrke(naerhet(avstand(l, fasit))))
    oppdater((t) => {
      if (t.resultat.status !== "pagar" || t.gjetninger.includes(l.id)) return t
      const gjetninger = [...t.gjetninger, l.id]
      const n = gjetninger.length
      if (riktig) return { ...t, gjetninger, resultat: { status: "vunnet", etikett: `${n}/${FORSOK}`, poeng: FORSOK + 1 - n } }
      if (n >= FORSOK) return { ...t, gjetninger, resultat: { status: "tapt", etikett: `X/${FORSOK}`, poeng: 0 } }
      return { ...t, gjetninger }
    })
  }

  if (!lastet) return <div className="h-96 animate-pulse rounded-3xl bg-white/5" />

  const delTekst = [
    `Canvas · ${formaterDato(dato, "kort")} · ${verdi.resultat.status === "vunnet" ? gjettet.length : "X"}/${FORSOK}`,
    ...gjettet.map((g) => delRad(g, fasit)),
    "thodh.com/spill/canvas",
  ].join("\n")

  return (
    <div className="flex flex-col gap-4">
      <Kort className="p-4">
        <div className={`relative overflow-hidden rounded-xl bg-neutral-200 ${lastetBilde ? "" : "aspect-[3/2]"}`}>
          {/* eslint-disable-next-line @next/next/no-img-element -- an SVG flag from our own route, sized by CSS */}
          <img
            src={`/spill/api/flagg?dato=${dato}`}
            alt={ferdig ? `Flagget til ${fasit.navn}` : "Skjult flagg"}
            onLoad={() => setLastetBilde(true)}
            className={`block w-full ${lastetBilde ? "" : "absolute inset-0 h-full object-cover"}`}
          />
          <div className="absolute inset-0 grid grid-cols-6 grid-rows-4" aria-hidden="true">
            {Array.from({ length: RUTER }, (_, i) => (
              // A border in the card colour separates the tiles without leaving gaps to peek through.
              <span
                key={i}
                className={`border border-[var(--spill-flate)] bg-neutral-300 transition-opacity duration-700 ${apne.has(i) ? "opacity-0" : ""}`}
              />
            ))}
          </div>
        </div>
        <p className="mt-3 text-center font-mono text-[11px] text-neutral-500" role="status">
          {ferdig
            ? verdi.resultat.status === "vunnet"
              ? `Klart med ${RUTER - SYNLIGE[gjettet.length - 1]} ruter fortsatt skjult`
              : "Hele flagget"
            : `Forsøk ${gjettet.length + 1} av ${FORSOK} · ${antallApne} av ${RUTER} ruter åpne`}
        </p>
      </Kort>

      {ferdig ? (
        <Kort className="px-6 py-6 text-center">
          <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-neutral-400">
            {verdi.resultat.status === "vunnet" ? "Riktig!" : "Det var"}
          </p>
          <p className="mt-1 text-3xl font-semibold tracking-tight text-neutral-950">{fasit.navn}</p>
          <p className="mt-1 text-sm text-neutral-500">Hovedstad: {fasit.hovedstad}</p>
          <div className="mt-5 flex justify-center">
            <DelKnapp tekst={delTekst} />
          </div>
        </Kort>
      ) : (
        <LandVelger id="canvas-forslag" utelat={verdi.gjetninger} onVelg={gjett} />
      )}

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
    </div>
  )
}

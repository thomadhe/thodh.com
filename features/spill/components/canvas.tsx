"use client"

import { useState } from "react"
import { formaterDato } from "../lib/dag"
import type { Land } from "../lib/geografi"
import { land } from "../lib/geografi"
import { avstand, landEtterId, naerhet, skjultNokkel } from "../lib/geografi-svar"
import { useDagligTilstand, type Resultat } from "../lib/lagring"
import { lyder } from "../lib/lyd"
import { GjetningsRad, LandVelger, styrke } from "./land-gjetting"
import { DelKnapp, Kort } from "./spill-ramme"

// Canvas: a flag hidden under 12 tiles (4 × 3). Open one tile, guess the country; every wrong guess
// lets you open one more. Fewer tiles is a better score.

const KOLONNER = 4
const RADER = 3
const RUTER = KOLONNER * RADER

type Tilstand = { v: 1; apne: number[]; gjetninger: string[]; resultat: Resultat }
const tom = (): Tilstand => ({ v: 1, apne: [], gjetninger: [], resultat: { status: "pagar" } })

export function Canvas({ dato, nokkel }: { dato: string; nokkel: string }) {
  const { verdi, lastet, oppdater } = useDagligTilstand<Tilstand>("canvas", dato, tom)
  const [lastetBilde, setLastetBilde] = useState(false)

  const fasit = land.find((l) => skjultNokkel("canvas", l.id, dato) === nokkel)!
  const gjettet = verdi.gjetninger.map((id) => landEtterId.get(id)!).filter(Boolean)
  const ferdig = verdi.resultat.status !== "pagar"
  // You open a tile, then guess; a wrong guess earns the next tile.
  const kanApne = !ferdig && verdi.apne.length === verdi.gjetninger.length && verdi.apne.length < RUTER
  const kanGjette = !ferdig && verdi.apne.length > verdi.gjetninger.length

  const apne = (i: number) => {
    if (!kanApne || verdi.apne.includes(i)) return
    lyder.velg()
    oppdater((t) => (t.apne.includes(i) || t.apne.length !== t.gjetninger.length ? t : { ...t, apne: [...t.apne, i] }))
  }

  const gjett = (l: Land) => {
    if (!kanGjette || verdi.gjetninger.includes(l.id)) return
    const riktig = l.id === fasit.id
    const siste = !riktig && verdi.apne.length >= RUTER
    if (riktig) lyder.seier()
    else if (siste) lyder.feil()
    else lyder.naer(styrke(naerhet(avstand(l, fasit))))
    oppdater((t) => {
      if (t.resultat.status !== "pagar" || t.gjetninger.includes(l.id)) return t
      const gjetninger = [...t.gjetninger, l.id]
      const n = t.apne.length
      if (riktig) return { ...t, gjetninger, resultat: { status: "vunnet", etikett: `${n}/${RUTER} ruter`, poeng: RUTER + 1 - n } }
      if (n >= RUTER) return { ...t, gjetninger, resultat: { status: "tapt", etikett: `X/${RUTER}`, poeng: 0 } }
      return { ...t, gjetninger }
    })
  }

  if (!lastet) return <div className="h-96 animate-pulse rounded-3xl bg-white/5" />

  const apneSett = new Set(verdi.apne)
  const delTekst = [
    `Canvas · ${formaterDato(dato, "kort")} · ${verdi.resultat.status === "vunnet" ? verdi.apne.length : "X"}/${RUTER}`,
    ...Array.from({ length: RADER }, (_, r) =>
      Array.from({ length: KOLONNER }, (_, k) => (apneSett.has(r * KOLONNER + k) ? "🟧" : "⬛")).join(""),
    ),
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
          <div className="absolute inset-0 grid grid-cols-4 grid-rows-3" aria-label="Ruter">
            {Array.from({ length: RUTER }, (_, i) => {
              const synlig = ferdig || apneSett.has(i)
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => apne(i)}
                  disabled={synlig || !kanApne}
                  aria-label={synlig ? `Rute ${i + 1}, åpen` : `Åpne rute ${i + 1}`}
                  // A border in the card colour separates the tiles without leaving gaps to peek through.
                  className={`border border-[var(--spill-flate)] transition-[opacity,background-color] duration-500 ${
                    synlig
                      ? "pointer-events-none opacity-0"
                      : kanApne
                        ? "cursor-pointer bg-neutral-300 hover:bg-neutral-400"
                        : "bg-neutral-300"
                  }`}
                />
              )
            })}
          </div>
        </div>
        <p className="mt-3 text-center font-mono text-[11px] text-neutral-500" role="status">
          {ferdig
            ? `${verdi.apne.length} av ${RUTER} ruter åpnet`
            : kanApne
              ? verdi.apne.length
                ? "Feil – åpne en rute til"
                : "Trykk på en rute for å åpne den"
              : `${verdi.apne.length} av ${RUTER} ruter åpne – hvilket land er det?`}
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
        <LandVelger id="canvas-forslag" utelat={verdi.gjetninger} onVelg={gjett} deaktivert={!kanGjette} plassholder={kanGjette ? "Hvilket land?" : "Åpne en rute først"} />
      )}

      <ul className="flex flex-col gap-1.5">
        {gjettet.map((g) => (
          <GjetningsRad key={g.id} gjett={g} fasit={fasit} />
        ))}
      </ul>
    </div>
  )
}

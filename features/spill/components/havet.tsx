"use client"

import { useState } from "react"
import { formaterDato } from "../lib/dag"
import { landEtterId } from "../lib/geografi-svar"
import { useDagligTilstand, type Resultat } from "../lib/lagring"
import { lyder } from "../lib/lyd"
import type { HavetOppgave } from "../lib/server/havet"
import { Forstorrelse, ForstorrKnapp } from "./forstorrelse"
import { DelKnapp, Kort, sekundarKnapp } from "./spill-ramme"

// Havet: place each of nine countries in one of nine categories, in any order. No undo; aim for the most points.

/** Placements in the order they were made: [country index, category index]. */
type Tilstand = { v: 2; plassert: [number, number][]; resultat: Resultat }
const tom = (): Tilstand => ({ v: 2, plassert: [], resultat: { status: "pagar" } })

const navn = (id: string) => landEtterId.get(id)?.navn ?? id
const flagg = (id: string) => landEtterId.get(id)?.flagg ?? id.toLowerCase()
const farge = (p: number) => (p >= 70 ? "text-emerald-700" : p >= 40 ? "text-amber-700" : "text-rose-700")
const emoji = (p: number) => (p >= 70 ? "🟩" : p >= 40 ? "🟨" : "🟥")

/** The best placement (category index per country), for the "see the best" view. */
function besteFordeling(poeng: number[][]) {
  const n = poeng.length
  const dp = new Map<number, number>([[0, 0]])
  const fra = new Map<number, [number, number]>()
  for (let i = 0; i < n; i++) {
    for (const [maske, verdi] of [...dp]) {
      let brukt = 0
      for (let m = maske; m; m &= m - 1) brukt++
      if (brukt !== i) continue
      for (let k = 0; k < n; k++) {
        if (maske & (1 << k)) continue
        const ny = maske | (1 << k)
        if ((dp.get(ny) ?? -1) < verdi + poeng[i][k]) {
          dp.set(ny, verdi + poeng[i][k])
          fra.set(ny, [maske, k])
        }
      }
    }
  }
  const valg = new Array<number>(n)
  let maske = (1 << n) - 1
  for (let i = n - 1; i >= 0; i--) {
    const [forrige, k] = fra.get(maske)!
    valg[i] = k
    maske = forrige
  }
  return valg
}

export function Havet({ dato, oppgave }: { dato: string; oppgave: HavetOppgave }) {
  const { verdi, lastet, oppdater } = useDagligTilstand<Tilstand>("havet", dato, tom)
  const [visBeste, setVisBeste] = useState(false)
  const [valgtLand, setValgtLand] = useState<number | null>(null)
  // The country whose flag is shown large.
  const [zoom, setZoom] = useState<string | null>(null)
  const ferdig = verdi.resultat.status !== "pagar"
  const n = oppgave.land.length
  const katFor = Array.from({ length: n }, (_, i) => verdi.plassert.find(([l]) => l === i)?.[1] ?? -1)
  const total = verdi.plassert.reduce((s, [l, k]) => s + oppgave.poeng[l][k], 0)
  const ledige = katFor.flatMap((k, i) => (k < 0 ? [i] : []))
  // With one country left there is nothing to choose.
  const aktiv = ferdig ? null : ledige.length === 1 ? ledige[0] : valgtLand !== null && katFor[valgtLand] < 0 ? valgtLand : null

  const plasser = (k: number) => {
    if (ferdig || aktiv === null || katFor.includes(k)) return
    const l = aktiv
    const p = oppgave.poeng[l][k]
    const sum = total + p
    const siste = verdi.plassert.length + 1 === n
    if (siste) lyder.seier()
    else lyder.naer(p / 100)
    setValgtLand(null)
    oppdater((t) => {
      if (t.resultat.status !== "pagar" || t.plassert.some(([a, b]) => a === l || b === k)) return t
      const plassert: [number, number][] = [...t.plassert, [l, k]]
      return siste
        ? { ...t, plassert, resultat: { status: "ferdig", etikett: `${sum}/${oppgave.maks}`, poeng: Math.round((sum / oppgave.maks) * 100) } }
        : { ...t, plassert }
    })
  }

  if (!lastet) return <div className="h-96 animate-pulse rounded-3xl bg-white/5" />

  const fordeling = visBeste ? besteFordeling(oppgave.poeng) : katFor
  const iKategori = (k: number) => fordeling.indexOf(k)
  const delTekst = [
    `Havet · ${formaterDato(dato, "kort")} · ${total}/${oppgave.maks}`,
    ...[0, 1, 2].map((r) => [0, 1, 2].map((c) => {
      const k = r * 3 + c
      const l = katFor.indexOf(k)
      return l < 0 ? "⬜" : emoji(oppgave.poeng[l][k])
    }).join("")),
    "thodh.com/spill/havet",
  ].join("\n")

  return (
    <div className="flex flex-col gap-4">
      {!ferdig ? (
        <>
          {/* The nine countries: pick one, then the category it should go in. */}
          <div className="grid grid-cols-3 gap-1.5">
            {oppgave.land.map((id, i) => {
              const plassert = katFor[i] >= 0
              const valgt = aktiv === i
              return (
                <div key={id} className="relative flex">
                  <button
                    type="button"
                    onClick={() => setValgtLand(valgt ? null : i)}
                    disabled={plassert}
                    aria-pressed={valgt}
                    className={`flex w-full items-center gap-2 rounded-xl border-2 py-1.5 pr-7 pl-2 text-left text-[13px] font-semibold leading-tight transition ${
                      plassert
                        ? "border-transparent bg-neutral-100 text-neutral-400"
                        : valgt
                          ? "border-neutral-900 bg-white text-neutral-950 shadow-sm"
                          : "border-black/10 bg-[var(--spill-flate)] text-neutral-900 hover:border-black/30"
                    }`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element -- small flags from flagcdn */}
                    <img src={`https://flagcdn.com/w40/${flagg(id)}.png`} alt="" className={`h-4 w-auto shrink-0 rounded-[2px] shadow-sm ${plassert ? "opacity-40" : ""}`} />
                    <span className={`min-w-0 hyphens-auto break-words ${plassert ? "line-through" : ""}`} lang="nb">
                      {navn(id)}
                    </span>
                  </button>
                  <ForstorrKnapp onClick={() => setZoom(id)} etikett={`Forstørr flagget til ${navn(id)}`} className="absolute top-1/2 right-0.5 -translate-y-1/2" />
                </div>
              )
            })}
          </div>
          <p className="text-center font-mono text-[11px] uppercase tracking-[0.2em] text-neutral-400" role="status">
            {aktiv === null ? "Velg et land" : `Hvor skal ${navn(oppgave.land[aktiv])}?`} · {verdi.plassert.length}/{n}
          </p>
        </>
      ) : (
        <Kort className="px-6 py-5 text-center">
          <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-neutral-400">{visBeste ? "Beste fordeling" : "Din sum"}</p>
          <p className="mt-1 text-4xl font-semibold tabular-nums text-neutral-950">
            {visBeste ? oppgave.maks : total}
            <span className="text-xl text-neutral-400"> / {oppgave.maks}</span>
          </p>
          <div className="mt-4 flex justify-center gap-2">
            <button type="button" onClick={() => setVisBeste((v) => !v)} className={sekundarKnapp}>
              {visBeste ? "Vis min" : "Se beste"}
            </button>
            <DelKnapp tekst={delTekst} />
          </div>
        </Kort>
      )}

      <Forstorrelse apen={zoom !== null} onLukk={() => setZoom(null)} etikett={zoom ? `Flagget til ${navn(zoom)}` : "Flagg"}>
        {zoom ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element -- large flags from flagcdn */}
            <img
              src={`https://flagcdn.com/w640/${flagg(zoom)}.png`}
              srcSet={`https://flagcdn.com/w640/${flagg(zoom)}.png 1x, https://flagcdn.com/w1280/${flagg(zoom)}.png 2x`}
              alt=""
              className="h-auto max-h-[55vh] w-full object-contain drop-shadow-lg"
            />
            <p className="text-2xl font-semibold tracking-tight text-neutral-950">{navn(zoom)}</p>
          </>
        ) : null}
      </Forstorrelse>

      <div className="grid grid-cols-3 gap-2">
        {oppgave.kategorier.map((kat, k) => {
          const i = iKategori(k)
          const p = i >= 0 ? oppgave.poeng[i][k] : null
          const ledig = !ferdig && i < 0
          return (
            <button
              key={kat.id}
              type="button"
              onClick={() => plasser(k)}
              disabled={!ledig || aktiv === null}
              className={`flex min-h-32 flex-col items-center justify-start gap-1 rounded-2xl border-2 px-2 py-3 text-center transition ${
                !ledig
                  ? "border-black/5 bg-neutral-100"
                  : aktiv !== null
                    ? "border-black/10 bg-[var(--spill-flate)] hover:-translate-y-0.5 hover:border-black/30"
                    : "border-black/10 bg-[var(--spill-flate)] opacity-80"
              }`}
            >
              <span className="text-2xl" aria-hidden="true">
                {kat.ikon}
              </span>
              <span className="text-sm font-semibold leading-tight text-neutral-950">{kat.navn}</span>
              <span className="text-[11px] leading-tight text-neutral-500">{kat.regel}</span>
              {i >= 0 ? (
                <span className="mel-inn mt-auto flex flex-col items-center gap-0.5 pt-1">
                  <span className="flex items-center gap-1 text-xs text-neutral-700">
                    {/* eslint-disable-next-line @next/next/no-img-element -- small flags from flagcdn */}
                    <img src={`https://flagcdn.com/w40/${flagg(oppgave.land[i])}.png`} alt="" className="h-3 w-auto rounded-[1px]" />
                    {navn(oppgave.land[i])}
                  </span>
                  <span className={`font-mono text-lg font-bold tabular-nums ${farge(p!)}`}>{p}</span>
                </span>
              ) : null}
            </button>
          )
        })}
      </div>
    </div>
  )
}

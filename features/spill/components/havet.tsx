"use client"

import { useState } from "react"
import { formaterDato } from "../lib/dag"
import { landEtterId } from "../lib/geografi-svar"
import { useDagligTilstand, type Resultat } from "../lib/lagring"
import { lyder } from "../lib/lyd"
import type { HavetOppgave } from "../lib/server/havet"
import { DelKnapp, Kort, sekundarKnapp } from "./spill-ramme"

// Havet: place each of nine countries in one of nine categories. No undo; aim for the most points.

type Tilstand = { v: 1; plassering: number[]; resultat: Resultat }
const tom = (): Tilstand => ({ v: 1, plassering: [], resultat: { status: "pagar" } })

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
  const ferdig = verdi.resultat.status !== "pagar"
  const naa = verdi.plassering.length
  const total = verdi.plassering.reduce((s, k, i) => s + oppgave.poeng[i][k], 0)

  const plasser = (k: number) => {
    if (ferdig || verdi.plassering.includes(k)) return
    const p = oppgave.poeng[naa][k]
    const sum = total + p
    const siste = naa + 1 === oppgave.land.length
    if (siste) lyder.seier()
    else lyder.naer(p / 100)
    oppdater((t) => {
      if (t.resultat.status !== "pagar" || t.plassering.length !== naa || t.plassering.includes(k)) return t
      const plassering = [...t.plassering, k]
      return siste
        ? { ...t, plassering, resultat: { status: "ferdig", etikett: `${sum}/${oppgave.maks}`, poeng: Math.round((sum / oppgave.maks) * 100) } }
        : { ...t, plassering }
    })
  }

  if (!lastet) return <div className="h-96 animate-pulse rounded-3xl bg-white/5" />

  const fordeling = visBeste ? besteFordeling(oppgave.poeng) : verdi.plassering
  const iKategori = (k: number) => fordeling.indexOf(k)
  const delTekst = [
    `Havet · ${formaterDato(dato, "kort")} · ${total}/${oppgave.maks}`,
    ...[0, 1, 2].map((r) => [0, 1, 2].map((c) => {
      const k = r * 3 + c
      const i = verdi.plassering.indexOf(k)
      return i < 0 ? "⬜" : emoji(oppgave.poeng[i][k])
    }).join("")),
    "thodh.com/spill/havet",
  ].join("\n")

  return (
    <div className="flex flex-col gap-4">
      {/* The queue: who has been placed, who is next. */}
      <div className="flex justify-center gap-1.5">
        {oppgave.land.map((id, i) => (
          // eslint-disable-next-line @next/next/no-img-element -- small flags from flagcdn
          <img
            key={id}
            src={`https://flagcdn.com/w40/${flagg(id)}.png`}
            alt={navn(id)}
            title={navn(id)}
            className={`h-5 w-auto rounded-[2px] transition ${i === naa && !ferdig ? "scale-125 ring-2 ring-neutral-900" : i < naa ? "opacity-30" : "opacity-80"}`}
          />
        ))}
      </div>

      {!ferdig ? (
        <Kort key={naa} className="mel-inn flex items-center justify-center gap-4 px-5 py-4">
          {/* eslint-disable-next-line @next/next/no-img-element -- flag from flagcdn */}
          <img src={`https://flagcdn.com/w160/${flagg(oppgave.land[naa])}.png`} alt="" className="h-12 w-auto rounded shadow-sm" />
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-neutral-400">Nå plasserer du · {naa + 1}/9</p>
            <p className="text-2xl font-semibold tracking-tight text-neutral-950">{navn(oppgave.land[naa])}</p>
          </div>
        </Kort>
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

      <div className="grid grid-cols-3 gap-2">
        {oppgave.kategorier.map((kat, k) => {
          const i = iKategori(k)
          const p = i >= 0 ? oppgave.poeng[i][k] : null
          return (
            <button
              key={kat.id}
              type="button"
              onClick={() => plasser(k)}
              disabled={ferdig || i >= 0}
              className={`flex min-h-32 flex-col items-center justify-start gap-1 rounded-2xl border-2 px-2 py-3 text-center transition ${
                i >= 0 ? "border-black/5 bg-neutral-100" : "border-black/10 bg-[var(--spill-flate)] hover:-translate-y-0.5 hover:border-black/30"
              }`}
            >
              <span className="text-2xl" aria-hidden="true">
                {kat.ikon}
              </span>
              <span className="text-sm font-semibold leading-tight text-neutral-950">{kat.navn}</span>
              <span className="text-[11px] leading-tight text-neutral-500">{kat.regel}</span>
              {i >= 0 ? (
                <span className="mel-inn mt-auto flex flex-col items-center gap-0.5 pt-1">
                  <span className="text-xs text-neutral-700">{navn(oppgave.land[i])}</span>
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

"use client"

import { useEffect, useState } from "react"
import { formaterDato, stokk } from "../lib/dag"
import { landEtterId } from "../lib/geografi-svar"
import { useDagligTilstand, type Resultat } from "../lib/lagring"
import { lyder } from "../lib/lyd"
import { DelKnapp, Knapp, sekundarKnapp } from "./spill-ramme"

// Tilkoblinger (our GeoConnections): find four groups of four countries. Four hearts; a wrong guess
// breaks one. Groups are checked on the server.

const LIV = 4
type Gruppe = { navn: string; niva: number; ider: string[] }
type Funnet = Gruppe & { nr: number }
type Tilstand = { v: 1; forsok: string[][]; funnet: Funnet[]; feil: number; fasit?: Gruppe[]; resultat: Resultat }
const tom = (): Tilstand => ({ v: 1, forsok: [], funnet: [], feil: 0, resultat: { status: "pagar" } })

/** Yellow, green, blue, purple – easiest to hardest, like Connections. */
const FARGE = ["bg-amber-300 text-neutral-950", "bg-emerald-400 text-neutral-950", "bg-sky-400 text-neutral-950", "bg-fuchsia-400 text-neutral-950"]
const EMOJI = ["🟨", "🟩", "🟦", "🟪"]

async function spor<T>(body: unknown): Promise<T> {
  const svar = await fetch("/spill/api/tilkoblinger", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
  const data = await svar.json().catch(() => ({ melding: "Noe gikk galt." }))
  if (!svar.ok) throw new Error(data.melding ?? "Noe gikk galt.")
  return data as T
}

const navn = (id: string) => landEtterId.get(id)?.navn ?? id
const flagg = (id: string) => landEtterId.get(id)?.flagg ?? id.toLowerCase()

function GruppeRad({ g }: { g: Funnet }) {
  return (
    <div className={`mel-inn rounded-2xl px-4 py-3 text-center ${FARGE[g.nr]}`}>
      <p className="text-sm font-bold uppercase tracking-wide">{g.navn}</p>
      <p className="mt-0.5 text-sm">{g.ider.map(navn).join(", ")}</p>
    </div>
  )
}

export function Tilkoblinger({ dato, rekke }: { dato: string; rekke: string[] }) {
  const { verdi, lastet, oppdater } = useDagligTilstand<Tilstand>("tilkoblinger", dato, tom)
  const [valgt, setValgt] = useState<string[]>([])
  const [orden, setOrden] = useState(rekke)
  const [melding, setMelding] = useState<string | null>(null)
  const [opptatt, setOpptatt] = useState(false)
  const [knust, setKnust] = useState<number | null>(null)
  const ferdig = verdi.resultat.status !== "pagar"

  const trengerFasit = lastet && ferdig && !verdi.fasit
  useEffect(() => {
    if (!trengerFasit) return
    spor<{ grupper: Gruppe[] }>({ type: "fasit", dato })
      .then((f) => oppdater((t) => ({ ...t, fasit: f.grupper })))
      .catch(() => undefined)
  }, [trengerFasit, dato, oppdater])

  const iGrupper = new Set(verdi.funnet.flatMap((g) => g.ider))
  const igjen = orden.filter((id) => !iGrupper.has(id))

  const velg = (id: string) => {
    if (ferdig || opptatt) return
    setMelding(null)
    setValgt((v) => (v.includes(id) ? v.filter((x) => x !== id) : v.length < 4 ? [...v, id] : v))
  }

  const send = async () => {
    if (valgt.length !== 4 || opptatt || ferdig) return
    const nokkel = [...valgt].sort().join(",")
    if (verdi.forsok.some((f) => [...f].sort().join(",") === nokkel)) {
      setMelding("Den har du allerede prøvd.")
      return
    }
    setOpptatt(true)
    try {
      const svar = await spor<{ gruppe: number; navn?: string; niva?: number; ider?: string[]; enUnna?: boolean }>({ type: "gjett", dato, ider: valgt })
      if (svar.gruppe >= 0) {
        const funnet = { navn: svar.navn!, niva: svar.niva!, ider: svar.ider!, nr: svar.gruppe }
        const alle = verdi.funnet.length + 1 === 4
        oppdater((t) => ({
          ...t,
          forsok: [...t.forsok, valgt],
          funnet: [...t.funnet, funnet],
          resultat: alle ? { status: "vunnet", etikett: `${t.feil} feil`, poeng: LIV - t.feil } : t.resultat,
        }))
        if (alle) lyder.seier()
        else lyder.riktig()
        setValgt([])
      } else {
        const feil = verdi.feil + 1
        setKnust(feil - 1)
        setTimeout(() => setKnust(null), 700)
        lyder.feil()
        setMelding(svar.enUnna ? "Én unna!" : null)
        oppdater((t) => ({
          ...t,
          forsok: [...t.forsok, valgt],
          feil,
          resultat: feil >= LIV ? { status: "tapt", etikett: `${t.funnet.length}/4`, poeng: 0 } : t.resultat,
        }))
      }
    } catch (e) {
      setMelding((e as Error).message)
    } finally {
      setOpptatt(false)
    }
  }

  if (!lastet) return <div className="h-96 animate-pulse rounded-3xl bg-white/5" />

  // At the end, groups not found are shown too, in difficulty order.
  const visteGrupper: Funnet[] = [
    ...verdi.funnet,
    ...(verdi.fasit ?? [])
      .map((g, nr) => ({ ...g, nr }))
      .filter((g) => !verdi.funnet.some((f) => f.nr === g.nr)),
  ]
  const gruppeAv = (id: string) => verdi.fasit?.findIndex((g) => g.ider.includes(id)) ?? -1
  const delTekst = [
    `Tilkoblinger · ${formaterDato(dato, "kort")}`,
    ...verdi.forsok.map((f) => f.map((id) => EMOJI[gruppeAv(id)] ?? "⬜").join("")),
    "thodh.com/spill/tilkoblinger",
  ].join("\n")

  return (
    <div className="flex flex-col gap-3">
      <p className="text-center text-sm text-neutral-500">Finn fire grupper med fire land som har noe til felles.</p>

      <div className="flex flex-col gap-2">
        {visteGrupper.map((g) => (
          <GruppeRad key={g.nr} g={g} />
        ))}
      </div>

      {!ferdig ? (
        <div className="grid grid-cols-4 gap-2">
          {igjen.map((id) => {
            const aktiv = valgt.includes(id)
            return (
              <button
                key={id}
                type="button"
                onClick={() => velg(id)}
                className={`flex min-h-20 flex-col items-center justify-center gap-1.5 rounded-xl px-1 py-2 text-center text-[13px] font-semibold leading-tight transition active:scale-95 ${
                  aktiv ? "bg-neutral-900 text-neutral-50" : "bg-neutral-100 text-neutral-950 hover:bg-neutral-200"
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element -- small flags from flagcdn */}
                <img src={`https://flagcdn.com/w40/${flagg(id)}.png`} alt="" className="h-4 w-auto rounded-[2px] shadow-sm" />
                <span className="hyphens-auto break-words" lang="nb">
                  {navn(id)}
                </span>
              </button>
            )
          })}
        </div>
      ) : null}

      <div className="flex items-center justify-center gap-2 py-1" aria-label={`${LIV - verdi.feil} liv igjen`}>
        {Array.from({ length: LIV }, (_, i) => {
          const borte = i >= LIV - verdi.feil
          return (
            <span
              key={i}
              aria-hidden="true"
              className={`text-xl transition-all duration-500 ${knust === LIV - 1 - i ? "til-knus" : ""} ${borte ? "opacity-30 grayscale" : ""}`}
            >
              {borte ? "💔" : "❤️"}
            </span>
          )
        })}
      </div>

      {melding ? (
        <p className="text-center font-mono text-[11px] text-neutral-500" role="status">
          {melding}
        </p>
      ) : null}

      {ferdig ? (
        <div className="mt-2 flex flex-col items-center gap-2">
          <p className="text-lg font-semibold text-neutral-950">{verdi.resultat.status === "vunnet" ? (verdi.feil ? `Klart med ${verdi.feil} feil` : "Feilfritt! 🎉") : "Ikke denne gangen"}</p>
          <DelKnapp tekst={delTekst} />
        </div>
      ) : (
        <div className="flex justify-center gap-2">
          <button type="button" onClick={() => setOrden((o) => stokk(o, `${Math.random()}`))} className={sekundarKnapp}>
            Stokk
          </button>
          <button type="button" onClick={() => setValgt([])} disabled={!valgt.length} className={sekundarKnapp}>
            Fjern valg
          </button>
          <Knapp onClick={() => void send()} disabled={valgt.length !== 4 || opptatt} className="h-9 px-4">
            Send
          </Knapp>
        </div>
      )}
    </div>
  )
}

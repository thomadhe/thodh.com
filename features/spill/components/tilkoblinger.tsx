"use client"

import { Check } from "lucide-react"
import { useEffect, useState } from "react"
import { formaterDato, stokk } from "../lib/dag"
import { useDagligTilstand, type Resultat } from "../lib/lagring"
import { lyder } from "../lib/lyd"
import type { Brikke, Gruppe } from "../lib/server/tilkoblinger"
import { Forstorrelse, ForstorrKnapp } from "./forstorrelse"
import { DelKnapp, Knapp, sekundarKnapp } from "./spill-ramme"

// Tilkoblinger (our GeoConnections): find four groups of four tiles. On land days a group is one
// country shown four ways (flag, outline, capital, a famous sight …); on category days it is four
// countries with something in common. Four hearts; a wrong guess breaks one. Groups are checked on the server.

const LIV = 4
type Funnet = Gruppe & { nr: number }
// v2: tiles instead of countries (Oct 2026); older saves start fresh.
type Tilstand = { v: 2; forsok: string[][]; funnet: Funnet[]; feil: number; fasit?: Gruppe[]; resultat: Resultat }
const tom = (): Tilstand => ({ v: 2, forsok: [], funnet: [], feil: 0, resultat: { status: "pagar" } })

/** Yellow, green, blue, purple – easiest to hardest, like Connections. */
const FARGE = ["bg-amber-300 text-neutral-950", "bg-emerald-400 text-neutral-950", "bg-sky-400 text-neutral-950", "bg-fuchsia-400 text-neutral-950"]
const EMOJI = ["🟨", "🟩", "🟦", "🟪"]

async function spor<T>(body: unknown): Promise<T> {
  const svar = await fetch("/spill/api/tilkoblinger", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
  const data = await svar.json().catch(() => ({ melding: "Noe gikk galt." }))
  if (!svar.ok) throw new Error(data.melding ?? "Noe gikk galt.")
  return data as T
}

function GruppeRad({ g }: { g: Funnet }) {
  return (
    <div className={`mel-inn rounded-2xl px-4 py-3 text-center ${FARGE[g.nr]}`}>
      <p className="text-sm font-bold uppercase tracking-wide">{g.navn}</p>
      <p className="mt-0.5 text-sm">{g.detaljer}</p>
      {g.kreditt ? (
        <p className="mt-1 text-[10px] opacity-70">
          Foto:{" "}
          <a href={g.kreditt.kilde} target="_blank" rel="noreferrer" className="underline underline-offset-2">
            {g.kreditt.fotograf}
          </a>
          , {g.kreditt.lisens}
        </p>
      ) : null}
    </div>
  )
}

const bildeSrc = (dato: string, b: Brikke) => `/spill/api/tilkoblinger/bilde?dato=${dato}&b=${b.id}`
const SLAGNAVN: Record<Brikke["slag"], string> = { flagg: "Flagg", omriss: "Omriss", foto: "Bilde", tekst: "Tekst" }

function Rute({ b, dato, aktiv, onVelg, onForstorr }: { b: Brikke; dato: string; aktiv: boolean; onVelg: () => void; onForstorr: () => void }) {
  const src = bildeSrc(dato, b)
  const foto = b.slag === "foto"
  return (
    <div className="relative">
      <button
        type="button"
        onClick={onVelg}
        aria-pressed={aktiv}
        aria-label={b.tekst ?? SLAGNAVN[b.slag]}
        className={`relative flex h-24 w-full flex-col items-center justify-center gap-1.5 overflow-hidden rounded-xl px-1 py-2 text-center leading-tight transition active:scale-95 sm:h-28 ${
          aktiv ? (foto ? "ring-4 ring-neutral-900" : "bg-neutral-900 text-neutral-50") : "bg-neutral-100 text-neutral-950 hover:bg-neutral-200"
        }`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- tile pictures come from our own proxy route */}
        {b.slag === "foto" ? <img src={src} alt="" className={`absolute inset-0 h-full w-full object-cover transition ${aktiv ? "scale-105 brightness-75" : ""}`} /> : null}
        {b.slag === "flagg" ? (
          // eslint-disable-next-line @next/next/no-img-element -- flag via our proxy route
          <img src={src} alt="" className={`w-auto rounded-[2px] shadow-sm ${b.tekst ? "h-4" : "max-h-12 max-w-[85%] sm:max-h-14"}`} />
        ) : null}
        {b.slag === "omriss" ? (
          // eslint-disable-next-line @next/next/no-img-element -- outline via our proxy route
          <img src={src} alt="" className={b.tekst ? "h-8 w-8" : "h-16 w-16 sm:h-20 sm:w-20"} />
        ) : null}
        {b.etikett ? <span className="font-mono text-[9px] uppercase tracking-wider opacity-60">{b.etikett}</span> : null}
        {b.tekst ? (
          <span className={`hyphens-auto break-words font-semibold ${b.slag === "tekst" ? "text-[13px]" : "text-[12px]"}`} lang="nb">
            {b.tekst}
          </span>
        ) : null}
        {aktiv && b.slag !== "tekst" ? (
          <span className="absolute top-1.5 right-1.5 grid h-5 w-5 place-items-center rounded-full bg-neutral-900 text-neutral-50 shadow">
            <Check className="h-3 w-3" strokeWidth={3} />
          </span>
        ) : null}
      </button>
      {b.slag !== "tekst" ? <ForstorrKnapp onClick={onForstorr} etikett={`Forstørr ${SLAGNAVN[b.slag].toLowerCase()}`} className="absolute top-0.5 left-0.5" /> : null}
    </div>
  )
}

export function Tilkoblinger({ dato, slag, brikker }: { dato: string; slag: "land" | "kategori"; brikker: Brikke[] }) {
  const { verdi, lastet, oppdater } = useDagligTilstand<Tilstand>("tilkoblinger", dato, tom)
  const [valgt, setValgt] = useState<string[]>([])
  const [orden, setOrden] = useState(brikker)
  const [melding, setMelding] = useState<string | null>(null)
  const [opptatt, setOpptatt] = useState(false)
  const [knust, setKnust] = useState<number | null>(null)
  // The tile shown large.
  const [zoom, setZoom] = useState<Brikke | null>(null)
  const ferdig = verdi.resultat.status !== "pagar"

  const trengerFasit = lastet && ferdig && !verdi.fasit
  useEffect(() => {
    if (!trengerFasit) return
    spor<{ grupper: Gruppe[] }>({ type: "fasit", dato })
      .then((f) => oppdater((t) => ({ ...t, fasit: f.grupper })))
      .catch(() => undefined)
  }, [trengerFasit, dato, oppdater])

  const iGrupper = new Set(verdi.funnet.flatMap((g) => g.ider))
  const igjen = orden.filter((b) => !iGrupper.has(b.id))

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
      const svar = await spor<{ gruppe: number; enUnna?: boolean } & Partial<Gruppe>>({ type: "gjett", dato, ider: valgt })
      if (svar.gruppe >= 0) {
        const { gruppe, ...g } = svar
        const funnet = { ...(g as Gruppe), nr: gruppe }
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
      <p className="text-center text-sm text-neutral-500">
        {slag === "land" ? "Fire land, vist på fire måter hver. Finn hvilke som hører sammen." : "Finn fire grupper med fire land som har noe til felles."}
      </p>

      <div className="flex flex-col gap-2">
        {visteGrupper.map((g) => (
          <GruppeRad key={g.nr} g={g} />
        ))}
      </div>

      {!ferdig ? (
        <div className="grid grid-cols-4 gap-2">
          {igjen.map((b) => (
            <Rute key={b.id} b={b} dato={dato} aktiv={valgt.includes(b.id)} onVelg={() => velg(b.id)} onForstorr={() => setZoom(b)} />
          ))}
        </div>
      ) : null}

      <Forstorrelse apen={zoom !== null} onLukk={() => setZoom(null)} etikett={zoom ? SLAGNAVN[zoom.slag] : "Bilde"}>
        {zoom ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element -- tile pictures come from our own proxy route */}
            <img
              src={bildeSrc(dato, zoom)}
              alt=""
              className={`max-h-[60vh] w-full object-contain ${zoom.slag === "foto" ? "rounded-2xl" : "drop-shadow-lg"} ${zoom.slag === "omriss" ? "max-w-80" : ""}`}
            />
            {zoom.etikett || zoom.tekst ? (
              <p className="text-center">
                {zoom.etikett ? <span className="block font-mono text-[11px] uppercase tracking-wider text-neutral-500">{zoom.etikett}</span> : null}
                {zoom.tekst ? <span className="text-xl font-semibold text-neutral-950">{zoom.tekst}</span> : null}
              </p>
            ) : null}
          </>
        ) : null}
      </Forstorrelse>

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

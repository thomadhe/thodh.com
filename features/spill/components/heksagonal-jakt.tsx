"use client"

import dynamic from "next/dynamic"
import { useEffect, useState, useSyncExternalStore } from "react"
import { formaterDato } from "../lib/dag"
import { MAKS_POENG, NIVAER, rundePoeng, UNNA, type Utfall } from "../lib/heksagon"
import { useDagligTilstand, type Resultat } from "../lib/lagring"
import { lyder } from "../lib/lyd"
import type { JaktFasit, JaktSted } from "../lib/server/heksagonal-jakt"
import { DelKnapp, Knapp, Kort } from "./spill-ramme"

// Heksagonal jakt (our HexHunt): tap the hex a place is in. The zoom sets the hex size (H3 resolutions 0–4),
// and smaller hexes are worth more. Three guesses per place; the server judges them and shows the answer at
// the end of a round.

// MapLibre and H3 are heavy, so the map comes in its own chunk, on the client only.
const HexKart = dynamic(() => import("./hex-kart"), {
  ssr: false,
  loading: () => <div className="aspect-[5/4] animate-pulse rounded-2xl bg-[#1b232b] sm:aspect-video" />,
})

const FORSOK = 3
const ANTALL = 7

/** A guess: its H3 cell, the cell's level, the feedback and, for a miss, about how many hexes away it is. */
type Gjetning = { c: string; n: number; u: Utfall; a?: number }
type Runde = { g: Gjetning[]; fasit: JaktFasit | null }
type Tilstand = { v: 2; runder: Runde[]; resultat: Resultat }
const tom = (): Tilstand => ({ v: 2, runder: [], resultat: { status: "pagar" } })
const nyRunde = (): Runde => ({ g: [], fasit: null })

const UTFALL: Record<Utfall, { navn: string; farge: string }> = {
  funnet: { navn: "Funnet", farge: "#22c55e" },
  het: { navn: "Het", farge: "#ef4444" },
  varm: { navn: "Varm", farge: "#f97316" },
  lunken: { navn: "Lunken", farge: "#38bdf8" },
  kald: { navn: "Kald", farge: "#6366f1" },
}
const LYD: Record<Utfall, number> = { funnet: 1, het: 0.8, varm: 0.55, lunken: 0.3, kald: 0.05 }

type Klasse = "treff" | "naer" | "bom"
const KLASSE: Record<Klasse, { farge: string; emoji: string }> = {
  treff: { farge: "#22c55e", emoji: "🟩" },
  naer: { farge: "#f59e0b", emoji: "🟨" },
  bom: { farge: "#ef4444", emoji: "🟥" },
}

/** A finished round's points and colour; both come from its last guess. */
function oppgjor(runde: Runde) {
  const siste = runde.g.at(-1)
  if (!siste || !runde.fasit) return null
  const poeng = rundePoeng(siste.u, siste.n, runde.g.length - 1)
  const klasse: Klasse = siste.u === "funnet" ? "treff" : poeng > 0 ? "naer" : "bom"
  return { poeng, klasse, siste }
}

async function spor<T>(body: unknown): Promise<T> {
  const svar = await fetch("/spill/api/heksagonal-jakt", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
  const data = await svar.json().catch(() => ({ melding: "Noe gikk galt." }))
  if (!svar.ok) throw new Error(data.melding ?? "Noe gikk galt.")
  return data as T
}

// A taller map on phones, where it is narrow; a wider one on larger screens.
const bred = "(min-width: 640px)"
const lyttBredde = (varsle: () => void) => {
  const mq = window.matchMedia(bred)
  mq.addEventListener("change", varsle)
  return () => mq.removeEventListener("change", varsle)
}

/** The legend under the game: what each colour means, in hexes away. */
function Forklaring() {
  return (
    <ul className="grid grid-cols-5 gap-1.5" aria-label="Forklaring">
      {(Object.keys(UTFALL) as Utfall[]).map((u) => (
        <li key={u} className="min-w-0">
          <div className="h-1.5 rounded-full" style={{ background: UTFALL[u].farge }} />
          <p className="mt-1 truncate text-[11px] font-semibold text-neutral-800">{UTFALL[u].navn}</p>
          <p className="truncate font-mono text-[10px] text-neutral-500">{u === "funnet" ? "i ruta" : `${UNNA[u]} unna`}</p>
        </li>
      ))}
    </ul>
  )
}

/** Seven hexes as a flower: the day's progress, one petal per place. */
function Blomst({ farger, aktiv }: { farger: (string | null)[]; aktiv: number | null }) {
  const s = 1
  const pos = [[0, 0], ...[-120, -60, 0, 60, 120, 180].map((v) => [Math.cos((v * Math.PI) / 180) * s * Math.sqrt(3), Math.sin((v * Math.PI) / 180) * s * Math.sqrt(3)])]
  const hjorner = (cx: number, cy: number) =>
    Array.from({ length: 6 }, (_, i) => {
      const v = ((60 * i - 30) * Math.PI) / 180
      return `${(cx + 0.92 * s * Math.cos(v)).toFixed(3)},${(cy + 0.92 * s * Math.sin(v)).toFixed(3)}`
    }).join(" ")
  return (
    <svg viewBox="-2.8 -2.8 5.6 5.6" className="h-12 w-12 shrink-0" aria-hidden="true">
      {pos.map(([x, y], i) => (
        <polygon
          key={i}
          points={hjorner(x, y)}
          fill={farger[i] ?? undefined}
          className={`${farger[i] ? "" : "fill-neutral-200"} ${aktiv === i ? "stroke-neutral-900" : ""}`}
          strokeWidth={0.2}
        />
      ))}
    </svg>
  )
}

export function HeksagonalJakt({ dato, steder }: { dato: string; steder: JaktSted[] }) {
  const { verdi, lastet, oppdater } = useDagligTilstand<Tilstand>("heksagonal-jakt", dato, tom)
  const [valgt, setValgt] = useState<[number, number] | null>(null)
  const [nivaa, setNivaa] = useState(0)
  const [opptatt, setOpptatt] = useState(false)
  const [melding, setMelding] = useState<string | null>(null)
  const storSkjerm = useSyncExternalStore(lyttBredde, () => window.matchMedia(bred).matches, () => false)
  const ferdig = verdi.resultat.status !== "pagar"

  const nr = Math.max(0, verdi.runder.length - 1)
  const runde = verdi.runder[nr] ?? nyRunde()
  const sted = steder[nr]
  const avsluttet = runde.fasit !== null
  const oppgjorte = verdi.runder.map(oppgjor)
  const total = oppgjorte.reduce((s, o) => s + (o?.poeng ?? 0), 0)

  // A finished game whose answers weren't all stored (e.g. another device's progress) fetches them once.
  const trengerFasit = lastet && ferdig && verdi.runder.some((r) => !r.fasit)
  useEffect(() => {
    if (!trengerFasit) return
    spor<{ steder: JaktFasit[] }>({ type: "fasit", dato })
      .then((f) => oppdater((t) => ({ ...t, runder: t.runder.map((r, i) => ({ ...r, fasit: r.fasit ?? f.steder[i] })) })))
      .catch(() => undefined)
  }, [trengerFasit, dato, oppdater])

  const velg = (punkt: [number, number] | null) => {
    if (ferdig || avsluttet || opptatt) return
    setMelding(null)
    if (punkt) lyder.velg()
    setValgt(punkt)
  }

  const gjett = async () => {
    if (!valgt || opptatt || ferdig || avsluttet) return
    // The map has loaded the grid module already, so this resolves at once.
    const { celleFor } = await import("../lib/heksagon-celler")
    const n = nivaa
    const c = celleFor(valgt[0], valgt[1], n)
    if (runde.g.some((g) => g.c === c)) return setMelding("Den har du prøvd.")
    setOpptatt(true)
    try {
      const forsok = runde.g.length + 1
      const svar = await spor<{ utfall: Utfall; unna?: number; fasit?: JaktFasit }>({ type: "gjett", dato, nr, celle: c, forsok })
      const gjetning: Gjetning = { c, n, u: svar.utfall, ...(svar.unna ? { a: svar.unna } : {}) }
      const fasit = svar.fasit ?? null
      const sisteRunde = fasit !== null && nr === ANTALL - 1
      if (sisteRunde) lyder.seier()
      else if (svar.utfall === "funnet") lyder.riktig()
      else if (fasit && rundePoeng(svar.utfall, n, forsok - 1) === 0) lyder.feil()
      else lyder.naer(LYD[svar.utfall])
      setValgt(null)
      oppdater((t) => {
        if (t.resultat.status !== "pagar") return t
        const runder = [...t.runder]
        const denne = runder[nr] ?? nyRunde()
        if (denne.fasit || denne.g.length + 1 !== forsok) return t
        runder[nr] = { g: [...denne.g, gjetning], fasit }
        if (!sisteRunde) return { ...t, runder }
        const sum = runder.reduce((s, r) => s + (oppgjor(r)?.poeng ?? 0), 0)
        return { ...t, runder, resultat: { status: "ferdig", etikett: `${sum}/${ANTALL * MAKS_POENG}`, poeng: Math.round((sum / (ANTALL * MAKS_POENG)) * 100) } }
      })
    } catch (e) {
      setMelding((e as Error).message)
    } finally {
      setOpptatt(false)
    }
  }

  const neste = () => {
    setMelding(null)
    oppdater((t) => (t.runder.length < ANTALL && t.runder.at(-1)?.fasit ? { ...t, runder: [...t.runder, nyRunde()] } : t))
  }

  // Enter guesses the chosen hex, or moves on to the next place once a round is over.
  useEffect(() => {
    const ved = (e: KeyboardEvent) => {
      if (e.key !== "Enter" || e.repeat || (e.target as HTMLElement | null)?.closest("button, a, input")) return
      if (avsluttet && !ferdig) neste()
      else void gjett()
    }
    window.addEventListener("keydown", ved)
    return () => window.removeEventListener("keydown", ved)
  })

  if (!lastet) return <div className="h-96 animate-pulse rounded-3xl bg-white/5" />

  const forhold = storSkjerm ? 9 / 16 : 0.8
  const resultat = oppgjor(runde)

  // After a miss, frame the guesses and the answer so both are in view; at the end, all seven places.
  const ramme = ferdig
    ? { punkter: verdi.runder.flatMap((r) => (r.fasit ? [r.fasit.punkt] : [])), celler: [] }
    : runde.fasit && resultat?.klasse !== "treff"
      ? { punkter: [runde.fasit.punkt], celler: runde.g.map((g) => g.c) }
      : null
  const punkter = ferdig
    ? verdi.runder.flatMap((r, i) => {
        const o = oppgjorte[i]
        return r.fasit && o ? [{ punkt: r.fasit.punkt, farge: KLASSE[o.klasse].farge, tekst: String(i + 1) }] : []
      })
    : []
  const visNivaa = !ferdig && !avsluttet

  const blomstFarger = Array.from({ length: ANTALL }, (_, i) => (oppgjorte[i] ? KLASSE[oppgjorte[i]!.klasse].farge : null))
  const delTekst = [
    `Heksagonal jakt · ${formaterDato(dato, "kort")} · ${total}/${ANTALL * MAKS_POENG}`,
    oppgjorte.map((o) => (o ? KLASSE[o.klasse].emoji : "⬜")).join(""),
    `${verdi.runder.filter((r) => r.g.length === 1 && r.g[0].u === "funnet").length} på første · ${verdi.runder.reduce((s, r) => s + r.g.length, 0)}/${ANTALL * FORSOK} forsøk`,
    "thodh.com/spill/heksagonal-jakt",
  ].join("\n")

  return (
    <div className="flex flex-col gap-3">
      <Kort className="flex items-center gap-3 px-4 py-3">
        <Blomst farger={blomstFarger} aktiv={ferdig ? null : nr} />
        {ferdig ? (
          <div className="min-w-0 flex-1">
            <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-neutral-400">Dagens jakt</p>
            <p className="text-3xl font-semibold tabular-nums text-neutral-950">
              {total}
              <span className="text-lg text-neutral-400"> / {ANTALL * MAKS_POENG}</span>
            </p>
          </div>
        ) : (
          <div className="min-w-0 flex-1">
            <p className="truncate text-xl font-semibold leading-tight text-neutral-950">{sted.navn}</p>
            <p className="mt-0.5 flex items-center gap-1.5 text-sm text-neutral-500">
              {/* eslint-disable-next-line @next/next/no-img-element -- small flags from flagcdn */}
              <img src={`https://flagcdn.com/w40/${sted.flagg}.png`} alt="" className="h-3 w-auto rounded-[1px] shadow-sm" />
              <span className="truncate">{sted.land}</span>
            </p>
          </div>
        )}
        {ferdig ? <DelKnapp tekst={delTekst} /> : <span className="font-mono text-[11px] text-neutral-400">{nr + 1}/{ANTALL}</span>}
      </Kort>

      <div className="relative">
        <HexKart
          forhold={forhold}
          aktiv={!ferdig && !avsluttet}
          valgt={ferdig || avsluttet ? null : valgt}
          celler={ferdig ? [] : runde.g.map((g) => ({ celle: g.c, farge: UTFALL[g.u].farge, tekst: g.a ? String(g.a) : undefined }))}
          fasit={!ferdig && runde.fasit && resultat ? { ...runde.fasit, nivaa: resultat.siste.n } : null}
          punkter={punkter}
          ramme={ramme}
          runde={nr}
          onVelg={velg}
          onNivaa={setNivaa}
        />
        {visNivaa ? (
          // The map is dark in every theme, so the label uses fixed colours rather than the flipped neutrals.
          <span
            className="pointer-events-none absolute top-2 left-2 flex items-center gap-1.5 rounded-full px-2.5 py-1 font-mono text-[11px] text-white backdrop-blur"
            style={{ background: "rgba(11, 16, 22, 0.7)" }}
          >
            <span aria-hidden="true">⬢</span>
            {NIVAER[nivaa].navn} · {NIVAER[nivaa].poeng}
          </span>
        ) : null}
      </div>

      {ferdig ? (
        <ul className="flex flex-col gap-1.5">
          {verdi.runder.map((r, i) => {
            const o = oppgjorte[i]
            if (!o) return null
            return (
              <li key={i} className="flex items-center gap-3 rounded-2xl border border-black/5 bg-[var(--spill-flate)] px-4 py-2.5">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-[#0b1016]" style={{ background: KLASSE[o.klasse].farge }}>
                  {i + 1}
                </span>
                <span className="min-w-0 flex-1 truncate text-sm font-medium text-neutral-900">{steder[i].navn}</span>
                <span className="font-mono text-[11px] text-neutral-500">
                  {NIVAER[o.siste.n].navn} · {r.g.length}/{FORSOK}
                </span>
                <span className="w-9 text-right font-mono text-sm font-semibold tabular-nums text-neutral-950">{o.poeng}</span>
              </li>
            )
          })}
        </ul>
      ) : avsluttet && resultat ? (
        <Kort className="mel-inn flex items-center gap-3 px-4 py-3">
          <div className="min-w-0 flex-1">
            <p className="text-lg font-semibold" style={{ color: KLASSE[resultat.klasse].farge }}>
              {resultat.klasse === "treff" ? "Funnet!" : resultat.klasse === "naer" ? "Nesten" : "Bom"}
            </p>
            <p className="font-mono text-[11px] text-neutral-500">
              +{resultat.poeng} · {NIVAER[resultat.siste.n].navn} · {runde.g.length}/{FORSOK}
            </p>
          </div>
          <Knapp onClick={neste}>Neste</Knapp>
        </Kort>
      ) : (
        <div className="flex items-center gap-3">
          <ul className="flex min-w-0 flex-1 flex-wrap gap-1.5" aria-label="Forsøk">
            {runde.g.map((g, i) => (
              <li key={i} className="rounded-full px-3 py-1 text-xs font-semibold text-white" style={{ background: UTFALL[g.u].farge }}>
                {UTFALL[g.u].navn}
                {g.a ? <span className="font-mono font-normal opacity-90"> · {g.a}</span> : null}
              </li>
            ))}
            {runde.g.length === 0 ? <li className="font-mono text-[11px] text-neutral-500">{melding ?? (storSkjerm ? "Dra, og zoom med hjulet eller + og −. Enter gjetter." : "Zoom inn for flere poeng")}</li> : null}
            {runde.g.length > 0 && melding ? <li className="font-mono text-[11px] text-neutral-500">{melding}</li> : null}
          </ul>
          <span className="font-mono text-[11px] text-neutral-400">{FORSOK - runde.g.length} igjen</span>
          <Knapp onClick={gjett} disabled={!valgt || opptatt}>
            Gjett
          </Knapp>
        </div>
      )}

      {ferdig ? null : <Forklaring />}
    </div>
  )
}

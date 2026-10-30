"use client"

import { useEffect, useState, useSyncExternalStore } from "react"
import { formaterDato } from "../lib/dag"
import { celle, fraKart, hexSti, KM_PER_PX, MAKS_POENG, NIVAER, nivaaForZoom, rundePoeng, sentrum, synligeCeller, type Utfall } from "../lib/heksagon"
import { useDagligTilstand, type Resultat } from "../lib/lagring"
import { lyder } from "../lib/lyd"
import type { JaktFasit, JaktSted } from "../lib/server/heksagonal-jakt"
import { DelKnapp, Knapp, Kort } from "./spill-ramme"
import { Verdenskart, type KartUtsnitt } from "./verdenskart"

// Heksagonal jakt (our HexHunt): tap the hex a place is in. The zoom sets the hex size, and smaller hexes
// are worth more. Three guesses per place; the server judges them and shows the answer at the end of a round.

const FORSOK = 3
const ANTALL = 7

type Gjetning = { n: number; q: number; r: number; u: Utfall }
type Runde = { g: Gjetning[]; fasit: JaktFasit | null }
type Tilstand = { v: 1; runder: Runde[]; resultat: Resultat }
const tom = (): Tilstand => ({ v: 1, runder: [], resultat: { status: "pagar" } })
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
  const [valgt, setValgt] = useState<{ n: number; q: number; r: number } | null>(null)
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

  const trykk = (x: number, y: number, u: KartUtsnitt) => {
    if (ferdig || avsluttet || opptatt) return
    const n = nivaaForZoom(u.pxPerEnhet)
    const [q, r] = celle(n, x, y)
    if (!fraKart(...sentrum(n, q, r))) return
    setMelding(null)
    if (valgt && valgt.n === n && valgt.q === q && valgt.r === r) return setValgt(null)
    lyder.velg()
    setValgt({ n, q, r })
  }

  const gjett = async () => {
    if (!valgt || opptatt || ferdig || avsluttet) return
    if (runde.g.some((g) => g.n === valgt.n && g.q === valgt.q && g.r === valgt.r)) return setMelding("Den har du prøvd.")
    setOpptatt(true)
    try {
      const forsok = runde.g.length + 1
      const svar = await spor<{ utfall: Utfall; fasit?: JaktFasit }>({ type: "gjett", dato, nr, nivaa: valgt.n, q: valgt.q, r: valgt.r, forsok })
      const gjetning: Gjetning = { ...valgt, u: svar.utfall }
      const fasit = svar.fasit ?? null
      const sisteRunde = fasit !== null && nr === ANTALL - 1
      if (sisteRunde) lyder.seier()
      else if (svar.utfall === "funnet") lyder.riktig()
      else if (fasit && rundePoeng(svar.utfall, valgt.n, forsok - 1) === 0) lyder.feil()
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

  const forhold = storSkjerm ? 0.56 : 0.8
  const resultat = oppgjor(runde)
  const prikk = (u: KartUtsnitt, px: number) => px / Math.max(u.pxPerEnhet, 0.1)

  // After a miss, frame the guesses and the answer so both are in view; at the end, all seven places.
  let ramme: [number, number, number, number] | undefined
  const boks = (punkter: [number, number][]) =>
    [Math.min(...punkter.map((p) => p[0])), Math.min(...punkter.map((p) => p[1])), Math.max(...punkter.map((p) => p[0])), Math.max(...punkter.map((p) => p[1]))] as [number, number, number, number]
  if (ferdig) {
    const alle = verdi.runder.flatMap((r) => (r.fasit ? [r.fasit.punkt] : []))
    if (alle.length) ramme = boks(alle)
  } else if (runde.fasit && resultat?.klasse !== "treff") {
    ramme = boks([runde.fasit.punkt, ...runde.g.map((g) => sentrum(g.n, g.q, g.r))])
  }

  const lag = (u: KartUtsnitt) => {
    if (ferdig) {
      return verdi.runder.map((r, i) => {
        const o = oppgjorte[i]
        if (!r.fasit || !o) return null
        const [x, y] = r.fasit.punkt
        return (
          <g key={i} pointerEvents="none">
            <circle cx={x} cy={y} r={prikk(u, 8)} fill={KLASSE[o.klasse].farge} stroke="#fff" strokeWidth={1.5} vectorEffect="non-scaling-stroke" />
            <text x={x} y={y} dy="0.35em" textAnchor="middle" fontSize={prikk(u, 10)} fontWeight={700} fill="#0b1016">
              {i + 1}
            </text>
          </g>
        )
      })
    }
    const n = nivaaForZoom(u.pxPerEnhet)
    return (
      <g pointerEvents="none">
        {avsluttet ? null : (
          <path d={hexSti(n, synligeCeller(n, u.x, u.y, u.b, u.h))} fill="none" stroke="rgba(255,255,255,0.22)" strokeWidth={0.75} vectorEffect="non-scaling-stroke" />
        )}
        {runde.g.map((g, i) => (
          <path
            key={i}
            d={hexSti(g.n, [[g.q, g.r]])}
            fill={UTFALL[g.u].farge}
            fillOpacity={0.5}
            stroke={UTFALL[g.u].farge}
            strokeWidth={1.5}
            vectorEffect="non-scaling-stroke"
          />
        ))}
        {valgt ? (
          <path d={hexSti(valgt.n, [[valgt.q, valgt.r]])} fill="#fff" fillOpacity={0.25} stroke="#fff" strokeWidth={2} vectorEffect="non-scaling-stroke" />
        ) : null}
        {runde.fasit && resultat ? (
          <>
            {runde.fasit.radiusKm > 0 ? (
              <circle cx={runde.fasit.punkt[0]} cy={runde.fasit.punkt[1]} r={runde.fasit.radiusKm / KM_PER_PX} fill="#22c55e" fillOpacity={0.15} stroke="#22c55e" strokeDasharray="4 3" strokeWidth={1.5} vectorEffect="non-scaling-stroke" />
            ) : null}
            <path
              d={hexSti(resultat.siste.n, [celle(resultat.siste.n, ...runde.fasit.punkt)])}
              fill="none"
              stroke="#22c55e"
              strokeWidth={2}
              vectorEffect="non-scaling-stroke"
            />
            <circle cx={runde.fasit.punkt[0]} cy={runde.fasit.punkt[1]} r={prikk(u, 4.5)} fill="#fff" stroke="#22c55e" strokeWidth={2} vectorEffect="non-scaling-stroke" />
          </>
        ) : null}
      </g>
    )
  }

  const merke = (u: KartUtsnitt) => {
    if (ferdig || avsluttet) return null
    const n = valgt?.n ?? nivaaForZoom(u.pxPerEnhet)
    return (
      // The map is dark in every theme, so the label uses fixed colours rather than the flipped neutrals.
      <span className="flex items-center gap-1.5 rounded-full px-2.5 py-1 font-mono text-[11px] text-white backdrop-blur" style={{ background: "rgba(11, 16, 22, 0.7)" }}>
        <span aria-hidden="true">⬢</span>
        {NIVAER[n].navn} · {NIVAER[n].poeng}
      </span>
    )
  }

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

      <Verdenskart farger={{}} visPunkter={false} tastatur maksZoom={24} forhold={forhold} ramme={ramme} lag={lag} merke={merke} onTrykk={ferdig || avsluttet ? undefined : trykk} />

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
    </div>
  )
}

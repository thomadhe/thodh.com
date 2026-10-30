"use client"

import { useEffect, useRef, useState } from "react"
import { land, omrader, territorier, type Omrade as Land } from "../lib/geografi"
import { landEtterId } from "../lib/geografi-svar"
import { lyder } from "../lib/lyd"
import type { OvelsesUtvalg } from "../lib/server/omriss"
import { LandVelger } from "./land-gjetting"
import { TerritoriumMerke, tilhorerNavn } from "./omriss"
import { Knapp, Kort, sekundarKnapp } from "./spill-ramme"

// Omriss practice: outlines in rapid fire for 60 seconds. One guess each – right or wrong, the next
// shape comes straight away (a wrong answer shows the right one for a moment). The player picks the
// states only or the territories too; each choice keeps its own record.

const RUNDE_MS = 60_000
type Form = { id: string; form: string }
type Svar = { id: string; riktig: boolean }

const UTVALG: { id: OvelsesUtvalg; navn: string; antall: number }[] = [
  { id: "land", navn: "Land", antall: land.length },
  { id: "alle", navn: "Med territorier", antall: omrader.length },
]
// Records from before the choice came from a pool with territories, so they stay with "alle".
const rekordNokkel = (u: OvelsesUtvalg) => (u === "alle" ? "omriss:ovelse:rekord" : "omriss:ovelse:rekord:land")
const UTVALG_NOKKEL = "omriss:ovelse:utvalg"
const territorieIder = territorier.map((t) => t.id)

function les(nokkel: string) {
  try {
    return localStorage.getItem(nokkel)
  } catch {
    return null
  }
}
function lagre(nokkel: string, verdi: string) {
  try {
    localStorage.setItem(nokkel, verdi)
  } catch {}
}
const lesRekord = (u: OvelsesUtvalg) => Number(les(rekordNokkel(u))) || 0

export function OmrissOvelse() {
  const [ko, setKo] = useState<Form[]>([])
  const [status, setStatus] = useState<"klar" | "spiller" | "ferdig">("klar")
  const [svar, setSvar] = useState<Svar[]>([])
  const [slutt, setSlutt] = useState(0)
  const [naa, setNaa] = useState(0)
  const [visFasit, setVisFasit] = useState<Land | null>(null)
  const [rekord, setRekord] = useState(0)
  const [utvalg, setUtvalg] = useState<OvelsesUtvalg | null>(null)
  const henter = useRef<OvelsesUtvalg | null>(null)

  const hent = async (u: OvelsesUtvalg) => {
    if (henter.current === u) return
    henter.current = u
    try {
      const { former } = (await (await fetch(`/spill/api/omriss-ovelse?utvalg=${u}`)).json()) as { former: Form[] }
      // A batch for a choice the player has since left is dropped.
      if (henter.current === u) setKo((k) => [...k, ...former.filter((f) => !k.some((x) => x.id === f.id))])
    } finally {
      if (henter.current === u) henter.current = null
    }
  }

  useEffect(() => {
    // The stored choice once the page is in the browser; its record and shapes follow below.
    const lagret = les(UTVALG_NOKKEL)
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setUtvalg(lagret === "alle" ? "alle" : "land")
  }, [])

  // Keep a few shapes of the chosen kind ready ahead of the player.
  useEffect(() => {
    if (utvalg && ko.length < 4) void hent(utvalg)
  }, [utvalg, ko.length])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (utvalg) setRekord(lesRekord(utvalg))
  }, [utvalg])

  const velgUtvalg = (u: OvelsesUtvalg) => {
    if (u === utvalg || status === "spiller") return
    lagre(UTVALG_NOKKEL, u)
    henter.current = null
    setKo([])
    setSvar([])
    setStatus("klar")
    setUtvalg(u)
  }

  const riktige = svar.filter((s) => s.riktig).length

  useEffect(() => {
    if (status !== "spiller") return
    const t = setInterval(() => {
      const n = Date.now()
      setNaa(n)
      if (n >= slutt) {
        clearInterval(t)
        setStatus("ferdig")
        setVisFasit(null)
        if (utvalg && riktige > lesRekord(utvalg)) {
          lagre(rekordNokkel(utvalg), String(riktige))
          setRekord(riktige)
        }
      }
    }, 200)
    return () => clearInterval(t)
  }, [status, slutt, riktige, utvalg])

  const start = () => {
    const n = Date.now()
    setSvar([])
    setNaa(n)
    setSlutt(n + RUNDE_MS)
    setVisFasit(null)
    setStatus("spiller")
  }

  const neste = () => setKo((k) => k.slice(1))

  const gjett = (l: Land | null) => {
    const naaForm = ko[0]
    if (status !== "spiller" || !naaForm || visFasit) return
    const riktig = l?.id === naaForm.id
    setSvar((s) => [...s, { id: naaForm.id, riktig }])
    if (riktig) {
      lyder.riktig()
      neste()
    } else {
      lyder.feil()
      setVisFasit(landEtterId.get(naaForm.id) ?? null)
      setTimeout(() => {
        setVisFasit(null)
        neste()
      }, 1100)
    }
  }

  const igjen = Math.max(0, Math.ceil((slutt - naa) / 1000))
  const form = ko[0]
  const formOmrade = form ? landEtterId.get(form.id) : undefined

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between px-1">
        <p className="font-[family-name:var(--font-visning)] text-2xl font-extrabold tabular-nums tracking-tight text-neutral-950">
          {riktige} <span className="text-base font-normal text-neutral-400">riktige</span>
        </p>
        <p className={`font-mono text-xl tabular-nums ${status === "spiller" && igjen <= 10 ? "text-rose-500" : "text-neutral-600"}`}>
          {status === "spiller" ? `0:${String(igjen).padStart(2, "0")}` : "1:00"}
        </p>
      </div>

      <Kort className={`relative flex items-center justify-center p-6 transition-colors duration-200 ${visFasit ? "bg-rose-50" : ""}`}>
        {form && status !== "klar" ? (
          <svg key={form.id} viewBox="0 0 200 200" className="mel-inn h-56 w-56 sm:h-64 sm:w-64" role="img" aria-label="Omrisset av et land">
            {/* A thin edge in the same colour keeps the smallest islands of an atoll nation visible. */}
            <path d={form.form} strokeWidth={2} strokeLinejoin="round" className={visFasit ? "fill-rose-400 stroke-rose-400" : "fill-sky-400 stroke-sky-400"} />
          </svg>
        ) : (
          <div className="flex h-56 flex-col items-center justify-center gap-2 text-center sm:h-64">
            <p className="text-lg font-semibold text-neutral-950">
              {status === "ferdig"
                ? `${riktige} av ${svar.length}`
                : utvalg === "alle"
                  ? "Så mange land og territorier du klarer på ett minutt"
                  : "Så mange land du klarer på ett minutt"}
            </p>
            {rekord ? <p className="font-mono text-[11px] text-neutral-500">Rekord {rekord}</p> : null}
          </div>
        )}
        {status === "spiller" && formOmrade && !formOmrade.suveren ? <TerritoriumMerke /> : null}
        {visFasit ? (
          <p className="mel-inn absolute bottom-3 left-0 right-0 text-center text-sm font-semibold text-rose-700">
            Det var {visFasit.navn}
            {tilhorerNavn(visFasit) ? <span className="font-normal"> ({tilhorerNavn(visFasit)})</span> : null}
          </p>
        ) : null}
      </Kort>

      {status === "spiller" ? (
        <div className="flex flex-col gap-2">
          <LandVelger
            id="ovelse-forslag"
            utelat={utvalg === "land" ? territorieIder : []}
            plassholder={utvalg === "alle" ? "Hvilket land eller territorium?" : undefined}
            onVelg={(l) => gjett(l)}
            deaktivert={Boolean(visFasit)}
          />
          <div className="flex justify-end">
            <button type="button" onClick={() => gjett(null)} className={sekundarKnapp} disabled={Boolean(visFasit)}>
              Hopp over
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3">
          <div role="radiogroup" aria-label="Hva du øver på" className="flex gap-1 rounded-2xl bg-neutral-100 p-1">
            {UTVALG.map((u) => (
              <button
                key={u.id}
                type="button"
                role="radio"
                aria-checked={utvalg === u.id}
                onClick={() => velgUtvalg(u.id)}
                className={`rounded-xl px-3.5 py-1.5 text-sm font-medium transition ${
                  utvalg === u.id ? "bg-[var(--spill-flate)] text-neutral-950 shadow-sm" : "text-neutral-500 hover:text-neutral-900"
                }`}
              >
                {u.navn} <span className="font-mono text-[11px] text-neutral-400">{u.antall}</span>
              </button>
            ))}
          </div>
          <Knapp onClick={start} disabled={!form}>
            {status === "ferdig" ? "En runde til" : "Start"}
          </Knapp>
        </div>
      )}

      {status === "ferdig" && svar.some((s) => !s.riktig) ? (
        <p className="text-center text-sm text-neutral-500">
          Bom: {svar.filter((s) => !s.riktig).map((s) => landEtterId.get(s.id)?.navn).join(", ")}
        </p>
      ) : null}
    </div>
  )
}

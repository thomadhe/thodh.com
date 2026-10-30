"use client"

import { useEffect, useRef, useState } from "react"
import type { Omrade as Land } from "../lib/geografi"
import { landEtterId } from "../lib/geografi-svar"
import { lyder } from "../lib/lyd"
import { LandVelger } from "./land-gjetting"
import { Knapp, Kort, sekundarKnapp } from "./spill-ramme"

// Omriss practice: outlines in rapid fire for 60 seconds. One guess each – right or wrong, the next
// shape comes straight away (a wrong answer shows the right one for a moment).

const RUNDE_MS = 60_000
type Form = { id: string; form: string }
type Svar = { id: string; riktig: boolean }

function lesRekord() {
  try {
    return Number(localStorage.getItem("omriss:ovelse:rekord")) || 0
  } catch {
    return 0
  }
}

export function OmrissOvelse() {
  const [ko, setKo] = useState<Form[]>([])
  const [status, setStatus] = useState<"klar" | "spiller" | "ferdig">("klar")
  const [svar, setSvar] = useState<Svar[]>([])
  const [slutt, setSlutt] = useState(0)
  const [naa, setNaa] = useState(0)
  const [visFasit, setVisFasit] = useState<Land | null>(null)
  const [rekord, setRekord] = useState(0)
  const henter = useRef(false)

  const hent = async () => {
    if (henter.current) return
    henter.current = true
    try {
      const { former } = (await (await fetch("/spill/api/omriss-ovelse")).json()) as { former: Form[] }
      setKo((k) => [...k, ...former.filter((f) => !k.some((x) => x.id === f.id))])
    } finally {
      henter.current = false
    }
  }

  useEffect(() => {
    // Load the first batch and the stored record once the page is in the browser.
    void hent()
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setRekord(lesRekord())
  }, [])

  // Keep a few shapes ready ahead of the player.
  useEffect(() => {
    if (ko.length < 4) void hent()
  }, [ko.length])

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
        if (riktige > lesRekord()) {
          try {
            localStorage.setItem("omriss:ovelse:rekord", String(riktige))
          } catch {}
          setRekord(riktige)
        }
      }
    }, 200)
    return () => clearInterval(t)
  }, [status, slutt, riktige])

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
            <path d={form.form} className={visFasit ? "fill-rose-400" : "fill-sky-400"} />
          </svg>
        ) : (
          <div className="flex h-56 flex-col items-center justify-center gap-2 text-center sm:h-64">
            <p className="text-lg font-semibold text-neutral-950">{status === "ferdig" ? `${riktige} av ${svar.length}` : "Så mange land du klarer på ett minutt"}</p>
            {rekord ? <p className="font-mono text-[11px] text-neutral-500">Rekord {rekord}</p> : null}
          </div>
        )}
        {visFasit ? (
          <p className="mel-inn absolute bottom-3 left-0 right-0 text-center text-sm font-semibold text-rose-700">Det var {visFasit.navn}</p>
        ) : null}
      </Kort>

      {status === "spiller" ? (
        <div className="flex flex-col gap-2">
          <LandVelger id="ovelse-forslag" utelat={[]} onVelg={(l) => gjett(l)} deaktivert={Boolean(visFasit)} />
          <div className="flex justify-end">
            <button type="button" onClick={() => gjett(null)} className={sekundarKnapp} disabled={Boolean(visFasit)}>
              Hopp over
            </button>
          </div>
        </div>
      ) : (
        <div className="flex justify-center">
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

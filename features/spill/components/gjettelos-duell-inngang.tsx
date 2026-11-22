"use client"

import { Users } from "lucide-react"
import { Outfit } from "next/font/google"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { erGyldigKode, lagKode, normaliserKode } from "../lib/duell/rom"
import { lyder } from "../lib/lyd"

// The way into a Gjetteløs duel from the daily page, in the daily page's own quiet look: make a room, or join one
// with its code. The duel itself has the retro pixel look.

const skrift = Outfit({ subsets: ["latin"], display: "swap" })

export const GJ_DUELL_STI = "/spill/gjettelos/duell"

export function GjettelosDuellInngang() {
  const router = useRouter()
  const [kode, setKode] = useState("")
  const [feil, setFeil] = useState(false)
  return (
    <section className={`${skrift.className} mt-3 rounded-[28px] border border-white/[0.07] bg-[var(--spill-flate)] p-5`}>
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white/[0.05] text-neutral-700">
          <Users className="h-5 w-5" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <h2 className="text-[17px] font-semibold text-neutral-950">Duell med venner</h2>
          <p className="text-[13px] text-neutral-500">2–6 spillere, samme spørsmål samtidig</p>
        </div>
      </div>
      <p className="mt-3 text-sm leading-6 text-neutral-700">
        Alle gjetter på de samme tallene med klokka på, og så ser dere hvem som kom nærmest. Spørsmålene er fra tidligere dager, og duellen teller ikke i
        statistikken.
      </p>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <button
          type="button"
          className="inline-flex h-11 items-center justify-center rounded-2xl bg-neutral-950 px-5 text-[15px] font-semibold text-[#18191b] transition hover:bg-white active:scale-[0.99]"
          onClick={() => {
            lyder.velg()
            router.push(`${GJ_DUELL_STI}/${lagKode()}`)
          }}
        >
          Lag rom
        </button>
        <form
          className="flex min-w-0 flex-1 items-center gap-2"
          onSubmit={(e) => {
            e.preventDefault()
            const k = normaliserKode(kode)
            if (!erGyldigKode(k)) return setFeil(true)
            router.push(`${GJ_DUELL_STI}/${k}`)
          }}
        >
          <input
            value={kode}
            onChange={(e) => {
              setKode(e.target.value.toUpperCase().slice(0, 4))
              setFeil(false)
            }}
            maxLength={4}
            autoComplete="off"
            autoCapitalize="characters"
            spellCheck={false}
            placeholder="KODE"
            aria-label="Romkode"
            aria-invalid={feil}
            className="h-11 w-[92px] min-w-0 rounded-2xl border border-white/10 bg-[rgb(0_0_0/0.24)] px-2 text-center text-[16px] font-semibold tracking-[0.14em] text-neutral-950 uppercase outline-none placeholder:text-neutral-400 focus:border-white/35"
          />
          <button
            type="submit"
            className="inline-flex h-11 items-center justify-center rounded-2xl border border-white/10 px-4 text-[15px] font-semibold text-neutral-800 transition hover:border-white/30"
          >
            Bli med
          </button>
        </form>
      </div>
      {feil ? <p className="mt-2 text-[13px] text-rose-400">Koden er fire bokstaver, uten vokaler.</p> : null}
      <p className="mt-3 text-xs text-neutral-500">
        <Link href="/spill/dueller" className="underline-offset-4 hover:text-neutral-800 hover:underline">
          Utfordre venner eller se duell-innboks →
        </Link>
      </p>
    </section>
  )
}

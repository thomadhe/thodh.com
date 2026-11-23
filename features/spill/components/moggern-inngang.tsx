"use client"

import { ArrowRight, Camera, Lock, ShieldCheck, Users } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { erGyldigKode, lagKode, normaliserKode } from "../lib/duell/rom"
import { lyder } from "../lib/lyd"
import { SlikRegnesDet, TullSkjerm, useHarGodkjentTull } from "./moggern-forklaring"
import { Knapp, Kort } from "./spill-ramme"

export type MoggernBruker = {
  id: string
  visningsnavn: string
}

export function MoggernInngang({ bruker }: { bruker: MoggernBruker | null }) {
  const router = useRouter()
  const { godkjent, lastet } = useHarGodkjentTull()
  const [lokalGodkjent, setLokalGodkjent] = useState(false)
  const [kode, setKode] = useState("")
  const [feil, setFeil] = useState(false)

  const harGodkjent = godkjent || lokalGodkjent

  if (!lastet) {
    return (
      <div className="mx-auto w-full max-w-xl py-12 text-center font-mono text-xs text-neutral-500">
        Laster Moggern …
      </div>
    )
  }

  if (!harGodkjent) {
    return (
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-4">
        <TullSkjerm onGodkjenn={() => setLokalGodkjent(true)} />
      </div>
    )
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-5">
      <Kort className="border-white/10 p-6 sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-lime-400 text-neutral-950">
              <Camera className="h-6 w-6" aria-hidden="true" />
            </span>
            <div>
              <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-lime-400">1v1 kameraduell · kun venner</p>
              <h2 className="font-[family-name:var(--font-visning)] text-2xl font-extrabold tracking-tight text-neutral-950 sm:text-3xl">
                Klar for å mogge?
              </h2>
            </div>
          </div>

          {bruker ? (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/25 bg-emerald-400/10 px-3 py-1 font-mono text-xs text-emerald-300">
              <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
              {bruker.visningsnavn}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-400/25 bg-amber-400/10 px-3 py-1 font-mono text-xs text-amber-200">
              <Lock className="h-3.5 w-3.5" aria-hidden="true" />
              Krever innlogging
            </span>
          )}
        </div>

        <p className="mt-4 text-sm leading-6 text-neutral-700">
          Lag et privat rom og send lenken til én venn. Begge slår på kameraet i 10 sekunder, nettleseren regner ut 7 tullete proporsjonsmål, og
          høyeste poengsum tar tittelen. Videoen går direkte peer-to-peer og lagres aldri.
        </p>

        {!bruker ? (
          <div className="mt-5 rounded-2xl border border-amber-400/25 bg-amber-400/10 p-4">
            <p className="text-sm font-medium text-amber-100">Du må være innlogget for å slå på kameraet i Moggern.</p>
            <p className="mt-1 text-xs leading-5 text-amber-200/80">
              Bruk kontoen din på thodh.com (samme som Otsjoba/Karrierepiloten). Du kan også lage rom nå og logge inn først.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Link
                href="/logg-inn?neste=/spill/moggern"
                className="inline-flex h-10 items-center justify-center gap-2 rounded-full bg-lime-400 px-5 text-sm font-bold text-neutral-950 transition hover:bg-lime-300"
              >
                Logg inn
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
              <Link
                href="/registrer?neste=/spill/moggern"
                className="inline-flex h-10 items-center justify-center rounded-full border border-white/15 px-4 text-sm font-medium text-neutral-900 transition hover:bg-white/10"
              >
                Opprett konto
              </Link>
            </div>
          </div>
        ) : null}

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
          <Knapp
            onClick={() => {
              lyder.velg()
              router.push(`/spill/moggern/${lagKode()}`)
            }}
            className="w-full !bg-lime-400 !font-bold !text-neutral-950 hover:!bg-lime-300 sm:w-auto"
          >
            <Users className="h-4 w-4" aria-hidden="true" />
            Lag privat rom
          </Knapp>

          <form
            className="flex min-w-0 flex-1 items-center gap-2"
            onSubmit={(e) => {
              e.preventDefault()
              const k = normaliserKode(kode)
              if (!erGyldigKode(k)) {
                setFeil(true)
                return
              }
              lyder.velg()
              router.push(`/spill/moggern/${k}`)
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
              className="h-11 w-28 min-w-0 rounded-full border border-white/15 bg-black/30 px-3 text-center font-mono text-base font-bold tracking-[0.2em] text-neutral-950 uppercase outline-none placeholder:text-neutral-500 focus:border-lime-400"
            />
            <Knapp type="submit" variant="sekundar" className="shrink-0">
              Bli med
            </Knapp>
          </form>
        </div>

        {feil ? <p className="mt-2 text-xs text-rose-400">Romkoden er 4 konsonanter (ingen vokaler, f.eks. BCDF).</p> : null}

        <div className="mt-5 flex flex-wrap items-center justify-between gap-2 border-t border-white/10 pt-4 text-xs text-neutral-600">
          <span>Vil du sende direkte utfordring til en venn?</span>
          <div className="flex items-center gap-3 font-medium">
            <Link href="/spill/venner" className="text-neutral-900 underline underline-offset-4 hover:text-lime-700">
              Venneliste
            </Link>
            <Link href="/spill/dueller" className="text-neutral-900 underline underline-offset-4 hover:text-lime-700">
              Dueller →
            </Link>
          </div>
        </div>
      </Kort>

      <SlikRegnesDet />
    </div>
  )
}

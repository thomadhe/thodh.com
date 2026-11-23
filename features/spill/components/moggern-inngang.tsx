"use client"

import { ArrowRight, Camera, Lock, ShieldCheck, Trophy, Users } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { erGyldigKode, lagKode, normaliserKode } from "../lib/duell/rom"
import { lyder } from "../lib/lyd"
import { lesDagensBeste, type DagensBeste } from "../lib/moggern/duell-kort"
import { formaterMoggernPoeng } from "../lib/moggern/poeng"
import { rangForPoeng } from "../lib/moggern/tekster"
import { MFLATE, MKNAPP, MKNAPP_SEKUNDAR, SlikRegnesDet, TullSkjerm, useHarGodkjentTull } from "./moggern-forklaring"
import { useVisningsnavnSynk, VisningsnavnPille } from "./visningsnavn-pille"

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
  const [navn, setNavn] = useState(bruker?.visningsnavn ?? "")
  const [dagensBeste, setDagensBeste] = useState<DagensBeste | null>(null)
  useVisningsnavnSynk(setNavn)

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDagensBeste(lesDagensBeste())
  }, [])

  const harGodkjent = godkjent || lokalGodkjent

  if (!lastet) {
    return <div className="mx-auto w-full max-w-xl py-12 text-center text-xs text-neutral-500">Laster Moggern …</div>
  }

  if (!harGodkjent) {
    return (
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-4">
        <TullSkjerm onGodkjenn={() => setLokalGodkjent(true)} />
      </div>
    )
  }

  const dagensRang = dagensBeste ? rangForPoeng(dagensBeste.poeng) : null

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-4">
      <section className={`${MFLATE} mel-inn p-6 sm:p-8`}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-lime-300 text-[#18191b]">
              <Camera className="h-6 w-6" aria-hidden="true" />
            </span>
            <div>
              <p className="text-xs font-medium text-neutral-500">1v1 kameraduell · kun venner</p>
              <h2 className="text-[2rem] leading-[1.05] font-semibold tracking-[-0.04em] text-neutral-950 sm:text-[2.4rem]">Klar for å mogge?</h2>
            </div>
          </div>

          {bruker ? (
            <VisningsnavnPille
              navn={navn}
              onEndret={setNavn}
              plassering="under-hoyre"
              ikon={<ShieldCheck className="h-3.5 w-3.5 shrink-0 text-emerald-400" aria-hidden="true" />}
            />
          ) : (
            <span className="inline-flex h-8 items-center gap-1.5 rounded-full border border-amber-400/25 bg-amber-400/10 px-3 text-xs font-medium text-amber-200">
              <Lock className="h-3.5 w-3.5" aria-hidden="true" />
              Krever innlogging
            </span>
          )}
        </div>

        <p className="mt-5 text-[15px] leading-6 text-neutral-700">
          Lag et privat rom og send lenken til én venn — eller kjør en rask solo-test først. Kameraet starter av seg selv, live-poenget og
          rangtittelen dukker opp med en gang, og i duellen måler nettleseren 15 sekunder med 7 proporsjonsmål og mog-uttrykk. Høyeste poengsum tar
          tittelen. Videoen går direkte peer-to-peer og lagres aldri.
        </p>

        {dagensBeste && dagensRang ? (
          <div className="mt-4 inline-flex flex-wrap items-center gap-2 rounded-full border border-white/[0.08] bg-[#1f2124] py-1.5 pr-3.5 pl-3 text-xs">
            <Trophy className="h-3.5 w-3.5 text-lime-300" aria-hidden="true" />
            <span className="text-neutral-600">Dagens beste på denne enheten:</span>
            <strong className="font-semibold text-neutral-950 tabular-nums">{formaterMoggernPoeng(dagensBeste.poeng)}/10</strong>
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${dagensRang.farge}`}>{dagensRang.tittel}</span>
          </div>
        ) : null}

        {!bruker ? (
          <div className="mt-5 rounded-[22px] border border-amber-400/25 bg-amber-400/10 p-4">
            <p className="text-sm font-medium text-amber-100">Du må være innlogget for å slå på kameraet i Moggern.</p>
            <p className="mt-1 text-xs leading-5 text-amber-200/80">
              Bruk kontoen din på thodh.com (samme som Otsjoba/Karrierepiloten). Du kan også lage rom nå og logge inn først.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Link href="/logg-inn?neste=/spill/moggern" className={`${MKNAPP} !h-10 !px-5`}>
                Logg inn
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
              <Link href="/registrer?neste=/spill/moggern" className={`${MKNAPP_SEKUNDAR} !h-10`}>
                Opprett konto
              </Link>
            </div>
          </div>
        ) : null}

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
          <button
            type="button"
            onClick={() => {
              lyder.velg()
              router.push(`/spill/moggern/${lagKode()}`)
            }}
            className={`${MKNAPP} w-full sm:w-auto`}
          >
            <Users className="h-4 w-4" aria-hidden="true" />
            Lag privat rom
          </button>

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
              className="h-11 w-28 min-w-0 rounded-full border border-white/12 bg-[#1b1c1f] px-3 text-center text-base font-semibold tracking-[0.22em] text-neutral-950 uppercase tabular-nums outline-none placeholder:text-neutral-500 focus:border-white/40"
            />
            <button type="submit" className={`${MKNAPP_SEKUNDAR} shrink-0`}>
              Bli med
            </button>
          </form>
        </div>

        {feil ? <p className="mt-2 text-xs text-rose-300">Romkoden er 4 konsonanter (ingen vokaler, f.eks. BCDF).</p> : null}

        <div className="mt-6 flex flex-wrap items-center justify-between gap-2 border-t border-white/[0.07] pt-4 text-[13px] text-neutral-600">
          <span>Vil du sende direkte utfordring til en venn?</span>
          <div className="flex items-center gap-1">
            <Link href="/spill/venner" className="rounded-full px-3 py-1.5 font-medium text-neutral-900 transition hover:bg-white/[0.06]">
              Venneliste
            </Link>
            <Link href="/spill/dueller" className="rounded-full px-3 py-1.5 font-medium text-neutral-900 transition hover:bg-white/[0.06]">
              Dueller →
            </Link>
          </div>
        </div>
      </section>

      <SlikRegnesDet />
    </div>
  )
}

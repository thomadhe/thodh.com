"use client"

import { Camera, ShieldCheck, Trophy, User, Users } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { useSprak, useT } from "@/lib/sprak"
import { erGyldigKode, lagKode, normaliserKode, rensNavn } from "../lib/duell/rom"
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
  const sprak = useSprak()
  const t = useT()
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
    if (!bruker) {
      try {
        const lagret = rensNavn(localStorage.getItem("stegern:duell:navn") ?? "")
        if (lagret) setNavn(lagret)
      } catch {}
    }
  }, [bruker])

  const harGodkjent = godkjent || lokalGodkjent

  if (!lastet) {
    return <div className="mx-auto w-full max-w-xl py-12 text-center text-xs text-neutral-500">{t("Laster Moggern …", "Loading Moggern …")}</div>
  }

  if (!harGodkjent) {
    return (
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-4">
        <TullSkjerm onGodkjenn={() => setLokalGodkjent(true)} />
      </div>
    )
  }

  const dagensRang = dagensBeste ? rangForPoeng(dagensBeste.poeng, sprak) : null

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-4">
      <section className={`${MFLATE} mel-inn p-6 sm:p-8`}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-lime-300 text-[#18191b]">
              <Camera className="h-6 w-6" aria-hidden="true" />
            </span>
            <div>
              <p className="text-xs font-medium text-neutral-500">{t("1v1 kameraduell · kun venner", "1v1 camera duel · friends only")}</p>
              <h2 className="text-[2rem] leading-[1.05] font-semibold tracking-[-0.04em] text-neutral-950 sm:text-[2.4rem]">
                {t("Klar for å mogge?", "Ready to mog?")}
              </h2>
            </div>
          </div>

          <VisningsnavnPille
            navn={navn}
            onEndret={setNavn}
            kunLokal={!bruker}
            plassering="under-hoyre"
            ikon={
              bruker ? (
                <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-emerald-400" aria-hidden="true" />
              ) : (
                <User className="h-3.5 w-3.5 shrink-0 text-white/60" aria-hidden="true" />
              )
            }
          />
        </div>

        <p className="mt-5 text-[15px] leading-6 text-neutral-700">
          {t(
            "Lag et privat rom og send lenken til én venn — eller kjør en rask solo-test først. Kameraet starter av seg selv, live-poenget og rangtittelen dukker opp med en gang, og i duellen måler nettleseren 15 sekunder med 7 proporsjonsmål og mog-uttrykk. Høyeste poengsum tar tittelen. Videoen går direkte peer-to-peer og lagres aldri.",
            "Create a private room and send the link to a friend — or run a quick solo test first. Your camera starts automatically, your live score and rank title appear instantly, and the duel measures 15 seconds across 7 proportion metrics plus mog expressions. Highest score takes the crown. Video runs peer-to-peer and is never stored.",
          )}
        </p>

        {dagensBeste && dagensRang ? (
          <div className="mt-4 inline-flex flex-wrap items-center gap-2 rounded-full border border-white/[0.08] bg-[#1f2124] py-1.5 pr-3.5 pl-3 text-xs">
            <Trophy className="h-3.5 w-3.5 text-lime-300" aria-hidden="true" />
            <span className="text-neutral-600">{t("Dagens beste på denne enheten:", "Today’s best on this device:")}</span>
            <strong className="font-semibold text-neutral-950 tabular-nums">{formaterMoggernPoeng(dagensBeste.poeng, sprak)}/10</strong>
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${dagensRang.farge}`}>{dagensRang.tittel}</span>
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
            {t("Lag privat rom", "Create private room")}
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
              placeholder={t("KODE", "CODE")}
              aria-label={t("Romkode", "Room code")}
              aria-invalid={feil}
              className="h-11 w-28 min-w-0 rounded-full border border-white/12 bg-[#1b1c1f] px-3 text-center text-base font-semibold tracking-[0.22em] text-neutral-950 uppercase tabular-nums outline-none placeholder:text-neutral-500 focus:border-white/40"
            />
            <button type="submit" className={`${MKNAPP_SEKUNDAR} shrink-0`}>
              {t("Bli med", "Join")}
            </button>
          </form>
        </div>

        {feil ? (
          <p className="mt-2 text-xs text-rose-300">
            {t("Romkoden er 4 konsonanter (ingen vokaler, f.eks. BCDF).", "Room code is 4 consonants (no vowels, e.g. BCDF).")}
          </p>
        ) : null}

        {bruker ? (
          <div className="mt-6 flex flex-wrap items-center justify-between gap-2 border-t border-white/[0.07] pt-4 text-[13px] text-neutral-600">
            <span>{t("Vil du sende direkte utfordring til en venn?", "Want to send a direct challenge to a friend?")}</span>
            <div className="flex items-center gap-1">
              <Link href="/spill/venner" className="rounded-full px-3 py-1.5 font-medium text-neutral-900 transition hover:bg-white/[0.06]">
                {t("Venneliste", "Friends")}
              </Link>
              <Link href="/spill/dueller" className="rounded-full px-3 py-1.5 font-medium text-neutral-900 transition hover:bg-white/[0.06]">
                {t("Dueller →", "Duels →")}
              </Link>
            </div>
          </div>
        ) : null}
      </section>

      <SlikRegnesDet />
    </div>
  )
}

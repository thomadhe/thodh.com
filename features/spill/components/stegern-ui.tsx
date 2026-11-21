"use client"

import { useRouter } from "next/navigation"
import { useState, type ReactNode } from "react"
import { lyder } from "../lib/lyd"
import { hoppDm, meter, NIVAAER, SEKUNDER, type Nivaa } from "../lib/stegern"
import { erGyldigKode, lagKode, normaliserKode } from "../lib/stegern-duell"
import { Figur } from "./stegern-bane"

// Pixel UI pieces shared by the daily game and the duel.

export const DUELL_STI = "/spill/67-stegern/duell"

/** A tier as a small pixel tag: its name and the jump it gives. */
export function NivaaMerke({ n, finale = false, kort = false }: { n: Nivaa; finale?: boolean; kort?: boolean }) {
  return (
    <span className="px-merke shrink-0" style={{ background: NIVAAER[n].farge }}>
      {NIVAAER[n].navn}
      {kort ? null : <span className="font-medium">+{meter(hoppDm(n, finale)).replace(" m", "")}</span>}
    </span>
  )
}

/** The answer reveal: the most common and the rarest accepted answers. */
export function Avsloring({ vanligste, sjeldneste, antall, finale = false }: { vanligste: string[]; sjeldneste: string[]; antall: number; finale?: boolean }) {
  return (
    <dl className="space-y-1.5 text-[14px] leading-5">
      {vanligste.length ? (
        <div className="flex gap-2">
          <dt className="w-[78px] shrink-0 font-semibold text-[#7dd3fc]">Vanligst</dt>
          <dd className="min-w-0 text-[#d7defa]">{vanligste.join(", ")}</dd>
        </div>
      ) : null}
      {sjeldneste.length ? (
        <div className="flex gap-2">
          <dt className="w-[78px] shrink-0 font-semibold text-[#f0abfc]">Sjeldnest</dt>
          <dd className="min-w-0 text-[#d7defa]">{sjeldneste.join(", ")}</dd>
        </div>
      ) : null}
      <p className="text-[12px] text-[#a5b4e8]">
        {antall} godkjente svar{finale ? " · finalen teller 1,7×" : ""}
      </p>
    </dl>
  )
}

/** The countdown as fifteen blocks of two seconds that go out one by one. */
export function Klokke({ igjenMs }: { igjenMs: number }) {
  const pa = Math.ceil(Math.max(0, igjenMs) / 2000)
  return (
    <div className="px-klokke" data-snart={igjenMs <= 5000 ? "" : undefined} aria-hidden="true">
      {Array.from({ length: SEKUNDER / 2 }, (_, i) => (
        <span key={i} data-pa={i < pa ? "" : undefined} />
      ))}
    </div>
  )
}

/** Shares a text (the share sheet on phones, the clipboard elsewhere). */
export function DelKnapp({ tekst, children = "Del" }: { tekst: string; children?: ReactNode }) {
  const [kopiert, setKopiert] = useState(false)
  return (
    <button
      type="button"
      className="px-knapp px-knapp-cyan px-knapp-liten"
      onClick={async () => {
        try {
          if (navigator.share && matchMedia("(pointer: coarse)").matches) {
            await navigator.share({ text: tekst })
            return
          }
          await navigator.clipboard.writeText(tekst)
          setKopiert(true)
          setTimeout(() => setKopiert(false), 1800)
        } catch {
          // The share sheet was dismissed.
        }
      }}
    >
      {kopiert ? "Kopiert!" : children}
    </button>
  )
}

/** The way into a duel from the daily page: make a room, or join one with its code. */
export function DuellInngang() {
  const router = useRouter()
  const [kode, setKode] = useState("")
  const [feil, setFeil] = useState(false)
  return (
    <section className="px-panel px-panel-rosa px-hopp-inn p-4">
      <div className="flex items-center gap-3">
        <div className="flex shrink-0 -space-x-3" aria-hidden="true">
          <Figur farge={2} className="h-12" />
          <Figur farge={1} className="h-12" />
          <Figur farge={3} className="h-12" />
        </div>
        <div className="min-w-0">
          <p className="px-etikett text-[#ffb3ee]">2–6 spillere · sanntid</p>
          <h2 className="px-skrift text-[22px] leading-tight font-bold text-white">Duell med venner</h2>
        </div>
      </div>
      <p className="mt-2 text-sm leading-6 text-[#b9c3ea]">
        Alle får de samme fem spørsmålene samtidig, og lengste sum vinner. Spørsmålene er hentet fra tidligere dager, så ingenting fra dagens løp blir
        røpet.
      </p>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button
          type="button"
          className="px-knapp px-knapp-rosa"
          onClick={() => {
            lyder.velg()
            router.push(`${DUELL_STI}/${lagKode()}`)
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
            router.push(`${DUELL_STI}/${k}`)
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
            className="px-felt h-[46px] w-[96px] min-w-0 px-1 text-center tracking-[0.12em] uppercase"
          />
          <button type="submit" className="px-knapp px-knapp-mork">
            Bli med
          </button>
        </form>
      </div>
      {feil ? <p className="mt-2 text-[13px] font-medium text-[#fda4af]">Koden er fire bokstaver, uten vokaler.</p> : null}
    </section>
  )
}

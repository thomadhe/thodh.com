"use client"

import { Heart, Share2 } from "lucide-react"
import Link from "next/link"
import type { ReactNode } from "react"
import { figurFarge } from "../lib/duell/figur"
import type { Deltaker } from "../lib/duell/rom"
import { lyder } from "../lib/lyd"
import { NIVAAER } from "../lib/stegern"
import type { Modus } from "../lib/stegern-duell"
import {
  barMaks,
  gjeldende,
  LUNTE_GRENSER,
  MAKS_LIV,
  METER_GRENSER,
  pistolPlassering,
  rensInnstillinger,
  type Avslag,
  type Pistol,
  type PistolInnstillinger,
} from "../lib/stegern-pistol"
import { Pall } from "./duell/duell-ui"
import { Figur } from "./stegern-bane"
import { DelKnapp } from "./stegern-ui"

// Startpistolen's panels: the mode and settings in the lobby, the turn under the stage, and the podium.

export const AVSLAG_TEKST: Record<Avslag, string> = {
  "ikke-signert": "Svaret kom ikke fra serveren.",
  "feil-holder": "Det er ikke din tur lenger.",
  "feil-sporsmal": "Kategorien har byttet. Prøv igjen.",
  "for-sent": "For sent – pistolen rakk å gå av.",
  bom: "Ikke på lista. Prøv igjen!",
  "allerede-sagt": "Det er allerede sagt. Prøv noe annet!",
  ferdig: "Spillet er over.",
}

function Stepper({ navn, verdi, enhet, kan, endre }: { navn: string; verdi: string; enhet?: string; kan: boolean; endre: (steg: number) => void }) {
  return (
    <li className="flex items-center gap-1.5">
      <span className="px-etikett min-w-0 flex-1">{navn}</span>
      {kan ? (
        <button type="button" className="px-knapp px-knapp-mork px-knapp-liten !min-h-[30px] !px-2" onClick={() => endre(-1)} aria-label={`Mindre ${navn.toLowerCase()}`}>
          –
        </button>
      ) : null}
      <span className="px-tall w-[74px] text-center text-[14px] text-white">
        {verdi}
        {enhet ? <span className="text-[11px] text-[#9fb0dd]"> {enhet}</span> : null}
      </span>
      {kan ? (
        <button type="button" className="px-knapp px-knapp-mork px-knapp-liten !min-h-[30px] !px-2" onClick={() => endre(1)} aria-label={`Mer ${navn.toLowerCase()}`}>
          +
        </button>
      ) : null}
    </li>
  )
}

/** The host picks the mode, and for Startpistolen its settings; the others see what was picked. */
export function ModusVelger({ modus, innst, erVert, endre }: { modus: Modus; innst: PistolInnstillinger; erVert: boolean; endre: (modus: Modus, innst: PistolInnstillinger) => void }) {
  const sett = (m: Partial<PistolInnstillinger>) => {
    lyder.velg()
    endre(modus, rensInnstillinger({ ...innst, ...m }))
  }
  const valg: { id: Modus; navn: string; tekst: string }[] = [
    { id: "runder", navn: "Runder", tekst: "Fem spørsmål samtidig, lengste sum vinner." },
    { id: "pistol", navn: "Startpistolen", tekst: "Svar før pistolen går av. Sist på beina vinner." },
  ]
  return (
    <div>
      <p className="px-etikett mb-2">Spillmodus{erVert ? "" : " · verten velger"}</p>
      <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Spillmodus">
        {valg.map((v) => {
          const valgt = v.id === modus
          return (
            <button
              key={v.id}
              type="button"
              role="radio"
              aria-checked={valgt}
              disabled={!erVert}
              onClick={() => {
                if (valgt) return
                lyder.velg()
                endre(v.id, innst)
              }}
              className={`px-panel ${valgt ? "" : "px-panel-dempet"} p-2.5 text-left disabled:cursor-default ${valgt ? "" : "opacity-70"}`}
            >
              <span className={`px-skrift block text-[17px] leading-tight font-bold ${valgt ? "text-[#a3e635]" : "text-white"}`}>{v.navn}</span>
              <span className="mt-1 block text-[12px] leading-4 text-[#9fb0dd]">{v.tekst}</span>
            </button>
          )
        })}
      </div>
      {modus === "pistol" ? (
        <ul className="mt-3 grid gap-1.5">
          <Stepper navn="Liv ved start" verdi={"♥".repeat(innst.liv)} kan={erVert} endre={(s) => sett({ liv: innst.liv + s })} />
          <Stepper
            navn="Lunte, korteste"
            verdi={String(innst.lunteMin)}
            enhet="s"
            kan={erVert}
            endre={(s) => sett({ lunteMin: innst.lunteMin + s * LUNTE_GRENSER.steg, lunteMaks: Math.max(innst.lunteMaks, innst.lunteMin + s * LUNTE_GRENSER.steg + LUNTE_GRENSER.steg) })}
          />
          <Stepper navn="Lunte, lengste" verdi={String(innst.lunteMaks)} enhet="s" kan={erVert} endre={(s) => sett({ lunteMaks: innst.lunteMaks + s * LUNTE_GRENSER.steg })} />
          <Stepper navn="Nytt liv etter" verdi={String(innst.livMeter)} enhet="m" kan={erVert} endre={(s) => sett({ livMeter: innst.livMeter + s * METER_GRENSER.steg })} />
        </ul>
      ) : null}
    </div>
  )
}

/** The rules of Startpistolen in two sentences, for the lobby. */
export function PistolRegler({ innst }: { innst: PistolInnstillinger }) {
  return (
    <p>
      Den som har startpistolen, svarer på kategorien, og et gyldig svar som ingen har sagt, sender pistolen videre. Lunta er skjult, {innst.lunteMin}–
      {innst.lunteMaks} sekunder, og går den av, mister du et liv. Hoppene dine fyller livsmåleren: {innst.livMeter} meter gir et nytt liv, opptil {MAKS_LIV}.
      Spørsmålene er fra tidligere dager, og duellen teller ikke i statistikken din.
    </p>
  )
}

/** A pixel bar in the player's colour. */
function Livsmaler({ andel, farge }: { andel: number; farge: string }) {
  return (
    <span className="relative block h-[7px] w-full border-2 border-[#070a17] bg-[#1d2757]" aria-hidden="true">
      <span className="absolute inset-y-0 left-0 transition-[width] duration-300" style={{ width: `${Math.round(Math.min(1, andel) * 100)}%`, background: farge }} />
    </span>
  )
}

function Hjerter({ liv }: { liv: number }) {
  return (
    <span className="flex gap-0.5" aria-label={`${liv} liv`}>
      {Array.from({ length: MAKS_LIV }, (_, i) => (
        <Heart key={i} className={`h-3.5 w-3.5 ${i < liv ? "fill-[#f43f5e] text-[#f43f5e]" : "text-[#2a3566]"}`} strokeWidth={2.5} />
      ))}
    </span>
  )
}

export function PistolPanel({
  pistol,
  deltakere,
  meg,
  tilstede,
  skriver,
  skjema,
  melding,
}: {
  pistol: Pistol
  deltakere: Deltaker[]
  meg: string | null
  tilstede: ReadonlySet<string>
  /** What the holder is typing right now, as they type it. */
  skriver: string
  /** The answer field, when it is this player's turn. */
  skjema: ReactNode
  melding: string | null
}) {
  const q = gjeldende(pistol)
  const holder = deltakere.find((d) => d.id === pistol.holder)
  const minTur = pistol.holder === meg
  const levende = pistol.spillere.filter((s) => s.liv > 0).length
  const maks = barMaks(pistol.innst)
  return (
    <section className="px-panel p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="px-etikett">Kategori</p>
        <p className="px-etikett">
          {levende}/{pistol.spillere.length} igjen
        </p>
      </div>
      <p key={pistol.sp} className="px-skrift px-hopp-inn mt-1.5 text-[24px] leading-[1.15] font-semibold text-white">
        {q?.tekst}
      </p>
      <div className="mt-3 min-h-[60px]">
        {minTur ? (
          skjema
        ) : (
          <div className="flex items-center gap-2">
            {holder ? <Figur figur={holder.figur} className="h-10 w-[33px] shrink-0" /> : null}
            <div className="min-w-0">
              <p className="px-etikett text-[#fde047]">{holder?.navn ?? "Noen"} har pistolen</p>
              <p className="px-skrift truncate text-[20px] text-white">
                {skriver || <span className="px-blink text-[#4b5a92]">tenker …</span>}
              </p>
            </div>
          </div>
        )}
        {melding ? <p className="px-etikett mt-2 text-[#fb7185]">{melding}</p> : null}
      </div>
      {pistol.svar.length ? (
        <ul className="mt-3 flex flex-wrap gap-1" aria-label="Sagt i denne kategorien">
          {pistol.svar.map((s) => (
            <li key={s.tr} className="px-merke normal-case" style={{ background: NIVAAER[s.n].farge }}>
              {s.tr}
            </li>
          ))}
        </ul>
      ) : null}
      <ol className="mt-4 grid gap-1.5 border-t-[3px] border-dotted border-[#1d2757] pt-3">
        {pistol.spillere.map((s) => {
          const d = deltakere.find((x) => x.id === s.id)
          if (!d) return null
          const ute = s.liv === 0
          return (
            <li key={s.id} className={`flex items-center gap-2 ${ute ? "opacity-45" : ""}`}>
              <span className="h-3 w-3 shrink-0" style={{ background: figurFarge(d.figur) }} aria-hidden="true" />
              <span className={`px-skrift min-w-0 flex-1 truncate text-[16px] ${s.id === pistol.holder ? "text-[#fde047]" : "text-white"}`}>
                {d.navn}
                {s.id === meg ? <span className="text-[#8b9bd0]"> (deg)</span> : null}
                {!tilstede.has(s.id) && !ute ? <span className="text-[#8b9bd0]"> · borte</span> : null}
              </span>
              {ute ? <span className="px-merke bg-[#263370] text-[#c7d2fe]">Ute</span> : <Hjerter liv={s.liv} />}
              <span className="w-[64px] shrink-0">
                <Livsmaler andel={s.bar / maks} farge={figurFarge(d.figur)} />
              </span>
            </li>
          )
        })}
      </ol>
    </section>
  )
}

export function PistolSlutt({ pistol, deltakere, meg, erVert, vertNavn, spillIgjen }: { pistol: Pistol; deltakere: Deltaker[]; meg: string | null; erVert: boolean; vertNavn: string; spillIgjen: () => void }) {
  const plasser = pistolPlassering(pistol)
  const rader = plasser
    .map(({ id, plass }) => {
      const d = deltakere.find((x) => x.id === id)
      const s = pistol.spillere.find((x) => x.id === id)
      return d && s ? { id, navn: d.navn, figur: d.figur, plass, verdi: plass === 1 ? `${"♥".repeat(s.liv)} igjen` : "Ute" } : null
    })
    .filter((r): r is NonNullable<typeof r> => r !== null)
  const min = rader.find((r) => r.id === meg)
  const vinner = rader[0]
  const delTekst = [
    `6/7-stegern · Startpistolen · ${min ? `${min.plass}. plass av ${rader.length}` : `${rader.length} spillere`}`,
    ...rader.slice(0, 3).map((r) => `${["🥇", "🥈", "🥉"][r.plass - 1] ?? `${r.plass}.`} ${r.navn}`),
    "thodh.com/spill/67-stegern",
  ].join("\n")
  return (
    <div className="px-hopp-inn flex flex-col gap-4">
      <section className="px-panel px-panel-rosa p-4">
        <p className="px-etikett text-center text-[#ffb3ee]">Startpistolen er over</p>
        <div className="mt-3">
          <Pall rader={rader} verdiKlasse="px-skrift text-[13px]" />
        </div>
        <p className="px-skrift mt-4 text-center text-[18px] text-white">
          {min?.plass === 1 ? (
            <>
              Du står igjen <span className="px-neon px-neon-liten">alene</span>!
            </>
          ) : vinner ? (
            <>{vinner.navn} sto igjen sist.</>
          ) : null}
        </p>
        <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
          {erVert ? (
            <button type="button" className="px-knapp px-knapp-rosa" onClick={spillIgjen}>
              Spill igjen ▶
            </button>
          ) : (
            <p className="px-etikett w-full text-center">Venter på at {vertNavn} starter en ny runde</p>
          )}
          <DelKnapp tekst={delTekst}>
            <Share2 className="h-4 w-4" />
            Del
          </DelKnapp>
        </div>
      </section>
      <p className="text-center text-[13px] text-[#8b9bd0]">
        <Link href="/spill/67-stegern" className="underline decoration-dotted underline-offset-4 hover:text-white">
          Til dagens 6/7-stegern
        </Link>
      </p>
    </div>
  )
}

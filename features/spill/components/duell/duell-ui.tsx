"use client"

import { Check, ChevronLeft, ChevronRight, Copy, Crown, Shuffle } from "lucide-react"
import { useState, type ReactNode } from "react"
import { blaFigur, FIGUR_VALG, figurFarge, tilfeldigFigur, type Figur as FigurValg } from "../../lib/duell/figur"
import { MAKS_SPILLERE, MIN_SPILLERE, NAVN_MAKS, type Deltaker, type Tilstede } from "../../lib/duell/rom"
import { lyder } from "../../lib/lyd"
import { Figur, type Stemning } from "../stegern-bane"

// The pixel pieces every duel room shares: the room code with its invite link, the lobby with the figure editor,
// who has answered, and the podium. They use the px-* look from stegern-bane.css.

/** The room code, big, with the invite link. */
export function Romlinje({ kode, lenke, kompakt, delTekst }: { kode: string; lenke: string; kompakt: boolean; delTekst: string }) {
  const [kopiert, setKopiert] = useState(false)
  const del = async () => {
    try {
      if (navigator.share && matchMedia("(pointer: coarse)").matches) {
        await navigator.share({ title: "Duell", text: delTekst, url: lenke })
        return
      }
      await navigator.clipboard.writeText(lenke)
      setKopiert(true)
      setTimeout(() => setKopiert(false), 1800)
    } catch {}
  }
  return (
    <section className={`px-panel flex items-center justify-between gap-3 ${kompakt ? "px-3 py-2" : "p-3.5"}`}>
      <div className="min-w-0">
        <p className="px-etikett">Romkode</p>
        <p className={`px-neon leading-none tracking-[0.2em] ${kompakt ? "mt-1 text-[22px]" : "mt-1.5 text-[34px]"}`}>{kode}</p>
      </div>
      <button type="button" onClick={del} className="px-knapp px-knapp-cyan px-knapp-liten">
        {kopiert ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
        {kopiert ? "Kopiert!" : "Kopier lenke"}
      </button>
    </section>
  )
}

/** The figure editor: a big preview, and each option stepped through with arrows. */
export function FigurVelger({ figur, settFigur }: { figur: FigurValg; settFigur: (f: FigurValg) => void }) {
  const bla = (felt: keyof FigurValg, steg: number) => {
    lyder.velg()
    settFigur(blaFigur(figur, felt, steg))
  }
  return (
    <div className="flex items-stretch gap-3">
      <div className="flex w-[84px] shrink-0 flex-col items-center justify-between gap-2">
        <div className="flex h-[96px] w-full items-end justify-center border-b-[3px] border-[#1d2757] bg-[radial-gradient(closest-side,rgb(56_232_255/0.18),transparent)]">
          <Figur figur={figur} stemning="glad" className="h-[90px]" />
        </div>
        <button
          type="button"
          className="px-knapp px-knapp-mork px-knapp-liten w-full"
          onClick={() => {
            lyder.velg()
            settFigur(tilfeldigFigur())
          }}
          aria-label="Tilfeldig figur"
        >
          <Shuffle className="h-4 w-4" />
        </button>
      </div>
      <ul className="grid min-w-0 flex-1 gap-1">
        {FIGUR_VALG.map((v) => (
          <li key={v.felt} className="flex items-center gap-1">
            <span className="px-etikett w-[52px] shrink-0">{v.navn}</span>
            <button type="button" className="px-knapp px-knapp-mork px-knapp-liten !min-h-[32px] !px-1.5" onClick={() => bla(v.felt, -1)} aria-label={`Forrige ${v.navn.toLowerCase()}`}>
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="px-skrift flex min-w-0 flex-1 items-center justify-center gap-1.5 truncate text-center text-[15px] text-white">
              {v.felt === "kropp" ? <span className="h-2.5 w-2.5 shrink-0" style={{ background: figurFarge(figur) }} aria-hidden="true" /> : null}
              {v.valg[figur[v.felt]]}
            </span>
            <button type="button" className="px-knapp px-knapp-mork px-knapp-liten !min-h-[32px] !px-1.5" onClick={() => bla(v.felt, 1)} aria-label={`Neste ${v.navn.toLowerCase()}`}>
              <ChevronRight className="h-4 w-4" />
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}

export function Lobby({
  iRommet,
  meg,
  vertId,
  runde,
  navn,
  settNavn,
  figur,
  settFigur,
  klar,
  settKlar,
  antallKlare,
  kanStarte,
  starter,
  start,
  melding,
  info,
  innstillinger,
}: {
  iRommet: Tilstede[]
  meg: string | null
  vertId: string | null
  runde: number
  navn: string
  settNavn: (n: string) => void
  figur: FigurValg
  settFigur: (f: FigurValg) => void
  klar: boolean
  settKlar: (k: boolean) => void
  antallKlare: number
  kanStarte: boolean
  starter: boolean
  start: () => void
  melding: string | null
  /** The game's rules in a sentence or two, under the buttons. */
  info: ReactNode
  /** Room settings: shown to everyone, changeable by the host. */
  innstillinger?: ReactNode
}) {
  const erVert = meg === vertId
  const plasser = Math.max(MAKS_SPILLERE, iRommet.length)
  return (
    <section className="px-panel px-hopp-inn p-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="px-skrift text-[22px] leading-none font-bold text-white">Spillere</h2>
        <p className={`px-etikett ${antallKlare >= MIN_SPILLERE ? "text-[#a3e635]" : ""}`}>
          Klar {antallKlare}/{Math.min(iRommet.length, MAKS_SPILLERE)}
        </p>
      </div>
      <ul className="mt-3 grid gap-1.5">
        {Array.from({ length: plasser }, (_, i) => {
          const t = iRommet[i]
          if (!t)
            return (
              <li key={`ledig-${i}`} className="flex h-[30px] items-center gap-3 border-2 border-dashed border-[#1d2757] px-3">
                <span className="px-etikett text-[#3b4a85]">Ledig plass</span>
              </li>
            )
          const deg = t.id === meg
          const tilskuer = i >= MAKS_SPILLERE
          const erKlar = t.id === vertId || (t.klar && t.runde === runde)
          const f = deg ? figur : t.figur
          return (
            <li key={t.id} className={`px-panel px-panel-dempet flex h-[46px] items-center gap-2.5 pr-2 pl-1 ${deg ? "bg-[#14205a]" : ""}`}>
              <Figur figur={f} farge={i} sover={!erKlar} className="h-10 w-[33px] shrink-0" />
              <span className="h-3 w-3 shrink-0" style={{ background: figurFarge(f) }} aria-hidden="true" />
              <span className="px-skrift min-w-0 flex-1 truncate text-[17px] text-white">
                {t.navn || `Spiller ${i + 1}`}
                {deg ? <span className="text-[#8b9bd0]"> (deg)</span> : null}
              </span>
              {t.id === vertId ? (
                <span className="px-merke bg-[#facc15]">
                  <Crown className="h-3 w-3" />
                  Vert
                </span>
              ) : tilskuer ? (
                <span className="px-merke bg-[#263370] text-[#c7d2fe]">Ser på</span>
              ) : (
                <span className={`px-merke ${erKlar ? "bg-[#a3e635]" : "bg-[#263370] text-[#8b9bd0]"}`}>{erKlar ? "Klar" : "Venter"}</span>
              )}
            </li>
          )
        })}
      </ul>

      <div className="mt-4 border-t-[3px] border-dotted border-[#1d2757] pt-3">
        <p className="px-etikett mb-2">Din figur</p>
        <FigurVelger figur={figur} settFigur={settFigur} />
      </div>

      <div className="mt-4 flex gap-2">
        <input
          value={navn}
          onChange={(e) => settNavn(e.target.value)}
          maxLength={NAVN_MAKS}
          autoComplete="nickname"
          placeholder="Ditt navn"
          aria-label="Ditt navn"
          className="px-felt h-[46px] min-w-0 flex-1 px-3"
        />
        {erVert ? null : (
          <button
            type="button"
            className={`px-knapp ${klar ? "px-knapp-mork" : ""}`}
            onClick={() => {
              lyder.velg()
              settKlar(!klar)
            }}
            aria-pressed={klar}
          >
            {klar ? "Ikke klar" : "Klar ✓"}
          </button>
        )}
      </div>
      {innstillinger ? <div className="mt-4 border-t-[3px] border-dotted border-[#1d2757] pt-3">{innstillinger}</div> : null}
      {erVert ? (
        <div className="mt-3 space-y-2">
          <button type="button" className="px-knapp px-knapp-rosa w-full" disabled={!kanStarte || starter} onClick={start}>
            {starter ? "Starter …" : "Start duellen ▶"}
          </button>
          <p className="text-[13px] leading-5 text-[#8b9bd0]">
            {antallKlare >= MIN_SPILLERE
              ? "De som er klare, er med. De andre ser på og blir med i neste runde."
              : iRommet.length < MIN_SPILLERE
                ? "Del lenken eller koden. Du kan starte når minst én til er inne og har trykket klar."
                : "Venter på at minst én av de andre trykker klar."}
          </p>
        </div>
      ) : (
        <p className="mt-3 text-[13px] leading-5 text-[#8b9bd0]">{klar ? "Venter på at verten starter." : "Trykk klar når du er med. Navnet er valgfritt."}</p>
      )}
      {melding ? <p className="px-etikett mt-2 text-[#fb7185]">{melding}</p> : null}
      <div className="mt-4 border-t-[3px] border-dotted border-[#1d2757] pt-3 text-[13px] leading-5 text-[#8b9bd0]">{info}</div>
    </section>
  )
}

/** Who has answered the open question, as small chips in their colours. */
export function HarSvart({ deltakere, har, tilstede }: { deltakere: Deltaker[]; har: (id: string) => boolean; tilstede: ReadonlySet<string> }) {
  const svarte = deltakere.filter((d) => har(d.id)).length
  return (
    <div className="mt-4 flex items-center justify-between gap-2 border-t-[3px] border-dotted border-[#1d2757] pt-3">
      <ul className="flex min-w-0 flex-wrap gap-1.5">
        {deltakere.map((d) => {
          const h = har(d.id)
          const borte = !tilstede.has(d.id)
          return (
            <li key={d.id} className={`px-merke ${h ? "" : "opacity-45"}`} style={{ background: figurFarge(d.figur) }} title={borte ? `${d.navn} er borte` : undefined}>
              {h ? <Check className="h-3 w-3" /> : null}
              <span className="max-w-[72px] truncate normal-case">{d.navn}</span>
            </li>
          )
        })}
      </ul>
      <p className="px-etikett shrink-0">
        {svarte}/{deltakere.length} svar
      </p>
    </div>
  )
}

export type Pallrad = { id: string; navn: string; figur: FigurValg; plass: number; verdi: string }

/** The podium: second, first, third, each figure on a block in its colour, the score under the name. */
export function Pall({ rader, verdiKlasse = "px-skrift text-[14px]" }: { rader: Pallrad[]; verdiKlasse?: string }) {
  const pall = [rader[1], rader[0], rader[2]]
  const hoyde = (plass: number) => [76, 52, 36][plass - 1] ?? 28
  const stemning = (plass: number): Stemning => (plass === 1 ? "glad" : "vanlig")
  return (
    <div className="grid grid-cols-3 items-end gap-2">
      {pall.map((p, i) =>
        p ? (
          <div key={p.id} className="flex min-w-0 flex-col items-center">
            {p.plass === 1 ? <Crown className="px-svev mb-0.5 h-5 w-5 text-[#facc15]" aria-hidden="true" /> : null}
            <Figur figur={p.figur} stemning={stemning(p.plass)} className="h-14 w-[46px]" />
            <p className="px-skrift mt-1 w-full truncate text-center text-[15px] text-white">{p.navn}</p>
            <p className={`${verdiKlasse} tabular-nums text-[#c7d2fe]`}>{p.verdi}</p>
            <div
              className="mt-1 flex w-full items-start justify-center pt-1.5"
              style={{
                height: hoyde(p.plass),
                background: `linear-gradient(180deg, ${figurFarge(p.figur)}, ${figurFarge(p.figur)}99)`,
                boxShadow: "inset 0 3px 0 rgb(255 255 255 / 0.4), inset 0 -4px 0 rgb(0 0 0 / 0.25)",
              }}
            >
              <span className="px-skrift text-[24px] leading-none font-bold text-[#0b1020]">{p.plass}</span>
            </div>
          </div>
        ) : (
          <div key={`tom-${i}`} />
        ),
      )}
    </div>
  )
}

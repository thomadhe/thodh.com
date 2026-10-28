"use client"

import Link from "next/link"
import { useState, type ReactNode } from "react"
import { formaterDato, iDagOslo, leggTilDager, START_DATO } from "../lib/dag"
import { finnSpill, type SpillId } from "../lib/spill"
import { Kalender } from "./kalender"

type Panel = "kalender" | "regler" | null

const storForbokstav = (t: string) => t.charAt(0).toUpperCase() + t.slice(1)

export function SpillRamme({
  spillId,
  dato,
  children,
  regler,
}: {
  spillId: SpillId
  dato: string
  children: ReactNode
  /** Extra how-to content under the one-line rule. */
  regler?: ReactNode
}) {
  const info = finnSpill(spillId)
  const [panel, setPanel] = useState<Panel>(null)
  const iDag = iDagOslo()
  const erIDag = dato === iDag
  const forrige = leggTilDager(dato, -1)
  const neste = leggTilDager(dato, 1)
  const lenke = (d: string) => (d === iDag ? info.href : `${info.href}?dato=${d}`)
  const veksle = (p: Exclude<Panel, null>) => setPanel((n) => (n === p ? null : p))

  return (
    <div className="page-grid min-h-dvh">
      <div className="mx-auto flex min-h-dvh w-full max-w-lg flex-col px-4 sm:px-6">
        <header className="flex items-center justify-between gap-3 border-b border-black/5 py-4">
          <Link
            href="/spill"
            className="font-mono text-[11px] uppercase tracking-widest text-neutral-500 transition-colors hover:text-neutral-900"
          >
            ← Spill
          </Link>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => veksle("regler")}
              aria-expanded={panel === "regler"}
              className={`h-8 rounded-full px-3 font-mono text-[11px] uppercase tracking-widest transition ${
                panel === "regler" ? "bg-neutral-900 text-white" : "text-neutral-500 hover:bg-black/5 hover:text-neutral-900"
              }`}
            >
              Slik spiller du
            </button>
            <button
              type="button"
              onClick={() => veksle("kalender")}
              aria-expanded={panel === "kalender"}
              className={`h-8 rounded-full px-3 font-mono text-[11px] uppercase tracking-widest transition ${
                panel === "kalender" ? "bg-neutral-900 text-white" : "text-neutral-500 hover:bg-black/5 hover:text-neutral-900"
              }`}
            >
              Kalender
            </button>
          </div>
        </header>

        <div className="flex items-center gap-3 pt-6">
          <span
            aria-hidden="true"
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-lg font-semibold ${info.farge}`}
          >
            {info.ikon}
          </span>
          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-semibold tracking-tight text-neutral-950">{info.navn}</h1>
            <p className="mt-0.5 font-mono text-[11px] text-neutral-500">
              {storForbokstav(formaterDato(dato))}
              {erIDag ? " · i dag" : " · fra arkivet"}
            </p>
          </div>
          <nav className="flex items-center gap-1" aria-label="Bytt dag">
            {dato > START_DATO ? (
              <Link
                href={lenke(forrige)}
                className="flex h-8 w-8 items-center justify-center rounded-full text-neutral-500 transition hover:bg-black/5 hover:text-neutral-900"
                aria-label="Forrige dag"
              >
                ‹
              </Link>
            ) : null}
            {!erIDag ? (
              <Link
                href={lenke(neste)}
                className="flex h-8 w-8 items-center justify-center rounded-full text-neutral-500 transition hover:bg-black/5 hover:text-neutral-900"
                aria-label="Neste dag"
              >
                ›
              </Link>
            ) : null}
          </nav>
        </div>

        {panel ? (
          <div className="mt-4 rounded-3xl border border-black/5 bg-white p-5 shadow-sm">
            {panel === "kalender" ? (
              <Kalender spillIder={[spillId]} href={info.href} valgt={dato} />
            ) : (
              <div className="space-y-3 text-sm leading-6 text-neutral-600">
                <p className="text-neutral-900">{info.regel}</p>
                {regler}
                <p className="font-mono text-[11px] text-neutral-400">
                  Nytt spill hver dag ved midnatt. Bruk kalenderen for å spille dager du har gått glipp av.
                </p>
              </div>
            )}
          </div>
        ) : null}

        <main className="flex flex-1 flex-col py-6">{children}</main>
      </div>
    </div>
  )
}

export function Kort({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-3xl border border-black/5 bg-white ${className}`}>{children}</div>
}

export function Knapp({
  children,
  className = "",
  variant = "primar",
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primar" | "sekundar" }) {
  const v =
    variant === "primar"
      ? "bg-neutral-950 text-white hover:bg-neutral-800 disabled:bg-neutral-300"
      : "border border-black/10 bg-white text-neutral-800 hover:bg-neutral-50 disabled:text-neutral-300"
  return (
    <button
      type="button"
      {...rest}
      className={`inline-flex h-11 items-center justify-center gap-2 rounded-full px-5 text-sm font-medium transition active:scale-[0.98] disabled:cursor-not-allowed ${v} ${className}`}
    >
      {children}
    </button>
  )
}

/** Copies a result summary to the clipboard (or opens the native share sheet on mobile). */
export function DelKnapp({ tekst }: { tekst: string }) {
  const [kopiert, setKopiert] = useState(false)
  return (
    <Knapp
      variant="sekundar"
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
          // The user dismissed the share sheet.
        }
      }}
    >
      {kopiert ? "Kopiert ✓" : "Del resultat"}
    </Knapp>
  )
}

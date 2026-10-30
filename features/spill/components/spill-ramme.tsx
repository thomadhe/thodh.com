"use client"

import { ArrowLeft, CalendarDays, ChevronLeft, ChevronRight, CircleHelp } from "lucide-react"
import Link from "next/link"
import { useState, type ReactNode } from "react"
import { formaterDato, iDagOslo, leggTilDager, START_DATO } from "../lib/dag"
import { finnSpill, type QuizId, type SpillId } from "../lib/spill"
import { Kalender } from "./kalender"
import { visningsskrift } from "./skrift"

type Panel = "kalender" | "regler" | null

const ikonKnapp =
  "flex h-9 w-9 items-center justify-center rounded-full text-neutral-500 transition hover:bg-black/5 hover:text-neutral-900 aria-expanded:bg-neutral-900 aria-expanded:text-neutral-50"

/**
 * Page chrome shared by the games: back to the desktop, title, and (for daily games) day switching
 * and the calendar. Quizzes without a daily puzzle leave out `dato`.
 */
export function SpillRamme({
  spillId,
  dato,
  children,
  regler,
  bred = false,
}: {
  spillId: SpillId | QuizId
  dato?: string
  children: ReactNode
  /** Extra how-to content under the one-line rule. */
  regler?: ReactNode
  /** Wider column for map games. */
  bred?: boolean
}) {
  const info = finnSpill(spillId)
  const [panel, setPanel] = useState<Panel>(null)
  const iDag = iDagOslo()
  const lenke = (d: string) => (d === iDag ? info.href : `${info.href}?dato=${d}`)
  const veksle = (p: Exclude<Panel, null>) => setPanel((n) => (n === p ? null : p))

  return (
    <div className={`spill-mork ${visningsskrift.variable} min-h-dvh`}>
      <div className={`mx-auto flex min-h-dvh w-full flex-col px-4 sm:px-6 ${bred ? "max-w-5xl" : "max-w-lg"}`}>
        <header className="flex items-center gap-2 pt-4">
          <Link href="/" className={ikonKnapp} aria-label="Til skrivebordet">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <span
            aria-hidden="true"
            className={`ml-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-sm font-semibold ${info.farge}`}
          >
            {info.ikon}
          </span>
          <h1 className="min-w-0 flex-1 truncate font-[family-name:var(--font-visning)] text-lg font-extrabold tracking-[-0.04em] text-neutral-950">
            {info.navn}
          </h1>
          {dato ? (
            <nav className="flex items-center" aria-label="Bytt dag">
              {dato > START_DATO ? (
                <Link href={lenke(leggTilDager(dato, -1))} className={ikonKnapp} aria-label="Forrige dag">
                  <ChevronLeft className="h-4 w-4" />
                </Link>
              ) : null}
              <button
                type="button"
                onClick={() => veksle("kalender")}
                aria-expanded={panel === "kalender"}
                className="flex h-9 items-center gap-1.5 rounded-full px-2.5 font-mono text-[11px] text-neutral-500 transition hover:bg-black/5 hover:text-neutral-900 aria-expanded:bg-neutral-900 aria-expanded:text-neutral-50"
              >
                <CalendarDays className="h-4 w-4" />
                <span className="max-sm:sr-only">{dato === iDag ? "I dag" : formaterDato(dato).replace(/^\S+ /, "")}</span>
              </button>
              {dato !== iDag ? (
                <Link href={lenke(leggTilDager(dato, 1))} className={ikonKnapp} aria-label="Neste dag">
                  <ChevronRight className="h-4 w-4" />
                </Link>
              ) : null}
            </nav>
          ) : null}
          <button
            type="button"
            onClick={() => veksle("regler")}
            aria-expanded={panel === "regler"}
            aria-label="Slik spiller du"
            className={ikonKnapp}
          >
            <CircleHelp className="h-4 w-4" />
          </button>
        </header>

        {panel ? (
          <div className="mt-4 rounded-3xl border border-black/5 bg-[var(--spill-flate)] p-5 shadow-sm">
            {panel === "kalender" && dato ? (
              <Kalender spillIder={[spillId as SpillId]} href={info.href} valgt={dato} />
            ) : (
              <div className="space-y-3 text-sm leading-6 text-neutral-600">
                <p className="text-neutral-900">{info.regel}</p>
                {regler}
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
  return <div className={`rounded-3xl border border-black/5 bg-[var(--spill-flate)] ${className}`}>{children}</div>
}

export function Knapp({
  children,
  className = "",
  variant = "primar",
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primar" | "sekundar" }) {
  const v =
    variant === "primar"
      ? "bg-neutral-950 text-neutral-50 hover:bg-neutral-800 disabled:bg-neutral-300"
      : "border border-black/10 bg-[var(--spill-flate)] text-neutral-800 hover:bg-neutral-50 disabled:text-neutral-300"
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

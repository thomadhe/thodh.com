"use client"

import { ArrowLeft, CalendarDays, ChevronLeft, ChevronRight, CircleHelp, Volume2, VolumeX } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useState, useSyncExternalStore, type ReactNode } from "react"
import { SprakKnapp } from "@/components/sprak-knapp"
import { useSprak, useT } from "@/lib/sprak"
import { formaterDato, iDagOslo, leggTilDager, START_DATO } from "../lib/dag"
import { settLyd, useLydPa } from "../lib/lyd"
import { finnSpill, spillTekst, type DuellSpillId, type QuizId, type SpillId } from "../lib/spill"
import { Kalender } from "./kalender"
import { visningsskrift } from "./skrift"
import { StegernLogo } from "./stegern-logo"

type Panel = "kalender" | "regler" | null

const ingenEndring = () => () => {}

/** Games with a drawn logo in the header tile instead of the `ikon` glyph. */
const logoer: Partial<Record<SpillId | QuizId | DuellSpillId, ReactNode>> = {
  "67-stegern": <StegernLogo className="h-7 w-7" />,
}

const ikonKnapp =
  "flex h-9 w-9 items-center justify-center rounded-full text-neutral-500 transition hover:bg-black/5 hover:text-neutral-900 aria-expanded:bg-neutral-900 aria-expanded:text-neutral-50"

/**
 * Page chrome shared by the games: back to the desktop, title, and (for daily games) day switching
 * and the calendar. Quizzes without a daily puzzle leave out `dato`.
 */
export function SpillRamme({
  spillId,
  dato,
  iDag: erIDag = false,
  children,
  regler,
  bred = false,
  fullbredde = false,
  klasse = "",
}: {
  spillId: SpillId | QuizId | DuellSpillId
  dato?: string
  /** Whether this is today's puzzle. Proxy decides it per request; the cached page must not read the clock. */
  iDag?: boolean
  children: ReactNode
  /** Extra how-to content under the one-line rule. */
  regler?: ReactNode
  /** Wider column for map games. */
  bred?: boolean
  /** Edge-to-edge full-viewport layout for camera duels. */
  fullbredde?: boolean
  /** Extra classes on the page root, for a game with its own look. */
  klasse?: string
}) {
  const sprak = useSprak()
  const t = useT()
  const info = finnSpill(spillId)
  const tekst = spillTekst(info, sprak)
  const forste = info.start ?? START_DATO
  const [panel, setPanel] = useState<Panel>(null)
  const router = useRouter()
  // The clock is read only in the browser, after hydration: an earlier day's page is the same HTML whenever it is
  // served, and only uses today's date to link "next day" to the plain address when that day is today.
  const klientIDag = useSyncExternalStore(ingenEndring, iDagOslo, () => null)
  const iDag = erIDag ? dato : klientIDag
  const lenke = (d: string) => (d === iDag ? info.href : `${info.href}?dato=${d}`)
  const veksle = (p: Exclude<Panel, null>) => setPanel((n) => (n === p ? null : p))

  useEffect(() => {
    // Today's page, prefetched before midnight, can still be in the router cache: fetch the new day's instead.
    if (erIDag && dato && iDagOslo() > dato) router.refresh()
  }, [erIDag, dato, router])

  return (
    <div className={`spill-mork ${visningsskrift.variable} min-h-dvh ${klasse}`}>
      <div
        className={`mx-auto flex min-h-dvh w-full flex-col ${
          fullbredde ? "px-2 sm:px-3" : bred ? "max-w-5xl px-4 sm:px-6" : "max-w-lg px-4 sm:px-6"
        }`}
      >
        <header className={`flex items-center gap-1.5 sm:gap-2 ${fullbredde ? "pt-2" : "pt-4"}`}>
          <Link href="/" className={ikonKnapp} aria-label={t("Til skrivebordet", "Back to desktop")}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <span
            aria-hidden="true"
            className={`ml-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-sm font-semibold ${info.farge}`}
          >
            {logoer[spillId] ?? info.ikon}
          </span>
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <h1 className="min-w-0 truncate font-[family-name:var(--font-visning)] text-lg font-extrabold tracking-[-0.04em] text-neutral-950">
              {tekst.navn}
            </h1>
            {sprak === "en" && info.norskInnhold ? (
              <span
                className="hidden shrink-0 items-center rounded-full border border-white/10 bg-white/[0.06] px-2 py-0.5 font-mono text-[10px] font-medium text-neutral-400 sm:inline-flex"
                title="Puzzle questions and answers in this game are in Norwegian"
              >
                🇳🇴 NO content
              </span>
            ) : null}
          </div>
          {dato ? (
            <nav className="flex items-center" aria-label={t("Bytt dag", "Change day")}>
              {dato > forste ? (
                <Link href={lenke(leggTilDager(dato, -1))} className={ikonKnapp} aria-label={t("Forrige dag", "Previous day")}>
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
                <span className="max-sm:sr-only">{dato === iDag ? t("I dag", "Today") : formaterDato(dato, "lang", sprak).replace(/^\S+ /, "")}</span>
              </button>
              {dato !== iDag ? (
                <Link href={lenke(leggTilDager(dato, 1))} className={ikonKnapp} aria-label={t("Neste dag", "Next day")}>
                  <ChevronRight className="h-4 w-4" />
                </Link>
              ) : null}
            </nav>
          ) : null}
          <LydKnapp />
          <button
            type="button"
            onClick={() => veksle("regler")}
            aria-expanded={panel === "regler"}
            aria-label={t("Slik spiller du", "How to play")}
            className={ikonKnapp}
          >
            <CircleHelp className="h-4 w-4" />
          </button>
          <SprakKnapp variant="mork" />
        </header>

        {sprak === "en" && info.norskInnhold ? (
          <p className="mt-2 inline-flex items-center gap-1.5 self-start rounded-full border border-white/10 bg-white/[0.05] px-2.5 py-0.5 font-mono text-[10px] text-neutral-400 sm:hidden">
            🇳🇴 Norwegian puzzle content
          </p>
        ) : null}

        {panel ? (
          <div className="mt-4 rounded-3xl border border-black/5 bg-[var(--spill-flate)] p-5 shadow-sm">
            {panel === "kalender" && dato ? (
              <Kalender spillIder={[spillId as SpillId]} href={info.href} valgt={dato} />
            ) : (
              <div className="space-y-3 text-sm leading-6 text-neutral-600">
                <p className="text-neutral-900">{tekst.regel}</p>
                {sprak === "en" && info.norskInnhold ? (
                  <p className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs text-neutral-500">
                    🇳🇴 Note: The daily questions/answers in this game are in Norwegian.
                  </p>
                ) : null}
                {regler}
              </div>
            )}
          </div>
        ) : null}

        <main className={`flex min-w-0 flex-1 flex-col ${fullbredde ? "py-2" : "py-6"}`}>{children}</main>
      </div>
    </div>
  )
}

/** Sound effects on/off, shared by every game. */
function LydKnapp() {
  const t = useT()
  const pa = useLydPa()
  return (
    <button
      type="button"
      onClick={() => settLyd(!pa)}
      className={ikonKnapp}
      aria-label={pa ? t("Slå av lyd", "Mute sound") : t("Slå på lyd", "Unmute sound")}
      title={pa ? t("Lyd på", "Sound on") : t("Lyd av", "Sound off")}
    >
      {pa ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
    </button>
  )
}

/** Low-key secondary actions (hint, skip, give up): a soft outline so they read as buttons without shouting. */
export const sekundarKnapp =
  "rounded-full border border-black/10 bg-neutral-100/70 px-3.5 py-1.5 font-mono text-[11px] uppercase tracking-widest text-neutral-700 transition hover:border-black/25 hover:bg-neutral-100 hover:text-neutral-950 disabled:opacity-40"

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
  const t = useT()
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
      {kopiert ? t("Kopiert ✓", "Copied ✓") : t("Del resultat", "Share result")}
    </Knapp>
  )
}

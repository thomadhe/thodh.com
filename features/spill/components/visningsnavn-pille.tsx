"use client"

import { Check, Loader2, Pencil, X } from "lucide-react"
import { useEffect, useId, useRef, useState } from "react"
import { validerVisningsnavn, VISNINGSNAVN_MAKS, type ProfilInfo } from "../lib/sosial"

/** Fired on window after a successful save so every pill on the page shows the new name at once. */
export const VISNINGSNAVN_HENDELSE = "spill:visningsnavn-endret"

/** Saves a display name via POST /spill/api/profil. Returns the stored name or throws a Norwegian message. */
export async function lagreVisningsnavn(navn: string): Promise<string> {
  const vurdert = validerVisningsnavn(navn)
  if (!vurdert.ok) throw new Error(vurdert.feil)
  let svar: Response
  try {
    svar = await fetch("/spill/api/profil", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ visningsnavn: vurdert.navn }),
    })
  } catch {
    throw new Error("Nettverksfeil. Prøv igjen.")
  }
  const data = (await svar.json().catch(() => ({}))) as { profil?: ProfilInfo; melding?: string }
  if (!svar.ok || !data.profil?.visningsnavn) throw new Error(data.melding ?? "Klarte ikke å lagre visningsnavnet.")
  const lagret = data.profil.visningsnavn
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(VISNINGSNAVN_HENDELSE, { detail: lagret }))
  }
  return lagret
}

/**
 * Clickable display-name pill with a sleek inline editor (2 clicks: tap name → type → Enter).
 * Uses only white/hex colours so it looks identical on `.spill-mork` game pages and the plain dark social pages.
 */
export function VisningsnavnPille({
  navn,
  onEndret,
  ikon,
  etikett,
  plassering = "under-venstre",
  storrelse = "normal",
  className = "",
}: {
  navn: string | null
  onEndret?: (nytt: string) => void
  /** Leading icon (e.g. a shield or crown). */
  ikon?: React.ReactNode
  /** Suffix shown after the name, e.g. "(deg)". */
  etikett?: string
  /** Where the editor pops up relative to the pill. */
  plassering?: "under-venstre" | "under-hoyre" | "under-midt" | "over-venstre"
  storrelse?: "normal" | "liten"
  className?: string
}) {
  const [aapen, setAapen] = useState(false)
  const [utkast, setUtkast] = useState("")
  const [lagrer, setLagrer] = useState(false)
  const [feil, setFeil] = useState<string | null>(null)
  const [lagretNa, setLagretNa] = useState(false)
  const feltRef = useRef<HTMLInputElement | null>(null)
  const rotRef = useRef<HTMLDivElement | null>(null)
  const feltId = useId()

  useEffect(() => {
    if (!aapen) return
    feltRef.current?.focus()
    feltRef.current?.select()
    const lukkVedKlikkUtenfor = (e: PointerEvent) => {
      if (rotRef.current && !rotRef.current.contains(e.target as Node)) setAapen(false)
    }
    window.addEventListener("pointerdown", lukkVedKlikkUtenfor)
    return () => window.removeEventListener("pointerdown", lukkVedKlikkUtenfor)
  }, [aapen])

  const aapne = () => {
    setUtkast(navn ?? "")
    setFeil(null)
    setAapen(true)
  }

  const lagre = async () => {
    const vurdert = validerVisningsnavn(utkast)
    if (!vurdert.ok) {
      setFeil(vurdert.feil)
      return
    }
    if (vurdert.navn === navn) {
      setAapen(false)
      return
    }
    setLagrer(true)
    setFeil(null)
    try {
      const lagret = await lagreVisningsnavn(vurdert.navn)
      onEndret?.(lagret)
      setAapen(false)
      setLagretNa(true)
      window.setTimeout(() => setLagretNa(false), 1600)
    } catch (e) {
      setFeil((e as Error).message)
    } finally {
      setLagrer(false)
    }
  }

  const liten = storrelse === "liten"
  const posisjon =
    plassering === "under-hoyre"
      ? "right-0 top-full mt-2"
      : plassering === "under-midt"
        ? "left-1/2 top-full mt-2 -translate-x-1/2"
        : plassering === "over-venstre"
          ? "left-0 bottom-full mb-2"
          : "left-0 top-full mt-2"
  const gyldigUtkast = validerVisningsnavn(utkast).ok

  return (
    <div ref={rotRef} className={`relative inline-flex min-w-0 ${className}`}>
      <button
        type="button"
        onClick={() => (aapen ? setAapen(false) : aapne())}
        aria-expanded={aapen}
        aria-haspopup="dialog"
        title="Endre visningsnavn"
        className={`group inline-flex min-w-0 max-w-full items-center gap-1.5 rounded-full border border-white/10 bg-[#111214]/70 font-medium text-white backdrop-blur-md transition hover:border-white/25 hover:bg-[#111214]/85 focus-visible:ring-2 focus-visible:ring-white/40 focus-visible:outline-none ${
          liten ? "h-7 px-2.5 text-[11px]" : "h-8 px-3 text-xs"
        }`}
      >
        {ikon}
        <span className="truncate">{navn || "Velg visningsnavn"}</span>
        {etikett ? <span className="shrink-0 text-white/50">{etikett}</span> : null}
        {lagretNa ? (
          <Check className="h-3.5 w-3.5 shrink-0 text-lime-300" aria-hidden="true" />
        ) : (
          <Pencil className="h-3 w-3 shrink-0 text-white/45 transition group-hover:text-white" aria-hidden="true" />
        )}
        <span className="sr-only">– endre visningsnavn</span>
      </button>

      {aapen ? (
        <div
          role="dialog"
          aria-label="Endre visningsnavn"
          className={`absolute z-50 w-[min(19rem,calc(100vw-2rem))] rounded-[22px] border border-white/[0.09] bg-[#1d1f22]/95 p-3 text-white shadow-[0_18px_48px_rgb(0_0_0/0.45)] backdrop-blur-xl ${posisjon}`}
        >
          <form
            onSubmit={(e) => {
              e.preventDefault()
              void lagre()
            }}
            className="flex flex-col gap-2"
          >
            <label htmlFor={feltId} className="px-1 text-[11px] font-medium tracking-wide text-white/55">
              Visningsnavn
            </label>
            <div className="flex items-center gap-1.5">
              <input
                ref={feltRef}
                id={feltId}
                value={utkast}
                onChange={(e) => {
                  setUtkast(e.target.value)
                  setFeil(null)
                }}
                onKeyDown={(e) => {
                  if (e.key === "Escape") {
                    e.preventDefault()
                    setAapen(false)
                  }
                }}
                maxLength={VISNINGSNAVN_MAKS}
                autoComplete="nickname"
                spellCheck={false}
                placeholder="f.eks. Tommogger"
                aria-invalid={!!feil}
                className="h-10 min-w-0 flex-1 rounded-full border border-white/12 bg-[#111214] px-3.5 text-sm text-white outline-none placeholder:text-white/30 focus:border-white/40"
              />
              <button
                type="submit"
                disabled={lagrer || !gyldigUtkast}
                aria-label="Lagre visningsnavn"
                className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#f4f4f5] text-[#18191b] transition hover:bg-white disabled:opacity-35"
              >
                {lagrer ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              </button>
              <button
                type="button"
                onClick={() => setAapen(false)}
                aria-label="Avbryt"
                className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/10 text-white/60 transition hover:bg-white/10 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className={`px-1 text-[11px] leading-4 ${feil ? "text-rose-300" : "text-white/40"}`}>
              {feil ?? `2–${VISNINGSNAVN_MAKS} tegn. Vises på ledertavler, i dueller og for venner.`}
            </p>
          </form>
        </div>
      ) : null}
    </div>
  )
}

/** Keeps a local display name in sync with saves made by any pill on the page. */
export function useVisningsnavnSynk(sett: (navn: string) => void) {
  const settRef = useRef(sett)
  useEffect(() => {
    settRef.current = sett
  })
  useEffect(() => {
    const lytt = (e: Event) => {
      const navn = (e as CustomEvent<unknown>).detail
      if (typeof navn === "string" && navn) settRef.current(navn)
    }
    window.addEventListener(VISNINGSNAVN_HENDELSE, lytt)
    return () => window.removeEventListener(VISNINGSNAVN_HENDELSE, lytt)
  }, [])
}

"use client"

import { useCallback, useSyncExternalStore } from "react"

export type Sprak = "no" | "en"

const LAGRING_NOKKEL = "thodh:sprak:v1"
const COOKIE_NAVN = "thodh_sprak"
export const SPRAK_HENDELSE = "thodh:sprak-endret"

export function normaliserSprak(verdi: unknown): Sprak {
  return verdi === "en" ? "en" : "no"
}

function lesCookieSprak(): Sprak | null {
  if (typeof document === "undefined") return null
  const treff = document.cookie.match(/(?:^|;\s*)thodh_sprak=(no|en)(?:;|$)/)
  return treff ? normaliserSprak(treff[1]) : null
}

/** Reads the preferred UI language from localStorage or cookie (defaults to Norwegian). */
export function lesSprak(): Sprak {
  if (typeof window === "undefined") return "no"
  try {
    const lagret = window.localStorage.getItem(LAGRING_NOKKEL)
    if (lagret === "no" || lagret === "en") return lagret
  } catch {}
  return lesCookieSprak() ?? "no"
}

/** Updates <html lang> to match the selected language without triggering SSR hydration warnings. */
export function synkHtmlSprak(sprak: Sprak) {
  if (typeof document === "undefined") return
  const mal = sprak === "en" ? "en" : "nb"
  if (document.documentElement.lang !== mal) {
    document.documentElement.lang = mal
  }
}

/** Persists the chosen language to both localStorage and a 1-year cookie, and notifies all open views. */
export function settSprak(sprak: Sprak) {
  const neste = normaliserSprak(sprak)
  try {
    window.localStorage.setItem(LAGRING_NOKKEL, neste)
  } catch {}
  if (typeof document !== "undefined") {
    document.cookie = `${COOKIE_NAVN}=${neste}; path=/; max-age=31536000; SameSite=Lax`
    synkHtmlSprak(neste)
  }
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(SPRAK_HENDELSE))
  }
}

function abonnerSprak(varsle: () => void) {
  if (typeof window === "undefined") return () => {}
  const vedLagring = (e: StorageEvent) => {
    if (e.key === null || e.key === LAGRING_NOKKEL) varsle()
  }
  window.addEventListener(SPRAK_HENDELSE, varsle)
  window.addEventListener("storage", vedLagring)
  return () => {
    window.removeEventListener(SPRAK_HENDELSE, varsle)
    window.removeEventListener("storage", vedLagring)
  }
}

/** Reactive client-safe language store (returns "no" during SSR so static pages stay 100% cacheable). */
export function useSprak(): Sprak {
  return useSyncExternalStore(abonnerSprak, lesSprak, () => "no")
}

/** Convenience selector: `const t = useT(); t("Norsk", "English")`. */
export function useT() {
  const sprak = useSprak()
  return useCallback(<T,>(no: T, en: T): T => (sprak === "en" ? en : no), [sprak])
}

/** Pure helper for non-hook modules. */
export function velgSprak<T>(sprak: Sprak, no: T, en: T): T {
  return sprak === "en" ? en : no
}

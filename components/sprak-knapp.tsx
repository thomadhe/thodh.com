"use client"

import { useEffect } from "react"
import { settSprak, synkHtmlSprak, useSprak, type Sprak } from "@/lib/sprak"

/** Keeps <html lang> synced with the stored language preference on every page load. */
export function SprakSynk() {
  const sprak = useSprak()
  useEffect(() => {
    synkHtmlSprak(sprak)
  }, [sprak])
  return null
}

/** Inline localized text node for Server Component pages (keeps SSG pages 100% static). */
export function Tekst({ no, en }: { no: string; en: string }) {
  const sprak = useSprak()
  return <>{sprak === "en" ? en : no}</>
}

type Variant = "lys" | "mork" | "os"

/** Compact NO / EN toggle pill styled for light headers, dark game headers, or the thodh 98 desktop. */
export function SprakKnapp({
  variant = "mork",
  className = "",
}: {
  variant?: Variant
  className?: string
}) {
  const sprak = useSprak()

  const bytt = (neste: Sprak) => {
    if (neste !== sprak) settSprak(neste)
  }

  if (variant === "os") {
    return (
      <div
        role="group"
        aria-label={sprak === "en" ? "Language" : "Språk"}
        className={`os-ut inline-flex items-center gap-0.5 p-[2px] text-[11px] font-bold text-black ${className}`}
      >
        {(["no", "en"] as const).map((kode) => {
          const aktiv = sprak === kode
          return (
            <button
              key={kode}
              type="button"
              onClick={() => bytt(kode)}
              aria-pressed={aktiv}
              className={`px-2 py-0.5 leading-none uppercase transition-colors ${
                aktiv
                  ? "bg-[var(--os-tittel)] text-white shadow-[inset_1px_1px_#0006]"
                  : "os-knapp min-h-0 text-black hover:bg-[#ece9df]"
              }`}
            >
              {kode}
            </button>
          )
        })}
      </div>
    )
  }

  const beholder =
    variant === "lys"
      ? "border border-black/10 bg-black/[0.03] text-neutral-500"
      : "border border-white/10 bg-white/[0.05] text-neutral-400"

  const aktivStil =
    variant === "lys"
      ? "bg-neutral-900 text-white shadow-xs"
      : "bg-white text-[#18191b] shadow-xs"

  const inaktivStil = variant === "lys" ? "hover:text-neutral-900" : "hover:text-white"

  return (
    <div
      role="group"
      aria-label={sprak === "en" ? "Language" : "Språk"}
      className={`inline-flex h-8 shrink-0 items-center rounded-full p-0.5 font-mono text-[10px] font-semibold tracking-wider uppercase ${beholder} ${className}`}
    >
      {(["no", "en"] as const).map((kode) => {
        const aktiv = sprak === kode
        return (
          <button
            key={kode}
            type="button"
            onClick={() => bytt(kode)}
            aria-pressed={aktiv}
            className={`inline-flex h-full items-center justify-center rounded-full px-2 leading-none transition ${
              aktiv ? aktivStil : inaktivStil
            }`}
          >
            {kode}
          </button>
        )
      })}
    </div>
  )
}

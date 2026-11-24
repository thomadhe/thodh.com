"use client"

import { Globe } from "lucide-react"
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
        title={sprak === "en" ? "Switch language (Norwegian / English)" : "Bytt språk (norsk / engelsk)"}
        className={`os-ut inline-flex h-[30px] items-center gap-1 px-1.5 text-[11px] font-bold text-black ${className}`}
      >
        <Globe className="h-3.5 w-3.5 shrink-0 text-[#000080]" aria-hidden="true" />
        {(["no", "en"] as const).map((kode) => {
          const aktiv = sprak === kode
          return (
            <button
              key={kode}
              type="button"
              onClick={() => bytt(kode)}
              aria-pressed={aktiv}
              className={`h-[22px] px-2 leading-none uppercase transition-colors ${
                aktiv
                  ? "bg-[var(--os-tittel)] text-white shadow-[inset_1px_1px_#0006]"
                  : "os-knapp min-h-0 !py-0 !px-2 text-black hover:bg-[#ece9df]"
              }`}
            >
              {kode}
            </button>
          )
        })}
      </div>
    )
  }

  // Use explicit hex/white colours on "mork" so .spill-mork's inverted neutral palette never dims the button.
  const beholder =
    variant === "lys"
      ? "border border-black/15 bg-black/[0.04] text-[#525252]"
      : "border border-white/15 bg-white/[0.07] text-white/75"

  const aktivStil =
    variant === "lys"
      ? "bg-[#171717] text-white shadow-xs"
      : "bg-white text-[#18191b] shadow-xs"

  const inaktivStil = variant === "lys" ? "hover:text-[#111111]" : "hover:text-white"

  return (
    <div
      role="group"
      aria-label={sprak === "en" ? "Language" : "Språk"}
      title={sprak === "en" ? "Switch language (Norwegian / English)" : "Bytt språk (norsk / engelsk)"}
      className={`inline-flex h-8 shrink-0 items-center gap-0.5 rounded-full py-0.5 pr-0.5 pl-2 font-mono text-[11px] font-semibold tracking-wider uppercase ${beholder} ${className}`}
    >
      <Globe className="mr-0.5 h-3.5 w-3.5 shrink-0 opacity-75" aria-hidden="true" />
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

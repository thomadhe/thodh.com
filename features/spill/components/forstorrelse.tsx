"use client"

import { Maximize2, X } from "lucide-react"
import { useEffect, useRef, type ReactNode } from "react"

/**
 * A small round button for a closer look at a flag, outline or photo. It sits on top of a tile as a sibling of
 * the tile's own button, so a tap on it never chooses the tile.
 */
export function ForstorrKnapp({ onClick, etikett, className = "" }: { onClick: () => void; etikett: string; className?: string }) {
  return (
    <button type="button" onClick={onClick} aria-label={etikett} title={etikett} className={`grid h-7 w-7 place-items-center rounded-full ${className}`}>
      <span className="grid h-5 w-5 place-items-center rounded-full bg-neutral-900/60 text-neutral-50 shadow-sm backdrop-blur-sm transition hover:bg-neutral-900/80">
        <Maximize2 className="h-3 w-3" strokeWidth={2.5} />
      </span>
    </button>
  )
}

/** The closer look: a modal dialog over the page. Escape, the cross or a tap outside closes it. */
export function Forstorrelse({ apen, onLukk, etikett, children }: { apen: boolean; onLukk: () => void; etikett: string; children: ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    const d = ref.current
    if (!d) return
    if (apen && !d.open) d.showModal()
    if (!apen && d.open) d.close()
  }, [apen])
  return (
    <dialog
      ref={ref}
      aria-label={etikett}
      onClose={onLukk}
      // A click on the dialog itself (not its content) is a click on the backdrop.
      onClick={(e) => {
        if (e.target === e.currentTarget) onLukk()
      }}
      className="m-auto w-[min(92vw,34rem)] overflow-visible rounded-3xl bg-[var(--spill-flate)] p-0 text-neutral-950 shadow-2xl backdrop:bg-[rgb(0_0_0/0.7)] backdrop:backdrop-blur-sm"
    >
      {apen ? (
        <div className="mel-inn relative flex flex-col items-center gap-4 px-5 pt-12 pb-6">
          {children}
          <button
            type="button"
            onClick={onLukk}
            aria-label="Lukk"
            className="absolute top-3 right-3 grid h-8 w-8 place-items-center rounded-full bg-neutral-100 text-neutral-600 transition hover:text-neutral-950"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : null}
    </dialog>
  )
}

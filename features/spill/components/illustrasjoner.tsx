import { Play, Search, SkipBack, SkipForward, Volume2 } from "lucide-react"
import type { SpillId } from "../lib/spill"

// Small decorative drawings for the game tiles on the hub. Purely visual, hidden from screen readers.

function MerEllerMindre() {
  return (
    <svg viewBox="0 0 120 64" className="h-20 w-auto" aria-hidden="true">
      <path d="M30 4 52 30H39v30H21V30H8Z" className="fill-emerald-400" />
      <path d="M90 60 68 34h13V4h18v30h13Z" className="fill-rose-500" />
    </svg>
  )
}

function Anelseslos() {
  const rader = [
    ["w-full", "bg-emerald-400"],
    ["w-[84%]", "bg-emerald-400"],
    ["w-[62%]", "bg-amber-300"],
    ["w-[34%]", "bg-rose-500"],
  ]
  return (
    <div className="flex w-44 flex-col gap-1.5" aria-hidden="true">
      {rader.map(([bredde, farge], i) => (
        <span key={i} className="h-3.5 rounded-[5px] bg-black/40">
          <span className={`block h-full rounded-[5px] ${bredde} ${farge}`} />
        </span>
      ))}
    </div>
  )
}

function Stavebien() {
  return (
    <div className="flex items-center" aria-hidden="true">
      <span className="z-10 flex h-16 w-[4.4rem] items-center justify-center bg-yellow-300 text-neutral-900 [clip-path:polygon(25%_0,75%_0,100%_50%,75%_100%,25%_100%,0_50%)]">
        <Volume2 className="h-8 w-8" strokeWidth={2.5} />
      </span>
      <span className="-ml-3 flex h-12 items-center gap-2 bg-black/40 pr-6 pl-6 font-mono text-2xl text-white [clip-path:polygon(0_0,88%_0,100%_50%,88%_100%,0_100%)]">
        {["A", "B", "C"].map((t) => (
          <span key={t} className="border-b-2 border-white/80 leading-7">
            {t}
          </span>
        ))}
      </span>
    </div>
  )
}

function Sanglos() {
  return (
    <div className="flex w-44 flex-col items-center gap-3" aria-hidden="true">
      <span className="h-3 w-full rounded-full bg-black/40">
        <span className="block h-full w-[38%] rounded-full bg-violet-400" />
      </span>
      <span className="flex items-center gap-5 text-white/90">
        <SkipBack className="h-5 w-5 fill-current" />
        <span className="flex h-11 w-11 items-center justify-center rounded-full bg-violet-400 text-neutral-950">
          <Play className="ml-0.5 h-5 w-5 fill-current" />
        </span>
        <SkipForward className="h-5 w-5 fill-current" />
      </span>
    </div>
  )
}

function Omriss() {
  return (
    <svg viewBox="0 0 120 80" className="h-20 w-auto" aria-hidden="true">
      <path
        d="M38 8l14 6 9-4 12 7 15-2 6 12-6 9 9 11-8 13-13 2-6 9-12-4-11 5-7-11-12-3 3-14-9-10 8-12Z"
        className="fill-sky-400"
      />
    </svg>
  )
}

function Canvas() {
  const apne = new Set([1, 6, 8])
  return (
    <div className="grid w-40 grid-cols-4 grid-rows-3 gap-1 overflow-hidden rounded-lg" aria-hidden="true">
      {Array.from({ length: 12 }, (_, i) => (
        <span
          key={i}
          className={`h-7 ${apne.has(i) ? (i === 6 ? "bg-white" : "bg-rose-500") : "bg-black/40"}`}
        />
      ))}
    </div>
  )
}

function Soket() {
  return (
    <div className="flex flex-col items-center gap-2" aria-hidden="true">
      <span className="flex h-9 w-44 items-center gap-2 rounded-full bg-white/90 px-3 text-xs text-neutral-500">
        <Search className="h-3.5 w-3.5" /> hvorfor er katter så
      </span>
      <span className="flex gap-1">
        {["bg-emerald-500", "bg-amber-400", "bg-black/40", "bg-emerald-500", "bg-black/40"].map((f, i) => (
          <span key={i} className={`h-7 w-7 rounded-md ${f}`} />
        ))}
      </span>
    </div>
  )
}

function Emovi() {
  return (
    <span className="text-4xl tracking-[0.15em]" aria-hidden="true">
      🦁👑🌅🐗🎶
    </span>
  )
}

export const illustrasjoner: Record<SpillId, () => React.JSX.Element> = {
  "mer-eller-mindre": MerEllerMindre,
  anelseslos: Anelseslos,
  stavebien: Stavebien,
  sanglos: Sanglos,
  omriss: Omriss,
  canvas: Canvas,
  soket: Soket,
  emovi: Emovi,
}

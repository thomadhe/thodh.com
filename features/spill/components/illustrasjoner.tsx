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

function Rusle() {
  const steg = ["bg-pink-500", "bg-green-500", "bg-green-500", "bg-amber-400", "bg-teal-400"]
  return (
    <div className="flex items-center gap-1" aria-hidden="true">
      {steg.map((f, i) => (
        <span key={i} className="flex items-center gap-1">
          <span className={`h-8 w-8 rounded-[10px] ${f} ${i % 2 ? "translate-y-2" : "-translate-y-1"}`} />
          {i < steg.length - 1 ? <span className="h-0.5 w-2 bg-white/40" /> : null}
        </span>
      ))}
    </div>
  )
}

function Tilkoblinger() {
  const rader = ["bg-amber-300", "bg-emerald-400", "bg-sky-400", "bg-fuchsia-400"]
  return (
    <div className="flex w-44 flex-col gap-1" aria-hidden="true">
      {rader.map((f, r) => (
        <span key={r} className="grid grid-cols-4 gap-1">
          {Array.from({ length: 4 }, (_, k) => (
            <span key={k} className={`h-5 rounded ${r < 2 ? f : "bg-black/40"}`} />
          ))}
        </span>
      ))}
    </div>
  )
}

function Havet() {
  const poeng = [92, 40, 100, 15, 70, 0, 85, 55, 100]
  return (
    <div className="grid w-36 grid-cols-3 gap-1" aria-hidden="true">
      {poeng.map((p, i) => (
        <span key={i} className={`flex h-9 items-center justify-center rounded-md font-mono text-xs font-bold ${p >= 70 ? "bg-emerald-400 text-neutral-950" : p >= 40 ? "bg-amber-300 text-neutral-950" : "bg-black/40 text-white/60"}`}>
          {p}
        </span>
      ))}
    </div>
  )
}

function HeksagonalJakt() {
  const farger = ["bg-black/40", "bg-sky-400", "bg-black/40", "bg-amber-300", "bg-orange-500", "bg-black/40", "bg-black/40", "bg-rose-500", "bg-black/40"]
  return (
    <div className="flex w-40 flex-col" aria-hidden="true">
      {[0, 1, 2].map((r) => (
        <span key={r} className={`-mt-1.5 flex gap-1 first:mt-0 ${r % 2 ? "translate-x-[22px]" : ""}`}>
          {[0, 1, 2].map((k) => (
            <span key={k} className={`h-12 w-10 ${farger[r * 3 + k]}`} style={{ clipPath: "polygon(50% 0, 100% 25%, 100% 75%, 50% 100%, 0 75%, 0 25%)" }} />
          ))}
        </span>
      ))}
    </div>
  )
}

/** One palm-up hand, fingers pointing right: wrist at the origin, palm surface at y = 0. */
function Haand() {
  return (
    <>
      <rect x="-30" y="-6" width="26" height="20" rx="3" fill="#a3e635" />
      <rect x="-7" y="-8" width="7" height="24" rx="2" fill="#f4f4f5" />
      <path d="M3 -1Q4 -13 11 -14Q16 -14 15 -8L14 -1Z" fill="#fcc21b" />
      <path d="M28 9H38Q42 9 42 11.5Q42 14 38 14H28Z" fill="#e8a80c" />
      <path d="M28 4H43Q47 4 47 6.5Q47 9 43 9H28Z" fill="#fbb515" />
      <path d="M20 -2H42Q46 -2 47 -6Q48 -9 50 -8Q53 -6 51 -1Q49 4 43 4H20Z" fill="#fcc21b" />
      <path d="M0 -2H30V14H6Q0 14 0 8Z" fill="#fcc21b" />
      <path d="M28 4H43M28 9H38" stroke="#c27c0e" strokeWidth="1.6" strokeLinecap="round" />
    </>
  )
}

function Stegern() {
  // The logo: the "six seven" hands, weighing a 6 against a 7.
  const tall = { textAnchor: "middle", fontSize: 36, fontWeight: 900, fontFamily: "var(--font-visning), sans-serif", fill: "#f4f4f5" } as const
  const pil = { fill: "none", stroke: "#fde047", strokeWidth: 3, strokeLinecap: "round", strokeLinejoin: "round" } as const
  return (
    <svg viewBox="2 8 156 64" className="h-20 w-auto" aria-hidden="true">
      <g transform="translate(30 38)">
        <Haand />
      </g>
      <g transform="translate(130 54) scale(-1 1)">
        <Haand />
      </g>
      <text x="52" y="37" {...tall}>
        6
      </text>
      <text x="108" y="53" {...tall}>
        7
      </text>
      <path d="M12 30v-14m-5 5 5-5 5 5" {...pil} />
      <path d="M148 30v14m-5-5 5 5 5-5" {...pil} />
    </svg>
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
  rusle: Rusle,
  tilkoblinger: Tilkoblinger,
  havet: Havet,
  "heksagonal-jakt": HeksagonalJakt,
  "67-stegern": Stegern,
}

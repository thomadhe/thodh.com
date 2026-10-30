"use client"

import { useRouter } from "next/navigation"
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react"
import { useAlleResultater } from "@/features/spill/lib/lagring"
import type { SpillId } from "@/features/spill/lib/spill"
import { CONTACT_EMAIL } from "@/lib/projects"
import { Ikon, type IkonNavn } from "./ikoner"
import { OmThodh, Papirkurv } from "./innhold"

// thodh 98: the front page is a small desktop where games and apps are programs you open.
// Games and pages open full screen; only the little system dialogs are movable windows.

type Program = {
  id: string
  navn: string
  /** Internal path (full page), https URL (new tab) or a built-in window id. */
  mal: string
  ikon?: IkonNavn
  logo?: string
  b?: number
  h?: number
  /** Daily game whose status shows in the "I dag" gadget. */
  spill?: SpillId
}

const dagligeProgrammer: Program[] = [
  { id: "mel", navn: "Mer eller mindre", mal: "/spill/mer-eller-mindre", ikon: "mel", spill: "mer-eller-mindre" },
  { id: "anelse", navn: "Anelsesløs", mal: "/spill/anelseslos", ikon: "anelse", spill: "anelseslos" },
  { id: "bie", navn: "Stavebien", mal: "/spill/stavebien", ikon: "bie", spill: "stavebien" },
  { id: "note", navn: "Sangløs", mal: "/spill/sanglos", ikon: "note", spill: "sanglos" },
  { id: "omriss", navn: "Omriss", mal: "/spill/omriss", ikon: "form", spill: "omriss" },
  { id: "canvas", navn: "Canvas", mal: "/spill/canvas", ikon: "flagg", spill: "canvas" },
  { id: "soket", navn: "Søket", mal: "/spill/soket", ikon: "sok", spill: "soket" },
  { id: "emovi", navn: "Emovi", mal: "/spill/emovi", ikon: "film", spill: "emovi" },
  { id: "rusle", navn: "Rusle", mal: "/spill/rusle", ikon: "sti", spill: "rusle" },
]

const spillProgrammer: Program[] = [
  { id: "land", navn: "Verdens land", mal: "/spill/verdens-land", ikon: "jord" },
  { id: "hovedsteder", navn: "Hovedsteder", mal: "/spill/hovedsteder", ikon: "stjerne" },
  { id: "sjakk", navn: "Sjakk for 2", mal: "/sjakk", logo: "/sjakk/favicon.svg" },
]

const appProgrammer: Program[] = [
  { id: "karriere", navn: "Karrierepiloten", mal: "https://karrierepiloten.com", logo: "/logos/karrierepiloten.jpg" },
]

const systemProgrammer: Program[] = [
  { id: "papirkurv", navn: "Papirkurv", mal: "papirkurv", ikon: "papirkurv", b: 340, h: 170 },
  { id: "om", navn: "Om thodh.com", mal: "om", ikon: "datamaskin", b: 420, h: 330 },
  { id: "konto", navn: "Konto", mal: "/konto", ikon: "person" },
]

const alleProgrammer = [...dagligeProgrammer, ...spillProgrammer, ...appProgrammer, ...systemProgrammer]

const grupper: (readonly [string, Program[]])[] = [
  ["Daglig", dagligeProgrammer],
  ["Spill", spillProgrammer],
  ["Apper", appProgrammer],
]

type Vindu = { mal: string; x: number; y: number; b: number; h: number; z: number; min: boolean; maks: boolean }

const OPPGAVELINJE = 40

function finnProgram(mal: string) {
  return alleProgrammer.find((p) => p.mal === mal)
}

function ProgramIkon({ p, storrelse = 32 }: { p: Program; storrelse?: number }) {
  if (p.logo) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- tiny local logos at icon size
      <img
        src={p.logo}
        alt=""
        width={storrelse}
        height={storrelse}
        style={{ width: storrelse, height: storrelse }}
        className="rounded-[4px] bg-white object-cover shadow-[1px_1px_0_#0007]"
      />
    )
  }
  return <Ikon navn={p.ikon ?? "dokument"} storrelse={storrelse} />
}

// ---- small external stores (no state set inside effects) ----

function abonnerMedie(varsle: () => void) {
  const m = window.matchMedia("(max-width: 640px)")
  m.addEventListener("change", varsle)
  return () => m.removeEventListener("change", varsle)
}

function useLiten() {
  return useSyncExternalStore(abonnerMedie, () => window.matchMedia("(max-width: 640px)").matches, () => false)
}

function abonnerKlokke(varsle: () => void) {
  const t = setInterval(varsle, 5_000)
  return () => clearInterval(t)
}

const osloTid = (valg: Intl.DateTimeFormatOptions) =>
  new Intl.DateTimeFormat("nb-NO", { timeZone: "Europe/Oslo", ...valg }).format(new Date())

function useKlokke() {
  return useSyncExternalStore(abonnerKlokke, () => osloTid({ hour: "2-digit", minute: "2-digit" }), () => "")
}

/** "5 t 12 min" until the games change at midnight in Oslo. */
function useNedtelling() {
  return useSyncExternalStore(
    abonnerKlokke,
    () => {
      const [t, m] = osloTid({ hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).split(":").map(Number)
      const igjen = 24 * 60 - (t * 60 + m)
      return `${Math.floor(igjen / 60)} t ${igjen % 60} min`
    },
    () => "",
  )
}

const iDag = () => osloTid({ year: "numeric", month: "2-digit", day: "2-digit" }).split(".").reverse().join("-")

function useIDag() {
  return useSyncExternalStore(abonnerKlokke, iDag, () => "")
}

// ---- pieces ----

function Tittellinje({
  tittel,
  ikon,
  aktiv,
  liten,
  maks,
  onDra,
  onMin,
  onMaks,
  onLukk,
}: {
  tittel: string
  ikon: React.ReactNode
  aktiv: boolean
  liten: boolean
  maks: boolean
  onDra: (e: React.PointerEvent) => void
  onMin: () => void
  onMaks: () => void
  onLukk: () => void
}) {
  const knapp = "os-knapp flex h-[18px] min-h-0 w-5 items-center p-0 justify-center text-[11px] leading-none font-bold text-black"
  const stopp = (e: React.PointerEvent) => e.stopPropagation()
  return (
    <div
      className="os-tittellinje flex h-7 shrink-0 cursor-default touch-none items-center gap-1.5 pr-1 pl-1.5 select-none"
      data-aktiv={aktiv}
      onPointerDown={onDra}
      onDoubleClick={() => !liten && onMaks()}
    >
      <span className="flex h-4 w-4 shrink-0 items-center justify-center overflow-hidden">{ikon}</span>
      <span className="min-w-0 flex-1 truncate text-[12px] font-bold">{tittel}</span>
      <button type="button" className={knapp} onClick={onMin} onPointerDown={stopp} aria-label="Minimer">
        <span className="mt-1.5 block h-0.5 w-2 bg-black" />
      </button>
      {!liten ? (
        <button type="button" className={knapp} onClick={onMaks} onPointerDown={stopp} aria-label={maks ? "Gjenopprett" : "Maksimer"}>
          <span className="block h-2 w-2.5 border border-t-2 border-black" />
        </button>
      ) : null}
      <button type="button" className={`${knapp} ml-0.5`} onClick={onLukk} onPointerDown={stopp} aria-label="Lukk">
        ✕
      </button>
    </div>
  )
}

function SkrivebordIkon({
  p,
  valgt,
  velg,
  apne,
}: {
  p: Program
  valgt: boolean
  velg: () => void
  apne: () => void
}) {
  return (
    <button
      type="button"
      className="os-ikon group flex w-[88px] flex-col items-center gap-1.5 p-1 text-center"
      data-valgt={valgt}
      onClick={(e) => {
        velg()
        // Touch has no double click, so one tap opens.
        if ((e.nativeEvent as PointerEvent).pointerType === "touch") apne()
      }}
      onDoubleClick={apne}
      onKeyDown={(e) => e.key === "Enter" && apne()}
    >
      <span className="os-ikon-bilde transition duration-150 group-hover:-translate-y-0.5 group-hover:-rotate-3">
        <ProgramIkon p={p} storrelse={40} />
      </span>
      <span className="os-ikon-tekst px-0.5 text-[12px] leading-tight text-white">{p.navn}</span>
    </button>
  )
}

const status: Record<string, [string, string]> = {
  vunnet: ["✓", "bg-[#2f9e5b] text-white"],
  ferdig: ["✓", "bg-[#2f9e5b] text-white"],
  tapt: ["✕", "bg-[#c2414b] text-white"],
  pagar: ["…", "bg-[#f0c64a] text-black"],
}

/** Desktop gadget with today's games, their status and the time left until new ones. */
function DagensSpill({ apne }: { apne: (mal: string) => void }) {
  const resultater = useAlleResultater()
  const dato = useIDag()
  const nedtelling = useNedtelling()
  const spill = dagligeProgrammer
  const ferdige = spill.filter((p) => {
    const r = resultater[p.spill!]?.[dato]
    return r && r.status !== "pagar"
  }).length
  return (
    <aside className="os-ut os-apne w-60 p-[3px]" aria-label="Dagens spill">
      <div className="os-tittellinje flex h-6 items-center gap-1.5 px-1.5 text-[12px] font-bold" data-aktiv="true">
        <Ikon navn="spillmappe" storrelse={16} />I dag
        <span className="ml-auto font-normal opacity-80">
          {ferdige}/{spill.length}
        </span>
      </div>
      <ul className="os-inn mt-[3px] divide-y divide-neutral-200">
        {spill.map((p) => {
          const r = resultater[p.spill!]?.[dato]
          const [merke, stil] = r ? status[r.status] : ["Ny", "bg-[var(--os-tittel)] text-white"]
          return (
            <li key={p.id}>
              <button
                type="button"
                onClick={() => apne(p.mal)}
                className="flex w-full items-center gap-2 px-2 py-1.5 text-left text-[12px] hover:bg-[var(--os-tittel)] hover:text-white"
              >
                <ProgramIkon p={p} storrelse={20} />
                <span className="flex-1">{p.navn}</span>
                {r?.etikett && r.status !== "pagar" ? <span className="text-[10px] opacity-70">{r.etikett}</span> : null}
                <span className={`min-w-6 px-1 text-center text-[10px] font-bold ${stil}`}>{merke}</span>
              </button>
            </li>
          )
        })}
      </ul>
      <p className="px-1.5 pt-1.5 pb-0.5 text-[11px] text-neutral-700" suppressHydrationWarning>
        {nedtelling ? <>Nye om {nedtelling}</> : " "}
      </p>
    </aside>
  )
}

/** Slow pixel clouds drifting across the dusk. Pure decoration. */
function Skyer() {
  const skyer = [
    { top: "14%", varighet: 140, forsinkelse: -20, skala: 1 },
    { top: "31%", varighet: 190, forsinkelse: -120, skala: 0.7 },
    { top: "52%", varighet: 160, forsinkelse: -70, skala: 1.3 },
  ]
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden opacity-25">
      {skyer.map((s, i) => (
        <div
          key={i}
          className="os-sky absolute left-0"
          style={{ top: s.top, animationDuration: `${s.varighet}s`, animationDelay: `${s.forsinkelse}s` }}
        >
          <div style={{ transform: `scale(${s.skala})` }}>
            <div className="ml-6 h-3 w-10 bg-white" />
            <div className="ml-2 h-3 w-20 bg-white" />
            <div className="h-3 w-28 bg-white" />
          </div>
        </div>
      ))}
    </div>
  )
}

// ---- desktop ----

export function Skrivebord() {
  const router = useRouter()
  const liten = useLiten()
  const klokke = useKlokke()
  const [vinduer, setVinduer] = useState<Vindu[]>([])
  const [valgt, setValgt] = useState<string | null>(null)
  const [start, setStart] = useState(false)
  const flate = useRef<HTMLDivElement>(null)
  const nesteZ = useRef(1)

  const synlige = vinduer.filter((v) => !v.min)
  const aktivMal = synlige.length ? synlige.reduce((a, b) => (b.z > a.z ? b : a)).mal : null

  const fokuser = useCallback((mal: string) => {
    const z = nesteZ.current++
    setVinduer((vs) => vs.map((v) => (v.mal === mal ? { ...v, z, min: false } : v)))
  }, [])

  const lukk = useCallback((mal: string) => setVinduer((vs) => vs.filter((v) => v.mal !== mal)), [])

  const apne = useCallback((mal: string) => {
    setStart(false)
    if (mal.startsWith("http") || mal.startsWith("mailto:")) {
      window.open(mal, mal.startsWith("mailto:") ? "_self" : "_blank", "noopener")
      return
    }
    if (mal.startsWith("/")) {
      // Games get the whole screen. Chess is a static page outside the Next router.
      if (mal.startsWith("/sjakk")) window.location.assign(mal)
      else router.push(mal)
      return
    }
    const z = nesteZ.current++
    setVinduer((vs) => {
      if (vs.some((v) => v.mal === mal)) return vs.map((v) => (v.mal === mal ? { ...v, z, min: false } : v))
      const p = finnProgram(mal)
      const rom = flate.current?.getBoundingClientRect() ?? { width: 1280, height: 800 }
      const b = Math.min(p?.b ?? 900, rom.width - 16)
      const h = Math.min(p?.h ?? 700, rom.height - 16)
      const n = vs.filter((v) => !v.min).length
      const x = Math.max(8, Math.min((rom.width - b) / 2 + (n - 1) * 26, rom.width - b - 8))
      const y = Math.max(8, Math.min((rom.height - h) / 3 + n * 26, rom.height - h - 8))
      return [...vs, { mal, x, y, b, h, z, min: false, maks: false }]
    })
  }, [router])

  const endre = (mal: string, endring: Partial<Vindu>) =>
    setVinduer((vs) => vs.map((v) => (v.mal === mal ? { ...v, ...endring } : v)))

  const dra = (mal: string, modus: "flytt" | "storrelse") => (e: React.PointerEvent) => {
    if (e.button !== 0) return
    fokuser(mal)
    const v = vinduer.find((x) => x.mal === mal)
    if (!v || v.maks || liten) return
    e.preventDefault()
    const el = e.currentTarget as HTMLElement
    el.setPointerCapture(e.pointerId)
    const fra = { px: e.clientX, py: e.clientY, x: v.x, y: v.y, b: v.b, h: v.h }
    const rom = flate.current!.getBoundingClientRect()
    const flytt = (m: PointerEvent) => {
      const dx = m.clientX - fra.px
      const dy = m.clientY - fra.py
      if (modus === "flytt") {
        endre(mal, {
          x: Math.max(-fra.b + 80, Math.min(fra.x + dx, rom.width - 80)),
          y: Math.max(0, Math.min(fra.y + dy, rom.height - 28)),
        })
      } else {
        endre(mal, { b: Math.max(280, fra.b + dx), h: Math.max(160, fra.h + dy) })
      }
    }
    const slipp = () => {
      el.removeEventListener("pointermove", flytt)
      el.removeEventListener("pointerup", slipp)
      el.removeEventListener("pointercancel", slipp)
    }
    el.addEventListener("pointermove", flytt)
    el.addEventListener("pointerup", slipp)
    el.addEventListener("pointercancel", slipp)
  }

  useEffect(() => {
    if (!start) return
    const ved = (e: KeyboardEvent) => e.key === "Escape" && setStart(false)
    window.addEventListener("keydown", ved)
    return () => window.removeEventListener("keydown", ved)
  }, [start])

  const tittelOgIkon = (mal: string): [string, React.ReactNode] => {
    const p = finnProgram(mal)
    return [p?.navn ?? mal, p ? <ProgramIkon p={p} storrelse={16} /> : <Ikon navn="nett" storrelse={16} />]
  }

  const innhold = (v: Vindu) => (v.mal === "om" ? <OmThodh lukk={() => lukk(v.mal)} /> : <Papirkurv />)

  const ikon = (p: Program) => (
    <SkrivebordIkon key={p.id} p={p} valgt={valgt === p.id} velg={() => setValgt(p.id)} apne={() => apne(p.mal)} />
  )

  return (
    <div className="os os-skrivebord fixed inset-0 overflow-hidden text-black select-none">
      <h1 className="sr-only">thodh.com – spill og apper</h1>
      <Skyer />
      <p
        aria-hidden="true"
        className="os-merke pointer-events-none absolute right-[-0.04em] bottom-[30px] text-[clamp(6rem,22vw,20rem)] leading-none font-black"
      >
        thodh
      </p>

      <div
        ref={flate}
        className="absolute inset-x-0 top-0"
        style={{ bottom: OPPGAVELINJE }}
        onPointerDown={(e) => {
          if (e.target === e.currentTarget) {
            setValgt(null)
            setStart(false)
          }
        }}
      >
        <nav aria-label="Programmer" className="pointer-events-none absolute inset-0 flex flex-col gap-3 p-2 sm:flex-row sm:gap-1">
          {grupper.map(([tittel, liste]) => (
            <div key={tittel} className="pointer-events-auto flex flex-col">
              <p className="mb-0.5 px-2 text-[10px] tracking-[0.2em] text-white/70 uppercase">{tittel}</p>
              <div className="grid grid-cols-4 gap-y-1 sm:grid-cols-1">{liste.map(ikon)}</div>
            </div>
          ))}
        </nav>

        <div className="pointer-events-auto absolute right-2 bottom-2">{ikon(systemProgrammer[0])}</div>

        {!liten ? (
          <div className="absolute top-3 right-3">
            <DagensSpill apne={apne} />
          </div>
        ) : null}

        {vinduer.map((v) => {
          const [tittel, tIkon] = tittelOgIkon(v.mal)
          const aktiv = v.mal === aktivMal
          const fylt = v.maks || liten
          return (
            <section
              key={v.mal}
              role="dialog"
              aria-label={tittel}
              hidden={v.min}
              onPointerDown={() => !aktiv && fokuser(v.mal)}
              className="os-ut os-apne absolute flex flex-col p-[3px]"
              style={fylt ? { inset: 0, zIndex: 10 + v.z } : { left: v.x, top: v.y, width: v.b, height: v.h, zIndex: 10 + v.z }}
            >
              <Tittellinje
                tittel={tittel}
                ikon={tIkon}
                aktiv={aktiv}
                liten={liten}
                maks={v.maks}
                onDra={dra(v.mal, "flytt")}
                onMin={() => endre(v.mal, { min: true })}
                onMaks={() => endre(v.mal, { maks: !v.maks })}
                onLukk={() => lukk(v.mal)}
              />
              <div className="relative mt-[3px] min-h-0 flex-1 overflow-auto bg-[var(--os-flate)] select-text">{innhold(v)}</div>
              {!fylt ? (
                <span
                  aria-hidden="true"
                  onPointerDown={dra(v.mal, "storrelse")}
                  className="absolute right-0.5 bottom-0.5 h-3.5 w-3.5 cursor-nwse-resize touch-none bg-[linear-gradient(135deg,transparent_45%,#7d7d76_45%,#7d7d76_55%,transparent_55%,transparent_70%,#7d7d76_70%,#7d7d76_80%,transparent_80%)]"
                />
              ) : null}
            </section>
          )
        })}
      </div>

      {start ? (
        <div className="os-ut os-apne absolute bottom-[38px] left-0.5 z-[10000] flex w-64 p-[3px]" role="menu">
          <div className="flex w-7 items-end justify-center bg-gradient-to-t from-[var(--os-tittel)] to-[var(--os-tittel-2)] pb-2">
            <span className="rotate-180 text-[15px] font-bold tracking-wide text-white [writing-mode:vertical-rl]">
              thodh<span className="font-normal">98</span>
            </span>
          </div>
          <div className="flex-1 py-1">
            {[...grupper, ["", systemProgrammer.filter((p) => p.id !== "papirkurv")] as const].map(([tittel, liste], i) => (
              <div key={i} className={i ? "mt-1 border-t border-[var(--os-skygge)] pt-1 shadow-[inset_0_1px_#fff]" : ""}>
                {tittel ? <p className="px-2 pt-0.5 text-[10px] tracking-widest text-neutral-600 uppercase">{tittel}</p> : null}
                {liste.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    role="menuitem"
                    onClick={() => apne(p.mal)}
                    className="flex w-full items-center gap-2.5 px-2 py-1 text-left text-[12px] hover:bg-[var(--os-tittel)] hover:text-white focus:bg-[var(--os-tittel)] focus:text-white focus:outline-none"
                  >
                    <ProgramIkon p={p} storrelse={20} />
                    {p.navn}
                    {p.mal.startsWith("http") ? <span className="ml-auto text-[10px] opacity-60">↗</span> : null}
                  </button>
                ))}
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <footer className="os-ut absolute inset-x-0 bottom-0 z-[9999] flex items-center gap-1 px-1" style={{ height: OPPGAVELINJE }}>
        <button
          type="button"
          className="os-knapp flex h-[30px] shrink-0 items-center gap-1.5 px-2 text-[12px] font-bold"
          aria-pressed={start}
          aria-haspopup="menu"
          onClick={() => setStart((s) => !s)}
        >
          <span className="grid h-4 w-4 grid-cols-2 gap-px" aria-hidden="true">
            <span className="bg-[#d9607a]" />
            <span className="bg-[#f0c64a]" />
            <span className="bg-[#000080]" />
            <span className="bg-[#2f9e5b]" />
          </span>
          Start
        </button>
        <div className="flex min-w-0 flex-1 gap-1 overflow-hidden">
          {vinduer.map((v) => {
            const [tittel, tIkon] = tittelOgIkon(v.mal)
            const aktiv = v.mal === aktivMal
            return (
              <button
                key={v.mal}
                type="button"
                aria-pressed={aktiv}
                onClick={() => (aktiv ? endre(v.mal, { min: true }) : fokuser(v.mal))}
                className={`os-knapp flex h-[30px] w-40 min-w-0 shrink items-center gap-1.5 px-2 text-left text-[12px] ${aktiv ? "font-bold" : ""}`}
              >
                <span className="flex h-4 w-4 shrink-0 items-center justify-center">{tIkon}</span>
                <span className="truncate">{tittel}</span>
              </button>
            )
          })}
        </div>
        {/* The tray doubles as the site footer: contact and the clock, out of the way. */}
        <div className="os-inn flex h-[30px] shrink-0 items-center gap-3 px-2.5 text-[11px]" style={{ background: "transparent" }}>
          <a
            href={`mailto:${CONTACT_EMAIL}`}
            className="flex items-center gap-1 text-neutral-800 hover:underline"
            title={CONTACT_EMAIL}
          >
            <Ikon navn="brev" storrelse={14} />
            <span className="max-sm:sr-only">Kontakt</span>
          </a>
          <span className="tabular-nums" title="Lær → Bygg → Del" suppressHydrationWarning>
            {klokke}
          </span>
        </div>
      </footer>
    </div>
  )
}

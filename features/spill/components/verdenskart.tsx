"use client"

import { Minus, Plus, RotateCcw } from "lucide-react"
import { useCallback, useEffect, useRef, useState } from "react"
import kart from "../data/geografi/kart.json"

// World map from precomputed SVG paths (scripts/geo/lag-geodata.mjs). Drag to pan, wheel or buttons to zoom.

type Kart = { bredde: number; hoyde: number; land: Record<string, string>; bakgrunn: string; punkter: Record<string, [number, number]> }
// JSON imports type coordinate pairs as number[], hence the cast via unknown.
const k = kart as unknown as Kart

type Utsnitt = { x: number; y: number; b: number }
const HELE: Utsnitt = { x: 0, y: 0, b: k.bredde }
const MAKS_ZOOM = 12

export const KART_FARGE = { ukjent: "#3b3f46", bakgrunn: "#2a2d32", hav: "#1b232b" }

function klem(u: Utsnitt): Utsnitt {
  const b = Math.min(k.bredde, Math.max(k.bredde / MAKS_ZOOM, u.b))
  const h = (b * k.hoyde) / k.bredde
  return { b, x: Math.min(k.bredde - b, Math.max(0, u.x)), y: Math.min(k.hoyde - h, Math.max(0, u.y)) }
}

export function Verdenskart({
  farger,
  titler,
  fremhevet,
  fokus,
  bareFargede = false,
  fokusKant,
}: {
  /** Fill per country id; countries without one are drawn neutral. */
  farger: Record<string, string>
  /** Hover titles per id (only for countries the player may see named). */
  titler?: Record<string, string>
  /** Ids drawn with a white outline, e.g. the latest answer. */
  fremhevet?: string[]
  /** Ids to frame when the map first appears (e.g. a route's start and end). */
  fokus?: string[]
  /** Draw only countries that have a colour: no outlines of anything else (Rusle). */
  bareFargede?: boolean
  /** Ids framed only by their point nearest the focus, so a huge country (Russia) doesn't zoom the map out. */
  fokusKant?: string[]
}) {
  const [u, setU] = useState<Utsnitt>(HELE)
  const fokusNokkel = `${fokus?.join(",") ?? ""}|${fokusKant?.join(",") ?? ""}`
  const svg = useRef<SVGSVGElement>(null)
  // Active pointers (mouse or fingers) and the gesture they started from: one = drag, two = pinch.
  const pekere = useRef(new Map<number, { x: number; y: number }>())
  const grep = useRef<{ u: Utsnitt; px: number; py: number; avstand: number; fx: number; fy: number } | null>(null)
  const startGrep = (fra: Utsnitt) => {
    const [a, b] = [...pekere.current.values()]
    const r = svg.current?.getBoundingClientRect()
    if (!a || !r) return (grep.current = null)
    grep.current = b
      ? { u: fra, px: 0, py: 0, avstand: Math.hypot(a.x - b.x, a.y - b.y), fx: ((a.x + b.x) / 2 - r.left) / r.width, fy: ((a.y + b.y) / 2 - r.top) / r.height }
      : { u: fra, px: a.x, py: a.y, avstand: 0, fx: 0, fy: 0 }
  }
  const slipp = (id: number) => {
    pekere.current.delete(id)
    // Lifting one finger of a pinch continues as a drag from where the map is now.
    setU((naa) => {
      startGrep(naa)
      return naa
    })
  }
  const skala = u.b / k.bredde

  /** Zooms around a point given as a fraction of the visible map (0.5, 0.5 = centre). */
  const zoom = useCallback((faktor: number, fx = 0.5, fy = 0.5) => {
    setU((f) => {
      const h = (f.b * k.hoyde) / k.bredde
      const cx = f.x + fx * f.b
      const cy = f.y + fy * h
      const b = Math.min(k.bredde, Math.max(k.bredde / MAKS_ZOOM, f.b * faktor))
      const r = b / f.b
      return klem({ b, x: cx - (cx - f.x) * r, y: cy - (cy - f.y) * r })
    })
  }, [])

  // Frame the focus countries: union of their bounding boxes, padded, at the map's aspect ratio.
  useEffect(() => {
    const el = svg.current
    const [hele, kant] = fokusNokkel.split("|").map((s) => s.split(",").filter(Boolean))
    if (!el || (!hele.length && !kant.length)) return
    let x0 = Infinity
    let y0 = Infinity
    let x1 = -Infinity
    let y1 = -Infinity
    const ta = (x: number, y: number) => {
      x0 = Math.min(x0, x)
      y0 = Math.min(y0, y)
      x1 = Math.max(x1, x)
      y1 = Math.max(y1, y)
    }
    const boks = (id: string) => el.querySelector<SVGGraphicsElement>(`[data-id="${id}"]`)?.getBBox()
    for (const id of hele.length ? hele : kant) {
      const r = boks(id)
      if (!r) continue
      ta(r.x, r.y)
      ta(r.x + r.width, r.y + r.height)
    }
    if (hele.length && Number.isFinite(x0)) {
      // Edge countries: only their point closest to the focus centre.
      const cx = (x0 + x1) / 2
      const cy = (y0 + y1) / 2
      for (const id of kant) {
        const r = boks(id)
        if (!r) continue
        // Normal-sized countries are framed whole; only giants (wider than a fifth of the map) by their nearest point.
        if (r.width < k.bredde / 5) {
          ta(r.x, r.y)
          ta(r.x + r.width, r.y + r.height)
        } else ta(Math.min(Math.max(cx, r.x), r.x + r.width), Math.min(Math.max(cy, r.y), r.y + r.height))
      }
    }
    if (!Number.isFinite(x0)) return
    const pad = 0.35
    const bredde = Math.max((x1 - x0) * (1 + pad * 2), ((y1 - y0) * (1 + pad * 2) * k.bredde) / k.hoyde, 90)
    const hoyde = (bredde * k.hoyde) / k.bredde
    // Measuring the rendered paths is only possible after mount.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setU(klem({ b: bredde, x: (x0 + x1) / 2 - bredde / 2, y: (y0 + y1) / 2 - hoyde / 2 }))
  }, [fokusNokkel])

  // React's wheel handler is passive, so the page would scroll while zooming.
  useEffect(() => {
    const el = svg.current
    if (!el) return
    const ved = (e: WheelEvent) => {
      e.preventDefault()
      const r = el.getBoundingClientRect()
      // Proportional to the scroll amount, so mouse wheels step and trackpad pinches (ctrl+wheel) glide.
      const faktor = Math.min(1.5, Math.max(0.66, Math.exp(e.deltaY * (e.ctrlKey ? 0.01 : 0.0025))))
      zoom(faktor, (e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height)
    }
    el.addEventListener("wheel", ved, { passive: false })
    return () => el.removeEventListener("wheel", ved)
  }, [zoom])

  const knapp =
    "flex h-8 w-8 items-center justify-center rounded-lg bg-neutral-100/90 text-neutral-700 shadow-sm backdrop-blur transition hover:text-neutral-950"

  return (
    <div className="relative overflow-hidden rounded-2xl" style={{ background: KART_FARGE.hav }}>
      <svg
        ref={svg}
        viewBox={`${u.x} ${u.y} ${u.b} ${(u.b * k.hoyde) / k.bredde}`}
        className="block h-auto w-full cursor-grab touch-none select-none active:cursor-grabbing"
        role="img"
        aria-label="Verdenskart"

        onPointerDown={(e) => {
          if (e.pointerType === "mouse" && e.button !== 0) return
          e.currentTarget.setPointerCapture(e.pointerId)
          pekere.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
          startGrep(u)
        }}
        onPointerMove={(e) => {
          if (!pekere.current.has(e.pointerId)) return
          pekere.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
          const g = grep.current
          if (!g) return
          const r = svg.current!.getBoundingClientRect()
          const [a, b] = [...pekere.current.values()]
          if (g.avstand && b) {
            // Two fingers: zoom by the change in distance and keep the map point under their midpoint in place.
            const faktor = g.avstand / Math.max(1, Math.hypot(a.x - b.x, a.y - b.y))
            const bredde = Math.min(k.bredde, Math.max(k.bredde / MAKS_ZOOM, g.u.b * faktor))
            const mx = ((a.x + b.x) / 2 - r.left) / r.width
            const my = ((a.y + b.y) / 2 - r.top) / r.height
            const px = g.u.x + g.fx * g.u.b
            const py = g.u.y + g.fy * ((g.u.b * k.hoyde) / k.bredde)
            setU(klem({ b: bredde, x: px - mx * bredde, y: py - my * ((bredde * k.hoyde) / k.bredde) }))
          } else {
            const per = g.u.b / r.width
            setU(klem({ ...g.u, x: g.u.x - (a.x - g.px) * per, y: g.u.y - (a.y - g.py) * per }))
          }
        }}
        onPointerUp={(e) => slipp(e.pointerId)}
        onPointerCancel={(e) => slipp(e.pointerId)}
      >
        {bareFargede ? null : <path d={k.bakgrunn} fill={KART_FARGE.bakgrunn} />}
        {Object.entries(k.land)
          // Hidden focus countries are still drawn (invisibly) so the framing can measure them.
          .filter(([id]) => !bareFargede || farger[id] || fokus?.includes(id))
          .map(([id, d]) => (
          <path
            key={id}
            data-id={id}
            d={d}
            fill={farger[id] ?? (bareFargede ? "transparent" : KART_FARGE.ukjent)}
            stroke={fremhevet?.includes(id) ? "#fff" : bareFargede && !farger[id] ? "none" : KART_FARGE.hav}
            strokeWidth={fremhevet?.includes(id) ? 1.5 : 0.5}
            vectorEffect="non-scaling-stroke"
            className="transition-[fill] duration-300"
          >
            {titler?.[id] ? <title>{titler[id]}</title> : null}
          </path>
        ))}
        {Object.entries(k.punkter)
          .filter(([id]) => !bareFargede || farger[id])
          .map(([id, [x, y]]) => (
          <circle
            key={id}
            data-id={id}
            cx={x}
            cy={y}
            r={Math.max(0.6, 3.2 * skala)}
            fill={farger[id] ?? KART_FARGE.ukjent}
            stroke={fremhevet?.includes(id) ? "#fff" : "#8b8f96"}
            strokeWidth={fremhevet?.includes(id) ? 1.5 : 0.75}
            vectorEffect="non-scaling-stroke"
          >
            {titler?.[id] ? <title>{titler[id]}</title> : null}
          </circle>
        ))}
      </svg>
      <div className="absolute right-2 bottom-2 flex flex-col gap-1">
        <button type="button" className={knapp} onClick={() => zoom(0.6)} aria-label="Zoom inn">
          <Plus className="h-4 w-4" />
        </button>
        <button type="button" className={knapp} onClick={() => zoom(1 / 0.6)} aria-label="Zoom ut">
          <Minus className="h-4 w-4" />
        </button>
        {u.b < k.bredde ? (
          <button type="button" className={knapp} onClick={() => setU(HELE)} aria-label="Vis hele kartet">
            <RotateCcw className="h-3.5 w-3.5" />
          </button>
        ) : null}
      </div>
    </div>
  )
}

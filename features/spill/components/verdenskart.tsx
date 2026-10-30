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
}: {
  /** Fill per country id; countries without one are drawn neutral. */
  farger: Record<string, string>
  /** Hover titles per id (only for countries the player may see named). */
  titler?: Record<string, string>
  /** Ids drawn with a white outline, e.g. the latest answer. */
  fremhevet?: string[]
  /** Ids to frame when the map first appears (e.g. a route's start and end). */
  fokus?: string[]
}) {
  const [u, setU] = useState<Utsnitt>(HELE)
  const fokusNokkel = fokus?.join(",") ?? ""
  const svg = useRef<SVGSVGElement>(null)
  const dra = useRef<{ px: number; py: number; u: Utsnitt } | null>(null)
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
    if (!el || !fokusNokkel) return
    let x0 = Infinity
    let y0 = Infinity
    let x1 = -Infinity
    let y1 = -Infinity
    for (const id of fokusNokkel.split(",")) {
      const node = el.querySelector<SVGGraphicsElement>(`[data-id="${id}"]`)
      if (!node) continue
      const r = node.getBBox()
      x0 = Math.min(x0, r.x)
      y0 = Math.min(y0, r.y)
      x1 = Math.max(x1, r.x + r.width)
      y1 = Math.max(y1, r.y + r.height)
    }
    if (!Number.isFinite(x0)) return
    const pad = 0.35
    const bredde = Math.max((x1 - x0) * (1 + pad * 2), ((y1 - y0) * (1 + pad * 2) * k.bredde) / k.hoyde, 90)
    const hoyde = (bredde * k.hoyde) / k.bredde
    // Measuring the rendered paths is only possible after mount.
    setU(klem({ b: bredde, x: (x0 + x1) / 2 - bredde / 2, y: (y0 + y1) / 2 - hoyde / 2 }))
  }, [fokusNokkel])

  // React's wheel handler is passive, so the page would scroll while zooming.
  useEffect(() => {
    const el = svg.current
    if (!el) return
    const ved = (e: WheelEvent) => {
      e.preventDefault()
      const r = el.getBoundingClientRect()
      zoom(e.deltaY > 0 ? 1.25 : 0.8, (e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height)
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
          if (e.button !== 0) return
          e.currentTarget.setPointerCapture(e.pointerId)
          dra.current = { px: e.clientX, py: e.clientY, u }
        }}
        onPointerMove={(e) => {
          const d = dra.current
          if (!d) return
          const r = svg.current!.getBoundingClientRect()
          const per = d.u.b / r.width
          setU(klem({ ...d.u, x: d.u.x - (e.clientX - d.px) * per, y: d.u.y - (e.clientY - d.py) * per }))
        }}
        onPointerUp={() => (dra.current = null)}
        onPointerCancel={() => (dra.current = null)}
      >
        <path d={k.bakgrunn} fill={KART_FARGE.bakgrunn} />
        {Object.entries(k.land).map(([id, d]) => (
          <path
            key={id}
            data-id={id}
            d={d}
            fill={farger[id] ?? KART_FARGE.ukjent}
            stroke={fremhevet?.includes(id) ? "#fff" : KART_FARGE.hav}
            strokeWidth={fremhevet?.includes(id) ? 1.5 : 0.5}
            vectorEffect="non-scaling-stroke"
            className="transition-[fill] duration-300"
          >
            {titler?.[id] ? <title>{titler[id]}</title> : null}
          </path>
        ))}
        {Object.entries(k.punkter).map(([id, [x, y]]) => (
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

"use client"

import "maplibre-gl/dist/maplibre-gl.css"
import "./hex-kart.css"
import { AttributionControl, LngLatBounds, Map as Kart, Marker, setWorkerUrl, type GeoJSONSource, type StyleSpecification } from "maplibre-gl"
import { Minus, Plus, RotateCcw } from "lucide-react"
import { useEffect, useEffectEvent, useRef, useState } from "react"
import { nivaaForZoom } from "../lib/heksagon"
import { celleFor, omriss, sentrum, sirkel, synligeCeller } from "../lib/heksagon-celler"

// The map for Heksagonal jakt: OpenFreeMap vector tiles in our own dark style, with the H3 grid on top.
// Loaded on its own (next/dynamic) so MapLibre and H3 only come with this game.

// The worker ships as its own module; the bundler copies it and gives us its URL.
setWorkerUrl(new URL("maplibre-gl/dist/maplibre-gl-worker.mjs", import.meta.url).href)

// Close to Verdenskart's KART_FARGE. Built-up areas and roads are warm and fairly bright: they are how you find a city.
const FARGE = {
  land: "#30343a",
  hav: "#1b232b",
  skog: "#2c3632",
  is: "#41474f",
  sand: "#3a3833",
  bolig: "#6a5f4d",
  industri: "#565660",
  grense: "#8a909a",
  vei: "#6c6558",
  storvei: "#8d8068",
}

const SENTRUM: [number, number] = [10, 25]
const MIN_ZOOM = 0.6
const MAKS_ZOOM = 10.5

/** The opening zoom, from the map's width: the whole world across it, also on a narrow phone. */
const startZoom = (bredde: number) => Math.min(2.9, Math.log2((Math.max(bredde, 256) * 1.02) / 512))

const tom = { type: "FeatureCollection", features: [] } as GeoJSON.FeatureCollection
const kilde = { type: "geojson", data: tom } as const
const zoomet = (par: [number, number][]) => ["interpolate", ["exponential", 1.5], ["zoom"], ...par.flat()] as unknown as number
/** Line widths by zoom and feature class: stops of [zoom, widths per class, width of the rest]. */
const perKlasse = (stopp: [number, Record<string, number>, number][]) =>
  ["interpolate", ["exponential", 1.5], ["zoom"], ...stopp.flatMap(([z, klasser, ellers]) => [z, ["match", ["get", "class"], ...Object.entries(klasser).flat(), ellers]])] as unknown as number

// No symbol layers at all: names of places, roads or water would give the answer away.
const STIL: StyleSpecification = {
  version: 8,
  sources: {
    omt: { type: "vector", url: "https://tiles.openfreemap.org/planet" },
    rutenett: kilde,
    peker: kilde,
    gjetninger: kilde,
    valgt: kilde,
    fasit: kilde,
  },
  layers: [
    { id: "land", type: "background", paint: { "background-color": FARGE.land } },
    {
      id: "landdekke",
      type: "fill",
      source: "omt",
      "source-layer": "landcover",
      filter: ["in", ["get", "class"], ["literal", ["wood", "grass", "wetland", "ice", "sand"]]],
      paint: {
        "fill-color": ["match", ["get", "class"], "ice", FARGE.is, "sand", FARGE.sand, FARGE.skog],
        "fill-opacity": ["interpolate", ["linear"], ["zoom"], 0, 0.5, 8, 0.8],
        "fill-antialias": false,
      },
    },
    {
      id: "arealbruk",
      type: "fill",
      source: "omt",
      "source-layer": "landuse",
      filter: ["in", ["get", "class"], ["literal", ["residential", "suburb", "neighbourhood", "quarter", "commercial", "industrial", "retail"]]],
      paint: {
        "fill-color": ["match", ["get", "class"], ["commercial", "industrial", "retail"], FARGE.industri, FARGE.bolig],
        "fill-opacity": ["interpolate", ["linear"], ["zoom"], 4, 0.7, 10, 1],
      },
    },
    { id: "vann", type: "fill", source: "omt", "source-layer": "water", paint: { "fill-color": FARGE.hav } },
    {
      id: "elver",
      type: "line",
      source: "omt",
      "source-layer": "waterway",
      filter: ["!=", ["get", "brunnel"], "tunnel"],
      paint: {
        "line-color": FARGE.hav,
        "line-width": perKlasse([[3, { river: 0.4 }, 0], [8, { river: 1.2 }, 0.3], [11, { river: 2.5 }, 1]]),
      },
    },
    {
      id: "veier",
      type: "line",
      source: "omt",
      "source-layer": "transportation",
      minzoom: 4,
      filter: ["in", ["get", "class"], ["literal", ["motorway", "trunk", "primary", "secondary", "tertiary"]]],
      layout: { "line-cap": "round", "line-join": "round" },
      paint: {
        "line-color": ["match", ["get", "class"], ["motorway", "trunk"], FARGE.storvei, FARGE.vei],
        "line-width": perKlasse([
          [4, { motorway: 0.4, trunk: 0.4 }, 0],
          [6, { motorway: 0.8, trunk: 0.8, primary: 0.3 }, 0],
          [8, { motorway: 1.2, trunk: 1.2, primary: 0.7 }, 0.2],
          [11, { motorway: 2.4, trunk: 2.4, primary: 1.6 }, 1],
        ]),
        "line-opacity": ["interpolate", ["linear"], ["zoom"], 4, 0.6, 8, 1],
      },
    },
    {
      id: "regioner",
      type: "line",
      source: "omt",
      "source-layer": "boundary",
      minzoom: 4,
      filter: ["all", ["==", ["get", "admin_level"], 4], ["!=", ["get", "maritime"], 1]],
      paint: { "line-color": FARGE.grense, "line-opacity": 0.35, "line-width": zoomet([[4, 0.4], [10, 1]]), "line-dasharray": [3, 2] },
    },
    {
      id: "grenser",
      type: "line",
      source: "omt",
      "source-layer": "boundary",
      filter: ["all", ["==", ["get", "admin_level"], 2], ["!=", ["get", "maritime"], 1]],
      layout: { "line-join": "round" },
      paint: {
        "line-color": FARGE.grense,
        "line-opacity": 0.75,
        "line-width": zoomet([[0, 0.5], [5, 1], [10, 1.8]]),
        "line-dasharray": ["case", ["==", ["get", "disputed"], 1], ["literal", [2, 2]], ["literal", [1, 0]]],
      },
    },
    { id: "rutenett", type: "line", source: "rutenett", paint: { "line-color": "#ffffff", "line-opacity": 0.28, "line-width": 0.75 } },
    { id: "peker", type: "fill", source: "peker", paint: { "fill-color": "#ffffff", "fill-opacity": 0.1 } },
    { id: "gjetninger", type: "fill", source: "gjetninger", paint: { "fill-color": ["get", "farge"], "fill-opacity": 0.5 } },
    { id: "gjetninger-kant", type: "line", source: "gjetninger", paint: { "line-color": ["get", "farge"], "line-width": 1.5 } },
    { id: "valgt", type: "fill", source: "valgt", paint: { "fill-color": "#ffffff", "fill-opacity": 0.25 } },
    { id: "valgt-kant", type: "line", source: "valgt", paint: { "line-color": "#ffffff", "line-width": 2 } },
    { id: "fasit-flate", type: "fill", source: "fasit", filter: ["==", ["get", "del"], "omraade"], paint: { "fill-color": "#22c55e", "fill-opacity": 0.15 } },
    {
      id: "fasit-omraade",
      type: "line",
      source: "fasit",
      filter: ["==", ["get", "del"], "omraade"],
      paint: { "line-color": "#22c55e", "line-width": 1.5, "line-dasharray": [3, 2] },
    },
    { id: "fasit-celle", type: "line", source: "fasit", filter: ["==", ["get", "del"], "celle"], paint: { "line-color": "#22c55e", "line-width": 2 } },
    {
      id: "fasit-punkt",
      type: "circle",
      source: "fasit",
      filter: ["==", ["get", "del"], "punkt"],
      paint: { "circle-radius": 4.5, "circle-color": "#ffffff", "circle-stroke-color": "#22c55e", "circle-stroke-width": 2 },
    },
  ],
}

const flate = (celler: string[], egenskaper: (c: string) => GeoJSON.GeoJsonProperties = () => ({})): GeoJSON.FeatureCollection => ({
  type: "FeatureCollection",
  features: celler.map((c) => ({ type: "Feature", properties: egenskaper(c), geometry: { type: "Polygon", coordinates: [omriss(c)] } })),
})

function harWebGL() {
  try {
    const c = document.createElement("canvas")
    return Boolean(c.getContext("webgl2") ?? c.getContext("webgl"))
  } catch {
    return false
  }
}

export type KartCelle = { celle: string; farge: string }
export type KartPunkt = { punkt: [number, number]; farge: string; tekst: string }
export type KartFasit = { punkt: [number, number]; radiusKm: number; nivaa: number }

export default function HexKart({
  forhold,
  aktiv,
  valgt,
  celler,
  fasit,
  punkter,
  ramme,
  runde,
  onVelg,
  onNivaa,
}: {
  /** Height as a share of the width. */
  forhold: number
  /** Choosing a hex: shows the grid, and taps choose. */
  aktiv: boolean
  /** The chosen point [lat, lng]; its hex follows the zoom level. */
  valgt: [number, number] | null
  /** Guessed hexes, coloured by their feedback. */
  celler: KartCelle[]
  /** The answer, once shown: the place, its ground and its hex at the level of the last guess. */
  fasit: KartFasit | null
  /** Numbered dots, for the day's summary. */
  punkter: KartPunkt[]
  /** Points [lat, lng] and hexes to frame whenever they change. */
  ramme: { punkter: [number, number][]; celler: string[] } | null
  /** A new round goes back to the whole world. */
  runde: number
  onVelg: (punkt: [number, number] | null) => void
  onNivaa: (nivaa: number) => void
}) {
  const boks = useRef<HTMLDivElement>(null)
  const [kart, setKart] = useState<Kart | null>(null)
  const [nivaa, setNivaa] = useState(0)
  const [feil, setFeil] = useState(() => !harWebGL())
  const nivaaRef = useRef(0)
  // The loaded map; effects check it to skip one already removed (React re-runs effects in development).
  const levende = useRef<Kart | null>(null)

  const velg = useEffectEvent((lat: number, lng: number) => {
    if (!aktiv) return
    // Tapping the chosen hex again clears it.
    const celle = celleFor(lat, lng, nivaaRef.current)
    onVelg(valgt && celleFor(valgt[0], valgt[1], nivaaRef.current) === celle ? null : [lat, lng])
  })
  const nyttNivaa = useEffectEvent((n: number) => {
    setNivaa(n)
    onNivaa(n)
  })

  useEffect(() => {
    const el = boks.current
    if (!el || feil) return
    let k: Kart
    try {
      k = new Kart({
        container: el,
        style: STIL,
        center: SENTRUM,
        zoom: startZoom(el.clientWidth),
        // Narrow phones may zoom out until the whole world fits the width.
        minZoom: Math.min(MIN_ZOOM, Math.log2(Math.max(el.clientWidth, 256) / 512)),
        maxZoom: MAKS_ZOOM,
        // Fewer pixels on phones keeps panning smooth.
        pixelRatio: Math.min(window.devicePixelRatio || 1, window.matchMedia("(pointer: coarse)").matches ? 1.5 : 2),
        fadeDuration: 80,
        refreshExpiredTiles: false,
        renderWorldCopies: true,
        attributionControl: false,
        dragRotate: false,
        pitchWithRotate: false,
        touchPitch: false,
      })
    } catch {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- WebGL can still fail after the check above
      setFeil(true)
      return
    }
    k.addControl(new AttributionControl({ compact: true }), "bottom-left")
    // The compact credit opens itself at first and would cover the bottom of a small map; start it folded.
    k.once("load", () => el.querySelector(".maplibregl-ctrl-attrib")?.classList.remove("maplibregl-compact-show"))
    k.touchZoomRotate.disableRotation()
    k.keyboard.disableRotation()

    // The grid: cells in the view plus a margin, redrawn when the view leaves the margin or the level changes.
    let tegnet: { n: number; v: number; s: number; o: number; no: number } | null = null
    let planlagt = 0
    const rutenett = () => {
      planlagt = 0
      const b = k.getBounds()
      const [v, s, o, no] = [b.getWest(), b.getSouth(), b.getEast(), b.getNorth()]
      const helVerden = o - v >= 350 || (no >= 85 && s <= -85)
      const n = nivaaForZoom(k.getZoom(), nivaaRef.current, helVerden)
      if (n !== nivaaRef.current) {
        nivaaRef.current = n
        nyttNivaa(n)
      }
      if (tegnet && tegnet.n === n && v >= tegnet.v && o <= tegnet.o && s >= tegnet.s && no <= tegnet.no) return
      const mx = (o - v) * 0.2
      const my = (no - s) * 0.2
      tegnet = { n, v: v - mx, s: s - my, o: o + mx, no: no + my }
      const celler = synligeCeller(tegnet.v, tegnet.s, tegnet.o, tegnet.no, n)
      const ringer = celler.map((c) => [omriss(c)])
      k.getSource<GeoJSONSource>("rutenett")?.setData({ type: "Feature", properties: {}, geometry: { type: "MultiPolygon", coordinates: ringer } })
    }
    const planlegg = () => {
      if (!planlagt) planlagt = requestAnimationFrame(rutenett)
    }
    k.on("load", () => {
      rutenett()
      levende.current = k
      setKart(k)
    })
    k.on("move", planlegg)
    k.on("click", (e) => {
      const p = e.lngLat.wrap()
      velg(p.lat, p.lng)
    })

    // The hex under the mouse, on devices that hover.
    if (window.matchMedia("(hover: hover)").matches) {
      let under = ""
      k.on("mousemove", (e) => {
        const p = e.lngLat.wrap()
        const c = celleFor(p.lat, p.lng, nivaaRef.current)
        if (c === under) return
        under = c
        k.getSource<GeoJSONSource>("peker")?.setData(flate([c]))
      })
      k.on("mouseout", () => {
        under = ""
        k.getSource<GeoJSONSource>("peker")?.setData(tom)
      })
    }
    return () => {
      cancelAnimationFrame(planlagt)
      levende.current = null
      k.remove()
      setKart(null)
    }
  }, [feil])

  // The grid and the hover hex only while choosing.
  useEffect(() => {
    if (!kart || kart !== levende.current) return
    if (!aktiv) kart.getSource<GeoJSONSource>("peker")?.setData(tom)
    for (const lag of ["rutenett", "peker"]) kart.setLayoutProperty(lag, "visibility", aktiv ? "visible" : "none")
  }, [kart, aktiv])

  // Keys anywhere on the page, like the other maps: + and − zoom, arrows pan, 0 shows the world.
  // On the focused map, MapLibre's own keyboard handler does the same.
  useEffect(() => {
    if (!kart || kart !== levende.current) return
    const ved = (e: KeyboardEvent) => {
      const mal = e.target instanceof Element ? e.target : null
      if (e.ctrlKey || e.metaKey || e.altKey || mal?.closest("input, textarea, select, [contenteditable=true]") || kart.getContainer().contains(mal)) return
      const handling: Record<string, () => void> = {
        "+": () => kart.zoomIn(),
        "=": () => kart.zoomIn(),
        "-": () => kart.zoomOut(),
        _: () => kart.zoomOut(),
        "0": () => kart.easeTo({ center: SENTRUM, zoom: startZoom(kart.getContainer().clientWidth) }),
        ArrowLeft: () => kart.panBy([-100, 0]),
        ArrowRight: () => kart.panBy([100, 0]),
        ArrowUp: () => kart.panBy([0, -100]),
        ArrowDown: () => kart.panBy([0, 100]),
      }
      const h = handling[e.key]
      if (!h) return
      e.preventDefault()
      h()
    }
    window.addEventListener("keydown", ved)
    return () => window.removeEventListener("keydown", ved)
  }, [kart])

  const valgtCelle = valgt ? celleFor(valgt[0], valgt[1], nivaa) : null
  useEffect(() => {
    if (!kart || kart !== levende.current) return
    kart.getSource<GeoJSONSource>("valgt")?.setData(valgtCelle ? flate([valgtCelle]) : tom)
  }, [kart, valgtCelle])

  const cellerNokkel = celler.map((c) => `${c.celle}:${c.farge}`).join(",")
  useEffect(() => {
    if (!kart || kart !== levende.current) return
    const farger = new Map(cellerNokkel ? cellerNokkel.split(",").map((s) => s.split(":") as [string, string]) : [])
    kart.getSource<GeoJSONSource>("gjetninger")?.setData(flate([...farger.keys()], (c) => ({ farge: farger.get(c) })))
  }, [kart, cellerNokkel])

  const fasitNokkel = fasit ? `${fasit.punkt.join(",")}:${fasit.radiusKm}:${fasit.nivaa}` : ""
  useEffect(() => {
    if (!kart || kart !== levende.current) return
    if (!fasitNokkel) {
      kart.getSource<GeoJSONSource>("fasit")?.setData(tom)
      return
    }
    const [p, r, n] = fasitNokkel.split(":")
    const punkt = p.split(",").map(Number) as [number, number]
    const radiusKm = Number(r)
    const deler: GeoJSON.Feature[] = [
      ...flate([celleFor(punkt[0], punkt[1], Number(n))], () => ({ del: "celle" })).features,
      { type: "Feature", properties: { del: "punkt" }, geometry: { type: "Point", coordinates: [punkt[1], punkt[0]] } },
    ]
    if (radiusKm > 0) {
      const ring = sirkel(punkt, radiusKm).map(([lat, lng]) => [lng, lat])
      deler.unshift({ type: "Feature", properties: { del: "omraade" }, geometry: { type: "Polygon", coordinates: [[...ring, ring[0]]] } })
    }
    kart.getSource<GeoJSONSource>("fasit")?.setData({ type: "FeatureCollection", features: deler })
  }, [kart, fasitNokkel])

  // The summary's numbered dots are small HTML markers: the style has no fonts, by design.
  const punktNokkel = JSON.stringify(punkter)
  useEffect(() => {
    if (!kart || kart !== levende.current) return
    const merker = (JSON.parse(punktNokkel) as KartPunkt[]).map((p) => {
      const el = document.createElement("div")
      el.textContent = p.tekst
      el.style.cssText = `width:18px;height:18px;border-radius:9999px;background:${p.farge};border:1.5px solid #fff;color:#0b1016;font:700 10px/15px ui-sans-serif,system-ui,sans-serif;text-align:center;pointer-events:none`
      return new Marker({ element: el }).setLngLat([p.punkt[1], p.punkt[0]]).addTo(kart)
    })
    return () => merker.forEach((m) => m.remove())
  }, [kart, punktNokkel])

  const rammeNokkel = ramme ? JSON.stringify(ramme) : ""
  useEffect(() => {
    if (!kart || kart !== levende.current || !rammeNokkel) return
    const { punkter: p, celler: c } = JSON.parse(rammeNokkel) as { punkter: [number, number][]; celler: string[] }
    const alle = [...p, ...c.map(sentrum)]
    if (!alle.length) return
    // Longitudes near the first point, so a frame across the date line stays narrow.
    const l0 = alle[0][1]
    const b = new LngLatBounds()
    for (const [lat, lng] of alle) b.extend([lng - Math.round((lng - l0) / 360) * 360, lat])
    const h = kart.getContainer().clientHeight
    kart.fitBounds(b, { padding: Math.min(60, h / 5), maxZoom: 6, duration: 900 })
  }, [kart, rammeNokkel])

  // Each new round starts from the whole world.
  const forrigeRunde = useRef(runde)
  useEffect(() => {
    if (!kart || kart !== levende.current || forrigeRunde.current === runde) return
    forrigeRunde.current = runde
    kart.easeTo({ center: SENTRUM, zoom: startZoom(kart.getContainer().clientWidth), duration: 700 })
  }, [kart, runde])

  const knapp =
    "flex h-8 w-8 items-center justify-center rounded-lg bg-neutral-100/90 text-neutral-700 shadow-sm backdrop-blur transition hover:text-neutral-950"

  return (
    <div className="heks-kart relative overflow-hidden rounded-2xl" style={{ background: FARGE.hav, aspectRatio: `${1 / forhold}` }}>
      {feil ? (
        <p className="absolute inset-0 flex items-center justify-center p-6 text-center text-sm text-white/70">
          Kartet trenger WebGL, og det er ikke tilgjengelig i denne nettleseren. Prøv en annen nettleser, eller slå på maskinvareakselerasjon.
        </p>
      ) : (
        <div ref={boks} className="h-full w-full" />
      )}
      {kart ? (
        <div className="absolute right-2 bottom-2 flex flex-col gap-1">
          <button type="button" className={knapp} onClick={() => kart.zoomIn()} aria-label="Zoom inn">
            <Plus className="h-4 w-4" />
          </button>
          <button type="button" className={knapp} onClick={() => kart.zoomOut()} aria-label="Zoom ut">
            <Minus className="h-4 w-4" />
          </button>
          <button
            type="button"
            className={knapp}
            onClick={() => kart.easeTo({ center: SENTRUM, zoom: startZoom(kart.getContainer().clientWidth) })}
            aria-label="Vis hele kartet"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </button>
        </div>
      ) : null}
    </div>
  )
}

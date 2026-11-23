// Client-only utilities for Moggern:
//   1. Local "Peak Mog" freeze-frame capture (stays 100% in browser RAM, never uploaded).
//   2. Shareable Duel Card PNG renderer (1v1 or Solo) using an offscreen Canvas.
//   3. Local "Dagens beste score" tracker (keyed by Oslo date in localStorage).

import { iDagOslo } from "../dag"
import { formaterMoggernPoeng } from "./poeng"
import { rangForPoeng } from "./tekster"

export type DagensBeste = {
  dato: string
  poeng: number
  modus: "duell" | "solo"
}

const DAGENS_BESTE_NOKKEL = "moggern:dagens-beste:v1"

/** Pure parser for daily-best records (exported for unit tests). */
export function lesDagensBesteFraTekst(raa: string | null, iDag: string): DagensBeste | null {
  if (!raa) return null
  try {
    const parsed = JSON.parse(raa) as Record<string, unknown> | null
    if (!parsed || typeof parsed !== "object") return null
    if (parsed.dato !== iDag) return null
    if (typeof parsed.poeng !== "number" || !Number.isFinite(parsed.poeng) || parsed.poeng < 0 || parsed.poeng > 10) {
      return null
    }
    const modus = parsed.modus === "duell" || parsed.modus === "solo" ? parsed.modus : "duell"
    return { dato: iDag, poeng: Math.round(parsed.poeng * 10) / 10, modus }
  } catch {
    return null
  }
}

/** Pure updater: keeps the higher score for the same day, or resets when a new Oslo day starts. */
export function oppdaterDagensBesteVerdi(
  eksisterende: DagensBeste | null,
  nyPoeng: number,
  modus: "duell" | "solo",
  iDag: string,
): { verdi: DagensBeste; nyRekord: boolean } {
  const ren = Math.round(Math.max(0, Math.min(10, nyPoeng)) * 10) / 10
  if (!eksisterende || eksisterende.dato !== iDag || ren > eksisterende.poeng) {
    return { verdi: { dato: iDag, poeng: ren, modus }, nyRekord: true }
  }
  return { verdi: eksisterende, nyRekord: false }
}

export function lesDagensBeste(): DagensBeste | null {
  if (typeof window === "undefined") return null
  try {
    return lesDagensBesteFraTekst(localStorage.getItem(DAGENS_BESTE_NOKKEL), iDagOslo())
  } catch {
    return null
  }
}

export function lagreDagensBeste(poeng: number, modus: "duell" | "solo"): { verdi: DagensBeste; nyRekord: boolean } {
  const iDag = iDagOslo()
  const eksisterende = lesDagensBeste()
  const res = oppdaterDagensBesteVerdi(eksisterende, poeng, modus, iDag)
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(DAGENS_BESTE_NOKKEL, JSON.stringify(res.verdi))
    } catch {}
  }
  return res
}

/**
 * Captures a crisp 4:5 portrait snapshot from a live HTMLVideoElement using object-cover cropping.
 * Returns a local JPEG data URL kept strictly in browser memory (never sent over the network).
 */
export function fangVideoBilde(video: HTMLVideoElement, speilet: boolean, bredde = 400, hoyde = 500): string | null {
  if (typeof document === "undefined") return null
  const vw = video.videoWidth
  const vh = video.videoHeight
  if (!vw || !vh || video.readyState < 2) return null

  const lerret = document.createElement("canvas")
  lerret.width = bredde
  lerret.height = hoyde
  const ctx = lerret.getContext("2d")
  if (!ctx) return null

  const skala = Math.max(bredde / vw, hoyde / vh)
  const tegnB = vw * skala
  const tegnH = vh * skala
  const dx = (bredde - tegnB) / 2
  const dy = (hoyde - tegnH) / 2

  ctx.save()
  if (speilet) {
    ctx.translate(bredde, 0)
    ctx.scale(-1, 1)
  }
  ctx.drawImage(video, dx, dy, tegnB, tegnH)
  ctx.restore()

  try {
    return lerret.toDataURL("image/jpeg", 0.84)
  } catch {
    return null
  }
}

export type DuellKortSpiller = {
  navn: string
  poeng: number
  erVinner: boolean
  bildeUrl?: string | null
  uttrykkTekst?: string | null
  diss?: string | null
}

const RANG_HEX: Record<string, { bg: string; fg: string }> = {
  gigamogger: { bg: "#a3e635", fg: "#18191b" },
  sheeshern: { bg: "#34d399", fg: "#18191b" },
  "aura-farmer": { bg: "#22d3ee", fg: "#18191b" },
  "mid-mogger": { bg: "#38bdf8", fg: "#18191b" },
  normie: { bg: "#fcd34d", fg: "#18191b" },
  venstredude: { bg: "#fb923c", fg: "#18191b" },
  chopped: { bg: "#fb7185", fg: "#18191b" },
  bjeffern: { bg: "#ef4444", fg: "#ffffff" },
}

function lastBilde(url: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => resolve(null)
    img.src = url
  })
}

function tegnAvrundetRekt(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath()
  ctx.roundRect(x, y, w, h, r)
}

function brytTekst(ctx: CanvasRenderingContext2D, tekst: string, maksBredde: number, maksLinjer: number): string[] {
  const ord = tekst.split(/\s+/)
  const linjer: string[] = []
  let na = ""
  for (const o of ord) {
    const prov = na ? `${na} ${o}` : o
    if (ctx.measureText(prov).width <= maksBredde) {
      na = prov
    } else {
      if (na) linjer.push(na)
      na = o
      if (linjer.length >= maksLinjer) break
    }
  }
  if (na && linjer.length < maksLinjer) linjer.push(na)
  return linjer
}

/**
 * Renders a shareable dark-mode PNG duel card (1200×675 for 1v1, 820×920 for solo)
 * completely client-side and triggers a browser file download.
 */
export async function lastNedDuellKortPng(input: {
  tittel: string
  underTittel: string
  spillere: DuellKortSpiller[]
  filnavn: string
}): Promise<boolean> {
  if (typeof document === "undefined" || input.spillere.length === 0) return false
  const erSolo = input.spillere.length === 1
  const W = erSolo ? 820 : 1200
  const H = erSolo ? 880 : 675

  const lerret = document.createElement("canvas")
  lerret.width = W
  lerret.height = H
  const ctx = lerret.getContext("2d")
  if (!ctx) return false

  // Background + subtle top lime radial glow matching Gjetteløs dark theme
  ctx.fillStyle = "#111214"
  ctx.fillRect(0, 0, W, H)

  const glod = ctx.createRadialGradient(W / 2, 0, 20, W / 2, 0, W * 0.65)
  glod.addColorStop(0, "rgba(190, 242, 100, 0.14)")
  glod.addColorStop(1, "rgba(17, 18, 20, 0)")
  ctx.fillStyle = glod
  ctx.fillRect(0, 0, W, H)

  const font = 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif'

  // Header
  ctx.textAlign = "center"
  ctx.fillStyle = "#bef264"
  ctx.font = `600 18px ${font}`
  ctx.fillText(input.underTittel.toUpperCase(), W / 2, 54)

  ctx.fillStyle = "#f4f4f5"
  ctx.font = `700 ${erSolo ? 36 : 38}px ${font}`
  const tittelLinjer = brytTekst(ctx, input.tittel, W - 120, 2)
  tittelLinjer.forEach((linje, i) => {
    ctx.fillText(linje, W / 2, 104 + i * 44)
  })

  const kortTopp = tittelLinjer.length > 1 ? 182 : 148
  const kortBunn = H - 64
  const kortHoyde = kortBunn - kortTopp

  // Preload local peak portraits
  const bilder = await Promise.all(input.spillere.map((s) => (s.bildeUrl ? lastBilde(s.bildeUrl) : Promise.resolve(null))))

  const marg = 48
  const mellomrom = 28
  const kortBredde = erSolo ? W - marg * 2 : (W - marg * 2 - mellomrom) / 2

  for (let i = 0; i < input.spillere.length; i++) {
    const s = input.spillere[i]
    const img = bilder[i]
    const x = marg + i * (kortBredde + mellomrom)
    const y = kortTopp

    // Card surface
    ctx.save()
    tegnAvrundetRekt(ctx, x, y, kortBredde, kortHoyde, 28)
    ctx.fillStyle = "#191b1e"
    ctx.fill()
    ctx.lineWidth = s.erVinner ? 2.5 : 1.5
    ctx.strokeStyle = s.erVinner ? "rgba(190, 242, 100, 0.55)" : "rgba(255, 255, 255, 0.08)"
    ctx.stroke()
    ctx.restore()

    const pad = 28
    const bildeW = erSolo ? 240 : 186
    const bildeH = erSolo ? 300 : 232
    const bildeX = x + pad
    const bildeY = y + pad

    // Portrait thumbnail (or monogram placeholder)
    ctx.save()
    tegnAvrundetRekt(ctx, bildeX, bildeY, bildeW, bildeH, 20)
    ctx.clip()
    if (img) {
      const sk = Math.max(bildeW / img.width, bildeH / img.height)
      const tw = img.width * sk
      const th = img.height * sk
      ctx.drawImage(img, bildeX + (bildeW - tw) / 2, bildeY + (bildeH - th) / 2, tw, th)
    } else {
      ctx.fillStyle = "#24272c"
      ctx.fillRect(bildeX, bildeY, bildeW, bildeH)
      ctx.fillStyle = "rgba(255,255,255,0.28)"
      ctx.font = `700 64px ${font}`
      ctx.textAlign = "center"
      ctx.fillText(s.navn.slice(0, 1).toUpperCase(), bildeX + bildeW / 2, bildeY + bildeH / 2 + 22)
    }
    ctx.restore()

    // Subtle border around portrait
    ctx.save()
    tegnAvrundetRekt(ctx, bildeX, bildeY, bildeW, bildeH, 20)
    ctx.strokeStyle = "rgba(255,255,255,0.12)"
    ctx.lineWidth = 1.5
    ctx.stroke()
    ctx.restore()

    // Right column of card: name, big score, rank badge
    const infoX = bildeX + bildeW + 24
    const infoMaksW = x + kortBredde - pad - infoX
    ctx.textAlign = "left"

    ctx.fillStyle = s.erVinner ? "#bef264" : "#a1a1aa"
    ctx.font = `600 15px ${font}`
    ctx.fillText(s.erVinner ? "★ VINNER" : erSolo ? "SOLO-TEST" : "DUELLANT", infoX, bildeY + 22)

    ctx.fillStyle = "#f4f4f5"
    ctx.font = `700 30px ${font}`
    const navnLinje = brytTekst(ctx, s.navn, infoMaksW, 1)[0] ?? s.navn
    ctx.fillText(navnLinje, infoX, bildeY + 60)

    // Score
    ctx.fillStyle = "#ffffff"
    ctx.font = `700 72px ${font}`
    ctx.fillText(formaterMoggernPoeng(s.poeng), infoX, bildeY + 144)
    ctx.fillStyle = "#71717a"
    ctx.font = `600 20px ${font}`
    ctx.fillText("/ 10", infoX + ctx.measureText(formaterMoggernPoeng(s.poeng)).width + 10, bildeY + 144)

    // Rank pill
    const rang = rangForPoeng(s.poeng)
    const farge = RANG_HEX[rang.id] ?? { bg: "#fcd34d", fg: "#18191b" }
    ctx.font = `700 18px ${font}`
    const pillTekstW = ctx.measureText(rang.tittel).width
    const pillW = pillTekstW + 32
    const pillH = 38
    const pillY = bildeY + 168
    ctx.save()
    tegnAvrundetRekt(ctx, infoX, pillY, pillW, pillH, 19)
    ctx.fillStyle = farge.bg
    ctx.fill()
    ctx.restore()
    ctx.fillStyle = farge.fg
    ctx.fillText(rang.tittel, infoX + 16, pillY + 25)

    // Bottom section of card: expression verdict + roast quote
    let tekstY = bildeY + bildeH + 34
    const bunnMaksW = kortBredde - pad * 2
    if (s.uttrykkTekst) {
      ctx.fillStyle = "#d4d4d8"
      ctx.font = `600 17px ${font}`
      const uLinjer = brytTekst(ctx, s.uttrykkTekst, bunnMaksW, 2)
      for (const l of uLinjer) {
        ctx.fillText(l, x + pad, tekstY)
        tekstY += 24
      }
      tekstY += 10
    }
    if (s.diss) {
      ctx.fillStyle = "#fda4af"
      ctx.font = `500 17px ${font}`
      const dLinjer = brytTekst(ctx, `«${s.diss}»`, bunnMaksW, 3)
      for (const l of dLinjer) {
        ctx.fillText(l, x + pad, tekstY)
        tekstY += 24
      }
    }
  }

  // Footer
  ctx.textAlign = "center"
  ctx.fillStyle = "#71717a"
  ctx.font = `500 16px ${font}`
  ctx.fillText("thodh.com/spill/moggern  ·  Alt her er tull — ingen vitenskap, ingen opptak", W / 2, H - 26)

  const blob = await new Promise<Blob | null>((resolve) => lerret.toBlob((b) => resolve(b), "image/png"))
  if (!blob) return false
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = input.filnavn
  document.body.appendChild(a)
  a.click()
  a.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 4000)
  return true
}

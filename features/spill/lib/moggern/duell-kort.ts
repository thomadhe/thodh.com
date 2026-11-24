// Client-only utilities for Moggern:
//   1. Local "Peak Mog" freeze-frame capture (stays 100% in browser RAM, never uploaded).
//   2. Shareable Duel Card PNG renderer (1v1 or Solo) using an offscreen Canvas.
//   3. Local "Dagens beste score" tracker (keyed by Oslo date in localStorage).

import { iDagOslo } from "../dag"
import { formaterBonus, formaterMoggernPoeng } from "./poeng"
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
 * Captures a crisp 4:5 portrait snapshot from a live HTMLVideoElement or relay HTMLCanvasElement
 * using object-cover cropping. Kept strictly ephemeral in browser memory / 2-player room broadcast (never persisted).
 */
export function fangVideoBilde(
  kilde: HTMLVideoElement | HTMLCanvasElement,
  speilet: boolean,
  bredde = 280,
  hoyde = 350,
): string | null {
  if (typeof document === "undefined") return null
  let vw = 0
  let vh = 0
  if (typeof HTMLVideoElement !== "undefined" && kilde instanceof HTMLVideoElement) {
    if (kilde.readyState < 2) return null
    vw = kilde.videoWidth
    vh = kilde.videoHeight
  } else {
    vw = (kilde as HTMLCanvasElement).width
    vh = (kilde as HTMLCanvasElement).height
  }
  if (!vw || !vh) return null

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
  ctx.drawImage(kilde, dx, dy, tegnB, tegnH)
  ctx.restore()

  try {
    const bilde = lerret.toDataURL("image/jpeg", 0.74)
    if (bilde.length <= 45_000) return bilde
    return lerret.toDataURL("image/jpeg", 0.56)
  } catch {
    return null
  }
}

export type RelayRamme = {
  av: string
  dataUrl: string
  w: number
  h: number
}

const MAKS_RELAY_TEGN = 48_000

/**
 * Captures a lightweight proportional JPEG frame (~6–10 KB, unflipped like WebRTC)
 * for automatic HTTPS/WSS fallback when direct P2P WebRTC is blocked by 5G CGNAT or strict Wi-Fi.
 */
export function fangRelayRamme(
  video: HTMLVideoElement,
  lerret: HTMLCanvasElement,
  maksSide = 240,
): { dataUrl: string; w: number; h: number } | null {
  const vw = video.videoWidth
  const vh = video.videoHeight
  if (!vw || !vh || video.readyState < 2 || video.paused || video.ended) return null

  const skala = Math.min(1, maksSide / Math.max(vw, vh))
  const w = Math.max(64, Math.round(vw * skala))
  const h = Math.max(64, Math.round(vh * skala))
  if (lerret.width !== w || lerret.height !== h) {
    lerret.width = w
    lerret.height = h
  }
  const ctx = lerret.getContext("2d")
  if (!ctx) return null
  ctx.drawImage(video, 0, 0, w, h)

  try {
    const dataUrl = lerret.toDataURL("image/jpeg", 0.55)
    if (dataUrl.length <= MAKS_RELAY_TEGN) return { dataUrl, w, h }
    const mindre = lerret.toDataURL("image/jpeg", 0.38)
    return mindre.length <= MAKS_RELAY_TEGN ? { dataUrl: mindre, w, h } : null
  } catch {
    return null
  }
}

/** Validates an incoming ephemeral video relay frame broadcast over Supabase Realtime. */
export function lesRelayRamme(x: unknown): RelayRamme | null {
  if (!x || typeof x !== "object") return null
  const o = x as Record<string, unknown>
  if (typeof o.av !== "string" || !o.av || o.av.length > 64) return null
  if (
    typeof o.dataUrl !== "string" ||
    !o.dataUrl.startsWith("data:image/jpeg;base64,") ||
    o.dataUrl.length > MAKS_RELAY_TEGN
  ) {
    return null
  }
  if (
    typeof o.w !== "number" ||
    typeof o.h !== "number" ||
    !Number.isInteger(o.w) ||
    !Number.isInteger(o.h) ||
    o.w < 64 ||
    o.w > 400 ||
    o.h < 64 ||
    o.h > 400
  ) {
    return null
  }
  return { av: o.av, dataUrl: o.dataUrl, w: o.w, h: o.h }
}

export type DuellKortSpiller = {
  navn: string
  poeng: number
  erVinner: boolean
  bildeUrl?: string | null
  uttrykkTekst?: string | null
  diss?: string | null
  finisherBonus?: number
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

export type DuellKortInput = {
  /** Short headline for 1v1 duels (omitted on solo so name/score/rank aren't duplicated). */
  tittel?: string | null
  underTittel: string
  spillere: DuellKortSpiller[]
  filnavn: string
  sprak?: "no" | "en"
}

/** Short, clean caption paired with the shared PNG card image (no duplicated score dump). */
export function deleTekstForKort(solo: boolean, sprak: "no" | "en" = "no"): string {
  if (sprak === "en") return solo ? "Moggern (Solo test) · thodh.com" : "Moggern · thodh.com"
  return solo ? "Moggern (Solo-test) · thodh.com" : "Moggern · thodh.com"
}

/**
 * Renders a clean, uncluttered dark-mode PNG result card (1200×640 for 1v1, 820×620 for solo)
 * completely client-side and returns it as a PNG Blob.
 */
export async function lagDuellKortBlob(input: DuellKortInput): Promise<Blob | null> {
  if (typeof document === "undefined" || input.spillere.length === 0) return null
  const erSolo = input.spillere.length === 1
  const harTittel = !erSolo && !!input.tittel?.trim()
  const W = erSolo ? 820 : 1200
  const H = erSolo ? 600 : 630

  const lerret = document.createElement("canvas")
  lerret.width = W
  lerret.height = H
  const ctx = lerret.getContext("2d")
  if (!ctx) return null

  // Background + subtle top lime radial glow matching Gjetteløs dark theme
  ctx.fillStyle = "#111214"
  ctx.fillRect(0, 0, W, H)

  const glod = ctx.createRadialGradient(W / 2, 0, 20, W / 2, 0, W * 0.65)
  glod.addColorStop(0, "rgba(190, 242, 100, 0.14)")
  glod.addColorStop(1, "rgba(17, 18, 20, 0)")
  ctx.fillStyle = glod
  ctx.fillRect(0, 0, W, H)

  const font = 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif'

  // Minimal header
  ctx.textAlign = "center"
  ctx.fillStyle = "#bef264"
  ctx.font = `600 17px ${font}`
  ctx.fillText(input.underTittel.toUpperCase(), W / 2, 46)

  let kortTopp = 76
  if (harTittel && input.tittel) {
    ctx.fillStyle = "#f4f4f5"
    ctx.font = `700 34px ${font}`
    const tittelLinjer = brytTekst(ctx, input.tittel, W - 120, 2)
    tittelLinjer.forEach((linje, i) => {
      ctx.fillText(linje, W / 2, 92 + i * 40)
    })
    kortTopp = tittelLinjer.length > 1 ? 160 : 124
  }

  const kortBunn = H - 54
  const kortHoyde = kortBunn - kortTopp

  // Preload local peak portraits
  const bilder = await Promise.all(input.spillere.map((s) => (s.bildeUrl ? lastBilde(s.bildeUrl) : Promise.resolve(null))))

  const marg = 44
  const mellomrom = 26
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
    const bildeW = erSolo ? 228 : 182
    const bildeH = erSolo ? 285 : 228
    const bildeX = x + pad
    const bildeY = y + pad

    // Portrait thumbnail (or monogram placeholder)
    ctx.save()
    tegnAvrundetRekt(ctx, bildeX, bildeY, bildeW, bildeH, 20)
    ctx.clip()
    const iw = img ? img.naturalWidth || img.width : 0
    const ih = img ? img.naturalHeight || img.height : 0
    if (img && iw > 0 && ih > 0) {
      const sk = Math.max(bildeW / iw, bildeH / ih)
      const tw = iw * sk
      const th = ih * sk
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

    // Right column: optional winner tag, name, big score, rank badge, optional Rizzler badge
    const infoX = bildeX + bildeW + 26
    const infoMaksW = x + kortBredde - pad - infoX
    ctx.textAlign = "left"

    let curY = bildeY + 26
    const sprak = input.sprak ?? "no"
    if (s.erVinner) {
      ctx.fillStyle = "#bef264"
      ctx.font = `700 14px ${font}`
      ctx.fillText(sprak === "en" ? "★ WINNER" : "★ VINNER", infoX, curY)
      curY += 34
    } else if (!erSolo) {
      curY += 10
    }

    ctx.fillStyle = "#f4f4f5"
    ctx.font = `700 ${erSolo ? 34 : 30}px ${font}`
    const navnLinje = brytTekst(ctx, s.navn, infoMaksW, 1)[0] ?? s.navn
    ctx.fillText(navnLinje, infoX, curY)

    // Score
    const poengY = curY + (erSolo ? 94 : 82)
    const poengTekst = formaterMoggernPoeng(s.poeng, sprak)
    ctx.fillStyle = "#ffffff"
    ctx.font = `700 ${erSolo ? 82 : 70}px ${font}`
    ctx.fillText(poengTekst, infoX, poengY)
    const poengW = ctx.measureText(poengTekst).width
    ctx.fillStyle = "#71717a"
    ctx.font = `600 22px ${font}`
    ctx.fillText("/ 10", infoX + poengW + 10, poengY)

    // Rank pill
    const rang = rangForPoeng(s.poeng, sprak)
    const farge = RANG_HEX[rang.id] ?? { bg: "#fcd34d", fg: "#18191b" }
    ctx.font = `700 18px ${font}`
    const pillTekstW = ctx.measureText(rang.tittel).width
    const pillW = pillTekstW + 32
    const pillH = 38
    const pillY = poengY + 24
    ctx.save()
    tegnAvrundetRekt(ctx, infoX, pillY, pillW, pillH, 19)
    ctx.fillStyle = farge.bg
    ctx.fill()
    ctx.restore()
    ctx.fillStyle = farge.fg
    ctx.fillText(rang.tittel, infoX + 16, pillY + 25)

    // Optional Rizzler Finisher / Rizz failed pill
    if (s.finisherBonus && s.finisherBonus !== 0) {
      const erGull = s.finisherBonus > 0
      const fTekst = erGull
        ? `🤫 Rizzler ${formaterBonus(s.finisherBonus, sprak)}`
        : `😂 Rizz failed ${formaterBonus(s.finisherBonus, sprak)}`
      ctx.font = `700 14px ${font}`
      const fW = Math.min(infoMaksW, ctx.measureText(fTekst).width + 22)
      const fY = pillY + pillH + 10
      ctx.save()
      tegnAvrundetRekt(ctx, infoX, fY, fW, 28, 14)
      ctx.fillStyle = erGull ? "rgba(252, 211, 77, 0.22)" : "rgba(244, 63, 94, 0.22)"
      ctx.fill()
      ctx.lineWidth = 1.2
      ctx.strokeStyle = erGull ? "rgba(252, 211, 77, 0.65)" : "rgba(251, 113, 133, 0.55)"
      ctx.stroke()
      ctx.restore()
      ctx.fillStyle = erGull ? "#fde68a" : "#fda4af"
      ctx.fillText(fTekst, infoX + 11, fY + 19)
    }

    // Bottom section: roast quote only (clean, uncluttered)
    if (s.diss) {
      const dissY = bildeY + bildeH + 40
      const bunnMaksW = kortBredde - pad * 2
      ctx.fillStyle = "#fda4af"
      ctx.font = `500 ${erSolo ? 21 : 18}px ${font}`
      const sitat = sprak === "en" ? `“${s.diss}”` : `«${s.diss}»`
      const dLinjer = brytTekst(ctx, sitat, bunnMaksW, 3)
      dLinjer.forEach((l, idx) => {
        ctx.fillText(l, x + pad, dissY + idx * (erSolo ? 29 : 25))
      })
    }
  }

  // Minimal footer
  ctx.textAlign = "center"
  ctx.fillStyle = "#71717a"
  ctx.font = `500 15px ${font}`
  ctx.fillText("thodh.com/spill/moggern", W / 2, H - 20)

  return new Promise<Blob | null>((resolve) => lerret.toBlob((b) => resolve(b), "image/png"))
}

function utlosNedlasting(blob: Blob, filnavn: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filnavn
  document.body.appendChild(a)
  a.click()
  a.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 4000)
}

/** Downloads the rendered PNG result card directly. */
export async function lastNedDuellKortPng(input: DuellKortInput): Promise<boolean> {
  const blob = await lagDuellKortBlob(input)
  if (!blob) return false
  utlosNedlasting(blob, input.filnavn)
  return true
}

export type DelKortUtfall = "delt" | "kopiert" | "lastet-ned" | "avbrutt" | "feil"

/**
 * Shares the PNG result card image with a short caption:
 * 1. Native Web Share API with image file (iOS/Android/macOS/Edge share sheet).
 * 2. Desktop image clipboard (`image/png`) so pasting drops the card directly into chat.
 * 3. Direct PNG file download fallback.
 */
export async function delDuellKortPng(input: DuellKortInput & { tekst: string }): Promise<DelKortUtfall> {
  const blob = await lagDuellKortBlob(input)
  if (!blob) return "feil"

  if (typeof File !== "undefined" && typeof navigator !== "undefined" && typeof navigator.share === "function") {
    const fil = new File([blob], input.filnavn, { type: "image/png" })
    const kanDeleFil = typeof navigator.canShare === "function" && navigator.canShare({ files: [fil] })
    if (kanDeleFil) {
      try {
        await navigator.share({ files: [fil], text: input.tekst })
        return "delt"
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") return "avbrutt"
        // Some mobile browsers reject combining files + text; retry with image file only.
        try {
          await navigator.share({ files: [fil] })
          return "delt"
        } catch (err2) {
          if (err2 instanceof Error && err2.name === "AbortError") return "avbrutt"
        }
      }
    }
  }

  if (typeof ClipboardItem !== "undefined" && typeof navigator !== "undefined" && navigator.clipboard?.write) {
    try {
      await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })])
      return "kopiert"
    } catch {
      // Fall through to file download.
    }
  }

  utlosNedlasting(blob, input.filnavn)
  return "lastet-ned"
}

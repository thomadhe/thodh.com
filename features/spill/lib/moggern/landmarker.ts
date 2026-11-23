"use client"

// Lazy-loaded MediaPipe Face Landmarker runner for Moggern.
// Loaded ONLY inside a Moggern duel room (after login + the "Alt er tull" gate), in parallel with the camera.
// Never sends video frames or landmarks to any server — everything runs locally in the browser.

import type { FaceLandmarker, HandLandmarker } from "@mediapipe/tasks-vision"
import { analyserRgbaLys, type LysAnalyse } from "./lys"
import { vurderRamme, type Blendshapes, type Punkt3D, type RammeResultat } from "./poeng"

// Pinned to the installed @mediapipe/tasks-vision version so JS glue and WASM always match.
const WASM_BASIS = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.2.3/wasm"
const MODELL_URL =
  "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task"
const HAND_MODELL_URL =
  "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task"

/** Consecutive lit video frames with zero detections before a GPU tracker self-heals to CPU. */
const GPU_RESERVE_TERSKEL = 10

type VisionModul = typeof import("@mediapipe/tasks-vision")
type Fileset = Awaited<ReturnType<VisionModul["FilesetResolver"]["forVisionTasks"]>>

let visionLofte: Promise<{ vision: VisionModul; fileset: Fileset }> | null = null

function hentVision(): Promise<{ vision: VisionModul; fileset: Fileset }> {
  if (!visionLofte) {
    visionLofte = import("@mediapipe/tasks-vision")
      .then(async (vision) => ({
        vision,
        fileset: await vision.FilesetResolver.forVisionTasks(WASM_BASIS),
      }))
      .catch((err) => {
        visionLofte = null
        throw err
      })
  }
  return visionLofte
}

async function lagLandmarker(delegate: "GPU" | "CPU"): Promise<FaceLandmarker> {
  const { vision, fileset } = await hentVision()
  return vision.FaceLandmarker.createFromOptions(fileset, {
    baseOptions: {
      modelAssetPath: MODELL_URL,
      delegate,
    },
    // VIDEO mode enables temporal face tracking across frames — far more reliable than cold IMAGE detection.
    runningMode: "VIDEO",
    numFaces: 1,
    // Forgiving thresholds so dim/nighttime webcams and glasses lock on reliably.
    minFaceDetectionConfidence: 0.2,
    minFacePresenceConfidence: 0.2,
    minTrackingConfidence: 0.2,
    // Same face_landmarker.task model: blendshapes come for free (no extra download) and power mog-uttrykk.
    outputFaceBlendshapes: true,
    outputFacialTransformationMatrixes: true,
  })
}

export type BildeKilde = HTMLVideoElement | HTMLCanvasElement

function lesKildeMaal(kilde: BildeKilde): { vw: number; vh: number } | null {
  if (typeof HTMLVideoElement !== "undefined" && kilde instanceof HTMLVideoElement) {
    if (kilde.readyState < 2 || kilde.paused || kilde.ended || kilde.videoWidth < 64 || kilde.videoHeight < 64) {
      return null
    }
    return { vw: kilde.videoWidth, vh: kilde.videoHeight }
  }
  const c = kilde as HTMLCanvasElement
  if (c.width < 64 || c.height < 64) return null
  return { vw: c.width, vh: c.height }
}

export type AnalyseringsUtfall = {
  ramme: RammeResultat
  lys: LysAnalyse | null
  punkter: readonly Punkt3D[] | null
}

export type AnsiktSporer = {
  /** Analyses the current frame of one dedicated <video> or relay <canvas> stream using temporal VIDEO tracking. */
  analyser: (kilde: BildeKilde, lysLerret: HTMLCanvasElement, taLys?: boolean) => AnalyseringsUtfall | null
  /** Releases WebGL/WASM resources when leaving the room. */
  lukk: () => void
}

function maalLys(kilde: BildeKilde, vw: number, vh: number, lerret: HTMLCanvasElement): LysAnalyse {
  // Tiny downscaled luminance check (< 0.2 ms); never inspects colour/skin tone.
  const maksBredde = 120
  const skala = vw > maksBredde ? maksBredde / vw : 1
  const bredde = Math.max(32, Math.round(vw * skala))
  const hoyde = Math.max(32, Math.round(vh * skala))
  if (lerret.width !== bredde || lerret.height !== hoyde) {
    lerret.width = bredde
    lerret.height = hoyde
  }
  const ctx = lerret.getContext("2d", { willReadFrequently: true })
  if (!ctx) return { status: "ok", snittLys: 128, andelOvereksponert: 0, andelUndereksponert: 0, kontrast: 40 }
  ctx.drawImage(kilde, 0, 0, bredde, hoyde)
  const bildeData = ctx.getImageData(0, 0, bredde, hoyde)
  return analyserRgbaLys(bildeData.data, 2)
}

/**
 * Creates an isolated VIDEO-mode Face Landmarker tracker for a single video or relay canvas stream.
 * Tries GPU first, falls back to CPU on init error, and also auto-recovers to CPU if a GPU WebGL
 * driver silently outputs empty landmarks on lit video frames.
 */
export async function opprettAnsiktSporer(): Promise<AnsiktSporer> {
  let delegate: "GPU" | "CPU" = "GPU"
  let instans: FaceLandmarker
  try {
    instans = await lagLandmarker("GPU")
  } catch {
    delegate = "CPU"
    instans = await lagLandmarker("CPU")
  }

  let lukket = false
  let bytterTilCpu = false
  let settAnsikt = false
  let tommePaRad = 0
  let sisteTs = 0

  const byttTilCpu = () => {
    if (lukket || delegate === "CPU" || bytterTilCpu) return
    bytterTilCpu = true
    void lagLandmarker("CPU")
      .then((ny) => {
        if (lukket) {
          ny.close()
          return
        }
        const gammel = instans
        instans = ny
        delegate = "CPU"
        tommePaRad = 0
        sisteTs = 0
        try {
          gammel.close()
        } catch {}
      })
      .catch(() => {})
      .finally(() => {
        bytterTilCpu = false
      })
  }

  return {
    analyser(kilde, lysLerret, taLys = false) {
      if (lukket) return null
      const maal = lesKildeMaal(kilde)
      if (!maal) return null

      const na = Math.round(performance.now())
      const ts = na > sisteTs ? na : sisteTs + 1
      sisteTs = ts

      let resultat
      try {
        resultat = instans.detectForVideo(kilde, ts)
      } catch {
        byttTilCpu()
        return null
      }

      const punkter = resultat.faceLandmarks?.[0] ?? null
      const matrise = resultat.facialTransformationMatrixes?.[0]?.data ?? null
      const kategorier = resultat.faceBlendshapes?.[0]?.categories
      let blendshapes: Blendshapes | null = null
      if (kategorier?.length) {
        const kart: Record<string, number> = {}
        for (const k of kategorier) kart[k.categoryName] = k.score
        blendshapes = kart
      }

      const ramme = vurderRamme(punkter, matrise, maal.vw, maal.vh, blendshapes)
      const trengerGpuSjekk = delegate === "GPU" && !settAnsikt && !(punkter && punkter.length >= 468)
      const lys = taLys || trengerGpuSjekk ? maalLys(kilde, maal.vw, maal.vh, lysLerret) : null

      if (punkter && punkter.length >= 468) {
        settAnsikt = true
        tommePaRad = 0
      } else if (trengerGpuSjekk && lys && lys.snittLys >= 10) {
        tommePaRad += 1
        if (tommePaRad >= GPU_RESERVE_TERSKEL) {
          byttTilCpu()
        }
      }

      return { ramme, lys, punkter }
    },
    lukk() {
      if (lukket) return
      lukket = true
      try {
        instans.close()
      } catch {}
    },
  }
}

async function lagHandLandmarker(delegate: "GPU" | "CPU"): Promise<HandLandmarker> {
  const { vision, fileset } = await hentVision()
  return vision.HandLandmarker.createFromOptions(fileset, {
    baseOptions: {
      modelAssetPath: HAND_MODELL_URL,
      delegate,
    },
    runningMode: "VIDEO",
    numHands: 2,
    minHandDetectionConfidence: 0.35,
    minHandPresenceConfidence: 0.35,
    minTrackingConfidence: 0.35,
  })
}

export type HandSporer = {
  /** Detects 21-point hand landmarks on the local video stream for the Rizzler Finisher pose. */
  analyser: (video: HTMLVideoElement) => readonly (readonly Punkt3D[])[] | null
  /** Releases WebGL/WASM resources when leaving the room. */
  lukk: () => void
}

/**
 * Creates a lazy VIDEO-mode MediaPipe Hand Landmarker tracker (GPU with seamless CPU fallback).
 * Strictly optional: if it fails to load, Moggern continues normally without hand-finisher detection.
 */
export async function opprettHandSporer(): Promise<HandSporer> {
  let delegate: "GPU" | "CPU" = "GPU"
  let instans: HandLandmarker
  try {
    instans = await lagHandLandmarker("GPU")
  } catch {
    delegate = "CPU"
    instans = await lagHandLandmarker("CPU")
  }

  let lukket = false
  let bytterTilCpu = false
  let sisteTs = 0

  const byttTilCpu = () => {
    if (lukket || delegate === "CPU" || bytterTilCpu) return
    bytterTilCpu = true
    void lagHandLandmarker("CPU")
      .then((ny) => {
        if (lukket) {
          ny.close()
          return
        }
        const gammel = instans
        instans = ny
        delegate = "CPU"
        sisteTs = 0
        try {
          gammel.close()
        } catch {}
      })
      .catch(() => {})
      .finally(() => {
        bytterTilCpu = false
      })
  }

  return {
    analyser(video) {
      if (lukket) return null
      if (video.readyState < 2 || video.paused || video.ended || video.videoWidth < 64 || video.videoHeight < 64) {
        return null
      }
      const na = Math.round(performance.now())
      const ts = na > sisteTs ? na : sisteTs + 1
      sisteTs = ts
      try {
        const res = instans.detectForVideo(video, ts)
        return res.landmarks?.length ? res.landmarks : null
      } catch {
        byttTilCpu()
        return null
      }
    },
    lukk() {
      if (lukket) return
      lukket = true
      try {
        instans.close()
      } catch {}
    },
  }
}

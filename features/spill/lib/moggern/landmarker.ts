"use client"

// Lazy-loaded MediaPipe Face Landmarker runner for Moggern.
// Loaded ONLY when the player actively opens Moggern and turns on the camera.
// Never sends video frames or landmarks to any server — everything runs locally in the browser.

import type { FaceLandmarker } from "@mediapipe/tasks-vision"
import { analyserRgbaLys, type LysAnalyse } from "./lys"
import { vurderRamme, type RammeResultat } from "./poeng"

// Pinned to the installed @mediapipe/tasks-vision version so JS glue and WASM always match.
const WASM_BASIS = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.2.3/wasm"
const MODELL_URL =
  "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task"

let landmarkerLofte: Promise<FaceLandmarker> | null = null

async function lagLandmarker(delegate: "GPU" | "CPU"): Promise<FaceLandmarker> {
  const vision = await import("@mediapipe/tasks-vision")
  const fileset = await vision.FilesetResolver.forVisionTasks(WASM_BASIS)
  return vision.FaceLandmarker.createFromOptions(fileset, {
    baseOptions: {
      modelAssetPath: MODELL_URL,
      delegate,
    },
    runningMode: "IMAGE",
    numFaces: 1,
    minFaceDetectionConfidence: 0.5,
    minFacePresenceConfidence: 0.5,
    minTrackingConfidence: 0.5,
    outputFaceBlendshapes: false,
    outputFacialTransformationMatrixes: true,
  })
}

/** Loads the MediaPipe Face Landmarker once per tab, falling back from GPU to CPU if needed. */
export function hentLandmarker(): Promise<FaceLandmarker> {
  if (!landmarkerLofte) {
    landmarkerLofte = lagLandmarker("GPU")
      .catch(() => lagLandmarker("CPU"))
      .catch((err) => {
        landmarkerLofte = null
        throw err
      })
  }
  return landmarkerLofte
}

export type AnalyseringsUtfall = {
  ramme: RammeResultat
  lys: LysAnalyse
}

/**
 * Draws the current video frame onto a reusable offscreen canvas, runs MediaPipe Face Landmarker
 * and grayscale luminance exposure check, and returns both results.
 */
export function analyserVideoRamme(
  landmarker: FaceLandmarker,
  video: HTMLVideoElement,
  lerret: HTMLCanvasElement,
): AnalyseringsUtfall | null {
  if (video.readyState < 2 || video.videoWidth < 64 || video.videoHeight < 64) return null

  // Downscale to max 480px width for fast, consistent inference on both desktop and mobile.
  const maksBredde = 480
  const skala = video.videoWidth > maksBredde ? maksBredde / video.videoWidth : 1
  const bredde = Math.max(64, Math.round(video.videoWidth * skala))
  const hoyde = Math.max(64, Math.round(video.videoHeight * skala))

  if (lerret.width !== bredde || lerret.height !== hoyde) {
    lerret.width = bredde
    lerret.height = hoyde
  }

  const ctx = lerret.getContext("2d", { willReadFrequently: true })
  if (!ctx) return null
  ctx.drawImage(video, 0, 0, bredde, hoyde)

  const resultat = landmarker.detect(lerret)
  const punkter = resultat.faceLandmarks?.[0] ?? null
  const matrise = resultat.facialTransformationMatrixes?.[0]?.data ?? null
  const ramme = vurderRamme(punkter, matrise, bredde, hoyde)

  // Sample grayscale luminance across the frame (step 4 pixels for speed; never inspects colour/skin tone).
  const bildeData = ctx.getImageData(0, 0, bredde, hoyde)
  const lys = analyserRgbaLys(bildeData.data, 4)

  return { ramme, lys }
}

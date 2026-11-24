// Camera and optional microphone stream helpers for Moggern (pure, framework-free so they can be unit tested in Node).
// Microphone is strictly opt-in (off by default); video defaults to selfie camera.

export function kameraFeilTekst(err: unknown, sprak: "no" | "en" = "no"): string {
  const en = sprak === "en"
  const navn = err instanceof DOMException || err instanceof Error ? err.name : ""
  if (navn === "NotAllowedError" || navn === "PermissionDeniedError" || navn === "SecurityError") {
    return en
      ? "Camera access was denied. Allow camera access in your browser and try again."
      : "Kameratilgang ble avslått. Tillat kamera i nettleseren og prøv igjen."
  }
  if (navn === "NotFoundError" || navn === "DevicesNotFoundError") {
    return en ? "No camera was found on this device." : "Fant ikke noe kamera på denne enheten."
  }
  if (navn === "NotReadableError" || navn === "TrackStartError") {
    return en
      ? "Your camera is in use by another app or tab. Close it and try again."
      : "Kameraet er opptatt i en annen app eller fane. Lukk den og prøv igjen."
  }
  if (navn === "OverconstrainedError") {
    return en ? "The camera didn’t support the requested resolution. Please try again." : "Kameraet støttet ikke ønsket oppløsning. Prøv igjen."
  }
  return en
    ? "Could not start the camera. Check browser permissions and try again."
    : "Kunne ikke starte kameraet. Sjekk at nettleseren har tilgang og prøv på nytt."
}

export function mikrofonFeilTekst(err: unknown, sprak: "no" | "en" = "no"): string {
  const en = sprak === "en"
  const navn = err instanceof DOMException || err instanceof Error ? err.name : ""
  if (navn === "NotAllowedError" || navn === "PermissionDeniedError" || navn === "SecurityError") {
    return en ? "Microphone access was denied in your browser." : "Mikrofontilgang ble avslått i nettleseren."
  }
  if (navn === "NotFoundError" || navn === "DevicesNotFoundError") {
    return en ? "No microphone was found on this device." : "Fant ingen mikrofon på denne enheten."
  }
  return en ? "Could not start the microphone." : "Kunne ikke starte mikrofonen."
}

/** Preferred selfie constraints; the plain fallback works on cameras/browsers that reject them. */
export const KAMERA_ONSKER: MediaStreamConstraints = {
  video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } },
  audio: false,
}
export const KAMERA_RESERVE: MediaStreamConstraints = { video: true, audio: false }

export const MIKROFON_ONSKER: MediaStreamConstraints = {
  video: false,
  audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
}

/** Errors where retrying with looser constraints can help (vs. the user denying permission). */
function kanProveEnklere(err: unknown): boolean {
  const navn = err instanceof DOMException || err instanceof Error ? err.name : ""
  return (
    navn === "OverconstrainedError" ||
    navn === "ConstraintNotSatisfiedError" ||
    navn === "NotReadableError" ||
    navn === "TypeError" ||
    navn === "AbortError"
  )
}

export async function hentKameraStrom(
  getUserMedia: ((c: MediaStreamConstraints) => Promise<MediaStream>) | null = typeof navigator !== "undefined" && navigator.mediaDevices?.getUserMedia
    ? (c) => navigator.mediaDevices.getUserMedia(c)
    : null,
  deviceId?: string | null,
): Promise<MediaStream> {
  if (!getUserMedia) {
    throw new Error("Nettleseren støtter ikke kamera (krever HTTPS).")
  }
  if (deviceId) {
    try {
      return await getUserMedia({
        video: { deviceId: { exact: deviceId }, width: { ideal: 640 }, height: { ideal: 480 } },
        audio: false,
      })
    } catch (err) {
      if (!kanProveEnklere(err)) throw err
    }
  }
  try {
    return await getUserMedia(KAMERA_ONSKER)
  } catch (err) {
    if (kanProveEnklere(err)) {
      return await getUserMedia(KAMERA_RESERVE)
    }
    throw err
  }
}

export async function hentMikrofonStrom(
  getUserMedia: ((c: MediaStreamConstraints) => Promise<MediaStream>) | null = typeof navigator !== "undefined" && navigator.mediaDevices?.getUserMedia
    ? (c) => navigator.mediaDevices.getUserMedia(c)
    : null,
): Promise<MediaStream> {
  if (!getUserMedia) {
    throw new Error("Nettleseren støtter ikke mikrofon (krever HTTPS).")
  }
  try {
    return await getUserMedia(MIKROFON_ONSKER)
  } catch (err) {
    if (kanProveEnklere(err)) {
      return await getUserMedia({ video: false, audio: true })
    }
    throw err
  }
}

export async function listKameraer(): Promise<MediaDeviceInfo[]> {
  if (typeof navigator === "undefined" || !navigator.mediaDevices?.enumerateDevices) return []
  try {
    const enheter = await navigator.mediaDevices.enumerateDevices()
    return enheter.filter((e) => e.kind === "videoinput" && !!e.deviceId)
  } catch {
    return []
  }
}

export function stoppStrom(strom: MediaStream | null) {
  if (!strom) return
  for (const spor of strom.getTracks()) {
    try {
      spor.stop()
    } catch {}
  }
}

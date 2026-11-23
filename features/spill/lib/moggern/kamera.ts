// Camera stream helpers for Moggern (pure, framework-free so they can be unit tested in Node).
// Only video is ever requested; audio is always off.

export function kameraFeilTekst(err: unknown): string {
  const navn = err instanceof DOMException || err instanceof Error ? err.name : ""
  if (navn === "NotAllowedError" || navn === "PermissionDeniedError" || navn === "SecurityError") {
    return "Kameratilgang ble avslått. Tillat kamera i nettleseren og prøv igjen."
  }
  if (navn === "NotFoundError" || navn === "DevicesNotFoundError") {
    return "Fant ikke noe kamera på denne enheten."
  }
  if (navn === "NotReadableError" || navn === "TrackStartError") {
    return "Kameraet er opptatt i en annen app eller fane. Lukk den og prøv igjen."
  }
  if (navn === "OverconstrainedError") {
    return "Kameraet støttet ikke ønsket oppløsning. Prøv igjen."
  }
  return "Kunne ikke starte kameraet. Sjekk at nettleseren har tilgang og prøv på nytt."
}

/** Preferred selfie constraints; the plain fallback works on cameras/browsers that reject them. */
export const KAMERA_ONSKER: MediaStreamConstraints = {
  video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } },
  audio: false,
}
export const KAMERA_RESERVE: MediaStreamConstraints = { video: true, audio: false }

/** Errors where retrying with looser constraints can help (vs. the user denying permission). */
function kanProveEnklere(err: unknown): boolean {
  const navn = err instanceof DOMException || err instanceof Error ? err.name : ""
  return navn === "OverconstrainedError" || navn === "ConstraintNotSatisfiedError" || navn === "NotReadableError" || navn === "TypeError" || navn === "AbortError"
}

export async function hentKameraStrom(
  getUserMedia: ((c: MediaStreamConstraints) => Promise<MediaStream>) | null = typeof navigator !== "undefined" && navigator.mediaDevices?.getUserMedia
    ? (c) => navigator.mediaDevices.getUserMedia(c)
    : null,
): Promise<MediaStream> {
  if (!getUserMedia) {
    throw new Error("Nettleseren støtter ikke kamera (krever HTTPS).")
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

export function stoppStrom(strom: MediaStream | null) {
  if (!strom) return
  for (const spor of strom.getTracks()) {
    try {
      spor.stop()
    } catch {}
  }
}

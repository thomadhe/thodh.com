"use client"

// Peer-to-peer WebRTC video (+ optional opt-in mic audio) helper for Moggern.
// Media flows directly between the two browsers; only tiny SDP/ICE signalling messages travel
// over the room's Supabase Realtime broadcast channel. Nothing is recorded.

import { useCallback, useEffect, useRef, useState } from "react"
import { lesSignal, type WebRtcSignal } from "./duell"
import { STANDARD_STUN, type IceKonfig } from "./ice"

export type VideoTilkobling = "av" | "kobler" | "tilkoblet" | "feil"

export {
  hentKameraStrom,
  hentMikrofonStrom,
  kameraFeilTekst,
  KAMERA_ONSKER,
  KAMERA_RESERVE,
  listKameraer,
  mikrofonFeilTekst,
  stoppStrom,
} from "./kamera"

const ICE_HENT_TIMEOUT_MS = 2000
/** Interval for repeating `klar-video` handshake pings until the peer connection links up. */
const HANDTRYKK_INTERVALL_MS = 1600
/** Minimum spacing between back-to-back offer attempts triggered by `klar-video` pings. */
const TILBUD_KARANTENE_MS = 1300
/** Grace period before treating a transient `disconnected` state as a failure (mobile Wi-Fi/4G handovers). */
const FRAKOBLET_FRIST_MS = 4500
/** Cap for queued early signals received before `RTCPeerConnection` is ready. */
const MAKS_VENTENDE_SIGNALER = 60

/**
 * Manages the P2P RTCPeerConnection for one 1v1 Moggern room.
 *
 * Unified Plan transceiver ownership:
 * - Only the offerer (`meg > motstanderId`) calls `addTransceiver("video" | "audio", { direction: "sendrecv" })`.
 * - The answerer (`meg < motstanderId`) waits for `setRemoteDescription(offer)` and attaches its local
 *   camera/mic tracks directly onto the matched remote transceivers (`t.direction = "sendrecv"`).
 *   This guarantees both peers share paired mid=0/mid=1 sendrecv transceivers so toggling camera/mic later
 *   works via `replaceTrack` without renegotiation.
 *
 * All SDP/ICE operations are serialized through an async queue, and early signals that arrive while ICE
 * config is still loading are buffered and replayed once the peer connection is created.
 */
export function useMoggernWebRtc({
  meg,
  motstanderId,
  lokalStrom,
  lydStrom = null,
  sendSignal,
  aktiv,
}: {
  meg: string | null
  motstanderId: string | null
  lokalStrom: MediaStream | null
  /** Optional opt-in local microphone stream (null when muted/off). */
  lydStrom?: MediaStream | null
  sendSignal: (signal: WebRtcSignal) => void
  /** True only when the user is logged in, has accepted the disclaimer, and is in the active 2-player pair. */
  aktiv: boolean
}) {
  const [fjernStrom, setFjernStrom] = useState<MediaStream | null>(null)
  const [fjernLydStrom, setFjernLydStrom] = useState<MediaStream | null>(null)
  const [status, setStatus] = useState<VideoTilkobling>("av")
  const [feil, setFeil] = useState<string | null>(null)
  const [harTurn, setHarTurn] = useState(false)
  const [iceKlar, setIceKlar] = useState(false)

  const pcRef = useRef<RTCPeerConnection | null>(null)
  const iceKonfigRef = useRef<IceKonfig>({ iceServers: [...STANDARD_STUN], harTurn: false })
  const senderRef = useRef<RTCRtpSender | null>(null)
  const lydSenderRef = useRef<RTCRtpSender | null>(null)
  const lokalStromRef = useRef<MediaStream | null>(lokalStrom)
  const lydStromRef = useRef<MediaStream | null>(lydStrom)
  const sendSignalRef = useRef(sendSignal)
  const megRef = useRef<string | null>(meg)
  const motstanderIdRef = useRef<string | null>(motstanderId)
  const venterIceRef = useRef<RTCIceCandidateInit[]>([])
  const ventendeSignalerRef = useRef<WebRtcSignal[]>([])
  const signalKoRef = useRef<Promise<void>>(Promise.resolve())
  const sisteTilbudTidRef = useRef(0)
  const autoRestartetRef = useRef(false)
  const frakobletTimerRef = useRef<number | null>(null)

  useEffect(() => {
    lokalStromRef.current = lokalStrom
    lydStromRef.current = lydStrom
    sendSignalRef.current = sendSignal
    megRef.current = meg
    motstanderIdRef.current = motstanderId
  })

  // Fetch STUN + optional TURN configuration before opening the RTCPeerConnection (with 2 s safety fallback).
  useEffect(() => {
    if (!aktiv) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIceKlar(false)
      return
    }
    let avbrutt = false
    let ferdig = false
    const markerKlar = () => {
      if (avbrutt || ferdig) return
      ferdig = true
      setIceKlar(true)
    }
    const tidsfrist = window.setTimeout(markerKlar, ICE_HENT_TIMEOUT_MS)

    void fetch("/spill/api/moggern/ice", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data: IceKonfig | null) => {
        if (avbrutt) return
        if (data && Array.isArray(data.iceServers)) {
          iceKonfigRef.current = data
          setHarTurn(!!data.harTurn)
        }
      })
      .catch(() => {})
      .finally(() => {
        window.clearTimeout(tidsfrist)
        markerKlar()
      })

    return () => {
      avbrutt = true
      window.clearTimeout(tidsfrist)
    }
  }, [aktiv])

  const synkLokaleSpor = useCallback(async () => {
    const videoSpor = lokalStromRef.current?.getVideoTracks()[0] ?? null
    const lydSpor = lydStromRef.current?.getAudioTracks()[0] ?? null
    if (senderRef.current && senderRef.current.track !== videoSpor) {
      await senderRef.current.replaceTrack(videoSpor).catch(() => {})
    }
    if (lydSenderRef.current && lydSenderRef.current.track !== lydSpor) {
      await lydSenderRef.current.replaceTrack(lydSpor).catch(() => {})
    }
  }, [])

  const lukkForbindelse = useCallback(() => {
    if (frakobletTimerRef.current !== null) {
      window.clearTimeout(frakobletTimerRef.current)
      frakobletTimerRef.current = null
    }
    if (pcRef.current) {
      try {
        pcRef.current.onicecandidate = null
        pcRef.current.ontrack = null
        pcRef.current.onconnectionstatechange = null
        pcRef.current.oniceconnectionstatechange = null
        pcRef.current.onnegotiationneeded = null
        pcRef.current.close()
      } catch {}
      pcRef.current = null
    }
    senderRef.current = null
    lydSenderRef.current = null
    venterIceRef.current = []
    sisteTilbudTidRef.current = 0
    autoRestartetRef.current = false
    setFjernStrom(null)
    setFjernLydStrom(null)
    setStatus("av")
  }, [])

  const sendTilbud = useCallback(
    (pc: RTCPeerConnection, fra: string, til: string, opts?: { iceRestart?: boolean; tving?: boolean }) => {
      signalKoRef.current = signalKoRef.current.then(async () => {
        if (pcRef.current !== pc) return
        const na = Date.now()
        if (!opts?.tving && na - sisteTilbudTidRef.current < TILBUD_KARANTENE_MS) return
        try {
          if (pc.signalingState === "have-local-offer") {
            await pc.setLocalDescription({ type: "rollback" })
          } else if (pc.signalingState !== "stable") {
            return
          }
          await synkLokaleSpor()
          if (pcRef.current !== pc) return
          const tilbud = await pc.createOffer(opts?.iceRestart ? { iceRestart: true } : undefined)
          if (pcRef.current !== pc || pc.signalingState !== "stable") return
          await pc.setLocalDescription(tilbud)
          sisteTilbudTidRef.current = Date.now()
          if (pc.localDescription?.sdp) {
            sendSignalRef.current({ fra, til, type: "offer", sdp: pc.localDescription.sdp })
          }
        } catch {
          // Ignore transient negotiation errors; retries / manual reconnect recover cleanly.
        }
      })
    },
    [synkLokaleSpor],
  )

  const behandleSignal = useCallback(
    (sig: WebRtcSignal) => {
      const pc = pcRef.current
      const megNa = megRef.current
      const motNa = motstanderIdRef.current
      if (!pc || !megNa || !motNa) return
      if (sig.til !== megNa || sig.fra !== motNa) return

      const erTilbyder = megNa > motNa

      signalKoRef.current = signalKoRef.current.then(async () => {
        if (pcRef.current !== pc) return
        try {
          if (sig.type === "klar-video") {
            if (!erTilbyder) return
            // Already connected (or actively connecting after receiving an answer) → no new offer needed.
            if (pc.connectionState === "connected" && (pc.iceConnectionState === "connected" || pc.iceConnectionState === "completed")) {
              return
            }
            if (pc.remoteDescription && pc.iceConnectionState === "checking") return
            const na = Date.now()
            if (na - sisteTilbudTidRef.current < TILBUD_KARANTENE_MS) return
            const trengerRestart = !!pc.localDescription
            if (pc.signalingState === "have-local-offer") {
              await pc.setLocalDescription({ type: "rollback" })
            } else if (pc.signalingState !== "stable") {
              return
            }
            await synkLokaleSpor()
            if (pcRef.current !== pc) return
            const tilbud = await pc.createOffer(trengerRestart ? { iceRestart: true } : undefined)
            if (pcRef.current !== pc || pc.signalingState !== "stable") return
            await pc.setLocalDescription(tilbud)
            sisteTilbudTidRef.current = Date.now()
            if (pc.localDescription?.sdp) {
              sendSignalRef.current({ fra: megNa, til: motNa, type: "offer", sdp: pc.localDescription.sdp })
            }
            return
          }

          if (sig.type === "offer") {
            // In rare manual-reconnect cases the offerer could receive an offer from the answerer, so rollback cleanly if needed.
            if (pc.signalingState !== "stable") {
              await pc.setLocalDescription({ type: "rollback" })
            }
            await pc.setRemoteDescription({ type: "offer", sdp: sig.sdp })

            // Pair our local video & audio tracks directly onto the incoming offer's transceivers (Unified Plan).
            for (const t of pc.getTransceivers()) {
              if (t.receiver.track?.kind === "video") {
                t.direction = "sendrecv"
                senderRef.current = t.sender
              } else if (t.receiver.track?.kind === "audio") {
                t.direction = "sendrecv"
                lydSenderRef.current = t.sender
              }
            }
            await synkLokaleSpor()

            for (const c of venterIceRef.current.splice(0)) {
              await pc.addIceCandidate(c).catch(() => {})
            }
            const svar = await pc.createAnswer()
            if (pcRef.current !== pc) return
            await pc.setLocalDescription(svar)
            if (pc.localDescription?.sdp) {
              sendSignalRef.current({ fra: megNa, til: motNa, type: "answer", sdp: pc.localDescription.sdp })
            }
            return
          }

          if (sig.type === "answer") {
            if (pc.signalingState !== "have-local-offer") return
            await pc.setRemoteDescription({ type: "answer", sdp: sig.sdp })
            for (const c of venterIceRef.current.splice(0)) {
              await pc.addIceCandidate(c).catch(() => {})
            }
            return
          }

          if (sig.type === "ice") {
            if (pc.remoteDescription) {
              await pc.addIceCandidate(sig.candidate).catch(() => {})
            } else {
              venterIceRef.current.push(sig.candidate)
            }
          }
        } catch {
          // Malformed or stale WebRTC signaling message; ignore safely.
        }
      })
    },
    [synkLokaleSpor],
  )

  // Clear buffered signals if the opponent leaves or changes.
  useEffect(() => {
    ventendeSignalerRef.current = []
  }, [motstanderId])

  // Create/maintain RTCPeerConnection once ICE config is ready and both peers are in the room.
  useEffect(() => {
    if (!aktiv || !iceKlar || !meg || !motstanderId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      lukkForbindelse()
      return
    }
    if (typeof RTCPeerConnection === "undefined") {
      setStatus("feil")
      setFeil("Nettleseren støtter ikke WebRTC-video.")
      return
    }

    const pc = new RTCPeerConnection({
      iceServers: iceKonfigRef.current.iceServers as RTCIceServer[],
    })
    pcRef.current = pc
    setStatus("kobler")
    setFeil(null)

    const erTilbyder = meg > motstanderId
    const fjernVideo = new MediaStream()
    const fjernLyd = new MediaStream()

    const publiserFjernVideo = () => {
      if (pcRef.current !== pc) return
      const spor = fjernVideo.getVideoTracks().filter((t) => t.readyState !== "ended")
      setFjernStrom(spor.length ? new MediaStream(spor) : null)
    }

    const publiserFjernLyd = () => {
      if (pcRef.current !== pc) return
      const spor = fjernLyd.getAudioTracks().filter((t) => t.readyState !== "ended")
      setFjernLydStrom(spor.length ? new MediaStream(spor) : null)
    }

    // Only the offerer pre-creates video/audio transceivers.
    // The answerer binds directly to the offer's transceivers in `setRemoteDescription` (RFC 8829 Unified Plan).
    if (erTilbyder) {
      const videoTransceiver = pc.addTransceiver("video", { direction: "sendrecv" })
      senderRef.current = videoTransceiver.sender
      const videoSpor = lokalStromRef.current?.getVideoTracks()[0] ?? null
      if (videoSpor) {
        void videoTransceiver.sender.replaceTrack(videoSpor).catch(() => {})
      }

      const lydTransceiver = pc.addTransceiver("audio", { direction: "sendrecv" })
      lydSenderRef.current = lydTransceiver.sender
      const lydSpor = lydStromRef.current?.getAudioTracks()[0] ?? null
      if (lydSpor) {
        void lydTransceiver.sender.replaceTrack(lydSpor).catch(() => {})
      }
    }

    pc.ontrack = (e) => {
      if (e.track.kind === "video") {
        for (const s of e.streams) {
          for (const t of s.getVideoTracks()) {
            if (!fjernVideo.getTrackById(t.id)) fjernVideo.addTrack(t)
          }
        }
        if (!fjernVideo.getTrackById(e.track.id)) fjernVideo.addTrack(e.track)
        publiserFjernVideo()
        // Re-trigger video element playback when frames start flowing after an initially muted track.
        e.track.onunmute = publiserFjernVideo
        e.track.onended = () => {
          fjernVideo.removeTrack(e.track)
          publiserFjernVideo()
        }
      } else if (e.track.kind === "audio") {
        for (const s of e.streams) {
          for (const t of s.getAudioTracks()) {
            if (!fjernLyd.getTrackById(t.id)) fjernLyd.addTrack(t)
          }
        }
        if (!fjernLyd.getTrackById(e.track.id)) fjernLyd.addTrack(e.track)
        publiserFjernLyd()
        e.track.onunmute = publiserFjernLyd
        e.track.onended = () => {
          fjernLyd.removeTrack(e.track)
          publiserFjernLyd()
        }
      }
    }

    pc.onicecandidate = (e) => {
      if (!e.candidate) return
      sendSignalRef.current({
        fra: meg,
        til: motstanderId,
        type: "ice",
        candidate: {
          candidate: e.candidate.candidate,
          sdpMid: e.candidate.sdpMid,
          sdpMLineIndex: e.candidate.sdpMLineIndex,
        },
      })
    }

    const markerFeil = () => {
      if (pcRef.current !== pc) return
      setStatus("feil")
      setFeil(
        iceKonfigRef.current.harTurn
          ? "Mistet videokoblingen til motstanderen. Trykk «Koble til på nytt»."
          : "Klarte ikke å koble video direkte (ofte mobilnett/4G uten TURN-server). Prøv samme Wi-Fi eller trykk «Koble til på nytt».",
      )
    }

    const oppdaterTilstand = () => {
      if (pcRef.current !== pc) return
      const cs = pc.connectionState
      const is = pc.iceConnectionState
      if (cs === "connected" || is === "connected" || is === "completed") {
        if (frakobletTimerRef.current !== null) {
          window.clearTimeout(frakobletTimerRef.current)
          frakobletTimerRef.current = null
        }
        autoRestartetRef.current = false
        setStatus("tilkoblet")
        setFeil(null)
        return
      }
      if (cs === "failed" || is === "failed") {
        if (frakobletTimerRef.current !== null) {
          window.clearTimeout(frakobletTimerRef.current)
          frakobletTimerRef.current = null
        }
        // Automatically attempt one ICE restart before surfacing a connection error.
        if (!autoRestartetRef.current) {
          autoRestartetRef.current = true
          setStatus("kobler")
          if (erTilbyder) {
            sendTilbud(pc, meg, motstanderId, { iceRestart: true, tving: true })
          } else {
            sendSignalRef.current({ fra: meg, til: motstanderId, type: "klar-video" })
          }
          return
        }
        markerFeil()
        return
      }
      if (cs === "disconnected" || is === "disconnected") {
        if (frakobletTimerRef.current === null) {
          frakobletTimerRef.current = window.setTimeout(() => {
            frakobletTimerRef.current = null
            if (pcRef.current !== pc) return
            if (pc.connectionState !== "connected" && pc.iceConnectionState !== "connected" && pc.iceConnectionState !== "completed") {
              markerFeil()
            }
          }, FRAKOBLET_FRIST_MS)
        }
        return
      }
      if (cs === "connecting" || cs === "new") {
        setStatus("kobler")
      }
    }
    pc.onconnectionstatechange = oppdaterTilstand
    pc.oniceconnectionstatechange = oppdaterTilstand

    // Replay any signals that arrived while ICE config was still being fetched.
    const koet = ventendeSignalerRef.current.splice(0)
    for (const sig of koet) {
      behandleSignal(sig)
    }

    // Kick off handshake and keep pinging gently until connected so late-subscribing peers never deadlock.
    const startTimer = window.setTimeout(() => {
      if (pcRef.current !== pc) return
      if (erTilbyder) {
        sendTilbud(pc, meg, motstanderId)
      } else {
        sendSignalRef.current({ fra: meg, til: motstanderId, type: "klar-video" })
      }
    }, 180)

    let forsok = 0
    const gjentaTimer = window.setInterval(() => {
      if (pcRef.current !== pc) return
      if (pc.connectionState === "connected" || pc.iceConnectionState === "connected" || pc.iceConnectionState === "completed") {
        window.clearInterval(gjentaTimer)
        return
      }
      forsok += 1
      if (forsok > 8) {
        window.clearInterval(gjentaTimer)
        return
      }
      if (!erTilbyder) {
        // Answerer keeps nudging the offerer until an offer has been received & answered.
        if (!pc.remoteDescription) {
          sendSignalRef.current({ fra: meg, til: motstanderId, type: "klar-video" })
        }
      } else if (!pc.remoteDescription) {
        // Offerer re-offers if no answer came back yet (e.g. opponent's page was still mounting).
        sendTilbud(pc, meg, motstanderId, { iceRestart: true })
      }
    }, HANDTRYKK_INTERVALL_MS)

    return () => {
      window.clearTimeout(startTimer)
      window.clearInterval(gjentaTimer)
      lukkForbindelse()
    }
  }, [aktiv, iceKlar, meg, motstanderId, lukkForbindelse, sendTilbud, behandleSignal])

  // Swap outgoing video track cleanly whenever the local camera is toggled on or off.
  useEffect(() => {
    const sender = senderRef.current
    if (!sender) return
    const spor = lokalStrom?.getVideoTracks()[0] ?? null
    if (sender.track === spor) return
    void sender.replaceTrack(spor).catch(() => {})
  }, [lokalStrom])

  // Swap outgoing audio track cleanly whenever the local mic is toggled on or off.
  useEffect(() => {
    const sender = lydSenderRef.current
    if (!sender) return
    const spor = lydStrom?.getAudioTracks()[0] ?? null
    if (sender.track === spor) return
    void sender.replaceTrack(spor).catch(() => {})
  }, [lydStrom])

  const mottaSignal = useCallback(
    (payload: unknown) => {
      const sig = lesSignal(payload)
      if (!sig) return
      const megNa = megRef.current
      const motNa = motstanderIdRef.current
      if (megNa && sig.til !== megNa) return
      if (motNa && sig.fra !== motNa) return

      if (!pcRef.current) {
        // Peer connection not ready yet (e.g. ICE fetch still in flight) → buffer for replay.
        if (ventendeSignalerRef.current.length < MAKS_VENTENDE_SIGNALER) {
          ventendeSignalerRef.current.push(sig)
        }
        return
      }
      behandleSignal(sig)
    },
    [behandleSignal],
  )

  const koblePaaNytt = useCallback(() => {
    const pc = pcRef.current
    const megNa = megRef.current
    const motNa = motstanderIdRef.current
    if (!pc || !megNa || !motNa) return
    autoRestartetRef.current = false
    setStatus("kobler")
    setFeil(null)
    if (megNa > motNa) {
      sendTilbud(pc, megNa, motNa, { iceRestart: true, tving: true })
    } else {
      sendSignalRef.current({ fra: megNa, til: motNa, type: "klar-video" })
    }
  }, [sendTilbud])

  return {
    fjernStrom,
    fjernLydStrom,
    status,
    feil,
    harTurn,
    mottaSignal,
    koblePaaNytt,
    lukkForbindelse,
  }
}

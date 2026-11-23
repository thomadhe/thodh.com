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

/**
 * Manages the P2P RTCPeerConnection for one 1v1 Moggern room using the polite-peer pattern.
 * Waits for STUN/TURN config before opening the connection so TURN servers are never missed on startup.
 * Pass `mottaSignal` into the Realtime channel's "signal" broadcast handler.
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
  const venterIceRef = useRef<RTCIceCandidateInit[]>([])
  const lagerTilbudRef = useRef(false)
  const ignorerTilbudRef = useRef(false)

  useEffect(() => {
    lokalStromRef.current = lokalStrom
    lydStromRef.current = lydStrom
    sendSignalRef.current = sendSignal
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

  const lukkForbindelse = useCallback(() => {
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
    lagerTilbudRef.current = false
    ignorerTilbudRef.current = false
    setFjernStrom(null)
    setFjernLydStrom(null)
    setStatus("av")
  }, [])

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

    const fjernVideo = new MediaStream()
    const fjernLyd = new MediaStream()

    // Always add video + audio transceivers upfront so toggling camera/mic uses replaceTrack without renegotiation.
    const videoSpor = lokalStromRef.current?.getVideoTracks()[0] ?? null
    const videoTransceiver = pc.addTransceiver("video", { direction: "sendrecv" })
    senderRef.current = videoTransceiver.sender
    if (videoSpor) {
      void videoTransceiver.sender.replaceTrack(videoSpor).catch(() => {})
    }

    const lydSpor = lydStromRef.current?.getAudioTracks()[0] ?? null
    const lydTransceiver = pc.addTransceiver("audio", { direction: "sendrecv" })
    lydSenderRef.current = lydTransceiver.sender
    if (lydSpor) {
      void lydTransceiver.sender.replaceTrack(lydSpor).catch(() => {})
    }

    pc.ontrack = (e) => {
      if (e.track.kind === "video") {
        for (const s of e.streams) {
          for (const t of s.getVideoTracks()) {
            if (!fjernVideo.getTrackById(t.id)) fjernVideo.addTrack(t)
          }
        }
        if (!fjernVideo.getTrackById(e.track.id)) fjernVideo.addTrack(e.track)
        setFjernStrom(new MediaStream(fjernVideo.getVideoTracks()))
        e.track.onended = () => {
          fjernVideo.removeTrack(e.track)
          setFjernStrom(fjernVideo.getVideoTracks().length ? new MediaStream(fjernVideo.getVideoTracks()) : null)
        }
      } else if (e.track.kind === "audio") {
        for (const s of e.streams) {
          for (const t of s.getAudioTracks()) {
            if (!fjernLyd.getTrackById(t.id)) fjernLyd.addTrack(t)
          }
        }
        if (!fjernLyd.getTrackById(e.track.id)) fjernLyd.addTrack(e.track)
        setFjernLydStrom(new MediaStream(fjernLyd.getAudioTracks()))
        e.track.onended = () => {
          fjernLyd.removeTrack(e.track)
          setFjernLydStrom(fjernLyd.getAudioTracks().length ? new MediaStream(fjernLyd.getAudioTracks()) : null)
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

    const oppdaterTilstand = () => {
      const s = pc.connectionState
      if (s === "connected") {
        setStatus("tilkoblet")
        setFeil(null)
      } else if (s === "connecting" || s === "new") {
        setStatus("kobler")
      } else if (s === "failed" || s === "disconnected") {
        setStatus("feil")
        setFeil(
          iceKonfigRef.current.harTurn
            ? "Mistet videokoblingen til motstanderen. Prøv å koble til på nytt."
            : "Klarte ikke å koble video direkte (ofte mobilnett/brannmur uten TURN-server). Prøv samme Wi-Fi eller koble til på nytt.",
        )
      }
    }
    pc.onconnectionstatechange = oppdaterTilstand
    pc.oniceconnectionstatechange = oppdaterTilstand

    const forhandle = async () => {
      if (pcRef.current !== pc) return
      try {
        lagerTilbudRef.current = true
        const tilbud = await pc.createOffer()
        if (pc.signalingState !== "stable") return
        await pc.setLocalDescription(tilbud)
        if (pc.localDescription?.sdp) {
          sendSignalRef.current({ fra: meg, til: motstanderId, type: "offer", sdp: pc.localDescription.sdp })
        }
      } catch {
        // Ignore transient negotiation race; polite peer handles retries.
      } finally {
        lagerTilbudRef.current = false
      }
    }

    // Impolite peer (lexicographically larger id) initiates the first offer.
    const erHoflig = meg < motstanderId
    pc.onnegotiationneeded = () => {
      if (!erHoflig) void forhandle()
    }

    // Kick off initial handshake once peer joins.
    const startTimer = window.setTimeout(() => {
      if (!erHoflig) {
        void forhandle()
      } else {
        sendSignalRef.current({ fra: meg, til: motstanderId, type: "klar-video" })
      }
    }, 300)

    return () => {
      window.clearTimeout(startTimer)
      lukkForbindelse()
    }
  }, [aktiv, iceKlar, meg, motstanderId, lukkForbindelse])

  // Swap outgoing video track cleanly whenever the local camera is switched or toggled.
  useEffect(() => {
    const sender = senderRef.current
    if (!sender) return
    const spor = lokalStrom?.getVideoTracks()[0] ?? null
    void sender.replaceTrack(spor).catch(() => {})
  }, [lokalStrom])

  // Swap outgoing audio track cleanly whenever the local mic is toggled on or off.
  useEffect(() => {
    const sender = lydSenderRef.current
    if (!sender) return
    const spor = lydStrom?.getAudioTracks()[0] ?? null
    void sender.replaceTrack(spor).catch(() => {})
  }, [lydStrom])

  const mottaSignal = useCallback(
    (payload: unknown) => {
      const sig = lesSignal(payload)
      const pc = pcRef.current
      if (!sig || !pc || !meg || !motstanderId) return
      if (sig.til !== meg || sig.fra !== motstanderId) return

      const erHoflig = meg < motstanderId

      void (async () => {
        try {
          if (sig.type === "klar-video") {
            if (!erHoflig && pc.signalingState === "stable") {
              lagerTilbudRef.current = true
              try {
                const tilbud = await pc.createOffer()
                await pc.setLocalDescription(tilbud)
                if (pc.localDescription?.sdp) {
                  sendSignalRef.current({ fra: meg, til: motstanderId, type: "offer", sdp: pc.localDescription.sdp })
                }
              } finally {
                lagerTilbudRef.current = false
              }
            }
            return
          }

          if (sig.type === "offer") {
            const kollisjon = lagerTilbudRef.current || pc.signalingState !== "stable"
            ignorerTilbudRef.current = !erHoflig && kollisjon
            if (ignorerTilbudRef.current) return
            if (kollisjon) {
              await pc.setLocalDescription({ type: "rollback" })
            }
            await pc.setRemoteDescription({ type: "offer", sdp: sig.sdp })
            for (const c of venterIceRef.current.splice(0)) {
              await pc.addIceCandidate(c).catch(() => {})
            }
            const svar = await pc.createAnswer()
            await pc.setLocalDescription(svar)
            if (pc.localDescription?.sdp) {
              sendSignalRef.current({ fra: meg, til: motstanderId, type: "answer", sdp: pc.localDescription.sdp })
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
            if (ignorerTilbudRef.current) return
            if (pc.remoteDescription) {
              await pc.addIceCandidate(sig.candidate).catch(() => {})
            } else {
              venterIceRef.current.push(sig.candidate)
            }
          }
        } catch {
          // Malformed or stale WebRTC signaling message; ignore safely.
        }
      })()
    },
    [meg, motstanderId],
  )

  const koblePaaNytt = useCallback(() => {
    const pc = pcRef.current
    if (!pc || !meg || !motstanderId) return
    setStatus("kobler")
    setFeil(null)
    void (async () => {
      try {
        const tilbud = await pc.createOffer({ iceRestart: true })
        await pc.setLocalDescription(tilbud)
        if (pc.localDescription?.sdp) {
          sendSignalRef.current({ fra: meg, til: motstanderId, type: "offer", sdp: pc.localDescription.sdp })
        }
      } catch {
        setStatus("feil")
      }
    })()
  }, [meg, motstanderId])

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

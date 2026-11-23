"use client"

// Peer-to-peer WebRTC video helper for Moggern.
// Video flows directly between the two browsers; only tiny SDP/ICE signalling messages travel
// over the room's Supabase Realtime broadcast channel. No audio is requested, and nothing is recorded.

import { useCallback, useEffect, useRef, useState } from "react"
import { lesSignal, type WebRtcSignal } from "./duell"
import { STANDARD_STUN, type IceKonfig } from "./ice"

export type VideoTilkobling = "av" | "kobler" | "tilkoblet" | "feil"

export { hentKameraStrom, kameraFeilTekst, KAMERA_ONSKER, KAMERA_RESERVE, stoppStrom } from "./kamera"

/**
 * Manages the P2P RTCPeerConnection for one 1v1 Moggern room using the polite-peer pattern.
 * Pass `mottaSignal` into the Realtime channel's "signal" broadcast handler.
 */
export function useMoggernWebRtc({
  meg,
  motstanderId,
  lokalStrom,
  sendSignal,
  aktiv,
}: {
  meg: string | null
  motstanderId: string | null
  lokalStrom: MediaStream | null
  sendSignal: (signal: WebRtcSignal) => void
  /** True only when the user is logged in, has accepted the disclaimer, and is in the active 2-player pair. */
  aktiv: boolean
}) {
  const [fjernStrom, setFjernStrom] = useState<MediaStream | null>(null)
  const [status, setStatus] = useState<VideoTilkobling>("av")
  const [feil, setFeil] = useState<string | null>(null)
  const [harTurn, setHarTurn] = useState(false)

  const pcRef = useRef<RTCPeerConnection | null>(null)
  const iceKonfigRef = useRef<IceKonfig>({ iceServers: [...STANDARD_STUN], harTurn: false })
  const senderRef = useRef<RTCRtpSender | null>(null)
  const lokalStromRef = useRef<MediaStream | null>(lokalStrom)
  const sendSignalRef = useRef(sendSignal)
  const venterIceRef = useRef<RTCIceCandidateInit[]>([])
  const lagerTilbudRef = useRef(false)
  const ignorerTilbudRef = useRef(false)

  useEffect(() => {
    lokalStromRef.current = lokalStrom
    sendSignalRef.current = sendSignal
  })

  // Fetch STUN + optional TURN configuration from our server route once.
  useEffect(() => {
    if (!aktiv) return
    let avbrutt = false
    void fetch("/spill/api/moggern/ice", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data: IceKonfig | null) => {
        if (avbrutt || !data || !Array.isArray(data.iceServers)) return
        iceKonfigRef.current = data
        setHarTurn(!!data.harTurn)
      })
      .catch(() => {})
    return () => {
      avbrutt = true
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
    venterIceRef.current = []
    lagerTilbudRef.current = false
    ignorerTilbudRef.current = false
    setFjernStrom(null)
    setStatus("av")
  }, [])

  // Create/maintain RTCPeerConnection when both peers are in the room and ready to connect.
  useEffect(() => {
    if (!aktiv || !meg || !motstanderId) {
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

    const fjern = new MediaStream()

    // Always add a video transceiver so negotiation works even before the local camera is turned on.
    const spor = lokalStromRef.current?.getVideoTracks()[0] ?? null
    const transceiver = pc.addTransceiver("video", { direction: "sendrecv" })
    senderRef.current = transceiver.sender
    if (spor) {
      void transceiver.sender.replaceTrack(spor).catch(() => {})
    }

    pc.ontrack = (e) => {
      for (const s of e.streams) {
        for (const t of s.getVideoTracks()) {
          if (!fjern.getTrackById(t.id)) fjern.addTrack(t)
        }
      }
      if (e.track.kind === "video" && !fjern.getTrackById(e.track.id)) {
        fjern.addTrack(e.track)
      }
      setFjernStrom(new MediaStream(fjern.getVideoTracks()))
      e.track.onended = () => {
        fjern.removeTrack(e.track)
        setFjernStrom(fjern.getVideoTracks().length ? new MediaStream(fjern.getVideoTracks()) : null)
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
  }, [aktiv, meg, motstanderId, lukkForbindelse])

  // Swap outgoing video track cleanly whenever the local camera is toggled on or off.
  useEffect(() => {
    const sender = senderRef.current
    if (!sender) return
    const spor = lokalStrom?.getVideoTracks()[0] ?? null
    void sender.replaceTrack(spor).catch(() => {})
  }, [lokalStrom])

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
    status,
    feil,
    harTurn,
    mottaSignal,
    koblePaaNytt,
    lukkForbindelse,
  }
}

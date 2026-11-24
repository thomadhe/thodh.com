"use client"

import {
  Camera,
  CameraOff,
  Check,
  Copy,
  Crown,
  Loader2,
  Lock,
  LogOut,
  Mic,
  MicOff,
  Play,
  RefreshCw,
  ScanFace,
  ShieldCheck,
  Sparkles,
  Trophy,
  User,
  UserCheck,
  Volume2,
  Wifi,
  WifiOff,
} from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useSprak, useT } from "@/lib/sprak"
import { lagKode, rensNavn } from "../lib/duell/rom"
import { serverNa } from "../lib/duell/signatur"
import { lyder } from "../lib/lyd"
import {
  lesMoggernRapport,
  lesMoggernStatus,
  MALING_MS,
  MOGGERN_MAKS_SPILLERE,
  moggernStart,
  moggernTaImot,
  NEDTELLING_MS,
  oppdaterStilling,
  regnDuellUtfall,
  velgMoggernDeltakere,
  type MoggernRapport,
  type MoggernStatus,
  type SpillerMaaling,
  type SpillerSluttResultat,
  type WebRtcSignal,
} from "../lib/moggern/duell"
import {
  fangRelayRamme,
  fangVideoBilde,
  lagreDagensBeste,
  lesDagensBeste,
  lesRelayRamme,
  type DagensBeste,
} from "../lib/moggern/duell-kort"
import { opprettAnsiktSporer, opprettHandSporer, type AnsiktSporer, type HandSporer } from "../lib/moggern/landmarker"
import { samleLysStatus, type LysAnalyse } from "../lib/moggern/lys"
import {
  aggregerRammer,
  formaterBonus,
  formaterMoggernPoeng,
  MIN_GYLDIGE_RAMMER,
  MOG_UTTRYKK,
  oppdaterLivePoeng,
  regnTotal,
  type LivePoeng,
  type LivePoengTilstand,
  type MogUttrykkStyrker,
  type Punkt3D,
  type RammeResultat,
  type Veiledning,
} from "../lib/moggern/poeng"
import {
  erRizzlerPose,
  lesRizzlerHendelse,
  RIZZLER_BONUS,
  RIZZLER_EKSTRATID_MS,
  RIZZLER_FEIL_STRAFF,
  RIZZLER_FORVARSEL_MS,
  RIZZLER_GLIPP_MS,
  RIZZLER_HOLD_MS,
  RIZZLER_SMIL_TERSKEL,
  RIZZLER_SOLO_MIN_POENG,
  RIZZLER_VINDU_MS,
  type RizzlerPoseStatus,
} from "../lib/moggern/rizzler"
import { tegnAnsiktSporing, tømSporingsLerret } from "../lib/moggern/sporing-tegner"
import { rangForPoeng } from "../lib/moggern/tekster"
import {
  hentKameraStrom,
  hentMikrofonStrom,
  kameraFeilTekst,
  mikrofonFeilTekst,
  stoppStrom,
  useMoggernWebRtc,
} from "../lib/moggern/webrtc"
import { useDuellrom, type Romkontekst } from "./duell/bruk-duellrom"
import { MFLATE, MKNAPP, MKNAPP_SEKUNDAR, SlikRegnesDet, TullSkjerm, useHarGodkjentTull } from "./moggern-forklaring"
import type { MoggernBruker } from "./moggern-inngang"
import { MoggernResultat } from "./moggern-resultat"
import { useVisningsnavnSynk, VisningsnavnPille } from "./visningsnavn-pille"

const VEILEDNING_TEKST: Record<Veiledning, { no: string; en: string }> = {
  "ingen-ansikt": {
    no: "Ingen ansikt i bildet — flytt deg inn i rammen",
    en: "No face in frame — center yourself in view",
  },
  "for-langt-unna": {
    no: "Kom litt nærmere kameraet",
    en: "Move a bit closer to the camera",
  },
  "for-naerme": {
    no: "Gå et lite steg bakover",
    en: "Take a small step back",
  },
  "snu-rett": {
    no: "Se litt rettere mot kameraet",
    en: "Face the camera a bit more straight on",
  },
  "vipp-rett": {
    no: "Hold hodet litt rettere",
    en: "Keep your head a bit more level",
  },
  ok: {
    no: "Perfekt! Hold blikket rolig",
    en: "Perfect! Hold your gaze steady",
  },
}

const MAALING_INTERVALL_MS = 140
/** Live HUD React state update cadence (ms); keeps score smoothing responsive without re-rendering at 25 fps. */
const HUD_INTERVALL_MS = 110
/** Minimum interval between green tracking overlay redraws (~25 fps on GPU, adapts down on slower CPUs). */
const SPORING_MIN_INTERVALL_MS = 40
/** Minimum ms between local Peak Mog snapshot captures during a round. */
const PEAK_BILDE_INTERVALL_MS = 550
/** Expression strength from which a mog-uttrykk pill is shown. */
const UTTRYKK_VIS_TERSKEL = 0.12
/** Cadence for automatic HTTPS/WSS video relay fallback (~4.3 fps) when P2P WebRTC is blocked (5G CGNAT / strict Wi-Fi). */
const RELAY_INTERVALL_MS = 230
/** Wait briefly for direct WebRTC P2P to link up before engaging automatic WSS video relay. */
const RELAY_OPPSTART_MS = 2800
/** Clear relay status if no frames arrive for this long. */
const RELAY_UTLOP_MS = 3800

/** Dark glass used by every floating HUD element over the videos (explicit colours: unaffected by .spill-mork). */
const GLASS = "border border-white/10 bg-[#111214]/65 text-white backdrop-blur-md"

type ModellStatus = "laster" | "klar" | "feil"
type SoloFase = null | "nedtelling" | "maling" | "resultat"

export function MoggernRom({
  kode,
  bruker,
  supabaseUrl,
  supabaseNokkel,
}: {
  kode: string
  bruker: MoggernBruker | null
  supabaseUrl: string
  supabaseNokkel: string
}) {
  const t = useT()
  const { godkjent, lastet } = useHarGodkjentTull()
  const [lokalGodkjent, setLokalGodkjent] = useState(false)
  const harGodkjent = godkjent || lokalGodkjent

  if (!lastet) {
    return (
      <div className="mx-auto w-full max-w-xl py-12 text-center text-xs text-neutral-500 tabular-nums">
        {t(`Laster rom ${kode} …`, `Loading room ${kode} …`)}
      </div>
    )
  }

  if (!harGodkjent) {
    return (
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-4">
        <TullSkjerm onGodkjenn={() => setLokalGodkjent(true)} />
      </div>
    )
  }

  return <AktivtMoggernRom kode={kode} bruker={bruker} supabaseUrl={supabaseUrl} supabaseNokkel={supabaseNokkel} />
}

/** Live score + rank title badge floating over a video tile. */
function LiveRating({ live, modell, aktiv }: { live: LivePoeng | null; modell: ModellStatus; aktiv: boolean }) {
  const sprak = useSprak()
  const t = useT()
  if (!aktiv) return null
  if (!live) {
    return (
      <span className={`${GLASS} inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-[11px] font-medium text-white/75`}>
        {modell === "laster" ? <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" /> : null}
        {modell === "laster" ? t("Laster ansiktsmodell …", "Loading face model …") : t("Vis ansiktet i kameraet", "Show your face in the camera")}
      </span>
    )
  }
  const rang = rangForPoeng(live.total, sprak)
  return (
    <div
      className={`${GLASS} flex items-center gap-2 rounded-[18px] py-1 pr-3 pl-1 shadow-[0_8px_24px_rgb(0_0_0/0.25)]`}
      aria-live="off"
      title={
        sprak === "en"
          ? `Structure ${formaterMoggernPoeng(live.strukturPoeng, "en")} · expressions ${formaterBonus(live.bonus, "en")}`
          : `Struktur ${formaterMoggernPoeng(live.strukturPoeng)} · uttrykk ${formaterBonus(live.bonus)}`
      }
    >
      <span className={`rounded-[14px] px-2.5 py-1 text-xs font-semibold tracking-[-0.01em] sm:text-[13px] ${rang.farge}`}>{rang.tittel}</span>
      <span className="text-[1.65rem] leading-none font-semibold tracking-[-0.04em] tabular-nums sm:text-[2rem]">
        {formaterMoggernPoeng(live.total, sprak)}
      </span>
    </div>
  )
}

/** Compact pills for active mog-uttrykk with their live bonus/penalty. */
function UttrykkPiller({ styrker }: { styrker: MogUttrykkStyrker | null }) {
  const sprak = useSprak()
  if (!styrker) return null
  const aktive = MOG_UTTRYKK.filter((u) => (styrker[u.id] ?? 0) >= UTTRYKK_VIS_TERSKEL)
  if (!aktive.length) return null
  return (
    <div className="flex flex-wrap gap-1.5">
      {aktive.map((u) => {
        const verdi = (styrker[u.id] ?? 0) * u.maks
        return (
          <span
            key={u.id}
            className={`mel-pop inline-flex h-7 items-center gap-1 rounded-full px-2.5 text-[11px] font-semibold backdrop-blur-md tabular-nums ${
              u.maks > 0 ? "bg-lime-300/90 text-[#18191b]" : "bg-rose-500/85 text-white"
            }`}
          >
            {sprak === "en" ? u.navnEn : u.navn}
            <span className="opacity-70">{formaterBonus(verdi, sprak)}</span>
          </span>
        )
      })}
    </div>
  )
}

function AktivtMoggernRom({
  kode,
  bruker,
  supabaseUrl,
  supabaseNokkel,
}: {
  kode: string
  bruker: MoggernBruker | null
  supabaseUrl: string
  supabaseNokkel: string
}) {
  const router = useRouter()
  const sprak = useSprak()
  const t = useT()
  const en = sprak === "en"
  const sprakRef = useRef(sprak)
  useEffect(() => {
    sprakRef.current = sprak
  }, [sprak])

  const signalHandtererRef = useRef<(payload: unknown) => void>(() => {})
  const motSendtBildeRef = useRef<{ runde: number; av: string; dataUrl: string } | null>(null)
  const visBannerRef = useRef<(type: "utlost" | "feilet", avMeg: boolean, navn: string) => void>(() => {})
  const motFinisherStatusRef = useRef<"inaktiv" | "utlost" | "feilet">("inaktiv")
  const motFinisherBonusRef = useRef<number>(0)
  const motPoengLastRef = useRef<boolean>(false)
  const [motFinisherLader, setMotFinisherLader] = useState(false)
  const [peakBilder, setPeakBilder] = useState<Record<string, string | null>>({})
  const [motstanderKameraPa, setMotstanderKameraPa] = useState(false)
  const [relayAktiv, setRelayAktiv] = useState(false)
  const [forlattVarsel, setForlattVarsel] = useState<string | null>(null)
  const [mittNavn, setMittNavn] = useState(bruker?.visningsnavn ?? "")
  const fjernRelayLerretRef = useRef<HTMLCanvasElement | null>(null)
  const relayFangLerretRef = useRef<HTMLCanvasElement | null>(null)
  const relayRammeNrRef = useRef(0)
  const sisteAnalysertRelayNrRef = useRef(0)
  const sisteRelayTidRef = useRef(0)
  const relayBildeLasterRef = useRef(false)
  const harFjernWebRtcRef = useRef(false)
  useVisningsnavnSynk(setMittNavn)

  useEffect(() => {
    if (bruker) return
    try {
      const lagret = rensNavn(localStorage.getItem("stegern:duell:navn") ?? "")
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (lagret) setMittNavn(lagret)
    } catch {}
  }, [bruker])

  const hendelser = useMemo(
    () => ({
      signal: (payload: unknown) => {
        signalHandtererRef.current(payload)
      },
      kamera: (payload: unknown, romCtx: Romkontekst<MoggernStatus>) => {
        const p = payload as { id?: unknown; pa?: unknown }
        if (typeof p?.id === "string" && p.id !== romCtx.meg && typeof p.pa === "boolean") {
          setMotstanderKameraPa(p.pa)
          if (!p.pa) {
            relayRammeNrRef.current = 0
            sisteAnalysertRelayNrRef.current = 0
            setRelayAktiv(false)
            tømSporingsLerret(fjernRelayLerretRef.current)
          }
        }
      },
      ramme: (payload: unknown, romCtx: Romkontekst<MoggernStatus>) => {
        if (harFjernWebRtcRef.current) return
        const ramme = lesRelayRamme(payload)
        if (!ramme || ramme.av === romCtx.meg) return
        sisteRelayTidRef.current = Date.now()
        setMotstanderKameraPa(true)
        setRelayAktiv(true)
        if (relayBildeLasterRef.current) return
        const lerret = fjernRelayLerretRef.current
        if (!lerret) return
        relayBildeLasterRef.current = true
        const img = new Image()
        img.onload = () => {
          relayBildeLasterRef.current = false
          if (harFjernWebRtcRef.current) return
          const maal = fjernRelayLerretRef.current
          if (!maal) return
          const w = img.naturalWidth || ramme.w
          const h = img.naturalHeight || ramme.h
          if (w < 64 || h < 64) return
          if (maal.width !== w || maal.height !== h) {
            maal.width = w
            maal.height = h
          }
          const ctx = maal.getContext("2d")
          if (!ctx) return
          ctx.drawImage(img, 0, 0, w, h)
          relayRammeNrRef.current += 1
        }
        img.onerror = () => {
          relayBildeLasterRef.current = false
        }
        img.src = ramme.dataUrl
      },
      rapport: (payload: unknown, romCtx: Romkontekst<MoggernStatus>) => {
        const rapport = lesMoggernRapport(payload)
        if (!rapport) return
        romCtx.settStatus((s) => {
          if (s.runde !== rapport.runde || !s.deltakere.some((d) => d.id === rapport.av)) return s
          if (s.rapporter[rapport.av]) return s
          return { ...s, rapporter: { ...s.rapporter, [rapport.av]: rapport } }
        })
      },
      finisher: (payload: unknown, romCtx: Romkontekst<MoggernStatus>) => {
        const h = lesRizzlerHendelse(payload)
        if (!h || h.av === romCtx.meg || romCtx.status().runde !== h.runde) return
        if (h.type === "start") {
          motPoengLastRef.current = true
          setMotFinisherLader(true)
          return
        }
        motPoengLastRef.current = true
        setMotFinisherLader(false)
        if (motFinisherStatusRef.current !== "inaktiv") return
        motFinisherStatusRef.current = h.type
        motFinisherBonusRef.current = h.type === "utlost" ? RIZZLER_BONUS : RIZZLER_FEIL_STRAFF
        if (h.type === "utlost") lyder.rizzler()
        else lyder.rizzFeil()
        visBannerRef.current(h.type, false, h.navn || (sprakRef.current === "en" ? "Opponent" : "Motstanderen"))
      },
      bilde: (payload: unknown, romCtx: Romkontekst<MoggernStatus>) => {
        const p = payload as { runde?: unknown; av?: unknown; dataUrl?: unknown }
        if (
          typeof p?.runde !== "number" ||
          typeof p?.av !== "string" ||
          p.av === romCtx.meg ||
          typeof p?.dataUrl !== "string" ||
          !p.dataUrl.startsWith("data:image/jpeg;base64,") ||
          p.dataUrl.length > 120_000
        ) {
          return
        }
        if (romCtx.status().runde !== p.runde) return
        const av = p.av
        const dataUrl = p.dataUrl
        motSendtBildeRef.current = { runde: p.runde, av, dataUrl }
        setPeakBilder((prev) => ({ ...prev, [av]: dataUrl }))
      },
      forlat: (payload: unknown, romCtx: Romkontekst<MoggernStatus>) => {
        const p = payload as { id?: unknown; navn?: unknown }
        if (typeof p?.id === "string" && p.id !== romCtx.meg) {
          const hvem =
            typeof p.navn === "string" && p.navn
              ? p.navn
              : sprakRef.current === "en"
                ? "Opponent"
                : "Motstanderen"
          setForlattVarsel(sprakRef.current === "en" ? `${hvem} left the room.` : `${hvem} forlot rommet.`)
          setMotstanderKameraPa(false)
          relayRammeNrRef.current = 0
          sisteAnalysertRelayNrRef.current = 0
          setRelayAktiv(false)
          tømSporingsLerret(fjernRelayLerretRef.current)
          if (romCtx.erVert() && romCtx.status().fase !== "lobby") {
            romCtx.settStatus((s) => ({ ...moggernStart(s.runde + 1), v: 1 }))
            romCtx.kringkast()
          }
        }
      },
    }),
    [],
  )

  const rom = useDuellrom<MoggernStatus>({
    kanal: "moggern-duell",
    lagring: "moggern:duell",
    kode,
    supabaseUrl,
    supabaseNokkel,
    start: moggernStart,
    les: lesMoggernStatus,
    taImot: moggernTaImot,
    hendelser,
  })

  const { status, settStatus, send, meg, erVert, tilkobling, iRommet, klar, settKlar, nyFase, settNavn } = rom

  // Always present the account's or guest's (possibly just edited) display name in the duel room presence.
  useEffect(() => {
    if (mittNavn) settNavn(mittNavn)
  }, [mittNavn, settNavn])

  const aktiveSpillere = useMemo(() => iRommet.slice(0, MOGGERN_MAKS_SPILLERE), [iRommet])
  const erDeltaker = !!meg && aktiveSpillere.some((s) => s.id === meg)
  const erFullt = !!meg && iRommet.length > MOGGERN_MAKS_SPILLERE && !erDeltaker
  const motstander = useMemo(() => aktiveSpillere.find((s) => s.id !== meg) ?? null, [aktiveSpillere, meg])
  const motstanderId = motstander?.id ?? null

  // Clear "left" notice when a friend joins back.
  useEffect(() => {
    if (motstanderId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setForlattVarsel(null)
    } else {
      setMotstanderKameraPa(false)
    }
  }, [motstanderId])

  // ---- Local camera, opt-in microphone & lazy MediaPipe Face/Hand Landmarkers ----
  const [lokalStrom, setLokalStrom] = useState<MediaStream | null>(null)
  const [lydStrom, setLydStrom] = useState<MediaStream | null>(null)
  const [starterKamera, setStarterKamera] = useState(false)
  const [starterMik, setStarterMik] = useState(false)
  const [kameraFeil, setKameraFeil] = useState<string | null>(null)
  const [mikFeil, setMikFeil] = useState<string | null>(null)
  const [lydBlokkert, setLydBlokkert] = useState(false)
  const [modell, setModell] = useState<ModellStatus>("laster")
  const [kopiert, setKopiert] = useState(false)
  const [egenVeiledning, setEgenVeiledning] = useState<Veiledning | null>(null)
  const [egenLive, setEgenLive] = useState<LivePoeng | null>(null)
  const [motLive, setMotLive] = useState<LivePoeng | null>(null)
  const [gyldigeEgen, setGyldigeEgen] = useState(0)
  const [gyldigeMot, setGyldigeMot] = useState(0)
  const [visSporing, setVisSporing] = useState(true)
  const [na, setNa] = useState(() => serverNa())
  const [dagensBeste, setDagensBeste] = useState<DagensBeste | null>(null)
  const [resultatRekord, setResultatRekord] = useState<{ poeng: number; nyRekord: boolean } | null>(null)

  // Rizzler Finisher live HUD state
  const [egenFinisherStatus, setEgenFinisherStatus] = useState<"inaktiv" | "utlost" | "feilet">("inaktiv")
  const [finisherFremdrift, setFinisherFremdrift] = useState(0)
  const [finisherBanner, setFinisherBanner] = useState<{
    type: "utlost" | "feilet"
    avMeg: boolean
    navn: string
    id: number
  } | null>(null)
  const [lobbyRizzler, setLobbyRizzler] = useState(false)
  const [egenPoengLast, setEgenPoengLast] = useState(false)
  const [rizzlerPoseStatus, setRizzlerPoseStatus] = useState<RizzlerPoseStatus>("ingen-hand")

  // Solo-test (15 s) state inside the room lobby
  const [soloFase, setSoloFase] = useState<SoloFase>(null)
  const [soloStartTid, setSoloStartTid] = useState(0)
  const [soloRunde, setSoloRunde] = useState(0)
  const [soloMaaling, setSoloMaaling] = useState<SpillerMaaling | null>(null)

  const landmarkerKlar = modell === "klar"

  const lokalStromRef = useRef<MediaStream | null>(null)
  const lydStromRef = useRef<MediaStream | null>(null)
  const starterRef = useRef(false)
  const montertRef = useRef(true)
  /** Set when the player turns the camera off themselves, so auto-start never overrides that choice. */
  const manueltAvRef = useRef(false)
  const visSporingRef = useRef(true)
  const egenSporerRef = useRef<AnsiktSporer | null>(null)
  const motSporerRef = useRef<AnsiktSporer | null>(null)
  const handSporerRef = useRef<HandSporer | null>(null)
  const egenVideoRef = useRef<HTMLVideoElement | null>(null)
  const fjernVideoRef = useRef<HTMLVideoElement | null>(null)
  const fjernLydRef = useRef<HTMLAudioElement | null>(null)
  const egenSporingLerretRef = useRef<HTMLCanvasElement | null>(null)
  const motSporingLerretRef = useRef<HTMLCanvasElement | null>(null)
  const lerretRef = useRef<HTMLCanvasElement | null>(null)
  const egenLiveRef = useRef<LivePoengTilstand>({ struktur: null, styrker: null })
  const motLiveRef = useRef<LivePoengTilstand>({ struktur: null, styrker: null })

  const egenRammerRef = useRef<RammeResultat[]>([])
  const egenLysRef = useRef<LysAnalyse[]>([])
  const motRammerRef = useRef<RammeResultat[]>([])
  const motLysRef = useRef<LysAnalyse[]>([])
  const egenPeakPoengRef = useRef(-1)
  const egenPeakBildeRef = useRef<string | null>(null)
  const egenPeakTidRef = useRef(0)
  const motPeakPoengRef = useRef(-1)
  const motPeakBildeRef = useRef<string | null>(null)
  const motPeakTidRef = useRef(0)
  const sendtRapportRundeRef = useRef<number | null>(null)
  const lagretRekordRundeRef = useRef<number | null>(null)
  const ferdigSoloRundeRef = useRef<number | null>(null)
  const sisteTickRef = useRef<number | null>(null)

  const egenFinisherStatusRef = useRef<"inaktiv" | "utlost" | "feilet">("inaktiv")
  const egenFinisherBonusRef = useRef<number>(0)
  const egenPoengLastRef = useRef<boolean>(false)
  const finisherLadeStartRef = useRef<number | null>(null)
  const sisteRizzlerSettRef = useRef<number>(0)
  const finisherSmilPaRadRef = useRef<number>(0)
  const gyldigeEgenRef = useRef<number>(0)
  const gyldigeMotRef = useRef<number>(0)
  const rizzlerPoseStatusRef = useRef<RizzlerPoseStatus>("ingen-hand")
  const rizzlerTippRef = useRef<Punkt3D | null>(null)
  const lobbyRizzlerRef = useRef<boolean>(false)
  const kanBrukeFinisherRef = useRef<boolean>(false)
  const mittNavnRef = useRef(mittNavn)
  const sendFinisherRef = useRef<(type: "start" | "utlost" | "feilet") => void>(() => {})
  const bannerTimerRef = useRef<number | null>(null)

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDagensBeste(lesDagensBeste())
  }, [])

  // If a real 1v1 duel starts while someone is in Solo-test, yield immediately to the 1v1 duel.
  useEffect(() => {
    if (status.fase !== "lobby" && soloFase !== null) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSoloFase(null)
    }
  }, [status.fase, soloFase])

  useEffect(() => {
    visSporingRef.current = visSporing
    if (!visSporing) {
      tømSporingsLerret(egenSporingLerretRef.current)
      tømSporingsLerret(motSporingLerretRef.current)
    }
  }, [visSporing])

  const sendSignal = useCallback(
    (sig: WebRtcSignal) => {
      send("signal", sig as unknown as Record<string, unknown>)
    },
    [send],
  )

  const webrtc = useMoggernWebRtc({
    meg,
    motstanderId,
    lokalStrom,
    lydStrom,
    sendSignal,
    aktiv: !erFullt && tilkobling === "klar",
    sprak,
  })

  useEffect(() => {
    signalHandtererRef.current = webrtc.mottaSignal
  }, [webrtc.mottaSignal])

  // Broadcast camera-on status whenever it changes or when an opponent arrives.
  useEffect(() => {
    if (!meg || tilkobling !== "klar") return
    send("kamera", { id: meg, pa: !!lokalStrom })
  }, [meg, tilkobling, lokalStrom, motstanderId, send])

  const erSoloAktiv = soloFase !== null && status.fase === "lobby"
  const aktivFase = erSoloAktiv ? soloFase : status.fase
  const aktivStartTid = erSoloAktiv ? soloStartTid : status.faseStartTid
  const iDuell = aktivFase === "nedtelling" || aktivFase === "maling"
  const visResultat = aktivFase === "resultat"

  // Attach streams to the (always mounted) <video> and <audio> elements without re-binding on every phase change.
  useEffect(() => {
    const el = egenVideoRef.current
    if (!el) return
    if (el.srcObject !== lokalStrom) el.srcObject = lokalStrom
    if (lokalStrom && el.paused) void el.play().catch(() => {})
  }, [lokalStrom, aktivFase])

  useEffect(() => {
    const el = fjernVideoRef.current
    if (!el) return
    if (el.srcObject !== webrtc.fjernStrom) el.srcObject = webrtc.fjernStrom
    if (webrtc.fjernStrom && el.paused) void el.play().catch(() => {})
  }, [webrtc.fjernStrom, aktivFase])

  useEffect(() => {
    const el = fjernLydRef.current
    if (!el) return
    el.srcObject = webrtc.fjernLydStrom
    if (!webrtc.fjernLydStrom) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLydBlokkert(false)
      return
    }
    void el
      .play()
      .then(() => setLydBlokkert(false))
      .catch(() => setLydBlokkert(true))
  }, [webrtc.fjernLydStrom])

  useEffect(() => {
    harFjernWebRtcRef.current = !!webrtc.fjernStrom
    if (webrtc.fjernStrom) {
      relayRammeNrRef.current = 0
      sisteAnalysertRelayNrRef.current = 0
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setRelayAktiv(false)
      tømSporingsLerret(fjernRelayLerretRef.current)
    }
  }, [webrtc.fjernStrom])

  useEffect(() => {
    if (!motstanderId) {
      relayRammeNrRef.current = 0
      sisteAnalysertRelayNrRef.current = 0
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setRelayAktiv(false)
      tømSporingsLerret(fjernRelayLerretRef.current)
    }
  }, [motstanderId])

  useEffect(() => {
    if (!relayAktiv) return
    const id = window.setInterval(() => {
      if (Date.now() - sisteRelayTidRef.current > RELAY_UTLOP_MS) {
        relayRammeNrRef.current = 0
        sisteAnalysertRelayNrRef.current = 0
        setRelayAktiv(false)
        tømSporingsLerret(fjernRelayLerretRef.current)
      }
    }, 1200)
    return () => window.clearInterval(id)
  }, [relayAktiv])

  // Automatic HTTPS/WSS video relay fallback when direct P2P WebRTC is blocked (e.g. 5G CGNAT / strict Wi-Fi without TURN).
  // Yields immediately with zero traffic whenever direct WebRTC video connects.
  const harDirekteVideo = webrtc.status === "tilkoblet" && !!webrtc.fjernStrom
  useEffect(() => {
    if (!lokalStrom || !motstanderId || !meg || tilkobling !== "klar" || visResultat || harDirekteVideo) return
    const forsinkelse = webrtc.status === "feil" || relayAktiv ? 0 : RELAY_OPPSTART_MS
    let intervallId: number | null = null
    const startId = window.setTimeout(() => {
      const fangLerret = (relayFangLerretRef.current ??= document.createElement("canvas"))
      const sendRamme = () => {
        const video = egenVideoRef.current
        if (!video) return
        const ramme = fangRelayRamme(video, fangLerret)
        if (ramme) {
          send("ramme", { av: meg, ...ramme })
        }
      }
      sendRamme()
      intervallId = window.setInterval(sendRamme, RELAY_INTERVALL_MS)
    }, forsinkelse)

    return () => {
      window.clearTimeout(startId)
      if (intervallId !== null) window.clearInterval(intervallId)
    }
  }, [lokalStrom, motstanderId, meg, tilkobling, visResultat, harDirekteVideo, webrtc.status, relayAktiv, send])

  const harMotVideoVisning = !!webrtc.fjernStrom || relayAktiv
  useEffect(() => {
    if (!harMotVideoVisning) {
      motLiveRef.current = { struktur: null, styrker: null }
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setMotLive(null)
      tømSporingsLerret(motSporingLerretRef.current)
    }
  }, [harMotVideoVisning])

  const visBanner = useCallback((type: "utlost" | "feilet", avMeg: boolean, navn: string) => {
    if (bannerTimerRef.current !== null) {
      window.clearTimeout(bannerTimerRef.current)
    }
    setFinisherBanner({ type, avMeg, navn, id: Date.now() })
    bannerTimerRef.current = window.setTimeout(
      () => {
        setFinisherBanner(null)
        bannerTimerRef.current = null
      },
      type === "utlost" ? 3200 : 2800,
    )
  }, [])

  useEffect(() => {
    visBannerRef.current = visBanner
  }, [visBanner])

  useEffect(() => {
    mittNavnRef.current = mittNavn
  }, [mittNavn])

  useEffect(() => {
    sendFinisherRef.current = (type: "start" | "utlost" | "feilet") => {
      if (erSoloAktiv || !meg) return
      const payload = { runde: status.runde, av: meg, type, navn: mittNavnRef.current || "Spiller" }
      send("finisher", payload)
      if (type !== "start") {
        // Re-send once shortly after in case the round ends right as the finisher lands.
        window.setTimeout(() => {
          send("finisher", payload)
        }, 350)
      }
    }
  }, [erSoloAktiv, meg, status.runde, send])

  // Always stop camera/mic tracks & close MediaPipe trackers on unmount.
  useEffect(() => {
    montertRef.current = true
    return () => {
      montertRef.current = false
      if (bannerTimerRef.current !== null) {
        window.clearTimeout(bannerTimerRef.current)
        bannerTimerRef.current = null
      }
      stoppStrom(lokalStromRef.current)
      lokalStromRef.current = null
      stoppStrom(lydStromRef.current)
      lydStromRef.current = null
      egenSporerRef.current?.lukk()
      egenSporerRef.current = null
      motSporerRef.current?.lukk()
      motSporerRef.current = null
      handSporerRef.current?.lukk()
      handSporerRef.current = null
    }
  }, [])

  const hentModell = useCallback(() => {
    opprettAnsiktSporer()
      .then((egenSporer) => {
        if (!montertRef.current) {
          egenSporer.lukk()
          return
        }
        egenSporerRef.current?.lukk()
        egenSporerRef.current = egenSporer
        setModell("klar")
        // Create the isolated VIDEO tracker for the opponent's stream in parallel (reuses cached WASM/model).
        void opprettAnsiktSporer()
          .then((motSporer) => {
            if (!montertRef.current) {
              motSporer.lukk()
              return
            }
            motSporerRef.current?.lukk()
            motSporerRef.current = motSporer
          })
          .catch(() => {})
        // Lazy-load optional HandLandmarker for the Rizzler Finisher pose; failure never blocks Moggern.
        void opprettHandSporer()
          .then((handSporer) => {
            if (!montertRef.current) {
              handSporer.lukk()
              return
            }
            handSporerRef.current?.lukk()
            handSporerRef.current = handSporer
          })
          .catch(() => {})
      })
      .catch(() => {
        if (montertRef.current) setModell("feil")
      })
  }, [])

  // Preload the face model as soon as the room opens; the camera never waits for it.
  useEffect(() => {
    hentModell()
  }, [hentModell])

  const lastModell = useCallback(() => {
    setModell("laster")
    hentModell()
  }, [hentModell])

  const skruPaKamera = useCallback(async () => {
    if (starterRef.current || lokalStromRef.current) return
    starterRef.current = true
    manueltAvRef.current = false
    setStarterKamera(true)
    setKameraFeil(null)
    try {
      const strom = await hentKameraStrom()
      if (!montertRef.current || lokalStromRef.current) {
        stoppStrom(strom)
        return
      }
      lokalStromRef.current = strom
      egenLiveRef.current = { struktur: null, styrker: null }
      setLokalStrom(strom)
      lyder.velg()
    } catch (err) {
      if (montertRef.current) setKameraFeil(kameraFeilTekst(err, sprakRef.current))
    } finally {
      starterRef.current = false
      if (montertRef.current) setStarterKamera(false)
    }
  }, [])

  // Auto-start: logged in + "Alt er tull" accepted (this component only renders then) → camera on right away.
  useEffect(() => {
    if (erFullt || manueltAvRef.current) return
    void skruPaKamera()
  }, [erFullt, skruPaKamera])

  const skruAvKamera = useCallback(() => {
    manueltAvRef.current = true
    stoppStrom(lokalStromRef.current)
    lokalStromRef.current = null
    setLokalStrom(null)
    setEgenVeiledning(null)
    setEgenLive(null)
    egenLiveRef.current = { struktur: null, styrker: null }
    tømSporingsLerret(egenSporingLerretRef.current)
    setSoloFase(null)
    settKlar(false)
    if (meg) send("kamera", { id: meg, pa: false })
  }, [meg, send, settKlar])

  const toggleMikrofon = useCallback(async () => {
    if (starterMik) return
    setMikFeil(null)
    if (lydStromRef.current) {
      stoppStrom(lydStromRef.current)
      lydStromRef.current = null
      setLydStrom(null)
      return
    }
    setStarterMik(true)
    try {
      const strom = await hentMikrofonStrom()
      if (!montertRef.current) {
        stoppStrom(strom)
        return
      }
      lydStromRef.current = strom
      setLydStrom(strom)
      lyder.velg()
    } catch (err) {
      if (montertRef.current) setMikFeil(mikrofonFeilTekst(err, sprakRef.current))
    } finally {
      if (montertRef.current) setStarterMik(false)
    }
  }, [starterMik])

  const blokkerOgForlat = useCallback(() => {
    manueltAvRef.current = true
    stoppStrom(lokalStromRef.current)
    lokalStromRef.current = null
    setLokalStrom(null)
    stoppStrom(lydStromRef.current)
    lydStromRef.current = null
    setLydStrom(null)
    setSoloFase(null)
    webrtc.lukkForbindelse()
    if (meg) send("forlat", { id: meg, navn: mittNavn })
    router.push("/spill/moggern")
  }, [mittNavn, meg, router, send, webrtc])

  // ---- Countdown & measurement clock (shared by 1v1 and Solo-test) ----
  useEffect(() => {
    if (!iDuell) return
    const id = window.setInterval(() => setNa(serverNa()), 100)
    return () => window.clearInterval(id)
  }, [iDuell])

  const gjenstarMs = useMemo(() => {
    if (aktivFase === "nedtelling") {
      return Math.max(0, aktivStartTid + NEDTELLING_MS - na)
    }
    if (aktivFase === "maling") {
      return Math.max(0, aktivStartTid + MALING_MS - na)
    }
    return 0
  }, [aktivFase, aktivStartTid, na])

  // Rizzler Finisher unlocks at 13 s elapsed (final 2 s) when qualified: leading in 1v1 or >= 6.0 in Solo-test.
  // Between 10 s and 13 s elapsed we show a heads-up countdown so the player has time to get their finger ready.
  const kvalifisertForFinisher = erSoloAktiv
    ? (egenLive?.total ?? 0) >= RIZZLER_SOLO_MIN_POENG
    : !!egenLive && !!motLive && egenLive.total - motLive.total >= 0.1
  const iFinisherForvarsel =
    aktivFase === "maling" &&
    egenFinisherStatus === "inaktiv" &&
    !egenPoengLast &&
    kvalifisertForFinisher &&
    gjenstarMs > RIZZLER_VINDU_MS &&
    gjenstarMs <= RIZZLER_FORVARSEL_MS
  const iFinisherVindu = aktivFase === "maling" && gjenstarMs > 0 && gjenstarMs <= RIZZLER_VINDU_MS
  const kanBrukeFinisher = iFinisherVindu && egenFinisherStatus === "inaktiv" && (kvalifisertForFinisher || egenPoengLast)
  // If the player started charging right before 15 s, allow up to RIZZLER_EKSTRATID_MS to complete the hold.
  const rizzlerEkstraTidAktiv =
    aktivFase === "maling" &&
    gjenstarMs <= 0 &&
    egenFinisherStatus === "inaktiv" &&
    finisherFremdrift > 0 &&
    na < aktivStartTid + MALING_MS + RIZZLER_EKSTRATID_MS

  useEffect(() => {
    kanBrukeFinisherRef.current = kanBrukeFinisher
  }, [kanBrukeFinisher])

  // Countdown ticks (3, 2, 1) and transition to "maling" (both 1v1 host and Solo-test).
  useEffect(() => {
    if (aktivFase !== "nedtelling") {
      sisteTickRef.current = null
      return
    }
    const sek = Math.ceil(gjenstarMs / 1000)
    if (sek >= 1 && sek <= 3 && sisteTickRef.current !== sek) {
      sisteTickRef.current = sek
      lyder.tikk((3 - sek) / 3)
    }
    if (gjenstarMs <= 0) {
      if (erSoloAktiv) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setSoloStartTid(serverNa())
        setSoloFase("maling")
      } else if (erVert) {
        nyFase((s) => (s.fase === "nedtelling" ? { ...s, fase: "maling", faseStartTid: serverNa() } : s))
      }
    }
  }, [aktivFase, gjenstarMs, erSoloAktiv, erVert, nyFase])

  // ---- One adaptive rAF loop: smooth tracking overlay (~25 fps), live HUD (~9 Hz), Rizzler hand pose, Peak Mog snapshots & 15 s capture ----
  useEffect(() => {
    if (!landmarkerKlar || visResultat) {
      tømSporingsLerret(egenSporingLerretRef.current)
      tømSporingsLerret(motSporingLerretRef.current)
      return
    }
    const maler = aktivFase === "maling"
    const iLobby = aktivFase === "lobby"
    if (maler) {
      egenRammerRef.current = []
      egenLysRef.current = []
      motRammerRef.current = []
      motLysRef.current = []
      egenPeakPoengRef.current = -1
      egenPeakBildeRef.current = null
      egenPeakTidRef.current = 0
      motPeakPoengRef.current = -1
      motPeakBildeRef.current = null
      motPeakTidRef.current = 0
      motSendtBildeRef.current = null
      sendtRapportRundeRef.current = null
      egenFinisherStatusRef.current = "inaktiv"
      motFinisherStatusRef.current = "inaktiv"
      egenFinisherBonusRef.current = 0
      motFinisherBonusRef.current = 0
      egenPoengLastRef.current = false
      motPoengLastRef.current = false
      finisherLadeStartRef.current = null
      sisteRizzlerSettRef.current = 0
      finisherSmilPaRadRef.current = 0
      gyldigeEgenRef.current = 0
      gyldigeMotRef.current = 0
      rizzlerPoseStatusRef.current = "ingen-hand"
      rizzlerTippRef.current = null
      lobbyRizzlerRef.current = false
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPeakBilder({})
      setGyldigeEgen(0)
      setGyldigeMot(0)
      setEgenFinisherStatus("inaktiv")
      setEgenPoengLast(false)
      setMotFinisherLader(false)
      setRizzlerPoseStatus("ingen-hand")
      setFinisherFremdrift(0)
      setFinisherBanner(null)
      setLobbyRizzler(false)
    }

    const lerret = (lerretRef.current ??= document.createElement("canvas"))
    let rafId = 0
    let avbrutt = false
    let nesteAnalyseTid = 0
    let sisteMaalingTid = 0
    let sisteHudTid = 0
    let sisteHandTid = 0

    const steg = (naTid: number) => {
      if (avbrutt) return
      if (naTid >= nesteAnalyseTid) {
        const t0 = performance.now()
        const taOffisiell = maler && naTid - sisteMaalingTid >= MAALING_INTERVALL_MS
        if (taOffisiell) sisteMaalingTid = naTid
        const oppdaterHud = naTid - sisteHudTid >= HUD_INTERVALL_MS
        if (oppdaterHud) sisteHudTid = naTid

        const egenSporer = egenSporerRef.current
        const egenVideo = egenVideoRef.current
        const egenOverlay = egenSporingLerretRef.current
        if (taOffisiell && !egenPeakBildeRef.current && egenVideo && lokalStromRef.current) {
          const fallback = fangVideoBilde(egenVideo, true)
          if (fallback) {
            egenPeakBildeRef.current = fallback
            egenPeakTidRef.current = naTid
          }
        }
        if (egenSporer && egenVideo && lokalStromRef.current) {
          try {
            const ut = egenSporer.analyser(egenVideo, lerret, taOffisiell)
            if (ut) {
              // Rizzler Finisher hand tracking (runs in lobby practice or once unlocked at 13 s).
              const handSporer = handSporerRef.current
              const rizzlerAktivtVindu =
                maler &&
                egenFinisherStatusRef.current === "inaktiv" &&
                (kanBrukeFinisherRef.current || finisherLadeStartRef.current !== null)
              const skalSjekkeHand =
                !!handSporer &&
                !!ut.punkter &&
                ut.punkter.length >= 468 &&
                (iLobby ? naTid - sisteHandTid >= 140 : rizzlerAktivtVindu && naTid - sisteHandTid >= 75)

              if (skalSjekkeHand && handSporer && ut.punkter) {
                sisteHandTid = naTid
                const hender = handSporer.analyser(egenVideo)
                const pose = erRizzlerPose(hender, ut.punkter, egenVideo.videoWidth, egenVideo.videoHeight)
                rizzlerTippRef.current = pose.pekeTipp
                if (rizzlerPoseStatusRef.current !== pose.status) {
                  rizzlerPoseStatusRef.current = pose.status
                  setRizzlerPoseStatus(pose.status)
                }
                if (iLobby) {
                  if (lobbyRizzlerRef.current !== pose.aktiv) {
                    lobbyRizzlerRef.current = pose.aktiv
                    setLobbyRizzler(pose.aktiv)
                  }
                } else if (maler && egenFinisherStatusRef.current === "inaktiv") {
                  const smil = ut.ramme.uttrykk?.styrker.smiler ?? 0
                  if (pose.aktiv) {
                    sisteRizzlerSettRef.current = naTid
                    if (finisherLadeStartRef.current === null) {
                      finisherLadeStartRef.current = naTid
                      finisherSmilPaRadRef.current = 0
                      // Lock the player's base score as soon as they commit to the Rizzler Finisher.
                      if (!egenPoengLastRef.current) {
                        egenPoengLastRef.current = true
                        setEgenPoengLast(true)
                        sendFinisherRef.current("start")
                      }
                    }
                    if (smil >= RIZZLER_SMIL_TERSKEL) {
                      finisherSmilPaRadRef.current += 1
                    } else {
                      finisherSmilPaRadRef.current = 0
                    }
                    if (finisherSmilPaRadRef.current >= 2) {
                      egenFinisherStatusRef.current = "feilet"
                      egenFinisherBonusRef.current = RIZZLER_FEIL_STRAFF
                      finisherLadeStartRef.current = null
                      finisherSmilPaRadRef.current = 0
                      setEgenFinisherStatus("feilet")
                      setFinisherFremdrift(0)
                      lyder.rizzFeil()
                      visBannerRef.current("feilet", true, mittNavnRef.current || "Deg")
                      sendFinisherRef.current("feilet")
                    } else {
                      const fremdrift = Math.min(1, (naTid - finisherLadeStartRef.current) / RIZZLER_HOLD_MS)
                      setFinisherFremdrift(fremdrift)
                      if (fremdrift >= 1) {
                        egenFinisherStatusRef.current = "utlost"
                        egenFinisherBonusRef.current = RIZZLER_BONUS
                        finisherLadeStartRef.current = null
                        finisherSmilPaRadRef.current = 0
                        setEgenFinisherStatus("utlost")
                        setFinisherFremdrift(1)
                        lyder.rizzler()
                        visBannerRef.current("utlost", true, mittNavnRef.current || "Deg")
                        sendFinisherRef.current("utlost")
                        const finisherBilde = fangVideoBilde(egenVideo, true)
                        if (finisherBilde) {
                          egenPeakBildeRef.current = finisherBilde
                          egenPeakPoengRef.current = Math.max(egenPeakPoengRef.current, (ut.ramme.total ?? 0) + RIZZLER_BONUS)
                          egenPeakTidRef.current = naTid
                        }
                      }
                    }
                  } else if (finisherLadeStartRef.current !== null && naTid - sisteRizzlerSettRef.current > RIZZLER_GLIPP_MS) {
                    finisherLadeStartRef.current = null
                    finisherSmilPaRadRef.current = 0
                    setFinisherFremdrift(0)
                  }
                }
              } else if (!iLobby && !rizzlerAktivtVindu && rizzlerTippRef.current !== null) {
                rizzlerTippRef.current = null
              }

              const egenGull =
                egenFinisherStatusRef.current === "utlost" ||
                finisherLadeStartRef.current !== null ||
                (iLobby && lobbyRizzlerRef.current)

              // Show the golden chin/jawline target ring whenever the Rizzler window is open (or when practicing with a hand in lobby).
              const visRizzlerMal = rizzlerAktivtVindu || (iLobby && (rizzlerTippRef.current !== null || lobbyRizzlerRef.current))

              // Once the player begins the Rizzler, their base score stays locked for the rest of the round (leaving only +0.2 / -0.3).
              const poengErLast = maler && egenPoengLastRef.current

              if (egenOverlay) {
                if (visSporingRef.current || visRizzlerMal) {
                  tegnAnsiktSporing(egenOverlay, egenVideo, ut.punkter, {
                    speilet: true,
                    gyldig: ut.ramme.gyldig,
                    rizzlerGull: egenGull,
                    rizzlerMal: visRizzlerMal,
                    pekeTipp: visRizzlerMal ? rizzlerTippRef.current : null,
                    visGrunnlinjer: visSporingRef.current,
                  })
                } else {
                  tømSporingsLerret(egenOverlay)
                }
              }
              if (taOffisiell && !(poengErLast && gyldigeEgenRef.current >= MIN_GYLDIGE_RAMMER)) {
                egenRammerRef.current.push(ut.ramme)
                if (ut.lys) egenLysRef.current.push(ut.lys)
                if (ut.ramme.gyldig) {
                  gyldigeEgenRef.current += 1
                  setGyldigeEgen(gyldigeEgenRef.current)
                  const p = ut.ramme.total ?? 0
                  if (
                    egenPeakPoengRef.current < 0 ||
                    (p > egenPeakPoengRef.current + 0.05 && naTid - egenPeakTidRef.current >= PEAK_BILDE_INTERVALL_MS)
                  ) {
                    const bilde = fangVideoBilde(egenVideo, true)
                    if (bilde) {
                      egenPeakBildeRef.current = bilde
                      egenPeakPoengRef.current = p
                      egenPeakTidRef.current = naTid
                    }
                  }
                }
              }
              const forsteEgen = egenLiveRef.current.struktur === null
              if ((oppdaterHud || forsteEgen) && (!poengErLast || forsteEgen)) {
                setEgenVeiledning(ut.ramme.veiledning)
                const live = oppdaterLivePoeng(egenLiveRef.current, ut.ramme)
                if (live) setEgenLive(live)
              }
            }
          } catch {
            // Ignore single-frame inference hiccup.
          }
        } else if (egenOverlay) {
          tømSporingsLerret(egenOverlay)
        }

        const motSporer = motSporerRef.current
        const fjernVideo = fjernVideoRef.current
        const fjernRelay = fjernRelayLerretRef.current
        const motOverlay = motSporingLerretRef.current
        const brukerDirekte = !!fjernVideo && !!fjernVideo.srcObject
        const brukerRelay = !brukerDirekte && relayRammeNrRef.current > 0 && !!fjernRelay
        const fjernKilde = brukerDirekte ? fjernVideo : brukerRelay ? fjernRelay : null
        const nyRelayRamme = brukerRelay && relayRammeNrRef.current !== sisteAnalysertRelayNrRef.current
        const taMotOffisiell = maler && (brukerRelay ? nyRelayRamme : taOffisiell)
        const motPoengErLast = maler && motPoengLastRef.current

        if (!erSoloAktiv && taMotOffisiell && !motPeakBildeRef.current && fjernKilde) {
          const fallback = fangVideoBilde(fjernKilde, false)
          if (fallback) {
            motPeakBildeRef.current = fallback
            motPeakTidRef.current = naTid
          }
        }
        if (!erSoloAktiv && motSporer && fjernKilde && (!brukerRelay || nyRelayRamme)) {
          if (brukerRelay) sisteAnalysertRelayNrRef.current = relayRammeNrRef.current
          try {
            const ut = motSporer.analyser(fjernKilde, lerret, taMotOffisiell)
            if (ut) {
              if (motOverlay) {
                if (visSporingRef.current) {
                  tegnAnsiktSporing(motOverlay, fjernKilde, ut.punkter, {
                    speilet: false,
                    gyldig: ut.ramme.gyldig,
                    rizzlerGull: motFinisherStatusRef.current === "utlost" || motPoengLastRef.current,
                  })
                } else {
                  tømSporingsLerret(motOverlay)
                }
              }
              if (taMotOffisiell && !(motPoengErLast && gyldigeMotRef.current >= MIN_GYLDIGE_RAMMER)) {
                motRammerRef.current.push(ut.ramme)
                if (ut.lys) motLysRef.current.push(ut.lys)
                if (ut.ramme.gyldig) {
                  gyldigeMotRef.current += 1
                  setGyldigeMot(gyldigeMotRef.current)
                  const p = ut.ramme.total ?? 0
                  if (
                    motPeakPoengRef.current < 0 ||
                    (p > motPeakPoengRef.current + 0.05 && naTid - motPeakTidRef.current >= PEAK_BILDE_INTERVALL_MS)
                  ) {
                    const bilde = fangVideoBilde(fjernKilde, false)
                    if (bilde) {
                      motPeakBildeRef.current = bilde
                      motPeakPoengRef.current = p
                      motPeakTidRef.current = naTid
                    }
                  }
                }
              }
              const forsteMot = motLiveRef.current.struktur === null
              if ((oppdaterHud || forsteMot || brukerRelay) && (!motPoengErLast || forsteMot)) {
                const live = oppdaterLivePoeng(motLiveRef.current, ut.ramme)
                if (live) setMotLive(live)
              }
            }
          } catch {}
        } else if (!fjernKilde && motOverlay) {
          tømSporingsLerret(motOverlay)
        }

        const bruktMs = performance.now() - t0
        nesteAnalyseTid = naTid + Math.max(SPORING_MIN_INTERVALL_MS, bruktMs * 1.5)
      }

      rafId = window.requestAnimationFrame(steg)
    }

    rafId = window.requestAnimationFrame(steg)
    return () => {
      avbrutt = true
      window.cancelAnimationFrame(rafId)
    }
  }, [landmarkerKlar, aktivFase, visResultat, erSoloAktiv, status.runde, soloRunde])

  // ---- 15-second official measurement report ----
  const byggSpillerMaaling = useCallback((rammer: RammeResultat[], lys: LysAnalyse[], finisherBonus = 0): SpillerMaaling => {
    const samlet = aggregerRammer(rammer)
    const total = samlet.ok ? regnTotal(samlet.delpoeng, samlet.uttrykkBonus, finisherBonus) : 0
    return {
      ok: samlet.ok,
      total,
      delpoeng: samlet.delpoeng,
      uttrykkBonus: samlet.uttrykkBonus,
      ...(samlet.ok && finisherBonus !== 0 ? { finisherBonus } : {}),
      uttrykkSnitt: samlet.uttrykkSnitt,
      lysStatus: samleLysStatus(lys),
      kvalitet: samlet.kvalitet,
    }
  }, [])

  const lagRapport = useCallback((): MoggernRapport | null => {
    if (!meg) return null
    return {
      runde: status.runde,
      av: meg,
      egen: egenRammerRef.current.length
        ? byggSpillerMaaling(egenRammerRef.current, egenLysRef.current, egenFinisherBonusRef.current)
        : null,
      motstander: motRammerRef.current.length
        ? byggSpillerMaaling(motRammerRef.current, motLysRef.current, motFinisherBonusRef.current)
        : null,
    }
  }, [meg, status.runde, byggSpillerMaaling])

  // Finish Solo-test as soon as its 15 seconds finish (waiting briefly if a Rizzler Finisher is mid-charge).
  useEffect(() => {
    if (!erSoloAktiv || soloFase !== "maling" || gjenstarMs > 0 || rizzlerEkstraTidAktiv) return
    if (ferdigSoloRundeRef.current === soloRunde) return
    ferdigSoloRundeRef.current = soloRunde

    if (!egenPeakBildeRef.current && egenVideoRef.current) {
      egenPeakBildeRef.current = fangVideoBilde(egenVideoRef.current, true)
    }
    const maaling = byggSpillerMaaling(egenRammerRef.current, egenLysRef.current, egenFinisherBonusRef.current)
    setSoloMaaling(maaling)
    const id = meg ?? "solo"
    setPeakBilder({ [id]: egenPeakBildeRef.current })
    if (maaling.ok) {
      const lagret = lagreDagensBeste(maaling.total, "solo")
      setDagensBeste(lagret.verdi)
      setResultatRekord({ poeng: lagret.verdi.poeng, nyRekord: lagret.nyRekord })
    } else {
      setResultatRekord(null)
    }
    setSoloFase("resultat")
  }, [erSoloAktiv, soloFase, gjenstarMs, rizzlerEkstraTidAktiv, soloRunde, byggSpillerMaaling, meg])

  // Send 1v1 measurement report + ephemeral Peak Mog portrait once 15 s finish (waiting briefly if either player is mid-Rizzler).
  const venterPaMotRizzler =
    status.fase === "maling" &&
    gjenstarMs <= 0 &&
    motFinisherLader &&
    na < status.faseStartTid + MALING_MS + RIZZLER_EKSTRATID_MS
  useEffect(() => {
    if (status.fase !== "maling" || !meg || gjenstarMs > 0 || rizzlerEkstraTidAktiv || venterPaMotRizzler) return
    if (sendtRapportRundeRef.current === status.runde) return
    sendtRapportRundeRef.current = status.runde

    if (!egenPeakBildeRef.current && egenVideoRef.current) {
      egenPeakBildeRef.current = fangVideoBilde(egenVideoRef.current, true)
    }
    if (!motPeakBildeRef.current) {
      const fjernKilde = fjernVideoRef.current?.srcObject
        ? fjernVideoRef.current
        : relayRammeNrRef.current > 0
          ? fjernRelayLerretRef.current
          : null
      if (fjernKilde) {
        motPeakBildeRef.current = fangVideoBilde(fjernKilde, false)
      }
    }

    const rapport = lagRapport()
    if (!rapport) return
    settStatus((s) =>
      s.runde === rapport.runde && !s.rapporter[rapport.av] ? { ...s, rapporter: { ...s.rapporter, [rapport.av]: rapport } } : s,
    )
    send("rapport", rapport as unknown as Record<string, unknown>)

    const mittBilde = egenPeakBildeRef.current
    if (mittBilde && mittBilde.length <= 120_000) {
      send("bilde", { runde: status.runde, av: meg, dataUrl: mittBilde })
    }

    // Re-send once after 1 s in case the first broadcast raced with phase change.
    const reprise = window.setTimeout(() => {
      send("rapport", rapport as unknown as Record<string, unknown>)
      if (mittBilde && mittBilde.length <= 120_000) {
        send("bilde", { runde: status.runde, av: meg, dataUrl: mittBilde })
      }
    }, 1000)
    return () => window.clearTimeout(reprise)
  }, [status.fase, status.runde, meg, gjenstarMs, rizzlerEkstraTidAktiv, venterPaMotRizzler, lagRapport, settStatus, send])

  // Host transitions from "maling" to "resultat" once both reports are in (or after timeout) and updates room series tally.
  useEffect(() => {
    if (!erVert || status.fase !== "maling") return
    const alleHarSendt = status.deltakere.length === MOGGERN_MAKS_SPILLERE && status.deltakere.every((d) => !!status.rapporter[d.id])
    const utlopt = na >= status.faseStartTid + MALING_MS + RIZZLER_EKSTRATID_MS + 4000

    if (alleHarSendt || utlopt) {
      nyFase((s) => {
        if (s.fase !== "maling") return s
        const utfall = regnDuellUtfall(s.deltakere, s.rapporter)
        return { ...s, fase: "resultat", stilling: oppdaterStilling(s.stilling, utfall) }
      })
    }
  }, [erVert, status.fase, status.deltakere, status.rapporter, status.faseStartTid, na, nyFase])

  // Snapshot Peak Mog portraits and update daily best score when a 1v1 round finishes.
  useEffect(() => {
    if (status.fase !== "resultat" || !meg) return
    if (lagretRekordRundeRef.current === status.runde) return
    lagretRekordRundeRef.current = status.runde

    const motDeltaker = status.deltakere.find((d) => d.id !== meg)
    const sendtFraMot =
      motDeltaker && motSendtBildeRef.current?.runde === status.runde && motSendtBildeRef.current.av === motDeltaker.id
        ? motSendtBildeRef.current.dataUrl
        : null
    setPeakBilder((prev) => ({
      ...prev,
      [meg]: egenPeakBildeRef.current ?? prev[meg] ?? null,
      ...(motDeltaker ? { [motDeltaker.id]: sendtFraMot ?? prev[motDeltaker.id] ?? motPeakBildeRef.current ?? null } : {}),
    }))

    const utfall = regnDuellUtfall(status.deltakere, status.rapporter)
    const minRes = utfall.spillere.find((s) => s.deltaker.id === meg)
    if (minRes?.offisiell?.ok) {
      const lagret = lagreDagensBeste(minRes.offisiell.total, "duell")
      setDagensBeste(lagret.verdi)
      setResultatRekord({ poeng: lagret.verdi.poeng, nyRekord: lagret.nyRekord })
    } else {
      setResultatRekord(null)
    }
  }, [status.fase, status.runde, status.deltakere, status.rapporter, meg])

  // Ensure the opponent receives our Peak Mog portrait even if the maling->resultat transition cleared the first retry.
  useEffect(() => {
    if (status.fase !== "resultat" || !meg) return
    const mittBilde = egenPeakBildeRef.current
    if (!mittBilde || mittBilde.length > 120_000) return
    send("bilde", { runde: status.runde, av: meg, dataUrl: mittBilde })
    const reprise = window.setTimeout(() => {
      send("bilde", { runde: status.runde, av: meg, dataUrl: mittBilde })
    }, 700)
    return () => window.clearTimeout(reprise)
  }, [status.fase, status.runde, meg, send])

  // ---- Start duel / solo / rematch actions ----
  const motstanderKlar = !!motstander && motstander.klar && motstander.runde === status.runde
  const motstanderHarVideo = !!webrtc.fjernStrom || relayAktiv || motstanderKameraPa
  const kanStarteDuell =
    erVert &&
    status.fase === "lobby" &&
    aktiveSpillere.length === MOGGERN_MAKS_SPILLERE &&
    !!lokalStrom &&
    landmarkerKlar &&
    motstanderHarVideo &&
    motstanderKlar

  const startDuell = useCallback(() => {
    if (!kanStarteDuell) return
    const deltakere = velgMoggernDeltakere(aktiveSpillere)
    if (deltakere.length !== MOGGERN_MAKS_SPILLERE) return
    setSoloFase(null)
    setPeakBilder({})
    setResultatRekord(null)
    lyder.velg()
    nyFase((s) => ({
      ...s,
      fase: "nedtelling",
      deltakere,
      faseStartTid: serverNa(),
      rapporter: {},
    }))
  }, [kanStarteDuell, aktiveSpillere, nyFase])

  const startSoloTest = useCallback(() => {
    if (!lokalStrom || !landmarkerKlar || status.fase !== "lobby") return
    lyder.velg()
    setSoloMaaling(null)
    setPeakBilder({})
    setResultatRekord(null)
    setSoloStartTid(serverNa())
    setSoloRunde((r) => r + 1)
    setSoloFase("nedtelling")
  }, [lokalStrom, landmarkerKlar, status.fase])

  const kopierLenke = useCallback(async () => {
    const lenke = typeof window !== "undefined" ? window.location.href : ""
    try {
      if (navigator.share && matchMedia("(pointer: coarse)").matches) {
        await navigator.share({
          title: "Moggern · thodh.com",
          text: sprakRef.current === "en" ? `Join my Moggern duel (${kode})!` : `Bli med i Moggern-duell (${kode})!`,
          url: lenke,
        })
        return
      }
      await navigator.clipboard.writeText(lenke)
      setKopiert(true)
      window.setTimeout(() => setKopiert(false), 1800)
    } catch {}
  }, [kode])

  const soloResultat = useMemo<SpillerSluttResultat | null>(() => {
    if (!erSoloAktiv || !soloMaaling) return null
    return {
      deltaker: { id: meg ?? "solo", navn: mittNavn || (en ? "You" : "Deg"), farge: 0 },
      offisiell: soloMaaling,
      kilde: soloMaaling.ok ? "egen" : "ingen",
      egenMaaling: soloMaaling,
      motstanderMaaling: null,
      stortAvvik: false,
      avvik: 0,
    }
  }, [erSoloAktiv, soloMaaling, meg, mittNavn, en])

  const romStillingTekst = useMemo(() => {
    const par = status.deltakere.length === 2 ? status.deltakere : aktiveSpillere.length === 2 ? aktiveSpillere : null
    if (!par) return null
    const a = status.stilling[par[0].id] ?? 0
    const b = status.stilling[par[1].id] ?? 0
    if (a + b === 0) return null
    const p1 = par[0].navn || (en ? "Player 1" : "Spiller 1")
    const p2 = par[1].navn || (en ? "Player 2" : "Spiller 2")
    return `${p1} ${a} – ${b} ${p2}`
  }, [status.deltakere, status.stilling, aktiveSpillere, en])

  if (erFullt) {
    return (
      <div className="mx-auto flex w-full max-w-xl flex-col gap-4">
        <section className={`${MFLATE} p-6 text-center sm:p-8`}>
          <p className="text-xs font-medium text-rose-300">
            {en ? `Room ${kode} is full` : `Rom ${kode} er fullt`}
          </p>
          <h2 className="mt-2 text-[1.6rem] font-semibold tracking-[-0.03em] text-neutral-950">
            {t("Maks 2 spillere per duell", "Max 2 players per duel")}
          </h2>
          <p className="mt-3 text-[15px] leading-6 text-neutral-700">
            {t(
              "Det er allerede to venner i dette rommet. Lag ditt eget rom for å starte en ny 1v1-duell.",
              "There are already two friends in this room. Create your own room to start a new 1v1 duel.",
            )}
          </p>
          <div className="mt-6 flex justify-center gap-2.5">
            <button type="button" onClick={() => router.push(`/spill/moggern/${lagKode()}`)} className={MKNAPP}>
              {t("Lag nytt rom", "Create new room")}
            </button>
            <Link href="/spill/moggern" className={MKNAPP_SEKUNDAR}>
              {t("Tilbake", "Back")}
            </Link>
          </div>
        </section>
      </div>
    )
  }

  const nedtellingTall = Math.max(1, Math.min(3, Math.ceil(gjenstarMs / 1000)))
  const maalingSek = en ? (gjenstarMs / 1000).toFixed(1) : (gjenstarMs / 1000).toFixed(1).replace(".", ",")
  const maalingFremdrift = Math.min(100, Math.max(0, ((MALING_MS - gjenstarMs) / MALING_MS) * 100))
  const motNavn = motstander?.navn || t("Motstanderen", "Opponent")

  // Live tug-of-war lead during 1v1 measurement
  const harTautrekking = !erSoloAktiv && aktivFase === "maling" && !!egenLive && !!motLive
  const liveDiff = harTautrekking ? egenLive.total - motLive.total : 0
  const egenLeder = harTautrekking && liveDiff >= 0.1
  const motLeder = harTautrekking && liveDiff <= -0.1
  const egenTautrekkingAndel = harTautrekking ? Math.max(12, Math.min(88, Math.round(50 + liveDiff * 14))) : 50

  const lobbyHint = !lokalStrom
    ? t("Slå på kameraet ditt for å gjøre deg klar.", "Turn on your camera to get ready.")
    : !motstander
      ? t(
          "Del lenken eller koden med én venn — eller prøv en 15 s solo-test mens du venter.",
          "Share the link or code with a friend — or try a 15 s solo test while you wait.",
        )
      : !motstanderHarVideo
        ? en
          ? `Waiting for ${motNavn} to turn on their camera.`
          : `Venter på at ${motNavn} slår på kameraet.`
        : !motstanderKlar
          ? en
            ? `Waiting for ${motNavn} to press “Ready”.`
            : `Venter på at ${motNavn} trykker «Klar».`
          : t(
              "Begge er klare — trykk Start for 3-2-1 og 15 sekunders måling!",
              "Both ready — press Start for 3-2-1 and a 15-second scan!",
            )

  const gjesteHint = !lokalStrom
    ? t("Slå på kameraet ditt og trykk «Klar til duell».", "Turn on your camera and press “Ready to duel”.")
    : klar
      ? en
        ? `You’re ready! Waiting for ${motstander?.navn || "the host"} to start.`
        : `Du er klar! Venter på at ${motstander?.navn || "verten"} starter.`
      : t(
          "Trykk «Klar» når du sitter i godt lys og ser rett i kameraet.",
          "Press “Ready” when you’re in good lighting looking straight at the camera.",
        )

  return (
    <div className="flex w-full min-w-0 flex-col gap-2">
      {/* Hidden audio element for optional remote P2P microphone audio */}
      <audio ref={fjernLydRef} autoPlay playsInline className="hidden" />

      {/* Compact room bar: code, invite link, connection, series score, daily best & always-reachable leave/block */}
      <div className="flex w-full min-w-0 flex-wrap items-center justify-between gap-2">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <span className="inline-flex h-9 items-center gap-2 rounded-full border border-white/[0.07] bg-[var(--spill-flate)] pr-1 pl-3.5">
            <span className="text-[11px] font-medium text-neutral-500">{t("Rom", "Room")}</span>
            <span className="text-[15px] font-semibold tracking-[0.18em] text-neutral-950 tabular-nums">{kode}</span>
            <button
              type="button"
              onClick={kopierLenke}
              aria-label={t("Kopier invitasjonslenke", "Copy invite link")}
              className="inline-flex h-7 items-center gap-1 rounded-full bg-white/[0.06] px-2.5 text-[11px] font-medium text-neutral-800 transition hover:bg-white/[0.12]"
            >
              {kopiert ? <Check className="h-3.5 w-3.5 text-lime-400" /> : <Copy className="h-3.5 w-3.5" />}
              <span className="max-sm:sr-only">{kopiert ? t("Kopiert!", "Copied!") : t("Kopier lenke", "Copy link")}</span>
            </button>
          </span>
          <span className="inline-flex h-9 items-center gap-1.5 rounded-full border border-white/[0.07] bg-[var(--spill-flate)] px-3 text-[11px] font-medium text-neutral-600 tabular-nums">
            {tilkobling === "klar" ? (
              <>
                <Wifi className="h-3.5 w-3.5 text-emerald-400" aria-hidden="true" />
                {aktiveSpillere.length}/2
              </>
            ) : tilkobling === "feil" ? (
              <>
                <WifiOff className="h-3.5 w-3.5 text-rose-400" aria-hidden="true" />
                {t("Feil", "Error")}
              </>
            ) : (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin text-neutral-500" aria-hidden="true" />
                {t("Kobler …", "Connecting …")}
              </>
            )}
          </span>
          {romStillingTekst ? (
            <span className="inline-flex h-9 max-w-full items-center gap-1.5 rounded-full border border-lime-300/20 bg-lime-300/[0.08] px-3 text-[11px] font-semibold text-lime-200 tabular-nums">
              <span className="truncate">{romStillingTekst}</span>
            </span>
          ) : null}
          {dagensBeste ? (
            <span
              className="hidden h-9 items-center gap-1.5 rounded-full border border-white/[0.07] bg-[var(--spill-flate)] px-3 text-[11px] font-medium text-neutral-600 tabular-nums sm:inline-flex"
              title={t("Din beste score på denne enheten i dag", "Your best score on this device today")}
            >
              <Trophy className="h-3.5 w-3.5 text-lime-300" aria-hidden="true" />
              {t("I dag:", "Today:")}{" "}
              <strong className="text-neutral-950">{formaterMoggernPoeng(dagensBeste.poeng, sprak)}</strong>
            </span>
          ) : null}
        </div>

        <button
          type="button"
          onClick={blokkerOgForlat}
          className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full border border-rose-400/25 bg-rose-500/10 px-3.5 text-xs font-semibold text-rose-300 transition hover:bg-rose-500/20"
        >
          <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
          {t("Forlat / rage quit", "Leave / rage quit")}
        </button>
      </div>

      {forlattVarsel ? (
        <div role="status" className="w-full rounded-2xl border border-amber-400/25 bg-amber-400/10 px-4 py-2.5 text-xs text-amber-100">
          {forlattVarsel}
        </div>
      ) : null}

      {mikFeil ? (
        <div role="status" className="w-full rounded-2xl border border-amber-400/25 bg-amber-400/10 px-4 py-2 text-xs text-amber-100">
          {mikFeil}
        </div>
      ) : null}

      {/* Result reveal screen (both 1v1 and Solo-test) */}
      {visResultat ? (
        <div className="mx-auto w-full min-w-0 max-w-4xl pt-2">
          <MoggernResultat
            kode={kode}
            runde={erSoloAktiv ? soloRunde : status.runde}
            deltakere={status.deltakere}
            rapporter={status.rapporter}
            meg={meg}
            erVert={erVert}
            solo={erSoloAktiv}
            soloResultat={soloResultat}
            bilder={peakBilder}
            stilling={status.stilling}
            dagensBeste={resultatRekord}
            onTilbakeTilRom={erSoloAktiv ? () => setSoloFase(null) : undefined}
            onOmkamp={() => {
              if (erSoloAktiv) {
                startSoloTest()
                return
              }
              lyder.velg()
              settKlar(false)
              setPeakBilder({})
              setResultatRekord(null)
              nyFase((s) => moggernStart(s.runde + 1, s.stilling))
            }}
          />
        </div>
      ) : null}

      {/* Stage: edge-to-edge full-viewport in lobby, and true 100vw × 100dvh fullscreen during countdown & duel/solo. */}
      <section
        aria-label={t("Kameraduell", "Camera duel")}
        className={visResultat ? "hidden" : iDuell ? "fixed inset-0 z-50 bg-[#0d0e10] p-0" : "w-full"}
      >
        <div
          className={
            erSoloAktiv && iDuell
              ? "relative grid h-full w-full grid-cols-1"
              : iDuell
                ? "relative grid h-full w-full grid-rows-2 gap-[2px] md:grid-cols-2 md:grid-rows-1"
                : "relative grid h-[calc(100dvh-6.25rem)] min-h-[34rem] w-full grid-rows-2 gap-1.5 md:grid-cols-2 md:grid-rows-1 md:gap-2"
          }
        >
          {/* ---- Own camera tile ---- */}
          <div
            className={`relative min-h-0 overflow-hidden bg-[#0d0e10] transition-shadow duration-300 ${
              iDuell ? "rounded-none border-0" : "rounded-[22px] border border-white/[0.07]"
            } ${
              egenFinisherStatus === "utlost" || finisherFremdrift > 0
                ? "ring-2 ring-inset ring-amber-300/90 shadow-[inset_0_0_64px_rgb(250_204_21/0.28)]"
                : egenLeder
                  ? "ring-2 ring-inset ring-lime-300/80 shadow-[inset_0_0_48px_rgb(190_242_100/0.16)]"
                  : ""
            }`}
          >
            <video
              ref={egenVideoRef}
              autoPlay
              playsInline
              muted
              className={`absolute inset-0 h-full w-full -scale-x-100 object-cover transition-opacity duration-500 ${lokalStrom ? "opacity-100" : "opacity-0"}`}
            />
            <canvas
              ref={egenSporingLerretRef}
              aria-hidden="true"
              className={`pointer-events-none absolute inset-0 h-full w-full transition-opacity duration-300 ${
                lokalStrom && (visSporing || kanBrukeFinisher || finisherFremdrift > 0 || (status.fase === "lobby" && !iDuell && lobbyRizzler))
                  ? "opacity-100"
                  : "opacity-0"
              }`}
            />

            {!lokalStrom ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/[0.06] text-white/60">
                  {starterKamera ? <Loader2 className="h-5 w-5 animate-spin" /> : <CameraOff className="h-5 w-5" aria-hidden="true" />}
                </span>
                <p className="text-[15px] font-medium text-white">
                  {starterKamera ? t("Starter kameraet …", "Starting camera …") : t("Kameraet ditt er av", "Your camera is off")}
                </p>
                {!starterKamera ? (
                  <button type="button" onClick={() => void skruPaKamera()} className={MKNAPP}>
                    <Camera className="h-4 w-4" />
                    {t("Slå på kamera", "Turn on camera")}
                  </button>
                ) : (
                  <p className="max-w-xs text-xs leading-5 text-white/50">
                    {t("Svar «Tillat» hvis nettleseren spør om kameraet.", "Click “Allow” if your browser asks for camera access.")}
                  </p>
                )}
                {kameraFeil ? <p className="max-w-sm text-xs leading-5 text-rose-300">{kameraFeil}</p> : null}
                <p className="max-w-xs text-[11px] leading-4 text-white/35">
                  {t("Videoen går bare direkte til vennen din. Ingenting lagres.", "Video goes directly to your friend. Nothing is stored.")}
                </p>
              </div>
            ) : null}

            {/* Soft edge gradients keep HUD text readable without boxing the face */}
            <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-[#0d0e10]/55 to-transparent" />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-[#0d0e10]/70 to-transparent" />

            {/* Top HUD: editable name pill · live rating */}
            <div className="absolute inset-x-2.5 top-2.5 flex items-start justify-between gap-2 sm:inset-x-3.5 sm:top-3.5">
              <VisningsnavnPille
                navn={mittNavn}
                onEndret={setMittNavn}
                kunLokal={!bruker}
                etikett={t("(deg)", "(you)")}
                ikon={
                  erVert ? (
                    <Crown className="h-3.5 w-3.5 shrink-0 text-amber-300" aria-label={t("Vert", "Host")} />
                  ) : bruker ? (
                    <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-emerald-400" aria-hidden="true" />
                  ) : (
                    <User className="h-3.5 w-3.5 shrink-0 text-white/60" aria-hidden="true" />
                  )
                }
                className="max-w-[55%]"
              />
              <div className="flex flex-col items-end gap-1.5">
                <LiveRating live={egenLive} modell={modell} aktiv={!!lokalStrom && modell !== "feil"} />
                {aktivFase === "maling" && egenFinisherStatus === "utlost" ? (
                  <span className="mel-pop inline-flex h-7 items-center gap-1 rounded-full bg-amber-300 px-2.5 text-[11px] font-bold text-[#18191b] shadow-[0_0_20px_rgb(250_204_21/0.55)] tabular-nums">
                    🤫 Rizzler {formaterBonus(RIZZLER_BONUS, sprak)} · {t("låst", "locked")}
                  </span>
                ) : aktivFase === "maling" && egenFinisherStatus === "feilet" ? (
                  <span className="mel-pop inline-flex h-7 items-center gap-1 rounded-full bg-rose-500/90 px-2.5 text-[11px] font-bold text-white tabular-nums">
                    😂 Rizz failed {formaterBonus(RIZZLER_FEIL_STRAFF, sprak)}
                  </span>
                ) : aktivFase === "maling" && egenPoengLast ? (
                  <span className="mel-pop inline-flex h-7 items-center gap-1 rounded-full border border-amber-300/50 bg-[#111214]/85 px-2.5 text-[11px] font-semibold text-amber-200 backdrop-blur-md">
                    <Lock className="h-3 w-3 shrink-0 text-amber-300" aria-hidden="true" />
                    {t("Poeng låst", "Score locked")}
                  </span>
                ) : null}
                {modell === "feil" && lokalStrom ? (
                  <button
                    type="button"
                    onClick={lastModell}
                    className={`${GLASS} inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-[11px] font-medium text-amber-200 hover:bg-[#111214]/85`}
                  >
                    <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
                    {t("Ansiktsmodellen feilet · prøv igjen", "Face model failed · retry")}
                  </button>
                ) : null}
              </div>
            </div>

            {/* Bottom HUD: Rizzler prompt/charge, mog-uttrykk pills, pose guidance, controls & duel/solo buttons */}
            <div className="absolute inset-x-2.5 bottom-2.5 flex flex-col gap-2 sm:inset-x-3.5 sm:bottom-3.5">
              {lokalStrom && !iDuell && status.fase === "lobby" && lobbyRizzler ? (
                <span className="mel-pop inline-flex h-7 self-start items-center gap-1.5 rounded-full bg-amber-300/95 px-3 text-[11px] font-bold text-[#18191b] shadow-[0_0_24px_rgb(250_204_21/0.45)]">
                  {t("🤫 Rizzler-pose treffer! (Klar ved 13 s)", "🤫 Rizzler pose detected! (Unlocks at 13 s)")}
                </span>
              ) : null}
              {lokalStrom && iFinisherForvarsel ? (
                <span className="mel-pop inline-flex h-7 self-start items-center gap-1.5 rounded-full border border-amber-300/40 bg-[#111214]/85 px-3 text-[11px] font-semibold text-amber-200 backdrop-blur-md tabular-nums">
                  {en
                    ? `🤫 Rizzler in ${Math.max(1, Math.ceil((gjenstarMs - RIZZLER_VINDU_MS) / 1000))} s — get your index finger ready`
                    : `🤫 Rizzler om ${Math.max(1, Math.ceil((gjenstarMs - RIZZLER_VINDU_MS) / 1000))} s — pekefinger klar`}
                </span>
              ) : null}
              {lokalStrom && aktivFase === "maling" && egenFinisherStatus === "inaktiv" && (kanBrukeFinisher || finisherFremdrift > 0) ? (
                <div className="mel-pop flex max-w-xs flex-col gap-1.5 self-start rounded-2xl border border-amber-300/50 bg-[#111214]/88 px-3 py-2 text-amber-200 shadow-[0_0_28px_rgb(250_204_21/0.35)] backdrop-blur-md">
                  <p className="text-[11px] leading-4 font-bold tracking-tight text-amber-300">
                    {finisherFremdrift > 0
                      ? t("🤫 Lader Rizzler … IKKE SMIL!", "🤫 Charging Rizzler … DON’T SMILE!")
                      : rizzlerPoseStatus === "aapen-hand"
                        ? t("☝️ Knytt de andre fingrene — kun pekefinger!", "☝️ Curl your other fingers — index finger only!")
                        : rizzlerPoseStatus === "for-langt-unna"
                          ? t("👉 Flytt pekefingeren til gullringen på haka!", "👉 Move your index finger to the gold chin ring!")
                          : t("🤫 RIZZLER KLAR — pek på gullringen på haka!", "🤫 RIZZLER READY — point to the gold chin ring!")}
                  </p>
                  <p className="text-[10px] leading-3.5 text-white/70">
                    {finisherFremdrift > 0
                      ? en
                        ? `Score locked 🔒 — hold steady for ${formaterBonus(RIZZLER_BONUS, "en")} boost`
                        : `Poeng låst 🔒 — hold rolig for ${formaterBonus(RIZZLER_BONUS)} boost`
                      : en
                        ? `Curl fingers, 1 index finger on chin/lips · locks score + chance for ${formaterBonus(RIZZLER_BONUS, "en")}`
                        : `Knytt hånda, 1 pekefinger på haka/leppa · låser poeng + sjanse på ${formaterBonus(RIZZLER_BONUS)}`}
                  </p>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/15">
                    <div
                      className="h-full rounded-full bg-amber-300 transition-[width] duration-100"
                      style={{ width: `${Math.max(finisherFremdrift > 0 ? 8 : 0, Math.round(finisherFremdrift * 100))}%` }}
                    />
                  </div>
                </div>
              ) : null}
              {lokalStrom ? <UttrykkPiller styrker={egenLive?.styrker ?? null} /> : null}
              {lokalStrom && egenVeiledning && egenVeiledning !== "ok" ? (
                <p className={`${GLASS} self-start rounded-full px-3 py-1.5 text-[11px] font-medium text-amber-100`}>
                  {VEILEDNING_TEKST[egenVeiledning][sprak]}
                </p>
              ) : null}
              {lokalStrom ? (
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={skruAvKamera}
                      title={t("Skru av kamera", "Turn off camera")}
                      className={`${GLASS} inline-flex h-9 items-center gap-1.5 rounded-full px-3 text-xs font-medium hover:bg-[#111214]/85`}
                    >
                      <CameraOff className="h-3.5 w-3.5" aria-hidden="true" />
                      <span className="max-md:sr-only">{t("Skru av", "Cam off")}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => void toggleMikrofon()}
                      disabled={starterMik}
                      aria-pressed={!!lydStrom}
                      title={lydStrom ? t("Skru av mikrofon", "Mute microphone") : t("Slå på mikrofon (valgfritt)", "Enable microphone (optional)")}
                      className={`${GLASS} inline-flex h-9 items-center gap-1.5 rounded-full px-3 text-xs font-medium hover:bg-[#111214]/85 ${
                        lydStrom ? "border-lime-300/40 text-lime-300" : "text-white/70"
                      }`}
                    >
                      {starterMik ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                      ) : lydStrom ? (
                        <Mic className="h-3.5 w-3.5" aria-hidden="true" />
                      ) : (
                        <MicOff className="h-3.5 w-3.5" aria-hidden="true" />
                      )}
                      <span className="max-lg:sr-only">{lydStrom ? t("Mik på", "Mic on") : t("Mik av", "Mic off")}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setVisSporing((v) => !v)}
                      aria-pressed={visSporing}
                      title={visSporing ? t("Skjul grønne sporingslinjer", "Hide green tracking lines") : t("Vis grønne sporingslinjer", "Show green tracking lines")}
                      className={`${GLASS} inline-flex h-9 items-center gap-1.5 rounded-full px-3 text-xs font-medium hover:bg-[#111214]/85 ${
                        visSporing ? "border-emerald-400/35 text-emerald-300" : "text-white/70"
                      }`}
                    >
                      <ScanFace className="h-3.5 w-3.5" aria-hidden="true" />
                      <span className="max-lg:sr-only">{t("Sporing", "Tracking")}</span>
                    </button>
                  </div>

                  {!iDuell && status.fase === "lobby" ? (
                    <div className="flex items-center gap-1.5">
                      {landmarkerKlar ? (
                        <button
                          type="button"
                          onClick={startSoloTest}
                          title={t("Kjør en 15 sekunders solo-test uten motstander", "Run a 15-second solo test without an opponent")}
                          className={`${GLASS} inline-flex h-9 items-center gap-1.5 rounded-full px-3.5 text-xs font-semibold text-lime-200 transition hover:bg-[#111214]/85 active:scale-[0.98]`}
                        >
                          <Sparkles className="h-3.5 w-3.5 text-lime-300" aria-hidden="true" />
                          {t("Solo-test (15 s)", "Solo test (15 s)")}
                        </button>
                      ) : null}
                      {!erVert && landmarkerKlar ? (
                        <button
                          type="button"
                          onClick={() => {
                            lyder.velg()
                            settKlar(!klar)
                          }}
                          aria-pressed={klar}
                          className={`inline-flex h-9 items-center gap-1.5 rounded-full px-4 text-xs font-semibold transition active:scale-[0.98] ${
                            klar ? "bg-emerald-400 text-[#18191b] hover:bg-emerald-300" : "bg-[#f4f4f5] text-[#18191b] hover:bg-white"
                          }`}
                        >
                          <UserCheck className="h-3.5 w-3.5" aria-hidden="true" />
                          {klar ? t("Klar ✓", "Ready ✓") : t("Klar til duell", "Ready to duel")}
                        </button>
                      ) : null}
                      {erVert ? (
                        <button
                          type="button"
                          onClick={startDuell}
                          disabled={!kanStarteDuell}
                          title={kanStarteDuell ? undefined : lobbyHint}
                          className="inline-flex h-9 items-center gap-1.5 rounded-full bg-[#f4f4f5] px-4 text-xs font-semibold text-[#18191b] transition hover:bg-white active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          <Play className="h-3.5 w-3.5" aria-hidden="true" />
                          {t("Start duell (15 s)", "Start duel (15 s)")}
                        </button>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>
          </div>

          {/* ---- Opponent tile (hidden during fullscreen Solo-test) ---- */}
          <div
            className={`relative min-h-0 overflow-hidden bg-[#0d0e10] transition-shadow duration-300 ${
              erSoloAktiv && iDuell ? "hidden" : ""
            } ${iDuell ? "rounded-none border-0" : "rounded-[22px] border border-white/[0.07]"} ${
              motLeder ? "ring-2 ring-inset ring-lime-300/80 shadow-[inset_0_0_48px_rgb(190_242_100/0.16)]" : ""
            }`}
          >
            <video
              ref={fjernVideoRef}
              autoPlay
              playsInline
              muted
              onLoadedMetadata={(e) => {
                if (e.currentTarget.paused) void e.currentTarget.play().catch(() => {})
              }}
              onCanPlay={(e) => {
                if (e.currentTarget.paused) void e.currentTarget.play().catch(() => {})
              }}
              className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-500 ${webrtc.fjernStrom ? "opacity-100" : "opacity-0"}`}
            />
            <canvas
              ref={fjernRelayLerretRef}
              aria-label={motstander ? (en ? `Live video from ${motNavn}` : `Direktebilde fra ${motNavn}`) : undefined}
              className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-300 ${!webrtc.fjernStrom && relayAktiv ? "opacity-100" : "opacity-0"}`}
            />
            <canvas
              ref={motSporingLerretRef}
              aria-hidden="true"
              className={`pointer-events-none absolute inset-0 h-full w-full transition-opacity duration-300 ${harMotVideoVisning && visSporing ? "opacity-100" : "opacity-0"}`}
            />

            {!harMotVideoVisning ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/[0.06] text-white/60">
                  {motstander ? <Loader2 className="h-5 w-5 animate-spin" /> : <Camera className="h-5 w-5" aria-hidden="true" />}
                </span>
                <p className="text-[15px] font-medium text-white">
                  {!motstander
                    ? t("Venter på motstander …", "Waiting for opponent …")
                    : motstanderKameraPa
                      ? en
                        ? `Connecting video to ${motNavn} …`
                        : `Kobler video til ${motNavn} …`
                      : en
                        ? `${motNavn} has their camera off`
                        : `${motNavn} har kameraet av`}
                </p>
                {!motstander ? (
                  <>
                    <p className="text-[2.4rem] leading-none font-semibold tracking-[0.22em] text-white tabular-nums">{kode}</p>
                    <button type="button" onClick={kopierLenke} className={MKNAPP_SEKUNDAR}>
                      {kopiert ? <Check className="h-4 w-4 text-lime-400" /> : <Copy className="h-4 w-4" />}
                      {kopiert ? t("Kopiert!", "Copied!") : t("Kopier invitasjonslenke", "Copy invite link")}
                    </button>
                  </>
                ) : null}
                <p className="max-w-xs text-xs leading-5 text-white/45">
                  {!motstander
                    ? t("Send romkoden eller lenken til én venn.", "Send the room code or link to a friend.")
                    : t(
                        "Kobler over Wi-Fi eller 5G — bytter automatisk til mobil-relay ved behov.",
                        "Connecting over Wi-Fi or 5G — switches automatically to mobile relay if needed.",
                      )}
                </p>
              </div>
            ) : null}

            <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-[#0d0e10]/55 to-transparent" />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-[#0d0e10]/70 to-transparent" />

            <div className="absolute inset-x-2.5 top-2.5 flex items-start justify-between gap-2 sm:inset-x-3.5 sm:top-3.5">
              <span className={`${GLASS} inline-flex h-8 max-w-[55%] items-center gap-1.5 rounded-full px-3 text-xs font-medium`}>
                {motstander && !erVert ? <Crown className="h-3.5 w-3.5 shrink-0 text-amber-300" aria-label={t("Vert", "Host")} /> : null}
                <span className="truncate">{motstander ? motNavn : t("Ledig plass", "Open slot")}</span>
                {motstander && !webrtc.fjernStrom && relayAktiv ? (
                  <span className="shrink-0 rounded-full bg-cyan-400/20 px-1.5 py-0.5 text-[9px] font-semibold tracking-wide text-cyan-200">
                    5G/Relay
                  </span>
                ) : null}
                {motstander ? (
                  <span
                    aria-label={
                      webrtc.status === "tilkoblet" || relayAktiv
                        ? t("Video tilkoblet", "Video connected")
                        : webrtc.status === "feil"
                          ? t("Videofeil", "Video error")
                          : t("Kobler video", "Connecting video")
                    }
                    className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                      webrtc.status === "tilkoblet" || relayAktiv
                        ? "bg-emerald-400"
                        : webrtc.status === "feil"
                          ? "bg-rose-400"
                          : "bg-amber-300"
                    }`}
                  />
                ) : null}
              </span>
              <LiveRating live={motLive} modell={modell} aktiv={harMotVideoVisning && modell !== "feil"} />
            </div>

            <div className="absolute inset-x-2.5 bottom-2.5 flex flex-col gap-2 sm:inset-x-3.5 sm:bottom-3.5">
              {harMotVideoVisning ? <UttrykkPiller styrker={motLive?.styrker ?? null} /> : null}
              {motstander ? (
                <div className="flex flex-wrap items-center justify-between gap-2">
                  {status.fase === "lobby" ? (
                    <span className={`${GLASS} rounded-full px-3 py-1.5 text-[11px] font-medium text-white/80`}>
                      {motstanderKlar
                        ? en
                          ? `${motNavn} is ready ✓`
                          : `${motNavn} er klar ✓`
                        : erVert
                          ? en
                            ? `Waiting for ${motNavn} to ready up`
                            : `Venter på at ${motNavn} blir klar`
                          : en
                            ? `${motNavn} starts the duel`
                            : `${motNavn} starter duellen`}
                    </span>
                  ) : (
                    <span />
                  )}
                  <div className="flex items-center gap-1.5">
                    {lydBlokkert && webrtc.fjernLydStrom ? (
                      <button
                        type="button"
                        onClick={() => {
                          void fjernLydRef.current
                            ?.play()
                            .then(() => setLydBlokkert(false))
                            .catch(() => {})
                        }}
                        className={`${GLASS} inline-flex h-8 items-center gap-1.5 rounded-full border-lime-300/35 px-3 text-[11px] font-medium text-lime-200 hover:bg-[#111214]/85`}
                      >
                        <Volume2 className="h-3.5 w-3.5" aria-hidden="true" />
                        {t("Slå på lyd", "Unmute audio")}
                      </button>
                    ) : null}
                    {!harMotVideoVisning && (webrtc.status === "feil" || motstanderKameraPa) ? (
                      <button
                        type="button"
                        onClick={webrtc.koblePaaNytt}
                        className={`${GLASS} inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-[11px] font-medium hover:bg-[#111214]/85`}
                      >
                        <RefreshCw className="h-3.5 w-3.5" />
                        {t("Koble til på nytt", "Reconnect")}
                      </button>
                    ) : null}
                  </div>
                </div>
              ) : null}
              {webrtc.feil && !relayAktiv && motstander ? (
                <p className={`${GLASS} rounded-2xl px-3 py-2 text-[11px] leading-4 text-rose-200`}>{webrtc.feil}</p>
              ) : null}
            </div>
          </div>

          {/* ---- Duel / Solo overlays spanning the stage ---- */}
          {iDuell ? (
            <button
              type="button"
              onClick={erSoloAktiv ? () => setSoloFase(null) : blokkerOgForlat}
              className={`${GLASS} absolute right-3 bottom-3 z-10 inline-flex h-9 items-center gap-1.5 rounded-full border-rose-400/30 px-3 text-xs font-semibold text-rose-200 transition hover:bg-rose-500/30`}
            >
              <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
              {erSoloAktiv ? t("Avbryt", "Cancel") : "Rage quit"}
            </button>
          ) : null}

          {aktivFase === "nedtelling" ? (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <div className={`${GLASS} flex flex-col items-center rounded-[32px] px-8 py-5 shadow-[0_24px_64px_rgb(0_0_0/0.45)]`}>
                <p className="text-xs font-medium text-white/70">
                  {erSoloAktiv
                    ? t("Solo-test · Se rett inn i kameraet", "Solo test · Look straight at the camera")
                    : t("Se rett inn i kameraet", "Look straight at the camera")}
                </p>
                <p key={nedtellingTall} className="mel-pop text-[5.5rem] leading-none font-semibold tracking-[-0.05em] text-lime-300 tabular-nums">
                  {nedtellingTall}
                </p>
              </div>
            </div>
          ) : null}

          {aktivFase === "maling" ? (
            <div className="pointer-events-none absolute inset-x-0 top-0 flex justify-center px-3 pt-14 sm:pt-3">
              <div className={`${GLASS} flex w-full max-w-sm flex-col gap-2 rounded-[20px] px-3.5 py-2.5 shadow-[0_12px_32px_rgb(0_0_0/0.35)]`}>
                <div className="flex items-center justify-between gap-3 text-xs font-medium">
                  <span>
                    {gjenstarMs > 0
                      ? erSoloAktiv
                        ? t("Solo-måling — hold blikket!", "Solo scan — hold your gaze!")
                        : t("Måler — hold blikket!", "Scanning — hold your gaze!")
                      : t("Beregner resultat …", "Calculating result …")}
                  </span>
                  <span className="text-sm font-semibold text-lime-300 tabular-nums">{maalingSek} s</span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/15">
                  <div className="h-full rounded-full bg-lime-300 transition-[width] duration-100" style={{ width: `${maalingFremdrift}%` }} />
                </div>

                {/* Live Tug-of-War Mog-bar during 1v1 measurement */}
                {harTautrekking ? (
                  <div className="space-y-1 pt-0.5">
                    <div className="flex items-center justify-between text-[11px] font-semibold tabular-nums">
                      <span className={egenLeder ? "text-lime-300" : "text-white/75"}>
                        {mittNavn || t("Deg", "You")}: {formaterMoggernPoeng(egenLive.total, sprak)}
                      </span>
                      <span className={motLeder ? "text-lime-300" : "text-white/75"}>
                        {motNavn}: {formaterMoggernPoeng(motLive.total, sprak)}
                      </span>
                    </div>
                    <div className="relative flex h-2 w-full overflow-hidden rounded-full bg-white/10">
                      <div
                        className="h-full bg-lime-300 transition-[width] duration-200"
                        style={{ width: `${egenTautrekkingAndel}%` }}
                      />
                      <div className="h-full flex-1 bg-cyan-400/85" />
                      <span className="absolute top-0 bottom-0 left-1/2 w-[2px] -translate-x-1/2 bg-[#111214]" />
                    </div>
                  </div>
                ) : null}

                <div className="flex justify-between text-[10px] text-white/55 tabular-nums">
                  <span>
                    {t("Deg", "You")}: {gyldigeEgen}/{MIN_GYLDIGE_RAMMER}+
                  </span>
                  {!erSoloAktiv ? (
                    <span>
                      {motNavn}: {gyldigeMot}
                    </span>
                  ) : (
                    <span>15 s solo</span>
                  )}
                </div>
              </div>
            </div>
          ) : null}

          {/* Dramatic Rizzler Finisher shockwave / opponent distraction overlay */}
          {finisherBanner ? (
            <div
              key={finisherBanner.id}
              className={`pointer-events-none absolute inset-0 z-20 flex items-center justify-center p-4 ${
                finisherBanner.type === "utlost"
                  ? "bg-[radial-gradient(circle_at_center,rgb(250_204_21/0.32),transparent_70%)] ring-4 ring-inset ring-amber-300/80"
                  : "bg-[radial-gradient(circle_at_center,rgb(244_63_94/0.26),transparent_70%)] ring-4 ring-inset ring-rose-400/70"
              }`}
            >
              <div
                className={`mel-pop flex max-w-md flex-col items-center rounded-[28px] border px-6 py-4 text-center backdrop-blur-md ${
                  finisherBanner.type === "utlost"
                    ? "border-amber-300/70 bg-[#111214]/90 shadow-[0_0_64px_rgb(250_204_21/0.55)]"
                    : "border-rose-400/60 bg-[#111214]/90 shadow-[0_0_48px_rgb(244_63_94/0.45)]"
                }`}
              >
                <span className="text-4xl leading-none" aria-hidden="true">
                  {finisherBanner.type === "utlost" ? "🤫" : "😂"}
                </span>
                <p
                  className={`mt-2 text-2xl leading-tight font-extrabold tracking-[-0.03em] sm:text-3xl ${
                    finisherBanner.type === "utlost" ? "text-amber-300" : "text-rose-300"
                  }`}
                >
                  {finisherBanner.type === "utlost"
                    ? finisherBanner.avMeg
                      ? "RIZZLER FINISHER!"
                      : en
                        ? `MOGGED BY ${finisherBanner.navn.toUpperCase()}!`
                        : `MOGGED AV ${finisherBanner.navn.toUpperCase()}!`
                    : finisherBanner.avMeg
                      ? "RIZZ FAILED!"
                      : en
                        ? `${finisherBanner.navn.toUpperCase()} BROKE CHARACTER!`
                        : `${finisherBanner.navn.toUpperCase()} KNAKK SAMMEN!`}
                </p>
                <p className="mt-1 text-xs font-semibold text-white/85 tabular-nums">
                  {finisherBanner.type === "utlost"
                    ? finisherBanner.avMeg
                      ? en
                        ? `Ice-cold jawline — ${formaterBonus(RIZZLER_BONUS, "en")} bonus`
                        : `Iskald kjevelinje — ${formaterBonus(RIZZLER_BONUS)} bonus`
                      : en
                        ? `${finisherBanner.navn} landed Rizzler Finisher (${formaterBonus(RIZZLER_BONUS, "en")})`
                        : `${finisherBanner.navn} dro Rizzler Finisher (${formaterBonus(RIZZLER_BONUS)})`
                    : finisherBanner.avMeg
                      ? en
                        ? `You smiled mid-finisher — ${formaterBonus(RIZZLER_FEIL_STRAFF, "en")} pts`
                        : `Du smilte midt i finisheren — ${formaterBonus(RIZZLER_FEIL_STRAFF)} poeng`
                      : en
                        ? `Smiled during finisher (${formaterBonus(RIZZLER_FEIL_STRAFF, "en")})`
                        : `Smilte under finisheren (${formaterBonus(RIZZLER_FEIL_STRAFF)})`}
                </p>
              </div>
            </div>
          ) : null}
        </div>
      </section>

      {/* Lobby hint + secondary chrome below the fold so the faces dominate */}
      {!iDuell && !visResultat ? (
        <p className="mx-auto max-w-xl px-2 text-center text-[13px] leading-5 text-neutral-500">
          {erVert ? lobbyHint : gjesteHint}
          {lokalStrom && landmarkerKlar
            ? t(
                " Live-poenget reagerer når du poserer — kvalifiserer du ved 13 s dukker gullringen opp på haka for Rizzler Finisher (+0,2, låser poengene). Prøv gjerne posen her i lobbyen først!",
                " Live score reacts as you pose — qualify at 13 s and the gold chin ring unlocks Rizzler Finisher (+0.2, locks your score). Try practicing the pose in the lobby first!",
              )
            : ""}
        </p>
      ) : null}

      {!iDuell ? (
        <div className="mx-auto w-full min-w-0 max-w-4xl pt-2">
          <SlikRegnesDet />
        </div>
      ) : null}
    </div>
  )
}

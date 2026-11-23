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
  Play,
  RefreshCw,
  ScanFace,
  ShieldCheck,
  UserCheck,
  Wifi,
  WifiOff,
} from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { lagKode } from "../lib/duell/rom"
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
  velgMoggernDeltakere,
  type MoggernRapport,
  type MoggernStatus,
  type SpillerMaaling,
  type WebRtcSignal,
} from "../lib/moggern/duell"
import { opprettAnsiktSporer, type AnsiktSporer } from "../lib/moggern/landmarker"
import { samleLysStatus, type LysAnalyse } from "../lib/moggern/lys"
import {
  aggregerRammer,
  formaterBonus,
  formaterMoggernPoeng,
  MIN_GYLDIGE_RAMMER,
  MOG_UTTRYKK,
  oppdaterLivePoeng,
  type LivePoeng,
  type LivePoengTilstand,
  type MogUttrykkStyrker,
  type RammeResultat,
  type Veiledning,
} from "../lib/moggern/poeng"
import { tegnAnsiktSporing, tømSporingsLerret } from "../lib/moggern/sporing-tegner"
import { rangForPoeng } from "../lib/moggern/tekster"
import { hentKameraStrom, kameraFeilTekst, stoppStrom, useMoggernWebRtc } from "../lib/moggern/webrtc"
import { useDuellrom, type Romkontekst } from "./duell/bruk-duellrom"
import { MFLATE, MKNAPP, MKNAPP_SEKUNDAR, SlikRegnesDet, TullSkjerm, useHarGodkjentTull } from "./moggern-forklaring"
import type { MoggernBruker } from "./moggern-inngang"
import { MoggernResultat } from "./moggern-resultat"
import { useVisningsnavnSynk, VisningsnavnPille } from "./visningsnavn-pille"

const VEILEDNING_TEKST: Record<Veiledning, string> = {
  "ingen-ansikt": "Ingen ansikt i bildet — flytt deg inn i rammen",
  "for-langt-unna": "Kom litt nærmere kameraet",
  "for-naerme": "Gå et lite steg bakover",
  "snu-rett": "Se litt rettere mot kameraet",
  "vipp-rett": "Hold hodet litt rettere",
  ok: "Perfekt! Hold blikket rolig",
}

const MAALING_INTERVALL_MS = 140
/** Live HUD React state update cadence (ms); keeps score smoothing responsive without re-rendering at 25 fps. */
const HUD_INTERVALL_MS = 110
/** Minimum interval between green tracking overlay redraws (~25 fps on GPU, adapts down on slower CPUs). */
const SPORING_MIN_INTERVALL_MS = 40
/** Expression strength from which a mog-uttrykk pill is shown. */
const UTTRYKK_VIS_TERSKEL = 0.12

/** Dark glass used by every floating HUD element over the videos (explicit colours: unaffected by .spill-mork). */
const GLASS = "border border-white/10 bg-[#111214]/65 text-white backdrop-blur-md"

type ModellStatus = "laster" | "klar" | "feil"

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
  const { godkjent, lastet } = useHarGodkjentTull()
  const [lokalGodkjent, setLokalGodkjent] = useState(false)
  const harGodkjent = godkjent || lokalGodkjent

  if (!lastet) {
    return <div className="mx-auto w-full max-w-xl py-12 text-center text-xs text-neutral-500 tabular-nums">Laster rom {kode} …</div>
  }

  if (!harGodkjent) {
    return (
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-4">
        <TullSkjerm onGodkjenn={() => setLokalGodkjent(true)} />
      </div>
    )
  }

  if (!bruker) {
    const neste = encodeURIComponent(`/spill/moggern/${kode}`)
    return (
      <div className="mx-auto flex w-full max-w-xl flex-col gap-4">
        <section className={`${MFLATE} p-6 sm:p-8`}>
          <div className="flex items-center gap-3.5">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/[0.06] text-amber-300">
              <Lock className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <p className="text-xs font-medium text-neutral-500 tabular-nums">Rom {kode}</p>
              <h2 className="text-[1.6rem] leading-tight font-semibold tracking-[-0.03em] text-neutral-950">Logg inn for å slå på kameraet</h2>
            </div>
          </div>
          <p className="mt-4 text-[15px] leading-6 text-neutral-700">
            Moggern krever innlogging for å bruke kameraet, slik at bare kjente brukere kan delta i kameraduellen. Når du har logget inn, kommer du
            rett tilbake til rom <strong className="font-semibold tracking-[0.12em] text-neutral-950">{kode}</strong>.
          </p>
          <div className="mt-6 flex flex-wrap gap-2.5">
            <Link href={`/logg-inn?neste=${neste}`} className={MKNAPP}>
              Logg inn og bli med
            </Link>
            <Link href={`/registrer?neste=${neste}`} className={MKNAPP_SEKUNDAR}>
              Opprett konto
            </Link>
          </div>
        </section>
        <SlikRegnesDet />
      </div>
    )
  }

  return <AktivtMoggernRom kode={kode} bruker={bruker} supabaseUrl={supabaseUrl} supabaseNokkel={supabaseNokkel} />
}

/** Live score + rank title badge floating over a video tile. */
function LiveRating({ live, modell, aktiv }: { live: LivePoeng | null; modell: ModellStatus; aktiv: boolean }) {
  if (!aktiv) return null
  if (!live) {
    return (
      <span className={`${GLASS} inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-[11px] font-medium text-white/75`}>
        {modell === "laster" ? <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" /> : null}
        {modell === "laster" ? "Laster ansiktsmodell …" : "Vis ansiktet i kameraet"}
      </span>
    )
  }
  const rang = rangForPoeng(live.total)
  return (
    <div
      className={`${GLASS} flex items-center gap-2 rounded-[18px] py-1 pr-3 pl-1 shadow-[0_8px_24px_rgb(0_0_0/0.25)]`}
      aria-live="off"
      title={`Struktur ${formaterMoggernPoeng(live.strukturPoeng)} · uttrykk ${formaterBonus(live.bonus)}`}
    >
      <span className={`rounded-[14px] px-2.5 py-1 text-xs font-semibold tracking-[-0.01em] sm:text-[13px] ${rang.farge}`}>{rang.tittel}</span>
      <span className="text-[1.65rem] leading-none font-semibold tracking-[-0.04em] tabular-nums sm:text-[2rem]">
        {formaterMoggernPoeng(live.total)}
      </span>
    </div>
  )
}

/** Compact pills for active mog-uttrykk with their live bonus/penalty. */
function UttrykkPiller({ styrker }: { styrker: MogUttrykkStyrker | null }) {
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
            {u.navn}
            <span className="opacity-70">{formaterBonus(verdi)}</span>
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
  bruker: MoggernBruker
  supabaseUrl: string
  supabaseNokkel: string
}) {
  const router = useRouter()

  const signalHandtererRef = useRef<(payload: unknown) => void>(() => {})
  const [motstanderKameraPa, setMotstanderKameraPa] = useState(false)
  const [forlattVarsel, setForlattVarsel] = useState<string | null>(null)
  const [mittNavn, setMittNavn] = useState(bruker.visningsnavn)
  useVisningsnavnSynk(setMittNavn)

  const hendelser = useMemo(
    () => ({
      signal: (payload: unknown) => {
        signalHandtererRef.current(payload)
      },
      kamera: (payload: unknown, romCtx: Romkontekst<MoggernStatus>) => {
        const p = payload as { id?: unknown; pa?: unknown }
        if (typeof p?.id === "string" && p.id !== romCtx.meg && typeof p.pa === "boolean") {
          setMotstanderKameraPa(p.pa)
        }
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
      forlat: (payload: unknown, romCtx: Romkontekst<MoggernStatus>) => {
        const p = payload as { id?: unknown; navn?: unknown }
        if (typeof p?.id === "string" && p.id !== romCtx.meg) {
          const hvem = typeof p.navn === "string" && p.navn ? p.navn : "Motstanderen"
          setForlattVarsel(`${hvem} forlot rommet.`)
          setMotstanderKameraPa(false)
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

  const { status, settStatus, send, meg, erVert, tilkobling, iRommet, klar, settKlar, nyFase, spillIgjen, settNavn } = rom

  // Always present the account's (possibly just edited) display name in the duel room presence.
  useEffect(() => {
    settNavn(mittNavn)
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

  // ---- Local camera (independent) & lazy MediaPipe Face Landmarker (loads in the background) ----
  const [lokalStrom, setLokalStrom] = useState<MediaStream | null>(null)
  const [starterKamera, setStarterKamera] = useState(false)
  const [kameraFeil, setKameraFeil] = useState<string | null>(null)
  const [modell, setModell] = useState<ModellStatus>("laster")
  const [kopiert, setKopiert] = useState(false)
  const [egenVeiledning, setEgenVeiledning] = useState<Veiledning | null>(null)
  const [egenLive, setEgenLive] = useState<LivePoeng | null>(null)
  const [motLive, setMotLive] = useState<LivePoeng | null>(null)
  const [gyldigeEgen, setGyldigeEgen] = useState(0)
  const [gyldigeMot, setGyldigeMot] = useState(0)
  const [visSporing, setVisSporing] = useState(true)
  const [na, setNa] = useState(() => serverNa())
  const landmarkerKlar = modell === "klar"

  const lokalStromRef = useRef<MediaStream | null>(null)
  const starterRef = useRef(false)
  const montertRef = useRef(true)
  /** Set when the player turns the camera off themselves, so auto-start never overrides that choice. */
  const manueltAvRef = useRef(false)
  const visSporingRef = useRef(true)
  const egenSporerRef = useRef<AnsiktSporer | null>(null)
  const motSporerRef = useRef<AnsiktSporer | null>(null)
  const egenVideoRef = useRef<HTMLVideoElement | null>(null)
  const fjernVideoRef = useRef<HTMLVideoElement | null>(null)
  const egenSporingLerretRef = useRef<HTMLCanvasElement | null>(null)
  const motSporingLerretRef = useRef<HTMLCanvasElement | null>(null)
  const lerretRef = useRef<HTMLCanvasElement | null>(null)
  const egenLiveRef = useRef<LivePoengTilstand>({ struktur: null, styrker: null })
  const motLiveRef = useRef<LivePoengTilstand>({ struktur: null, styrker: null })

  useEffect(() => {
    visSporingRef.current = visSporing
    if (!visSporing) {
      tømSporingsLerret(egenSporingLerretRef.current)
      tømSporingsLerret(motSporingLerretRef.current)
    }
  }, [visSporing])

  const egenRammerRef = useRef<RammeResultat[]>([])
  const egenLysRef = useRef<LysAnalyse[]>([])
  const motRammerRef = useRef<RammeResultat[]>([])
  const motLysRef = useRef<LysAnalyse[]>([])
  const sendtRapportRundeRef = useRef<number | null>(null)
  const sisteTickRef = useRef<number | null>(null)

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
    sendSignal,
    aktiv: !erFullt && tilkobling === "klar",
  })

  useEffect(() => {
    signalHandtererRef.current = webrtc.mottaSignal
  }, [webrtc.mottaSignal])

  // Broadcast camera-on status whenever it changes or when an opponent arrives.
  useEffect(() => {
    if (!meg || tilkobling !== "klar") return
    send("kamera", { id: meg, pa: !!lokalStrom })
  }, [meg, tilkobling, lokalStrom, motstanderId, send])

  // Attach streams to the (always mounted) <video> elements.
  useEffect(() => {
    const el = egenVideoRef.current
    if (!el) return
    el.srcObject = lokalStrom
    if (lokalStrom) void el.play().catch(() => {})
  }, [lokalStrom, status.fase])

  useEffect(() => {
    const el = fjernVideoRef.current
    if (!el) return
    el.srcObject = webrtc.fjernStrom
    if (webrtc.fjernStrom) void el.play().catch(() => {})
  }, [webrtc.fjernStrom, status.fase])

  useEffect(() => {
    motLiveRef.current = { struktur: null, styrker: null }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMotLive(null)
    if (!webrtc.fjernStrom) tømSporingsLerret(motSporingLerretRef.current)
  }, [webrtc.fjernStrom])

  // Always stop camera tracks & close MediaPipe trackers on unmount.
  useEffect(() => {
    montertRef.current = true
    return () => {
      montertRef.current = false
      stoppStrom(lokalStromRef.current)
      lokalStromRef.current = null
      egenSporerRef.current?.lukk()
      egenSporerRef.current = null
      motSporerRef.current?.lukk()
      motSporerRef.current = null
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
      if (montertRef.current) setKameraFeil(kameraFeilTekst(err))
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
    settKlar(false)
    if (meg) send("kamera", { id: meg, pa: false })
  }, [meg, send, settKlar])

  const blokkerOgForlat = useCallback(() => {
    manueltAvRef.current = true
    stoppStrom(lokalStromRef.current)
    lokalStromRef.current = null
    setLokalStrom(null)
    webrtc.lukkForbindelse()
    if (meg) send("forlat", { id: meg, navn: mittNavn })
    router.push("/spill/moggern")
  }, [mittNavn, meg, router, send, webrtc])

  // ---- Countdown & measurement clock ----
  useEffect(() => {
    if (status.fase !== "nedtelling" && status.fase !== "maling") return
    const id = window.setInterval(() => setNa(serverNa()), 100)
    return () => window.clearInterval(id)
  }, [status.fase])

  const gjenstarMs = useMemo(() => {
    if (status.fase === "nedtelling") {
      return Math.max(0, status.faseStartTid + NEDTELLING_MS - na)
    }
    if (status.fase === "maling") {
      return Math.max(0, status.faseStartTid + MALING_MS - na)
    }
    return 0
  }, [status.fase, status.faseStartTid, na])

  // Countdown ticks (3, 2, 1) and host transition to "maling".
  useEffect(() => {
    if (status.fase !== "nedtelling") {
      sisteTickRef.current = null
      return
    }
    const sek = Math.ceil(gjenstarMs / 1000)
    if (sek >= 1 && sek <= 3 && sisteTickRef.current !== sek) {
      sisteTickRef.current = sek
      lyder.tikk((3 - sek) / 3)
    }
    if (erVert && gjenstarMs <= 0) {
      nyFase((s) => (s.fase === "nedtelling" ? { ...s, fase: "maling", faseStartTid: serverNa() } : s))
    }
  }, [status.fase, gjenstarMs, erVert, nyFase])

  // ---- One adaptive rAF loop: smooth green tracking overlay (~25 fps), live HUD (~9 Hz), and official 10 s duel capture ----
  useEffect(() => {
    if (!landmarkerKlar || status.fase === "resultat") {
      tømSporingsLerret(egenSporingLerretRef.current)
      tømSporingsLerret(motSporingLerretRef.current)
      return
    }
    const maler = status.fase === "maling"
    if (maler) {
      egenRammerRef.current = []
      egenLysRef.current = []
      motRammerRef.current = []
      motLysRef.current = []
      sendtRapportRundeRef.current = null
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setGyldigeEgen(0)
      setGyldigeMot(0)
    }

    const lerret = (lerretRef.current ??= document.createElement("canvas"))
    let rafId = 0
    let avbrutt = false
    let nesteAnalyseTid = 0
    let sisteMaalingTid = 0
    let sisteHudTid = 0

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
        if (egenSporer && egenVideo && lokalStromRef.current) {
          try {
            const ut = egenSporer.analyser(egenVideo, lerret, taOffisiell)
            if (ut) {
              if (egenOverlay) {
                if (visSporingRef.current) {
                  tegnAnsiktSporing(egenOverlay, egenVideo, ut.punkter, { speilet: true, gyldig: ut.ramme.gyldig })
                } else {
                  tømSporingsLerret(egenOverlay)
                }
              }
              if (taOffisiell) {
                egenRammerRef.current.push(ut.ramme)
                if (ut.lys) egenLysRef.current.push(ut.lys)
                if (ut.ramme.gyldig) setGyldigeEgen((n) => n + 1)
              }
              const forsteEgen = egenLiveRef.current.struktur === null
              if (oppdaterHud || forsteEgen) {
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
        const motOverlay = motSporingLerretRef.current
        if (motSporer && fjernVideo && fjernVideo.srcObject) {
          try {
            const ut = motSporer.analyser(fjernVideo, lerret, taOffisiell)
            if (ut) {
              if (motOverlay) {
                if (visSporingRef.current) {
                  tegnAnsiktSporing(motOverlay, fjernVideo, ut.punkter, { speilet: false, gyldig: ut.ramme.gyldig })
                } else {
                  tømSporingsLerret(motOverlay)
                }
              }
              if (taOffisiell) {
                motRammerRef.current.push(ut.ramme)
                if (ut.lys) motLysRef.current.push(ut.lys)
                if (ut.ramme.gyldig) setGyldigeMot((n) => n + 1)
              }
              const forsteMot = motLiveRef.current.struktur === null
              if (oppdaterHud || forsteMot) {
                const live = oppdaterLivePoeng(motLiveRef.current, ut.ramme)
                if (live) setMotLive(live)
              }
            }
          } catch {}
        } else if (motOverlay) {
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
  }, [landmarkerKlar, status.fase, status.runde])

  // ---- 10-second official measurement report ----
  const lagRapport = useCallback((): MoggernRapport | null => {
    if (!meg) return null
    const bygg = (rammer: RammeResultat[], lys: LysAnalyse[]): SpillerMaaling => {
      const samlet = aggregerRammer(rammer)
      return {
        ok: samlet.ok,
        total: samlet.total,
        delpoeng: samlet.delpoeng,
        uttrykkBonus: samlet.uttrykkBonus,
        lysStatus: samleLysStatus(lys),
        kvalitet: samlet.kvalitet,
      }
    }
    return {
      runde: status.runde,
      av: meg,
      egen: egenRammerRef.current.length ? bygg(egenRammerRef.current, egenLysRef.current) : null,
      motstander: motRammerRef.current.length ? bygg(motRammerRef.current, motLysRef.current) : null,
    }
  }, [meg, status.runde])

  // Send measurement report as soon as the 10 seconds finish.
  useEffect(() => {
    if (status.fase !== "maling" || !meg || gjenstarMs > 0) return
    if (sendtRapportRundeRef.current === status.runde) return
    sendtRapportRundeRef.current = status.runde

    const rapport = lagRapport()
    if (!rapport) return
    settStatus((s) =>
      s.runde === rapport.runde && !s.rapporter[rapport.av] ? { ...s, rapporter: { ...s.rapporter, [rapport.av]: rapport } } : s,
    )
    send("rapport", rapport as unknown as Record<string, unknown>)

    // Re-send once after 1 s in case the first broadcast raced with phase change.
    const reprise = window.setTimeout(() => {
      send("rapport", rapport as unknown as Record<string, unknown>)
    }, 1000)
    return () => window.clearTimeout(reprise)
  }, [status.fase, status.runde, meg, gjenstarMs, lagRapport, settStatus, send])

  // Host transitions from "maling" to "resultat" once both reports are in (or after 4.5 s timeout).
  useEffect(() => {
    if (!erVert || status.fase !== "maling") return
    const alleHarSendt = status.deltakere.length === MOGGERN_MAKS_SPILLERE && status.deltakere.every((d) => !!status.rapporter[d.id])
    const utlopt = na >= status.faseStartTid + MALING_MS + 4500

    if (alleHarSendt || utlopt) {
      nyFase((s) => (s.fase === "maling" ? { ...s, fase: "resultat" } : s))
    }
  }, [erVert, status.fase, status.deltakere, status.rapporter, status.faseStartTid, na, nyFase])

  // ---- Start duel / rematch actions ----
  const motstanderKlar = !!motstander && motstander.klar && motstander.runde === status.runde
  const motstanderHarVideo = !!webrtc.fjernStrom || motstanderKameraPa
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
    lyder.velg()
    nyFase((s) => ({
      ...s,
      fase: "nedtelling",
      deltakere,
      faseStartTid: serverNa(),
      rapporter: {},
    }))
  }, [kanStarteDuell, aktiveSpillere, nyFase])

  const kopierLenke = useCallback(async () => {
    const lenke = typeof window !== "undefined" ? window.location.href : ""
    try {
      if (navigator.share && matchMedia("(pointer: coarse)").matches) {
        await navigator.share({ title: "Moggern · thodh.com", text: `Bli med i Moggern-duell (${kode})!`, url: lenke })
        return
      }
      await navigator.clipboard.writeText(lenke)
      setKopiert(true)
      window.setTimeout(() => setKopiert(false), 1800)
    } catch {}
  }, [kode])

  if (erFullt) {
    return (
      <div className="mx-auto flex w-full max-w-xl flex-col gap-4">
        <section className={`${MFLATE} p-6 text-center sm:p-8`}>
          <p className="text-xs font-medium text-rose-300">Rom {kode} er fullt</p>
          <h2 className="mt-2 text-[1.6rem] font-semibold tracking-[-0.03em] text-neutral-950">Maks 2 spillere per duell</h2>
          <p className="mt-3 text-[15px] leading-6 text-neutral-700">
            Det er allerede to venner i dette rommet. Lag ditt eget rom for å starte en ny 1v1-duell.
          </p>
          <div className="mt-6 flex justify-center gap-2.5">
            <button type="button" onClick={() => router.push(`/spill/moggern/${lagKode()}`)} className={MKNAPP}>
              Lag nytt rom
            </button>
            <Link href="/spill/moggern" className={MKNAPP_SEKUNDAR}>
              Tilbake
            </Link>
          </div>
        </section>
      </div>
    )
  }

  const nedtellingTall = Math.max(1, Math.min(3, Math.ceil(gjenstarMs / 1000)))
  const maalingSek = (gjenstarMs / 1000).toFixed(1).replace(".", ",")
  const maalingFremdrift = Math.min(100, Math.max(0, ((MALING_MS - gjenstarMs) / MALING_MS) * 100))
  const iDuell = status.fase === "nedtelling" || status.fase === "maling"
  const motNavn = motstander?.navn || "Motstanderen"

  const lobbyHint = !lokalStrom
    ? "Slå på kameraet ditt for å gjøre deg klar."
    : !motstander
      ? "Del lenken eller koden med én venn for å starte."
      : !motstanderHarVideo
        ? `Venter på at ${motNavn} slår på kameraet.`
        : !motstanderKlar
          ? `Venter på at ${motNavn} trykker «Klar».`
          : "Begge er klare — trykk Start for 3-2-1 og 10 sekunders måling!"

  const gjesteHint = !lokalStrom
    ? "Slå på kameraet ditt og trykk «Klar til duell»."
    : klar
      ? `Du er klar! Venter på at ${motstander?.navn || "verten"} starter.`
      : "Trykk «Klar» når du sitter i godt lys og ser rett i kameraet."

  return (
    <div className="flex w-full flex-col gap-2">
      {/* Compact room bar: code, invite link, connection & always-reachable leave/block */}
      <div className="flex w-full flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="inline-flex h-9 items-center gap-2 rounded-full border border-white/[0.07] bg-[var(--spill-flate)] pr-1 pl-3.5">
            <span className="text-[11px] font-medium text-neutral-500">Rom</span>
            <span className="text-[15px] font-semibold tracking-[0.18em] text-neutral-950 tabular-nums">{kode}</span>
            <button
              type="button"
              onClick={kopierLenke}
              aria-label="Kopier invitasjonslenke"
              className="inline-flex h-7 items-center gap-1 rounded-full bg-white/[0.06] px-2.5 text-[11px] font-medium text-neutral-800 transition hover:bg-white/[0.12]"
            >
              {kopiert ? <Check className="h-3.5 w-3.5 text-lime-400" /> : <Copy className="h-3.5 w-3.5" />}
              <span className="max-sm:sr-only">{kopiert ? "Kopiert!" : "Kopier lenke"}</span>
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
                Feil
              </>
            ) : (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin text-neutral-500" aria-hidden="true" />
                Kobler …
              </>
            )}
          </span>
        </div>

        <button
          type="button"
          onClick={blokkerOgForlat}
          className="inline-flex h-9 items-center gap-1.5 rounded-full border border-rose-400/25 bg-rose-500/10 px-3.5 text-xs font-semibold text-rose-300 transition hover:bg-rose-500/20"
        >
          <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
          Blokker / forlat
        </button>
      </div>

      {forlattVarsel ? (
        <div role="status" className="w-full rounded-2xl border border-amber-400/25 bg-amber-400/10 px-4 py-2.5 text-xs text-amber-100">
          {forlattVarsel}
        </div>
      ) : null}

      {/* Result reveal screen */}
      {status.fase === "resultat" ? (
        <div className="mx-auto w-full max-w-4xl pt-2">
          <MoggernResultat
            kode={kode}
            runde={status.runde}
            deltakere={status.deltakere}
            rapporter={status.rapporter}
            meg={meg}
            erVert={erVert}
            onOmkamp={() => {
              lyder.velg()
              settKlar(false)
              spillIgjen()
            }}
          />
        </div>
      ) : null}

      {/* 1v1 stage: edge-to-edge full-viewport in lobby, and true 100vw × 100dvh fullscreen during countdown & duel. */}
      <section
        aria-label="Kameraduell"
        className={
          status.fase === "resultat"
            ? "hidden"
            : iDuell
              ? "fixed inset-0 z-50 bg-[#0d0e10] p-0"
              : "w-full"
        }
      >
        <div
          className={
            iDuell
              ? "relative grid h-full w-full grid-rows-2 gap-[2px] md:grid-cols-2 md:grid-rows-1"
              : "relative grid h-[calc(100dvh-6.25rem)] min-h-[34rem] w-full grid-rows-2 gap-1.5 md:grid-cols-2 md:grid-rows-1 md:gap-2"
          }
        >
          {/* ---- Own camera tile ---- */}
          <div
            className={`relative min-h-0 overflow-hidden bg-[#0d0e10] ${
              iDuell ? "rounded-none border-0" : "rounded-[22px] border border-white/[0.07]"
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
              className={`pointer-events-none absolute inset-0 h-full w-full transition-opacity duration-300 ${lokalStrom && visSporing ? "opacity-100" : "opacity-0"}`}
            />

            {!lokalStrom ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/[0.06] text-white/60">
                  {starterKamera ? <Loader2 className="h-5 w-5 animate-spin" /> : <CameraOff className="h-5 w-5" aria-hidden="true" />}
                </span>
                <p className="text-[15px] font-medium text-white">{starterKamera ? "Starter kameraet …" : "Kameraet ditt er av"}</p>
                {!starterKamera ? (
                  <button type="button" onClick={() => void skruPaKamera()} className={MKNAPP}>
                    <Camera className="h-4 w-4" />
                    Slå på kamera
                  </button>
                ) : (
                  <p className="max-w-xs text-xs leading-5 text-white/50">Svar «Tillat» hvis nettleseren spør om kameraet.</p>
                )}
                {kameraFeil ? <p className="max-w-sm text-xs leading-5 text-rose-300">{kameraFeil}</p> : null}
                <p className="max-w-xs text-[11px] leading-4 text-white/35">Videoen går bare direkte til vennen din. Ingenting lagres.</p>
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
                etikett="(deg)"
                ikon={
                  erVert ? (
                    <Crown className="h-3.5 w-3.5 shrink-0 text-amber-300" aria-label="Vert" />
                  ) : (
                    <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-emerald-400" aria-hidden="true" />
                  )
                }
                className="max-w-[55%]"
              />
              <div className="flex flex-col items-end gap-1.5">
                <LiveRating live={egenLive} modell={modell} aktiv={!!lokalStrom && modell !== "feil"} />
                {modell === "feil" && lokalStrom ? (
                  <button
                    type="button"
                    onClick={lastModell}
                    className={`${GLASS} inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-[11px] font-medium text-amber-200 hover:bg-[#111214]/85`}
                  >
                    <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
                    Ansiktsmodellen feilet · prøv igjen
                  </button>
                ) : null}
              </div>
            </div>

            {/* Bottom HUD: mog-uttrykk pills, pose guidance, camera toggle & ready */}
            <div className="absolute inset-x-2.5 bottom-2.5 flex flex-col gap-2 sm:inset-x-3.5 sm:bottom-3.5">
              {lokalStrom ? <UttrykkPiller styrker={egenLive?.styrker ?? null} /> : null}
              {lokalStrom && egenVeiledning && egenVeiledning !== "ok" ? (
                <p className={`${GLASS} self-start rounded-full px-3 py-1.5 text-[11px] font-medium text-amber-100`}>{VEILEDNING_TEKST[egenVeiledning]}</p>
              ) : null}
              {lokalStrom ? (
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={skruAvKamera}
                      className={`${GLASS} inline-flex h-9 items-center gap-1.5 rounded-full px-3 text-xs font-medium hover:bg-[#111214]/85`}
                    >
                      <CameraOff className="h-3.5 w-3.5" aria-hidden="true" />
                      <span className="max-sm:sr-only">Skru av kamera</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setVisSporing((v) => !v)}
                      aria-pressed={visSporing}
                      title={visSporing ? "Skjul grønne sporingslinjer" : "Vis grønne sporingslinjer"}
                      className={`${GLASS} inline-flex h-9 items-center gap-1.5 rounded-full px-3 text-xs font-medium hover:bg-[#111214]/85 ${
                        visSporing ? "border-emerald-400/35 text-emerald-300" : "text-white/70"
                      }`}
                    >
                      <ScanFace className="h-3.5 w-3.5" aria-hidden="true" />
                      <span className="max-sm:sr-only">Sporing</span>
                    </button>
                  </div>

                  {status.fase === "lobby" && !erVert && landmarkerKlar ? (
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
                      {klar ? "Klar ✓" : "Klar til duell"}
                    </button>
                  ) : null}
                  {status.fase === "lobby" && erVert ? (
                    <button
                      type="button"
                      onClick={startDuell}
                      disabled={!kanStarteDuell}
                      title={kanStarteDuell ? undefined : lobbyHint}
                      className="inline-flex h-9 items-center gap-1.5 rounded-full bg-[#f4f4f5] px-4 text-xs font-semibold text-[#18191b] transition hover:bg-white active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <Play className="h-3.5 w-3.5" aria-hidden="true" />
                      Start duell (10 s)
                    </button>
                  ) : null}
                </div>
              ) : null}
            </div>
          </div>

          {/* ---- Opponent tile ---- */}
          <div
            className={`relative min-h-0 overflow-hidden bg-[#0d0e10] ${
              iDuell ? "rounded-none border-0" : "rounded-[22px] border border-white/[0.07]"
            }`}
          >
            <video
              ref={fjernVideoRef}
              autoPlay
              playsInline
              muted
              className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-500 ${webrtc.fjernStrom ? "opacity-100" : "opacity-0"}`}
            />
            <canvas
              ref={motSporingLerretRef}
              aria-hidden="true"
              className={`pointer-events-none absolute inset-0 h-full w-full transition-opacity duration-300 ${webrtc.fjernStrom && visSporing ? "opacity-100" : "opacity-0"}`}
            />

            {!webrtc.fjernStrom ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/[0.06] text-white/60">
                  {motstander ? <Loader2 className="h-5 w-5 animate-spin" /> : <Camera className="h-5 w-5" aria-hidden="true" />}
                </span>
                <p className="text-[15px] font-medium text-white">
                  {!motstander ? "Venter på motstander …" : motstanderKameraPa ? `Kobler video til ${motNavn} …` : `${motNavn} har kameraet av`}
                </p>
                {!motstander ? (
                  <>
                    <p className="text-[2.4rem] leading-none font-semibold tracking-[0.22em] text-white tabular-nums">{kode}</p>
                    <button type="button" onClick={kopierLenke} className={MKNAPP_SEKUNDAR}>
                      {kopiert ? <Check className="h-4 w-4 text-lime-400" /> : <Copy className="h-4 w-4" />}
                      {kopiert ? "Kopiert!" : "Kopier invitasjonslenke"}
                    </button>
                  </>
                ) : null}
                <p className="max-w-xs text-xs leading-5 text-white/45">
                  {!motstander ? "Send romkoden eller lenken til én venn." : "Videoen går direkte mellom nettleserne deres (peer-to-peer)."}
                </p>
              </div>
            ) : null}

            <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-[#0d0e10]/55 to-transparent" />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-[#0d0e10]/70 to-transparent" />

            <div className="absolute inset-x-2.5 top-2.5 flex items-start justify-between gap-2 sm:inset-x-3.5 sm:top-3.5">
              <span className={`${GLASS} inline-flex h-8 max-w-[55%] items-center gap-1.5 rounded-full px-3 text-xs font-medium`}>
                {motstander && !erVert ? <Crown className="h-3.5 w-3.5 shrink-0 text-amber-300" aria-label="Vert" /> : null}
                <span className="truncate">{motstander ? motNavn : "Ledig plass"}</span>
                {motstander ? (
                  <span
                    aria-label={webrtc.status === "tilkoblet" ? "Video tilkoblet" : webrtc.status === "feil" ? "Videofeil" : "Kobler video"}
                    className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                      webrtc.status === "tilkoblet" ? "bg-emerald-400" : webrtc.status === "feil" ? "bg-rose-400" : "bg-amber-300"
                    }`}
                  />
                ) : null}
              </span>
              <LiveRating live={motLive} modell={modell} aktiv={!!webrtc.fjernStrom && modell !== "feil"} />
            </div>

            <div className="absolute inset-x-2.5 bottom-2.5 flex flex-col gap-2 sm:inset-x-3.5 sm:bottom-3.5">
              {webrtc.fjernStrom ? <UttrykkPiller styrker={motLive?.styrker ?? null} /> : null}
              {motstander ? (
                <div className="flex flex-wrap items-center justify-between gap-2">
                  {status.fase === "lobby" ? (
                    <span className={`${GLASS} rounded-full px-3 py-1.5 text-[11px] font-medium text-white/80`}>
                      {motstanderKlar ? `${motNavn} er klar ✓` : erVert ? `Venter på at ${motNavn} blir klar` : `${motNavn} starter duellen`}
                    </span>
                  ) : (
                    <span />
                  )}
                  {webrtc.status === "feil" ? (
                    <button
                      type="button"
                      onClick={webrtc.koblePaaNytt}
                      className={`${GLASS} inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-[11px] font-medium hover:bg-[#111214]/85`}
                    >
                      <RefreshCw className="h-3.5 w-3.5" />
                      Koble til på nytt
                    </button>
                  ) : null}
                </div>
              ) : null}
              {webrtc.feil && motstander ? <p className={`${GLASS} rounded-2xl px-3 py-2 text-[11px] leading-4 text-rose-200`}>{webrtc.feil}</p> : null}
            </div>
          </div>

          {/* ---- Duel overlays spanning both faces ---- */}
          {iDuell ? (
            <button
              type="button"
              onClick={blokkerOgForlat}
              className={`${GLASS} absolute right-3 bottom-3 z-10 inline-flex h-9 items-center gap-1.5 rounded-full border-rose-400/30 px-3 text-xs font-semibold text-rose-200 transition hover:bg-rose-500/30`}
            >
              <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
              Forlat
            </button>
          ) : null}

          {status.fase === "nedtelling" ? (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <div className={`${GLASS} flex flex-col items-center rounded-[32px] px-8 py-5 shadow-[0_24px_64px_rgb(0_0_0/0.45)]`}>
                <p className="text-xs font-medium text-white/70">Se rett inn i kameraet</p>
                <p key={nedtellingTall} className="mel-pop text-[5.5rem] leading-none font-semibold tracking-[-0.05em] text-lime-300 tabular-nums">
                  {nedtellingTall}
                </p>
              </div>
            </div>
          ) : null}

          {status.fase === "maling" ? (
            <div className="pointer-events-none absolute inset-x-0 top-0 flex justify-center px-3 pt-14 sm:pt-3">
              <div className={`${GLASS} flex w-full max-w-sm flex-col gap-1.5 rounded-[20px] px-3.5 py-2.5 shadow-[0_12px_32px_rgb(0_0_0/0.35)]`}>
                <div className="flex items-center justify-between gap-3 text-xs font-medium">
                  <span>{gjenstarMs > 0 ? "Måler — hold blikket!" : "Beregner resultat …"}</span>
                  <span className="text-sm font-semibold text-lime-300 tabular-nums">{maalingSek} s</span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/15">
                  <div className="h-full rounded-full bg-lime-300 transition-[width] duration-100" style={{ width: `${maalingFremdrift}%` }} />
                </div>
                <div className="flex justify-between text-[10px] text-white/55 tabular-nums">
                  <span>
                    Deg: {gyldigeEgen}/{MIN_GYLDIGE_RAMMER}+
                  </span>
                  <span>
                    {motNavn}: {gyldigeMot}
                  </span>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </section>

      {/* Lobby hint + secondary chrome below the fold so the faces dominate */}
      {status.fase === "lobby" ? (
        <p className="mx-auto max-w-xl px-2 text-center text-[13px] leading-5 text-neutral-500">
          {erVert ? lobbyHint : gjesteHint}
          {lokalStrom && landmarkerKlar ? " Live-poenget reagerer når du poserer: hev ett øyenbryn, myse, mew — men ikke smil." : ""}
        </p>
      ) : null}

      {!iDuell ? (
        <div className="mx-auto w-full max-w-4xl pt-2">
          <SlikRegnesDet />
        </div>
      ) : null}
    </div>
  )
}

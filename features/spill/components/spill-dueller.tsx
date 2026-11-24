"use client"

import {
  ArrowRight,
  Bell,
  BellRing,
  Camera,
  Check,
  Crown,
  Flame,
  Hash,
  KeyRound,
  Loader2,
  Plus,
  Swords,
  UserPlus,
  Users,
  Zap,
} from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useCallback, useEffect, useState, useSyncExternalStore } from "react"
import { useT } from "@/lib/sprak"
import { erGyldigKode, lagKode, normaliserKode } from "../lib/duell/rom"
import {
  DUELL_MODUS_VALG,
  duellRomLenke,
  duellSpillNavn,
  type DuellModus,
  type DuellSpillId,
  type DuellUtfordring,
  type VennOppforing,
} from "../lib/sosial"
import { sendUtfordringerOppdatert, sendUtfordringPing, useUtfordringerSynk, useUtfordringVarsel } from "../lib/utfordring-varsel"

type VarselStatus = NotificationPermission | "stottes-ikke"
const VARSEL_TILLATELSE_HENDELSE = "thodh-varsel-tillatelse"

function abonnerVarselStatus(varsle: () => void) {
  window.addEventListener(VARSEL_TILLATELSE_HENDELSE, varsle)
  window.addEventListener("focus", varsle)
  return () => {
    window.removeEventListener(VARSEL_TILLATELSE_HENDELSE, varsle)
    window.removeEventListener("focus", varsle)
  }
}

function lesVarselStatus(): VarselStatus {
  if (typeof window === "undefined" || typeof Notification === "undefined") return "stottes-ikke"
  return Notification.permission
}

function useVarselStatus(): VarselStatus {
  return useSyncExternalStore(abonnerVarselStatus, lesVarselStatus, () => "stottes-ikke")
}

type ArenaSpill = {
  id: DuellSpillId
  navn: string
  navnEn: string
  merke: string
  merkeEn: string
  kort: string
  kortEn: string
  spillere: string
  spillereEn: string
  rammeAktiv: string
  ikonBg: string
  knappStil: string
  merkeStil: string
}

const ARENA_SPILL: readonly ArenaSpill[] = [
  {
    id: "moggern",
    navn: "Moggern",
    navnEn: "Moggern",
    merke: "15 s · Kamera",
    merkeEn: "15s · Camera",
    kort: "1v1 ansiktsmåling, mog-uttrykk og Rizzler Finisher. Ingen innlogging.",
    kortEn: "1v1 face scoring, mog expressions, and Rizzler Finisher. No login required.",
    spillere: "2 spillere",
    spillereEn: "2 players",
    rammeAktiv: "border-lime-400/60 bg-gradient-to-br from-lime-400/[0.15] via-[#26282c] to-[#26282c] shadow-[0_0_0_1px_rgba(163,230,53,0.25)]",
    ikonBg: "bg-lime-400 text-neutral-950",
    knappStil: "bg-lime-400 text-neutral-950 hover:bg-lime-300",
    merkeStil: "border-lime-400/30 bg-lime-400/10 text-lime-200",
  },
  {
    id: "67-stegern",
    navn: "6/7-stegern",
    navnEn: "6/7-Stegern",
    merke: "2 moduser",
    merkeEn: "2 modes",
    kort: "Sjeldne svar gir lange hopp — eller spill Startpistolen (varm potet).",
    kortEn: "Rare answers leap furthest — or play Starter Pistol (hot potato).",
    spillere: "2–6 spillere",
    spillereEn: "2–6 players",
    rammeAktiv: "border-emerald-400/60 bg-gradient-to-br from-emerald-400/[0.14] via-[#26282c] to-[#26282c] shadow-[0_0_0_1px_rgba(52,211,153,0.25)]",
    ikonBg: "bg-emerald-400 text-neutral-950",
    knappStil: "bg-emerald-400 text-neutral-950 hover:bg-emerald-300",
    merkeStil: "border-emerald-400/30 bg-emerald-400/10 text-emerald-200",
  },
  {
    id: "gjettelos",
    navn: "Gjetteløs",
    navnEn: "Guessless",
    merke: "5 tallspørsmål",
    merkeEn: "5 number rounds",
    kort: "Hvor mange? Hvor høyt? Hvilket år? Nærmest fasit vinner.",
    kortEn: "How many? How tall? What year? Closest estimate wins.",
    spillere: "2–6 spillere",
    spillereEn: "2–6 players",
    rammeAktiv: "border-indigo-400/60 bg-gradient-to-br from-indigo-400/[0.16] via-[#26282c] to-[#26282c] shadow-[0_0_0_1px_rgba(129,140,248,0.28)]",
    ikonBg: "bg-indigo-400 text-neutral-950",
    knappStil: "bg-indigo-400 text-neutral-950 hover:bg-indigo-300",
    merkeStil: "border-indigo-400/30 bg-indigo-400/10 text-indigo-200",
  },
] as const

function SpillIkon({ id }: { id: DuellSpillId }) {
  if (id === "moggern") return <Camera className="h-4 w-4" aria-hidden="true" />
  if (id === "67-stegern") return <Flame className="h-4 w-4" aria-hidden="true" />
  return <Hash className="h-4 w-4" aria-hidden="true" />
}

export function SpillDueller({
  innlogget,
  supabaseUrl,
  supabaseNokkel,
}: {
  innlogget: boolean
  supabaseUrl: string
  supabaseNokkel: string
}) {
  const router = useRouter()
  const t = useT()
  const varselStatus = useVarselStatus()

  // Single unified game & mode selector used for open rooms, joining by code, AND 1-click friend challenges
  const [valgtSpill, setValgtSpill] = useState<DuellSpillId>("moggern")
  const [valgtModus, setValgtModus] = useState<DuellModus>("runder")
  const [romkode, setRomkode] = useState("")
  const [kodeFeil, setKodeFeil] = useState(false)

  // Friend challenges state
  const [brukerId, setBrukerId] = useState<string | null>(null)
  const [innkommende, setInnkommende] = useState<DuellUtfordring[]>([])
  const [utgaende, setUtgaende] = useState<DuellUtfordring[]>([])
  const [venner, setVenner] = useState<VennOppforing[]>([])
  const [senderTilId, setSenderTilId] = useState<string | null>(null)
  const [laster, setLaster] = useState(innlogget)
  const [feil, setFeil] = useState<string | null>(null)

  const aktivtSpill = ARENA_SPILL.find((s) => s.id === valgtSpill) ?? ARENA_SPILL[0]

  const hentAlt = useCallback(async () => {
    if (!innlogget) return
    try {
      const [uSvar, vSvar] = await Promise.all([
        fetch("/spill/api/utfordringer", { cache: "no-store" }),
        fetch("/spill/api/venner", { cache: "no-store" }),
      ])
      if (uSvar.ok) {
        const u = (await uSvar.json()) as {
          brukerId?: string
          innkommende?: DuellUtfordring[]
          utgaende?: DuellUtfordring[]
          antallVentende?: number
          melding?: string
        }
        setBrukerId(u.brukerId ?? null)
        setInnkommende(u.innkommende ?? [])
        setUtgaende(u.utgaende ?? [])
        if (typeof u.antallVentende === "number") sendUtfordringerOppdatert(u.antallVentende, "dueller")
        if (u.melding) setFeil(u.melding)
      }
      if (vSvar.ok) {
        const v = (await vSvar.json()) as { venner?: VennOppforing[] }
        setVenner(v.venner ?? [])
      }
    } catch {
      // Silent retry on next poll.
    } finally {
      setLaster(false)
    }
  }, [innlogget])

  useEffect(() => {
    if (!innlogget) return
    let aktiv = true
    const last = () => {
      void Promise.all([
        fetch("/spill/api/utfordringer", { cache: "no-store" }),
        fetch("/spill/api/venner", { cache: "no-store" }),
      ])
        .then(async ([uSvar, vSvar]) => {
          if (!aktiv) return
          if (uSvar.ok) {
            const u = (await uSvar.json()) as {
              brukerId?: string
              innkommende?: DuellUtfordring[]
              utgaende?: DuellUtfordring[]
              antallVentende?: number
              melding?: string
            }
            if (!aktiv) return
            setBrukerId(u.brukerId ?? null)
            setInnkommende(u.innkommende ?? [])
            setUtgaende(u.utgaende ?? [])
            if (typeof u.antallVentende === "number") sendUtfordringerOppdatert(u.antallVentende, "dueller")
            if (u.melding) setFeil(u.melding)
          }
          if (vSvar.ok) {
            const v = (await vSvar.json()) as { venner?: VennOppforing[] }
            if (!aktiv) return
            setVenner(v.venner ?? [])
          }
        })
        .catch(() => undefined)
        .finally(() => {
          if (aktiv) setLaster(false)
        })
    }
    last()
    const id = window.setInterval(() => {
      if (document.visibilityState === "visible") last()
    }, 15_000)
    return () => {
      aktiv = false
      window.clearInterval(id)
    }
  }, [innlogget])

  useUtfordringVarsel(supabaseUrl, supabaseNokkel, brukerId, () => {
    void hentAlt()
  })

  useUtfordringerSynk((_antall, kilde) => {
    if (kilde !== "dueller") void hentAlt()
  })

  const beOmVarsler = async () => {
    if (typeof Notification === "undefined") return
    try {
      await Notification.requestPermission()
      window.dispatchEvent(new Event(VARSEL_TILLATELSE_HENDELSE))
    } catch {
      // Ignore permission errors in restricted browsers.
    }
  }

  const lagApenRom = () => {
    const k = lagKode()
    const modus = valgtSpill === "67-stegern" ? valgtModus : "runder"
    router.push(duellRomLenke(valgtSpill, k, modus))
  }

  const bliMedMedKode = (e: React.FormEvent) => {
    e.preventDefault()
    const k = normaliserKode(romkode)
    if (!erGyldigKode(k)) {
      setKodeFeil(true)
      return
    }
    router.push(duellRomLenke(valgtSpill, k, "runder"))
  }

  const utfordreVenn = async (mottakerId: string) => {
    setSenderTilId(mottakerId)
    setFeil(null)
    try {
      const modus: DuellModus = valgtSpill === "67-stegern" ? valgtModus : "runder"
      const svar = await fetch("/spill/api/utfordringer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mottakerId, spillId: valgtSpill, modus }),
      })
      const d = (await svar.json().catch(() => ({}))) as { lenke?: string; melding?: string }
      if (!svar.ok || !d.lenke) {
        setFeil(d.melding ?? t("Klarte ikke å opprette utfordringen.", "Could not create the challenge."))
        return
      }
      void sendUtfordringPing(supabaseUrl, supabaseNokkel, mottakerId)
      router.push(d.lenke)
    } catch {
      setFeil(t("Nettverksfeil. Prøv igjen.", "Network error. Please try again."))
    } finally {
      setSenderTilId(null)
    }
  }

  const svarPaUtfordring = async (u: DuellUtfordring, handling: "godta" | "avsla" | "avbryt") => {
    setFeil(null)
    const svar = await fetch("/spill/api/utfordringer", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: u.id, handling }),
    })
    const d = (await svar.json().catch(() => ({}))) as { lenke?: string; melding?: string }
    if (!svar.ok) {
      setFeil(d.melding ?? t("Klarte ikke å oppdatere utfordringen.", "Could not update the challenge."))
      return
    }
    const motpartId = handling === "avbryt" ? u.mottakerId : u.avsenderId
    void sendUtfordringPing(supabaseUrl, supabaseNokkel, motpartId)
    if (handling === "godta" && d.lenke) {
      const igjen = innkommende.filter((x) => x.id !== u.id && x.status === "venter").length
      sendUtfordringerOppdatert(igjen, "dueller")
      router.push(d.lenke)
      return
    }
    await hentAlt()
  }

  const ventendeInn = innkommende.filter((u) => u.status === "venter")
  const aktiveInn = innkommende.filter((u) => u.status === "godtatt")
  const aktiveUt = utgaende.filter((u) => u.status === "venter" || u.status === "godtatt")
  const harAktiveUtfordringer = ventendeInn.length > 0 || aktiveInn.length > 0 || aktiveUt.length > 0

  return (
    <div className="flex flex-col gap-5">
      {/* 1. Live incoming & active friend challenges pinned at the very top */}
      {innlogget && (harAktiveUtfordringer || feil) ? (
        <section className="rounded-[28px] border border-amber-400/30 bg-gradient-to-br from-amber-500/[0.12] via-[#26282c] to-[#26282c] p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                {ventendeInn.length > 0 ? (
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-300 opacity-75" />
                ) : null}
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-amber-400" />
              </span>
              <h2 className="text-sm font-semibold text-neutral-50">
                {t("Aktive duellutfordringer", "Active duel challenges")}
              </h2>
              {ventendeInn.length > 0 ? (
                <span className="rounded-full bg-rose-500 px-2 py-0.5 font-mono text-[10px] font-bold text-white">
                  {ventendeInn.length} {ventendeInn.length === 1 ? t("ny", "new") : t("nye", "new")}
                </span>
              ) : null}
            </div>
            {varselStatus === "default" ? (
              <button
                type="button"
                onClick={() => void beOmVarsler()}
                className="inline-flex h-7 items-center gap-1.5 rounded-full border border-white/15 bg-white/[0.05] px-2.5 text-[11px] font-medium text-neutral-200 transition hover:bg-white/10"
              >
                <Bell className="h-3 w-3 text-amber-300" aria-hidden="true" />
                <span>{t("Slå på varsler", "Enable alerts")}</span>
              </button>
            ) : varselStatus === "granted" ? (
              <span className="inline-flex h-7 items-center gap-1 rounded-full border border-emerald-400/25 bg-emerald-400/10 px-2.5 text-[11px] font-medium text-emerald-300">
                <BellRing className="h-3 w-3" aria-hidden="true" />
                <span>{t("Varsler på", "Alerts on")}</span>
              </span>
            ) : null}
          </div>

          {feil ? <p className="mt-3 text-xs text-amber-200">{feil}</p> : null}

          <div className="mt-3 grid gap-2.5 sm:grid-cols-2">
            {ventendeInn.map((u) => (
              <div key={u.id} className="flex flex-col justify-between gap-3 rounded-2xl border border-amber-400/40 bg-black/25 p-3.5">
                <div>
                  <p className="text-sm font-semibold text-neutral-50">
                    {u.avsenderNavn} {t("utfordrer deg!", "challenges you!")}
                  </p>
                  <p className="mt-0.5 text-xs text-neutral-300">
                    {duellSpillNavn(u.spillId, u.modus)} · {t("Rom", "Room")}{" "}
                    <span className="font-mono font-bold text-amber-200">{u.romkode}</span>
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => void svarPaUtfordring(u, "godta")}
                    className="inline-flex h-8 items-center gap-1.5 rounded-full bg-emerald-400 px-3.5 text-xs font-semibold text-neutral-950 transition hover:bg-emerald-300"
                  >
                    <Check className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>{t("Godta og bli med", "Accept & join")}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => void svarPaUtfordring(u, "avsla")}
                    className="inline-flex h-8 items-center rounded-full border border-white/15 px-3 text-xs text-neutral-200 transition hover:bg-white/10"
                  >
                    {t("Avslå", "Decline")}
                  </button>
                </div>
              </div>
            ))}

            {aktiveInn.map((u) => (
              <div
                key={u.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-emerald-400/30 bg-emerald-500/10 p-3.5"
              >
                <div className="text-xs">
                  <p className="font-semibold text-neutral-50">
                    {t("Duell mot", "Duel vs")} {u.avsenderNavn}
                  </p>
                  <p className="mt-0.5 text-neutral-300">
                    {duellSpillNavn(u.spillId, u.modus)} · <span className="font-mono font-semibold">{u.romkode}</span>
                  </p>
                </div>
                <Link
                  href={duellRomLenke(u.spillId, u.romkode, u.modus)}
                  className="inline-flex h-8 items-center gap-1 rounded-full bg-emerald-400 px-3 text-xs font-semibold text-neutral-950 transition hover:bg-emerald-300"
                >
                  <span>{t("Åpne rom", "Open room")}</span>
                  <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                </Link>
              </div>
            ))}

            {aktiveUt.map((u) => (
              <div
                key={u.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-white/10 bg-[#18191b]/90 p-3.5"
              >
                <div className="text-xs">
                  <p className="font-semibold text-neutral-100">
                    {t("Til", "To")} {u.mottakerNavn}{" "}
                    <span
                      className={`ml-1 font-mono text-[10px] uppercase ${
                        u.status === "godtatt" ? "text-emerald-400" : "text-neutral-400"
                      }`}
                    >
                      {u.status === "godtatt" ? t("· Godtatt!", "· Accepted!") : t("· Venter", "· Pending")}
                    </span>
                  </p>
                  <p className="mt-0.5 text-neutral-400">
                    {duellSpillNavn(u.spillId, u.modus)} · <span className="font-mono">{u.romkode}</span>
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Link
                    href={duellRomLenke(u.spillId, u.romkode, u.modus)}
                    className="inline-flex h-8 items-center rounded-full bg-neutral-100 px-3 text-xs font-semibold text-[#18191b] transition hover:bg-white"
                  >
                    {t("Gå til rom", "Go to room")}
                  </Link>
                  {u.status === "venter" ? (
                    <button
                      type="button"
                      onClick={() => void svarPaUtfordring(u, "avbryt")}
                      className="text-xs text-neutral-400 hover:text-white"
                    >
                      {t("Avbryt", "Cancel")}
                    </button>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {/* 2. Visual Game Showcase — pick once, launch or challenge below */}
      <section aria-label={t("Velg duellspill", "Choose duel game")} className="grid gap-3 sm:grid-cols-3">
        {ARENA_SPILL.map((s) => {
          const valgt = s.id === valgtSpill
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => {
                setValgtSpill(s.id)
                if (s.id !== "67-stegern") setValgtModus("runder")
                setKodeFeil(false)
              }}
              aria-pressed={valgt}
              className={`group flex flex-col justify-between gap-4 rounded-[24px] border p-5 text-left transition ${
                valgt
                  ? s.rammeAktiv
                  : "border-white/[0.08] bg-[#26282c] hover:-translate-y-0.5 hover:border-white/20 hover:bg-[#2c2f34]"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <span className={`inline-flex h-10 w-10 items-center justify-center rounded-2xl ${s.ikonBg}`}>
                  <SpillIkon id={s.id} />
                </span>
                <span className={`rounded-full border px-2.5 py-0.5 font-mono text-[10px] font-semibold ${s.merkeStil}`}>
                  {t(s.merke, s.merkeEn)}
                </span>
              </div>
              <div>
                <div className="flex items-center justify-between gap-2">
                  <h2 className="text-lg font-bold tracking-[-0.02em] text-neutral-50">{t(s.navn, s.navnEn)}</h2>
                  <span className="font-mono text-[10px] text-neutral-400">{t(s.spillere, s.spillereEn)}</span>
                </div>
                <p className="mt-1.5 text-xs leading-5 text-neutral-300">{t(s.kort, s.kortEn)}</p>
              </div>
            </button>
          )
        })}
      </section>

      {/* 3. Unified Launch Deck for the selected game */}
      <section className="rounded-[28px] border border-white/[0.08] bg-[#26282c] p-5 sm:p-6">
        {valgtSpill === "67-stegern" ? (
          <div className="mb-5 grid gap-2.5 sm:grid-cols-2">
            {DUELL_MODUS_VALG["67-stegern"].map((m) => {
              const aktiv = valgtModus === m.id
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setValgtModus(m.id)}
                  aria-pressed={aktiv}
                  className={`flex items-start gap-3 rounded-2xl border px-4 py-3 text-left transition ${
                    aktiv
                      ? "border-amber-400/50 bg-amber-400/15 text-amber-100"
                      : "border-white/10 bg-[#18191b] text-neutral-300 hover:border-white/25"
                  }`}
                >
                  <Zap className={`mt-0.5 h-4 w-4 shrink-0 ${aktiv ? "text-amber-300" : "text-neutral-500"}`} aria-hidden="true" />
                  <div>
                    <p className="text-xs font-semibold">
                      {m.id === "runder" ? t("Vanlig duell", "Classic duel") : t("Startpistolen", "Starter Pistol")}
                    </p>
                    <p className="mt-0.5 text-[11px] opacity-80">
                      {m.id === "runder"
                        ? t("5 spørsmål samtidig, lengste hopp vinner", "5 simultaneous rounds, longest leap wins")
                        : t("Varm potet med skjult lunte og liv", "Hot potato with hidden fuse and lives")}
                    </p>
                  </div>
                </button>
              )
            })}
          </div>
        ) : null}

        <div className="grid gap-5 md:grid-cols-2">
          {/* Left: Instant Open Room + Join by 4-letter code */}
          <div className="flex flex-col justify-between gap-4 rounded-2xl border border-white/[0.06] bg-[#1b1c1f] p-4 sm:p-5">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold text-neutral-200">
                <KeyRound className="h-4 w-4 text-neutral-400" aria-hidden="true" />
                <span>{t("Åpent rom med kode", "Open room with code")}</span>
                <span className="ml-auto rounded-full bg-white/[0.06] px-2 py-0.5 font-mono text-[10px] text-neutral-400">
                  {t("Ingen konto", "No account")}
                </span>
              </div>
              <p className="mt-1.5 text-xs leading-5 text-neutral-400">
                {t(
                  "Opprett et privat rom og del koden eller lenka. Hvem som helst kan bli med med én gang.",
                  "Create a private room and share the code or link. Anyone can join right away.",
                )}
              </p>

              <button
                type="button"
                onClick={lagApenRom}
                className={`mt-4 inline-flex h-11 w-full items-center justify-center gap-2 rounded-full px-5 text-sm font-bold transition ${aktivtSpill.knappStil}`}
              >
                <Plus className="h-4 w-4" aria-hidden="true" />
                <span>
                  {t("Start nytt", "Create new")} {t(aktivtSpill.navn, aktivtSpill.navnEn)}-{t("rom", "room")}
                </span>
              </button>
            </div>

            <div className="border-t border-white/[0.07] pt-4">
              <p className="text-[11px] font-medium text-neutral-400">
                {t("Har du fått en 4-bokstavers kode?", "Already have a 4-letter code?")}
              </p>
              <form onSubmit={bliMedMedKode} className="mt-2 flex gap-2">
                <input
                  value={romkode}
                  onChange={(e) => {
                    setRomkode(normaliserKode(e.target.value).slice(0, 4))
                    setKodeFeil(false)
                  }}
                  maxLength={4}
                  placeholder="BCDF"
                  autoComplete="off"
                  autoCapitalize="characters"
                  spellCheck={false}
                  aria-label={t("Romkode", "Room code")}
                  className="h-10 w-28 rounded-full border border-white/15 bg-black/35 px-3 text-center font-mono text-base font-bold tracking-[0.22em] text-neutral-100 uppercase outline-none placeholder:text-neutral-600 focus:border-white/40"
                />
                <button
                  type="submit"
                  className="inline-flex h-10 flex-1 items-center justify-center gap-1.5 rounded-full border border-white/15 bg-white/[0.06] px-4 text-xs font-semibold text-neutral-100 transition hover:bg-white/15"
                >
                  <span>{t("Bli med i rom", "Join room")}</span>
                  <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
              </form>
              {kodeFeil ? (
                <p className="mt-2 text-xs text-rose-400">
                  {t("Koden består av 4 konsonanter (uten vokaler).", "Codes use 4 consonants (no vowels).")}
                </p>
              ) : null}
            </div>
          </div>

          {/* Right: 1-Click Direct Friend Challenge */}
          <div className="flex flex-col justify-between gap-4 rounded-2xl border border-white/[0.06] bg-[#1b1c1f] p-4 sm:p-5">
            <div>
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-xs font-semibold text-neutral-200">
                  <Swords className="h-4 w-4 text-neutral-400" aria-hidden="true" />
                  <span>{t("Utfordre en venn på 1 klikk", "1-click friend challenge")}</span>
                </div>
                {innlogget && varselStatus === "default" && !harAktiveUtfordringer ? (
                  <button
                    type="button"
                    onClick={() => void beOmVarsler()}
                    className="inline-flex h-6 items-center gap-1 rounded-full border border-white/10 bg-white/[0.04] px-2 text-[10px] font-medium text-neutral-300 transition hover:bg-white/10"
                  >
                    <Bell className="h-3 w-3 text-amber-300" aria-hidden="true" />
                    <span>{t("Varsler", "Alerts")}</span>
                  </button>
                ) : null}
              </div>

              {!innlogget ? (
                <div className="mt-3 flex flex-col gap-3">
                  <p className="text-xs leading-5 text-neutral-400">
                    {t(
                      "Du trenger ikke konto for åpne rom, men med innlogging kan du sende direkte pop-up-utfordringer til vennene dine.",
                      "No account is needed for open rooms, but signing in unlocks 1-click pop-up challenges to friends.",
                    )}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Link
                      href="/logg-inn?next=%2Fspill%2Fdueller"
                      className="inline-flex h-9 items-center rounded-full bg-neutral-100 px-4 text-xs font-semibold text-[#18191b] transition hover:bg-white"
                    >
                      {t("Logg inn", "Sign in")}
                    </Link>
                    <Link
                      href="/registrer?next=%2Fspill%2Fdueller"
                      className="inline-flex h-9 items-center rounded-full border border-white/15 px-4 text-xs font-medium text-neutral-200 transition hover:bg-white/10"
                    >
                      {t("Lag konto", "Create account")}
                    </Link>
                  </div>
                </div>
              ) : laster ? (
                <p className="mt-3 text-xs text-neutral-400">{t("Henter venneliste…", "Loading friends…")}</p>
              ) : venner.length === 0 ? (
                <div className="mt-3">
                  <p className="text-xs leading-5 text-neutral-400">
                    {t(
                      "Legg til venner for å sende dem direkte duell-varsler i sanntid.",
                      "Add friends to send them instant real-time duel invites.",
                    )}
                  </p>
                  <Link
                    href="/spill/venner"
                    className="mt-3 inline-flex h-9 items-center gap-1.5 rounded-full border border-white/15 bg-white/[0.04] px-3.5 text-xs font-medium text-neutral-100 transition hover:bg-white/10"
                  >
                    <UserPlus className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>{t("Legg til venner", "Add friends")}</span>
                  </Link>
                </div>
              ) : (
                <>
                  <p className="mt-1.5 text-xs leading-5 text-neutral-400">
                    {t(
                      `Trykk på en venn for å sende live ${aktivtSpill.navn}-utfordring og åpne rommet med én gang.`,
                      `Tap a friend to send a live ${aktivtSpill.navnEn} invite and open the room immediately.`,
                    )}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {venner.map((v) => {
                      const sender = senderTilId === v.brukerId
                      return (
                        <button
                          key={v.brukerId}
                          type="button"
                          disabled={senderTilId !== null}
                          onClick={() => void utfordreVenn(v.brukerId)}
                          className="group inline-flex h-10 items-center gap-2 rounded-full border border-white/12 bg-[#26282c] pr-3.5 pl-3 text-xs font-semibold text-neutral-100 transition hover:border-white/30 hover:bg-white/10 disabled:opacity-50"
                        >
                          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/[0.08] font-mono text-[10px] font-bold text-neutral-200 uppercase">
                            {v.visningsnavn.slice(0, 1)}
                          </span>
                          <span>{v.visningsnavn}</span>
                          {sender ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin text-neutral-300" aria-hidden="true" />
                          ) : (
                            <Swords className="h-3.5 w-3.5 text-neutral-400 transition group-hover:text-white" aria-hidden="true" />
                          )}
                        </button>
                      )
                    })}
                  </div>
                </>
              )}
            </div>

            {innlogget && venner.length > 0 ? (
              <div className="flex items-center justify-between border-t border-white/[0.07] pt-3 text-[11px] text-neutral-400">
                <span className="inline-flex items-center gap-1.5">
                  <Users className="h-3.5 w-3.5" aria-hidden="true" />
                  {venner.length} {venner.length === 1 ? t("venn", "friend") : t("venner", "friends")}
                </span>
                <Link href="/spill/venner" className="font-medium text-neutral-200 hover:text-white hover:underline">
                  {t("Administrer venner →", "Manage friends →")}
                </Link>
              </div>
            ) : null}
          </div>
        </div>
      </section>

      {/* 4. Chess for 2 quick link — keeps all multiplayer duels connected */}
      <a
        href="/sjakk"
        className="group flex flex-wrap items-center justify-between gap-3 rounded-[24px] border border-white/[0.07] bg-[#26282c] px-5 py-4 transition hover:border-white/20 hover:bg-[#2c2f34]"
      >
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-400/15 text-amber-300">
            <Crown className="h-5 w-5" aria-hidden="true" />
          </span>
          <div>
            <p className="text-sm font-semibold text-neutral-100">{t("Sjakk for 2", "Chess for 2")}</p>
            <p className="text-xs text-neutral-400">
              {t(
                "Lyst på et sjakkparti? Lag lenke og spill live eller korrespondanse med en venn.",
                "Up for chess? Share a link and play live or correspondence against a friend.",
              )}
            </p>
          </div>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 px-3.5 py-1.5 text-xs font-semibold text-neutral-100 transition group-hover:bg-white/10">
          <span>{t("Åpne Sjakk for 2", "Open Chess for 2")}</span>
          <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
        </span>
      </a>
    </div>
  )
}

"use client"

import { ArrowRight, Check, Swords, X } from "lucide-react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { lyder } from "../lib/lyd"
import {
  duellRomLenke,
  duellSpillNavn,
  velgSynligeUtfordringVarsler,
  type DuellUtfordring,
  type UtfordringVarselKort,
} from "../lib/sosial"
import {
  sendUtfordringerOppdatert,
  sendUtfordringPing,
  useUtfordringerSynk,
  useUtfordringVarsel,
} from "../lib/utfordring-varsel"

const SKJULT_NOKKEL = "thodh:utfordring:skjult"
const POLL_MS = 20_000

function lesSkjulte(): Set<string> {
  try {
    const ra = sessionStorage.getItem(SKJULT_NOKKEL)
    if (!ra) return new Set()
    const liste = JSON.parse(ra) as unknown
    if (!Array.isArray(liste)) return new Set()
    return new Set(liste.filter((x): x is string => typeof x === "string"))
  } catch {
    return new Set()
  }
}

function lagreSkjulte(sett: Set<string>) {
  try {
    sessionStorage.setItem(SKJULT_NOKKEL, JSON.stringify([...sett].slice(-50)))
  } catch {
    // Ignore storage quota / private-mode restrictions.
  }
}

function visNettleserVarsel(tittel: string, tekst: string, onKlikk: () => void) {
  if (typeof window === "undefined" || typeof Notification === "undefined") return
  if (Notification.permission !== "granted" || document.visibilityState === "visible") return
  try {
    const n = new Notification(tittel, { body: tekst, tag: "thodh-utfordring" })
    n.onclick = () => {
      window.focus()
      onKlikk()
      n.close()
    }
  } catch {
    // Ignore Notification API errors on browsers that require a ServiceWorker.
  }
}

export function UtfordringVarsler({
  supabaseUrl,
  supabaseNokkel,
}: {
  supabaseUrl: string
  supabaseNokkel: string
}) {
  const pathname = usePathname() ?? "/"
  const router = useRouter()

  const [brukerId, setBrukerId] = useState<string | null>(null)
  const [innkommende, setInnkommende] = useState<DuellUtfordring[]>([])
  const [utgaende, setUtgaende] = useState<DuellUtfordring[]>([])
  const [skjulteIder, setSkjulteIder] = useState<Set<string>>(() => new Set())
  const [godtatteVarselIder, setGodtatteVarselIder] = useState<Set<string>>(() => new Set())
  const [opptatt, setOpptatt] = useState<Record<string, "godta" | "avsla">>({})
  const [feil, setFeil] = useState<Record<string, string>>({})

  const initialisertRef = useRef(false)
  const settInnIderRef = useRef<Set<string>>(new Set())
  const ventendeUtIderRef = useRef<Set<string>>(new Set())
  const sistHentetRef = useRef(0)
  const forrigeStiRef = useRef(pathname)

  const hent = useCallback(
    async (tving = false) => {
      const na = Date.now()
      if (!tving && na - sistHentetRef.current < 1_500) return
      sistHentetRef.current = na

      try {
        const svar = await fetch("/spill/api/utfordringer", { cache: "no-store" })
        if (svar.status === 401) {
          setBrukerId(null)
          setInnkommende([])
          setUtgaende([])
          initialisertRef.current = false
          settInnIderRef.current.clear()
          ventendeUtIderRef.current.clear()
          return
        }
        if (!svar.ok) return

        const d = (await svar.json()) as {
          brukerId?: string
          innkommende?: DuellUtfordring[]
          utgaende?: DuellUtfordring[]
          antallVentende?: number
        }
        const inn = d.innkommende ?? []
        const ut = d.utgaende ?? []
        const antallVentende =
          typeof d.antallVentende === "number"
            ? d.antallVentende
            : inn.filter((u) => u.status === "venter" && new Date(u.utloperKl).getTime() > Date.now()).length

        if (!initialisertRef.current) {
          setSkjulteIder(lesSkjulte())
        }

        const skjulteNa = lesSkjulte()
        const nyeInn: DuellUtfordring[] = []
        for (const u of inn) {
          if (u.status === "venter" && new Date(u.utloperKl).getTime() > Date.now()) {
            if (initialisertRef.current && !settInnIderRef.current.has(u.id) && !skjulteNa.has(u.id)) {
              nyeInn.push(u)
            }
            settInnIderRef.current.add(u.id)
          }
        }

        const nyligGodtatt: DuellUtfordring[] = []
        for (const u of ut) {
          if (u.status === "venter") {
            ventendeUtIderRef.current.add(u.id)
          } else if (u.status === "godtatt" && ventendeUtIderRef.current.has(u.id)) {
            ventendeUtIderRef.current.delete(u.id)
            nyligGodtatt.push(u)
          }
        }

        initialisertRef.current = true
        setBrukerId(d.brukerId ?? null)
        setInnkommende(inn)
        setUtgaende(ut)

        if (nyligGodtatt.length > 0) {
          setGodtatteVarselIder((prev) => {
            const neste = new Set(prev)
            for (const u of nyligGodtatt) neste.add(u.id)
            return neste
          })
        }

        sendUtfordringerOppdatert(antallVentende, "varsler")

        if (nyeInn.length > 0) {
          lyder.varsel()
          const forste = nyeInn[0]
          visNettleserVarsel(
            `${forste.avsenderNavn} utfordrer deg!`,
            `${duellSpillNavn(forste.spillId, forste.modus)} · Rom ${forste.romkode}`,
            () => router.push("/spill/dueller"),
          )
        } else if (nyligGodtatt.length > 0) {
          lyder.varsel()
          const forste = nyligGodtatt[0]
          visNettleserVarsel(
            `${forste.mottakerNavn} godtok utfordringen!`,
            `${duellSpillNavn(forste.spillId, forste.modus)} · Rom ${forste.romkode}`,
            () => router.push(duellRomLenke(forste.spillId, forste.romkode, forste.modus)),
          )
        }
      } catch {
        // Silent retry on next poll or focus.
      }
    },
    [router],
  )

  // Initial check on mount.
  useEffect(() => {
    const id = window.setTimeout(() => void hent(true), 0)
    return () => window.clearTimeout(id)
  }, [hent])

  // Re-check auth/challenges when leaving login/register/account routes.
  useEffect(() => {
    const forrige = forrigeStiRef.current
    forrigeStiRef.current = pathname
    if (forrige === pathname) return
    const komFraAuth =
      forrige.startsWith("/logg-inn") ||
      forrige.startsWith("/registrer") ||
      forrige.startsWith("/auth") ||
      forrige.startsWith("/konto")
    if (komFraAuth || brukerId) {
      const id = window.setTimeout(() => void hent(komFraAuth), 0)
      return () => window.clearTimeout(id)
    }
  }, [pathname, brukerId, hent])

  // Poll + focus/visibility refresh while logged in.
  useEffect(() => {
    if (!brukerId) return
    const intervall = window.setInterval(() => {
      if (document.visibilityState === "visible") void hent(false)
    }, POLL_MS)
    const vedSynlig = () => {
      if (document.visibilityState === "visible") void hent(false)
    }
    const vedFokus = () => void hent(false)
    document.addEventListener("visibilitychange", vedSynlig)
    window.addEventListener("focus", vedFokus)
    return () => {
      window.clearInterval(intervall)
      document.removeEventListener("visibilitychange", vedSynlig)
      window.removeEventListener("focus", vedFokus)
    }
  }, [brukerId, hent])

  // Instant Realtime wakeup when a friend challenges us or accepts our challenge.
  useUtfordringVarsel(supabaseUrl, supabaseNokkel, brukerId, () => {
    void hent(true)
  })

  // Keep in sync when `/spill/dueller` or another browser tab answers a challenge.
  useUtfordringerSynk((_antall, kilde) => {
    if (kilde !== "varsler") void hent(true)
  })

  const skjulKort = useCallback((kort: UtfordringVarselKort) => {
    const nokkel = kort.type === "godtatt" ? `godtatt:${kort.utfordring.id}` : kort.utfordring.id
    setSkjulteIder((prev) => {
      const neste = new Set(prev)
      neste.add(nokkel)
      lagreSkjulte(neste)
      return neste
    })
  }, [])

  const svarPaUtfordring = useCallback(
    async (u: DuellUtfordring, handling: "godta" | "avsla") => {
      setOpptatt((prev) => ({ ...prev, [u.id]: handling }))
      setFeil((prev) => {
        if (!prev[u.id]) return prev
        const kopi = { ...prev }
        delete kopi[u.id]
        return kopi
      })
      try {
        const svar = await fetch("/spill/api/utfordringer", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: u.id, handling }),
        })
        const d = (await svar.json().catch(() => ({}))) as { lenke?: string; melding?: string }
        if (!svar.ok) {
          if (svar.status === 404) {
            await hent(true)
            return
          }
          setFeil((prev) => ({ ...prev, [u.id]: d.melding ?? "Klarte ikke å svare på utfordringen." }))
          return
        }

        void sendUtfordringPing(supabaseUrl, supabaseNokkel, u.avsenderId)
        setInnkommende((prev) => {
          const neste = prev.filter((x) => x.id !== u.id)
          const antall = neste.filter((x) => x.status === "venter" && new Date(x.utloperKl).getTime() > Date.now()).length
          sendUtfordringerOppdatert(antall, "varsler")
          return neste
        })

        if (handling === "godta" && d.lenke) {
          lyder.velg()
          router.push(d.lenke)
          return
        }
      } catch {
        setFeil((prev) => ({ ...prev, [u.id]: "Nettverksfeil. Prøv igjen." }))
      } finally {
        setOpptatt((prev) => {
          const kopi = { ...prev }
          delete kopi[u.id]
          return kopi
        })
      }
    },
    [hent, router, supabaseNokkel, supabaseUrl],
  )

  const { synlige, skjulteFlere } = useMemo(
    () =>
      velgSynligeUtfordringVarsler({
        pathname,
        innkommende,
        utgaende,
        godtatteVarselIder,
        skjulteIder,
      }),
    [pathname, innkommende, utgaende, godtatteVarselIder, skjulteIder],
  )

  if (synlige.length === 0) return null

  const erSkrivebord = pathname === "/"

  if (erSkrivebord) {
    return (
      <div
        role="region"
        aria-label="Utfordringsvarsler"
        aria-live="polite"
        className="os pointer-events-none fixed z-50 flex flex-col gap-2 max-sm:inset-x-3 max-sm:top-3 sm:right-3 sm:bottom-12 sm:w-[320px]"
      >
        {synlige.map((kort) => {
          const u = kort.utfordring
          const erInn = kort.type === "innkommende"
          const tilstand = opptatt[u.id]
          const feilTekst = feil[u.id]
          return (
            <div key={`${kort.type}:${u.id}`} className="os-ut os-apne pointer-events-auto p-[3px] shadow-[2px_4px_14px_rgba(0,0,0,0.45)]">
              <div className="os-tittellinje flex h-6 items-center gap-1.5 pr-1 pl-1.5 text-[12px] font-bold" data-aktiv="true">
                <Swords className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                <span className="min-w-0 flex-1 truncate">{erInn ? "Ny utfordring!" : "Utfordring godtatt!"}</span>
                <button
                  type="button"
                  onClick={() => skjulKort(kort)}
                  aria-label="Skjul varsel"
                  className="os-knapp flex h-[17px] min-h-0 w-[19px] items-center justify-center p-0 text-[10px] leading-none font-bold text-black"
                >
                  ✕
                </button>
              </div>
              <div className="bg-[var(--os-flate)] px-2.5 pt-2.5 pb-2 text-[12px] text-black">
                <p className="leading-snug font-bold">
                  {erInn ? `${u.avsenderNavn} utfordrer deg!` : `${u.mottakerNavn} ble med i duellen!`}
                </p>
                <p className="mt-1 text-[11px] text-neutral-800">
                  {duellSpillNavn(u.spillId, u.modus)} · Rom <span className="font-mono font-bold">{u.romkode}</span>
                </p>
                {feilTekst ? <p className="mt-1 text-[11px] font-semibold text-rose-700">{feilTekst}</p> : null}
                <div className="mt-2.5 flex items-center justify-end gap-1.5">
                  {erInn ? (
                    <>
                      <button
                        type="button"
                        disabled={Boolean(tilstand)}
                        onClick={() => void svarPaUtfordring(u, "avsla")}
                        className="os-knapp px-2.5 py-0.5 text-[11px] text-black disabled:opacity-60"
                      >
                        {tilstand === "avsla" ? "Avslår…" : "Avslå"}
                      </button>
                      <button
                        type="button"
                        disabled={Boolean(tilstand)}
                        onClick={() => void svarPaUtfordring(u, "godta")}
                        className="os-knapp px-2.5 py-0.5 text-[11px] font-bold text-black outline outline-1 -outline-offset-4 outline-black disabled:opacity-60"
                      >
                        {tilstand === "godta" ? "Åpner…" : "Godta og bli med"}
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        skjulKort(kort)
                        router.push(duellRomLenke(u.spillId, u.romkode, u.modus))
                      }}
                      className="os-knapp px-2.5 py-0.5 text-[11px] font-bold text-black outline outline-1 -outline-offset-4 outline-black"
                    >
                      Åpne rom →
                    </button>
                  )}
                </div>
              </div>
            </div>
          )
        })}

        {skjulteFlere > 0 ? (
          <Link
            href="/spill/dueller"
            className="os-knapp pointer-events-auto self-end text-[11px] font-bold text-black"
          >
            +{skjulteFlere} flere utfordringer →
          </Link>
        ) : null}
      </div>
    )
  }

  return (
    <div
      role="region"
      aria-label="Utfordringsvarsler"
      aria-live="polite"
      className="pointer-events-none fixed z-50 flex flex-col gap-2.5 max-sm:inset-x-3 max-sm:top-3 sm:right-4 sm:bottom-4 sm:w-[348px]"
    >
      {synlige.map((kort) => {
        const u = kort.utfordring
        const erInn = kort.type === "innkommende"
        const tilstand = opptatt[u.id]
        const feilTekst = feil[u.id]
        return (
          <div
            key={`${kort.type}:${u.id}`}
            className={`mel-inn pointer-events-auto rounded-[22px] border p-4 text-neutral-100 shadow-[0_18px_50px_rgba(0,0,0,0.55)] backdrop-blur-md ${
              erInn ? "border-amber-400/40 bg-[#1f2125]/95" : "border-emerald-400/40 bg-[#1d2321]/95"
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <span
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-xl ${
                    erInn ? "bg-amber-400/20 text-amber-300" : "bg-emerald-400/20 text-emerald-300"
                  }`}
                >
                  {erInn ? <Swords className="h-3.5 w-3.5" aria-hidden="true" /> : <Check className="h-3.5 w-3.5" aria-hidden="true" />}
                </span>
                <span
                  className={`inline-flex items-center gap-1.5 text-[11px] font-semibold tracking-[0.06em] uppercase ${
                    erInn ? "text-amber-300" : "text-emerald-300"
                  }`}
                >
                  <span className={`h-1.5 w-1.5 rounded-full ${erInn ? "animate-pulse bg-amber-400" : "bg-emerald-400"}`} />
                  {erInn ? "Ny utfordring" : "Utfordring godtatt"}
                </span>
              </div>
              <button
                type="button"
                onClick={() => skjulKort(kort)}
                aria-label="Skjul varsel"
                className="inline-flex h-7 w-7 items-center justify-center rounded-full text-neutral-400 transition hover:bg-white/10 hover:text-white"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>

            <p className="mt-2.5 text-[15px] leading-snug font-semibold text-white">
              {erInn ? `${u.avsenderNavn} utfordrer deg!` : `${u.mottakerNavn} ble med i duellen!`}
            </p>
            <p className="mt-0.5 text-xs text-neutral-300">
              {duellSpillNavn(u.spillId, u.modus)} · Rom <span className="font-mono font-bold text-white">{u.romkode}</span>
            </p>
            {feilTekst ? <p className="mt-2 text-xs text-rose-300">{feilTekst}</p> : null}

            <div className="mt-3.5 flex items-center gap-2">
              {erInn ? (
                <>
                  <button
                    type="button"
                    disabled={Boolean(tilstand)}
                    onClick={() => void svarPaUtfordring(u, "godta")}
                    className="inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-full bg-emerald-400 px-3.5 text-xs font-semibold text-neutral-950 transition hover:bg-emerald-300 active:scale-[0.98] disabled:opacity-60"
                  >
                    <span>{tilstand === "godta" ? "Åpner…" : "Godta og bli med"}</span>
                    {tilstand !== "godta" ? <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" /> : null}
                  </button>
                  <button
                    type="button"
                    disabled={Boolean(tilstand)}
                    onClick={() => void svarPaUtfordring(u, "avsla")}
                    className="inline-flex h-9 items-center justify-center rounded-full border border-white/15 px-3.5 text-xs font-medium text-neutral-200 transition hover:bg-white/10 disabled:opacity-60"
                  >
                    {tilstand === "avsla" ? "Avslår…" : "Avslå"}
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    skjulKort(kort)
                    router.push(duellRomLenke(u.spillId, u.romkode, u.modus))
                  }}
                  className="inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-full bg-emerald-400 px-3.5 text-xs font-semibold text-neutral-950 transition hover:bg-emerald-300 active:scale-[0.98]"
                >
                  <span>Åpne rom</span>
                  <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
              )}
            </div>
          </div>
        )
      })}

      {skjulteFlere > 0 ? (
        <Link
          href="/spill/dueller"
          className="pointer-events-auto self-end rounded-full border border-white/15 bg-[#1f2125]/95 px-3.5 py-1.5 text-xs font-medium text-neutral-200 shadow-lg backdrop-blur-md transition hover:border-white/30 hover:text-white"
        >
          +{skjulteFlere} flere utfordringer →
        </Link>
      ) : null}
    </div>
  )
}

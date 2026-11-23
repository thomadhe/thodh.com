"use client"

import { Check, Copy, History, LogIn, Swords, Trophy, User, Users } from "lucide-react"
import Link from "next/link"
import { useEffect, useState, type ReactNode } from "react"
import { synkLokaleResultater } from "../lib/resultat-klient"
import { VISNINGSNAVN_MAKS, VISNINGSNAVN_MIN, type ProfilInfo } from "../lib/sosial"
import { useUtfordringerSynk } from "../lib/utfordring-varsel"
import { spillskrift, visningsskrift } from "./skrift"
import { useVisningsnavnSynk, VISNINGSNAVN_HENDELSE, VisningsnavnPille } from "./visningsnavn-pille"

export type AktivFane = "spill" | "historikk" | "ledertavle" | "venner" | "dueller"

const FANER: { id: AktivFane; href: string; navn: string; Ikon: typeof Trophy }[] = [
  { id: "historikk", href: "/spill/historikk", navn: "Historikk", Ikon: History },
  { id: "ledertavle", href: "/spill/ledertavle", navn: "Ledertavle", Ikon: Trophy },
  { id: "venner", href: "/spill/venner", navn: "Venner", Ikon: Users },
  { id: "dueller", href: "/spill/dueller", navn: "Dueller", Ikon: Swords },
]

/** Compact navigation pill bar shown on /spill and all social spill pages, with live friend-request and challenge badges. */
export function SpillSosialNav({ aktiv }: { aktiv: AktivFane }) {
  const [ventende, setVentende] = useState(0)
  const [vennerVentende, setVennerVentende] = useState(0)
  const [innlogget, setInnlogget] = useState<boolean | null>(null)
  const [navn, setNavn] = useState<string | null>(null)
  useVisningsnavnSynk(setNavn)
  useUtfordringerSynk((antall) => setVentende(antall))

  useEffect(() => {
    let aktivt = true
    void fetch("/spill/api/utfordringer", { cache: "no-store" })
      .then(async (r) => {
        if (!aktivt) return
        if (r.status === 401) {
          setInnlogget(false)
          return
        }
        setInnlogget(true)
        void fetch("/spill/api/venner", { cache: "no-store" })
          .then((p) => (p.ok ? p.json() : null))
          .then((d: { profil?: ProfilInfo | null; foresporslerInn?: unknown[] } | null) => {
            if (!aktivt) return
            if (d?.profil?.visningsnavn) setNavn(d.profil.visningsnavn)
            if (Array.isArray(d?.foresporslerInn)) setVennerVentende(d.foresporslerInn.length)
          })
          .catch(() => undefined)
        if (r.ok) {
          const d = (await r.json().catch(() => null)) as { antallVentende?: number } | null
          if (aktivt && typeof d?.antallVentende === "number") setVentende(d.antallVentende)
        }
        // Upload any finished localStorage results silently once per session when logged in.
        void synkLokaleResultater(false).catch(() => undefined)
      })
      .catch(() => undefined)
    return () => {
      aktivt = false
    }
  }, [aktiv])

  return (
    <nav aria-label="Spillmeny" className="flex flex-wrap items-center justify-center gap-2">
      {FANER.map(({ id, href, navn, Ikon }) => {
        const valgt = aktiv === id
        const merke = id === "dueller" ? ventende : id === "venner" ? vennerVentende : 0
        const merkeTekst = id === "dueller" ? `${merke} ventende utfordringer` : `${merke} ventende venneforespørsler`
        return (
          <Link
            key={id}
            href={href}
            aria-current={valgt ? "page" : undefined}
            className={`relative inline-flex h-8 items-center gap-1.5 rounded-full border px-3.5 text-xs font-medium transition ${
              valgt
                ? "border-transparent bg-[#f4f4f5] text-[#18191b]"
                : "border-white/[0.07] bg-[#26282c] text-neutral-300 hover:border-white/20 hover:text-white"
            }`}
          >
            <Ikon className="h-3.5 w-3.5" aria-hidden="true" />
            <span>{navn}</span>
            {merke > 0 ? (
              <span
                className="ml-0.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 font-mono text-[10px] font-bold text-white"
                aria-label={merkeTekst}
              >
                {merke > 9 ? "9+" : merke}
              </span>
            ) : null}
          </Link>
        )
      })}
      {innlogget === true ? (
        <>
          <span aria-hidden="true" className="mx-0.5 hidden h-4 w-px bg-white/10 sm:block" />
          <VisningsnavnPille
            navn={navn}
            onEndret={setNavn}
            plassering="under-midt"
            ikon={<User className="h-3.5 w-3.5 shrink-0 text-white/60" aria-hidden="true" />}
          />
          <Link
            href="/konto"
            className="inline-flex h-8 items-center rounded-full px-2.5 text-xs font-medium text-neutral-400 transition hover:bg-white/[0.06] hover:text-white"
          >
            Konto
          </Link>
        </>
      ) : innlogget === false ? (
        <Link
          href={`/logg-inn?neste=${encodeURIComponent(aktiv === "spill" ? "/spill" : `/spill/${aktiv}`)}`}
          className="inline-flex h-8 items-center gap-1.5 rounded-full border border-white/15 bg-[#26282c] px-3.5 text-xs font-medium text-neutral-200 transition hover:border-white/30 hover:text-white"
        >
          <LogIn className="h-3.5 w-3.5" aria-hidden="true" />
          <span>Logg inn</span>
        </Link>
      ) : null}
    </nav>
  )
}

/** Page shell for /spill/historikk, /spill/ledertavle, /spill/venner and /spill/dueller. */
export function SpillSosialSide({
  aktiv,
  tittel,
  undertittel,
  children,
}: {
  aktiv: AktivFane
  tittel: string
  undertittel: string
  children: ReactNode
}) {
  return (
    <div
      className={`${visningsskrift.variable} ${spillskrift.className} min-h-dvh bg-[#18191b] bg-[radial-gradient(rgb(255_255_255/0.035)_1px,transparent_1px)] bg-[length:22px_22px] text-neutral-100`}
    >
      <div className="mx-auto flex min-h-dvh w-full max-w-4xl flex-col px-4 sm:px-8">
        <header className="flex h-16 items-center justify-between sm:h-20">
          <Link
            href="/spill"
            className="inline-flex h-8 items-center rounded-full px-3 text-xs font-medium text-neutral-400 transition hover:bg-white/[0.06] hover:text-white"
          >
            ← Alle spill
          </Link>
          <Link
            href="/"
            className="inline-flex h-8 items-center rounded-full px-3 text-xs font-medium text-neutral-500 transition hover:bg-white/[0.06] hover:text-white"
          >
            thodh.com
          </Link>
        </header>
        <main className="flex flex-1 flex-col gap-7 pt-2 pb-16">
          <div className="text-center">
            <h1 className="text-[2.1rem] leading-[1.05] font-semibold tracking-[-0.035em] text-neutral-50 sm:text-[2.9rem]">{tittel}</h1>
            <p className="mx-auto mt-2.5 max-w-md text-[15px] leading-6 text-neutral-400">{undertittel}</p>
          </div>
          <SpillSosialNav aktiv={aktiv} />
          {children}
        </main>
      </div>
    </div>
  )
}

/** Graceful logged-out prompt for social pages. */
export function LoggInnKort({ neste, tittel, tekst }: { neste: string; tittel: string; tekst: string }) {
  const qp = `?neste=${encodeURIComponent(neste)}`
  return (
    <section className="mx-auto w-full max-w-lg rounded-[28px] border border-white/[0.07] bg-[#26282c] p-6 text-center sm:p-8">
      <h2 className="text-xl font-semibold tracking-[-0.02em] text-neutral-50">{tittel}</h2>
      <p className="mt-2 text-sm leading-6 text-neutral-400">{tekst}</p>
      <div className="mt-5 flex flex-wrap justify-center gap-2.5">
        <Link
          href={`/logg-inn${qp}`}
          className="inline-flex h-11 items-center justify-center rounded-full bg-neutral-100 px-6 text-sm font-semibold text-[#18191b] transition hover:bg-white active:scale-[0.98]"
        >
          Logg inn
        </Link>
        <Link
          href={`/registrer${qp}`}
          className="inline-flex h-11 items-center justify-center rounded-full border border-white/15 px-6 text-sm font-medium text-neutral-200 transition hover:border-white/30 hover:bg-white/[0.06]"
        >
          Lag konto
        </Link>
      </div>
    </section>
  )
}

/** Reusable display-name editor (and friend-code preview) used on /konto, /spill/venner and /spill/ledertavle. */
export function VisningsnavnSkjema({
  profil,
  onLagret,
  tema = "mork",
  visKode = true,
}: {
  profil: ProfilInfo | null
  onLagret?: (p: ProfilInfo) => void
  tema?: "mork" | "lys"
  visKode?: boolean
}) {
  const [utkast, setUtkast] = useState<string | null>(null)
  const navn = utkast ?? profil?.visningsnavn ?? ""
  const [lagrer, setLagrer] = useState(false)
  const [melding, setMelding] = useState<string | null>(null)
  const [feil, setFeil] = useState<string | null>(null)
  const [kopiert, setKopiert] = useState(false)

  const lagre = async (e: React.FormEvent) => {
    e.preventDefault()
    setLagrer(true)
    setFeil(null)
    setMelding(null)
    try {
      const svar = await fetch("/spill/api/profil", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ visningsnavn: navn }),
      })
      const data = (await svar.json().catch(() => ({}))) as { profil?: ProfilInfo; melding?: string }
      if (!svar.ok || !data.profil) {
        setFeil(data.melding ?? "Klarte ikke å lagre visningsnavnet.")
        return
      }
      setUtkast(null)
      setMelding("Lagret!")
      if (data.profil.visningsnavn) {
        window.dispatchEvent(new CustomEvent(VISNINGSNAVN_HENDELSE, { detail: data.profil.visningsnavn }))
      }
      // Mirror display name to duel lobby default if user hasn't set a custom duel name yet.
      try {
        if (data.profil.visningsnavn && !localStorage.getItem("stegern:duell:navn")) {
          localStorage.setItem("stegern:duell:navn", data.profil.visningsnavn)
        }
      } catch {
        // Ignore storage errors.
      }
      onLagret?.(data.profil)
    } catch {
      setFeil("Nettverksfeil. Prøv igjen.")
    } finally {
      setLagrer(false)
    }
  }

  const kopierKode = async () => {
    if (!profil?.vennekode) return
    try {
      await navigator.clipboard.writeText(profil.vennekode)
      setKopiert(true)
      window.setTimeout(() => setKopiert(false), 1800)
    } catch {
      // Ignore clipboard failure.
    }
  }

  const lys = tema === "lys"
  return (
    <div className="space-y-3">
      <form onSubmit={lagre} className="flex flex-wrap items-center gap-2">
        <input
          value={navn}
          onChange={(e) => {
            setUtkast(e.target.value)
            setMelding(null)
            setFeil(null)
          }}
          minLength={VISNINGSNAVN_MIN}
          maxLength={VISNINGSNAVN_MAKS}
          placeholder="Velg et visningsnavn (f.eks. Ola)"
          aria-label="Visningsnavn"
          className={`h-10 min-w-0 flex-1 rounded-full border px-4 text-sm outline-none transition ${
            lys
              ? "border-neutral-300 bg-white text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-900"
              : "border-white/15 bg-black/25 text-neutral-100 placeholder:text-neutral-500 focus:border-white/40"
          }`}
        />
        <button
          type="submit"
          disabled={lagrer || navn.trim().length < VISNINGSNAVN_MIN}
          className={`inline-flex h-10 items-center justify-center rounded-full px-5 text-sm font-semibold transition disabled:opacity-45 ${
            lys ? "bg-neutral-900 text-white hover:bg-neutral-800" : "bg-neutral-100 text-[#18191b] hover:bg-white"
          }`}
        >
          {lagrer ? "Lagrer…" : profil?.visningsnavn ? "Oppdater" : "Lagre navn"}
        </button>
      </form>
      {feil ? <p className={`text-xs ${lys ? "text-rose-600" : "text-rose-400"}`}>{feil}</p> : null}
      {melding ? <p className={`text-xs ${lys ? "text-emerald-700" : "text-emerald-400"}`}>{melding}</p> : null}
      {visKode && profil?.vennekode ? (
        <div
          className={`flex flex-wrap items-center justify-between gap-2 rounded-2xl border px-4 py-2.5 text-xs ${
            lys ? "border-neutral-200 bg-neutral-50 text-neutral-700" : "border-white/10 bg-black/20 text-neutral-300"
          }`}
        >
          <span>
            Din vennekode:{" "}
            <strong className={`font-mono text-sm tracking-widest ${lys ? "text-neutral-950" : "text-white"}`}>
              {profil.vennekode}
            </strong>
          </span>
          <button
            type="button"
            onClick={kopierKode}
            className={`inline-flex items-center gap-1 rounded-full px-3 py-1 font-medium transition ${
              lys ? "bg-neutral-200 text-neutral-900 hover:bg-neutral-300" : "bg-white/10 text-neutral-100 hover:bg-white/15"
            }`}
          >
            {kopiert ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            {kopiert ? "Kopiert" : "Kopier kode"}
          </button>
        </div>
      ) : null}
    </div>
  )
}

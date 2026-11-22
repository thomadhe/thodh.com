"use client"

import { Check, Copy, History, LogIn, Swords, Trophy, User, Users } from "lucide-react"
import Link from "next/link"
import { useEffect, useState, type ReactNode } from "react"
import { synkLokaleResultater } from "../lib/resultat-klient"
import { VISNINGSNAVN_MAKS, VISNINGSNAVN_MIN, type ProfilInfo } from "../lib/sosial"
import { visningsskrift } from "./skrift"

export type AktivFane = "spill" | "historikk" | "ledertavle" | "venner" | "dueller"

const FANER: { id: AktivFane; href: string; navn: string; Ikon: typeof Trophy }[] = [
  { id: "historikk", href: "/spill/historikk", navn: "Historikk", Ikon: History },
  { id: "ledertavle", href: "/spill/ledertavle", navn: "Ledertavle", Ikon: Trophy },
  { id: "venner", href: "/spill/venner", navn: "Venner", Ikon: Users },
  { id: "dueller", href: "/spill/dueller", navn: "Dueller", Ikon: Swords },
]

/** Compact navigation pill bar shown on /spill and all social spill pages, with live pending challenge badge. */
export function SpillSosialNav({ aktiv }: { aktiv: AktivFane }) {
  const [ventende, setVentende] = useState(0)
  const [innlogget, setInnlogget] = useState<boolean | null>(null)

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
        return (
          <Link
            key={id}
            href={href}
            aria-current={valgt ? "page" : undefined}
            className={`relative inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-medium transition ${
              valgt
                ? "border-white/30 bg-neutral-100 text-[#18191b]"
                : "border-white/10 bg-white/[0.04] text-neutral-300 hover:border-white/20 hover:bg-white/[0.08] hover:text-white"
            }`}
          >
            <Ikon className="h-3.5 w-3.5" aria-hidden="true" />
            <span>{navn}</span>
            {id === "dueller" && ventende > 0 ? (
              <span
                className="ml-0.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 font-mono text-[10px] font-bold text-white"
                aria-label={`${ventende} ventende utfordringer`}
              >
                {ventende}
              </span>
            ) : null}
          </Link>
        )
      })}
      {innlogget === true ? (
        <Link
          href="/konto"
          className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-3.5 py-1.5 text-xs font-medium text-neutral-300 transition hover:border-white/20 hover:bg-white/[0.08] hover:text-white"
        >
          <User className="h-3.5 w-3.5" aria-hidden="true" />
          <span>Konto</span>
        </Link>
      ) : innlogget === false ? (
        <Link
          href={`/logg-inn?neste=${encodeURIComponent(aktiv === "spill" ? "/spill" : `/spill/${aktiv}`)}`}
          className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/[0.06] px-3.5 py-1.5 text-xs font-medium text-neutral-200 transition hover:border-white/30 hover:bg-white/[0.12] hover:text-white"
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
    <div className={`${visningsskrift.variable} min-h-dvh bg-[#18191b] text-neutral-100`}>
      <div className="mx-auto flex min-h-dvh w-full max-w-4xl flex-col px-5 sm:px-8">
        <header className="flex h-20 items-center justify-between">
          <Link href="/spill" className="font-mono text-xs text-neutral-400 transition hover:text-white">
            ← Alle spill
          </Link>
          <Link href="/" className="font-mono text-xs text-neutral-400 transition hover:text-white">
            thodh.com
          </Link>
        </header>
        <main className="flex flex-1 flex-col gap-6 pt-2 pb-16">
          <div className="text-center">
            <h1 className="font-[family-name:var(--font-visning)] text-[2rem] leading-tight font-extrabold tracking-[-0.04em] text-neutral-50 sm:text-[2.75rem]">
              {tittel}
            </h1>
            <p className="mt-1.5 text-sm text-neutral-400">{undertittel}</p>
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
    <section className="mx-auto w-full max-w-lg rounded-2xl border border-white/10 bg-[#232529] p-6 text-center">
      <h2 className="text-lg font-semibold text-neutral-50">{tittel}</h2>
      <p className="mt-2 text-sm leading-6 text-neutral-400">{tekst}</p>
      <div className="mt-5 flex flex-wrap justify-center gap-2.5">
        <Link
          href={`/logg-inn${qp}`}
          className="inline-flex h-10 items-center justify-center rounded-xl bg-neutral-100 px-5 text-sm font-semibold text-[#18191b] transition hover:bg-white"
        >
          Logg inn
        </Link>
        <Link
          href={`/registrer${qp}`}
          className="inline-flex h-10 items-center justify-center rounded-xl border border-white/15 px-5 text-sm font-medium text-neutral-200 transition hover:border-white/30 hover:bg-white/[0.06]"
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
        method: "PUT",
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
          className={`h-10 min-w-0 flex-1 rounded-xl border px-3.5 text-sm outline-none transition ${
            lys
              ? "border-neutral-300 bg-white text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-900"
              : "border-white/15 bg-black/25 text-neutral-100 placeholder:text-neutral-500 focus:border-white/40"
          }`}
        />
        <button
          type="submit"
          disabled={lagrer || navn.trim().length < VISNINGSNAVN_MIN}
          className={`inline-flex h-10 items-center justify-center rounded-xl px-4 text-sm font-semibold transition disabled:opacity-45 ${
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
          className={`flex flex-wrap items-center justify-between gap-2 rounded-xl border px-3.5 py-2.5 text-xs ${
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
            className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 font-medium transition ${
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

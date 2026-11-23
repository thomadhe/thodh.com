"use client"

import { ArrowRight, KeyRound, Plus, Swords, Users } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useCallback, useEffect, useState } from "react"
import { erGyldigKode, lagKode, normaliserKode } from "../lib/duell/rom"
import {
  DUELL_MODUS_VALG,
  DUELL_SPILL,
  duellRomLenke,
  duellSpillKortNavn,
  duellSpillNavn,
  type DuellModus,
  type DuellSpillId,
  type DuellUtfordring,
  type VennOppforing,
} from "../lib/sosial"
import { sendUtfordringPing, useUtfordringVarsel } from "../lib/utfordring-varsel"
import { LoggInnKort } from "./spill-sosial-ramme"

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

  // Open room-by-code flow (works both logged out and logged in)
  const [kodeSpill, setKodeSpill] = useState<DuellSpillId>("67-stegern")
  const [kodeModus, setKodeModus] = useState<DuellModus>("runder")
  const [romkode, setRomkode] = useState("")
  const [kodeFeil, setKodeFeil] = useState(false)

  // Friend challenges flow
  const [brukerId, setBrukerId] = useState<string | null>(null)
  const [innkommende, setInnkommende] = useState<DuellUtfordring[]>([])
  const [utgaende, setUtgaende] = useState<DuellUtfordring[]>([])
  const [venner, setVenner] = useState<VennOppforing[]>([])
  const [valgtVenn, setValgtVenn] = useState("")
  const [vennSpill, setVennSpill] = useState<DuellSpillId>("67-stegern")
  const [vennModus, setVennModus] = useState<DuellModus>("runder")
  const [opptatt, setOpptatt] = useState(false)
  const [laster, setLaster] = useState(innlogget)
  const [feil, setFeil] = useState<string | null>(null)

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
          melding?: string
        }
        setBrukerId(u.brukerId ?? null)
        setInnkommende(u.innkommende ?? [])
        setUtgaende(u.utgaende ?? [])
        if (u.melding) setFeil(u.melding)
      }
      if (vSvar.ok) {
        const v = (await vSvar.json()) as { venner?: VennOppforing[] }
        const liste = v.venner ?? []
        setVenner(liste)
        setValgtVenn((prev) => prev || liste[0]?.brukerId || "")
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
              melding?: string
            }
            if (!aktiv) return
            setBrukerId(u.brukerId ?? null)
            setInnkommende(u.innkommende ?? [])
            setUtgaende(u.utgaende ?? [])
            if (u.melding) setFeil(u.melding)
          }
          if (vSvar.ok) {
            const v = (await vSvar.json()) as { venner?: VennOppforing[] }
            if (!aktiv) return
            const liste = v.venner ?? []
            setVenner(liste)
            setValgtVenn((prev) => prev || liste[0]?.brukerId || "")
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

  const lagApenRom = () => {
    const k = lagKode()
    const modus = kodeSpill === "67-stegern" ? kodeModus : "runder"
    router.push(duellRomLenke(kodeSpill, k, modus))
  }

  const bliMedMedKode = (e: React.FormEvent) => {
    e.preventDefault()
    const k = normaliserKode(romkode)
    if (!erGyldigKode(k)) {
      setKodeFeil(true)
      return
    }
    router.push(duellRomLenke(kodeSpill, k, "runder"))
  }

  const sendVenneutfordring = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!valgtVenn) return
    setOpptatt(true)
    setFeil(null)
    try {
      const modus: DuellModus = vennSpill === "67-stegern" ? vennModus : "runder"
      const svar = await fetch("/spill/api/utfordringer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mottakerId: valgtVenn, spillId: vennSpill, modus }),
      })
      const d = (await svar.json().catch(() => ({}))) as { lenke?: string; melding?: string }
      if (!svar.ok || !d.lenke) {
        setFeil(d.melding ?? "Klarte ikke å opprette utfordringen.")
        return
      }
      void sendUtfordringPing(supabaseUrl, supabaseNokkel, valgtVenn)
      router.push(d.lenke)
    } catch {
      setFeil("Nettverksfeil. Prøv igjen.")
    } finally {
      setOpptatt(false)
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
      setFeil(d.melding ?? "Klarte ikke å oppdatere utfordringen.")
      return
    }
    const motpartId = handling === "avbryt" ? u.mottakerId : u.avsenderId
    void sendUtfordringPing(supabaseUrl, supabaseNokkel, motpartId)
    if (handling === "godta" && d.lenke) {
      router.push(d.lenke)
      return
    }
    await hentAlt()
  }

  const ventendeInn = innkommende.filter((u) => u.status === "venter")
  const aktiveInn = innkommende.filter((u) => u.status === "godtatt")
  const aktiveUt = utgaende.filter((u) => u.status === "venter" || u.status === "godtatt")

  return (
    <div className="grid gap-5 md:grid-cols-2">
      {/* Left column: Open room with 4-letter code (anyone can join, no account needed) */}
      <section className="flex flex-col gap-4 rounded-[28px] border border-white/[0.07] bg-[#26282c] p-5 sm:p-6">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/[0.06] text-neutral-200">
            <KeyRound className="h-4 w-4" />
          </span>
          <div>
            <h2 className="text-[1.05rem] font-semibold tracking-[-0.01em] text-neutral-50">Åpent duellrom med kode</h2>
            <p className="text-xs text-neutral-400">Hvem som helst med koden kan bli med – ingen innlogging kreves.</p>
          </div>
        </div>

        <div className="flex gap-2">
          {DUELL_SPILL.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => {
                setKodeSpill(s)
                if (s !== "67-stegern") setKodeModus("runder")
                setKodeFeil(false)
              }}
              className={`flex-1 rounded-full border px-3 py-2 text-xs font-semibold transition ${
                kodeSpill === s
                  ? "border-white/30 bg-neutral-100 text-[#18191b]"
                  : "border-white/10 bg-[#18191b] text-neutral-300 hover:border-white/25"
              }`}
            >
              {duellSpillKortNavn(s)}
            </button>
          ))}
        </div>

        {kodeSpill === "67-stegern" ? (
          <div className="grid grid-cols-2 gap-2">
            {DUELL_MODUS_VALG["67-stegern"].map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setKodeModus(m.id)}
                className={`rounded-2xl border px-3 py-2 text-left transition ${
                  kodeModus === m.id
                    ? "border-amber-400/50 bg-amber-400/15 text-amber-100"
                    : "border-white/10 bg-[#18191b] text-neutral-400 hover:border-white/20"
                }`}
              >
                <p className="text-xs font-semibold">{m.navn}</p>
                <p className="mt-0.5 text-[11px] opacity-80">{m.kort}</p>
              </button>
            ))}
          </div>
        ) : kodeSpill === "moggern" ? (
          <p className="rounded-2xl border border-white/[0.06] bg-[#18191b] px-3.5 py-2.5 text-xs text-neutral-400">
            1v1 kameraduell kun for venner (maks 2 spillere) – krever innlogging for å slå på kamera. Video går direkte peer-to-peer.
          </p>
        ) : (
          <p className="rounded-2xl border border-white/[0.06] bg-[#18191b] px-3.5 py-2.5 text-xs text-neutral-400">
            5 tallspørsmål fra tidligere dager – nærmest fasit vinner. 2–6 spillere.
          </p>
        )}

        <button
          type="button"
          onClick={lagApenRom}
          className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-full bg-neutral-100 px-4 text-sm font-semibold text-[#18191b] transition hover:bg-white"
        >
          <Plus className="h-4 w-4" />
          <span>Lag nytt rom og få kode</span>
        </button>

        <div className="border-t border-white/[0.08] pt-4">
          <p className="text-xs font-medium text-neutral-300">Har du allerede en 4-bokstavers kode?</p>
          <form onSubmit={bliMedMedKode} className="mt-2 flex gap-2">
            <input
              value={romkode}
              onChange={(e) => {
                setRomkode(normaliserKode(e.target.value).slice(0, 4))
                setKodeFeil(false)
              }}
              maxLength={4}
              placeholder="KODE"
              autoComplete="off"
              autoCapitalize="characters"
              spellCheck={false}
              aria-label="Romkode"
              className="h-10 w-28 rounded-full border border-white/15 bg-black/25 px-3 text-center font-mono text-base font-bold tracking-[0.2em] text-neutral-100 uppercase outline-none placeholder:text-neutral-500 focus:border-white/40"
            />
            <button
              type="submit"
              className="inline-flex h-10 flex-1 items-center justify-center gap-1.5 rounded-full border border-white/15 bg-white/[0.05] px-4 text-sm font-semibold text-neutral-100 transition hover:bg-white/10"
            >
              <span>Bli med i rom</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>
          {kodeFeil ? <p className="mt-2 text-xs text-rose-400">Koden består av 4 konsonanter (uten vokaler).</p> : null}
        </div>
      </section>

      {/* Right column: Challenge a friend & pending inbox */}
      <div className="flex flex-col gap-5">
        {!innlogget ? (
          <LoggInnKort
            neste="/spill/dueller"
            tittel="Utfordre venner direkte"
            tekst="Logg inn for å sende duellutfordringer til venner og se ventende invitasjoner her."
          />
        ) : (
          <>
            {/* Pending & accepted inbox */}
            <section className="rounded-[28px] border border-white/[0.07] bg-[#26282c] p-5 sm:p-6">
              <div className="flex items-center justify-between gap-2">
                <h2 className="flex items-center gap-2 text-[1.05rem] font-semibold tracking-[-0.01em] text-neutral-50">
                  <Swords className="h-4 w-4 text-neutral-400" />
                  <span>Utfordringer</span>
                </h2>
                {ventendeInn.length > 0 ? (
                  <span className="rounded-full bg-rose-500 px-2 py-0.5 font-mono text-[11px] font-bold text-white">
                    {ventendeInn.length} ny{ventendeInn.length === 1 ? "" : "e"}
                  </span>
                ) : null}
              </div>

              {feil ? <p className="mt-3 text-xs text-amber-300">{feil}</p> : null}

              {laster ? (
                <p className="mt-3 text-xs text-neutral-400">Sjekker utfordringer…</p>
              ) : ventendeInn.length === 0 && aktiveInn.length === 0 && aktiveUt.length === 0 ? (
                <p className="mt-3 text-xs leading-5 text-neutral-400">
                  Ingen ventende utfordringer akkurat nå. Send en utfordring til en venn under!
                </p>
              ) : (
                <div className="mt-3 flex flex-col gap-2.5">
                  {ventendeInn.map((u) => (
                    <div key={u.id} className="rounded-2xl border border-amber-500/35 bg-amber-500/10 p-3.5">
                      <p className="text-sm font-semibold text-neutral-50">{u.avsenderNavn} utfordrer deg!</p>
                      <p className="mt-0.5 text-xs text-neutral-300">
                        {duellSpillNavn(u.spillId, u.modus)} · Rom <span className="font-mono font-bold">{u.romkode}</span>
                      </p>
                      <div className="mt-3 flex gap-2">
                        <button
                          type="button"
                          onClick={() => void svarPaUtfordring(u, "godta")}
                          className="inline-flex h-8 items-center rounded-full bg-emerald-400 px-3 text-xs font-semibold text-neutral-950 hover:bg-emerald-300"
                        >
                          Godta og bli med
                        </button>
                        <button
                          type="button"
                          onClick={() => void svarPaUtfordring(u, "avsla")}
                          className="inline-flex h-8 items-center rounded-full border border-white/15 px-3 text-xs text-neutral-200 hover:bg-white/10"
                        >
                          Avslå
                        </button>
                      </div>
                    </div>
                  ))}

                  {aktiveInn.map((u) => (
                    <div key={u.id} className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-emerald-500/25 bg-emerald-500/10 p-3">
                      <div className="text-xs">
                        <p className="font-semibold text-neutral-100">Duell mot {u.avsenderNavn}</p>
                        <p className="text-neutral-300">
                          {duellSpillNavn(u.spillId, u.modus)} · <span className="font-mono">{u.romkode}</span>
                        </p>
                      </div>
                      <Link
                        href={duellRomLenke(u.spillId, u.romkode, u.modus)}
                        className="inline-flex h-8 items-center gap-1 rounded-full bg-emerald-400 px-3 text-xs font-semibold text-neutral-950 hover:bg-emerald-300"
                      >
                        <span>Åpne rom</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    </div>
                  ))}

                  {aktiveUt.map((u) => (
                    <div key={u.id} className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-white/10 bg-[#18191b] p-3">
                      <div className="text-xs">
                        <p className="font-semibold text-neutral-100">
                          Til {u.mottakerNavn}{" "}
                          <span
                            className={`ml-1 font-mono text-[10px] uppercase ${
                              u.status === "godtatt" ? "text-emerald-400" : "text-neutral-400"
                            }`}
                          >
                            {u.status === "godtatt" ? "· Godtatt!" : "· Venter"}
                          </span>
                        </p>
                        <p className="text-neutral-400">
                          {duellSpillNavn(u.spillId, u.modus)} · <span className="font-mono">{u.romkode}</span>
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Link
                          href={duellRomLenke(u.spillId, u.romkode, u.modus)}
                          className="inline-flex h-8 items-center rounded-full bg-neutral-100 px-3 text-xs font-semibold text-[#18191b] hover:bg-white"
                        >
                          Gå til rom
                        </Link>
                        {u.status === "venter" ? (
                          <button
                            type="button"
                            onClick={() => void svarPaUtfordring(u, "avbryt")}
                            className="text-xs text-neutral-400 hover:text-white"
                          >
                            Avbryt
                          </button>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Quick challenge a friend */}
            <section className="rounded-[28px] border border-white/[0.07] bg-[#26282c] p-5 sm:p-6">
              <h2 className="flex items-center gap-2 text-[1.05rem] font-semibold tracking-[-0.01em] text-neutral-50">
                <Users className="h-4 w-4 text-neutral-400" />
                <span>Utfordre en venn</span>
              </h2>
              {venner.length === 0 ? (
                <div className="mt-3 text-xs text-neutral-400">
                  <p>Du har ingen venner lagt til ennå.</p>
                  <Link
                    href="/spill/venner"
                    className="mt-3 inline-flex h-9 items-center rounded-full border border-white/15 px-3.5 text-xs font-medium text-neutral-200 hover:bg-white/10"
                  >
                    Legg til venner →
                  </Link>
                </div>
              ) : (
                <form onSubmit={sendVenneutfordring} className="mt-3 flex flex-col gap-3">
                  <label className="text-xs text-neutral-400">
                    Venn
                    <select
                      value={valgtVenn}
                      onChange={(e) => setValgtVenn(e.target.value)}
                      className="mt-1 h-10 w-full rounded-2xl border border-white/15 bg-[#18191b] px-3 text-sm text-neutral-100 outline-none focus:border-white/35"
                    >
                      {venner.map((v) => (
                        <option key={v.brukerId} value={v.brukerId}>
                          {v.visningsnavn}
                        </option>
                      ))}
                    </select>
                  </label>

                  <div className="flex gap-2">
                    {DUELL_SPILL.map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => {
                          setVennSpill(s)
                          if (s !== "67-stegern") setVennModus("runder")
                        }}
                        className={`flex-1 rounded-full border px-3 py-2 text-xs font-semibold transition ${
                          vennSpill === s
                            ? "border-white/30 bg-neutral-100 text-[#18191b]"
                            : "border-white/10 bg-[#18191b] text-neutral-300 hover:border-white/25"
                        }`}
                      >
                        {duellSpillKortNavn(s)}
                      </button>
                    ))}
                  </div>

                  {vennSpill === "67-stegern" ? (
                    <div className="flex gap-2">
                      {DUELL_MODUS_VALG["67-stegern"].map((m) => (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => setVennModus(m.id)}
                          className={`flex-1 rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                            vennModus === m.id
                              ? "border-amber-400/50 bg-amber-400/15 text-amber-100"
                              : "border-white/10 bg-[#18191b] text-neutral-400 hover:border-white/20"
                          }`}
                        >
                          {m.navn}
                        </button>
                      ))}
                    </div>
                  ) : null}

                  <button
                    type="submit"
                    disabled={opptatt || !valgtVenn}
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-full bg-emerald-400 px-4 text-sm font-semibold text-neutral-950 transition hover:bg-emerald-300 disabled:opacity-50"
                  >
                    <Swords className="h-4 w-4" />
                    <span>{opptatt ? "Sender…" : "Send utfordring og åpne rom"}</span>
                  </button>
                </form>
              )}
            </section>
          </>
        )}
      </div>
    </div>
  )
}

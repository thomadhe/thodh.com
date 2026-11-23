"use client"

import { Check, Link2, Swords, Trash2, UserPlus } from "lucide-react"
import { useRouter } from "next/navigation"
import { useCallback, useEffect, useState } from "react"
import {
  DUELL_MODUS_VALG,
  DUELL_SPILL,
  duellSpillKortNavn,
  duellSpillNavn,
  normaliserVennekode,
  type DuellModus,
  type DuellSpillId,
  type ProfilInfo,
  type VennOppforing,
} from "../lib/sosial"
import { sendUtfordringPing } from "../lib/utfordring-varsel"
import { LoggInnKort, VisningsnavnSkjema } from "./spill-sosial-ramme"

export function SpillVenner({
  innlogget,
  startKode,
  supabaseUrl,
  supabaseNokkel,
}: {
  innlogget: boolean
  startKode?: string
  supabaseUrl: string
  supabaseNokkel: string
}) {
  const router = useRouter()
  const [profil, setProfil] = useState<ProfilInfo | null>(null)
  const [venner, setVenner] = useState<VennOppforing[]>([])
  const [inn, setInn] = useState<VennOppforing[]>([])
  const [ut, setUt] = useState<VennOppforing[]>([])
  const [laster, setLaster] = useState(innlogget)
  const [kodeInput, setKodeInput] = useState(startKode ? normaliserVennekode(startKode).slice(0, 6) : "")
  const [sender, setSender] = useState(false)
  const [melding, setMelding] = useState<string | null>(null)
  const [feil, setFeil] = useState<string | null>(null)
  const [kopiertLenke, setKopiertLenke] = useState(false)
  const [utfordreId, setUtfordreId] = useState<string | null>(null)
  const [utfordreSpill, setUtfordreSpill] = useState<DuellSpillId>("67-stegern")
  const [utfordreModus, setUtfordreModus] = useState<DuellModus>("runder")
  const [utfordrerOpptatt, setUtfordrerOpptatt] = useState(false)
  const [bekreftFjern, setBekreftFjern] = useState<string | null>(null)

  const hent = useCallback(async () => {
    if (!innlogget) return
    try {
      const svar = await fetch("/spill/api/venner", { cache: "no-store" })
      const d = (await svar.json().catch(() => ({}))) as {
        profil?: ProfilInfo
        venner?: VennOppforing[]
        foresporslerInn?: VennOppforing[]
        foresporslerUt?: VennOppforing[]
        melding?: string
      }
      if (!svar.ok) {
        setFeil(d.melding ?? "Klarte ikke å hente vennelisten.")
        return
      }
      setProfil(d.profil ?? null)
      setVenner(d.venner ?? [])
      setInn(d.foresporslerInn ?? [])
      setUt(d.foresporslerUt ?? [])
      if (d.melding) setFeil(d.melding)
    } catch {
      setFeil("Nettverksfeil ved henting av venner.")
    } finally {
      setLaster(false)
    }
  }, [innlogget])

  useEffect(() => {
    if (!innlogget) return
    let aktiv = true
    void fetch("/spill/api/venner", { cache: "no-store" })
      .then(async (svar) => {
        const d = (await svar.json().catch(() => ({}))) as {
          profil?: ProfilInfo
          venner?: VennOppforing[]
          foresporslerInn?: VennOppforing[]
          foresporslerUt?: VennOppforing[]
          melding?: string
        }
        if (!aktiv) return
        if (!svar.ok) {
          setFeil(d.melding ?? "Klarte ikke å hente vennelisten.")
          return
        }
        setProfil(d.profil ?? null)
        setVenner(d.venner ?? [])
        setInn(d.foresporslerInn ?? [])
        setUt(d.foresporslerUt ?? [])
        if (d.melding) setFeil(d.melding)
      })
      .catch(() => {
        if (aktiv) setFeil("Nettverksfeil ved henting av venner.")
      })
      .finally(() => {
        if (aktiv) setLaster(false)
      })
    return () => {
      aktiv = false
    }
  }, [innlogget])

  if (!innlogget) {
    const neste = startKode ? "/spill/venner" : "/spill/venner"
    return (
      <LoggInnKort
        neste={neste}
        tittel="Logg inn for å legge til venner"
        tekst={
          startKode
            ? `Logg inn for å legge til vennen din med kode ${normaliserVennekode(startKode).slice(0, 6)}, se venne-ledertavlen og utfordre til duell.`
            : "Del vennekoden din for å sammenligne månedens resultater og utfordre hverandre til dueller i 6/7-stegern, Gjetteløs og Moggern."
        }
      />
    )
  }

  const sendForesporsel = async (e: React.FormEvent) => {
    e.preventDefault()
    setSender(true)
    setFeil(null)
    setMelding(null)
    try {
      const svar = await fetch("/spill/api/venner", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kode: kodeInput }),
      })
      const d = (await svar.json().catch(() => ({}))) as { visningsnavn?: string; melding?: string }
      if (!svar.ok) {
        setFeil(d.melding ?? "Klarte ikke å sende venneforespørsel.")
        return
      }
      setKodeInput("")
      setMelding(`Venneforespørsel sendt til ${d.visningsnavn ?? "spilleren"}!`)
      await hent()
    } catch {
      setFeil("Nettverksfeil. Prøv igjen.")
    } finally {
      setSender(false)
    }
  }

  const godta = async (vennskapId: string) => {
    setFeil(null)
    const svar = await fetch("/spill/api/venner", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ vennskapId, handling: "godta" }),
    })
    if (!svar.ok) {
      const d = (await svar.json().catch(() => ({}))) as { melding?: string }
      setFeil(d.melding ?? "Klarte ikke å godta.")
      return
    }
    await hent()
  }

  const fjern = async (vennskapId: string) => {
    setFeil(null)
    setBekreftFjern(null)
    const svar = await fetch("/spill/api/venner", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ vennskapId }),
    })
    if (!svar.ok) {
      const d = (await svar.json().catch(() => ({}))) as { melding?: string }
      setFeil(d.melding ?? "Klarte ikke å fjerne.")
      return
    }
    await hent()
  }

  const kopierInvitasjonslenke = async () => {
    if (!profil?.vennekode) return
    const lenke = `${window.location.origin}/spill/venner?kode=${profil.vennekode}`
    try {
      await navigator.clipboard.writeText(lenke)
      setKopiertLenke(true)
      window.setTimeout(() => setKopiertLenke(false), 1800)
    } catch {
      // Ignore clipboard failure.
    }
  }

  const sendUtfordring = async (mottakerId: string) => {
    setUtfordrerOpptatt(true)
    setFeil(null)
    try {
      const modus: DuellModus = utfordreSpill === "67-stegern" ? utfordreModus : "runder"
      const svar = await fetch("/spill/api/utfordringer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mottakerId, spillId: utfordreSpill, modus }),
      })
      const d = (await svar.json().catch(() => ({}))) as { lenke?: string; melding?: string }
      if (!svar.ok || !d.lenke) {
        setFeil(d.melding ?? "Klarte ikke å opprette duellen.")
        return
      }
      void sendUtfordringPing(supabaseUrl, supabaseNokkel, mottakerId)
      router.push(d.lenke)
    } catch {
      setFeil("Nettverksfeil. Prøv igjen.")
    } finally {
      setUtfordrerOpptatt(false)
    }
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Own display name & friend code */}
      <section className="rounded-2xl border border-white/[0.08] bg-[#232529] p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-semibold text-neutral-50">Din spillprofil</h2>
            <p className="mt-0.5 text-xs text-neutral-400">
              Visningsnavnet brukes på ledertavler og i vennelister. E-posten din vises aldri.
            </p>
          </div>
          {profil?.vennekode ? (
            <button
              type="button"
              onClick={kopierInvitasjonslenke}
              className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-white/15 bg-white/[0.04] px-3 text-xs font-medium text-neutral-200 transition hover:bg-white/[0.08]"
            >
              {kopiertLenke ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Link2 className="h-3.5 w-3.5" />}
              <span>{kopiertLenke ? "Lenke kopiert!" : "Kopier invitasjonslenke"}</span>
            </button>
          ) : null}
        </div>
        <div className="mt-4">
          <VisningsnavnSkjema profil={profil} onLagret={(p) => setProfil(p)} />
        </div>
      </section>

      {/* Add friend by code */}
      <section className="rounded-2xl border border-white/[0.08] bg-[#232529] p-5">
        <h2 className="flex items-center gap-2 text-base font-semibold text-neutral-50">
          <UserPlus className="h-4 w-4 text-neutral-400" />
          Legg til venn
        </h2>
        <p className="mt-1 text-xs text-neutral-400">Skriv inn vennekoden på 6 tegn fra en annen spiller.</p>
        <form onSubmit={sendForesporsel} className="mt-3 flex flex-wrap gap-2">
          <input
            value={kodeInput}
            onChange={(e) => {
              setKodeInput(normaliserVennekode(e.target.value).slice(0, 6))
              setFeil(null)
              setMelding(null)
            }}
            maxLength={6}
            placeholder="F.eks. K7P3MX"
            autoComplete="off"
            autoCapitalize="characters"
            spellCheck={false}
            aria-label="Vennekode"
            className="h-10 w-44 rounded-xl border border-white/15 bg-black/25 px-3.5 font-mono text-sm tracking-widest text-neutral-100 uppercase outline-none placeholder:font-sans placeholder:tracking-normal placeholder:text-neutral-500 focus:border-white/40"
          />
          <button
            type="submit"
            disabled={sender || kodeInput.length < 6 || !profil?.visningsnavn}
            className="inline-flex h-10 items-center justify-center rounded-xl bg-neutral-100 px-4 text-sm font-semibold text-[#18191b] transition hover:bg-white disabled:opacity-45"
          >
            {sender ? "Sender…" : "Send forespørsel"}
          </button>
        </form>
        {!profil?.visningsnavn && !laster ? (
          <p className="mt-2 text-xs text-amber-300">Lagre et visningsnavn over før du sender venneforespørsler.</p>
        ) : null}
        {feil ? <p className="mt-2 text-xs text-rose-400">{feil}</p> : null}
        {melding ? <p className="mt-2 text-xs text-emerald-400">{melding}</p> : null}
      </section>

      {/* Incoming friend requests */}
      {inn.length > 0 ? (
        <section className="rounded-2xl border border-amber-500/30 bg-[#232529] p-5">
          <h2 className="text-base font-semibold text-neutral-50">Venneforespørsler ({inn.length})</h2>
          <ul className="mt-3 divide-y divide-white/[0.06]">
            {inn.map((f) => (
              <li key={f.vennskapId} className="flex flex-wrap items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                <span className="font-medium text-neutral-100">{f.visningsnavn}</span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => void godta(f.vennskapId)}
                    className="inline-flex h-8 items-center rounded-lg bg-emerald-500 px-3 text-xs font-semibold text-neutral-950 hover:bg-emerald-400"
                  >
                    Godta
                  </button>
                  <button
                    type="button"
                    onClick={() => void fjern(f.vennskapId)}
                    className="inline-flex h-8 items-center rounded-lg border border-white/15 px-3 text-xs font-medium text-neutral-300 hover:bg-white/10"
                  >
                    Avslå
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {/* Friends list */}
      <section className="rounded-2xl border border-white/[0.08] bg-[#232529] p-5">
        <h2 className="text-base font-semibold text-neutral-50">Venner ({venner.length})</h2>
        {laster ? (
          <p className="mt-4 text-sm text-neutral-400">Henter venner…</p>
        ) : venner.length === 0 ? (
          <p className="mt-3 text-sm text-neutral-400">
            Ingen venner lagt til ennå. Del vennekoden eller invitasjonslenken din over!
          </p>
        ) : (
          <ul className="mt-3 divide-y divide-white/[0.06]">
            {venner.map((v) => {
              const apen = utfordreId === v.brukerId
              const bekreft = bekreftFjern === v.vennskapId
              return (
                <li key={v.vennskapId} className="py-3.5 first:pt-1 last:pb-1">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <span className="font-medium text-neutral-100">{v.visningsnavn}</span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setUtfordreId(apen ? null : v.brukerId)}
                        className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-neutral-100 px-3 text-xs font-semibold text-[#18191b] transition hover:bg-white"
                      >
                        <Swords className="h-3.5 w-3.5" />
                        <span>Utfordre</span>
                      </button>
                      {bekreft ? (
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => void fjern(v.vennskapId)}
                            className="inline-flex h-8 items-center rounded-lg bg-rose-500 px-2.5 text-xs font-semibold text-white hover:bg-rose-400"
                          >
                            Fjern
                          </button>
                          <button
                            type="button"
                            onClick={() => setBekreftFjern(null)}
                            className="inline-flex h-8 items-center rounded-lg border border-white/15 px-2.5 text-xs text-neutral-300 hover:bg-white/10"
                          >
                            Avbryt
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setBekreftFjern(v.vennskapId)}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 text-neutral-400 transition hover:border-rose-500/40 hover:text-rose-400"
                          aria-label={`Fjern ${v.visningsnavn}`}
                          title="Fjern venn"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {apen ? (
                    <div className="mt-3 rounded-xl border border-white/10 bg-[#18191b] p-3.5">
                      <p className="text-xs font-medium text-neutral-300">Velg spill for duell mot {v.visningsnavn}:</p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {DUELL_SPILL.map((s) => (
                          <button
                            key={s}
                            type="button"
                            onClick={() => {
                              setUtfordreSpill(s)
                              if (s !== "67-stegern") setUtfordreModus("runder")
                            }}
                            className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
                              utfordreSpill === s
                                ? "border-white/30 bg-neutral-100 text-[#18191b]"
                                : "border-white/10 text-neutral-300 hover:bg-white/5"
                            }`}
                          >
                            {duellSpillKortNavn(s)}
                          </button>
                        ))}
                      </div>
                      {utfordreSpill === "67-stegern" ? (
                        <div className="mt-2.5 flex flex-wrap gap-2">
                          {DUELL_MODUS_VALG["67-stegern"].map((m) => (
                            <button
                              key={m.id}
                              type="button"
                              onClick={() => setUtfordreModus(m.id)}
                              className={`rounded-lg border px-3 py-1.5 text-left text-xs transition ${
                                utfordreModus === m.id
                                  ? "border-amber-400/50 bg-amber-400/15 text-amber-100"
                                  : "border-white/10 text-neutral-400 hover:bg-white/5"
                              }`}
                            >
                              <span className="font-semibold">{m.navn}</span>
                            </button>
                          ))}
                        </div>
                      ) : null}
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          disabled={utfordrerOpptatt}
                          onClick={() => void sendUtfordring(v.brukerId)}
                          className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-emerald-400 px-4 text-xs font-semibold text-neutral-950 transition hover:bg-emerald-300 disabled:opacity-50"
                        >
                          {utfordrerOpptatt
                            ? "Lager rom…"
                            : `Send utfordring (${duellSpillNavn(utfordreSpill, utfordreModus)})`}
                        </button>
                        <button
                          type="button"
                          onClick={() => setUtfordreId(null)}
                          className="inline-flex h-9 items-center rounded-xl px-3 text-xs text-neutral-400 hover:text-white"
                        >
                          Lukk
                        </button>
                      </div>
                    </div>
                  ) : null}
                </li>
              )
            })}
          </ul>
        )}
      </section>

      {/* Outgoing friend requests */}
      {ut.length > 0 ? (
        <section className="rounded-2xl border border-white/[0.08] bg-[#232529] p-5">
          <h2 className="text-sm font-semibold text-neutral-300">Sendte forespørsler ({ut.length})</h2>
          <ul className="mt-2 divide-y divide-white/[0.06]">
            {ut.map((f) => (
              <li key={f.vennskapId} className="flex items-center justify-between py-2.5 text-sm">
                <span className="text-neutral-300">{f.visningsnavn}</span>
                <button
                  type="button"
                  onClick={() => void fjern(f.vennskapId)}
                  className="text-xs text-neutral-400 underline-offset-4 hover:text-white hover:underline"
                >
                  Trekk tilbake
                </button>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  )
}

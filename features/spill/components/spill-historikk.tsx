"use client"

import { ChevronLeft, ChevronRight, RefreshCw, ShieldCheck } from "lucide-react"
import Link from "next/link"
import { useCallback, useEffect, useMemo, useState } from "react"
import { formaterDato, iDagOslo } from "../lib/dag"
import { finnLokaleFerdigeResultater, synkLokaleResultater } from "../lib/resultat-klient"
import {
  flyttManed,
  formaterManed,
  formaterTidSek,
  FORSTE_MANED,
  gjeldendeManed,
  spillEtterId,
  type SpillResultatRad,
} from "../lib/sosial"
import { spill } from "../lib/spill"
import { LoggInnKort } from "./spill-sosial-ramme"

const STATUS_TEKST: Record<SpillResultatRad["status"], { tekst: string; stil: string }> = {
  vunnet: { tekst: "Løst", stil: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30" },
  ferdig: { tekst: "Ferdig", stil: "bg-sky-500/20 text-sky-300 border-sky-500/30" },
  tapt: { tekst: "Ikke løst", stil: "bg-rose-500/20 text-rose-300 border-rose-500/30" },
}

export function SpillHistorikk({ innlogget }: { innlogget: boolean }) {
  const iDag = iDagOslo()
  const denneManeden = gjeldendeManed(iDag)
  const [valgtSpill, setValgtSpill] = useState<string>("alle")
  const [valgtManed, setValgtManed] = useState<string>("alle")
  const [rader, setRader] = useState<SpillResultatRad[]>([])
  const [laster, setLaster] = useState(innlogget)
  const [feil, setFeil] = useState<string | null>(null)
  const [databaseKlar, setDatabaseKlar] = useState(true)
  const [synker, setSynker] = useState(false)
  const [synkMelding, setSynkMelding] = useState<string | null>(null)
  const [lokaltAntall, setLokaltAntall] = useState(0)

  const hent = useCallback(async () => {
    if (!innlogget) return
    try {
      const qs = new URLSearchParams()
      if (valgtSpill !== "alle") qs.set("spill", valgtSpill)
      if (valgtManed !== "alle") qs.set("maned", valgtManed)
      const url = `/spill/api/resultater${qs.size ? `?${qs.toString()}` : ""}`
      const svar = await fetch(url, { cache: "no-store" })
      if (!svar.ok) {
        const d = (await svar.json().catch(() => ({}))) as { melding?: string }
        setFeil(d.melding ?? "Klarte ikke å hente historikken.")
        return
      }
      const d = (await svar.json()) as { resultater: SpillResultatRad[]; databaseKlar?: boolean; melding?: string }
      setFeil(d.melding ?? null)
      setRader(d.resultater ?? [])
      setDatabaseKlar(d.databaseKlar !== false)
    } catch {
      setFeil("Nettverksfeil ved henting av historikk.")
    } finally {
      setLaster(false)
    }
  }, [innlogget, valgtSpill, valgtManed])

  useEffect(() => {
    if (!innlogget) return
    let aktiv = true
    void synkLokaleResultater(false)
      .then((res) => {
        if (!aktiv) return
        setLokaltAntall(res.totalt)
        if (res.lagret > 0) setSynkMelding(`Lastet opp ${res.lagret} lokale resultater til kontoen din.`)
      })
      .catch(() => {
        if (aktiv) setLokaltAntall(finnLokaleFerdigeResultater().length)
      })
      .finally(() => {
        if (aktiv) void hent()
      })
    return () => {
      aktiv = false
    }
  }, [innlogget, hent])

  const synkNa = async () => {
    setSynker(true)
    setSynkMelding(null)
    try {
      const res = await synkLokaleResultater(true)
      setSynkMelding(
        res.lagret > 0
          ? `Lastet opp ${res.lagret} nye resultater fra denne nettleseren.`
          : res.totalt > 0
            ? "Alle lokale resultater er allerede lagret på kontoen."
            : "Fant ingen ferdige lokale spill i denne nettleseren.",
      )
      await hent()
    } catch {
      setSynkMelding("Klarte ikke å laste opp lokale resultater akkurat nå.")
    } finally {
      setSynker(false)
    }
  }

  const oppsummering = useMemo(() => {
    const spilt = rader.length
    const lost = rader.filter((r) => r.status === "vunnet" || r.status === "ferdig").length
    const unikeDager = new Set(rader.map((r) => r.dato)).size
    const unikeSpill = new Set(rader.map((r) => r.spill_id)).size
    return { spilt, lost, unikeDager, unikeSpill }
  }, [rader])

  if (!innlogget) {
    return (
      <LoggInnKort
        neste="/spill/historikk"
        tittel="Logg inn for å se historikken din"
        tekst="Når du er innlogget lagres resultatene dine på kontoen din på tvers av enheter, inkludert gjetninger, tid og hint. Dagens lokale spill lastes opp automatisk når du logger inn."
      />
    )
  }

  return (
    <div className="flex flex-col gap-5">
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { navn: "Spilte runder", verdi: String(oppsummering.spilt) },
          { navn: "Løst / fullført", verdi: String(oppsummering.lost) },
          { navn: "Dager spilt", verdi: String(oppsummering.unikeDager) },
          { navn: "Ulike spill", verdi: String(oppsummering.unikeSpill) },
        ].map((k) => (
          <div key={k.navn} className="rounded-[28px] border border-white/[0.07] bg-[#26282c] px-4 py-3.5 text-center">
            <p className="font-mono text-2xl font-bold tabular-nums text-neutral-50">{k.verdi}</p>
            <p className="mt-1 text-xs text-neutral-400">{k.navn}</p>
          </div>
        ))}
      </section>

      <section className="flex flex-wrap items-center justify-between gap-3 rounded-[28px] border border-white/[0.07] bg-[#26282c] p-4 sm:p-5">
        <div className="flex flex-wrap items-center gap-2">
          <label className="sr-only" htmlFor="historikk-spill">
            Velg spill
          </label>
          <select
            id="historikk-spill"
            value={valgtSpill}
            onChange={(e) => setValgtSpill(e.target.value)}
            className="h-9 rounded-full border border-white/15 bg-[#18191b] px-3 text-sm text-neutral-100 outline-none focus:border-white/35"
          >
            <option value="alle">Alle spill</option>
            {spill.map((s) => (
              <option key={s.id} value={s.id}>
                {s.navn}
              </option>
            ))}
          </select>

          <div className="flex items-center gap-1 rounded-full border border-white/10 bg-[#18191b] px-1.5 py-1">
            {valgtManed === "alle" ? (
              <button
                type="button"
                onClick={() => setValgtManed(denneManeden)}
                className="px-2.5 py-1 text-xs font-medium text-neutral-200 hover:text-white"
              >
                Alle måneder · Filtrer måned
              </button>
            ) : (
              <>
                <button
                  type="button"
                  disabled={valgtManed <= FORSTE_MANED}
                  onClick={() => setValgtManed((m) => flyttManed(m, -1))}
                  className="rounded-full p-1 text-neutral-300 transition hover:bg-white/10 hover:text-white disabled:opacity-30"
                  aria-label="Forrige måned"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span className="min-w-28 text-center text-xs font-medium text-neutral-100">{formaterManed(valgtManed)}</span>
                <button
                  type="button"
                  disabled={valgtManed >= denneManeden}
                  onClick={() => setValgtManed((m) => flyttManed(m, 1))}
                  className="rounded-full p-1 text-neutral-300 transition hover:bg-white/10 hover:text-white disabled:opacity-30"
                  aria-label="Neste måned"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setValgtManed("alle")}
                  className="ml-1 rounded-full px-2 py-0.5 text-[11px] text-neutral-400 hover:bg-white/10 hover:text-white"
                >
                  Alle
                </button>
              </>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={synkNa}
          disabled={synker || !databaseKlar}
          className="inline-flex h-9 items-center gap-1.5 rounded-full border border-white/15 bg-white/[0.04] px-3 text-xs font-medium text-neutral-200 transition hover:bg-white/[0.08] disabled:opacity-45"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${synker ? "animate-spin" : ""}`} />
          <span>Last opp lokale ({lokaltAntall})</span>
        </button>
      </section>

      {synkMelding ? (
        <p className="rounded-2xl border border-emerald-500/25 bg-emerald-500/10 px-4 py-2.5 text-xs text-emerald-300">{synkMelding}</p>
      ) : null}
      {feil ? (
        <p className="rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-xs text-amber-200">{feil}</p>
      ) : null}

      <section className="overflow-hidden rounded-[28px] border border-white/[0.07] bg-[#26282c]">
        {laster ? (
          <div className="p-8 text-center text-sm text-neutral-400">Henter historikk…</div>
        ) : rader.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-sm font-medium text-neutral-200">Ingen lagrede resultater her ennå.</p>
            <p className="mt-1 text-xs text-neutral-400">
              Spill et av de daglige spillene, så dukker det opp her automatisk.
            </p>
            <Link
              href="/spill"
              className="mt-4 inline-flex h-9 items-center rounded-full bg-neutral-100 px-4 text-xs font-semibold text-[#18191b] hover:bg-white"
            >
              Gå til dagens spill
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-white/[0.08] font-mono text-[11px] uppercase tracking-wider text-neutral-400">
                  <th className="px-4 py-3 font-medium">Dato</th>
                  <th className="px-4 py-3 font-medium">Spill</th>
                  <th className="px-4 py-3 font-medium">Resultat</th>
                  <th className="px-4 py-3 font-medium text-right">Forsøk</th>
                  <th className="px-4 py-3 font-medium text-right">Tid</th>
                  <th className="px-4 py-3 font-medium text-right">Hint</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.06]">
                {rader.map((r) => {
                  const info = spillEtterId(r.spill_id)
                  const st = STATUS_TEKST[r.status]
                  const href = info ? (r.dato === iDag ? info.href : `${info.href}?dato=${r.dato}`) : "/spill"
                  return (
                    <tr key={`${r.spill_id}-${r.dato}`} className="transition hover:bg-white/[0.03]">
                      <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-neutral-300">
                        <Link href={href} className="underline-offset-4 hover:text-white hover:underline">
                          {formaterDato(r.dato, "kort")}
                        </Link>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 font-medium text-neutral-100">
                        <Link href={href} className="hover:underline">
                          {info?.navn ?? r.spill_id}
                        </Link>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium ${st.stil}`}>
                          {r.etikett || st.tekst}
                        </span>
                        {r.verifisert ? (
                          <span className="ml-2 inline-flex align-middle text-emerald-400/80" title="Serververifisert (teller på ledertavle)">
                            <ShieldCheck className="h-3.5 w-3.5" aria-label="Verifisert" />
                          </span>
                        ) : null}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-right font-mono text-xs tabular-nums text-neutral-300">
                        {r.forsok !== null ? r.forsok : "–"}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-right font-mono text-xs tabular-nums text-neutral-300">
                        {formaterTidSek(r.tid_sek)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-right font-mono text-xs tabular-nums text-neutral-300">
                        {r.hint_antall > 0 ? r.hint_antall : "0"}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}

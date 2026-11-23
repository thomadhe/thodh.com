"use client"

import { ChevronLeft, ChevronRight, Globe, Info, Users } from "lucide-react"
import Link from "next/link"
import { useCallback, useEffect, useState } from "react"
import { iDagOslo } from "../lib/dag"
import {
  flyttManed,
  formaterManed,
  FORSTE_MANED,
  gjeldendeManed,
  KLIENT_SPILL,
  metrikkEtikett,
  SERVER_SPILL,
  spillEtterId,
  TAVLE_META,
  type ProfilInfo,
  type ServerSpillId,
  type TavleMetrikk,
  type TavleOmfang,
  type TavleOppforing,
} from "../lib/sosial"
import { LoggInnKort, VisningsnavnSkjema } from "./spill-sosial-ramme"

const MEDALJE = ["🥇", "🥈", "🥉"]

export function SpillLedertavle({ innlogget }: { innlogget: boolean }) {
  const denneManeden = gjeldendeManed(iDagOslo())
  const [spillId, setSpillId] = useState<ServerSpillId>("anelseslos")
  const [omfang, setOmfang] = useState<TavleOmfang>("global")
  const [maned, setManed] = useState<string>(denneManeden)
  const [metrikk, setMetrikk] = useState<TavleMetrikk>(TAVLE_META.anelseslos.standard)
  const [rader, setRader] = useState<TavleOppforing[]>([])
  const [harVisningsnavn, setHarVisningsnavn] = useState(true)
  const [profil, setProfil] = useState<ProfilInfo | null>(null)
  const [laster, setLaster] = useState(innlogget)
  const [feil, setFeil] = useState<string | null>(null)

  const [oppdaterNokkel, setOppdaterNokkel] = useState(0)

  const velgSpill = (ny: ServerSpillId) => {
    setSpillId(ny)
    const meta = TAVLE_META[ny]
    if (!(meta.metrikker as readonly string[]).includes(metrikk)) {
      setMetrikk(meta.standard)
    }
  }

  const hent = useCallback(() => setOppdaterNokkel((n) => n + 1), [])

  useEffect(() => {
    if (!innlogget) return
    let aktiv = true
    const qs = new URLSearchParams({ spill: spillId, maned, omfang, metrikk })
    void fetch(`/spill/api/ledertavle?${qs.toString()}`, { cache: "no-store" })
      .then(async (svar) => {
        const d = (await svar.json().catch(() => ({}))) as {
          rader?: TavleOppforing[]
          harVisningsnavn?: boolean
          melding?: string
        }
        if (!aktiv) return
        if (!svar.ok) {
          setFeil(d.melding ?? "Klarte ikke å hente ledertavlen.")
          setRader([])
          return
        }
        setFeil(d.melding ?? null)
        setRader(d.rader ?? [])
        setHarVisningsnavn(d.harVisningsnavn !== false)
      })
      .catch(() => {
        if (aktiv) setFeil("Nettverksfeil ved henting av ledertavle.")
      })
      .finally(() => {
        if (aktiv) setLaster(false)
      })
    return () => {
      aktiv = false
    }
  }, [innlogget, spillId, maned, omfang, metrikk, oppdaterNokkel])

  if (!innlogget) {
    return (
      <LoggInnKort
        neste="/spill/ledertavle"
        tittel="Logg inn for å se ledertavlen"
        tekst="Sammenlign deg med venner eller alle spillere hver måned – flest løste, kortest tid, færrest hint og høyest snitt. E-postadressen din vises aldri."
      />
    )
  }

  const meta = TAVLE_META[spillId]
  const klientSpillNavn = KLIENT_SPILL.map((id) => spillEtterId(id)?.navn ?? id).join(", ")

  return (
    <div className="flex flex-col gap-5">
      {!harVisningsnavn ? (
        <section className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-5">
          <h2 className="text-sm font-semibold text-amber-100">Velg et offentlig visningsnavn</h2>
          <p className="mt-1 text-xs leading-5 text-amber-200/80">
            For å synes på ledertavlen må du velge et visningsnavn. E-postadressen din vises aldri til andre.
          </p>
          <div className="mt-3">
            <VisningsnavnSkjema
              profil={profil}
              visKode={false}
              onLagret={(p) => {
                setProfil(p)
                setHarVisningsnavn(true)
                void hent()
              }}
            />
          </div>
        </section>
      ) : null}

      {/* Game selector */}
      <section className="flex flex-wrap gap-1.5" aria-label="Velg spill">
        {SERVER_SPILL.map((id) => {
          const info = spillEtterId(id)
          const valgt = id === spillId
          return (
            <button
              key={id}
              type="button"
              onClick={() => velgSpill(id)}
              aria-pressed={valgt}
              className={`rounded-full border px-3.5 py-1.5 text-xs font-medium transition ${
                valgt
                  ? "border-white/30 bg-neutral-100 text-[#18191b]"
                  : "border-white/10 bg-[#26282c] text-neutral-300 hover:border-white/25 hover:text-white"
              }`}
            >
              {info?.navn ?? id}
            </button>
          )
        })}
      </section>

      {/* Scope, month switcher, and metric tabs */}
      <section className="flex flex-col gap-3 rounded-[28px] border border-white/[0.07] bg-[#26282c] p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="inline-flex rounded-full border border-white/10 bg-[#18191b] p-1">
            <button
              type="button"
              onClick={() => setOmfang("global")}
              className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium transition ${
                omfang === "global" ? "bg-neutral-100 text-[#18191b]" : "text-neutral-300 hover:text-white"
              }`}
            >
              <Globe className="h-3.5 w-3.5" />
              Global
            </button>
            <button
              type="button"
              onClick={() => setOmfang("venner")}
              className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium transition ${
                omfang === "venner" ? "bg-neutral-100 text-[#18191b]" : "text-neutral-300 hover:text-white"
              }`}
            >
              <Users className="h-3.5 w-3.5" />
              Venner
            </button>
          </div>

          <div className="flex items-center gap-1 rounded-full border border-white/10 bg-[#18191b] px-1.5 py-1">
            <button
              type="button"
              disabled={maned <= FORSTE_MANED}
              onClick={() => setManed((m) => flyttManed(m, -1))}
              className="rounded-full p-1.5 text-neutral-300 transition hover:bg-white/10 hover:text-white disabled:opacity-30"
              aria-label="Forrige måned"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="min-w-32 text-center text-xs font-semibold text-neutral-100">{formaterManed(maned)}</span>
            <button
              type="button"
              disabled={maned >= denneManeden}
              onClick={() => setManed((m) => flyttManed(m, 1))}
              className="rounded-full p-1.5 text-neutral-300 transition hover:bg-white/10 hover:text-white disabled:opacity-30"
              aria-label="Neste måned"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5 border-t border-white/[0.06] pt-3" role="tablist" aria-label="Rangering">
          {meta.metrikker.map((m) => {
            const valgt = m === metrikk
            return (
              <button
                key={m}
                type="button"
                role="tab"
                aria-selected={valgt}
                onClick={() => setMetrikk(m)}
                className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                  valgt ? "bg-white/15 text-white" : "text-neutral-400 hover:bg-white/[0.06] hover:text-neutral-200"
                }`}
              >
                {metrikkEtikett(spillId, m)}
              </button>
            )
          })}
        </div>
      </section>

      {feil ? (
        <p className="rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-xs text-amber-200">{feil}</p>
      ) : null}

      <section className="overflow-hidden rounded-[28px] border border-white/[0.07] bg-[#26282c]">
        {laster ? (
          <div className="p-8 text-center text-sm text-neutral-400">Henter ledertavle…</div>
        ) : rader.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-sm font-medium text-neutral-200">
              Ingen verifiserte resultater i {formaterManed(maned).toLowerCase()} ennå.
            </p>
            <p className="mt-1 text-xs text-neutral-400">
              {omfang === "venner"
                ? "Spill dagens runde eller legg til flere venner for å komme i gang."
                : "Bli den første på tavlen denne måneden!"}
            </p>
            <div className="mt-4 flex justify-center gap-2">
              <Link
                href={spillEtterId(spillId)?.href ?? "/spill"}
                className="inline-flex h-9 items-center rounded-full bg-neutral-100 px-4 text-xs font-semibold text-[#18191b] hover:bg-white"
              >
                Spill {spillEtterId(spillId)?.navn}
              </Link>
              {omfang === "venner" ? (
                <Link
                  href="/spill/venner"
                  className="inline-flex h-9 items-center rounded-full border border-white/15 px-4 text-xs font-medium text-neutral-200 hover:bg-white/10"
                >
                  Legg til venner
                </Link>
              ) : null}
            </div>
          </div>
        ) : (
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-white/[0.08] font-mono text-[11px] uppercase tracking-wider text-neutral-400">
                <th className="w-14 px-4 py-3 font-medium">#</th>
                <th className="px-4 py-3 font-medium">Spiller</th>
                <th className="px-4 py-3 font-medium text-right">{metrikkEtikett(spillId, metrikk)}</th>
                {metrikk !== "lost" ? <th className="hidden px-4 py-3 font-medium text-right sm:table-cell">Løst</th> : null}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.06]">
              {rader.map((r) => (
                <tr key={r.brukerId} className={r.erMeg ? "bg-emerald-500/[0.09]" : "hover:bg-white/[0.03]"}>
                  <td className="px-4 py-3 font-mono text-xs tabular-nums text-neutral-300">
                    {r.plass <= 3 ? MEDALJE[r.plass - 1] : `${r.plass}.`}
                  </td>
                  <td className="px-4 py-3 font-medium text-neutral-100">
                    {r.visningsnavn}
                    {r.erMeg ? (
                      <span className="ml-2 rounded-full bg-emerald-500/20 px-2 py-0.5 font-mono text-[10px] text-emerald-300">
                        Deg
                      </span>
                    ) : null}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right font-mono text-sm font-semibold tabular-nums text-neutral-50">
                    {r.verdiTekst}
                  </td>
                  {metrikk !== "lost" ? (
                    <td className="hidden whitespace-nowrap px-4 py-3 text-right font-mono text-xs tabular-nums text-neutral-400 sm:table-cell">
                      {r.lost} {r.lost === 1 ? "dag" : "dager"}
                    </td>
                  ) : null}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <p className="flex items-start gap-2 rounded-2xl border border-white/[0.06] bg-white/[0.02] px-4 py-3 text-xs leading-5 text-neutral-400">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-neutral-500" aria-hidden="true" />
        <span>
          Bare spill der svarene vurderes på serveren teller på ledertavlen, og tiden måles fra første innsendte gjetning.{" "}
          {klientSpillNavn} sjekkes i nettleseren og lagres i din egen historikk, men vises ikke på ledertavlen.
        </span>
      </p>
    </div>
  )
}

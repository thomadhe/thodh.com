"use client"

import { ChevronLeft, ChevronRight, Crown, Globe, Info, Users } from "lucide-react"
import Link from "next/link"
import { useCallback, useEffect, useState } from "react"
import { iDagOslo, leggTilDager } from "../lib/dag"
import {
  flyttManed,
  formaterManed,
  formaterTavleDato,
  formaterTidSek,
  FORSTE_DATO,
  FORSTE_MANED,
  gjeldendeManed,
  KLIENT_SPILL,
  metrikkEtikett,
  SERVER_SPILL,
  spillEtterId,
  TAVLE_META,
  type ProfilInfo,
  type ServerSpillId,
  type SpillVinnerKort,
  type TavleMetrikk,
  type TavleOmfang,
  type TavleOppforing,
  type TavlePeriode,
  type TavleValg,
  type TotaltOppforing,
} from "../lib/sosial"
import { LoggInnKort, VisningsnavnSkjema } from "./spill-sosial-ramme"

const MEDALJE = ["🥇", "🥈", "🥉"]

function formaterVinnerNavn(navn: string[]): string {
  if (navn.length <= 1) return navn[0] ?? ""
  if (navn.length === 2) return `${navn[0]} og ${navn[1]}`
  return `${navn.slice(0, -1).join(", ")} og ${navn[navn.length - 1]}`
}

export function SpillLedertavle({ innlogget }: { innlogget: boolean }) {
  const iDag = iDagOslo()
  const denneManeden = gjeldendeManed(iDag)
  const [valg, setValg] = useState<TavleValg>("totalt")
  const [periode, setPeriode] = useState<TavlePeriode>("dag")
  const [omfang, setOmfang] = useState<TavleOmfang>("global")
  const [dato, setDato] = useState<string>(iDag)
  const [maned, setManed] = useState<string>(denneManeden)
  const [metrikk, setMetrikk] = useState<TavleMetrikk>(TAVLE_META.anelseslos.dagStandard)

  const [totaltRader, setTotaltRader] = useState<TotaltOppforing[]>([])
  const [spillVinnere, setSpillVinnere] = useState<SpillVinnerKort[]>([])
  const [spillRader, setSpillRader] = useState<TavleOppforing[]>([])
  const [harVisningsnavn, setHarVisningsnavn] = useState(true)
  const [profil, setProfil] = useState<ProfilInfo | null>(null)
  const [laster, setLaster] = useState(innlogget)
  const [feil, setFeil] = useState<string | null>(null)
  const [oppdaterNokkel, setOppdaterNokkel] = useState(0)

  const velgSpill = (ny: TavleValg) => {
    setValg(ny)
    if (ny !== "totalt") {
      const meta = TAVLE_META[ny]
      const tillatte = periode === "dag" ? meta.dagMetrikker : meta.metrikker
      if (!(tillatte as readonly string[]).includes(metrikk)) {
        setMetrikk(periode === "dag" ? meta.dagStandard : meta.standard)
      }
    }
  }

  const velgPeriode = (ny: TavlePeriode) => {
    setPeriode(ny)
    if (valg !== "totalt") {
      const meta = TAVLE_META[valg]
      const tillatte = ny === "dag" ? meta.dagMetrikker : meta.metrikker
      if (!(tillatte as readonly string[]).includes(metrikk)) {
        setMetrikk(ny === "dag" ? meta.dagStandard : meta.standard)
      }
    }
  }

  const hent = useCallback(() => setOppdaterNokkel((n) => n + 1), [])

  useEffect(() => {
    if (!innlogget) return
    let aktiv = true
    const qs = new URLSearchParams({
      spill: valg,
      periode,
      omfang,
      ...(periode === "dag" ? { dato } : { maned }),
      ...(valg !== "totalt" ? { metrikk } : {}),
    })
    void fetch(`/spill/api/ledertavle?${qs.toString()}`, { cache: "no-store" })
      .then(async (svar) => {
        const d = (await svar.json().catch(() => ({}))) as {
          modus?: "totalt" | "spill"
          rader?: TotaltOppforing[] | TavleOppforing[]
          spillVinnere?: SpillVinnerKort[]
          harVisningsnavn?: boolean
          melding?: string
        }
        if (!aktiv) return
        if (!svar.ok) {
          setFeil(d.melding ?? "Klarte ikke å hente ledertavlen.")
          setTotaltRader([])
          setSpillVinnere([])
          setSpillRader([])
          return
        }
        setFeil(d.melding ?? null)
        if (d.modus === "totalt" || valg === "totalt") {
          setTotaltRader((d.rader ?? []) as TotaltOppforing[])
          setSpillVinnere(d.spillVinnere ?? [])
          setSpillRader([])
        } else {
          setSpillRader((d.rader ?? []) as TavleOppforing[])
          setTotaltRader([])
          setSpillVinnere([])
        }
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
  }, [innlogget, valg, periode, dato, maned, omfang, metrikk, oppdaterNokkel])

  if (!innlogget) {
    return (
      <LoggInnKort
        neste="/spill/ledertavle"
        tittel="Logg inn for å se ledertavlen"
        tekst="Se dagens seierherre og sammenlign resultater med venner eller alle spillere – både per dag og per måned. E-postadressen din vises aldri."
      />
    )
  }

  const erTotalt = valg === "totalt"
  const erDag = periode === "dag"
  const erAktivPeriode = erDag ? dato === iDag : maned === denneManeden
  const meta = erTotalt ? null : TAVLE_META[valg]
  const synligeMetrikker = meta ? (erDag ? meta.dagMetrikker : meta.metrikker) : []
  const klientSpillNavn = KLIENT_SPILL.map((id) => spillEtterId(id)?.navn ?? id).join(", ")

  const vinnereTotalt = totaltRader.filter((r) => r.plass === 1)
  const vinnereSpill = spillRader.filter((r) => r.plass === 1)
  const harVinner = erTotalt ? vinnereTotalt.length > 0 : vinnereSpill.length > 0
  const erDeltSeier = erTotalt ? vinnereTotalt.length > 1 : vinnereSpill.length > 1

  const kroneTittel = erDag
    ? erAktivPeriode
      ? erDeltSeier
        ? "Delt ledelse i dag"
        : "Leder i dag"
      : erDeltSeier
        ? "Delte seierherrer"
        : "Dagens seierherre"
    : erAktivPeriode
      ? erDeltSeier
        ? "Delt ledelse denne måneden"
        : "Leder denne måneden"
      : erDeltSeier
        ? "Månedens seierherrer"
        : "Månedens seierherre"

  const spillVinnerKart = new Map(spillVinnere.map((s) => [s.spillId, s]))

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

      {/* Overall + Game selector */}
      <section className="flex flex-wrap gap-1.5" aria-label="Velg visning">
        <button
          type="button"
          onClick={() => velgSpill("totalt")}
          aria-pressed={erTotalt}
          className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition ${
            erTotalt
              ? "border-amber-300/60 bg-amber-400 text-[#18191b]"
              : "border-amber-400/25 bg-amber-500/10 text-amber-200 hover:border-amber-300/50 hover:text-amber-100"
          }`}
        >
          <Crown className="h-3.5 w-3.5" aria-hidden="true" />
          <span>Totalt</span>
        </button>
        {SERVER_SPILL.map((id) => {
          const info = spillEtterId(id)
          const valgt = id === valg
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

      {/* Scope, period, date/month switcher, and metric tabs */}
      <section className="flex flex-col gap-3 rounded-[28px] border border-white/[0.07] bg-[#26282c] p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex rounded-full border border-white/10 bg-[#18191b] p-1">
              <button
                type="button"
                onClick={() => setOmfang("global")}
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition ${
                  omfang === "global" ? "bg-neutral-100 text-[#18191b]" : "text-neutral-300 hover:text-white"
                }`}
              >
                <Globe className="h-3.5 w-3.5" />
                Global
              </button>
              <button
                type="button"
                onClick={() => setOmfang("venner")}
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition ${
                  omfang === "venner" ? "bg-neutral-100 text-[#18191b]" : "text-neutral-300 hover:text-white"
                }`}
              >
                <Users className="h-3.5 w-3.5" />
                Venner
              </button>
            </div>

            <div className="inline-flex rounded-full border border-white/10 bg-[#18191b] p-1">
              <button
                type="button"
                onClick={() => velgPeriode("dag")}
                className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                  erDag ? "bg-neutral-100 text-[#18191b]" : "text-neutral-300 hover:text-white"
                }`}
              >
                Per dag
              </button>
              <button
                type="button"
                onClick={() => velgPeriode("maned")}
                className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                  !erDag ? "bg-neutral-100 text-[#18191b]" : "text-neutral-300 hover:text-white"
                }`}
              >
                Måned
              </button>
            </div>
          </div>

          {erDag ? (
            <div className="flex items-center gap-1 rounded-full border border-white/10 bg-[#18191b] px-1.5 py-1">
              <button
                type="button"
                disabled={dato <= FORSTE_DATO}
                onClick={() => setDato((d) => leggTilDager(d, -1))}
                className="rounded-full p-1.5 text-neutral-300 transition hover:bg-white/10 hover:text-white disabled:opacity-30"
                aria-label="Forrige dag"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="min-w-32 text-center text-xs font-semibold text-neutral-100">{formaterTavleDato(dato, iDag)}</span>
              <button
                type="button"
                disabled={dato >= iDag}
                onClick={() => setDato((d) => leggTilDager(d, 1))}
                className="rounded-full p-1.5 text-neutral-300 transition hover:bg-white/10 hover:text-white disabled:opacity-30"
                aria-label="Neste dag"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          ) : (
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
          )}
        </div>

        {!erTotalt && synligeMetrikker.length > 1 ? (
          <div className="flex flex-wrap gap-1.5 border-t border-white/[0.06] pt-3" role="tablist" aria-label="Rangering">
            {synligeMetrikker.map((m) => {
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
                  {metrikkEtikett(valg, m, periode)}
                </button>
              )
            })}
          </div>
        ) : null}
      </section>

      {feil ? (
        <p className="rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-xs text-amber-200">{feil}</p>
      ) : null}

      {/* Champion banner ("Dagens seierherre" / "Leder i dag") */}
      {!laster && harVinner ? (
        <section className="relative overflow-hidden rounded-[28px] border border-amber-400/30 bg-gradient-to-br from-amber-500/[0.16] via-[#26282c] to-[#26282c] p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-amber-300/30 bg-amber-400/15 text-amber-300">
                <Crown className="h-6 w-6" aria-hidden="true" />
              </div>
              <div>
                <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-amber-300">
                  {kroneTittel}
                  {!erTotalt ? ` · ${spillEtterId(valg)?.navn ?? valg}` : ""}
                </p>
                <p className="mt-0.5 text-xl font-bold tracking-[-0.02em] text-neutral-50 sm:text-2xl">
                  {erTotalt
                    ? formaterVinnerNavn(vinnereTotalt.map((v) => v.visningsnavn))
                    : formaterVinnerNavn(vinnereSpill.map((v) => v.visningsnavn))}
                </p>
              </div>
            </div>

            {erTotalt ? (
              <div className="flex flex-wrap items-center gap-2 font-mono text-xs">
                <span className="rounded-full border border-amber-300/30 bg-amber-400/15 px-3 py-1 font-bold text-amber-200 tabular-nums">
                  {vinnereTotalt[0].poeng} p
                </span>
                <span className="rounded-full border border-white/10 bg-black/25 px-3 py-1 text-neutral-200 tabular-nums">
                  🥇 {vinnereTotalt[0].seiere} {vinnereTotalt[0].seiere === 1 ? "seier" : "seiere"}
                </span>
                <span className="rounded-full border border-white/10 bg-black/25 px-3 py-1 text-neutral-300 tabular-nums">
                  {erDag
                    ? `${vinnereTotalt[0].spilt}/${SERVER_SPILL.length} spill`
                    : `${vinnereTotalt[0].dagsseiere} ${vinnereTotalt[0].dagsseiere === 1 ? "dagsseier" : "dagsseiere"}`}
                </span>
              </div>
            ) : (
              <div className="flex flex-wrap items-center gap-2 font-mono text-xs">
                <span className="rounded-full border border-amber-300/30 bg-amber-400/15 px-3 py-1 font-bold text-amber-200 tabular-nums">
                  {vinnereSpill[0].verdiTekst}
                </span>
                {erDag && vinnereSpill[0].snittTidSek !== null && metrikk !== "tid" ? (
                  <span className="rounded-full border border-white/10 bg-black/25 px-3 py-1 text-neutral-300 tabular-nums">
                    {formaterTidSek(vinnereSpill[0].snittTidSek)}
                  </span>
                ) : null}
              </div>
            )}
          </div>
        </section>
      ) : null}

      {/* Main leaderboard table */}
      <section className="overflow-hidden rounded-[28px] border border-white/[0.07] bg-[#26282c]">
        {laster ? (
          <div className="p-8 text-center text-sm text-neutral-400">Henter ledertavle…</div>
        ) : (erTotalt ? totaltRader.length : spillRader.length) === 0 ? (
          <div className="p-8 text-center">
            <p className="text-sm font-medium text-neutral-200">
              {erDag
                ? `Ingen verifiserte resultater ${dato === iDag ? "i dag" : formaterTavleDato(dato, iDag).toLowerCase()} ennå.`
                : `Ingen verifiserte resultater i ${formaterManed(maned).toLowerCase()} ennå.`}
            </p>
            <p className="mt-1 text-xs text-neutral-400">
              {omfang === "venner"
                ? "Spill dagens runde eller legg til flere venner for å kjempe om seierherre-tittelen."
                : erDag
                  ? "Bli den første til å ta ledelsen i dag!"
                  : "Bli den første på tavlen denne måneden!"}
            </p>
            <div className="mt-4 flex justify-center gap-2">
              <Link
                href={erTotalt ? "/spill" : (spillEtterId(valg)?.href ?? "/spill")}
                className="inline-flex h-9 items-center rounded-full bg-neutral-100 px-4 text-xs font-semibold text-[#18191b] hover:bg-white"
              >
                {erTotalt ? "Spill dagens spill" : `Spill ${spillEtterId(valg)?.navn}`}
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
        ) : erTotalt ? (
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-white/[0.08] font-mono text-[11px] uppercase tracking-wider text-neutral-400">
                <th className="w-14 px-4 py-3 font-medium">#</th>
                <th className="px-4 py-3 font-medium">Spiller</th>
                {!erDag ? <th className="hidden px-4 py-3 text-right font-medium sm:table-cell">Dagsseiere</th> : null}
                <th className="px-4 py-3 text-right font-medium">Seiere</th>
                <th className="hidden px-4 py-3 text-right font-medium sm:table-cell">Spill</th>
                <th className="px-4 py-3 text-right font-medium">Poeng</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.06]">
              {totaltRader.map((r) => (
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
                  {!erDag ? (
                    <td className="hidden whitespace-nowrap px-4 py-3 text-right font-mono text-xs tabular-nums text-amber-300 sm:table-cell">
                      {r.dagsseiere > 0 ? `👑 ${r.dagsseiere}` : "–"}
                    </td>
                  ) : null}
                  <td className="whitespace-nowrap px-4 py-3 text-right font-mono text-xs tabular-nums text-neutral-300">
                    {r.seiere}
                  </td>
                  <td className="hidden whitespace-nowrap px-4 py-3 text-right font-mono text-xs tabular-nums text-neutral-400 sm:table-cell">
                    {erDag ? `${r.spilt}/${SERVER_SPILL.length}` : r.spilt}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right font-mono text-sm font-semibold tabular-nums text-neutral-50">
                    {r.poeng} p
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-white/[0.08] font-mono text-[11px] uppercase tracking-wider text-neutral-400">
                <th className="w-14 px-4 py-3 font-medium">#</th>
                <th className="px-4 py-3 font-medium">Spiller</th>
                <th className="px-4 py-3 text-right font-medium">{metrikkEtikett(valg, metrikk, periode)}</th>
                {erDag && metrikk !== "tid" ? (
                  <th className="hidden px-4 py-3 text-right font-medium sm:table-cell">Tid</th>
                ) : !erDag && metrikk !== "lost" ? (
                  <th className="hidden px-4 py-3 text-right font-medium sm:table-cell">Løst</th>
                ) : null}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.06]">
              {spillRader.map((r) => (
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
                  {erDag && metrikk !== "tid" ? (
                    <td className="hidden whitespace-nowrap px-4 py-3 text-right font-mono text-xs tabular-nums text-neutral-400 sm:table-cell">
                      {formaterTidSek(r.snittTidSek)}
                    </td>
                  ) : !erDag && metrikk !== "lost" ? (
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

      {/* Per-game winners grid on Daily Overall view */}
      {!laster && erTotalt && erDag ? (
        <section className="rounded-[28px] border border-white/[0.07] bg-[#26282c] p-5 sm:p-6">
          <div className="flex items-baseline justify-between gap-2">
            <h2 className="text-sm font-semibold tracking-[-0.01em] text-neutral-100">
              {dato === iDag ? "Leder per spill i dag" : "Vinnere per spill"}
            </h2>
            <span className="font-mono text-[11px] text-neutral-500">
              {spillVinnere.length}/{SERVER_SPILL.length} spilt
            </span>
          </div>
          <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
            {SERVER_SPILL.map((id) => {
              const info = spillEtterId(id)
              const v = spillVinnerKart.get(id)
              if (!v) {
                return (
                  <Link
                    key={id}
                    href={info?.href ?? "/spill"}
                    className="flex items-center justify-between gap-2 rounded-2xl border border-white/[0.05] bg-[#18191b]/70 px-3.5 py-2.5 text-xs transition hover:border-white/15 hover:bg-[#18191b]"
                  >
                    <span className="font-medium text-neutral-400">{info?.navn ?? id}</span>
                    <span className="font-mono text-[11px] text-neutral-500">Ingen ennå · Spill →</span>
                  </Link>
                )
              }
              const jegVant = v.vinnere.some((x) => x.erMeg)
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => velgSpill(id)}
                  className={`flex items-center justify-between gap-2 rounded-2xl border px-3.5 py-2.5 text-left text-xs transition ${
                    jegVant
                      ? "border-emerald-400/25 bg-emerald-500/[0.08] hover:border-emerald-400/40"
                      : "border-white/[0.07] bg-[#18191b] hover:border-white/20"
                  }`}
                >
                  <div className="min-w-0">
                    <p className="font-medium text-neutral-300">{info?.navn ?? id}</p>
                    <p className="mt-0.5 truncate font-semibold text-neutral-50">
                      🥇 {formaterVinnerNavn(v.vinnere.map((x) => x.visningsnavn))}
                    </p>
                  </div>
                  <div className="shrink-0 text-right font-mono">
                    <p className="font-semibold tabular-nums text-amber-200">{v.verdiTekst}</p>
                    <p className="text-[10px] text-neutral-500">
                      {v.deltakere} {v.deltakere === 1 ? "spiller" : "spillere"}
                    </p>
                  </div>
                </button>
              )
            })}
          </div>
        </section>
      ) : null}

      <p className="flex items-start gap-2 rounded-2xl border border-white/[0.06] bg-white/[0.02] px-4 py-3 text-xs leading-5 text-neutral-400">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-neutral-500" aria-hidden="true" />
        <span>
          {erTotalt
            ? "Seierherre-poeng: 1 p per fullført spill, pluss 3 p for 1.-plass, 2 p for 2.-plass og 1 p for 3.-plass i hvert spill. "
            : "Bare spill der svarene vurderes på serveren teller på ledertavlen, og tiden måles fra første innsendte gjetning. "}
          {klientSpillNavn} sjekkes i nettleseren og lagres i din egen historikk, men vises ikke på ledertavlen.
        </span>
      </p>
    </div>
  )
}

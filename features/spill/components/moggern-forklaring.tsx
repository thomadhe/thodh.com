"use client"

import { ChevronDown, ChevronUp, Eye, ShieldAlert, Sparkles } from "lucide-react"
import { useState, useSyncExternalStore } from "react"
import { DELPOENG_LISTE, MAKS_PITCH_GRADER, MAKS_YAW_GRADER, MIN_GYLDIGE_RAMMER } from "../lib/moggern/poeng"
import { RANG_TITLER } from "../lib/moggern/tekster"
import { Knapp, Kort } from "./spill-ramme"

const TULL_NOKKEL = "moggern:tull-godkjent:v1"
const TULL_HENDELSE = "moggern-tull-endret"

function lesGodkjent(): boolean {
  try {
    return localStorage.getItem(TULL_NOKKEL) === "ja"
  } catch {
    return false
  }
}

function abonnerGodkjent(varsle: () => void) {
  window.addEventListener(TULL_HENDELSE, varsle)
  window.addEventListener("storage", varsle)
  return () => {
    window.removeEventListener(TULL_HENDELSE, varsle)
    window.removeEventListener("storage", varsle)
  }
}

export function godkjennTullSkjerm() {
  try {
    localStorage.setItem(TULL_NOKKEL, "ja")
  } catch {}
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(TULL_HENDELSE))
  }
}

/** Remembered per device in localStorage; false during SSR so the gate never flashes away prematurely. */
export function useHarGodkjentTull(): { godkjent: boolean; lastet: boolean } {
  const verdi = useSyncExternalStore(
    abonnerGodkjent,
    () => (lesGodkjent() ? "ja" : "nei"),
    () => "ssr",
  )
  return { godkjent: verdi === "ja", lastet: verdi !== "ssr" }
}

/**
 * Mandatory "Alt er tull" disclaimer gate shown before the camera can ever be turned on.
 * One tap per device, remembered in localStorage.
 */
export function TullSkjerm({ onGodkjenn }: { onGodkjenn: () => void }) {
  return (
    <Kort className="mx-auto w-full max-w-xl border-white/10 p-6 sm:p-8">
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-lime-400 text-neutral-950">
          <ShieldAlert className="h-5 w-5" aria-hidden="true" />
        </span>
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-lime-400">Før kameraet kan slås på</p>
          <h2 className="font-[family-name:var(--font-visning)] text-2xl font-extrabold tracking-tight text-neutral-950 sm:text-3xl">
            Alt her er tull.
          </h2>
        </div>
      </div>

      <p className="mt-4 text-sm leading-6 text-neutral-700">
        Moggern er en helt useriøs kameraduell for venner. Før du går videre, må vi være helt enige om fire ting:
      </p>

      <ul className="mt-4 space-y-2.5 text-sm leading-6 text-neutral-800">
        <li className="flex gap-2.5 rounded-2xl bg-black/20 p-3">
          <span className="mt-0.5 font-mono text-xs font-bold text-lime-400">01</span>
          <span>
            <strong className="text-neutral-950">Null vitenskap:</strong> Poengene, rangtitlene og dissene er bare geometri-matte på gøy. De har null
            vitenskapelig grunnlag og sier <em>ingenting</em> om hvordan du ser ut eller hva du er verdt.
          </span>
        </li>
        <li className="flex gap-2.5 rounded-2xl bg-black/20 p-3">
          <span className="mt-0.5 font-mono text-xs font-bold text-lime-400">02</span>
          <span>
            <strong className="text-neutral-950">Direkte mellom dere:</strong> Videoen går rett mellom de to nettleserne (peer-to-peer). Ansiktsmålingen
            kjører lokalt i nettleseren din — ingen video eller ansiktsdata sendes til noen server.
          </span>
        </li>
        <li className="flex gap-2.5 rounded-2xl bg-black/20 p-3">
          <span className="mt-0.5 font-mono text-xs font-bold text-lime-400">03</span>
          <span>
            <strong className="text-neutral-950">Ingenting lagres:</strong> Ingenting blir tatt opp, lagret eller delt videre. Du kan skru av kameraet
            eller forlate rommet når som helst med ett trykk.
          </span>
        </li>
        <li className="flex gap-2.5 rounded-2xl bg-black/20 p-3">
          <span className="mt-0.5 font-mono text-xs font-bold text-lime-400">04</span>
          <span>
            <strong className="text-neutral-950">Kun med venner:</strong> Ingen tilfeldig matchmaking med fremmede — bare private rom med kode eller
            lenke.
          </span>
        </li>
      </ul>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Knapp
          onClick={() => {
            godkjennTullSkjerm()
            onGodkjenn()
          }}
          className="w-full !bg-lime-400 !font-bold !text-neutral-950 hover:!bg-lime-300 sm:w-auto"
        >
          <Sparkles className="h-4 w-4" aria-hidden="true" />
          Skjønner, kjør
        </Knapp>
        <p className="font-mono text-[11px] text-neutral-500">Huskes på denne enheten.</p>
      </div>
    </Kort>
  )
}

/** Transparent "Slik regnes det" explainer showing the exact deterministic math and weights. */
export function SlikRegnesDet({ aapenSomStandard = false }: { aapenSomStandard?: boolean }) {
  const [aapen, setAapen] = useState(aapenSomStandard)
  return (
    <Kort className="border-white/10 p-5">
      <button
        type="button"
        onClick={() => setAapen((v) => !v)}
        aria-expanded={aapen}
        className="flex w-full items-center justify-between gap-3 text-left"
      >
        <span className="flex items-center gap-2.5">
          <Eye className="h-4 w-4 text-lime-400" aria-hidden="true" />
          <span className="font-[family-name:var(--font-visning)] text-base font-bold text-neutral-950">Slik regnes det</span>
          <span className="rounded-full bg-white/5 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-neutral-500">
            Matte for gøy
          </span>
        </span>
        {aapen ? <ChevronUp className="h-4 w-4 text-neutral-500" /> : <ChevronDown className="h-4 w-4 text-neutral-500" />}
      </button>

      {aapen ? (
        <div className="mt-4 space-y-4 border-t border-white/10 pt-4 text-sm leading-6 text-neutral-700">
          <p>
            Alt skjer lokalt i nettleseren med <strong className="text-neutral-950">MediaPipe Face Landmarker</strong> (Apache-2.0). Dette er ren
            geometri-lek uten vitenskapelig grunnlag — lys, kamerahøyde og avstand påvirker poengene kraftig.
          </p>

          <div className="grid gap-2 sm:grid-cols-2">
            <div className="rounded-2xl bg-black/20 p-3">
              <p className="font-mono text-[11px] uppercase tracking-wider text-lime-400">1. Normalisering &amp; vinkel</p>
              <p className="mt-1 text-xs leading-5 text-neutral-700">
                Punktene roteres så øyelinjen blir vannrett, og skaleres etter pupillavstanden (IPD). Bare frontale bilder (|yaw| ≤ {MAKS_YAW_GRADER}°,
                |pitch| ≤ {MAKS_PITCH_GRADER}°) teller, og duellen krever minst {MIN_GYLDIGE_RAMMER} gyldige bilder over 10 sekunder.
              </p>
            </div>
            <div className="rounded-2xl bg-black/20 p-3">
              <p className="font-mono text-[11px] uppercase tracking-wider text-lime-400">2. Anti-juks mellom venner</p>
              <p className="mt-1 text-xs leading-5 text-neutral-700">
                Begge nettleserne måler <em>begge</em> ansiktene fra videoen de faktisk ser. Det offisielle duellresultatet bruker motstanderens måling
                av deg. Hvis de to målingene spriker mye, vises begge side om side.
              </p>
            </div>
          </div>

          <div>
            <p className="mb-2 font-mono text-[11px] uppercase tracking-wider text-neutral-500">De 7 delpoengene (0–10)</p>
            <ul className="grid gap-1.5 sm:grid-cols-2">
              {DELPOENG_LISTE.map((d) => (
                <li key={d.id} className="flex items-start justify-between gap-2 rounded-xl bg-black/15 px-3 py-2 text-xs">
                  <div>
                    <span className="font-semibold text-neutral-950">{d.navn}</span>
                    <p className="text-neutral-600">{d.kortForklaring}</p>
                  </div>
                  <span className="shrink-0 font-mono text-[11px] font-semibold text-lime-400">{Math.round(d.vekt * 100)} %</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-2xl bg-black/20 p-3 text-xs leading-5 text-neutral-600">
            <strong className="text-neutral-900">Lyssjekk uten hudfarge:</strong> En egen gråtone-lyssjekk sjekker bare om bildet er kraftig
            overeksponert eller altfor mørkt (for morsomme lystips/disser). Den ser aldri på hudfarge og påvirker aldri poengsummen.
          </div>

          <div>
            <p className="mb-2 font-mono text-[11px] uppercase tracking-wider text-neutral-500">Rangtitler</p>
            <div className="flex flex-wrap gap-1.5">
              {RANG_TITLER.map((r) => (
                <span key={r.id} className="inline-flex items-center gap-1.5 rounded-full bg-black/25 px-2.5 py-1 text-xs text-neutral-800">
                  <span className="font-mono text-[10px] text-neutral-500">
                    {r.minPoeng === 9 ? "9+" : `${r.minPoeng.toFixed(0)}–${r.maksPoeng.toFixed(1).replace(".", ",")}`}
                  </span>
                  <span className="font-semibold text-neutral-950">{r.tittel}</span>
                </span>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </Kort>
  )
}

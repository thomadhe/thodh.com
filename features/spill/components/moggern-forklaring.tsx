"use client"

import { ChevronDown, ChevronUp, Eye, ShieldAlert, Sparkles } from "lucide-react"
import { useState, useSyncExternalStore } from "react"
import {
  DELPOENG_LISTE,
  formaterBonus,
  formaterMoggernPoeng,
  KALIBRERING_SNITT,
  KALIBRERING_SPREDNING,
  MAKS_PITCH_GRADER,
  MAKS_UTTRYKK_BONUS,
  MAKS_YAW_GRADER,
  MIN_GYLDIGE_RAMMER,
  MOG_UTTRYKK,
} from "../lib/moggern/poeng"
import { RANG_TITLER } from "../lib/moggern/tekster"

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

/** Calm Gjetteløs-style surface inside `.spill-mork` (Moggern pages). */
export const MFLATE = "rounded-[28px] border border-white/[0.07] bg-[var(--spill-flate)]"
/** High-contrast primary CTA (inverted neutral: light pill, dark text). */
export const MKNAPP =
  "inline-flex h-11 items-center justify-center gap-2 rounded-full bg-[#f4f4f5] px-6 text-sm font-semibold text-[#18191b] shadow-[0_1px_0_rgb(255_255_255/0.4)_inset] transition hover:bg-white active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
/** Quiet secondary pill. */
export const MKNAPP_SEKUNDAR =
  "inline-flex h-11 items-center justify-center gap-2 rounded-full border border-white/12 bg-white/[0.04] px-5 text-sm font-medium text-white/85 transition hover:border-white/25 hover:bg-white/[0.08] hover:text-white"

const PUNKTER_TULL: { tittel: string; tekst: React.ReactNode }[] = [
  {
    tittel: "Null vitenskap",
    tekst: (
      <>
        Poengene, rangtitlene og dissene er bare geometri-matte på gøy. De har null vitenskapelig grunnlag og sier <em>ingenting</em> om hvordan du
        ser ut eller hva du er verdt.
      </>
    ),
  },
  {
    tittel: "Direkte mellom dere",
    tekst:
      "Videoen går rett mellom de to nettleserne (peer-to-peer). Ansiktsmålingen kjører lokalt i nettleseren din — ingen video eller ansiktsdata sendes til noen server.",
  },
  {
    tittel: "Ingenting lagres",
    tekst: "Ingenting blir tatt opp, lagret eller delt videre. Du kan skru av kameraet eller forlate rommet når som helst med ett trykk.",
  },
  {
    tittel: "Kun med venner",
    tekst: "Ingen tilfeldig matchmaking med fremmede — bare private rom med kode eller lenke.",
  },
]

/**
 * Mandatory "Alt er tull" disclaimer gate shown before the camera can ever be turned on.
 * One tap per device, remembered in localStorage.
 */
export function TullSkjerm({ onGodkjenn }: { onGodkjenn: () => void }) {
  return (
    <section className={`${MFLATE} mel-inn mx-auto w-full max-w-xl p-6 sm:p-8`}>
      <div className="flex items-center gap-3.5">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-lime-300 text-[#18191b]">
          <ShieldAlert className="h-5 w-5" aria-hidden="true" />
        </span>
        <div>
          <p className="text-xs font-medium text-neutral-500">Før kameraet kan slås på</p>
          <h2 className="text-[2rem] leading-[1.05] font-semibold tracking-[-0.04em] text-neutral-950">Alt her er tull.</h2>
        </div>
      </div>

      <p className="mt-5 text-[15px] leading-6 text-neutral-700">
        Moggern er en helt useriøs kameraduell for venner. Før du går videre, må vi være helt enige om fire ting:
      </p>

      <ol className="mt-4 divide-y divide-white/[0.06] rounded-[22px] border border-white/[0.06] bg-[#1f2124]">
        {PUNKTER_TULL.map((p, i) => (
          <li key={p.tittel} className="flex gap-3.5 px-4 py-3.5">
            <span className="mt-0.5 text-xs font-semibold text-lime-300 tabular-nums">{String(i + 1).padStart(2, "0")}</span>
            <span className="text-sm leading-6 text-neutral-700">
              <strong className="font-semibold text-neutral-950">{p.tittel}:</strong> {p.tekst}
            </span>
          </li>
        ))}
      </ol>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <button
          type="button"
          onClick={() => {
            godkjennTullSkjerm()
            onGodkjenn()
          }}
          className={`${MKNAPP} w-full sm:w-auto`}
        >
          <Sparkles className="h-4 w-4" aria-hidden="true" />
          Skjønner, kjør
        </button>
        <p className="text-xs text-neutral-500">Huskes på denne enheten.</p>
      </div>
    </section>
  )
}

function Boks({ tittel, children }: { tittel: string; children: React.ReactNode }) {
  return (
    <div className="rounded-[20px] border border-white/[0.06] bg-[#1f2124] p-4">
      <p className="text-xs font-semibold text-lime-300">{tittel}</p>
      <div className="mt-1.5 text-xs leading-5 text-neutral-700">{children}</div>
    </div>
  )
}

/** Transparent "Slik regnes det" explainer showing the exact deterministic math, weights and expression bonuses. */
export function SlikRegnesDet({ aapenSomStandard = false }: { aapenSomStandard?: boolean }) {
  const [aapen, setAapen] = useState(aapenSomStandard)
  return (
    <section className={`${MFLATE} p-5 sm:p-6`}>
      <button
        type="button"
        onClick={() => setAapen((v) => !v)}
        aria-expanded={aapen}
        className="flex w-full items-center justify-between gap-3 text-left"
      >
        <span className="flex items-center gap-2.5">
          <Eye className="h-4 w-4 text-lime-300" aria-hidden="true" />
          <span className="text-[17px] font-semibold tracking-[-0.02em] text-neutral-950">Slik regnes det</span>
          <span className="rounded-full bg-white/[0.06] px-2.5 py-0.5 text-[11px] font-medium text-neutral-500">Matte for gøy</span>
        </span>
        {aapen ? <ChevronUp className="h-4 w-4 text-neutral-500" /> : <ChevronDown className="h-4 w-4 text-neutral-500" />}
      </button>

      {aapen ? (
        <div className="mt-5 space-y-5 border-t border-white/[0.07] pt-5 text-sm leading-6 text-neutral-700">
          <p>
            Alt skjer lokalt i nettleseren med <strong className="font-semibold text-neutral-950">MediaPipe Face Landmarker</strong> (Apache-2.0): 478
            ansiktspunkter i 3D pluss 52 ansiktsuttrykk («blendshapes») fra samme modell. Matten er egenskrevet, inspirert av åpne GitHub-prosjekter
            som facial-proportion-math (MIT) og MogOps. Dette er ren geometri-lek uten vitenskapelig grunnlag — lys, kamerahøyde og avstand påvirker
            poengene kraftig.
          </p>

          <div className="grid gap-2 sm:grid-cols-2">
            <Boks tittel="1. Normalisering & vinkel">
              Punktene roteres så øyelinjen blir vannrett, og skaleres etter pupillavstanden (IPD). Bare frontale bilder (|yaw| ≤ {MAKS_YAW_GRADER}°,
              |pitch| ≤ {MAKS_PITCH_GRADER}°) teller, og duellen krever minst {MIN_GYLDIGE_RAMMER} gyldige bilder over 10 sekunder.
            </Boks>
            <Boks tittel="2. Asymmetrisk platå per mål">
              Hvert mål (f.eks. 3D-kjevevinkel, PFR, fWHR, ESR) får 10 innenfor et målområde. Utenfor faller poenget som en Gauss-kurve — brattere på den
              «verste» siden (runde øyne straffes mer enn litt for smale).
            </Boks>
            <Boks tittel="3. Kalibrert bjellekurve">
              Det vektede snittet går gjennom en normalfordeling: 10 · Φ((R − {formaterMoggernPoeng(KALIBRERING_SNITT)}) /{" "}
              {formaterMoggernPoeng(KALIBRERING_SPREDNING)}). Et vanlig ansikt havner rundt 5–6, svake proporsjoner helt ned mot Bjeffern, og bare
              elitetall bikker 9.
            </Boks>
            <Boks tittel="4. Anti-juks mellom venner">
              Begge nettleserne måler <em>begge</em> ansiktene fra videoen de faktisk ser. Det offisielle duellresultatet bruker motstanderens måling av
              deg. Hvis de to målingene spriker mye, vises begge side om side.
            </Boks>
          </div>

          <div>
            <p className="mb-2 text-xs font-medium text-neutral-500">De 7 delpoengene (0–10)</p>
            <ul className="grid gap-1.5 sm:grid-cols-2">
              {DELPOENG_LISTE.map((d) => (
                <li key={d.id} className="flex items-start justify-between gap-3 rounded-[18px] bg-white/[0.03] px-3.5 py-2.5 text-xs">
                  <div>
                    <span className="font-semibold text-neutral-950">{d.navn}</span>
                    <p className="mt-0.5 leading-5 text-neutral-600">{d.kortForklaring}</p>
                  </div>
                  <span className="shrink-0 text-xs font-semibold text-lime-300 tabular-nums">{Math.round(d.vekt * 100)} %</span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="mb-2 text-xs font-medium text-neutral-500">
              Mog-uttrykk (live, glattet over bildene — må holdes gjennom målingen) · maks {formaterBonus(MAKS_UTTRYKK_BONUS)}
            </p>
            <ul className="grid gap-1.5 sm:grid-cols-2">
              {MOG_UTTRYKK.map((u) => (
                <li key={u.id} className="flex items-center justify-between gap-3 rounded-[18px] bg-white/[0.03] px-3.5 py-2.5 text-xs">
                  <div>
                    <span className="font-semibold text-neutral-950">{u.navn}</span>
                    <p className="mt-0.5 leading-5 text-neutral-600">{u.forklaring}</p>
                  </div>
                  <span className={`shrink-0 text-xs font-semibold tabular-nums ${u.maks > 0 ? "text-lime-300" : "text-rose-300"}`}>
                    {u.maks > 0 ? "opptil " : "ned til "}
                    {formaterBonus(u.maks)}
                  </span>
                </li>
              ))}
            </ul>
            <p className="mt-2 text-xs leading-5 text-neutral-500">
              Et hvilende ansikt gir 0,0 i bonus. Totalen er kalibrert struktur + uttrykk, begrenset til 0–10.
            </p>
          </div>

          <div className="rounded-[20px] border border-white/[0.06] bg-[#1f2124] p-4 text-xs leading-5 text-neutral-600">
            <strong className="font-semibold text-neutral-900">Lyssjekk uten hudfarge:</strong> En egen gråtone-lyssjekk sjekker bare om bildet er
            kraftig overeksponert eller altfor mørkt (for morsomme lystips/disser). Den ser aldri på hudfarge og påvirker aldri poengsummen.
          </div>

          <div>
            <p className="mb-2 text-xs font-medium text-neutral-500">Rangtitler</p>
            <div className="flex flex-wrap gap-1.5">
              {RANG_TITLER.map((r) => (
                <span key={r.id} className="inline-flex items-center gap-1.5 rounded-full bg-white/[0.05] py-1 pr-3 pl-1 text-xs text-neutral-800">
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold tabular-nums ${r.farge}`}>
                    {r.minPoeng === 9 ? "9+" : `${r.minPoeng.toFixed(0)}–${r.maksPoeng.toFixed(1).replace(".", ",")}`}
                  </span>
                  <span className="font-semibold text-neutral-950">{r.tittel}</span>
                </span>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </section>
  )
}

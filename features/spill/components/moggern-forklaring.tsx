"use client"

import { ChevronDown, ChevronUp, Eye, ShieldAlert, Sparkles } from "lucide-react"
import { useState, useSyncExternalStore } from "react"
import { useSprak, useT } from "@/lib/sprak"
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

const PUNKTER_TULL: { tittel: string; tittelEn: string; tekst: React.ReactNode; tekstEn: React.ReactNode }[] = [
  {
    tittel: "Null vitenskap",
    tittelEn: "Zero science",
    tekst: (
      <>
        Poengene, rangtitlene og dissene er bare geometri-matte på gøy. De har null vitenskapelig grunnlag og sier <em>ingenting</em> om hvordan du
        ser ut eller hva du er verdt.
      </>
    ),
    tekstEn: (
      <>
        The scores, rank titles, and roasts are just goofy geometry math. They have zero scientific basis and say <em>nothing</em> about how you
        look or what you’re worth.
      </>
    ),
  },
  {
    tittel: "Direkte mellom dere",
    tittelEn: "Direct peer-to-peer",
    tekst:
      "Videoen går rett mellom de to nettleserne (peer-to-peer). Ansiktsmålingen kjører lokalt i nettleseren din — ingen video eller ansiktsdata sendes til noen server.",
    tekstEn:
      "Video flows straight between the two browsers (peer-to-peer). Face tracking runs locally in your browser — no video or facial data is ever sent to a server.",
  },
  {
    tittel: "Ingenting lagres",
    tittelEn: "Nothing is stored",
    tekst: "Ingenting blir tatt opp, lagret eller delt videre. Du kan skru av kameraet eller forlate rommet når som helst med ett trykk.",
    tekstEn: "Nothing is recorded, stored, or shared. You can turn off your camera or leave the room at any moment with one tap.",
  },
  {
    tittel: "Kun med venner",
    tittelEn: "Friends only",
    tekst: "Ingen tilfeldig matchmaking med fremmede — bare private rom med kode eller lenke.",
    tekstEn: "No random matchmaking with strangers — only private rooms by code or link.",
  },
]

/**
 * Mandatory "Alt er tull" disclaimer gate shown before the camera can ever be turned on.
 * One tap per device, remembered in localStorage.
 */
export function TullSkjerm({ onGodkjenn }: { onGodkjenn: () => void }) {
  const sprak = useSprak()
  const t = useT()
  return (
    <section className={`${MFLATE} mel-inn mx-auto w-full max-w-xl p-6 sm:p-8`}>
      <div className="flex items-center gap-3.5">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-lime-300 text-[#18191b]">
          <ShieldAlert className="h-5 w-5" aria-hidden="true" />
        </span>
        <div>
          <p className="text-xs font-medium text-neutral-500">{t("Før kameraet kan slås på", "Before turning on the camera")}</p>
          <h2 className="text-[2rem] leading-[1.05] font-semibold tracking-[-0.04em] text-neutral-950">
            {t("Alt her er tull.", "Everything here is a joke.")}
          </h2>
        </div>
      </div>

      <p className="mt-5 text-[15px] leading-6 text-neutral-700">
        {t(
          "Moggern er en helt useriøs kameraduell for venner. Før du går videre, må vi være helt enige om fire ting:",
          "Moggern is a completely unserious 1v1 camera duel for friends. Before you jump in, let’s agree on four things:",
        )}
      </p>

      <ol className="mt-4 divide-y divide-white/[0.06] rounded-[22px] border border-white/[0.06] bg-[#1f2124]">
        {PUNKTER_TULL.map((p, i) => (
          <li key={p.tittel} className="flex gap-3.5 px-4 py-3.5">
            <span className="mt-0.5 text-xs font-semibold text-lime-300 tabular-nums">{String(i + 1).padStart(2, "0")}</span>
            <span className="text-sm leading-6 text-neutral-700">
              <strong className="font-semibold text-neutral-950">{sprak === "en" ? p.tittelEn : p.tittel}:</strong>{" "}
              {sprak === "en" ? p.tekstEn : p.tekst}
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
          {t("Skjønner, kjør", "Got it, let’s go")}
        </button>
        <p className="text-xs text-neutral-500">{t("Huskes på denne enheten.", "Remembered on this device.")}</p>
      </div>
    </section>
  )
}

function Boks({ tittel, children }: { tittel: string; children: React.ReactNode }) {
  return (
    <div className="min-w-0 rounded-[20px] border border-white/[0.06] bg-[#1f2124] p-3.5 sm:p-4">
      <p className="text-xs font-semibold text-lime-300">{tittel}</p>
      <div className="mt-1.5 break-words text-xs leading-5 text-neutral-700">{children}</div>
    </div>
  )
}

/** Transparent "Slik regnes det" explainer showing the exact deterministic math, weights and expression bonuses. */
export function SlikRegnesDet({ aapenSomStandard = false }: { aapenSomStandard?: boolean }) {
  const sprak = useSprak()
  const t = useT()
  const [aapen, setAapen] = useState(aapenSomStandard)
  const en = sprak === "en"
  return (
    <section className={`${MFLATE} min-w-0 overflow-hidden p-4 sm:p-6`}>
      <button
        type="button"
        onClick={() => setAapen((v) => !v)}
        aria-expanded={aapen}
        className="flex w-full min-w-0 items-center justify-between gap-3 text-left"
      >
        <span className="flex min-w-0 flex-wrap items-center gap-2">
          <Eye className="h-4 w-4 shrink-0 text-lime-300" aria-hidden="true" />
          <span className="text-[17px] font-semibold tracking-[-0.02em] text-neutral-950">{t("Slik regnes det", "How it’s scored")}</span>
          <span className="rounded-full bg-white/[0.06] px-2.5 py-0.5 text-[11px] font-medium text-neutral-500">
            {t("Matte for gøy", "Math for fun")}
          </span>
        </span>
        {aapen ? <ChevronUp className="h-4 w-4 shrink-0 text-neutral-500" /> : <ChevronDown className="h-4 w-4 shrink-0 text-neutral-500" />}
      </button>

      {aapen ? (
        <div className="mt-5 space-y-5 border-t border-white/[0.07] pt-5 text-sm leading-6 text-neutral-700">
          <p className="break-words">
            {en ? (
              <>
                Everything runs locally in your browser with <strong className="font-semibold text-neutral-950">MediaPipe Face Landmarker</strong>{" "}
                (Apache-2.0): 478 3D face landmarks plus 52 facial expression blendshapes from the same model. The math is custom-written, inspired by
                open-source GitHub projects like facial-proportion-math (MIT) and MogOps. It’s pure geometry for laughs with zero scientific basis —
                lighting, camera height, and distance heavily affect your score.
              </>
            ) : (
              <>
                Alt skjer lokalt i nettleseren med <strong className="font-semibold text-neutral-950">MediaPipe Face Landmarker</strong> (Apache-2.0):
                478 ansiktspunkter i 3D pluss 52 ansiktsuttrykk («blendshapes») fra samme modell. Matten er egenskrevet, inspirert av åpne
                GitHub-prosjekter som facial-proportion-math (MIT) og MogOps. Dette er ren geometri-lek uten vitenskapelig grunnlag — lys, kamerahøyde
                og avstand påvirker poengene kraftig.
              </>
            )}
          </p>

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <Boks tittel={t("1. 3D-kompensering & vinkel", "1. 3D compensation & pose")}>
              {en ? (
                <>
                  Your face is straightened in 3D from the eye line and skull midline (brow → nose), and scaled by 3D interpupillary distance (IPD).
                  Move naturally up to |yaw| ≤ {MAKS_YAW_GRADER}°, |pitch| ≤ {MAKS_PITCH_GRADER}°. At least {MIN_GYLDIGE_RAMMER} valid frames are
                  needed over 15 seconds.
                </>
              ) : (
                <>
                  Ansiktet rettes opp i 3D fra øyelinjen og midtlinjen (bryn → nese), og skaleres etter 3D-pupillavstanden (IPD). Det belønner naturlig
                  symmetri og lar deg bevege hodet fritt opp til |yaw| ≤ {MAKS_YAW_GRADER}°, |pitch| ≤ {MAKS_PITCH_GRADER}°. Minst{" "}
                  {MIN_GYLDIGE_RAMMER} gyldige bilder kreves over 15 sekunder.
                </>
              )}
            </Boks>
            <Boks tittel={t("2. Asymmetrisk platå per mål", "2. Asymmetric plateau per metric")}>
              {en
                ? "Each measurement (3D gonial angle, PFR, fWHR, ESR) scores 10 inside its target range. Outside it decays along a Gaussian curve — steeper on the 'worse' side."
                : "Hvert mål (f.eks. 3D-kjevevinkel, PFR, fWHR, ESR) får 10 innenfor et målområde. Utenfor faller poenget som en Gauss-kurve — brattere på den «verste» siden (runde øyne straffes mer enn litt for smale)."}
            </Boks>
            <Boks tittel={t("3. Kalibrert bjellekurve", "3. Calibrated bell curve")}>
              {en ? (
                <>
                  The weighted average passes through a normal CDF: 10 · Φ((R − {formaterMoggernPoeng(KALIBRERING_SNITT, "en")}) /{" "}
                  {formaterMoggernPoeng(KALIBRERING_SPREDNING, "en")}). An average face lands around 5–6, rough proportions drop low, and only elite
                  numbers break 9.
                </>
              ) : (
                <>
                  Det vektede snittet går gjennom en normalfordeling: 10 · Φ((R − {formaterMoggernPoeng(KALIBRERING_SNITT)}) /{" "}
                  {formaterMoggernPoeng(KALIBRERING_SPREDNING)}). Et vanlig ansikt havner rundt 5–6, svake proporsjoner helt ned mot Bjeffern, og bare
                  elitetall bikker 9.
                </>
              )}
            </Boks>
            <Boks tittel={t("4. Anti-juks mellom venner", "4. Anti-cheat between friends")}>
              {en ? (
                <>
                  Both browsers measure <em>both</em> faces from the live video they actually see. The official duel score uses your opponent’s
                  measurement of you. If the two disagree, both are shown side by side.
                </>
              ) : (
                <>
                  Begge nettleserne måler <em>begge</em> ansiktene fra videoen de faktisk ser. Det offisielle duellresultatet bruker motstanderens
                  måling av deg. Hvis de to målingene spriker mye, vises begge side om side.
                </>
              )}
            </Boks>
          </div>

          <div>
            <p className="mb-2 text-xs font-medium text-neutral-500">{t("De 7 delpoengene (0–10)", "The 7 sub-scores (0–10)")}</p>
            <ul className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
              {DELPOENG_LISTE.map((d) => (
                <li key={d.id} className="flex min-w-0 items-start justify-between gap-3 rounded-[18px] bg-white/[0.03] px-3.5 py-2.5 text-xs">
                  <div className="min-w-0 flex-1 break-words">
                    <span className="font-semibold text-neutral-950">{en ? d.navnEn : d.navn}</span>
                    <p className="mt-0.5 leading-5 text-neutral-600">{en ? d.kortForklaringEn : d.kortForklaring}</p>
                  </div>
                  <span className="shrink-0 text-xs font-semibold text-lime-300 tabular-nums">{Math.round(d.vekt * 100)}%</span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="mb-2 text-xs font-medium text-neutral-500">
              {en
                ? `Mog expressions (live, smoothed across frames — hold them through the round) · max ${formaterBonus(MAKS_UTTRYKK_BONUS, "en")}`
                : `Mog-uttrykk (live, glattet over bildene — må holdes gjennom målingen) · maks ${formaterBonus(MAKS_UTTRYKK_BONUS)}`}
            </p>
            <ul className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
              {MOG_UTTRYKK.map((u) => (
                <li key={u.id} className="flex min-w-0 items-center justify-between gap-3 rounded-[18px] bg-white/[0.03] px-3.5 py-2.5 text-xs">
                  <div className="min-w-0 flex-1 break-words">
                    <span className="font-semibold text-neutral-950">{en ? u.navnEn : u.navn}</span>
                    <p className="mt-0.5 leading-5 text-neutral-600">{en ? u.forklaringEn : u.forklaring}</p>
                  </div>
                  <span className={`shrink-0 text-xs font-semibold tabular-nums ${u.maks > 0 ? "text-lime-300" : "text-rose-300"}`}>
                    {u.maks > 0 ? t("opptil ", "up to ") : t("ned til ", "down to ")}
                    {formaterBonus(u.maks, sprak)}
                  </span>
                </li>
              ))}
            </ul>
            <p className="mt-2 text-xs leading-5 text-neutral-500">
              {t(
                "Et hvilende ansikt gir 0,0 i bonus. Totalen er kalibrert struktur + uttrykk + eventuell Rizzler Finisher, begrenset til 0–10.",
                "A resting face gives 0.0 bonus. Final score is calibrated structure + expressions + optional Rizzler Finisher, clamped to 0–10.",
              )}
            </p>
          </div>

          <div className="break-words rounded-[20px] border border-amber-300/20 bg-amber-300/[0.06] p-4 text-xs leading-5 text-neutral-700">
            {en ? (
              <>
                <strong className="font-semibold text-amber-200">🤫 Rizzler Finisher (+0.2 / −0.3):</strong> Leading in 1v1 (or scoring ≥ 6.0 in solo
                test) at <strong className="font-semibold text-neutral-950">13 seconds</strong> unlocks a gold ring on your chin. Curl your other
                fingers and hold your index finger on the ring along your jaw/chin (or 🤫 to your lips) for ~1 s without smiling. The moment you start
                the finisher, <strong className="font-semibold text-neutral-950">your base score locks</strong> — keep a straight face for +0.2 on top,
                or smile mid-pose for “Rizz failed!” (−0.3). You can practice it in the lobby first!
              </>
            ) : (
              <>
                <strong className="font-semibold text-amber-200">🤫 Rizzler Finisher (+0,2 / −0,3):</strong> Leder du i 1v1 (eller har ≥ 6,0 i solo-test)
                når klokka når <strong className="font-semibold text-neutral-950">13 sekunder</strong>, dukker det opp en gullring på haka di. Knytt de
                andre fingrene og hold pekefingeren på gullringen på haka/kjevelinja (eller 🤫 mot leppa) i ~1 sek uten å smile. Så fort du starter
                finisheren <strong className="font-semibold text-neutral-950">låses grunnsummen din</strong> — holder du maska får du +0,2 boost på toppen,
                men smiler du midt i posen blir det «Rizz failed!» (−0,3). Du kan øve på posen rett i lobbyen først!
              </>
            )}
          </div>

          <div className="break-words rounded-[20px] border border-white/[0.06] bg-[#1f2124] p-4 text-xs leading-5 text-neutral-600">
            <strong className="font-semibold text-neutral-900">{t("Lyssjekk uten hudfarge:", "Skin-tone-free lighting check:")}</strong>{" "}
            {t(
              "En egen gråtone-lyssjekk sjekker bare om bildet er kraftig overeksponert eller altfor mørkt (for morsomme lystips/disser). Den ser aldri på hudfarge og påvirker aldri poengsummen.",
              "A separate grayscale luminance check only detects heavily blown-out or very dark video (for lighting tips/roasts). It never inspects skin tone and never affects your score.",
            )}
          </div>

          <div>
            <p className="mb-2 text-xs font-medium text-neutral-500">{t("Rangtitler", "Rank titles")}</p>
            <div className="flex flex-wrap gap-1.5">
              {RANG_TITLER.map((r) => (
                <span key={r.id} className="inline-flex max-w-full items-center gap-1.5 rounded-full bg-white/[0.05] py-1 pr-3 pl-1 text-xs text-neutral-800">
                  <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold tabular-nums ${r.farge}`}>
                    {r.minPoeng === 9 ? "9+" : `${r.minPoeng.toFixed(0)}–${en ? r.maksPoeng.toFixed(1) : r.maksPoeng.toFixed(1).replace(".", ",")}`}
                  </span>
                  <span className="truncate font-semibold text-neutral-950">{en ? r.tittelEn : r.tittel}</span>
                </span>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </section>
  )
}

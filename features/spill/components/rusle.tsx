"use client"

import { Lightbulb } from "lucide-react"
import { formaterDato } from "../lib/dag"
import type { Omrade } from "../lib/geografi"
import { landEtterId } from "../lib/geografi-svar"
import { useDagligTilstand, type Resultat } from "../lib/lagring"
import { lyder } from "../lib/lyd"
import { avstanderFra, erLost, kortesteVei, mellomland, naboerAv, vurder, type Rusevurdering } from "../lib/rusle"
import { LandVelger } from "./land-gjetting"
import { DelKnapp, Kort, sekundarKnapp } from "./spill-ramme"
import { Verdenskart } from "./verdenskart"

const EKSTRA = 5
const MAKS_HINT = 3

type Tilstand = { v: 1; gjetninger: string[]; hint: string[]; resultat: Resultat }
const tom = (): Tilstand => ({ v: 1, gjetninger: [], hint: [], resultat: { status: "pagar" } })

const FARGE: Record<Rusevurdering | "start" | "mal", string> = {
  start: "#ec4899",
  mal: "#14b8a6",
  perfekt: "#16a34a",
  bra: "#4ade80",
  naer: "#f59e0b",
  omvei: "#ef4444",
  utenfor: "#6b7280",
}
const EMOJI: Record<Rusevurdering, string> = { perfekt: "✅", bra: "🟩", naer: "🟧", omvei: "🟥", utenfor: "⬜" }
const TEKST: Record<Rusevurdering, string> = { perfekt: "Neste steg", bra: "På veien", naer: "Nesten", omvei: "Omvei", utenfor: "Ikke på veien" }

const navn = (id: string) => landEtterId.get(id)?.navn ?? id

/** Each guess judged as it was made: "perfekt" when it also joined the walk from the start right then. */
function vurderinger(fra: string, til: string, gjetninger: string[]) {
  return gjetninger.map((id, i) => {
    const v = vurder(fra, til, id)
    if (v !== "bra") return v
    const naadd = avstanderFra(fra, new Set(gjetninger.slice(0, i)))
    return naboerAv(id).some((n) => naadd.has(n)) ? "perfekt" : "bra"
  })
}

export function Rusle({ dato, fra, til }: { dato: string; fra: string; til: string }) {
  const { verdi, lastet, oppdater } = useDagligTilstand<Tilstand>("rusle", dato, tom)
  const minst = mellomland(fra, til)
  const maks = minst + EKSTRA
  const ferdig = verdi.resultat.status !== "pagar"
  const vurdert = vurderinger(fra, til, verdi.gjetninger)

  const gjett = (l: Omrade) => {
    if (ferdig || verdi.gjetninger.includes(l.id) || l.id === fra || l.id === til) return
    const gjetninger = [...verdi.gjetninger, l.id]
    const lost = erLost(fra, til, gjetninger)
    const v = vurderinger(fra, til, gjetninger).at(-1)!
    if (lost) lyder.seier()
    else if (gjetninger.length >= maks) lyder.feil()
    else lyder.naer(v === "perfekt" ? 1 : v === "bra" ? 0.8 : v === "naer" ? 0.5 : 0.1)
    oppdater((t) => {
      if (t.resultat.status !== "pagar" || t.gjetninger.includes(l.id)) return t
      const n = gjetninger.length
      if (lost) return { ...t, gjetninger, resultat: { status: "vunnet", etikett: `+${n - minst}`, poeng: Math.max(0, EKSTRA + 1 - (n - minst)) } }
      if (n >= maks) return { ...t, gjetninger, resultat: { status: "tapt", etikett: "X", poeng: 0 } }
      return { ...t, gjetninger }
    })
  }

  const hint = () => {
    if (ferdig || verdi.hint.length >= MAKS_HINT) return
    // The next country on a shortest route that the player hasn't named yet.
    const naadd = avstanderFra(fra, new Set(verdi.gjetninger))
    const kandidat = kortesteVei(fra, til)
      .slice(1, -1)
      .find((id) => !verdi.gjetninger.includes(id) && !verdi.hint.includes(id) && naboerAv(id).some((n) => naadd.has(n)))
    const reserve = kortesteVei(fra, til).slice(1, -1).find((id) => !verdi.gjetninger.includes(id) && !verdi.hint.includes(id))
    const id = kandidat ?? reserve
    if (id) oppdater((t) => ({ ...t, hint: [...t.hint, id] }))
  }

  if (!lastet) return <div className="h-96 animate-pulse rounded-3xl bg-white/5" />

  const farger: Record<string, string> = { [fra]: FARGE.start, [til]: FARGE.mal }
  verdi.gjetninger.forEach((id, i) => (farger[id] = FARGE[vurdert[i]]))
  const vei = ferdig && verdi.resultat.status === "tapt" ? kortesteVei(fra, til) : []
  for (const id of vei.slice(1, -1)) if (!farger[id]) farger[id] = "#a78bfa"
  const titler = Object.fromEntries(Object.keys(farger).map((id) => [id, navn(id)]))

  const delTekst = [
    `Rusle · ${formaterDato(dato, "kort")} · ${navn(fra)} → ${navn(til)}`,
    vurdert.map((v) => EMOJI[v]).join(""),
    verdi.resultat.status === "vunnet" ? `${verdi.gjetninger.length} gjetninger (+${verdi.gjetninger.length - minst})` : "Kom ikke fram",
    "thodh.com/spill/rusle",
  ].join("\n")

  return (
    <div className="flex flex-col gap-4">
      <Kort className="flex items-center justify-center gap-3 px-5 py-4 text-center">
        <span className="rounded-full px-3 py-1 text-sm font-semibold text-white" style={{ background: FARGE.start }}>
          {navn(fra)}
        </span>
        <span className="text-neutral-400">→</span>
        <span className="rounded-full px-3 py-1 text-sm font-semibold text-white" style={{ background: FARGE.mal }}>
          {navn(til)}
        </span>
      </Kort>

      {/* Like Travle: only the start, the goal and what you have named are drawn, until the game is over. */}
      <Verdenskart farger={farger} titler={titler} fokus={[fra, til]} fremhevet={[fra, til]} bareFargede={!ferdig} />

      {ferdig ? (
        <Kort className="px-6 py-6 text-center">
          <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-neutral-400">{verdi.resultat.status === "vunnet" ? "Fram!" : "Korteste vei"}</p>
          <p className="mt-2 text-sm text-neutral-700">{kortesteVei(fra, til).map(navn).join(" → ")}</p>
          {verdi.resultat.status === "vunnet" ? (
            <p className="mt-2 text-2xl font-semibold text-neutral-950">
              {verdi.gjetninger.length} gjetninger <span className="text-base text-neutral-500">(+{verdi.gjetninger.length - minst})</span>
            </p>
          ) : null}
          <div className="mt-5 flex justify-center">
            <DelKnapp tekst={delTekst} />
          </div>
        </Kort>
      ) : (
        <>
          <LandVelger id="rusle-forslag" utelat={[fra, til, ...verdi.gjetninger]} onVelg={gjett} plassholder="Neste land på veien" />
          <div className="flex items-center justify-between px-1">
            <p className="font-mono text-[11px] text-neutral-500">
              Minst {minst} land · {maks - verdi.gjetninger.length} gjetninger igjen
            </p>
            {verdi.hint.length < MAKS_HINT ? (
              <button type="button" onClick={hint} className={sekundarKnapp}>
                Hint
              </button>
            ) : null}
          </div>
          {verdi.hint.length ? (
            <ul className="flex flex-col gap-1.5">
              {verdi.hint.map((id) => (
                <li key={id} className="flex items-center gap-2 rounded-xl bg-amber-50 px-4 py-2 text-sm text-amber-900">
                  <Lightbulb className="h-4 w-4" /> Veien går gjennom {navn(id)}
                </li>
              ))}
            </ul>
          ) : null}
        </>
      )}

      {verdi.gjetninger.length ? (
        <ul className="flex flex-wrap gap-1.5">
          {verdi.gjetninger.map((id, i) => (
            <li key={id} className="rounded-full px-3 py-1 text-xs font-medium text-white" style={{ background: FARGE[vurdert[i]] }} title={TEKST[vurdert[i]]}>
              {navn(id)}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}

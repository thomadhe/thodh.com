"use client"

import { ArrowUp } from "lucide-react"
import { useRef, useState } from "react"
import { formaterDato } from "../lib/dag"
import type { Land } from "../lib/geografi"
import { land } from "../lib/geografi"
import { avstand, forslag, landEtterId, naerhet, omrissNokkel, retning } from "../lib/geografi-svar"
import { useDagligTilstand, type Resultat } from "../lib/lagring"
import { DelKnapp, Knapp, Kort } from "./spill-ramme"

const FORSOK = 6

type Tilstand = { v: 1; gjetninger: string[]; resultat: Resultat }
const tom = (): Tilstand => ({ v: 1, gjetninger: [], resultat: { status: "pagar" } })

const PILER = ["⬆️", "↗️", "➡️", "↘️", "⬇️", "↙️", "⬅️", "↖️"]
const pil = (grader: number) => PILER[Math.round(grader / 45) % 8]

function km(n: number) {
  return `${Math.round(n).toLocaleString("nb-NO")} km`
}

function Rad({ gjett, fasit }: { gjett: Land; fasit: Land }) {
  const riktig = gjett.id === fasit.id
  const d = avstand(gjett, fasit)
  const p = riktig ? 100 : naerhet(d)
  return (
    <li className="grid h-11 grid-cols-[1fr_auto_auto_3.5rem] items-center gap-3 rounded-xl bg-neutral-100 px-3.5 text-sm">
      <span className="truncate font-medium text-neutral-950">{gjett.navn}</span>
      <span className="font-mono text-xs tabular-nums text-neutral-600">{riktig ? "" : km(d)}</span>
      <span className="flex w-5 justify-center text-neutral-700">
        {riktig ? "🎉" : <ArrowUp className="h-4 w-4" style={{ transform: `rotate(${retning(gjett, fasit)}deg)` }} />}
      </span>
      <span
        className={`rounded-md py-1 text-center font-mono text-xs font-semibold tabular-nums ${
          riktig ? "bg-emerald-500 text-white" : p >= 80 ? "bg-amber-600 text-white" : "bg-neutral-200 text-neutral-700"
        }`}
      >
        {p} %
      </span>
    </li>
  )
}

export function Omriss({ dato, form, nokkel }: { dato: string; form: string; nokkel: string }) {
  const { verdi, lastet, oppdater } = useDagligTilstand<Tilstand>("omriss", dato, tom)
  const [tekst, setTekst] = useState("")
  const [valgt, setValgt] = useState(0)
  const [melding, setMelding] = useState<string | null>(null)
  const felt = useRef<HTMLInputElement>(null)

  const fasit = land.find((l) => omrissNokkel(l.id, dato) === nokkel)!
  const gjettet = verdi.gjetninger.map((id) => landEtterId.get(id)!).filter(Boolean)
  const ferdig = verdi.resultat.status !== "pagar"
  const treff = forslag(tekst).filter((l) => !verdi.gjetninger.includes(l.id))

  const gjett = (l: Land | undefined) => {
    if (!l || ferdig) return
    setTekst("")
    setValgt(0)
    if (verdi.gjetninger.includes(l.id)) {
      setMelding(`Du har allerede gjettet ${l.navn}.`)
      return
    }
    setMelding(null)
    oppdater((t) => {
      if (t.resultat.status !== "pagar" || t.gjetninger.includes(l.id)) return t
      const gjetninger = [...t.gjetninger, l.id]
      const n = gjetninger.length
      if (l.id === fasit.id) return { ...t, gjetninger, resultat: { status: "vunnet", etikett: `${n}/${FORSOK}`, poeng: FORSOK + 1 - n } }
      if (n >= FORSOK) return { ...t, gjetninger, resultat: { status: "tapt", etikett: `X/${FORSOK}`, poeng: 0 } }
      return { ...t, gjetninger }
    })
    felt.current?.focus()
  }

  if (!lastet) return <div className="h-96 animate-pulse rounded-3xl bg-white/5" />

  const delTekst = [
    `Omriss · ${formaterDato(dato, "kort")} · ${verdi.resultat.status === "vunnet" ? gjettet.length : "X"}/${FORSOK}`,
    ...gjettet.map((g) => {
      if (g.id === fasit.id) return "🟩🟩🟩🟩🟩🎉"
      const p = naerhet(avstand(g, fasit))
      const hele = Math.floor(p / 20)
      return "🟩".repeat(hele) + (p % 20 >= 10 ? "🟨" : "") + "⬜".repeat(5 - hele - (p % 20 >= 10 ? 1 : 0)) + pil(retning(g, fasit))
    }),
    "thodh.com/spill/omriss",
  ].join("\n")

  return (
    <div className="flex flex-col gap-4">
      <Kort className="flex items-center justify-center p-6">
        <svg viewBox="0 0 200 200" className="h-56 w-56 sm:h-64 sm:w-64" role="img" aria-label="Omrisset av dagens land">
          <path d={form} className="fill-sky-400" />
        </svg>
      </Kort>

      {ferdig ? (
        <Kort className="px-6 py-6 text-center">
          <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-neutral-400">
            {verdi.resultat.status === "vunnet" ? "Riktig!" : "Det var"}
          </p>
          <p className="mt-1 text-3xl font-semibold tracking-tight text-neutral-950">{fasit.navn}</p>
          <p className="mt-1 text-sm text-neutral-500">Hovedstad: {fasit.hovedstad}</p>
          <div className="mt-5 flex justify-center">
            <DelKnapp tekst={delTekst} />
          </div>
        </Kort>
      ) : (
        <form
          className="relative flex gap-2"
          onSubmit={(e) => {
            e.preventDefault()
            gjett(treff[valgt])
          }}
        >
          <input
            ref={felt}
            value={tekst}
            onChange={(e) => {
              setTekst(e.target.value)
              setValgt(0)
            }}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") setValgt((v) => Math.min(v + 1, treff.length - 1))
              if (e.key === "ArrowUp") setValgt((v) => Math.max(v - 1, 0))
            }}
            placeholder="Hvilket land?"
            autoFocus
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            enterKeyHint="send"
            role="combobox"
            aria-expanded={treff.length > 0}
            aria-controls="omriss-forslag"
            aria-label="Gjett et land"
            className="h-12 min-w-0 flex-1 rounded-2xl border border-black/10 bg-[var(--spill-flate)] px-4 text-base text-neutral-950 shadow-sm outline-none transition placeholder:text-neutral-400 focus:border-neutral-900"
          />
          <Knapp type="submit" disabled={!treff.length} className="h-12 rounded-2xl">
            Gjett
          </Knapp>
          {treff.length ? (
            <ul
              id="omriss-forslag"
              role="listbox"
              className="absolute top-14 right-0 left-0 z-10 overflow-hidden rounded-2xl border border-black/10 bg-[var(--spill-flate)] py-1 shadow-xl"
            >
              {treff.map((l, i) => (
                <li key={l.id} role="option" aria-selected={i === valgt}>
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => gjett(l)}
                    className={`w-full px-4 py-2 text-left text-sm ${i === valgt ? "bg-neutral-100 text-neutral-950" : "text-neutral-700"}`}
                  >
                    {l.navn}
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </form>
      )}

      {melding ? (
        <p className="px-1 font-mono text-[11px] text-neutral-500" role="status">
          {melding}
        </p>
      ) : null}

      <ul className="flex flex-col gap-1.5">
        {gjettet.map((g) => (
          <Rad key={g.id} gjett={g} fasit={fasit} />
        ))}
        {!ferdig
          ? Array.from({ length: FORSOK - gjettet.length }, (_, i) => (
              <li key={i} className="h-11 rounded-xl border border-dashed border-neutral-200" />
            ))
          : null}
      </ul>
    </div>
  )
}

"use client"

import { useEffect, useState } from "react"
import { stokk } from "../lib/dag"
import { omrader, storeByer, type Omrade } from "../lib/geografi"
import { landEtterId, normaliser } from "../lib/geografi-svar"
import { lyder } from "../lib/lyd"
import { LandVelger } from "./land-gjetting"
import { Knapp, Kort, sekundarKnapp } from "./spill-ramme"

// Worldle-style bonus rounds after the daily outline: neighbours, capital, flag, population, currency,
// area, language and biggest cities. Progress is kept per day in localStorage.

type RundeId = "naboer" | "hovedstad" | "flagg" | "folketall" | "valuta" | "areal" | "sprak" | "byer"
type Utfall = { ferdig: boolean; riktig: boolean; svar: string[] }
type Lagret = Partial<Record<RundeId, Utfall>>

const NAVN: Record<RundeId, string> = {
  naboer: "Naboland",
  hovedstad: "Hovedstad",
  flagg: "Flagg",
  folketall: "Folketall",
  valuta: "Valuta",
  areal: "Areal",
  sprak: "Språk",
  byer: "Største byer",
}

const tall = new Intl.NumberFormat("nb-NO", { notation: "compact", maximumSignificantDigits: 2 })
const navnPa = (id: string) => landEtterId.get(id)?.navn ?? id

function naboerFor(o: Omrade) {
  return o.naboer.length ? { ider: o.naboer, overHav: false } : { ider: o.naboerSjo.slice(0, 5), overHav: true }
}

function lesLagret(dato: string): Lagret {
  try {
    return JSON.parse(localStorage.getItem(`spill:omriss-bonus:${dato}`) ?? "{}") as Lagret
  } catch {
    return {}
  }
}

export function OmrissBonus({ fasit, dato }: { fasit: Omrade; dato: string }) {
  const [lagret, setLagret] = useState<Lagret>({})
  const runder = (Object.keys(NAVN) as RundeId[]).filter((r) => {
    if (r === "naboer") return naboerFor(fasit).ider.length > 0
    if (r === "hovedstad") return Boolean(fasit.hovedstad)
    if (r === "valuta") return Boolean(fasit.valuta)
    if (r === "sprak") return fasit.sprak.length > 0
    if (r === "byer") return (storeByer[fasit.id]?.length ?? 0) >= 3
    if (r === "areal") return Boolean(naboerFor(fasit).ider[0])
    return true
  })
  const [aktiv, setAktiv] = useState<RundeId>(runder[0])

  useEffect(() => {
    // localStorage is only there in the browser.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLagret(lesLagret(dato))
  }, [dato])

  const lagre = (r: RundeId, u: Utfall) => {
    setLagret((l) => {
      const ny = { ...l, [r]: u }
      try {
        localStorage.setItem(`spill:omriss-bonus:${dato}`, JSON.stringify(ny))
      } catch {}
      return ny
    })
    if (u.ferdig) {
      if (u.riktig) lyder.riktig()
      else lyder.feil()
    }
  }

  const utfall = lagret[aktiv] ?? { ferdig: false, riktig: false, svar: [] }
  const neste = runder[runder.indexOf(aktiv) + 1]
  const props = { fasit, dato, utfall, lagre: (u: Utfall) => lagre(aktiv, u) }

  return (
    <Kort className="flex flex-col gap-4 p-5">
      <div className="flex flex-wrap gap-1.5">
        {runder.map((r) => {
          const u = lagret[r]
          return (
            <button
              key={r}
              type="button"
              onClick={() => setAktiv(r)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                r === aktiv
                  ? "bg-neutral-900 text-neutral-50"
                  : u?.ferdig
                    ? u.riktig
                      ? "bg-emerald-600 text-white"
                      : "bg-rose-600 text-white"
                    : "bg-neutral-100 text-neutral-600 hover:text-neutral-900"
              }`}
            >
              {NAVN[r]}
            </button>
          )
        })}
      </div>

      <div key={aktiv} className="mel-inn">
        {aktiv === "naboer" ? <Naboer {...props} /> : null}
        {aktiv === "hovedstad" ? <Hovedstad {...props} /> : null}
        {aktiv === "flagg" ? <Flagg {...props} /> : null}
        {aktiv === "folketall" ? <Folketall {...props} /> : null}
        {aktiv === "valuta" ? <ValutaRunde {...props} /> : null}
        {aktiv === "areal" ? <Areal {...props} /> : null}
        {aktiv === "sprak" ? <Sprak {...props} /> : null}
        {aktiv === "byer" ? <Byer {...props} /> : null}
      </div>

      {utfall.ferdig && neste ? (
        <div className="flex justify-end">
          <button type="button" onClick={() => setAktiv(neste)} className={sekundarKnapp}>
            {NAVN[neste]} →
          </button>
        </div>
      ) : null}
    </Kort>
  )
}

type RundeProps = { fasit: Omrade; dato: string; utfall: Utfall; lagre: (u: Utfall) => void }

function Sporsmal({ children }: { children: React.ReactNode }) {
  return <p className="mb-3 text-[15px] font-semibold text-neutral-950">{children}</p>
}

// ---- Neighbours: type them all, a few spare guesses ----

function Naboer({ fasit, utfall, lagre }: RundeProps) {
  const { ider, overHav } = naboerFor(fasit)
  const forsok = ider.length + 4
  const funnet = utfall.svar.filter((s) => ider.includes(s))
  const igjen = forsok - utfall.svar.length
  const gjett = (l: Omrade) => {
    if (utfall.ferdig || utfall.svar.includes(l.id)) return
    const svar = [...utfall.svar, l.id]
    const alle = ider.every((i) => svar.includes(i))
    if (ider.includes(l.id) && !alle) lyder.naer(0.8)
    lagre({ svar, ferdig: alle || svar.length >= forsok, riktig: alle })
  }
  return (
    <div className="flex flex-col gap-3">
      <Sporsmal>
        {overHav ? `${fasit.navn} har ingen landegrense. Hvilke ${ider.length} land ligger nærmest over havet?` : `Hvilke ${ider.length} land grenser til ${fasit.navn}?`}
      </Sporsmal>
      <ul className="flex flex-wrap gap-1.5">
        {ider.map((i) => {
          const vist = funnet.includes(i) || utfall.ferdig
          return (
            <li
              key={i}
              className={`rounded-lg px-2.5 py-1 text-sm ${funnet.includes(i) ? "bg-emerald-600 text-white" : vist ? "bg-rose-600/80 text-white" : "bg-neutral-100 text-transparent"}`}
            >
              {vist ? navnPa(i) : "??????"}
            </li>
          )
        })}
      </ul>
      {!utfall.ferdig ? (
        <>
          <LandVelger id="bonus-naboer" utelat={utfall.svar} onVelg={gjett} plassholder="Skriv et naboland" />
          <p className="font-mono text-[11px] text-neutral-500">
            {funnet.length}/{ider.length} funnet · {igjen} forsøk igjen
          </p>
        </>
      ) : (
        <p className="text-sm text-neutral-600">{utfall.riktig ? "Alle sammen!" : `Du fant ${funnet.length} av ${ider.length}.`}</p>
      )}
      {utfall.svar.some((s) => !ider.includes(s)) ? (
        <p className="text-xs text-neutral-500">Bom: {utfall.svar.filter((s) => !ider.includes(s)).map(navnPa).join(", ")}</p>
      ) : null}
    </div>
  )
}

// ---- Capital: free text, three tries ----

function Hovedstad({ fasit, utfall, lagre }: RundeProps) {
  const [tekst, setTekst] = useState("")
  const godkjent = [fasit.hovedstad, fasit.hovedstadEn, ...fasit.hovedstadSvar].map(normaliser)
  const send = (e: React.FormEvent) => {
    e.preventDefault()
    const t = tekst.trim()
    if (!t || utfall.ferdig) return
    const riktig = godkjent.includes(normaliser(t))
    const svar = [...utfall.svar, t]
    lagre({ svar, riktig, ferdig: riktig || svar.length >= 3 })
    setTekst("")
  }
  return (
    <div className="flex flex-col gap-3">
      <Sporsmal>Hva heter hovedstaden i {fasit.navn}?</Sporsmal>
      {!utfall.ferdig ? (
        <form onSubmit={send} className="flex gap-2">
          <input
            value={tekst}
            onChange={(e) => setTekst(e.target.value)}
            placeholder="Hovedstad"
            autoComplete="off"
            className="h-11 min-w-0 flex-1 rounded-2xl border border-black/10 bg-[var(--spill-flate)] px-4 text-neutral-950 outline-none focus:border-neutral-900"
          />
          <Knapp type="submit" className="h-11 rounded-2xl">
            Svar
          </Knapp>
        </form>
      ) : null}
      <ul className="flex flex-col gap-1">
        {utfall.svar.map((s, i) => (
          <li key={i} className={`text-sm ${godkjent.includes(normaliser(s)) ? "text-emerald-700" : "text-rose-700 line-through"}`}>
            {s}
          </li>
        ))}
      </ul>
      {utfall.ferdig ? <p className="text-sm text-neutral-600">Hovedstaden er {fasit.hovedstad}.</p> : <p className="font-mono text-[11px] text-neutral-500">{3 - utfall.svar.length} forsøk igjen</p>}
    </div>
  )
}

// ---- Multiple choice helper ----

function Valg({
  alternativer,
  riktig,
  forsok,
  utfall,
  lagre,
  vis = (a) => a,
  rutenett = false,
}: {
  alternativer: string[]
  riktig: string
  forsok: number
  utfall: Utfall
  lagre: (u: Utfall) => void
  vis?: (a: string) => React.ReactNode
  rutenett?: boolean
}) {
  const velg = (a: string) => {
    if (utfall.ferdig || utfall.svar.includes(a)) return
    const svar = [...utfall.svar, a]
    lagre({ svar, riktig: a === riktig, ferdig: a === riktig || svar.length >= forsok })
  }
  return (
    <div className="flex flex-col gap-2">
      <div className={rutenett ? "grid grid-cols-4 gap-2" : "grid grid-cols-2 gap-2"}>
        {alternativer.map((a) => {
          const valgt = utfall.svar.includes(a)
          const stil =
            (utfall.ferdig && a === riktig) || (valgt && a === riktig)
              ? "border-emerald-500 bg-emerald-50"
              : valgt
                ? "border-rose-400 bg-rose-50 opacity-60"
                : "border-black/10 hover:border-black/30"
          return (
            <button
              key={a}
              type="button"
              onClick={() => velg(a)}
              disabled={utfall.ferdig || valgt}
              className={`flex min-h-12 items-center justify-center rounded-xl border-2 px-2 py-2 text-sm text-neutral-900 transition ${stil}`}
            >
              {vis(a)}
            </button>
          )
        })}
      </div>
      {!utfall.ferdig ? <p className="font-mono text-[11px] text-neutral-500">{forsok - utfall.svar.length} forsøk igjen</p> : null}
    </div>
  )
}

/** Up to `n` other entries, seeded so everyone gets the same options. */
function andre(fasit: Omrade, dato: string, salt: string, n: number, filter: (o: Omrade) => boolean) {
  return stokk(
    omrader.filter((o) => o.id !== fasit.id && filter(o)),
    `bonus:${dato}:${salt}`,
  ).slice(0, n)
}

function Flagg({ fasit, dato, utfall, lagre }: RundeProps) {
  const nabo = [...fasit.naboer, ...fasit.naboerSjo].map((i) => landEtterId.get(i)).filter((o): o is Omrade => Boolean(o))
  const ekstra = andre(fasit, dato, "flagg", 7, (o) => !nabo.includes(o) && o.kontinent === fasit.kontinent)
  const valg = stokk([fasit, ...[...nabo, ...ekstra].slice(0, 7)], `bonus:${dato}:flagg:rekke`).map((o) => o.flagg)
  return (
    <div>
      <Sporsmal>Hvilket flagg tilhører {fasit.navn}?</Sporsmal>
      <Valg
        alternativer={valg}
        riktig={fasit.flagg}
        forsok={3}
        utfall={utfall}
        lagre={lagre}
        rutenett
        // eslint-disable-next-line @next/next/no-img-element -- small flag images from flagcdn
        vis={(f) => <img src={`https://flagcdn.com/w160/${f}.png`} alt="" className="h-10 w-full rounded object-contain" />}
      />
    </div>
  )
}

function Folketall({ fasit, dato, utfall, lagre }: RundeProps) {
  const faktorer = stokk([0.2, 0.45, 2.2, 5], `bonus:${dato}:folk`).slice(0, 3)
  const verdier = stokk([fasit.befolkning, ...faktorer.map((f) => fasit.befolkning * f)], `bonus:${dato}:folk:rekke`).map((v) => tall.format(Math.max(1, v)))
  return (
    <div>
      <Sporsmal>Omtrent hvor mange bor i {fasit.navn}?</Sporsmal>
      <Valg alternativer={verdier} riktig={tall.format(fasit.befolkning)} forsok={2} utfall={utfall} lagre={lagre} />
    </div>
  )
}

function ValutaRunde({ fasit, dato, utfall, lagre }: RundeProps) {
  const riktig = fasit.valuta?.navn ?? ""
  const navn = [...new Set(andre(fasit, dato, "valuta", 40, (o) => Boolean(o.valuta) && o.valuta!.navn !== riktig).map((o) => o.valuta!.navn))].slice(0, 3)
  return (
    <div>
      <Sporsmal>Hvilken valuta bruker {fasit.navn}?</Sporsmal>
      <Valg alternativer={stokk([riktig, ...navn], `bonus:${dato}:valuta:rekke`)} riktig={riktig} forsok={2} utfall={utfall} lagre={lagre} />
    </div>
  )
}

function Sprak({ fasit, dato, utfall, lagre }: RundeProps) {
  const riktig = fasit.sprak[0]
  const andreSprak = [...new Set(andre(fasit, dato, "sprak", 60, (o) => o.sprak.length > 0 && !fasit.sprak.includes(o.sprak[0])).map((o) => o.sprak[0]))].slice(0, 3)
  return (
    <div>
      <Sporsmal>Hvilket språk snakkes mest i {fasit.navn}?</Sporsmal>
      <Valg alternativer={stokk([riktig, ...andreSprak], `bonus:${dato}:sprak:rekke`)} riktig={riktig} forsok={2} utfall={utfall} lagre={lagre} />
    </div>
  )
}

// ---- Area: two outlines, which is bigger? ----

function Areal({ fasit, utfall, lagre }: RundeProps) {
  const nabo = landEtterId.get(naboerFor(fasit).ider[0])!
  const [former, setFormer] = useState<Record<string, string>>({})
  useEffect(() => {
    let aktiv = true
    for (const id of [fasit.id, nabo.id]) {
      fetch(`/spill/api/omriss-form?id=${id}`)
        .then((r) => r.json())
        .then((d: { form?: string }) => aktiv && d.form && setFormer((f) => ({ ...f, [id]: d.form! })))
        .catch(() => undefined)
    }
    return () => {
      aktiv = false
    }
  }, [fasit.id, nabo.id])
  const storst = fasit.areal >= nabo.areal ? fasit.id : nabo.id
  return (
    <div>
      <Sporsmal>Hvilket er størst i areal?</Sporsmal>
      <Valg
        alternativer={[fasit.id, nabo.id]}
        riktig={storst}
        forsok={1}
        utfall={utfall}
        lagre={lagre}
        vis={(id) => {
          const o = landEtterId.get(id)!
          return (
            <span className="flex flex-col items-center gap-1 py-1">
              <svg viewBox="0 0 200 200" className="h-20 w-20">
                {former[id] ? <path d={former[id]} className="fill-sky-400" /> : null}
              </svg>
              <span className="font-medium">{o.navn}</span>
              {utfall.ferdig ? <span className="font-mono text-[11px] text-neutral-500">{Math.round(o.areal).toLocaleString("nb-NO")} km²</span> : null}
            </span>
          )
        }}
      />
    </div>
  )
}

// ---- Biggest cities: tap them from largest to smallest ----

function Byer({ fasit, dato, utfall, lagre }: RundeProps) {
  const byer = (storeByer[fasit.id] ?? []).slice(0, 4)
  const riktigRekke = [...byer].sort((a, b) => b.folketall - a.folketall).map((b) => b.navn)
  const vist = stokk(byer, `bonus:${dato}:byer`)
  const trykk = (navn: string) => {
    if (utfall.ferdig || utfall.svar.includes(navn)) return
    const svar = [...utfall.svar, navn]
    const ferdig = svar.length === byer.length
    lagre({ svar, ferdig, riktig: ferdig && svar.every((s, i) => s === riktigRekke[i]) })
  }
  return (
    <div className="flex flex-col gap-2">
      <Sporsmal>Trykk byene i {fasit.navn} fra størst til minst.</Sporsmal>
      {vist.map((b) => {
        const plass = utfall.svar.indexOf(b.navn)
        const korrekt = utfall.ferdig && riktigRekke.indexOf(b.navn) === plass
        return (
          <button
            key={b.navn}
            type="button"
            onClick={() => trykk(b.navn)}
            disabled={utfall.ferdig || plass >= 0}
            className={`flex items-center justify-between rounded-xl border-2 px-4 py-2.5 text-left text-sm transition ${
              utfall.ferdig ? (korrekt ? "border-emerald-500 bg-emerald-50" : "border-rose-400 bg-rose-50") : plass >= 0 ? "border-neutral-900" : "border-black/10 hover:border-black/30"
            }`}
          >
            <span className="text-neutral-900">
              {plass >= 0 ? <span className="mr-2 font-mono text-xs text-neutral-500">{plass + 1}.</span> : null}
              {b.navn}
            </span>
            {utfall.ferdig ? <span className="font-mono text-xs text-neutral-500">{tall.format(b.folketall)}</span> : null}
          </button>
        )
      })}
    </div>
  )
}

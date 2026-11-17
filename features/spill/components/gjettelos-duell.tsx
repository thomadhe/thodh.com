"use client"

import { Share2 } from "lucide-react"
import Link from "next/link"
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type ChangeEvent } from "react"
import { figurFarge } from "../lib/duell/figur"
import { MAKS_SPILLERE, SLINGRING_MS, velgDeltakere, type Deltaker } from "../lib/duell/rom"
import { apne, duellPost, lesSignert, serverNa, sjekkSignaturer, type Signert } from "../lib/duell/signatur"
import {
  ANTALL,
  avstand,
  avvik,
  formaterFullt,
  formaterPoeng,
  formaterTall,
  grupperInndata,
  kategoriInfo,
  markorEtterGruppering,
  NULL_VED,
  poengTrinn,
  SKILLE,
  tolkGjett,
} from "../lib/gjettelos"
import {
  gjAlleHarSvart,
  gjGodkjente,
  godkjennFasit,
  godkjennGjett,
  GJ_SEKUNDER,
  GJ_SVAR_MS,
  GJ_VISNING_SEKUNDER,
  gjPoeng,
  gjRangering,
  gjStart,
  gjTaImot,
  lesGjStatus,
  type GjDuellSporsmal,
  type GjFasit,
  type GjGjett,
  type GjStatus,
} from "../lib/gjettelos-duell"
import { lyder } from "../lib/lyd"
import { slaSammenSvar, type SvarKart } from "../lib/stegern-duell"
import { useDuellrom, type Romkontekst } from "./duell/bruk-duellrom"
import { HarSvart, Lobby, Pall, Romlinje } from "./duell/duell-ui"
import { Studio, type Studiospiller } from "./gjettelos-studio"
import { Figur, type Stemning } from "./stegern-bane"
import { DelKnapp, Klokke } from "./stegern-ui"

// The Gjetteløs duel: up to six friends get the same number questions at once, each with a clock. Everyone's
// guess is stamped by the server and passed round; when the question closes the host fetches the signed answer,
// and every client checks both and scores the guesses with the daily game's own scale (lib/gjettelos-duell.ts).
// Shown in the duel's retro pixel look, on a quiz-studio stage. Nothing here touches the daily game's stats.

const API = "/spill/api/gjettelos"
const signNokkel = (x: Signert) => `${x.s}|${x.j}`
const SVAR_HENDELSE = "gjett"

/** A guess from someone else: stored if this client has none for that player and question yet. */
function taImotGjett(payload: unknown, rom: Romkontekst<GjStatus>) {
  const p = payload as { runde?: unknown; i?: unknown; id?: unknown; dom?: unknown }
  const dom = lesSignert(p.dom)
  if (!dom || typeof p.id !== "string" || typeof p.i !== "number" || !Number.isInteger(p.i) || p.i < 0 || p.i >= ANTALL) return
  const id = p.id
  const i = p.i
  rom.settStatus((s) => (s.runde !== p.runde || !s.deltakere.some((d) => d.id === id) || s.svar[id]?.[i] ? s : { ...s, svar: slaSammenSvar(s.svar, { [id]: { [i]: dom } }) }))
}

function etterMottak(for_: GjStatus, ny: GjStatus, rom: Romkontekst<GjStatus>) {
  const s = rom.status()
  if (!rom.meg || ny.runde !== s.runde || for_.runde !== s.runde) return
  for (const [i, dom] of Object.entries(for_.svar[rom.meg] ?? {})) {
    if (dom && ny.svar[rom.meg]?.[Number(i)]?.s !== dom.s) rom.send(SVAR_HENDELSE, { runde: s.runde, i: Number(i), id: rom.meg, dom })
  }
}

const hendelser = { [SVAR_HENDELSE]: taImotGjett }

const enhetTekst = (q: GjDuellSporsmal) => (q.aarstall ? "" : q.enhet)
/** For the pixel scoreboard: plain spaces (its font has no no-break space) and upper case. */
const tilSkjerm = (s: string) => s.replace(/[  ]/g, " ").toUpperCase()
const erSletting = (type: string | undefined) => type === "deleteContentBackward" || type === "deleteContentForward"

export function GjettelosDuell({ kode, supabaseUrl, supabaseNokkel }: { kode: string; supabaseUrl: string; supabaseNokkel: string }) {
  const rom = useDuellrom<GjStatus>({
    kanal: "gjettelos-duell",
    lagring: "gjettelos:duell",
    kode,
    supabaseUrl,
    supabaseNokkel,
    start: gjStart,
    les: lesGjStatus,
    taImot: gjTaImot,
    hendelser,
    etterMottak,
  })
  const { status, statusRef, settStatus, send, meg, erVert, vert, tilkobling, tilstedeIder, iRommet, klare, kanStarte, nyFase, faseStart } = rom
  const antall = status.sporsmal.length || ANTALL

  const [tekst, setTekst] = useState("")
  const [markor, setMarkor] = useState<{ pos: number } | null>(null)
  const [opptatt, setOpptatt] = useState(false)
  const [melding, setMelding] = useState<string | null>(null)
  const [na, setNa] = useState(() => serverNa())
  const felt = useRef<HTMLInputElement>(null)

  // ---- which guesses and answers count ----
  const [sjekket, setSjekket] = useState<Record<string, boolean>>({})
  const alle = useMemo(
    () => [...Object.values(status.svar).flatMap((rad) => Object.values(rad ?? {})), ...Object.values(status.fasiter)].filter((x): x is Signert => !!x),
    [status.svar, status.fasiter],
  )
  useEffect(() => {
    const nye = alle.filter((x) => !(signNokkel(x) in sjekket))
    if (!nye.length) return
    let aktiv = true
    void sjekkSignaturer(nye)
      .then((ok) => {
        if (aktiv) setSjekket((f) => ({ ...f, ...Object.fromEntries(nye.map((x, i) => [signNokkel(x), ok[i]])) }))
      })
      .catch(() => {})
    return () => {
      aktiv = false
    }
  }, [alle, sjekket])
  const { gjett, fasiter } = useMemo(() => gjGodkjente(kode, status, (x) => sjekket[signNokkel(x)] === true), [kode, status, sjekket])
  const gjettRef = useRef(gjett)
  useEffect(() => {
    gjettRef.current = gjett
  })

  // Forged or late messages are dropped, so the real ones can take their place.
  useEffect(() => {
    settStatus((s) => {
      let endret = false
      const svar: SvarKart<Signert> = {}
      for (const [id, rad] of Object.entries(s.svar)) {
        svar[id] = {}
        for (const [i, x] of Object.entries(rad ?? {})) {
          if (!x) continue
          const ok = sjekket[signNokkel(x)]
          if (ok === false || (ok === true && !godkjennGjett(apne(x), kode, s, id, Number(i)))) endret = true
          else svar[id]![Number(i)] = x
        }
      }
      const fa: GjStatus["fasiter"] = {}
      for (const [i, x] of Object.entries(s.fasiter)) {
        if (!x) continue
        const ok = sjekket[signNokkel(x)]
        if (ok === false || (ok === true && !godkjennFasit(apne(x), kode, s, Number(i)))) endret = true
        else fa[Number(i)] = x
      }
      return endret ? { ...s, svar, fasiter: fa } : s
    })
  }, [sjekket, kode, settStatus, status.svar, status.fasiter])

  // ---- the host's clock: close the question, fetch the signed answer, reveal, move on ----
  const henterFasit = useRef<string | null>(null)
  const lukk = useCallback(async () => {
    const s = statusRef.current
    const q = s.sporsmal[s.nr]
    const nokkel = `${s.runde}:${s.nr}`
    if (!q || henterFasit.current === nokkel) return
    henterFasit.current = nokkel
    try {
      const { dom } = await duellPost<{ dom: Signert }>(API, { type: "duell-fasit", kode, runde: s.runde, i: s.nr, dato: q.dato, nr: q.nr })
      nyFase((x) => (x.runde !== s.runde || x.nr !== s.nr ? x : { ...x, fase: "visning", fasiter: { ...x.fasiter, [s.nr]: dom } }))
    } catch {
      // Tried again on the next tick.
    } finally {
      henterFasit.current = null
    }
  }, [kode, nyFase, statusRef])

  const nesteSporsmal = useCallback(() => {
    nyFase((s) =>
      s.nr < s.sporsmal.length - 1 ? { ...s, fase: "sporsmal", nr: s.nr + 1, frister: [...s.frister.slice(0, s.nr + 1), serverNa() + GJ_SVAR_MS] } : { ...s, fase: "slutt" },
    )
  }, [nyFase])

  useEffect(() => {
    if (!erVert || tilkobling !== "klar") return
    const id = window.setInterval(() => {
      const s = statusRef.current
      if (s.fase === "sporsmal") {
        const f = s.frister[s.nr] ?? 0
        if (gjAlleHarSvart(s, gjettRef.current, tilstedeIder) || serverNa() > f + SLINGRING_MS) void lukk()
      } else if (s.fase === "visning") {
        // A host who took over at the reveal may still have to fetch the answer.
        if (!s.fasiter[s.nr]) void lukk()
        else if (serverNa() - faseStart > GJ_VISNING_SEKUNDER * 1000) nesteSporsmal()
      }
    }, 200)
    return () => window.clearInterval(id)
  }, [erVert, tilkobling, tilstedeIder, lukk, nesteSporsmal, statusRef, faseStart])

  useEffect(() => {
    if (status.fase !== "sporsmal" && status.fase !== "visning") return
    const id = window.setInterval(() => setNa(serverNa()), 250)
    return () => window.clearInterval(id)
  }, [status.fase])

  // ---- this player's guess ----
  const erDeltaker = !!meg && status.deltakere.some((d) => d.id === meg)
  const sporsmal = status.sporsmal[status.nr]
  const mittRaa = meg ? status.svar[meg]?.[status.nr] : undefined
  const mittGjett = meg ? gjett[meg]?.[status.nr] : undefined
  const fristNa = status.fase === "sporsmal" ? (status.frister[status.nr] ?? null) : null
  const igjenMs = fristNa ? Math.max(0, fristNa - na) : null
  const igjen = igjenMs === null ? null : Math.ceil(igjenMs / 1000)
  const tolket = sporsmal ? tolkGjett(tekst, sporsmal.aarstall) : null

  useLayoutEffect(() => {
    if (markor && felt.current && document.activeElement === felt.current) felt.current.setSelectionRange(markor.pos, markor.pos)
  }, [markor])

  const skriv = (e: ChangeEvent<HTMLInputElement>) => {
    setMelding(null)
    let verdi = e.target.value
    if (sporsmal?.aarstall) {
      setTekst(verdi)
      return
    }
    let pos = e.target.selectionStart ?? verdi.length
    // Deleting just a thousand separator would come straight back with the grouping: take the digit beside it.
    const type = (e.nativeEvent as InputEvent).inputType
    if (erSletting(type) && tekst[pos] === SKILLE && verdi === tekst.slice(0, pos) + tekst.slice(pos + 1)) {
      const bak = type === "deleteContentBackward"
      let i = bak ? pos - 1 : pos
      while (i >= 0 && i < verdi.length && /\s/.test(verdi[i])) i += bak ? -1 : 1
      if (i >= 0 && i < verdi.length) {
        verdi = verdi.slice(0, i) + verdi.slice(i + 1)
        pos = bak ? i : pos
      }
    }
    const gruppert = grupperInndata(verdi)
    setTekst(gruppert)
    setMarkor({ pos: markorEtterGruppering(gruppert, verdi.slice(0, pos)) })
  }

  const gjettNa = async (verdi: string, stille = false) => {
    if (opptatt || !erDeltaker || status.fase !== "sporsmal" || mittRaa || !sporsmal || !meg) return
    const g = tolkGjett(verdi, sporsmal.aarstall)
    if (g === null) {
      if (!stille) setMelding(sporsmal.aarstall ? "Skriv et årstall, for eksempel 1905." : "Skriv et tall større enn null, for eksempel 2 500.")
      return
    }
    const { runde, nr } = status
    setOpptatt(true)
    setMelding(null)
    lyder.velg()
    try {
      const { dom } = await duellPost<{ dom: Signert }>(API, { type: "duell-gjett", kode, runde, i: nr, dato: sporsmal.dato, nr: sporsmal.nr, id: meg, gjett: g })
      settStatus((s) => (s.runde !== runde || s.svar[meg]?.[nr] ? s : { ...s, svar: slaSammenSvar(s.svar, { [meg]: { [nr]: dom } }) }))
      send(SVAR_HENDELSE, { runde, i: nr, id: meg, dom })
      setTekst("")
    } catch (e) {
      setMelding((e as Error).message)
    } finally {
      setOpptatt(false)
    }
  }
  const gjettRefFn = useRef(gjettNa)
  useEffect(() => {
    gjettRefFn.current = gjettNa
  })
  // When time runs out, whatever is in the field goes in, if it is a number.
  const tidUte = igjen === 0 && !mittRaa && erDeltaker
  useEffect(() => {
    if (tidUte) void gjettRefFn.current(felt.current?.value ?? "", true)
  }, [tidUte])
  const sistTikk = useRef<number | null>(null)
  useEffect(() => {
    if (igjen === null || igjen > 5 || igjen === sistTikk.current || mittRaa) return
    sistTikk.current = igjen
    if (igjen > 0) lyder.tikk(1 - igjen / 5)
  }, [igjen, mittRaa])
  useEffect(() => {
    if (status.fase === "sporsmal" && erDeltaker && !mittRaa) felt.current?.focus({ preventScroll: true })
  }, [status.fase, status.nr, erDeltaker, mittRaa])

  // The reveal's sound, by this player's points.
  const fasitNa = status.fase === "visning" ? fasiter[status.nr] : undefined
  const minePoeng = meg && fasitNa ? gjPoeng(gjett[meg]?.[status.nr], fasitNa) : null
  useEffect(() => {
    if (minePoeng === null) return
    if (minePoeng >= 85) lyder.seier()
    else if (minePoeng >= 60) lyder.riktig()
    else if (minePoeng >= 30) lyder.naer(minePoeng / 100)
    else lyder.feil()
  }, [minePoeng, status.runde, status.nr])

  // ---- host: start (the round's questions are fetched while the lobby fills up) ----
  const [starter, setStarter] = useState(false)
  const forhand = useRef<{ runde: number; sporsmal: Promise<GjDuellSporsmal[]> } | null>(null)
  const hentSporsmal = useCallback(
    (runde: number) => {
      if (forhand.current?.runde !== runde) {
        const sporsmal = duellPost<{ sporsmal: GjDuellSporsmal[] }>(API, { type: "duell", kode, runde }).then((r) => r.sporsmal)
        sporsmal.catch(() => (forhand.current = null))
        forhand.current = { runde, sporsmal }
      }
      return forhand.current.sporsmal
    },
    [kode],
  )
  useEffect(() => {
    if (erVert && tilkobling === "klar" && status.fase === "lobby") void hentSporsmal(status.runde).catch(() => {})
  }, [erVert, tilkobling, status.fase, status.runde, hentSporsmal])

  const start = async () => {
    if (!kanStarte || starter) return
    setStarter(true)
    setMelding(null)
    try {
      const sporsmal = await hentSporsmal(statusRef.current.runde)
      lyder.velg()
      nyFase((s) => ({ ...s, fase: "sporsmal", nr: 0, sporsmal, deltakere: velgDeltakere(klare), svar: {}, fasiter: {}, frister: [serverNa() + GJ_SVAR_MS] }))
    } catch (e) {
      setMelding((e as Error).message)
    } finally {
      setStarter(false)
    }
  }

  // ---- the stage ----
  const ferdige = status.fase === "lobby" ? 0 : status.fase === "sporsmal" ? status.nr : status.fase === "visning" && fasitNa ? status.nr + 1 : status.fase === "slutt" ? antall : status.nr
  const stilling = useMemo(() => gjRangering(status.deltakere, gjett, fasiter, ferdige), [status.deltakere, gjett, fasiter, ferdige])
  const scene: Studiospiller[] = useMemo(() => {
    if (status.fase === "lobby")
      return iRommet.slice(0, MAKS_SPILLERE).map((t, i) => ({ id: t.id, figur: t.id === meg ? rom.figur : t.figur, farge: i, poeng: null, stemning: "vanlig", svart: false, deg: t.id === meg }))
    return status.deltakere.map((d) => {
      const p = stilling.find((x) => x.id === d.id)
      let stemning: Stemning = "vanlig"
      let poeng = p ? formaterPoeng(p.poeng) : "0,0"
      let poengFarge: string | undefined
      if (status.fase === "visning" && fasitNa) {
        const q = gjPoeng(gjett[d.id]?.[status.nr], fasitNa) ?? 0
        stemning = q >= 60 ? "glad" : q < 30 ? "lei" : "vanlig"
        poeng = `+${formaterPoeng(q)}`
        poengFarge = poengTrinn(q).farge
      } else if (status.fase === "slutt") stemning = p?.plass === 1 ? "glad" : "vanlig"
      return { id: d.id, figur: d.figur, farge: d.farge, poeng, poengFarge, stemning, svart: status.fase === "sporsmal" && !!gjett[d.id]?.[status.nr], deg: d.id === meg }
    })
  }, [status, iRommet, meg, rom.figur, stilling, gjett, fasitNa])
  const skjerm =
    status.fase === "lobby"
      ? "GJETTELØS"
      : status.fase === "sporsmal"
        ? `SPØRSMÅL ${status.nr + 1}/${antall}`
        : status.fase === "visning"
          ? fasitNa && sporsmal
            ? tilSkjerm(formaterTall(fasitNa.fasit, fasitNa.aarstall))
            : "FASIT ..."
          : "FERDIG!"
  const lys = status.fase === "slutt" ? (stilling[0]?.id ?? null) : status.fase === "visning" && fasitNa ? (stilling.slice().sort((a, b) => (b.per[status.nr] ?? 0) - (a.per[status.nr] ?? 0))[0]?.id ?? null) : null

  const lenke = typeof window === "undefined" ? "" : `${window.location.origin}/spill/gjettelos/duell/${kode}`

  if (!rom.klient || !rom.okt) return <div className="px-panel h-[260px] animate-pulse" />

  return (
    <div className="flex flex-col gap-4">
      <Romlinje kode={kode} lenke={lenke} kompakt={status.fase !== "lobby"} delTekst={`Bli med i Gjetteløs-duellen min! Kode ${kode}`} />

      <div className="px-panel overflow-hidden">
        <Studio spillere={scene.length ? scene : [{ id: "tom", figur: rom.figur, farge: 0, poeng: null, stemning: "vanlig", svart: false }]} skjerm={skjerm} lys={lys} etikett="Studioet med alle spillerne">
          <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-center justify-between gap-2 p-1.5">
            {status.fase === "lobby" ? (
              <p className="px-etikett px-blink bg-[#050817]/70 px-1.5 py-1 text-[#ffd0f4]">Venter på spillere</p>
            ) : (
              <ol className="flex gap-1" aria-label="Spørsmål">
                {Array.from({ length: antall }, (_, i) => {
                  const ferdig = i < ferdige
                  const aktiv = status.fase === "sporsmal" && i === status.nr
                  return (
                    <li key={i} className={`px-brikke ${ferdig ? "bg-[#38e8ff] text-[#04141a]" : aktiv ? "px-blink bg-white text-[#0b1020]" : "bg-[#121a45]/90 text-[#6b7bb0]"}`}>
                      {i + 1}
                    </li>
                  )
                })}
              </ol>
            )}
            <p className="px-etikett bg-[#050817]/70 px-1.5 py-1">
              {status.fase === "lobby" ? `${Math.min(iRommet.length, MAKS_SPILLERE)}/${MAKS_SPILLERE}` : `Runde ${status.runde + 1}`}
            </p>
          </div>
        </Studio>
      </div>

      {tilkobling === "feil" ? (
        <section className="px-panel px-panel-rosa p-4">
          <p className="px-skrift text-[20px] text-white">Fikk ikke kontakt med rommet.</p>
          <p className="mt-1 text-sm text-[#b9c3ea]">Sjekk nettet og last siden på nytt. Du kommer tilbake på samme plass.</p>
        </section>
      ) : tilkobling === "kobler" ? (
        <section className="px-panel p-4">
          <p className="px-etikett px-blink">Kobler til rommet …</p>
        </section>
      ) : status.fase === "lobby" ? (
        <Lobby
          iRommet={iRommet}
          meg={meg}
          vertId={vert?.id ?? null}
          runde={status.runde}
          navn={rom.navn}
          settNavn={rom.settNavn}
          figur={rom.figur}
          settFigur={rom.settFigur}
          klar={rom.klar}
          settKlar={rom.settKlar}
          antallKlare={klare.length}
          kanStarte={kanStarte}
          starter={starter}
          start={start}
          melding={melding}
          info={
            <p>
              Opptil fem tallspørsmål, {GJ_SEKUNDER} sekunder hver. Alle gjetter samtidig, og så ser dere hvem som kom nærmest. Poengene regnes som i dagens
              Gjetteløs, opptil 100 per spørsmål. Spørsmålene er fra tidligere dager, og duellen teller ikke i statistikken din.
            </p>
          }
        />
      ) : status.fase === "sporsmal" && sporsmal ? (
        <section key={`${status.runde}-${status.nr}`} className="px-panel px-hopp-inn p-4">
          <div className="flex items-center justify-between gap-3">
            <p className="px-etikett">
              {kategoriInfo(sporsmal.kategori).navn} · {status.nr + 1}/{antall}
            </p>
            {igjen !== null ? <p className={`px-skrift text-[22px] leading-none font-bold tabular-nums ${igjen <= 5 ? "text-[#ff4fd8]" : "text-white"}`}>{igjen}</p> : null}
          </div>
          <h2 className="px-skrift mt-2 text-[24px] leading-[1.15] font-semibold text-white">{sporsmal.tekst}</h2>
          {igjenMs !== null ? (
            <div className="mt-3">
              <Klokke igjenMs={igjenMs} />
            </div>
          ) : null}
          {!erDeltaker ? (
            <p className="mt-3 text-sm leading-6 text-[#b9c3ea]">Runden er i gang, så du ser på denne gangen. Du er med fra neste runde.</p>
          ) : mittGjett ? (
            <div className="mt-3">
              <p className="px-etikett text-[#a3e635]">Låst inn</p>
              <p className="px-tall mt-1 text-[28px] leading-none font-bold text-white">
                {formaterTall(mittGjett.g, sporsmal.aarstall)} <span className="text-[16px] font-normal text-[#9fb0dd]">{enhetTekst(sporsmal)}</span>
              </p>
              <p className="mt-2 text-[13px] text-[#8b9bd0]">Fasit kommer når alle har svart eller tiden er ute.</p>
            </div>
          ) : mittRaa ? (
            <p className="px-etikett px-blink mt-3">Låser inn …</p>
          ) : (
            <form
              className="mt-3"
              onSubmit={(e) => {
                e.preventDefault()
                void gjettNa(tekst)
              }}
            >
              <div className="flex gap-2">
                <label className="px-felt flex h-[54px] min-w-0 flex-1 items-center gap-2 px-3">
                  <input
                    ref={felt}
                    value={tekst}
                    onChange={skriv}
                    maxLength={40}
                    inputMode={sporsmal.aarstall ? "numeric" : "decimal"}
                    autoComplete="off"
                    autoCorrect="off"
                    spellCheck={false}
                    enterKeyHint="go"
                    placeholder={sporsmal.aarstall ? "Årstall" : "Ditt svar"}
                    aria-label={sporsmal.aarstall ? "Årstall" : `Ditt svar i ${sporsmal.enhet}`}
                    className="px-tall h-full min-w-0 flex-1 bg-transparent text-[22px] font-bold outline-none placeholder:text-[18px] placeholder:font-normal placeholder:text-[#4b5a92]"
                  />
                  {enhetTekst(sporsmal) ? <span className="max-w-[40%] shrink-0 truncate text-[14px] text-[#9fb0dd]">{enhetTekst(sporsmal)}</span> : null}
                </label>
                <button type="submit" disabled={opptatt || !tekst.trim()} className="px-knapp h-[54px]">
                  Gjett
                </button>
              </div>
              <p className="mt-2 min-h-5 text-[13px] tabular-nums" aria-live="polite">
                {melding ? (
                  <span className="text-[#fb7185]">{melding}</span>
                ) : tolket !== null && !sporsmal.aarstall && /[a-zæøå]/i.test(tekst) ? (
                  <span className="text-[#8b9bd0]">
                    = {formaterFullt(tolket)} {enhetTekst(sporsmal)}
                  </span>
                ) : tolket !== null && !sporsmal.aarstall && tolket >= 1e6 ? (
                  <span className="text-[#8b9bd0]">= {formaterTall(tolket)}</span>
                ) : null}
              </p>
            </form>
          )}
          <HarSvart deltakere={status.deltakere} har={(id) => !!gjett[id]?.[status.nr]} tilstede={tilstedeIder} />
        </section>
      ) : status.fase === "visning" && sporsmal ? (
        <Visning
          status={status}
          sporsmal={sporsmal}
          fasit={fasitNa}
          gjett={gjett}
          stilling={stilling}
          meg={meg}
          erVert={erVert}
          sekunderIgjen={Math.max(0, Math.ceil(GJ_VISNING_SEKUNDER - (na - faseStart) / 1000))}
          neste={nesteSporsmal}
        />
      ) : status.fase === "slutt" ? (
        <Slutt status={status} gjett={gjett} fasiter={fasiter} meg={meg} erVert={erVert} vertNavn={vert?.navn || "Verten"} spillIgjen={() => (lyder.velg(), rom.spillIgjen())} />
      ) : null}
    </div>
  )
}

/** The widest a guess is drawn from the answer, either way: where the points reach zero. */
const KANT = Math.log10(NULL_VED)

/**
 * Every guess on one line, on the same logarithmic scale as the points: the answer in the middle, too low to the
 * left, too high to the right. The scale widens to the furthest guess, up to where the points run out; its ends are
 * labelled with the number they stand for.
 */
function Tallinje({ fasit, rader }: { fasit: GjFasit; rader: { id: string; navn: string; farge: string; g: number | null; deg: boolean }[] }) {
  const xer = rader.map((r) => (r.g === null ? null : (avstand(r.g, fasit.fasit, fasit.aarstall) ?? KANT)))
  const spenn = Math.min(KANT, Math.max(Math.log10(1.5), ...xer.map((x) => (x === null ? 0 : Math.abs(x) * 1.15))))
  const tilProsent = (x: number) => 50 + (Math.max(-spenn, Math.min(spenn, x)) / spenn) * 46
  // The number at a point of the scale, for the end labels.
  const verdiVed = (x: number) => (fasit.aarstall ? 2030 - (2030 - fasit.fasit) * 10 ** (-x / 2) : fasit.fasit * 10 ** x)
  // Dots that would sit on top of each other go up a row.
  const rad: number[] = []
  const brukt: { p: number; r: number }[] = []
  xer.forEach((x, i) => {
    if (x === null) return (rad[i] = -1)
    const p = tilProsent(x)
    let r = 0
    while (brukt.some((b) => b.r === r && Math.abs(b.p - p) < 7)) r++
    brukt.push({ p, r })
    rad[i] = r
  })
  const rader_ = Math.max(1, ...rad.map((r) => r + 1))
  return (
    <div aria-hidden="true" className="mt-3">
      <div className="relative" style={{ height: 22 + rader_ * 20 }}>
        <div className="absolute inset-x-[4%] bottom-[14px] h-[3px] bg-[#263370]" />
        {[-1, -0.5, 0.5, 1].map((t) => (
          <span key={t} className="absolute bottom-[10px] h-[11px] w-[2px] bg-[#263370]" style={{ left: `${50 + t * 46}%` }} />
        ))}
        <span className="absolute bottom-[6px] w-[3px] -translate-x-1/2 bg-[#a3e635] shadow-[0_0_10px_#a3e635]" style={{ left: "50%", top: 0 }} />
        {rader.map((r, i) =>
          xer[i] === null ? null : (
            <span
              key={r.id}
              className="px-merke absolute -translate-x-1/2 !px-1 !py-0.5 normal-case"
              style={{ left: `${tilProsent(xer[i]!)}%`, bottom: 22 + rad[i] * 20, background: r.farge, boxShadow: r.deg ? "0 0 0 2px #fff" : undefined }}
              title={r.navn}
            >
              {r.navn.slice(0, 3)}
            </span>
          ),
        )}
      </div>
      <div className="relative h-4 text-[11px] text-[#8b9bd0]">
        <span className="px-etikett absolute left-0 !text-[10px]">{formaterTall(verdiVed(-spenn), fasit.aarstall)}</span>
        <span className="px-etikett absolute left-1/2 -translate-x-1/2 !text-[10px] text-[#a3e635]">Fasit</span>
        <span className="px-etikett absolute right-0 !text-[10px]">{formaterTall(verdiVed(spenn), fasit.aarstall)}</span>
      </div>
    </div>
  )
}

/** A source as a link when it is a URL, otherwise its name. */
function Kilde({ kilde }: { kilde: string }) {
  if (!/^https?:\/\//.test(kilde)) return <>{kilde}</>
  return (
    <a href={kilde} target="_blank" rel="noreferrer" className="underline decoration-dotted underline-offset-2 hover:text-white">
      {new URL(kilde).hostname.replace(/^www\./, "")}
    </a>
  )
}

function Visning({
  status,
  sporsmal,
  fasit,
  gjett,
  stilling,
  meg,
  erVert,
  sekunderIgjen,
  neste,
}: {
  status: GjStatus
  sporsmal: GjDuellSporsmal
  fasit: GjFasit | undefined
  gjett: SvarKart<GjGjett>
  stilling: ReturnType<typeof gjRangering>
  meg: string | null
  erVert: boolean
  sekunderIgjen: number
  neste: () => void
}) {
  const siste = status.nr === status.sporsmal.length - 1
  if (!fasit) {
    return (
      <section className="px-panel p-4">
        <p className="px-etikett px-blink">Henter fasit …</p>
      </section>
    )
  }
  const rader = stilling
    .map((p) => {
      const g = gjett[p.id]?.[status.nr]
      return { p, g, q: gjPoeng(g, fasit) ?? 0 }
    })
    .sort((a, b) => b.q - a.q || a.p.plass - b.p.plass)
  return (
    <section key={`${status.runde}-${status.nr}`} className="px-panel px-hopp-inn p-4">
      <p className="px-etikett">
        Spørsmål {status.nr + 1} av {status.sporsmal.length} · fasit
      </p>
      <p className="mt-1.5 text-[15px] leading-snug text-[#d7defa]">{sporsmal.tekst}</p>
      <p className="px-tall mt-2 text-[34px] leading-none font-bold text-[#a3e635] [text-shadow:0_0_18px_rgb(163_230_53/0.55)]">
        {fasit.ca ? <span className="text-[18px] font-normal text-[#9fb0dd]">ca. </span> : null}
        {formaterTall(fasit.fasit, fasit.aarstall)} <span className="text-[16px] font-normal text-[#9fb0dd]">{enhetTekst(sporsmal)}</span>
      </p>
      <Tallinje fasit={fasit} rader={rader.map(({ p, g }) => ({ id: p.id, navn: p.navn, farge: figurFarge(p.figur), g: g?.g ?? null, deg: p.id === meg }))} />
      <ol className="mt-3 grid gap-1.5">
        {rader.map(({ p, g, q }) => {
          const trinn = poengTrinn(q)
          return (
            <li key={p.id} className={`px-panel px-panel-dempet flex items-center gap-2 py-1.5 pr-2.5 pl-1 ${p.id === meg ? "bg-[#14205a]" : ""}`}>
              <Figur figur={p.figur} stemning={q >= 60 ? "glad" : q < 30 ? "lei" : "vanlig"} className="h-9 w-[30px] shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-medium text-[#d7defa]">{p.navn}</p>
                <p className="truncate text-[15px] leading-tight text-white">
                  {g ? <span className="px-tall font-bold">{formaterTall(g.g, sporsmal.aarstall)}</span> : "Ikke noe svar"}
                  {g && enhetTekst(sporsmal) ? <span className="text-[13px] text-[#9fb0dd]"> {enhetTekst(sporsmal)}</span> : null}
                </p>
                {g ? <p className="text-[11px] text-[#8b9bd0]">{avvik(g.g, fasit.fasit, fasit.aarstall)}</p> : null}
              </div>
              <div className="flex shrink-0 flex-col items-end">
                <span className="px-tall text-[22px] leading-none font-bold" style={{ color: trinn.farge, textShadow: `0 0 14px ${trinn.farge}99` }}>
                  {formaterPoeng(q)}
                </span>
                <span className="px-etikett mt-1 !text-[10px]">Sum {formaterPoeng(p.poeng)}</span>
              </div>
            </li>
          )
        })}
      </ol>
      {fasit.info ? <p className="mt-3 text-[13px] leading-5 text-[#c7d2fe]">{fasit.info}</p> : null}
      <p className="mt-2 text-[11px] leading-4 text-[#6b7bb0]">
        Kilde: <Kilde kilde={fasit.kilde} />
        {fasit.per ? ` · per ${fasit.per}` : ""}
      </p>
      <div className="mt-4 flex items-center justify-between gap-3">
        <p className="px-etikett">
          {siste ? "Pallen" : "Neste"} om {sekunderIgjen} s
        </p>
        {erVert ? (
          <button type="button" className="px-knapp" onClick={neste}>
            {siste ? "Til pallen ▶" : "Neste ▶"}
          </button>
        ) : null}
      </div>
    </section>
  )
}

function Slutt({
  status,
  gjett,
  fasiter,
  meg,
  erVert,
  vertNavn,
  spillIgjen,
}: {
  status: GjStatus
  gjett: SvarKart<GjGjett>
  fasiter: Partial<Record<number, GjFasit>>
  meg: string | null
  erVert: boolean
  vertNavn: string
  spillIgjen: () => void
}) {
  const antall = status.sporsmal.length
  const stilling = gjRangering(status.deltakere, gjett, fasiter, antall)
  const min = stilling.find((p) => p.id === meg)
  const maks = antall * 100
  const delTekst = [
    `Gjetteløs · duell · ${min ? `${min.plass}. plass av ${stilling.length}` : `${stilling.length} spillere`}`,
    ...stilling.slice(0, 3).map((p) => `${["🥇", "🥈", "🥉"][p.plass - 1] ?? `${p.plass}.`} ${p.navn} ${formaterPoeng(p.poeng)}/${maks}`),
    "thodh.com/spill/gjettelos",
  ].join("\n")
  return (
    <div className="px-hopp-inn flex flex-col gap-4">
      <section className="px-panel px-panel-rosa p-4">
        <p className="px-etikett text-center text-[#ffb3ee]">Duellen er over</p>
        <div className="mt-3">
          <Pall verdiKlasse="px-tall text-[13px]" rader={stilling.map((p) => ({ id: p.id, navn: p.navn, figur: p.figur, plass: p.plass, verdi: `${formaterPoeng(p.poeng)} p` }))} />
        </div>
        {min ? (
          <p className="px-skrift mt-4 text-center text-[18px] text-white">
            Du ble nummer <span className="px-neon px-neon-liten">{min.plass}</span> med <span className="px-tall text-[16px]">{formaterPoeng(min.poeng)}</span> av <span className="px-tall text-[16px]">{maks}</span>
          </p>
        ) : null}
        <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
          {erVert ? (
            <button type="button" className="px-knapp px-knapp-rosa" onClick={spillIgjen}>
              Spill igjen ▶
            </button>
          ) : (
            <p className="px-etikett w-full text-center">Venter på at {vertNavn} starter en ny runde</p>
          )}
          <DelKnapp tekst={delTekst}>
            <Share2 className="h-4 w-4" />
            Del
          </DelKnapp>
        </div>
      </section>
      <ol className="grid gap-1.5">
        {stilling.map((p) => (
          <Plassrad key={p.id} p={p} meg={meg} />
        ))}
      </ol>
      <p className="text-center text-[13px] text-[#8b9bd0]">
        <Link href="/spill/gjettelos" className="underline decoration-dotted underline-offset-4 hover:text-white">
          Til dagens Gjetteløs
        </Link>
      </p>
    </div>
  )
}

function Plassrad({ p, meg }: { p: Deltaker & { poeng: number; plass: number; per: (number | null)[] }; meg: string | null }) {
  return (
    <li className={`px-panel px-panel-dempet p-2.5 ${p.id === meg ? "bg-[#14205a]" : ""}`}>
      <div className="flex items-center gap-2">
        <span className="px-skrift w-6 shrink-0 text-center text-[18px] text-[#8b9bd0]">{p.plass}</span>
        <span className="h-3 w-3 shrink-0" style={{ background: figurFarge(p.figur) }} aria-hidden="true" />
        <span className="px-skrift min-w-0 flex-1 truncate text-[17px] text-white">{p.navn}</span>
        <span className="px-tall text-[16px] font-bold text-white">{formaterPoeng(p.poeng)}</span>
      </div>
      <ul className="mt-2 flex flex-wrap gap-1 pl-8" aria-label="Poeng per spørsmål">
        {p.per.map((q, i) => (
          <li key={i} className="px-merke tabular-nums" style={{ background: poengTrinn(q ?? 0).farge }}>
            {formaterPoeng(q ?? 0)}
          </li>
        ))}
      </ul>
    </li>
  )
}

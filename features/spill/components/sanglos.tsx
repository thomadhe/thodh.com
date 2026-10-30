"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { formaterDato } from "../lib/dag"
import { useDagligTilstand, type Resultat } from "../lib/lagring"
import { SANG_KATEGORIER, TRINN, type SangKategori } from "../lib/sanglos"
import { DelKnapp, Knapp, Kort } from "./spill-ramme"

export type SangValg = { id: string; title: string; artist: string }
/** A guess; songs from the catalogue search keep their title and artist for display. */
type Forsok = { id: string; sammeArtist: boolean; tittel?: string; artist?: string } | null
type Fasit = { id: string; tittel: string; artist: string; aar: number; bilde?: string; lenke?: string }
type Runde = { forsok: Forsok[]; status: "pagar" | "vunnet" | "tapt"; fasit?: Fasit }
// v2: new song list (Oct 2026). Older saves point at other songs and start fresh.
type Tilstand = { v: 2; runder: Record<SangKategori, Runde>; resultat: Resultat }

const tomRunde = (): Runde => ({ forsok: [], status: "pagar" })
const tom = (): Tilstand => ({
  v: 2,
  runder: { alle: tomRunde(), rock: tomRunde(), hiphop: tomRunde() },
  resultat: { status: "pagar" },
})

async function spor<T>(body: unknown): Promise<T> {
  const svar = await fetch("/spill/api/sanglos", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
  const data = await svar.json().catch(() => ({ melding: "Noe gikk galt." }))
  if (!svar.ok) throw new Error(data.melding ?? "Noe gikk galt.")
  return data as T
}

/** Same title and artist, ignoring versions ("- Radio Edit", "(feat. X)"). */
const sangNokkel = (s: SangValg) => `${sok(s.title.split(/\s[-–]\s|\s?[([]/)[0])}|${sok(s.artist)}`

function sok(tekst: string) {
  return tekst
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9æøå ]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

const LENGST = TRINN[TRINN.length - 1]

/** Whole seconds as m:ss. */
function klokke(t: number) {
  const s = Math.floor(t)
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`
}

/** Where audible sound starts: some previews open with a few seconds of silence or a slow fade-in. */
function forsteLyd(b: AudioBuffer) {
  const kanaler = Array.from({ length: b.numberOfChannels }, (_, i) => b.getChannelData(i))
  const vindu = Math.max(1, Math.floor(b.sampleRate * 0.01))
  for (let i = 0; i + vindu < b.length; i += vindu) {
    let sum = 0
    for (const k of kanaler) for (let j = i; j < i + vindu; j++) sum += k[j] * k[j]
    if (Math.sqrt(sum / (vindu * kanaler.length)) > 0.02) return Math.max(0, i / b.sampleRate - 0.03)
  }
  return 0
}

function useLydspiller(dato: string, kategori: SangKategori) {
  const ctx = useRef<AudioContext | null>(null)
  const lyd = useRef<AudioBuffer | null>(null)
  const oppstart = useRef(0)
  const kilde = useRef<AudioBufferSourceNode | null>(null)
  const forsterker = useRef<GainNode | null>(null)
  const [status, setStatus] = useState<"klar" | "laster" | "spiller" | "feil">("klar")
  const [tid, setTid] = useState(0)
  const [feil, setFeil] = useState<string | null>(null)
  const [volum, setVolum] = useState(0.7)
  const ramme = useRef(0)
  // Bumped on stop/unmount so a play() still awaiting the network never starts late.
  const generasjon = useRef(0)

  const stopp = useCallback(() => {
    generasjon.current++
    cancelAnimationFrame(ramme.current)
    try {
      kilde.current?.stop()
    } catch {
      // Already stopped.
    }
    kilde.current = null
    setStatus((s) => (s === "spiller" ? "klar" : s))
  }, [])

  useEffect(() => {
    lyd.current = null
    return () => {
      // eslint-disable-next-line react-hooks/exhaustive-deps -- a plain counter, not a DOM ref
      generasjon.current++
      cancelAnimationFrame(ramme.current)
      try {
        kilde.current?.stop()
      } catch {
        // Already stopped.
      }
      kilde.current = null
    }
  }, [dato, kategori])

  useEffect(
    () => () => {
      void ctx.current?.close()
      ctx.current = null
      forsterker.current = null
    },
    [],
  )

  useEffect(() => {
    if (forsterker.current) forsterker.current.gain.value = volum
  }, [volum])

  const spill = useCallback(
    async (sekunder: number) => {
      stopp()
      const denne = generasjon.current
      const utdatert = () => denne !== generasjon.current
      setFeil(null)
      // The AudioContext must be created from a user gesture (autoplay rules).
      ctx.current ??= new AudioContext()
      if (ctx.current.state === "suspended") await ctx.current.resume()
      if (utdatert() || !ctx.current) return
      if (!forsterker.current) {
        forsterker.current = ctx.current.createGain()
        forsterker.current.connect(ctx.current.destination)
      }
      forsterker.current.gain.value = volum
      try {
        if (!lyd.current) {
          setStatus("laster")
          const { lyd: url } = await spor<{ lyd: string }>({ type: "lyd", dato, kategori })
          const data = await fetch(url).then((r) => {
            if (!r.ok) throw new Error("Klarte ikke å hente lydklippet.")
            return r.arrayBuffer()
          })
          if (utdatert() || !ctx.current) return
          const dekodet = await ctx.current.decodeAudioData(data)
          if (utdatert() || !ctx.current) return
          lyd.current = dekodet
          oppstart.current = forsteLyd(dekodet)
        }
        const c = ctx.current
        if (!c || !forsterker.current) return
        const varighet = Math.min(sekunder, lyd.current.duration - oppstart.current)
        const k = c.createBufferSource()
        k.buffer = lyd.current
        k.connect(forsterker.current)
        const start = c.currentTime + 0.02
        k.start(start, oppstart.current, varighet)
        kilde.current = k
        setStatus("spiller")
        const tikk = () => {
          const t = Math.max(0, c.currentTime - start)
          setTid(Math.min(t, varighet))
          if (t < varighet) ramme.current = requestAnimationFrame(tikk)
        }
        ramme.current = requestAnimationFrame(tikk)
        k.onended = () => {
          if (kilde.current === k) {
            kilde.current = null
            setStatus("klar")
            setTid(varighet)
          }
        }
      } catch (e) {
        if (utdatert()) return
        setStatus("feil")
        setFeil((e as Error).message || "Klarte ikke å spille av lyden.")
      }
    },
    [dato, kategori, stopp, volum],
  )

  return { spill, stopp, status, tid, feil, volum, setVolum }
}

function SangRunde({
  dato,
  kategori,
  runde,
  sanger,
  oppdaterRunde,
}: {
  dato: string
  kategori: SangKategori
  runde: Runde
  sanger: SangValg[]
  oppdaterRunde: (endring: (r: Runde) => Runde) => void
}) {
  const spiller = useLydspiller(dato, kategori)
  const [sporring, setSporring] = useState("")
  const [aktivt, setAktivt] = useState(0)
  const [opptatt, setOpptatt] = useState(false)
  const [melding, setMelding] = useState<string | null>(null)
  const ferdig = runde.status !== "pagar"
  const lengde = ferdig ? 30 : TRINN[Math.min(runde.forsok.length, TRINN.length - 1)]

  const [katalog, setKatalog] = useState<{ q: string; treff: SangValg[] }>({ q: "", treff: [] })

  // The whole iTunes catalogue is searched (debounced), so any song can be guessed.
  useEffect(() => {
    const q = sok(sporring)
    if (q.length < 2) return
    let aktiv = true
    const t = setTimeout(() => {
      spor<{ treff: SangValg[] }>({ type: "sok", q })
        .then((s) => aktiv && setKatalog({ q, treff: s.treff }))
        .catch(() => undefined)
    }, 250)
    return () => {
      aktiv = false
      clearTimeout(t)
    }
  }, [sporring])

  const treff = useMemo(() => {
    const q = sok(sporring)
    if (q.length < 2) return []
    const ord = q.split(" ")
    const lokale = sanger.filter((s) => {
      const h = sok(`${s.title} ${s.artist}`)
      return ord.every((o) => h.includes(o))
    })
    // Catalogue order first (no hint about which songs are in the daily list); the local list fills in
    // while the search is loading or if it fails.
    const fraKatalog = katalog.q === q ? katalog.treff : []
    const sett = new Set(fraKatalog.map(sangNokkel))
    return [...fraKatalog, ...lokale.filter((s) => !sett.has(sangNokkel(s)))].slice(0, 8)
  }, [sporring, sanger, katalog])

  const hentFasit = useCallback(async () => {
    const f = await spor<Fasit>({ type: "fasit", dato, kategori }).catch(() => undefined)
    if (f) oppdaterRunde((r) => ({ ...r, fasit: f }))
  }, [dato, kategori, oppdaterRunde])

  // Recover the answer if a finished round was stored before it arrived.
  useEffect(() => {
    if (ferdig && !runde.fasit) void hentFasit()
  }, [ferdig, runde.fasit, hentFasit])

  const registrer = async (forsok: Forsok) => {
    if (opptatt || ferdig) return
    setOpptatt(true)
    setMelding(null)
    spiller.stopp()
    try {
      let riktig = false
      let sammeArtist = false
      if (forsok) {
        if (runde.forsok.some((f) => f?.id === forsok.id)) {
          setMelding("Den har du allerede gjettet.")
          return
        }
        ;({ riktig, sammeArtist } = await spor<{ riktig: boolean; sammeArtist: boolean }>({
          type: "gjett",
          dato,
          kategori,
          sangId: forsok.id,
          tittel: forsok.tittel,
          artist: forsok.artist,
        }))
      }
      const n = runde.forsok.length
      oppdaterRunde((r) => {
        if (r.forsok.length !== n || r.status !== "pagar") return r
        const alle = [...r.forsok, forsok ? { ...forsok, sammeArtist } : null]
        return { ...r, forsok: alle, status: riktig ? "vunnet" : alle.length >= TRINN.length ? "tapt" : "pagar" }
      })
      setSporring("")
      if (riktig || n + 1 >= TRINN.length) await hentFasit()
    } catch (e) {
      setMelding((e as Error).message)
    } finally {
      setOpptatt(false)
    }
  }

  const velgTreff = (s: SangValg) => void registrer({ id: s.id, sammeArtist: false, tittel: s.title, artist: s.artist })
  const navn = (f: NonNullable<Forsok>) => {
    if (f.tittel && f.artist) return `${f.tittel} – ${f.artist}`
    const s = sanger.find((x) => x.id === f.id)
    return s ? `${s.title} – ${s.artist}` : f.id
  }

  return (
    <div className="flex flex-col gap-4">
      <Kort className="px-5 py-6">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => (spiller.status === "spiller" ? spiller.stopp() : spiller.spill(lengde))}
            disabled={spiller.status === "laster"}
            className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-violet-600 text-2xl text-white shadow-sm transition hover:scale-105 hover:bg-violet-700 active:scale-95 disabled:opacity-60"
            aria-label={spiller.status === "spiller" ? "Stopp" : "Spill av utdraget"}
          >
            {spiller.status === "laster" ? (
              <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
            ) : spiller.status === "spiller" ? (
              "■"
            ) : (
              "▶"
            )}
          </button>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-neutral-900">
              {ferdig ? "Hele utdraget" : `Forsøk ${runde.forsok.length + 1} av ${TRINN.length}`}
            </p>
            <p className="font-mono text-[11px] text-neutral-400">
              {ferdig ? "30 sek forhåndslytting" : runde.forsok.length ? "Litt mer av låta er låst opp" : "Trykk play og gjett låta"}
            </p>
          </div>
          <label className="flex items-center gap-2 text-neutral-400" title="Volum">
            <span aria-hidden="true">🔈</span>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={spiller.volum}
              onChange={(e) => spiller.setVolum(Number(e.target.value))}
              className="w-20 accent-violet-600"
              aria-label="Volum"
            />
          </label>
        </div>

        {/* Proportional to time, so the playhead moves at the same speed the whole way. */}
        <div className="relative mt-5 h-3 overflow-hidden rounded-full bg-white/10">
          <span
            className="absolute inset-y-0 left-0 bg-violet-400/30"
            style={{ width: `${(ferdig ? 1 : lengde / LENGST) * 100}%` }}
          />
          {!ferdig
            ? TRINN.slice(0, -1).map((t) => (
                <span key={t} className="absolute inset-y-0 w-0.5 bg-black/40" style={{ left: `${(t / LENGST) * 100}%` }} />
              ))
            : null}
          <span
            className="absolute inset-y-0 left-0 bg-violet-500"
            style={{ width: `${Math.min(1, spiller.tid / (ferdig ? 30 : LENGST)) * 100}%` }}
          />
        </div>
        <div className="mt-1.5 flex justify-between font-mono text-[10px] text-neutral-500 tabular-nums">
          <span>{klokke(spiller.tid)}</span>
          <span>{klokke(ferdig ? 30 : LENGST)}</span>
        </div>
        {spiller.feil ? <p className="mt-3 text-xs text-rose-600">{spiller.feil}</p> : null}
      </Kort>

      {ferdig ? (
        <Kort className="flex items-center gap-4 p-4">
          {runde.fasit?.bilde ? (
            // eslint-disable-next-line @next/next/no-img-element -- remote artwork from Apple, shown at a fixed size
            <img src={runde.fasit.bilde} alt="" width={72} height={72} className="h-18 w-18 rounded-xl object-cover" />
          ) : (
            <span className="flex h-18 w-18 items-center justify-center rounded-xl bg-violet-100 text-2xl">♪</span>
          )}
          <div className="min-w-0 flex-1">
            <p className={`font-mono text-[10px] uppercase tracking-widest ${runde.status === "vunnet" ? "text-emerald-600" : "text-rose-600"}`}>
              {runde.status === "vunnet" ? `Klart på ${runde.forsok.length} forsøk` : "Ikke denne gangen"}
            </p>
            <p className="mt-1 truncate text-base font-semibold tracking-tight text-neutral-950">{runde.fasit?.tittel ?? "…"}</p>
            <p className="truncate text-sm text-neutral-500">
              {runde.fasit?.artist}
              {runde.fasit?.aar ? ` · ${runde.fasit.aar}` : ""}
            </p>
            {runde.fasit?.lenke ? (
              <a
                href={runde.fasit.lenke}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1 inline-block font-mono text-[11px] text-violet-400 hover:underline"
              >
                Hør på Apple Music ↗
              </a>
            ) : null}
          </div>
        </Kort>
      ) : (
        <div className="relative">
          <input
            value={sporring}
            onChange={(e) => {
              setSporring(e.target.value)
              setAktivt(0)
            }}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") {
                e.preventDefault()
                setAktivt((a) => Math.min(a + 1, treff.length - 1))
              } else if (e.key === "ArrowUp") {
                e.preventDefault()
                setAktivt((a) => Math.max(a - 1, 0))
              } else if (e.key === "Enter" && treff[aktivt]) {
                e.preventDefault()
                velgTreff(treff[aktivt])
              }
            }}
            placeholder="Søk etter sang eller artist"
            autoComplete="off"
            spellCheck={false}
            disabled={opptatt}
            role="combobox"
            aria-expanded={treff.length > 0}
            aria-controls={`treff-${kategori}`}
            aria-label="Gjett sangen"
            className="h-12 w-full rounded-2xl border border-black/10 bg-[var(--spill-flate)] px-4 text-base text-neutral-950 shadow-sm outline-none transition placeholder:text-neutral-400 focus:border-neutral-900"
          />
          {treff.length ? (
            <ul
              id={`treff-${kategori}`}
              role="listbox"
              className="absolute inset-x-0 top-full z-10 mt-1.5 overflow-hidden rounded-2xl border border-black/10 bg-[var(--spill-flate)] py-1 shadow-lg"
            >
              {treff.map((s, i) => (
                <li key={s.id} role="option" aria-selected={i === aktivt}>
                  <button
                    type="button"
                    onMouseEnter={() => setAktivt(i)}
                    onClick={() => velgTreff(s)}
                    className={`flex w-full flex-col px-4 py-2 text-left ${i === aktivt ? "bg-violet-50" : ""}`}
                  >
                    <span className="text-sm font-medium text-neutral-900">{s.title}</span>
                    <span className="text-xs text-neutral-500">{s.artist}</span>
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
          <div className="mt-2 flex items-center justify-between px-1">
            <p className="font-mono text-[11px] text-neutral-500" role="status">
              {melding ?? (sok(sporring).length >= 2 && !treff.length ? "Ingen treff." : "")}
            </p>
            <button
              type="button"
              onClick={() => registrer(null)}
              disabled={opptatt}
              className="rounded-full px-3 py-1 font-mono text-[11px] uppercase tracking-widest text-neutral-500 transition hover:bg-black/5 hover:text-neutral-900 disabled:opacity-40"
            >
              {runde.forsok.length + 1 < TRINN.length
                ? "Hopp over"
                : "Gi opp"}
            </button>
          </div>
        </div>
      )}

      <ol className="flex flex-col gap-1.5">
        {TRINN.map((_, i) => {
          const f = runde.forsok[i]
          const brukt = i < runde.forsok.length
          const vinner = runde.status === "vunnet" && i === runde.forsok.length - 1
          const stil = !brukt
            ? "border-dashed border-black/10 text-neutral-300"
            : vinner
              ? "border-emerald-300 bg-emerald-50 text-emerald-800"
              : f === null
                ? "border-black/5 bg-neutral-50 text-neutral-400"
                : f.sammeArtist
                  ? "border-amber-300 bg-amber-50 text-amber-900"
                  : "border-rose-200 bg-rose-50 text-rose-800"
          return (
            <li key={i} className={`flex h-10 items-center gap-3 rounded-xl border px-3.5 text-sm ${stil}`}>
              <span className="font-mono text-[10px]">{i + 1}</span>
              <span className="min-w-0 flex-1 truncate">
                {!brukt ? "" : f === null ? "Hoppet over" : navn(f)}
              </span>
              {brukt && f ? (
                <span className="font-mono text-[10px] uppercase">{vinner ? "✓" : f.sammeArtist ? "Riktig artist" : "✕"}</span>
              ) : null}
            </li>
          )
        })}
      </ol>
    </div>
  )
}

export function Sanglos({ dato, sanger }: { dato: string; sanger: SangValg[] }) {
  const { verdi, lastet, oppdater } = useDagligTilstand<Tilstand>("sanglos", dato, tom)
  const [kategori, setKategori] = useState<SangKategori>("alle")

  const oppdaterRunde = useCallback(
    (k: SangKategori) => (endring: (r: Runde) => Runde) =>
      oppdater((t) => {
        const runder = { ...t.runder, [k]: endring(t.runder[k]) }
        const alle = Object.values(runder)
        const klart = alle.filter((r) => r.status === "vunnet").length
        const ferdige = alle.filter((r) => r.status !== "pagar").length
        const resultat: Resultat =
          ferdige === alle.length
            ? { status: klart === alle.length ? "vunnet" : klart ? "ferdig" : "tapt", etikett: `${klart}/${alle.length}`, poeng: klart }
            : { status: "pagar", etikett: `${ferdige}/${alle.length} sanger` }
        return { v: 2, runder, resultat }
      }),
    [oppdater],
  )
  const oppdaterValgt = useMemo(() => oppdaterRunde(kategori), [oppdaterRunde, kategori])

  if (!lastet) return <div className="h-96 animate-pulse rounded-3xl bg-white/5" />

  const alleFerdige = SANG_KATEGORIER.every((k) => verdi.runder[k.id].status !== "pagar")
  const delTekst = [
    `Sangløs · ${formaterDato(dato, "kort")}`,
    ...SANG_KATEGORIER.map(({ id, navn }) => {
      const r = verdi.runder[id]
      const ruter = TRINN.map((_, i) => {
        const f = r.forsok[i]
        if (i >= r.forsok.length) return "⬜"
        if (r.status === "vunnet" && i === r.forsok.length - 1) return "🟩"
        return f === null ? "⬛" : f.sammeArtist ? "🟨" : "🟥"
      }).join("")
      return `${ruter} ${navn}`
    }),
    "thodh.com/spill",
  ].join("\n")

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-3 gap-1 rounded-2xl bg-black/5 p-1" role="tablist">
        {SANG_KATEGORIER.map(({ id, navn }) => {
          const r = verdi.runder[id]
          const merke = r.status === "vunnet" ? "✓" : r.status === "tapt" ? "✕" : r.forsok.length ? `${r.forsok.length}/${TRINN.length}` : ""
          return (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={kategori === id}
              onClick={() => setKategori(id)}
              className={`flex h-10 items-center justify-center gap-1.5 rounded-xl text-sm font-medium transition ${
                kategori === id ? "bg-[var(--spill-flate)] text-neutral-950 shadow-sm" : "text-neutral-500 hover:text-neutral-800"
              }`}
            >
              {navn}
              {merke ? (
                <span
                  className={`font-mono text-[10px] ${
                    r.status === "vunnet" ? "text-emerald-600" : r.status === "tapt" ? "text-rose-600" : "text-neutral-400"
                  }`}
                >
                  {merke}
                </span>
              ) : null}
            </button>
          )
        })}
      </div>

      <SangRunde
        key={`${dato}:${kategori}`}
        dato={dato}
        kategori={kategori}
        runde={verdi.runder[kategori]}
        sanger={sanger}
        oppdaterRunde={oppdaterValgt}
      />

      {alleFerdige ? (
        <div className="flex flex-col items-center gap-3 pt-2">
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-neutral-400">
            Dagens resultat: {verdi.resultat.etikett}
          </p>
          <DelKnapp tekst={delTekst} />
        </div>
      ) : (
        <div className="flex justify-center">
          {verdi.runder[kategori].status !== "pagar" ? (
            <Knapp
              variant="sekundar"
              onClick={() => {
                const neste = SANG_KATEGORIER.find((k) => verdi.runder[k.id].status === "pagar")
                if (neste) setKategori(neste.id)
              }}
            >
              Neste kategori →
            </Knapp>
          ) : null}
        </div>
      )}
    </div>
  )
}

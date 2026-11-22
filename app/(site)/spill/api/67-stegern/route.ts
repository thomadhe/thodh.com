import { z } from "zod"
import { erGyldigKode } from "@/features/spill/lib/duell/rom"
import { fullforServerSpill, lagreOktTilstand, lastOkt } from "@/features/spill/lib/server/okt-lagring"
import {
  duellSporsmal,
  erDuellSporsmal,
  erGjentatt,
  finaleBillett,
  finaleTekst,
  harFinaleBillett,
  harKvittering,
  kanSpillesStegern,
  kvittering,
  sjetteNr,
  stegernDuellDom,
  vurderSvar,
} from "@/features/spill/lib/server/stegern"
import { GJENTA_DM, hoppDm, meter, NORMALE } from "@/features/spill/lib/stegern"

const tekst = z.string().max(80)
const signatur = z.string().max(100)
const oktSkjema = z.object({ j: z.string().max(16_000), s: z.string().max(160) }).optional()

const foresporsel = z.discriminatedUnion("type", [
  // nr 0–4 are the normal prompts and 6 the final, which needs the ticket question 6 handed out.
  z.object({
    type: z.literal("svar"),
    dato: z.string(),
    nr: z.union([z.number().int().min(0).max(4), z.literal(6)]),
    svar: tekst,
    billett: signatur.optional(),
    okt: oktSkjema,
  }),
  z.object({ type: z.literal("sjette"), dato: z.string(), okt: oktSkjema }),
  // `kvittering` is the receipt `svar` gave for the earlier answer, so the player cannot claim another one.
  z.object({ type: z.literal("gjenta"), dato: z.string(), tidligere: tekst, kvittering: signatur, svar: tekst, okt: oktSkjema }),
  // The prompts for one round of a duel, drawn from earlier days only (see duellSporsmal).
  // Startpistolen asks for more (`antall`), since a prompt changes after every bang.
  z.object({ type: z.literal("duell"), kode: z.string().refine(erGyldigKode), runde: z.number().int().min(0).max(999), antall: z.number().int().min(1).max(30).optional() }),
  // One player's answer in a duel: judged here and signed, with the time, so the others can trust it (lib/duell/signatur.ts).
  z.object({
    type: z.literal("duell-svar"),
    kode: z.string().refine(erGyldigKode),
    runde: z.number().int().min(0).max(999),
    // The question in the round; in Startpistolen the prompt's running number, which keeps growing.
    i: z.number().int().min(0).max(100_000),
    // A prompt of an earlier day, or with dato "bank" an index in the duel bank.
    dato: z.string().max(10),
    nr: z.number().int().min(0).max(9999),
    id: z.string().min(1).max(40),
    svar: tekst,
  }),
])

function lesDmKart(v: unknown): Record<string, number> {
  if (!v || typeof v !== "object" || Array.isArray(v)) return {}
  const ut: Record<string, number> = {}
  for (const [k, val] of Object.entries(v as Record<string, unknown>)) {
    if (typeof val === "number" && Number.isFinite(val)) ut[k] = val
  }
  return ut
}

// Answers are judged here so the page never carries the lists. Question 6 names its earlier question only
// when it comes up, and the final's prompt is only told once it is unlocked.
export async function POST(request: Request) {
  const tolket = foresporsel.safeParse(await request.json().catch(() => null))
  if (!tolket.success) return Response.json({ melding: "Ugyldig forespørsel." }, { status: 400 })
  const data = tolket.data
  if (data.type === "duell") {
    const sporsmal = duellSporsmal(data.kode, data.runde, undefined, data.antall)
    if (!sporsmal.length) return Response.json({ melding: "Duellen trenger minst én tidligere dag å hente spørsmål fra." }, { status: 409 })
    return Response.json({ sporsmal, na: Date.now() })
  }
  if (data.type === "duell-svar") {
    if (!erDuellSporsmal(data.dato, data.nr)) return Response.json({ melding: "Spørsmålet hører ikke til en duell." }, { status: 400 })
    const { dom, vurdering } = stegernDuellDom(data)
    return Response.json({ dom, vanligste: vurdering.vanligste, sjeldneste: vurdering.sjeldneste, antall: vurdering.antall, na: Date.now() })
  }
  if (!kanSpillesStegern(data.dato)) return Response.json({ melding: "Ugyldig forespørsel." }, { status: 400 })
  const okt = await lastOkt(request, "67-stegern", data.dato, data.okt)
  const dm = lesDmKart(okt.data.dm)

  if (data.type === "svar") {
    if (data.nr === 6) {
      if (!harFinaleBillett(data.dato, data.billett)) return Response.json({ melding: "Finalen er ikke låst opp." }, { status: 403 })
      const res = vurderSvar(data.dato, 6, data.svar)
      if (dm["6"] === undefined) dm["6"] = hoppDm(res.nivaa, true)
      const harAlleFem = Array.from({ length: NORMALE }, (_, i) => dm[String(i)] !== undefined).every(Boolean)
      const ferdig = harAlleFem && okt.data.gjenta === true
      const nyOkt = await lagreOktTilstand(okt, "67-stegern", data.dato, {
        forsok: Math.max(okt.forsok, 7),
        hint: 0,
        data: { ...okt.data, dm, ...(ferdig ? { ferdig: true } : {}) },
      })
      if (ferdig && !okt.data.ferdig) {
        let sum = GJENTA_DM + dm["6"]
        for (let i = 0; i < NORMALE; i++) sum += dm[String(i)]
        const { bevis } = await fullforServerSpill(okt, {
          spillId: "67-stegern",
          dato: data.dato,
          status: "vunnet",
          etikett: meter(sum),
          poeng: sum / 10,
          forsok: 7,
          hint: 0,
          medTid: false,
        })
        return Response.json({ ...res, okt: nyOkt, ...(bevis ? { bevis } : {}) })
      }
      return Response.json({ ...res, okt: nyOkt })
    }
    const res = vurderSvar(data.dato, data.nr, data.svar)
    if (dm[String(data.nr)] === undefined) dm[String(data.nr)] = hoppDm(res.nivaa)
    const nyOkt = await lagreOktTilstand(okt, "67-stegern", data.dato, {
      forsok: Object.keys(dm).length,
      hint: 0,
      data: { ...okt.data, dm },
    })
    return Response.json({ ...res, kvittering: kvittering(data.dato, data.nr, data.svar), okt: nyOkt })
  }

  if (data.type === "sjette") return Response.json({ n: sjetteNr(data.dato) })

  const nr = sjetteNr(data.dato) - 1
  if (!harKvittering(data.dato, nr, data.tidligere, data.kvittering)) {
    return Response.json({ melding: `Fant ikke svaret ditt på spørsmål ${nr + 1}. Svaret mangler kvittering fra serveren.` }, { status: 403 })
  }
  const riktig = erGjentatt(data.dato, data.tidligere, data.svar)
  const gjenta = typeof okt.data.gjenta === "boolean" ? okt.data.gjenta : riktig
  const harAlleFem = Array.from({ length: NORMALE }, (_, i) => dm[String(i)] !== undefined).every(Boolean)
  const avsluttetUtenFinale = harAlleFem && !gjenta
  const nyOkt = await lagreOktTilstand(okt, "67-stegern", data.dato, {
    forsok: Math.max(okt.forsok, 6),
    hint: 0,
    data: { ...okt.data, dm, gjenta, ...(avsluttetUtenFinale ? { ferdig: true } : {}) },
  })
  let bevis: unknown = undefined
  if (avsluttetUtenFinale && !okt.data.ferdig) {
    let sum = hoppDm(0)
    for (let i = 0; i < NORMALE; i++) sum += dm[String(i)]
    ;({ bevis } = await fullforServerSpill(okt, {
      spillId: "67-stegern",
      dato: data.dato,
      status: "ferdig",
      etikett: meter(sum),
      poeng: sum / 10,
      forsok: 6,
      hint: 0,
      medTid: false,
    }))
  }
  return Response.json(
    riktig
      ? { riktig, finale: finaleTekst(data.dato), billett: finaleBillett(data.dato), okt: nyOkt }
      : { riktig, okt: nyOkt, ...(bevis ? { bevis } : {}) },
  )
}

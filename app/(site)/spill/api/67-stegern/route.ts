import { z } from "zod"
import { erGyldigKode } from "@/features/spill/lib/duell/rom"
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

const tekst = z.string().max(80)
const signatur = z.string().max(100)
const foresporsel = z.discriminatedUnion("type", [
  // nr 0–4 are the normal prompts and 6 the final, which needs the ticket question 6 handed out.
  z.object({ type: z.literal("svar"), dato: z.string(), nr: z.union([z.number().int().min(0).max(4), z.literal(6)]), svar: tekst, billett: signatur.optional() }),
  z.object({ type: z.literal("sjette"), dato: z.string() }),
  // `kvittering` is the receipt `svar` gave for the earlier answer, so the player cannot claim another one.
  z.object({ type: z.literal("gjenta"), dato: z.string(), tidligere: tekst, kvittering: signatur, svar: tekst }),
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
  if (data.type === "svar") {
    if (data.nr === 6) {
      if (!harFinaleBillett(data.dato, data.billett)) return Response.json({ melding: "Finalen er ikke låst opp." }, { status: 403 })
      return Response.json(vurderSvar(data.dato, 6, data.svar))
    }
    return Response.json({ ...vurderSvar(data.dato, data.nr, data.svar), kvittering: kvittering(data.dato, data.nr, data.svar) })
  }
  if (data.type === "sjette") return Response.json({ n: sjetteNr(data.dato) })
  const nr = sjetteNr(data.dato) - 1
  if (!harKvittering(data.dato, nr, data.tidligere, data.kvittering)) {
    return Response.json({ melding: `Fant ikke svaret ditt på spørsmål ${nr + 1}. Svaret mangler kvittering fra serveren.` }, { status: 403 })
  }
  const riktig = erGjentatt(data.dato, data.tidligere, data.svar)
  return Response.json(riktig ? { riktig, finale: finaleTekst(data.dato), billett: finaleBillett(data.dato) } : { riktig })
}

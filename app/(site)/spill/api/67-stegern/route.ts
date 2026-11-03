import { z } from "zod"
import { erGjentatt, finaleTekst, kanSpillesStegern, sjetteNr, vurderSvar } from "@/features/spill/lib/server/stegern"

const tekst = z.string().max(80)
const foresporsel = z.discriminatedUnion("type", [
  // nr 0–4 are the normal prompts and 6 the final.
  z.object({ type: z.literal("svar"), dato: z.string(), nr: z.union([z.number().int().min(0).max(4), z.literal(6)]), svar: tekst }),
  z.object({ type: z.literal("sjette"), dato: z.string() }),
  z.object({ type: z.literal("gjenta"), dato: z.string(), tidligere: tekst, svar: tekst }),
])

// Answers are judged here so the page never carries the lists. Question 6 names its earlier question only
// when it comes up, and the final's prompt is only told once it is unlocked.
export async function POST(request: Request) {
  const tolket = foresporsel.safeParse(await request.json().catch(() => null))
  if (!tolket.success || !kanSpillesStegern(tolket.data.dato)) return Response.json({ melding: "Ugyldig forespørsel." }, { status: 400 })
  const data = tolket.data
  if (data.type === "svar") return Response.json(vurderSvar(data.dato, data.nr, data.svar))
  if (data.type === "sjette") return Response.json({ n: sjetteNr(data.dato) })
  const riktig = erGjentatt(data.dato, data.tidligere, data.svar)
  return Response.json(riktig ? { riktig, finale: finaleTekst(data.dato) } : { riktig })
}

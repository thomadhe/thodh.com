import { z } from "zod"
import { erSignert, offentligNokkel } from "@/features/spill/lib/server/duell-signatur"

const ingenLagring = { "Cache-Control": "no-store" }

// The duels' public key and the server's clock (features/spill/lib/duell/signatur.ts). A duel page asks as soon as
// it opens, which also wakes this function before the first answer.
export function GET() {
  return Response.json({ nokkel: offentligNokkel(), na: Date.now() }, { headers: ingenLagring })
}

const sjekk = z.object({ liste: z.array(z.object({ j: z.string().max(2000), s: z.string().max(100) })).max(40) })

// For browsers without Ed25519 in WebCrypto: the server checks the signatures instead.
export async function POST(request: Request) {
  const tolket = sjekk.safeParse(await request.json().catch(() => null))
  if (!tolket.success) return Response.json({ melding: "Ugyldig forespørsel." }, { status: 400 })
  return Response.json({ ok: tolket.data.liste.map(erSignert), na: Date.now() }, { headers: ingenLagring })
}

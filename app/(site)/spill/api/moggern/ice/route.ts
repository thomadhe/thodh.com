import { hentIceKonfig } from "@/features/spill/lib/moggern/ice"
import { createClient } from "@/lib/supabase/server"

const headers = { "Cache-Control": "private, no-store" }

export async function GET() {
  let innlogget = false
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    innlogget = !!user
  } catch {
    innlogget = false
  }

  const konfig = await hentIceKonfig(
    {
      MOGGERN_TURN_URLS: process.env.MOGGERN_TURN_URLS,
      MOGGERN_TURN_URL: process.env.MOGGERN_TURN_URL,
      MOGGERN_TURN_USERNAME: process.env.MOGGERN_TURN_USERNAME,
      MOGGERN_TURN_CREDENTIAL: process.env.MOGGERN_TURN_CREDENTIAL,
      MOGGERN_CF_TURN_KEY_ID: process.env.MOGGERN_CF_TURN_KEY_ID,
      MOGGERN_CF_TURN_API_TOKEN: process.env.MOGGERN_CF_TURN_API_TOKEN,
      MOGGERN_METERED_DOMAIN: process.env.MOGGERN_METERED_DOMAIN,
      MOGGERN_METERED_API_KEY: process.env.MOGGERN_METERED_API_KEY,
    },
    innlogget,
  )

  return Response.json(konfig, { headers })
}

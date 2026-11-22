import { byggIceKonfig } from "@/features/spill/lib/moggern/ice"
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

  const konfig = byggIceKonfig(
    {
      MOGGERN_TURN_URLS: process.env.MOGGERN_TURN_URLS,
      MOGGERN_TURN_URL: process.env.MOGGERN_TURN_URL,
      MOGGERN_TURN_USERNAME: process.env.MOGGERN_TURN_USERNAME,
      MOGGERN_TURN_CREDENTIAL: process.env.MOGGERN_TURN_CREDENTIAL,
    },
    innlogget,
  )

  return Response.json(konfig, { headers })
}

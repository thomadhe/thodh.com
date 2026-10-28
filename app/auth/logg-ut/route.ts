import { createClient } from "@/lib/supabase/server";
import { sameOrigin } from "@/lib/auth/validation";

export async function POST(request: Request) {
  const headers = { "Cache-Control": "private, no-store" };
  if (!sameOrigin(request)) return Response.json({ error: "Ugyldig forespørsel." }, { status: 403, headers });
  const supabase = await createClient();
  // Only revoke this session. Do not sign the user out of Karrierepiloten too.
  const { error } = await supabase.auth.signOut({ scope: "local" });
  if (error) return Response.json({ error: "Kunne ikke logge ut. Prøv igjen." }, { status: 503, headers });
  return Response.json({ ok: true }, { headers });
}

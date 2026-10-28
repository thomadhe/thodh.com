import { createClient } from "@/lib/supabase/server";
import { readJson, sameOrigin } from "@/lib/auth/validation";
import { decodeProgress, saveProgressSchema } from "@/features/otsjoba/lib/progress";

const headers = { "Cache-Control": "private, no-store" };
const json = (body: unknown, status = 200) => Response.json(body, { status, headers });

export async function GET() {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return json({ error: "Logg inn for å hente fremgangen." }, 401);
  const { data, error } = await supabase.from("otsjoba_progress").select("state,revision").eq("user_id", user.id).maybeSingle();
  if (error) return json({ error: "Fremgangen kunne ikke hentes. Prøv igjen." }, 503);
  try { return json({ userId: user.id, ...decodeProgress(data) }); }
  catch { return json({ error: "Fremgangen kunne ikke leses. Den er ikke overskrevet." }, 503); }
}

export async function PUT(request: Request) {
  if (!sameOrigin(request)) return json({ error: "Ugyldig forespørsel." }, 403);
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return json({ error: "Logg inn igjen før du lagrer." }, 401);
  const input = saveProgressSchema.safeParse(await readJson(request, 1000000).catch(() => null));
  if (!input.success) return json({ error: "Fremgangen har ugyldig format eller er for stor." }, 400);
  // A tab opened as A must not save A's state after another tab signs in as B.
  if (input.data.userId !== user.id) return json({ error: "Kontoen er endret. Åpne Otsjoba på nytt.", code: "account_changed" }, 409);
  const { state, revision } = input.data;
  const result = revision === 0
    ? await supabase.from("otsjoba_progress").insert({ user_id: user.id, state }).select("revision").single()
    : await supabase.from("otsjoba_progress").update({ state }).eq("user_id", user.id).eq("revision", revision).select("revision").maybeSingle();
  if (result.error?.code === "23505" || (!result.error && !result.data)) {
    return json({ error: "Fremgangen er endret i en annen fane eller på en annen enhet.", code: "conflict" }, 409);
  }
  if (result.error || !result.data) return json({ error: "Kunne ikke lagre. Prøv igjen." }, 503);
  return json({ revision: result.data.revision });
}

import Otsjoba from "@/features/otsjoba/components/otsjoba-loader";
import { createClient } from "@/lib/supabase/server";
import { decodeProgress } from "@/features/otsjoba/lib/progress";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function OtsjobaPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/logg-inn?neste=/otsjoba");
  const { data, error } = await supabase.from("otsjoba_progress").select("state,revision").eq("user_id", user.id).maybeSingle();
  let initial;
  try {
    if (error) throw error;
    initial = decodeProgress(data);
  } catch {
    return <main className="account-notice"><h1>Fremgangen kunne ikke hentes</h1><p>Prøv igjen om litt. Det som er lagret på kontoen, er ikke endret.</p><a href="/otsjoba">Prøv igjen</a><a href="/konto">Til kontoen din</a></main>;
  }
  // eslint-disable-next-line react-hooks/purity -- Per-request server timestamp seeds a stable client hydration value.
  const initialNow = Date.now();
  return <Otsjoba userId={user.id} email={user.email || "Kontoen din"} initial={initial} initialNow={initialNow} />;
}

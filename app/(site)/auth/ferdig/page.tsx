import { AuthComplete } from "@/components/auth-complete";
import { safeNext } from "@/lib/auth/validation";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function AuthCompletePage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const client = await createClient();
  const { data: { user } } = await client.auth.getUser();
  if (!user) redirect("/logg-inn");
  return <AuthComplete next={safeNext(params.next)} />;
}

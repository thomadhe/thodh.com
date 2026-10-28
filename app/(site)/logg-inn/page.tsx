import { AuthForm } from "@/components/auth-form";
import { SiteHeader } from "@/components/site-header";
import { safeNext } from "@/lib/auth/validation";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export const metadata = { title: "Logg inn" };
export default async function LoginPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const next = safeNext(params.neste);
  const client = await createClient();
  const { data: { user } } = await client.auth.getUser();
  if (user) redirect(next);
  return <div className="mx-auto min-h-screen max-w-5xl px-5"><SiteHeader actionHref="/" actionLabel="Alle prosjekter" /><main className="mx-auto max-w-lg py-12 sm:py-20"><AuthForm next={next} linkError={!!params.feil} /><p className="mt-6 text-center text-sm text-neutral-500">Du logger inn separat på thodh.com og Karrierepiloten, med samme konto.</p></main></div>;
}

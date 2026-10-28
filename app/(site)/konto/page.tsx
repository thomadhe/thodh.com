import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { AccountActions } from "@/components/account-actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Kontoen din" };
export default async function AccountPage() {
  const client = await createClient();
  const { data: { user } } = await client.auth.getUser();
  if (!user) redirect("/logg-inn?neste=/konto");
  return <div className="mx-auto min-h-screen max-w-5xl px-5"><SiteHeader actionHref="/" actionLabel="Alle prosjekter" /><main className="mx-auto max-w-xl py-14 sm:py-20"><p className="font-mono text-xs uppercase tracking-widest text-neutral-500">thodh.com + Karrierepiloten</p><h1 className="mt-4 text-4xl font-semibold tracking-tight">Kontoen din</h1><p className="mt-4 break-all text-neutral-600">{user.email}</p><p className="mt-6 leading-relaxed text-neutral-600">Samme e-post og passord fungerer begge steder. Fremgangen i Otsjoba tilhører bare deg. Jobbsøknader og CV blir værende i Karrierepiloten.</p><div className="mt-8 grid gap-3">
    {/* Separate root layouts intentionally use full document navigation. */}
    { }
    <a href="/otsjoba" className="rounded-2xl bg-[#3f5c45] p-5 font-medium text-white">Fortsett i Otsjoba →</a>
    <a href="https://karrierepiloten.com" className="rounded-2xl border border-neutral-200 bg-white p-5 font-medium">Åpne Karrierepiloten ↗</a>
  </div><AccountActions /></main></div>;
}

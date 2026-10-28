import { AuthForm } from "@/components/auth-form";
import { SiteHeader } from "@/components/site-header";
import { safeNext } from "@/lib/auth/validation";

export const metadata = { title: "Opprett konto" };
export default async function RegisterPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  return <div className="mx-auto min-h-screen max-w-5xl px-5"><SiteHeader actionHref="/" actionLabel="Alle prosjekter" /><main className="mx-auto max-w-lg py-12 sm:py-20"><AuthForm signup next={safeNext(params.neste)} /></main></div>;
}

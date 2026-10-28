import type { Metadata } from "next"
import { SiteHeader } from "@/components/site-header"
import { SpillOversikt } from "@/features/spill/components/spill-oversikt"
import { velgDato } from "@/features/spill/lib/dag"

export const metadata: Metadata = {
  title: "Dagens spill",
  description: "Fire små daglige spill: Mer eller mindre, Anelsesløs, Stavebien og Sangløs.",
}

export default async function Page({ searchParams }: PageProps<"/spill">) {
  const dato = velgDato((await searchParams).dato)
  return (
    <div className="page-grid min-h-full">
      <div className="mx-auto flex min-h-full w-full max-w-lg flex-col px-5 sm:px-6">
        <SiteHeader actionHref="/kontakt" actionLabel="Kontakt" />
        <main className="flex flex-1 flex-col gap-6 py-12 sm:py-14">
          <section className="text-center">
            <p className="font-mono text-[11px] font-medium uppercase tracking-[0.22em] text-neutral-400">Daglig</p>
            <h1 className="mt-2 text-[1.85rem] font-semibold leading-[1.2] tracking-tight text-neutral-950 sm:text-[2.15rem]">
              Dagens spill
            </h1>
            <p className="mx-auto mt-4 max-w-sm font-mono text-[13px] leading-7 text-neutral-500">
              Fire små spill som byttes ut hver natt. Gikk du glipp av en dag? Velg den i kalenderen.
            </p>
          </section>
          <SpillOversikt key={dato} dato={dato} />
        </main>
      </div>
    </div>
  )
}

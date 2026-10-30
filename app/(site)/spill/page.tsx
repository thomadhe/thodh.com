import type { Metadata } from "next"
import Link from "next/link"
import { visningsskrift } from "@/features/spill/components/skrift"
import { SpillOversikt } from "@/features/spill/components/spill-oversikt"
import { velgDato } from "@/features/spill/lib/dag"

export const metadata: Metadata = {
  title: "Daglige minigames",
  description: "Små daglige spill: Mer eller mindre, Anelsesløs, Stavebien, Sangløs og Omriss.",
}

export default async function Page({ searchParams }: PageProps<"/spill">) {
  const dato = velgDato((await searchParams).dato)
  return (
    <div className={`${visningsskrift.variable} min-h-dvh bg-[#18191b] text-neutral-100`}>
      <div className="mx-auto flex min-h-dvh w-full max-w-4xl flex-col px-5 sm:px-8">
        <header className="flex h-20 items-center justify-between">
          <Link href="/" className="font-mono text-xs text-neutral-400 transition hover:text-white">
            ← thodh.com
          </Link>
          <Link href="/kontakt" className="font-mono text-xs text-neutral-400 transition hover:text-white">
            Kontakt
          </Link>
        </header>
        <main className="flex flex-1 flex-col justify-center gap-8 pt-4 pb-16">
          <h1 className="text-center font-[family-name:var(--font-visning)] text-[2.4rem] leading-[0.95] font-extrabold tracking-[-0.05em] text-neutral-50 sm:text-[3.6rem]">
            Daglige minigames
          </h1>
          <SpillOversikt key={dato} dato={dato} />
          <p className="text-center font-mono text-[11px] leading-6 text-neutral-500">
            Nye spill hver natt.
          </p>
        </main>
      </div>
    </div>
  )
}

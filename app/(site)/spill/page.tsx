import type { Metadata } from "next"
import Link from "next/link"
import { SprakKnapp, Tekst } from "@/components/sprak-knapp"
import { visningsskrift } from "@/features/spill/components/skrift"
import { SpillOversikt } from "@/features/spill/components/spill-oversikt"
import { SpillSosialNav } from "@/features/spill/components/spill-sosial-ramme"
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
        <header className="flex h-20 items-center justify-between gap-3">
          <Link href="/" className="font-mono text-xs text-neutral-400 transition hover:text-white">
            ← thodh.com
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/kontakt" className="font-mono text-xs text-neutral-400 transition hover:text-white">
              <Tekst no="Kontakt" en="Contact" />
            </Link>
            <SprakKnapp variant="mork" />
          </div>
        </header>
        <main className="flex flex-1 flex-col justify-center gap-8 pt-4 pb-16">
          <div className="flex flex-col items-center gap-4">
            <h1 className="text-center font-[family-name:var(--font-visning)] text-[2.4rem] leading-[0.95] font-extrabold tracking-[-0.05em] text-neutral-50 sm:text-[3.6rem]">
              <Tekst no="Daglige minigames" en="Daily Minigames" />
            </h1>
            <SpillSosialNav aktiv="spill" />
          </div>
          <SpillOversikt key={dato} dato={dato} />
          <p className="text-center font-mono text-[11px] leading-6 text-neutral-500">
            <Tekst no="Nye spill hver natt." en="New puzzles every midnight." />
          </p>
        </main>
      </div>
    </div>
  )
}

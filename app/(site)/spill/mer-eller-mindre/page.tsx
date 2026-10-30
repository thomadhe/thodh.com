import type { Metadata } from "next"
import { MerEllerMindre } from "@/features/spill/components/mer-eller-mindre"
import { SpillRamme } from "@/features/spill/components/spill-ramme"
import { velgDato } from "@/features/spill/lib/dag"
import { dagensMerEllerMindre } from "@/features/spill/lib/mer-eller-mindre"

export const metadata: Metadata = {
  title: "Mer eller mindre",
  description: "Hva er størst? Fem kategorier, fem runder. Nytt spill hver dag.",
}

export default async function Page({ searchParams }: PageProps<"/spill/mer-eller-mindre">) {
  const dato = velgDato((await searchParams).dato)
  return (
    <SpillRamme
      spillId="mer-eller-mindre"
      dato={dato}
      regler={<p>Tastatur: 1 og 2 eller piltastene. Runder med nesten like tall er luket ut.</p>}
    >
      <MerEllerMindre key={dato} dato={dato} kategorier={dagensMerEllerMindre(dato)} />
    </SpillRamme>
  )
}

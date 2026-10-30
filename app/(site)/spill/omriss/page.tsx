import type { Metadata } from "next"
import { OmrissFaner } from "@/features/spill/components/omriss-faner"
import { SpillRamme } from "@/features/spill/components/spill-ramme"
import { velgDato } from "@/features/spill/lib/dag"
import { dagensOmriss } from "@/features/spill/lib/server/omriss"

export const metadata: Metadata = {
  title: "Omriss",
  description: "Gjett dagens land ut fra omrisset. Seks forsøk.",
}

export default async function Page({ searchParams }: PageProps<"/spill/omriss">) {
  const dato = velgDato((await searchParams).dato)
  const { form, nokkel } = dagensOmriss(dato)
  return (
    <SpillRamme
      spillId="omriss"
      dato={dato}
      regler={<p>Pilen peker mot landet, og prosenten viser hvor nær du er. Kartdata: Natural Earth.</p>}
    >
      <OmrissFaner key={dato} dato={dato} form={form} nokkel={nokkel} />
    </SpillRamme>
  )
}

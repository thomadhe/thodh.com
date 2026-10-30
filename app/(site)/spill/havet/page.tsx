import type { Metadata } from "next"
import { Havet } from "@/features/spill/components/havet"
import { SpillRamme } from "@/features/spill/components/spill-ramme"
import { velgDato } from "@/features/spill/lib/dag"
import { dagensHavet } from "@/features/spill/lib/server/havet"

export const metadata: Metadata = {
  title: "Havet",
  description: "Ni land, ni kategorier. Plasser hvert land der det gir flest poeng.",
}

export default async function Page({ searchParams }: PageProps<"/spill/havet">) {
  const dato = velgDato((await searchParams).dato)
  return (
    <SpillRamme
      spillId="havet"
      dato={dato}
      regler={<p>Velg et land, og legg det i kategorien der det gir mest. Hver kategori kan bare brukes én gang, og du kan ikke angre. Det finnes alltid en fordeling der alle land passer.</p>}
    >
      <Havet key={dato} dato={dato} oppgave={dagensHavet(dato)} />
    </SpillRamme>
  )
}
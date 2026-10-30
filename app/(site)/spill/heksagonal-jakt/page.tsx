import type { Metadata } from "next"
import { HeksagonalJakt } from "@/features/spill/components/heksagonal-jakt"
import { SpillRamme } from "@/features/spill/components/spill-ramme"
import { velgDato } from "@/features/spill/lib/dag"
import { dagensJakt } from "@/features/spill/lib/server/heksagonal-jakt"

export const metadata: Metadata = {
  title: "Heksagonal jakt",
  description: "Sju steder om dagen. Finn sekskanten de ligger i.",
}

export default async function Page({ searchParams }: PageProps<"/spill/heksagonal-jakt">) {
  const dato = velgDato((await searchParams).dato)
  return (
    <SpillRamme
      spillId="heksagonal-jakt"
      dato={dato}
      bred
      regler={
        <p>
          Zoom inn for mindre sekskanter og flere poeng (80–200). Tre forsøk per sted. Het er under 1,5 sekskanter unna, varm under
          3 og lunken under 6. Nesten gir litt poeng, og senere forsøk gir mindre.
        </p>
      }
    >
      <HeksagonalJakt key={dato} dato={dato} steder={dagensJakt(dato)} />
    </SpillRamme>
  )
}

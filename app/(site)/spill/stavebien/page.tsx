import type { Metadata } from "next"
import { SpillRamme } from "@/features/spill/components/spill-ramme"
import { Stavebien } from "@/features/spill/components/stavebien"
import { velgDato } from "@/features/spill/lib/dag"
import { antallStaveord, dagensStavebien } from "@/features/spill/lib/stavebien"

export const metadata: Metadata = {
  title: "Stavebien",
  description: "Hør ordet og stav det riktig. Ti ord som blir stadig vanskeligere – nytt hver dag.",
}

export default async function Page({ searchParams }: PageProps<"/spill/stavebien">) {
  const dato = velgDato((await searchParams).dato)
  return (
    <SpillRamme
      spillId="stavebien"
      dato={dato}
      regler={
        <p>
          Trykk på høyttaleren for å høre ordet (skilpadden leser sakte). Definisjon, eksempel og opprinnelse er lov å
          bruke. Bokmål etter gjeldende norm; tre feil og dagen er over. {antallStaveord()} ord på fem nivåer rulleres
          slik at alle brukes før noe kommer igjen.
        </p>
      }
    >
      <Stavebien key={dato} dato={dato} ord={dagensStavebien(dato)} />
    </SpillRamme>
  )
}

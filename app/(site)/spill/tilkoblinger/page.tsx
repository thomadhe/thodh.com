import type { Metadata } from "next"
import { SpillRamme } from "@/features/spill/components/spill-ramme"
import { Tilkoblinger } from "@/features/spill/components/tilkoblinger"
import { velgDato } from "@/features/spill/lib/dag"
import { dagensTilkoblinger } from "@/features/spill/lib/server/tilkoblinger"

export const metadata: Metadata = {
  title: "Tilkoblinger",
  description: "Seksten ruter, fire grupper. Hva hører sammen?",
}

export default async function Page({ searchParams }: PageProps<"/spill/tilkoblinger">) {
  const dato = velgDato((await searchParams).dato)
  const { slag, brikker } = dagensTilkoblinger(dato)
  return (
    <SpillRamme
      spillId="tilkoblinger"
      dato={dato}
      regler={
        <p>
          Velg fire ruter som hører sammen og trykk Send. De fleste dager er hver gruppe ett land, vist på fire måter: flagg, omriss, hovedstad,
          severdighet og mer. Hver tredje dag har fire og fire land noe til felles. Fire feil, og det er over.
        </p>
      }
    >
      <Tilkoblinger key={dato} dato={dato} slag={slag} brikker={brikker} />
    </SpillRamme>
  )
}

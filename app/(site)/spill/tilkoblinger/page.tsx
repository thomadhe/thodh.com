import type { Metadata } from "next"
import { SpillRamme } from "@/features/spill/components/spill-ramme"
import { Tilkoblinger } from "@/features/spill/components/tilkoblinger"
import { velgDato } from "@/features/spill/lib/dag"
import { dagensTilkoblinger } from "@/features/spill/lib/server/tilkoblinger"

export const metadata: Metadata = {
  title: "Tilkoblinger",
  description: "Seksten land, fire grupper. Hva har de til felles?",
}

export default async function Page({ searchParams }: PageProps<"/spill/tilkoblinger">) {
  const dato = velgDato((await searchParams).dato)
  const { rekke } = dagensTilkoblinger(dato)
  return (
    <SpillRamme
      spillId="tilkoblinger"
      dato={dato}
      regler={<p>Velg fire land som hører sammen og trykk Send. Fire feil, og det er over. Gul er lettest, lilla vanskeligst.</p>}
    >
      <Tilkoblinger key={dato} dato={dato} rekke={rekke} />
    </SpillRamme>
  )
}
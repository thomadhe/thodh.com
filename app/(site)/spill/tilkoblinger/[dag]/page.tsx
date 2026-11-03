import type { Metadata } from "next"
import { SpillRamme } from "@/features/spill/components/spill-ramme"
import { Tilkoblinger } from "@/features/spill/components/tilkoblinger"
import { forhandsbygdeDager } from "@/features/spill/lib/ruting"
import { dagensTilkoblinger } from "@/features/spill/lib/server/tilkoblinger"
import { dagForSide } from "@/features/spill/lib/server/side"

export const metadata: Metadata = {
  title: "Tilkoblinger",
  description: "Seksten ruter, fire grupper. Hva hører sammen?",
}

// One cached page per date. Players use /spill/tilkoblinger(?dato=…); Proxy rewrites it here (features/spill/lib/ruting.ts).
export function generateStaticParams() {
  return forhandsbygdeDager("tilkoblinger")
}

export default async function Page({ params }: PageProps<"/spill/tilkoblinger/[dag]">) {
  const { dato, iDag } = dagForSide("tilkoblinger", (await params).dag)
  const { slag, brikker } = dagensTilkoblinger(dato)
  return (
    <SpillRamme
      spillId="tilkoblinger"
      dato={dato}
      iDag={iDag}
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

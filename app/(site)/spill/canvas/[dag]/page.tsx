import type { Metadata } from "next"
import { Canvas } from "@/features/spill/components/canvas"
import { SpillRamme } from "@/features/spill/components/spill-ramme"
import { forhandsbygdeDager } from "@/features/spill/lib/ruting"
import { dagensFlagg } from "@/features/spill/lib/server/canvas"
import { dagForSide } from "@/features/spill/lib/server/side"

export const metadata: Metadata = {
  title: "Canvas",
  description: "Et flagg skjult bak 24 ruter. Seks forsøk på å gjette landet.",
}

// One cached page per date. Players use /spill/canvas(?dato=…); Proxy rewrites it here (features/spill/lib/ruting.ts).
export function generateStaticParams() {
  return forhandsbygdeDager("canvas")
}

export default async function Page({ params }: PageProps<"/spill/canvas/[dag]">) {
  const { dato, iDag } = dagForSide("canvas", (await params).dag)
  const { nokkel } = dagensFlagg(dato)
  return (
    <SpillRamme
      spillId="canvas"
      dato={dato}
      iDag={iDag}
      regler={<p>Rutene åpner seg i samme rekkefølge for alle. Avstand og retning hjelper deg. Flagg: flagcdn.com.</p>}
    >
      <Canvas key={dato} dato={dato} nokkel={nokkel} />
    </SpillRamme>
  )
}

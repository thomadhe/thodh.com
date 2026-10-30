import type { Metadata } from "next"
import { Canvas } from "@/features/spill/components/canvas"
import { SpillRamme } from "@/features/spill/components/spill-ramme"
import { velgDato } from "@/features/spill/lib/dag"
import { dagensFlagg } from "@/features/spill/lib/server/canvas"

export const metadata: Metadata = {
  title: "Canvas",
  description: "Et flagg skjult bak tolv ruter. Åpne én om gangen og gjett landet.",
}

export default async function Page({ searchParams }: PageProps<"/spill/canvas">) {
  const dato = velgDato((await searchParams).dato)
  const { nokkel } = dagensFlagg(dato)
  return (
    <SpillRamme
      spillId="canvas"
      dato={dato}
      regler={<p>Feil svar gir en ny rute å åpne. Avstand og retning hjelper deg. Flagg: flagcdn.com.</p>}
    >
      <Canvas key={dato} dato={dato} nokkel={nokkel} />
    </SpillRamme>
  )
}

import type { Metadata } from "next"
import { Emovi } from "@/features/spill/components/emovi"
import { SpillRamme } from "@/features/spill/components/spill-ramme"
import { velgDato } from "@/features/spill/lib/dag"
import { dagensFilm } from "@/features/spill/lib/server/emovi"

export const metadata: Metadata = {
  title: "Emovi",
  description: "Fem emojier, én film. Klarer du den på tre forsøk?",
}

export default async function Page({ searchParams }: PageProps<"/spill/emovi">) {
  const dato = velgDato((await searchParams).dato)
  const { emoji } = dagensFilm(dato)
  return (
    <SpillRamme spillId="emovi" dato={dato} regler={<p>Hvert feil svar gir et hint: årstall, så regi og roller, så sjanger.</p>}>
      <Emovi key={dato} dato={dato} emoji={emoji} />
    </SpillRamme>
  )
}

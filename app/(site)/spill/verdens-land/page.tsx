import type { Metadata } from "next"
import { LandQuiz } from "@/features/spill/components/land-quiz"
import { SpillRamme } from "@/features/spill/components/spill-ramme"

export const metadata: Metadata = {
  title: "Verdens land",
  description: "Hvor mange av verdens 197 land klarer du å skrive på 15 minutter?",
}

export default function Page() {
  return (
    <SpillRamme
      spillId="verdens-land"
      bred
      regler={<p>Norske og engelske navn godtas. Små land vises som prikker. Dra og zoom i kartet.</p>}
    >
      <LandQuiz modus="land" />
    </SpillRamme>
  )
}
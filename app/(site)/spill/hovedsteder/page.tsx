import type { Metadata } from "next"
import { LandQuiz } from "@/features/spill/components/land-quiz"
import { SpillRamme } from "@/features/spill/components/spill-ramme"

export const metadata: Metadata = {
  title: "Hovedsteder",
  description: "Hvor mange av verdens hovedsteder klarer du å skrive på 15 minutter?",
}

export default function Page() {
  return (
    <SpillRamme
      spillId="hovedsteder"
      bred
      regler={<p>Norske og engelske navn godtas. Landet lyser opp når du treffer. Dra og zoom i kartet.</p>}
    >
      <LandQuiz modus="hovedsteder" />
    </SpillRamme>
  )
}
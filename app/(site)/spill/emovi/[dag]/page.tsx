import type { Metadata } from "next"
import { Emovi } from "@/features/spill/components/emovi"
import { SpillRamme } from "@/features/spill/components/spill-ramme"
import { forhandsbygdeDager } from "@/features/spill/lib/ruting"
import { dagensFilm } from "@/features/spill/lib/server/emovi"
import { dagForSide } from "@/features/spill/lib/server/side"

export const metadata: Metadata = {
  title: "Emovi",
  description: "Fem emojier, én film. Tre liv.",
}

// One cached page per date. Players use /spill/emovi(?dato=…); Proxy rewrites it here (features/spill/lib/ruting.ts).
export function generateStaticParams() {
  return forhandsbygdeDager("emovi")
}

export default async function Page({ params }: PageProps<"/spill/emovi/[dag]">) {
  const { dato, iDag } = dagForSide("emovi", (await params).dag)
  const { emoji } = dagensFilm(dato)
  return (
    <SpillRamme spillId="emovi" dato={dato} iDag={iDag} regler={<p>Tre liv. Feil svar og hint koster ett liv hver, og hvert liv du mister gir et hint: årstall, så regi og roller, så sjanger.</p>}>
      <Emovi key={dato} dato={dato} emoji={emoji} />
    </SpillRamme>
  )
}

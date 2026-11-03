import type { Metadata } from "next"
import { Havet } from "@/features/spill/components/havet"
import { SpillRamme } from "@/features/spill/components/spill-ramme"
import { forhandsbygdeDager } from "@/features/spill/lib/ruting"
import { dagensHavet } from "@/features/spill/lib/server/havet"
import { dagForSide } from "@/features/spill/lib/server/side"

export const metadata: Metadata = {
  title: "Havet",
  description: "Ni land, ni kategorier. Plasser hvert land der det gir flest poeng.",
}

// One cached page per date. Players use /spill/havet(?dato=…); Proxy rewrites it here (features/spill/lib/ruting.ts).
export function generateStaticParams() {
  return forhandsbygdeDager("havet")
}

export default async function Page({ params }: PageProps<"/spill/havet/[dag]">) {
  const { dato, iDag } = dagForSide("havet", (await params).dag)
  return (
    <SpillRamme
      spillId="havet"
      dato={dato}
      iDag={iDag}
      regler={<p>Velg et land, og legg det i kategorien der det gir mest. Hver kategori kan bare brukes én gang, og du kan ikke angre. Det finnes alltid en fordeling der alle land passer.</p>}
    >
      <Havet key={dato} dato={dato} oppgave={dagensHavet(dato)} />
    </SpillRamme>
  )
}

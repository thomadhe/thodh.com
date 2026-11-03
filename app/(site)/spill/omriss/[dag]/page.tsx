import type { Metadata } from "next"
import { OmrissFaner } from "@/features/spill/components/omriss-faner"
import { SpillRamme } from "@/features/spill/components/spill-ramme"
import { forhandsbygdeDager } from "@/features/spill/lib/ruting"
import { dagensOmriss } from "@/features/spill/lib/server/omriss"
import { dagForSide } from "@/features/spill/lib/server/side"

export const metadata: Metadata = {
  title: "Omriss",
  description: "Gjett dagens land ut fra omrisset. Seks forsøk.",
}

// One cached page per date. Players use /spill/omriss(?dato=…); Proxy rewrites it here (features/spill/lib/ruting.ts).
export function generateStaticParams() {
  return forhandsbygdeDager("omriss")
}

export default async function Page({ params }: PageProps<"/spill/omriss/[dag]">) {
  const { dato, iDag } = dagForSide("omriss", (await params).dag)
  const { form, nokkel } = dagensOmriss(dato)
  return (
    <SpillRamme
      spillId="omriss"
      dato={dato}
      iDag={iDag}
      regler={
        <p>
          Pilen peker mot landet, og prosenten viser hvor nær du er. Er omrisset et territorium og ikke et land, står det på
          kortet. Under Øving velger du bare land eller territorier også. Kartdata: Natural Earth.
        </p>
      }
    >
      <OmrissFaner key={dato} dato={dato} form={form} nokkel={nokkel} />
    </SpillRamme>
  )
}

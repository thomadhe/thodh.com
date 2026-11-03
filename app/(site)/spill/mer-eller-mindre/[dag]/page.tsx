import type { Metadata } from "next"
import { MerEllerMindre } from "@/features/spill/components/mer-eller-mindre"
import { SpillRamme } from "@/features/spill/components/spill-ramme"
import { forhandsbygdeDager } from "@/features/spill/lib/ruting"
import { dagensMerEllerMindre } from "@/features/spill/lib/mer-eller-mindre"
import { dagForSide } from "@/features/spill/lib/server/side"

export const metadata: Metadata = {
  title: "Mer eller mindre",
  description: "Hva er størst? Fem kategorier, fem runder. Nytt spill hver dag.",
}

// One cached page per date. Players use /spill/mer-eller-mindre(?dato=…); Proxy rewrites it here (features/spill/lib/ruting.ts).
export function generateStaticParams() {
  return forhandsbygdeDager("mer-eller-mindre")
}

export default async function Page({ params }: PageProps<"/spill/mer-eller-mindre/[dag]">) {
  const { dato, iDag } = dagForSide("mer-eller-mindre", (await params).dag)
  return (
    <SpillRamme
      spillId="mer-eller-mindre"
      dato={dato}
      iDag={iDag}
      regler={<p>Tastatur: 1 og 2 eller piltastene. Runder med nesten like tall er luket ut.</p>}
    >
      <MerEllerMindre key={dato} dato={dato} kategorier={dagensMerEllerMindre(dato)} />
    </SpillRamme>
  )
}

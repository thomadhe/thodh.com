import type { Metadata } from "next"
import { Rusle } from "@/features/spill/components/rusle"
import { SpillRamme } from "@/features/spill/components/spill-ramme"
import { forhandsbygdeDager } from "@/features/spill/lib/ruting"
import { dagensTur } from "@/features/spill/lib/server/rusle"
import { dagForSide } from "@/features/spill/lib/server/side"

export const metadata: Metadata = {
  title: "Rusle",
  description: "Gå fra ett land til et annet ved å nevne landene imellom.",
}

// One cached page per date. Players use /spill/rusle(?dato=…); Proxy rewrites it here (features/spill/lib/ruting.ts).
export function generateStaticParams() {
  return forhandsbygdeDager("rusle")
}

export default async function Page({ params }: PageProps<"/spill/rusle/[dag]">) {
  const { dato, iDag } = dagForSide("rusle", (await params).dag)
  const { fra, til } = dagensTur(dato)
  return (
    <SpillRamme
      spillId="rusle"
      dato={dato}
      iDag={iDag}
      bred
      regler={
        <p>
          Nevn land som henger sammen over landegrenser fra start til mål. Grønt er på korteste vei, oransje en liten omvei, rødt
          en lang omvei. Tunneler og broer teller.
        </p>
      }
    >
      <Rusle key={dato} dato={dato} fra={fra} til={til} />
    </SpillRamme>
  )
}

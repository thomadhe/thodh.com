import type { Metadata } from "next"
import { Rusle } from "@/features/spill/components/rusle"
import { SpillRamme } from "@/features/spill/components/spill-ramme"
import { velgDato } from "@/features/spill/lib/dag"
import { dagensTur } from "@/features/spill/lib/server/rusle"

export const metadata: Metadata = {
  title: "Rusle",
  description: "Gå fra ett land til et annet ved å nevne landene imellom.",
}

export default async function Page({ searchParams }: PageProps<"/spill/rusle">) {
  const dato = velgDato((await searchParams).dato)
  const { fra, til } = dagensTur(dato)
  return (
    <SpillRamme
      spillId="rusle"
      dato={dato}
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

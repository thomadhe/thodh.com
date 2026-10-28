import type { Metadata } from "next"
import { Anelseslos } from "@/features/spill/components/anelseslos"
import { SpillRamme } from "@/features/spill/components/spill-ramme"
import { velgDato } from "@/features/spill/lib/dag"
import { antallOrd } from "@/features/spill/lib/server/anelseslos"

export const metadata: Metadata = {
  title: "Anelsesløs",
  description: "Finn dagens hemmelige engelske ord. Ordene rangeres etter hvor like de er i betydning.",
}

export default async function Page({ searchParams }: PageProps<"/spill/anelseslos">) {
  const dato = velgDato((await searchParams).dato)
  const antall = antallOrd()
  return (
    <SpillRamme
      spillId="anelseslos"
      dato={dato}
      regler={
        <>
          <p>
            Ordene er engelske. Ordlisten har {antall.toLocaleString("nb-NO")} vanlige ord. Grønt betyr blant de 300
            nærmeste, gult blant de 1 500 nærmeste. Bøyde former som «dogs» regnes som grunnformen «dog». Står du fast,
            gir et hint et ord som er omtrent dobbelt så nært som ditt beste.
          </p>
          <p className="font-mono text-[11px] text-neutral-400">
            Likhet beregnet med GloVe-ordvektorer (Pennington, Socher &amp; Manning 2014, PDDL 1.0). Ordutvalg med
            WordNet 3.0, © 2006 Princeton University.
          </p>
        </>
      }
    >
      <Anelseslos key={dato} dato={dato} antall={antall} />
    </SpillRamme>
  )
}

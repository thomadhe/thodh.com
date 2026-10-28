import type { Metadata } from "next"
import { Anelseslos } from "@/features/spill/components/anelseslos"
import { SpillRamme } from "@/features/spill/components/spill-ramme"
import { velgDato } from "@/features/spill/lib/dag"
import { antallOrd } from "@/features/spill/lib/server/anelseslos"

export const metadata: Metadata = {
  title: "Anelsesløs",
  description: "Finn dagens hemmelige ord. Ordene rangeres etter hvor like de er i betydning.",
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
            Ordlisten har {antall.toLocaleString("nb-NO")} norske ord. Grønt betyr blant de 300 nærmeste, gult blant de
            1 500 nærmeste. Bøyde former som «hunder» regnes som grunnformen «hund». Står du fast, gir et hint et ord som
            er omtrent dobbelt så nært som ditt beste.
          </p>
          <p className="font-mono text-[11px] text-neutral-400">
            Likhet beregnet med fastText-ordvektorer (Grave mfl. 2018, CC BY-SA 3.0) og Norsk ordbank (Språkbanken, CC
            BY 4.0).
          </p>
        </>
      }
    >
      <Anelseslos key={dato} dato={dato} antall={antall} />
    </SpillRamme>
  )
}

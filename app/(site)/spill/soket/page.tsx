import type { Metadata } from "next"
import { Soket } from "@/features/spill/components/soket"
import { SpillRamme } from "@/features/spill/components/spill-ramme"
import { velgDato } from "@/features/spill/lib/dag"
import { dagensSok } from "@/features/spill/lib/server/soket"

export const metadata: Metadata = {
  title: "Søket",
  description: "Hva søker folk egentlig etter? Gjett ordet som fullfører søket.",
}

export default async function Page({ searchParams }: PageProps<"/spill/soket">) {
  const dato = velgDato((await searchParams).dato)
  const sok = dagensSok(dato)
  return (
    <SpillRamme
      spillId="soket"
      dato={dato}
      regler={
        <>
          <p>Grønn: riktig bokstav på riktig plass. Gul: bokstaven er med, men et annet sted. Seks forsøk.</p>
          <p className="font-mono text-[11px] text-neutral-400">Søkene er skrevet for spillet, ikke hentet fra Google.</p>
        </>
      }
    >
      <Soket key={dato} dato={dato} prompt={sok.prompt} lengde={[...sok.svar].length} />
    </SpillRamme>
  )
}

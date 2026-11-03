import type { Metadata } from "next"
import { Soket } from "@/features/spill/components/soket"
import { SpillRamme } from "@/features/spill/components/spill-ramme"
import { forhandsbygdeDager } from "@/features/spill/lib/ruting"
import { dagensSok } from "@/features/spill/lib/server/soket"
import { dagForSide } from "@/features/spill/lib/server/side"

export const metadata: Metadata = {
  title: "Søket",
  description: "Hva søker folk egentlig etter? Gjett ordet som fullfører søket.",
}

// One cached page per date. Players use /spill/soket(?dato=…); Proxy rewrites it here (features/spill/lib/ruting.ts).
export function generateStaticParams() {
  return forhandsbygdeDager("soket")
}

export default async function Page({ params }: PageProps<"/spill/soket/[dag]">) {
  const { dato, iDag } = dagForSide("soket", (await params).dag)
  const sok = dagensSok(dato)
  return (
    <SpillRamme
      spillId="soket"
      dato={dato}
      iDag={iDag}
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

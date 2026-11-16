import type { Metadata } from "next"
import { Gjettelos } from "@/features/spill/components/gjettelos"
import { SpillRamme } from "@/features/spill/components/spill-ramme"
import { AARSTALL_REFERANSE } from "@/features/spill/lib/gjettelos"
import { forhandsbygdeDager } from "@/features/spill/lib/ruting"
import { dagensSporsmal, erRepris } from "@/features/spill/lib/server/gjettelos"
import { dagForSide } from "@/features/spill/lib/server/side"

export const metadata: Metadata = {
  title: "Gjetteløs",
  description: "Fem tallspørsmål om dagen. Gjett så nær du kan, og få opptil 100 poeng for hvert.",
}

// One cached page per date. Players use /spill/gjettelos(?dato=…); Proxy rewrites it here (features/spill/lib/ruting.ts).
export function generateStaticParams() {
  return forhandsbygdeDager("gjettelos")
}

export default async function Page({ params }: PageProps<"/spill/gjettelos/[dag]">) {
  const { dato, iDag } = dagForSide("gjettelos", (await params).dag)
  // Days before the game existed (spill.ts `start`) never get here: Proxy sends them to today's page.
  return (
    <SpillRamme
      spillId="gjettelos"
      dato={dato}
      iDag={iDag}
      regler={
        <>
          <p>
            Poengene regnes ut fra hvor mange ganger for høyt eller lavt du bommer: minste tall delt på største, ganger 100. Riktig svar gir 100,
            halvparten eller dobbelt så mye gir 50, og 10 % unna gir rundt 90, uansett om svaret er 8 eller 8 milliarder.
          </p>
          <p>
            Årstall teller etter hvor lenge siden det var, regnet fra {AARSTALL_REFERANSE}. Å bomme med 10 år på noe fra 1900-tallet koster
            omtrent like mye som å bomme med ett år på noe fra de siste årene.
          </p>
          <p>Skriv tall som «5 500 000», «5,5 mill.» eller «2 mrd.». Knappene under feltet legger til tusen, millioner eller milliarder.</p>
        </>
      }
    >
      <Gjettelos key={dato} dato={dato} sporsmal={dagensSporsmal(dato)} repris={erRepris(dato)} />
    </SpillRamme>
  )
}

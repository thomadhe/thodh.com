import type { Metadata } from "next"
import { Gjettelos } from "@/features/spill/components/gjettelos"
import { GjettelosDuellInngang } from "@/features/spill/components/gjettelos-duell-inngang"
import { SpillRamme } from "@/features/spill/components/spill-ramme"
import { AARSTALL_REFERANSE, formaterPoeng, NULL_VED, poengFor } from "@/features/spill/lib/gjettelos"
import { forhandsbygdeDager } from "@/features/spill/lib/ruting"
import { dagensSporsmal, erRepris } from "@/features/spill/lib/server/gjettelos"
import { dagForSide } from "@/features/spill/lib/server/side"

export const metadata: Metadata = {
  title: "Gjetteløs",
  description: "Fem tallspørsmål om dagen. Gjett så nær du kan, og få opptil 100 poeng for hvert.",
}

const EKSEMPLER = [1.25, 2, 5, 10, 30]

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
            Poengene avhenger av hvor mange ganger for høyt eller lavt du bommer, ikke av hvor mange enheter. Med r som største delt på minste av
            svaret ditt og fasit halveres poengene for hver dobling i starten, og de flater ut mot null ved {NULL_VED} ganger. Én desimal.
          </p>
          <table className="w-full text-left tabular-nums">
            <thead className="text-neutral-500">
              <tr>
                <th className="font-normal">Bom</th>
                {EKSEMPLER.map((r) => (
                  <th key={r} className="font-normal">
                    {r.toLocaleString("nb-NO")}×
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="text-neutral-900">
              <tr>
                <td className="text-neutral-500">Poeng</td>
                {EKSEMPLER.map((r) => (
                  <td key={r}>{formaterPoeng(poengFor(r, 1))}</td>
                ))}
              </tr>
            </tbody>
          </table>
          <p>
            Dobbelt så mye og halvparten gir like mange poeng, og det spiller ingen rolle om svaret er 8 eller 8 milliarder. Ved {NULL_VED} ganger
            for høyt eller lavt er det tomt.
          </p>
          <p>
            Årstall teller etter hvor lenge siden det var, regnet fra {AARSTALL_REFERANSE}, og skalaen er dobbelt så bratt. Å bomme med 10 år på noe
            fra 1900-tallet koster omtrent like mye som å bomme med ett år på noe fra de siste årene.
          </p>
          <p>Skriv tallet, for eksempel «5 500 000». Sifrene grupperes mens du skriver. «5,5 mill.» og «2 mrd.» går også.</p>
        </>
      }
    >
      <Gjettelos key={dato} dato={dato} sporsmal={dagensSporsmal(dato)} repris={erRepris(dato)} />
      <GjettelosDuellInngang />
    </SpillRamme>
  )
}

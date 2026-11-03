import type { Metadata } from "next"
import { Sanglos } from "@/features/spill/components/sanglos"
import { SpillRamme } from "@/features/spill/components/spill-ramme"
import { sanglosSanger } from "@/features/spill/data/sanglos/sanger"
import { forhandsbygdeDager } from "@/features/spill/lib/ruting"
import { dagForSide } from "@/features/spill/lib/server/side"

export const metadata: Metadata = {
  title: "Sangløs",
  description: "Du kan denne sangen – men klarer du den på 0,13 sekunder? Tre nye sanger hver dag.",
}

const sanger = sanglosSanger
  .map(({ id, title, artist }) => ({ id, title, artist }))
  .sort((a, b) => a.title.localeCompare(b.title, "nb"))

// One cached page per date. Players use /spill/sanglos(?dato=…); Proxy rewrites it here (features/spill/lib/ruting.ts).
export function generateStaticParams() {
  return forhandsbygdeDager("sanglos")
}

export default async function Page({ params }: PageProps<"/spill/sanglos/[dag]">) {
  const { dato, iDag } = dagForSide("sanglos", (await params).dag)
  return (
    <SpillRamme
      spillId="sanglos"
      dato={dato}
      iDag={iDag}
      regler={
        <>
          <p>Tre låter hver dag: Alle, Rock og Hip hop. Gult betyr riktig artist, feil låt.</p>
          <p className="font-mono text-[11px] text-neutral-400">Klipp: forhåndslytting fra Apple Music.</p>
        </>
      }
    >
      <Sanglos key={dato} dato={dato} sanger={sanger} />
    </SpillRamme>
  )
}

import type { Metadata } from "next"
import { Sanglos } from "@/features/spill/components/sanglos"
import { SpillRamme } from "@/features/spill/components/spill-ramme"
import { sanglosSanger } from "@/features/spill/data/sanglos/sanger"
import { velgDato } from "@/features/spill/lib/dag"
import { TRINN } from "@/features/spill/lib/sanglos"

export const metadata: Metadata = {
  title: "Sangløs",
  description: "Du kan denne sangen – men klarer du den på 0,13 sekunder? Tre nye sanger hver dag.",
}

const sanger = sanglosSanger
  .map(({ id, title, artist }) => ({ id, title, artist }))
  .sort((a, b) => a.title.localeCompare(b.title, "nb"))

export default async function Page({ searchParams }: PageProps<"/spill/sanglos">) {
  const dato = velgDato((await searchParams).dato)
  return (
    <SpillRamme
      spillId="sanglos"
      dato={dato}
      regler={
        <>
          <p>
            Tre sanger hver dag: én fra alle sjangre, én rock og én hip hop. Du får {TRINN.length} forsøk, og utdraget blir
            lengre for hver feil eller hopp ({TRINN.map((t) => t.toLocaleString("nb-NO")).join(" → ")} sekunder). Gult
            betyr riktig artist, men feil sang. Velg blant {sanger.length} sanger i søket.
          </p>
          <p className="font-mono text-[11px] text-neutral-400">
            Lydklippene er 30 sekunders forhåndslytting fra Apple Music og spilles direkte fra Apple.
          </p>
        </>
      }
    >
      <Sanglos key={dato} dato={dato} sanger={sanger} />
    </SpillRamme>
  )
}

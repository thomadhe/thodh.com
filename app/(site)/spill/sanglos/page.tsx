import type { Metadata } from "next"
import { Sanglos } from "@/features/spill/components/sanglos"
import { SpillRamme } from "@/features/spill/components/spill-ramme"
import { sanglosSanger } from "@/features/spill/data/sanglos/sanger"
import { velgDato } from "@/features/spill/lib/dag"

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
          <p>Tre låter hver dag: Alle, Rock og Hip hop. Gult betyr riktig artist, feil låt.</p>
          <p className="font-mono text-[11px] text-neutral-400">Klipp: forhåndslytting fra Apple Music.</p>
        </>
      }
    >
      <Sanglos key={dato} dato={dato} sanger={sanger} />
    </SpillRamme>
  )
}

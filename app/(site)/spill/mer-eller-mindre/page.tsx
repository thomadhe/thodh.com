import type { Metadata } from "next"
import { MerEllerMindre } from "@/features/spill/components/mer-eller-mindre"
import { SpillRamme } from "@/features/spill/components/spill-ramme"
import { velgDato } from "@/features/spill/lib/dag"
import { dagensMerEllerMindre, kategorier } from "@/features/spill/lib/mer-eller-mindre"

export const metadata: Metadata = {
  title: "Mer eller mindre",
  description: "Hva er størst? Fem kategorier, fem runder. Nytt spill hver dag.",
}

export default async function Page({ searchParams }: PageProps<"/spill/mer-eller-mindre">) {
  const dato = velgDato((await searchParams).dato)
  const antall = kategorier.reduce((s, k) => s + k.items.length, 0)
  return (
    <SpillRamme
      spillId="mer-eller-mindre"
      dato={dato}
      regler={
        <p>
          Fem kategorier hver dag i fast rekkefølge: Spotify-lyttere, Spotify-strømmer, IMDb-karakter, billettinntekter
          og én trivia-kategori som veksler mellom flere temaer. Til sammen {antall.toLocaleString("nb-NO")} oppføringer
          i {kategorier.length} kategorier, og alle må brukes opp før noe går igjen. To alternativer vises bare når
          forskjellen er stor nok til at avrundede tall ikke avgjør. Bruk 1 og 2 eller piltastene på tastaturet.
        </p>
      }
    >
      <MerEllerMindre key={dato} dato={dato} kategorier={dagensMerEllerMindre(dato)} />
    </SpillRamme>
  )
}

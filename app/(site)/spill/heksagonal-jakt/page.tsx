import type { Metadata } from "next"
import { HeksagonalJakt } from "@/features/spill/components/heksagonal-jakt"
import { SpillRamme } from "@/features/spill/components/spill-ramme"
import { velgDato } from "@/features/spill/lib/dag"
import { dagensJakt } from "@/features/spill/lib/server/heksagonal-jakt"

export const metadata: Metadata = {
  title: "Heksagonal jakt",
  description: "Sju steder om dagen. Finn sekskanten de ligger i.",
}

export default async function Page({ searchParams }: PageProps<"/spill/heksagonal-jakt">) {
  const dato = velgDato((await searchParams).dato)
  return (
    <SpillRamme
      spillId="heksagonal-jakt"
      dato={dato}
      bred
      regler={
        <>
          <p>
            Zoom inn for mindre sekskanter og flere poeng (80–200). Tre forsøk per sted. Het er under 1,5 sekskanter unna, varm under
            3 og lunken under 6, og tallet på et bom sier omtrent hvor mange sekskanter unna stedet er. Nesten gir litt poeng, og senere forsøk gir mindre. En by teller innen 10 km fra sentrum, og store
            steder teller der de når.
          </p>
          <p className="mt-2 text-xs">
            Kart fra <a href="https://openfreemap.org" className="underline">OpenFreeMap</a> ·{" "}
            <a href="https://www.openmaptiles.org/" className="underline">© OpenMapTiles</a> · data fra{" "}
            <a href="https://www.openstreetmap.org/copyright" className="underline">© OpenStreetMap-bidragsytere</a>
          </p>
        </>
      }
    >
      <HeksagonalJakt key={dato} dato={dato} steder={dagensJakt(dato)} />
    </SpillRamme>
  )
}

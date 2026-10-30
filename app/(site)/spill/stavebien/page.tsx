import type { Metadata } from "next"
import lydfiler from "@/features/spill/data/stavebien/lyd.json"
import { SpillRamme } from "@/features/spill/components/spill-ramme"
import { Stavebien, type StaveOrd } from "@/features/spill/components/stavebien"
import { velgDato } from "@/features/spill/lib/dag"
import { dagensStavebien } from "@/features/spill/lib/stavebien"
import { LYD_DELER, LYD_MAPPE, lydId, type LydDel } from "@/features/spill/lib/stavebien-lyd"

export const metadata: Metadata = {
  title: "Stavebien",
  description: "Hør ordet og stav det riktig. Fem ord som blir stadig vanskeligere – nye hver dag.",
}

const finnes = new Set<string>(lydfiler)

/** Attaches the recorded clips that exist for each word; missing ones fall back to the browser voice. */
function medLyd(dato: string): StaveOrd[] {
  return dagensStavebien(dato).map((o) => {
    const lyd: Partial<Record<LydDel, string>> = {}
    for (const [del, kode] of Object.entries(LYD_DELER) as [LydDel, string][]) {
      const fil = `${lydId(o.word)}-${kode}.mp3`
      if (finnes.has(fil)) lyd[del] = `${LYD_MAPPE}/${fil}`
    }
    return { ...o, lyd }
  })
}

export default async function Page({ searchParams }: PageProps<"/spill/stavebien">) {
  const dato = velgDato((await searchParams).dato)
  return (
    <SpillRamme
      spillId="stavebien"
      dato={dato}
      regler={<p>Definisjon og eksempel er lov å bruke. Britisk staving godtas.</p>}
    >
      <Stavebien key={dato} dato={dato} ord={medLyd(dato)} />
    </SpillRamme>
  )
}

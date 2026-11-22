import type { Metadata } from "next"
import { SpillHistorikk } from "@/features/spill/components/spill-historikk"
import { SpillSosialSide } from "@/features/spill/components/spill-sosial-ramme"
import { hentBruker } from "@/features/spill/lib/server/sosial-api"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Historikk · Daglige minigames",
  description: "Se dine egne resultater, gjetninger, tider og hint i de daglige spillene.",
  robots: { index: false },
}

export default async function Page() {
  const innlogget = await hentBruker()
  return (
    <SpillSosialSide
      aktiv="historikk"
      tittel="Din spillhistorikk"
      undertittel="Alle dagene du har løst – gjetninger, tider og hint samlet på ett sted."
    >
      <SpillHistorikk innlogget={Boolean(innlogget)} />
    </SpillSosialSide>
  )
}

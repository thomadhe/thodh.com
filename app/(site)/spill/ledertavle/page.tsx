import type { Metadata } from "next"
import { SpillLedertavle } from "@/features/spill/components/spill-ledertavle"
import { SpillSosialSide } from "@/features/spill/components/spill-sosial-ramme"
import { hentBruker } from "@/features/spill/lib/server/sosial-api"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Ledertavle · Daglige minigames",
  description: "Månedlige ledertavler for daglige spill – både globalt og blant venner.",
  robots: { index: false },
}

export default async function Page() {
  const innlogget = await hentBruker()
  return (
    <SpillSosialSide
      aktiv="ledertavle"
      tittel="Ledertavle"
      undertittel="Månedens beste spillere globalt og blant venner."
    >
      <SpillLedertavle innlogget={Boolean(innlogget)} />
    </SpillSosialSide>
  )
}

import type { Metadata } from "next"
import { SpillDueller } from "@/features/spill/components/spill-dueller"
import { SpillSosialSide } from "@/features/spill/components/spill-sosial-ramme"
import { hentBruker } from "@/features/spill/lib/server/sosial-api"
import { supabaseConfig } from "@/lib/supabase/config"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Dueller · thodh.com",
  description: "Utfordre venner i Moggern, 6/7-stegern, Gjetteløs og Sjakk for 2 — med romkode eller direkte invitasjon.",
  robots: { index: false },
}

export default async function Page() {
  const innlogget = await hentBruker()
  const { url, key } = supabaseConfig()
  return (
    <SpillSosialSide
      aktiv="dueller"
      tittel="Duell-arena"
      tittelEn="Duel Arena"
      undertittel="Velg spill, åpne et rom med 4-bokstavers kode, eller utfordre en venn på ett klikk."
      undertittelEn="Pick a game, open a room with a 4-letter code, or challenge a friend in one click."
    >
      <SpillDueller innlogget={Boolean(innlogget)} supabaseUrl={url} supabaseNokkel={key} />
    </SpillSosialSide>
  )
}

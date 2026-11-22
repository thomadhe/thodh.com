import type { Metadata } from "next"
import { SpillDueller } from "@/features/spill/components/spill-dueller"
import { SpillSosialSide } from "@/features/spill/components/spill-sosial-ramme"
import { hentBruker } from "@/features/spill/lib/server/sosial-api"
import { supabaseConfig } from "@/lib/supabase/config"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Dueller · Daglige minigames",
  description: "Lag duellrom med 4-bokstavers kode eller utfordre venner direkte i 6/7-stegern og Gjetteløs.",
  robots: { index: false },
}

export default async function Page() {
  const innlogget = await hentBruker()
  const { url, key } = supabaseConfig()
  return (
    <SpillSosialSide
      aktiv="dueller"
      tittel="Dueller"
      undertittel="Lag et åpent rom med kode, bli med med kode, eller utfordre en venn direkte."
    >
      <SpillDueller innlogget={Boolean(innlogget)} supabaseUrl={url} supabaseNokkel={key} />
    </SpillSosialSide>
  )
}

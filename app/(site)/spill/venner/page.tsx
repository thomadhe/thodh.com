import type { Metadata } from "next"
import { SpillSosialSide } from "@/features/spill/components/spill-sosial-ramme"
import { SpillVenner } from "@/features/spill/components/spill-venner"
import { hentBruker } from "@/features/spill/lib/server/sosial-api"
import { supabaseConfig } from "@/lib/supabase/config"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Venner · Daglige minigames",
  description: "Legg til venner med vennekode, sammenlign resultater og utfordre til duell.",
  robots: { index: false },
}

export default async function Page({ searchParams }: PageProps<"/spill/venner">) {
  const [innlogget, sp] = await Promise.all([hentBruker(), searchParams])
  const startKode = typeof sp.kode === "string" ? sp.kode : undefined
  const { url, key } = supabaseConfig()
  return (
    <SpillSosialSide
      aktiv="venner"
      tittel="Venner"
      undertittel="Legg til venner med vennekode eller invitasjonslenke, og utfordre dem til duell."
    >
      <SpillVenner innlogget={Boolean(innlogget)} startKode={startKode} supabaseUrl={url} supabaseNokkel={key} />
    </SpillSosialSide>
  )
}

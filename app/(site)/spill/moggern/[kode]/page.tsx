import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { MoggernRom } from "@/features/spill/components/moggern-rom"
import { SpillRamme } from "@/features/spill/components/spill-ramme"
import { erGyldigKode, normaliserKode } from "@/features/spill/lib/duell/rom"
import { utledVisningsnavn } from "@/features/spill/lib/moggern/duell"
import { supabaseConfig } from "@/lib/supabase/config"
import { createClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Duell · Moggern",
  description: "Privat 1v1 kameraduell i Moggern. Video går direkte mellom nettleserne og ingenting lagres.",
  robots: { index: false },
}

export default async function Page({ params }: PageProps<"/spill/moggern/[kode]">) {
  const kode = normaliserKode(decodeURIComponent((await params).kode))
  if (!erGyldigKode(kode)) notFound()

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  let visningsnavn = user ? utledVisningsnavn(user) : ""
  if (user) {
    const { data: profil } = await supabase
      .from("spill_profiler")
      .select("visningsnavn")
      .eq("user_id", user.id)
      .maybeSingle()
    if (profil?.visningsnavn) visningsnavn = profil.visningsnavn
  }

  const bruker = user ? { id: user.id, visningsnavn } : null
  const { url, key } = supabaseConfig()

  return (
    <SpillRamme
      spillId="moggern"
      bred
      regler={
        <>
          <p>
            1v1 kameraduell kun for venner (maks 2 spillere per rom). Begge slår på kameraet, trykker klar, og ser rett inn i linsa under 10 sekunders
            måling.
          </p>
          <p>
            Begge nettleserne måler både eget og motstanderens bilde lokalt. Resultatet bruker motstanderens måling av deg — hvis de to målingene
            spriker mye, vises begge.
          </p>
          <p>Video går direkte peer-to-peer og ingenting tas opp eller lagres. Alt her er tull.</p>
        </>
      }
    >
      <MoggernRom kode={kode} bruker={bruker} supabaseUrl={url} supabaseNokkel={key} />
    </SpillRamme>
  )
}

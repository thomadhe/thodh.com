import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { Tekst } from "@/components/sprak-knapp"
import { MoggernRom } from "@/features/spill/components/moggern-rom"
import { spillskrift } from "@/features/spill/components/skrift"
import { SpillRamme } from "@/features/spill/components/spill-ramme"
import { erGyldigKode, normaliserKode } from "@/features/spill/lib/duell/rom"
import { utledVisningsnavn } from "@/features/spill/lib/moggern/duell"
import { hentBruker } from "@/features/spill/lib/server/sosial-api"
import { supabaseConfig } from "@/lib/supabase/config"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Duell · Moggern",
  description: "Privat 1v1 kameraduell i Moggern. Video går direkte mellom nettleserne og ingenting lagres.",
  robots: { index: false },
}

export default async function Page({ params }: PageProps<"/spill/moggern/[kode]">) {
  const kode = normaliserKode(decodeURIComponent((await params).kode))
  if (!erGyldigKode(kode)) notFound()

  let bruker: { id: string; visningsnavn: string } | null = null
  const innlogget = await hentBruker()
  if (innlogget) {
    let visningsnavn = utledVisningsnavn(innlogget.user)
    const { data: profil } = await innlogget.supabase
      .from("spill_profiler")
      .select("visningsnavn")
      .eq("user_id", innlogget.user.id)
      .maybeSingle()
    if (profil?.visningsnavn) visningsnavn = profil.visningsnavn
    bruker = { id: innlogget.user.id, visningsnavn }
  }
  const { url, key } = supabaseConfig()

  return (
    <SpillRamme
      spillId="moggern"
      fullbredde
      klasse={`${spillskrift.className} overflow-x-clip`}
      regler={
        <>
          <p>
            <Tekst
              no="1v1 kameraduell kun for venner (maks 2 spillere per rom). Begge slår på kameraet, trykker klar, og ser rett inn i linsa under 15 sekunders måling."
              en="1v1 camera duel for friends (max 2 players per room). Both turn on their camera, hit ready, and look straight at the lens during the 15-second scan."
            />
          </p>
          <p>
            <Tekst
              no="Begge nettleserne måler både eget og motstanderens bilde lokalt. Resultatet bruker motstanderens måling av deg — hvis de to målingene spriker mye, vises begge."
              en="Both browsers measure both faces locally. The official duel score uses your opponent’s measurement of you — if they disagree noticeably, both are shown."
            />
          </p>
          <p>
            <Tekst
              no="Video går direkte peer-to-peer og ingenting tas opp eller lagres. Alt her er tull."
              en="Video flows directly peer-to-peer and nothing is recorded or stored. Everything here is pure satire."
            />
          </p>
        </>
      }
    >
      <MoggernRom kode={kode} bruker={bruker} supabaseUrl={url} supabaseNokkel={key} />
    </SpillRamme>
  )
}

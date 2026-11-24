import type { Metadata } from "next"
import { Tekst } from "@/components/sprak-knapp"
import { MoggernInngang } from "@/features/spill/components/moggern-inngang"
import { spillskrift } from "@/features/spill/components/skrift"
import { SpillRamme } from "@/features/spill/components/spill-ramme"
import { utledVisningsnavn } from "@/features/spill/lib/moggern/duell"
import { hentBruker } from "@/features/spill/lib/server/sosial-api"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Moggern",
  description: "1v1 kameraduell for venner: 15 sekunders måling i nettleseren, 7 delpoeng, titler og tullete disser.",
}

export default async function Page() {
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

  return (
    <SpillRamme
      spillId="moggern"
      bred
      klasse={`${spillskrift.className} overflow-x-clip`}
      regler={
        <>
          <p>
            <Tekst
              no="Kun med venner: lag et privat rom og send lenken eller romkoden (4 bokstaver) til én venn."
              en="Friends only: create a private room and send the link or 4-letter room code to a friend."
            />
          </p>
          <p>
            <Tekst
              no="Videoen går direkte peer-to-peer mellom de to nettleserne, og ansiktsmålingen kjører lokalt med MediaPipe Face Landmarker. Ingenting blir tatt opp eller lagret."
              en="Video streams directly peer-to-peer between the two browsers, and face scoring runs locally with MediaPipe Face Landmarker. Nothing is recorded or stored."
            />
          </p>
          <p>
            <Tekst
              no="Alt her er tull — ren matte på gøy uten vitenskapelig grunnlag."
              en="Everything here is pure satire — math for fun with zero scientific basis."
            />
          </p>
        </>
      }
    >
      <MoggernInngang bruker={bruker} />
    </SpillRamme>
  )
}

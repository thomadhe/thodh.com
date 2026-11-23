import type { Metadata } from "next"
import { MoggernInngang } from "@/features/spill/components/moggern-inngang"
import { spillskrift } from "@/features/spill/components/skrift"
import { SpillRamme } from "@/features/spill/components/spill-ramme"
import { utledVisningsnavn } from "@/features/spill/lib/moggern/duell"
import { createClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Moggern",
  description: "1v1 kameraduell for venner: 10 sekunders måling i nettleseren, 7 delpoeng, titler og tullete disser.",
}

export default async function Page() {
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

  return (
    <SpillRamme
      spillId="moggern"
      bred
      klasse={`${spillskrift.className} overflow-x-clip`}
      regler={
        <>
          <p>
            Kun med venner: lag et privat rom og send lenken eller romkoden (4 bokstaver) til én venn. Du må være innlogget for å slå på kameraet.
          </p>
          <p>
            Videoen går direkte peer-to-peer mellom de to nettleserne, og ansiktsmålingen kjører lokalt med MediaPipe Face Landmarker. Ingenting blir
            tatt opp eller lagret.
          </p>
          <p>Alt her er tull — ren matte på gøy uten vitenskapelig grunnlag.</p>
        </>
      }
    >
      <MoggernInngang bruker={bruker} />
    </SpillRamme>
  )
}

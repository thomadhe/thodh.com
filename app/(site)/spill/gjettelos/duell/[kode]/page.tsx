import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { GjettelosDuell } from "@/features/spill/components/gjettelos-duell"
import { SpillRamme } from "@/features/spill/components/spill-ramme"
import { stegernSkrift } from "@/features/spill/components/stegern-skrift"
import { erGyldigKode, MAKS_SPILLERE, MIN_SPILLERE, normaliserKode } from "@/features/spill/lib/duell/rom"
import { GJ_SEKUNDER } from "@/features/spill/lib/gjettelos-duell"
import { supabaseConfig } from "@/lib/supabase/config"

export const metadata: Metadata = {
  title: "Duell · Gjetteløs",
  description: "Bli med i duellen: de samme tallspørsmålene samtidig, og den som gjetter nærmest, vinner.",
  robots: { index: false },
}

// A duel room, /spill/gjettelos/duell/<KODE>. The page is only the frame; everything in the room happens in the
// browser over Supabase Realtime (features/spill/components/gjettelos-duell.tsx). Proxy does not touch this path.
export default async function Page({ params }: PageProps<"/spill/gjettelos/duell/[kode]">) {
  const kode = normaliserKode(decodeURIComponent((await params).kode))
  if (!erGyldigKode(kode)) notFound()
  const { url, key } = supabaseConfig()
  return (
    <SpillRamme
      spillId="gjettelos"
      klasse={`px-side ${stegernSkrift}`}
      regler={
        <>
          <p>
            Duell for {MIN_SPILLERE}–{MAKS_SPILLERE} spillere. Den som lager rommet, er vert og starter når minst én til er klar. Alle får de samme
            tallspørsmålene samtidig, med {GJ_SEKUNDER} sekunder på hvert.
          </p>
          <p>
            Når alle har svart eller tiden er ute, kommer fasit, og dere ser alle gjetningene på en tallinje. Poengene er de samme som i dagens Gjetteløs,
            opptil 100 per spørsmål, og høyeste sum vinner.
          </p>
          <p>Spørsmålene er hentet fra tidligere dager, aldri fra dagens eller de neste ukenes. Duellen teller ikke i statistikken din.</p>
        </>
      }
    >
      <GjettelosDuell kode={kode} supabaseUrl={url} supabaseNokkel={key} />
    </SpillRamme>
  )
}

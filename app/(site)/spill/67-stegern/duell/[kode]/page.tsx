import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { SpillRamme } from "@/features/spill/components/spill-ramme"
import { StegernDuell } from "@/features/spill/components/stegern-duell"
import { stegernSkrift } from "@/features/spill/components/stegern-skrift"
import { SEKUNDER } from "@/features/spill/lib/stegern"
import { erGyldigKode, MAKS_SPILLERE, MIN_SPILLERE, normaliserKode } from "@/features/spill/lib/stegern-duell"
import { supabaseConfig } from "@/lib/supabase/config"

export const metadata: Metadata = {
  title: "Duell · 6/7-stegern",
  description: "Bli med i duellen: de samme fem spørsmålene samtidig, og lengste hopp vinner.",
  robots: { index: false },
}

// A duel room, /spill/67-stegern/duell/<KODE>. The page is only the frame; everything in the room happens in the
// browser over Supabase Realtime (features/spill/components/stegern-duell.tsx). Proxy does not touch this path.
export default async function Page({ params, searchParams }: PageProps<"/spill/67-stegern/duell/[kode]">) {
  const kode = normaliserKode(decodeURIComponent((await params).kode))
  if (!erGyldigKode(kode)) notFound()
  const { modus } = await searchParams
  const startModus = modus === "pistol" ? "pistol" : "runder"
  const { url, key } = supabaseConfig()
  return (
    <SpillRamme
      spillId="67-stegern"
      klasse={`stegern-side ${stegernSkrift}`}
      regler={
        <>
          <p>
            Duell for {MIN_SPILLERE}–{MAKS_SPILLERE} spillere. Den som lager rommet, er vert og starter når minst én til er klar. Alle får de samme fem
            spørsmålene samtidig, med {SEKUNDER} sekunder på hvert.
          </p>
          <p>
            Etter hvert spørsmål ser dere hverandres svar, og alle Stegernene hopper side om side. Lengste sum vinner. Spørsmålene er hentet fra tidligere
            dager, og duellen teller ikke i statistikken din.
          </p>
          <p>
            Verten kan også velge Startpistolen: den som har pistolen, må gi et gyldig svar som ingen har sagt, før den skjulte lunta går av. Et svar sender
            pistolen videre, smeller den, mister du et liv, og sist på beina vinner. Hoppene dine fyller livsmåleren og kan gi deg et liv tilbake.
          </p>
          <p>Går verten, tar den som har vært lengst i rommet over. Laster du siden på nytt, kommer du tilbake på samme plass.</p>
        </>
      }
    >
      <StegernDuell kode={kode} supabaseUrl={url} supabaseNokkel={key} startModus={startModus} />
    </SpillRamme>
  )
}

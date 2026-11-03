import type { Metadata } from "next"
import { Anelseslos } from "@/features/spill/components/anelseslos"
import { SpillRamme } from "@/features/spill/components/spill-ramme"
import { forhandsbygdeDager } from "@/features/spill/lib/ruting"
import { antallOrd } from "@/features/spill/lib/server/anelseslos"
import { dagForSide } from "@/features/spill/lib/server/side"

export const metadata: Metadata = {
  title: "Anelsesløs",
  description: "Finn dagens hemmelige engelske ord. Ordene rangeres etter hvor like de er i betydning.",
}

// One cached page per date. Players use /spill/anelseslos(?dato=…); Proxy rewrites it here (features/spill/lib/ruting.ts).
export function generateStaticParams() {
  return forhandsbygdeDager("anelseslos")
}

export default async function Page({ params }: PageProps<"/spill/anelseslos/[dag]">) {
  const { dato, iDag } = dagForSide("anelseslos", (await params).dag)
  const antall = antallOrd()
  return (
    <SpillRamme
      spillId="anelseslos"
      dato={dato}
      iDag={iDag}
      regler={
        <>
          <p>
            Grønt er veldig nært, gult nært, oransje lunkent og rødt langt unna. Bøyde former som «dogs» regnes som «dog». Et hint gir et ord omtrent dobbelt så nært som ditt beste.
          </p>
          <p className="font-mono text-[11px] text-neutral-400">
            Likhet beregnet med et ensemble av GloVe-ordvektorer (Pennington, Socher &amp; Manning 2014, PDDL 1.0),
            mxbai-embed-large-v1 (Mixedbread, Apache 2.0) og Qwen3-Embedding-0.6B (Qwen-teamet, Alibaba, Apache 2.0).
            Ordutvalg med WordNet 3.0, © 2006 Princeton University, og wordfreq (Robyn Speer, CC BY-SA 4.0).
          </p>
        </>
      }
    >
      <Anelseslos key={dato} dato={dato} antall={antall} />
    </SpillRamme>
  )
}

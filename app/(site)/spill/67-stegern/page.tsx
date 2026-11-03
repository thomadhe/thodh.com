import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { SpillRamme } from "@/features/spill/components/spill-ramme"
import { Stegern } from "@/features/spill/components/stegern"
import { velgDato } from "@/features/spill/lib/dag"
import { dagensSporsmal, erRepris } from "@/features/spill/lib/server/stegern"
import { FINALE_FAKTOR, GJENTA_DM, hoppDm, meter, NIVAAER, SEKUNDER, STEGERN_START, type Nivaa } from "@/features/spill/lib/stegern"

export const metadata: Metadata = {
  title: "6/7-stegern",
  description: "Sju spørsmål om dagen. Jo sjeldnere svar, jo lengre hopper Stegern.",
}

export default async function Page({ searchParams }: PageProps<"/spill/67-stegern">) {
  const dato = velgDato((await searchParams).dato)
  // Days before the game existed have no puzzle: send the player to today instead of showing it under that date.
  if (dato < STEGERN_START) redirect("/spill/67-stegern")
  return (
    <SpillRamme
      spillId="67-stegern"
      dato={dato}
      regler={
        <>
          <p>
            Alt som passer, er riktig, men vanlige svar gir korte hopp og sjeldne svar lange. Hvert svar har et fast nivå i fasiten, og et svar som
            ikke passer, gir bare et lite hink:
          </p>
          <ul className="grid grid-cols-2 gap-x-4 gap-y-1 font-mono text-[11px]">
            {([1, 2, 3, 4, 5, 0] as Nivaa[]).map((n) => (
              <li key={n} className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: NIVAAER[n].farge }} />
                <span className="text-neutral-900">{NIVAAER[n].navn}</span>
                <span>{meter(hoppDm(n))}</span>
              </li>
            ))}
          </ul>
          <p>
            Spørsmål 6 spør hva du svarte på et av de fem første. Samme svar i en annen form teller (USA og Amerika), og små skrivefeil er greit. Var
            svaret ditt feil da, gjentar du det du skrev. Svarte du ingenting, hopper du med tomt felt (eller skriver «ingenting»). Husker du riktig,
            hopper Stegern {meter(GJENTA_DM)} og finalen åpner. Den teller {String(FINALE_FAKTOR).replace(".", ",")} ganger.
          </p>
          <p>
            Store og små bokstaver, aksenter og små skrivefeil spiller ingen rolle. Med klokka på har du {SEKUNDER} sekunder per spørsmål, og det
            som står i feltet når tida er ute, blir sendt.
          </p>
        </>
      }
    >
      <Stegern key={dato} dato={dato} sporsmal={dagensSporsmal(dato)} repris={erRepris(dato)} />
    </SpillRamme>
  )
}

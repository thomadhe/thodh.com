// Prints the Stavebien clips to generate as JSON: [{ fil, del, ord, tekst }].
// Used by scripts/spill/lag-stavelyd.py so the id and spoken text always match the site code.
import { stavebienOrd } from "../../features/spill/data/stavebien/ord.ts"
import { LYD_DELER, lydId, lydTekst } from "../../features/spill/lib/stavebien-lyd.ts"

const liste = stavebienOrd.flatMap((o) =>
  Object.entries(LYD_DELER).map(([del, kode]) => ({
    fil: `${lydId(o.word)}-${kode}.mp3`,
    del,
    ord: o.word,
    tekst: lydTekst(o, del),
  })),
)
process.stdout.write(JSON.stringify(liste))

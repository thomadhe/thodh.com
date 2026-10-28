import type { MerEllerMindreCategory } from "../data/types"

const tall = new Intl.NumberFormat("nb-NO")

export function formaterVerdi(verdi: number, format: MerEllerMindreCategory["format"]) {
  switch (format) {
    case "year":
      return String(verdi)
    case "decimal":
      return verdi.toLocaleString("nb-NO", { minimumFractionDigits: 1, maximumFractionDigits: 1 })
    case "integer":
      return tall.format(Math.round(verdi))
    case "compact": {
      const abs = Math.abs(verdi)
      const kort = (n: number, ord: string) =>
        `${n.toLocaleString("nb-NO", { maximumFractionDigits: n < 10 ? 1 : 0 })} ${ord}`
      if (abs >= 1e9) return kort(verdi / 1e9, "mrd.")
      if (abs >= 1e6) return kort(verdi / 1e6, "mill.")
      if (abs >= 1e4) return tall.format(Math.round(verdi))
      if (abs >= 10) return tall.format(Math.round(verdi))
      return verdi.toLocaleString("nb-NO", { maximumSignificantDigits: 2 })
    }
  }
}

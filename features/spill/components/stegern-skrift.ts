import { JetBrains_Mono, Space_Grotesk } from "next/font/google"

// 6/7-stegern's display & numeric faces (also used in the Gjetteløs duel). Space Grotesk gives crisp,
// readable headings, wordmarks and scores with clean æ, ø and å; JetBrains Mono keeps room codes and
// tabular numbers unmistakable at a glance (0/O, 5/S, 8/B and C/O never blur together).

export const pikselskrift = Space_Grotesk({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  display: "swap",
  variable: "--font-piksel",
})

export const etikettskrift = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["600", "700"],
  display: "swap",
  variable: "--font-etikett",
})

export const stegernSkrift = `${pikselskrift.variable} ${etikettskrift.variable}`

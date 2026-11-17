import { Pixelify_Sans, Silkscreen } from "next/font/google"

// 6/7-stegern's pixel faces, loaded only on its pages. Pixelify Sans is the display face (title, prompts, buttons)
// and still reads well at body sizes; Silkscreen is for the small uppercase labels. Both have æ, ø and å.

export const pikselskrift = Pixelify_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-piksel",
})

export const etikettskrift = Silkscreen({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-etikett",
})

export const stegernSkrift = `${pikselskrift.variable} ${etikettskrift.variable}`

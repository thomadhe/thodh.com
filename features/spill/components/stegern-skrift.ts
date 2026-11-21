import { Pixelify_Sans, Silkscreen } from "next/font/google"

// 6/7-stegern's pixel faces, loaded only on its pages (and the Gjetteløs duel). Pixelify Sans is the display face:
// headings, the wordmark and scores. Silkscreen is for numbers and codes that must read at a glance (its C and O,
// B and 8, 5 and S never look alike). Questions, answers, labels and buttons use the site's sans, since bitmap
// faces tire the eye at body sizes. Both have æ, ø and å.

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

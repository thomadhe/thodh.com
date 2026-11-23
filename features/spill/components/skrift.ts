import { Outfit, Unbounded } from "next/font/google"

/** Wide display face for the games hub wordmark and tile titles. */
export const visningsskrift = Unbounded({
  subsets: ["latin"],
  weight: ["600", "800"],
  variable: "--font-visning",
})

/** Geometric sans shared with Gjetteløs: calm, many weights, figures that hold up at display size. */
export const spillskrift = Outfit({ subsets: ["latin"], display: "swap", variable: "--font-spill" })

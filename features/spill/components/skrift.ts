import { Unbounded } from "next/font/google"

/** Wide display face for the games hub wordmark and tile titles. */
export const visningsskrift = Unbounded({
  subsets: ["latin", "latin-ext"],
  weight: ["600", "800"],
  variable: "--font-visning",
})

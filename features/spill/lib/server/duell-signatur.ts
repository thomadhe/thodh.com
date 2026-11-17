// Signed verdicts for the duels. The server judges every answer and signs what it found, with the time, using
// Ed25519; every client checks the signature with the public key it fetched from the server itself, so nobody can
// claim a verdict (or a time) the server never gave. Kept free of "server-only" so the tests can import it.
//
// No new secret: like 6/7-stegern's receipts, the key is derived from STEGERN_HEMMELIGHET or SJAKK_GATEWAY_KEY,
// which Vercel already has, so every instance signs with the same key. Without either (local development) the key
// lives for this process only.

import { createHmac, createPrivateKey, createPublicKey, randomBytes, sign, verify, type KeyObject } from "node:crypto"
import type { Signert } from "../duell/signatur"

// PKCS#8 wrapping of a raw 32-byte Ed25519 seed.
const PKCS8_ED25519 = Buffer.from("302e020100300506032b657004220420", "hex")

let nokler: { privat: KeyObject; offentlig: KeyObject; raa: string } | null = null

function hent() {
  if (nokler) return nokler
  const kilde = process.env.STEGERN_HEMMELIGHET || process.env.SJAKK_GATEWAY_KEY
  const fro = kilde ? createHmac("sha256", kilde).update("duell:ed25519").digest() : randomBytes(32)
  const privat = createPrivateKey({ key: Buffer.concat([PKCS8_ED25519, fro]), format: "der", type: "pkcs8" })
  const offentlig = createPublicKey(privat)
  const der = offentlig.export({ format: "der", type: "spki" })
  return (nokler = { privat, offentlig, raa: der.subarray(der.length - 32).toString("base64url") })
}

/** The public key as raw bytes in base64url, for WebCrypto's importKey("raw", …, "Ed25519"). */
export const offentligNokkel = () => hent().raa

/** Signs a verdict. The exact JSON text is what is signed, so nothing needs to be put in a canonical form. */
export function signer(data: Record<string, unknown>): Signert {
  const j = JSON.stringify(data)
  return { j, s: sign(null, Buffer.from(j), hent().privat).toString("base64url") }
}

export function erSignert(x: Signert) {
  try {
    return verify(null, Buffer.from(x.j), hent().offentlig, Buffer.from(x.s, "base64url"))
  } catch {
    return false
  }
}

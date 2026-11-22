// WebRTC ICE server configuration for Moggern.
//
// Public STUN is always included so peers on standard networks connect directly.
// Optional TURN credentials are read from environment variables and only handed out to
// authenticated users, so mobile networks behind symmetric NAT can relay cleanly when configured.

export type IceTjener = {
  urls: string | string[]
  username?: string
  credential?: string
}

export type IceKonfig = {
  iceServers: IceTjener[]
  harTurn: boolean
}

export const STANDARD_STUN: readonly IceTjener[] = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun1.l.google.com:19302" },
]

export type TurnMiljo = {
  MOGGERN_TURN_URLS?: string
  MOGGERN_TURN_URL?: string
  MOGGERN_TURN_USERNAME?: string
  MOGGERN_TURN_CREDENTIAL?: string
}

/**
 * Builds the ICE server list for WebRTC.
 * TURN servers are only attached when `innlogget` is true and both URL(s) and credentials are set.
 */
export function byggIceKonfig(env: TurnMiljo, innlogget: boolean): IceKonfig {
  const iceServers: IceTjener[] = STANDARD_STUN.map((s) => ({ ...s }))
  if (!innlogget) return { iceServers, harTurn: false }

  const raUrls = (env.MOGGERN_TURN_URLS || env.MOGGERN_TURN_URL || "")
    .split(",")
    .map((u) => u.trim())
    .filter((u) => /^turns?:.+/.test(u))
  const username = env.MOGGERN_TURN_USERNAME?.trim()
  const credential = env.MOGGERN_TURN_CREDENTIAL?.trim()

  if (raUrls.length > 0 && username && credential) {
    iceServers.push({
      urls: raUrls.length === 1 ? raUrls[0] : raUrls,
      username,
      credential,
    })
    return { iceServers, harTurn: true }
  }

  return { iceServers, harTurn: false }
}

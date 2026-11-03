import "server-only"

import { notFound } from "next/navigation"
import { sidensDag } from "../ruting"
import type { SpillId } from "../spill"

/**
 * The date for a per-date game page (app/(site)/spill/<game>/[dag]). Proxy only rewrites to days that can be
 * played, so a 404 here means someone asked for the internal address directly.
 */
export function dagForSide(id: SpillId, segment: string) {
  return sidensDag(id, segment) ?? notFound()
}

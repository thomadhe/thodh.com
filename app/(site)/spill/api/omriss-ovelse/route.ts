import { ovelsesformer } from "@/features/spill/lib/server/omriss"

// Random outlines for Omriss' practice tab, fetched in small batches so the page stays light.
// (GET route handlers are not cached by default in this Next version.)
export function GET() {
  return Response.json({ former: ovelsesformer(12) }, { headers: { "Cache-Control": "no-store" } })
}

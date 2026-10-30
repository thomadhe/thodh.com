import { erOvelsesUtvalg, ovelsesformer } from "@/features/spill/lib/server/omriss"

// Random outlines for Omriss' practice tab, fetched in small batches so the page stays light.
// ?utvalg=land gives sovereign states only, ?utvalg=alle territories too.
// (GET route handlers are not cached by default in this Next version.)
export function GET(request: Request) {
  const utvalg = new URL(request.url).searchParams.get("utvalg")
  return Response.json({ former: ovelsesformer(12, erOvelsesUtvalg(utvalg) ? utvalg : "land") }, { headers: { "Cache-Control": "no-store" } })
}

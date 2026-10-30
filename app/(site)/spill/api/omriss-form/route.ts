import former from "@/features/spill/data/geografi/former.json"

// One outline by id, for Omriss' area bonus round (shown only after the main puzzle is over).
const formKart = former as Record<string, string>

export function GET(request: Request) {
  const id = new URL(request.url).searchParams.get("id") ?? ""
  const form = formKart[id]
  if (!form) return Response.json({ melding: "Ukjent id." }, { status: 404 })
  return Response.json({ form }, { headers: { "Cache-Control": "public, max-age=604800, immutable" } })
}

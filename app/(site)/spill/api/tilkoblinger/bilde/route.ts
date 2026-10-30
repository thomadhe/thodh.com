import { kanSpilles } from "@/features/spill/lib/dag"
import { bildeFor } from "@/features/spill/lib/server/tilkoblinger"

// Pictures for Tilkoblinger tiles (flag, outline or photo of a famous sight). Served by tile id so the URL
// doesn't name the country. Flags: flagcdn.com (flag-icons, MIT). Photos: Wikimedia Commons (credited
// in the game when the group is found).
const UA = "thodh.com-spill/1.0 (thodhel@gmail.com)"
const BUFFER = "public, max-age=86400, s-maxage=604800"

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams
  const dato = params.get("dato") ?? ""
  if (!kanSpilles(dato)) return new Response("Ugyldig dag.", { status: 400 })
  const bilde = bildeFor(dato, params.get("b") ?? "")
  if (!bilde) return new Response("Fant ikke ruten.", { status: 404 })

  if (bilde.slag === "omriss") {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"><path d="${bilde.form}" fill="#38bdf8"/></svg>`
    return new Response(svg, { headers: { "Content-Type": "image/svg+xml", "Cache-Control": BUFFER } })
  }

  const url = bilde.slag === "foto" ? bilde.url : `https://flagcdn.com/${bilde.flagg}.svg`
  const svar = await fetch(url, { headers: { "User-Agent": UA }, next: { revalidate: 604800 } })
  if (!svar.ok) return new Response("Fant ikke bildet.", { status: 502 })
  return new Response(await svar.arrayBuffer(), {
    headers: {
      "Content-Type": svar.headers.get("Content-Type") ?? (bilde.slag === "foto" ? "image/jpeg" : "image/svg+xml"),
      "Cache-Control": BUFFER,
      // Only ever shown as an image; no scripts or outside requests from the SVG flags.
      "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'",
    },
  })
}

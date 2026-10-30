import { kanSpilles, velgDato } from "@/features/spill/lib/dag"
import { dagensFlagg } from "@/features/spill/lib/server/canvas"

// Serves Canvas' flag of the day without the country code in the URL, so the network tab doesn't
// give the answer away. Flags: flagcdn.com (flag-icons, MIT).
export async function GET(request: Request) {
  const dato = new URL(request.url).searchParams.get("dato") ?? ""
  if (!kanSpilles(dato)) return new Response("Ugyldig dag.", { status: 400 })
  const { flagg } = dagensFlagg(velgDato(dato))
  const svar = await fetch(`https://flagcdn.com/${flagg}.svg`, { next: { revalidate: 604800 } })
  if (!svar.ok) return new Response("Fant ikke flagget.", { status: 502 })
  return new Response(await svar.text(), {
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "public, max-age=86400",
      // The SVG is only ever shown as an image; no scripts or outside requests.
      "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'",
    },
  })
}

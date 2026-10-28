// The standalone app's AI integration depends on its private Sites gateway.
// Keep AI disabled on the public site until authentication and usage limits exist.
const headers = { "Cache-Control": "no-store" };

export function GET() {
  return Response.json({ available: false }, { headers });
}

export function POST() {
  return Response.json(
    { error: "Fri AI-samtale er ikke koblet til ennå. Bruk en veiledet øvelse." },
    { status: 503, headers },
  );
}

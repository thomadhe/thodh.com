// Free conversation runs through the owner's local AI bridge (scripts/lokal-ai.mjs)
// straight from the browser. The public site never runs AI on the server.
const headers = { "Cache-Control": "no-store" };

export function GET() {
  return Response.json({ available: false }, { headers });
}

export function POST() {
  return Response.json(
    { error: "Fri samtale går via lokal AI på din egen PC, ikke via serveren. Start broen eller bruk en veiledet øvelse." },
    { status: 503, headers },
  );
}

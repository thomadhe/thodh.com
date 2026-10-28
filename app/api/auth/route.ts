import { createClient } from "@/lib/supabase/server";
import { authError, authInput, readJson, safeNext, sameOrigin } from "@/lib/auth/validation";

const headers = { "Cache-Control": "private, no-store" };
export async function POST(request: Request) {
  if (!sameOrigin(request)) return Response.json({ error: "Ugyldig forespørsel." }, { status: 403, headers });
  const parsed = authInput.safeParse(await readJson(request, 8000).catch(() => null));
  if (!parsed.success) return Response.json({ error: "Kontroller e-postadressen og feltene." }, { status: 400, headers });
  const { action, email, password, next } = parsed.data;
  if (action !== "magic" && (!password || (action === "signup" && password.length < 8))) {
    return Response.json({ error: action === "signup" ? "Bruk minst 8 tegn i passordet." : "Skriv inn passordet." }, { status: 400, headers });
  }
  try {
    const supabase = await createClient();
    const callback = new URL("/auth/callback", request.url);
    callback.searchParams.set("next", safeNext(next));
    if (action === "login") {
      const { error } = await supabase.auth.signInWithPassword({ email, password: password! });
      return error
        ? Response.json({ error: authError(error.code) }, { status: error.status === 429 ? 429 : 400, headers })
        : Response.json({ signedIn: true, next: safeNext(next) }, { headers });
    }
    if (action === "signup") {
      const { data, error } = await supabase.auth.signUp({ email, password: password!, options: { emailRedirectTo: callback.href } });
      if (error) return Response.json({ error: authError(error.code) }, { status: 400, headers });
      return Response.json({ signedIn: !!data.session, next: safeNext(next), message: "Sjekk innboksen og bekreft e-posten. Har du allerede konto, kan du logge inn med den." }, { headers });
    }
    const { error } = await supabase.auth.signInWithOtp({ email, options: { shouldCreateUser: false, emailRedirectTo: callback.href } });
    if (error && error.code !== "otp_disabled" && error.code !== "user_not_found") {
      return Response.json({ error: authError(error.code) }, { status: 400, headers });
    }
    return Response.json({ message: "Hvis e-postadressen har en konto, får du en innloggingslenke. Sjekk også søppelpost." }, { headers });
  } catch {
    return Response.json({ error: "Innloggingstjenesten er ikke tilgjengelig akkurat nå. Prøv igjen." }, { status: 503, headers });
  }
}

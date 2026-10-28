import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { safeNext } from "@/lib/auth/validation";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const destination = new URL("/auth/ferdig", url.origin);
      destination.searchParams.set("next", safeNext(url.searchParams.get("next")));
      const response = NextResponse.redirect(destination, 303);
      response.headers.set("Cache-Control", "private, no-store");
      return response;
    }
  }
  const destination = new URL("/logg-inn", url.origin);
  destination.searchParams.set("feil", "lenke");
  const response = NextResponse.redirect(destination, 303);
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}

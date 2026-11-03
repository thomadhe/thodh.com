import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { rutSpill } from "@/features/spill/lib/ruting";
import { authCookieOptions, supabaseConfig } from "@/lib/supabase/config";

export async function proxy(request: NextRequest) {
  const spill = rutSpill(request.nextUrl.pathname, request.nextUrl.searchParams.get("dato"));
  if (spill) {
    // Daily games: pick the date here, per request, and serve that day's cached page. No auth and no
    // Cache-Control from Proxy, so the page keeps its own (public, cacheable) headers.
    if (spill.type === "redirect") return NextResponse.redirect(new URL(spill.sti, request.url));
    // Other query parameters (such as the router's _rsc) go along unchanged.
    const url = request.nextUrl.clone();
    url.pathname = spill.sti;
    url.searchParams.delete("dato");
    return NextResponse.rewrite(url);
  }

  let response = NextResponse.next({ request });
  const { url, key } = supabaseConfig();
  const supabase = createServerClient(url, key, {
    cookieOptions: authCookieOptions,
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(values, headers) {
        values.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        values.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        Object.entries(headers).forEach(([name, value]) => response.headers.set(name, value));
      },
    },
  });
  await supabase.auth.getUser();
  // Authentication is checked again at each data access, never just in Proxy.
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}

export const config = {
  matcher: [
    "/otsjoba",
    "/otsjoba/api/:path*",
    "/konto",
    "/logg-inn",
    "/registrer",
    "/auth/:path*",
    "/api/auth/:path*",
    // The daily games (features/spill/lib/spill.ts; a test keeps the two lists in step), with or without a date segment.
    "/spill/:spill(mer-eller-mindre|anelseslos|stavebien|sanglos|omriss|canvas|soket|emovi|rusle|tilkoblinger|havet|heksagonal-jakt|67-stegern)/:dag?",
  ],
};

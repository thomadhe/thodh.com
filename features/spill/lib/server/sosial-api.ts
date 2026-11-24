import "server-only"

import type { PostgrestError, SupabaseClient, User } from "@supabase/supabase-js"
import { cookies } from "next/headers"
import { hasAuthCookie } from "@/lib/supabase/config"
import { createClient } from "@/lib/supabase/server"

const PRIVATE_HEADERS = { "Cache-Control": "private, no-store" }

export function jsonPrivat(data: unknown, status = 200) {
  return Response.json(data, { status, headers: PRIVATE_HEADERS })
}

export async function hentBruker(): Promise<{ supabase: SupabaseClient; user: User } | null> {
  try {
    const store = await cookies()
    if (!hasAuthCookie(store.getAll())) return null
    const supabase = await createClient()
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser()
    if (error || !user) return null
    return { supabase, user }
  } catch {
    return null
  }
}

/** Detects when the social SQL migration has not yet been applied to the Supabase database. */
export function erDatabaseMangel(err: PostgrestError | null | undefined): boolean {
  if (!err) return false
  return err.code === "42P01" || err.code === "42883" || err.code === "PGRST202" || err.code === "PGRST205"
}

export const DB_IKKE_KLAR_MELDING =
  "Databasetabellene for historikk, ledertavle og venner er ikke aktivert ennå. Be eieren kjøre migrasjonen i Supabase."

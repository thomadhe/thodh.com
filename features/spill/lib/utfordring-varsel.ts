"use client"

import type { RealtimeChannel, SupabaseClient } from "@supabase/supabase-js"
import { useEffect, useRef } from "react"
import { utfordringVarselKanal } from "./sosial"

// Lightweight anonymous Realtime broadcast ping for friend duel challenges.
// Carries NO private data (only `{ ping: 1 }`); the recipient then reloads their inbox
// via the authenticated `/spill/api/utfordringer` endpoint.

async function lagRealtimeKlient(url: string, key: string): Promise<SupabaseClient> {
  const { createClient } = await import("@supabase/supabase-js")
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  })
}

export async function sendUtfordringPing(supabaseUrl: string, supabaseKey: string, mottakerId: string) {
  if (!supabaseUrl || !supabaseKey || !mottakerId) return
  let klient: SupabaseClient | null = null
  let kanal: RealtimeChannel | null = null
  try {
    klient = await lagRealtimeKlient(supabaseUrl, supabaseKey)
    kanal = klient.channel(utfordringVarselKanal(mottakerId), { config: { broadcast: { self: false } } })
    await new Promise<void>((resolve) => {
      const frist = window.setTimeout(resolve, 2000)
      kanal!.subscribe((status) => {
        if (status === "SUBSCRIBED" || status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          window.clearTimeout(frist)
          resolve()
        }
      })
    })
    await kanal.send({ type: "broadcast", event: "ping", payload: { p: 1 } })
  } catch {
    // Best-effort speedup; polling handles delivery even if Realtime is unavailable.
  } finally {
    if (klient && kanal) void klient.removeChannel(kanal).catch(() => undefined)
  }
}

export function useUtfordringVarsel(
  supabaseUrl: string,
  supabaseKey: string,
  brukerId: string | null,
  onVarsel: () => void,
) {
  const cbRef = useRef(onVarsel)
  useEffect(() => {
    cbRef.current = onVarsel
  })

  useEffect(() => {
    if (!supabaseUrl || !supabaseKey || !brukerId) return
    let aktiv = true
    let klient: SupabaseClient | null = null
    let kanal: RealtimeChannel | null = null

    void lagRealtimeKlient(supabaseUrl, supabaseKey)
      .then((c) => {
        if (!aktiv) return
        klient = c
        kanal = c
          .channel(utfordringVarselKanal(brukerId), { config: { broadcast: { self: false } } })
          .on("broadcast", { event: "ping" }, () => cbRef.current())
          .subscribe()
      })
      .catch(() => undefined)

    return () => {
      aktiv = false
      if (klient && kanal) void klient.removeChannel(kanal).catch(() => undefined)
    }
  }, [supabaseUrl, supabaseKey, brukerId])
}

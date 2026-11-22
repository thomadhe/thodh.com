import { z } from "zod"
import { lagVennekode, validerVisningsnavn } from "@/features/spill/lib/sosial"
import { DB_IKKE_KLAR_MELDING, erDatabaseMangel, hentBruker, jsonPrivat } from "@/features/spill/lib/server/sosial-api"
import { readJson, sameOrigin } from "@/lib/auth/validation"

const oppdaterSkjema = z.object({
  visningsnavn: z.string().max(80),
})

export async function GET() {
  const innlogget = await hentBruker()
  if (!innlogget) return jsonPrivat({ innlogget: false, profil: null })

  const { data, error } = await innlogget.supabase
    .from("spill_profiler")
    .select("visningsnavn, vennekode")
    .eq("user_id", innlogget.user.id)
    .maybeSingle()

  if (error) {
    if (erDatabaseMangel(error)) {
      return jsonPrivat({
        innlogget: true,
        databaseKlar: false,
        profil: { userId: innlogget.user.id, visningsnavn: null, vennekode: null },
      })
    }
    return jsonPrivat({ melding: "Klarte ikke å hente profilen din." }, 500)
  }

  return jsonPrivat({
    innlogget: true,
    databaseKlar: true,
    profil: {
      userId: innlogget.user.id,
      visningsnavn: data?.visningsnavn ?? null,
      vennekode: data?.vennekode ?? null,
    },
  })
}

export async function PUT(request: Request) {
  if (!sameOrigin(request)) return jsonPrivat({ melding: "Ugyldig opprinnelse." }, 403)
  const innlogget = await hentBruker()
  if (!innlogget) return jsonPrivat({ melding: "Du må være innlogget." }, 401)

  let kropp: unknown
  try {
    kropp = await readJson(request, 2048)
  } catch {
    return jsonPrivat({ melding: "Ugyldig forespørsel." }, 400)
  }

  const tolket = oppdaterSkjema.safeParse(kropp)
  if (!tolket.success) return jsonPrivat({ melding: "Ugyldig visningsnavn." }, 400)

  const vurdert = validerVisningsnavn(tolket.data.visningsnavn)
  if (!vurdert.ok) return jsonPrivat({ melding: vurdert.feil }, 400)

  const { supabase, user } = innlogget
  const { data: eksisterende, error: lesFeil } = await supabase
    .from("spill_profiler")
    .select("vennekode")
    .eq("user_id", user.id)
    .maybeSingle()

  if (lesFeil) {
    if (erDatabaseMangel(lesFeil)) return jsonPrivat({ melding: DB_IKKE_KLAR_MELDING }, 503)
    return jsonPrivat({ melding: "Klarte ikke å lagre visningsnavnet." }, 500)
  }

  if (eksisterende) {
    const { data, error } = await supabase
      .from("spill_profiler")
      .update({ visningsnavn: vurdert.navn, oppdatert_kl: new Date().toISOString() })
      .eq("user_id", user.id)
      .select("visningsnavn, vennekode")
      .single()
    if (error || !data) return jsonPrivat({ melding: "Klarte ikke å oppdatere visningsnavnet." }, 500)
    return jsonPrivat({
      profil: { userId: user.id, visningsnavn: data.visningsnavn, vennekode: data.vennekode },
    })
  }

  // First time creating a profile: generate a unique 6-char friend code.
  for (let forsok = 0; forsok < 5; forsok++) {
    const vennekode = lagVennekode()
    const { data, error } = await supabase
      .from("spill_profiler")
      .insert({ user_id: user.id, visningsnavn: vurdert.navn, vennekode })
      .select("visningsnavn, vennekode")
      .single()
    if (!error && data) {
      return jsonPrivat({
        profil: { userId: user.id, visningsnavn: data.visningsnavn, vennekode: data.vennekode },
      })
    }
    if (error?.code !== "23505") {
      if (erDatabaseMangel(error)) return jsonPrivat({ melding: DB_IKKE_KLAR_MELDING }, 503)
      return jsonPrivat({ melding: "Klarte ikke å opprette spillprofil." }, 500)
    }
  }
  return jsonPrivat({ melding: "Prøv igjen om et øyeblikk." }, 500)
}

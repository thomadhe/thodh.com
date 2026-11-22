import { z } from "zod"
import { erGyldigVennekode, normaliserVennekode, type VennOppforing } from "@/features/spill/lib/sosial"
import { DB_IKKE_KLAR_MELDING, erDatabaseMangel, hentBruker, jsonPrivat } from "@/features/spill/lib/server/sosial-api"
import { readJson, sameOrigin } from "@/lib/auth/validation"

const sendSkjema = z.object({ kode: z.string().max(24) })
const godtaSkjema = z.object({ vennskapId: z.string().uuid(), handling: z.literal("godta") })
const slettSkjema = z.object({ vennskapId: z.string().uuid() })

type RpcVennRad = {
  vennskap_id: string
  bruker_id: string
  visningsnavn: string
  status: "venter" | "godtatt"
  retning: "sendt" | "mottatt"
  opprettet_kl: string
}

export async function GET() {
  const innlogget = await hentBruker()
  if (!innlogget) return jsonPrivat({ melding: "Logg inn for å se venner." }, 401)

  const [{ data: profil, error: profilFeil }, { data: rader, error: vennerFeil }] = await Promise.all([
    innlogget.supabase.from("spill_profiler").select("visningsnavn, vennekode").eq("user_id", innlogget.user.id).maybeSingle(),
    innlogget.supabase.rpc("spill_mine_venner"),
  ])

  const feil = profilFeil ?? vennerFeil
  if (feil) {
    if (erDatabaseMangel(feil)) {
      return jsonPrivat({
        profil: { userId: innlogget.user.id, visningsnavn: null, vennekode: null },
        venner: [],
        foresporslerInn: [],
        foresporslerUt: [],
        databaseKlar: false,
        melding: DB_IKKE_KLAR_MELDING,
      })
    }
    return jsonPrivat({ melding: "Klarte ikke å hente vennelisten." }, 500)
  }

  const alle: VennOppforing[] = ((rader ?? []) as RpcVennRad[]).map((r) => ({
    vennskapId: r.vennskap_id,
    brukerId: r.bruker_id,
    visningsnavn: r.visningsnavn,
    status: r.status,
    retning: r.retning,
    opprettetKl: r.opprettet_kl,
  }))

  return jsonPrivat({
    profil: {
      userId: innlogget.user.id,
      visningsnavn: profil?.visningsnavn ?? null,
      vennekode: profil?.vennekode ?? null,
    },
    venner: alle.filter((v) => v.status === "godtatt"),
    foresporslerInn: alle.filter((v) => v.status === "venter" && v.retning === "mottatt"),
    foresporslerUt: alle.filter((v) => v.status === "venter" && v.retning === "sendt"),
    databaseKlar: true,
  })
}

export async function POST(request: Request) {
  if (!sameOrigin(request)) return jsonPrivat({ melding: "Ugyldig opprinnelse." }, 403)
  const innlogget = await hentBruker()
  if (!innlogget) return jsonPrivat({ melding: "Du må være innlogget." }, 401)

  let kropp: unknown
  try {
    kropp = await readJson(request, 2048)
  } catch {
    return jsonPrivat({ melding: "Ugyldig forespørsel." }, 400)
  }

  const tolket = sendSkjema.safeParse(kropp)
  if (!tolket.success) return jsonPrivat({ melding: "Skriv inn en vennekode." }, 400)

  const kode = normaliserVennekode(tolket.data.kode)
  if (!erGyldigVennekode(kode)) return jsonPrivat({ melding: "Vennekoden må ha 6 gyldige tegn." }, 400)

  const { supabase, user } = innlogget
  const { data: egenProfil, error: profilFeil } = await supabase
    .from("spill_profiler")
    .select("visningsnavn")
    .eq("user_id", user.id)
    .maybeSingle()

  if (profilFeil) {
    if (erDatabaseMangel(profilFeil)) return jsonPrivat({ melding: DB_IKKE_KLAR_MELDING }, 503)
    return jsonPrivat({ melding: "Klarte ikke å sjekke profilen din." }, 500)
  }
  if (!egenProfil?.visningsnavn) {
    return jsonPrivat({ melding: "Velg et visningsnavn først før du legger til venner." }, 400)
  }

  const { data: funnet, error: finnFeil } = await supabase.rpc("spill_finn_profil_ved_kode", { p_kode: kode })
  if (finnFeil) return jsonPrivat({ melding: "Klarte ikke å slå opp vennekoden." }, 500)
  const maal = Array.isArray(funnet) ? (funnet[0] as { bruker_id: string; visningsnavn: string } | undefined) : undefined
  if (!maal) return jsonPrivat({ melding: "Fant ingen spiller med den vennekoden." }, 404)
  if (maal.bruker_id === user.id) return jsonPrivat({ melding: "Det er din egen vennekode." }, 400)

  const { error: insertFeil } = await supabase.from("spill_vennskap").insert({
    avsender_id: user.id,
    mottaker_id: maal.bruker_id,
    status: "venter",
  })

  if (insertFeil) {
    if (insertFeil.code === "23505") {
      return jsonPrivat({ melding: `Du og ${maal.visningsnavn} er allerede venner, eller har en ventende forespørsel.` }, 409)
    }
    return jsonPrivat({ melding: "Klarte ikke å sende venneforespørsel." }, 500)
  }

  return jsonPrivat({ ok: true, visningsnavn: maal.visningsnavn }, 201)
}

export async function PATCH(request: Request) {
  if (!sameOrigin(request)) return jsonPrivat({ melding: "Ugyldig opprinnelse." }, 403)
  const innlogget = await hentBruker()
  if (!innlogget) return jsonPrivat({ melding: "Du må være innlogget." }, 401)

  let kropp: unknown
  try {
    kropp = await readJson(request, 2048)
  } catch {
    return jsonPrivat({ melding: "Ugyldig forespørsel." }, 400)
  }

  const tolket = godtaSkjema.safeParse(kropp)
  if (!tolket.success) return jsonPrivat({ melding: "Ugyldig forespørsel." }, 400)

  const { data, error } = await innlogget.supabase
    .from("spill_vennskap")
    .update({ status: "godtatt", oppdatert_kl: new Date().toISOString() })
    .eq("id", tolket.data.vennskapId)
    .eq("mottaker_id", innlogget.user.id)
    .eq("status", "venter")
    .select("id")
    .maybeSingle()

  if (error) return jsonPrivat({ melding: "Klarte ikke å godta forespørselen." }, 500)
  if (!data) return jsonPrivat({ melding: "Forespørselen finnes ikke lenger." }, 404)
  return jsonPrivat({ ok: true })
}

export async function DELETE(request: Request) {
  if (!sameOrigin(request)) return jsonPrivat({ melding: "Ugyldig opprinnelse." }, 403)
  const innlogget = await hentBruker()
  if (!innlogget) return jsonPrivat({ melding: "Du må være innlogget." }, 401)

  let kropp: unknown
  try {
    kropp = await readJson(request, 2048)
  } catch {
    return jsonPrivat({ melding: "Ugyldig forespørsel." }, 400)
  }

  const tolket = slettSkjema.safeParse(kropp)
  if (!tolket.success) return jsonPrivat({ melding: "Ugyldig forespørsel." }, 400)

  const { error } = await innlogget.supabase.from("spill_vennskap").delete().eq("id", tolket.data.vennskapId)
  if (error) return jsonPrivat({ melding: "Klarte ikke å fjerne vennskapet." }, 500)
  return jsonPrivat({ ok: true })
}

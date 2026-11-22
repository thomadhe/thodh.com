import { z } from "zod"
import { lagKode } from "@/features/spill/lib/duell/rom"
import { DUELL_SPILL, duellRomLenke, type DuellModus, type DuellSpillId, type DuellUtfordring } from "@/features/spill/lib/sosial"
import { DB_IKKE_KLAR_MELDING, erDatabaseMangel, hentBruker, jsonPrivat } from "@/features/spill/lib/server/sosial-api"
import { readJson, sameOrigin } from "@/lib/auth/validation"

const opprettSkjema = z.object({
  mottakerId: z.string().uuid(),
  spillId: z.enum(DUELL_SPILL),
  modus: z.enum(["runder", "pistol"]).optional(),
})

const svarSkjema = z.object({
  id: z.string().uuid(),
  handling: z.enum(["godta", "avsla", "avbryt"]),
})

type RpcUtfordringRad = {
  id: string
  avsender_id: string
  avsender_navn: string
  mottaker_id: string
  mottaker_navn: string
  spill_id: DuellSpillId
  modus: DuellModus
  romkode: string
  status: "venter" | "godtatt" | "avslatt" | "avbrutt"
  opprettet_kl: string
  utloper_kl: string
}

export async function GET() {
  const innlogget = await hentBruker()
  if (!innlogget) return jsonPrivat({ melding: "Logg inn for å se utfordringer." }, 401)

  const { data, error } = await innlogget.supabase.rpc("spill_mine_utfordringer")
  if (error) {
    if (erDatabaseMangel(error)) {
      return jsonPrivat({
        brukerId: innlogget.user.id,
        innkommende: [],
        utgaende: [],
        antallVentende: 0,
        databaseKlar: false,
        melding: DB_IKKE_KLAR_MELDING,
      })
    }
    return jsonPrivat({ melding: "Klarte ikke å hente utfordringer." }, 500)
  }

  const alle: DuellUtfordring[] = ((data ?? []) as RpcUtfordringRad[]).map((r) => ({
    id: r.id,
    avsenderId: r.avsender_id,
    avsenderNavn: r.avsender_navn,
    mottakerId: r.mottaker_id,
    mottakerNavn: r.mottaker_navn,
    spillId: r.spill_id,
    modus: r.modus,
    romkode: r.romkode,
    status: r.status,
    opprettetKl: r.opprettet_kl,
    utloperKl: r.utloper_kl,
  }))

  const innkommende = alle.filter((u) => u.mottakerId === innlogget.user.id)
  const utgaende = alle.filter((u) => u.avsenderId === innlogget.user.id)
  const antallVentende = innkommende.filter((u) => u.status === "venter").length

  return jsonPrivat({
    brukerId: innlogget.user.id,
    innkommende,
    utgaende,
    antallVentende,
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

  const tolket = opprettSkjema.safeParse(kropp)
  if (!tolket.success) return jsonPrivat({ melding: "Ugyldig utfordring." }, 400)

  const { mottakerId, spillId } = tolket.data
  if (mottakerId === innlogget.user.id) return jsonPrivat({ melding: "Du kan ikke utfordre deg selv." }, 400)
  const modus: DuellModus = spillId === "67-stegern" && tolket.data.modus === "pistol" ? "pistol" : "runder"
  const romkode = lagKode()

  const { data, error } = await innlogget.supabase
    .from("spill_duell_utfordringer")
    .insert({
      avsender_id: innlogget.user.id,
      mottaker_id: mottakerId,
      spill_id: spillId,
      modus,
      romkode,
    })
    .select("id, spill_id, modus, romkode, status, opprettet_kl, utloper_kl")
    .single()

  if (error || !data) {
    if (erDatabaseMangel(error)) return jsonPrivat({ melding: DB_IKKE_KLAR_MELDING }, 503)
    if (error?.code === "42501") {
      return jsonPrivat({ melding: "Du kan bare utfordre godkjente venner." }, 403)
    }
    return jsonPrivat({ melding: "Klarte ikke å opprette utfordringen." }, 500)
  }

  return jsonPrivat(
    {
      utfordring: {
        id: data.id,
        spillId: data.spill_id as DuellSpillId,
        modus: data.modus as DuellModus,
        romkode: data.romkode as string,
        status: data.status,
      },
      lenke: duellRomLenke(spillId, romkode, modus),
    },
    201,
  )
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

  const tolket = svarSkjema.safeParse(kropp)
  if (!tolket.success) return jsonPrivat({ melding: "Ugyldig forespørsel." }, 400)

  const { id, handling } = tolket.data
  const nyStatus = handling === "godta" ? "godtatt" : handling === "avsla" ? "avslatt" : "avbrutt"
  const kolonne = handling === "avbryt" ? "avsender_id" : "mottaker_id"

  const { data, error } = await innlogget.supabase
    .from("spill_duell_utfordringer")
    .update({ status: nyStatus, oppdatert_kl: new Date().toISOString() })
    .eq("id", id)
    .eq(kolonne, innlogget.user.id)
    .eq("status", "venter")
    .select("id, spill_id, modus, romkode, avsender_id, mottaker_id")
    .maybeSingle()

  if (error) return jsonPrivat({ melding: "Klarte ikke å oppdatere utfordringen." }, 500)
  if (!data) return jsonPrivat({ melding: "Utfordringen er ikke lenger aktiv." }, 404)

  const lenke =
    nyStatus === "godtatt" ? duellRomLenke(data.spill_id as DuellSpillId, data.romkode as string, data.modus as DuellModus) : undefined

  return jsonPrivat({
    ok: true,
    lenke,
    avsenderId: data.avsender_id,
    mottakerId: data.mottaker_id,
  })
}

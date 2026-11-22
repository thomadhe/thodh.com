"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import type { ProfilInfo } from "../lib/sosial"
import { VisningsnavnSkjema } from "./spill-sosial-ramme"

/** Display-name & friend-code section embedded on /konto (light theme). */
export function KontoSpillProfil() {
  const [profil, setProfil] = useState<ProfilInfo | null>(null)
  const [laster, setLaster] = useState(true)

  useEffect(() => {
    let aktiv = true
    void fetch("/spill/api/profil", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { profil?: ProfilInfo | null } | null) => {
        if (aktiv && d?.profil) setProfil(d.profil)
      })
      .catch(() => undefined)
      .finally(() => {
        if (aktiv) setLaster(false)
      })
    return () => {
      aktiv = false
    }
  }, [])

  return (
    <section className="mt-8 rounded-2xl border border-neutral-200 bg-white p-5">
      <h2 className="text-base font-semibold text-neutral-900">Visningsnavn i spill</h2>
      <p className="mt-1 text-sm leading-6 text-neutral-600">
        Dette navnet vises på ledertavler og i vennelister på thodh.com/spill. E-postadressen din vises aldri til andre.
      </p>
      <div className="mt-4">
        {laster ? (
          <div className="h-10 animate-pulse rounded-xl bg-neutral-100" />
        ) : (
          <VisningsnavnSkjema profil={profil} onLagret={setProfil} tema="lys" />
        )}
      </div>
      <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 border-t border-neutral-100 pt-3 text-sm font-medium text-neutral-700">
        <Link href="/spill/historikk" className="hover:text-neutral-950 hover:underline">
          Historikk →
        </Link>
        <Link href="/spill/ledertavle" className="hover:text-neutral-950 hover:underline">
          Ledertavle →
        </Link>
        <Link href="/spill/venner" className="hover:text-neutral-950 hover:underline">
          Venner →
        </Link>
        <Link href="/spill/dueller" className="hover:text-neutral-950 hover:underline">
          Dueller →
        </Link>
      </div>
    </section>
  )
}

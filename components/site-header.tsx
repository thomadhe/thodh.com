"use client"

import Link from "next/link"
import { SprakKnapp } from "@/components/sprak-knapp"
import { useT } from "@/lib/sprak"

export function SiteHeader({
  actionHref,
  actionLabel,
  actionLabelEn,
}: {
  actionHref: string
  actionLabel: string
  actionLabelEn?: string
}) {
  const t = useT()
  return (
    <header className="flex items-center justify-between border-b border-black/5 py-5">
      <Link
        href="/"
        className="font-mono text-xs tracking-tight text-neutral-500 transition-colors hover:text-neutral-800"
      >
        thodh.com
      </Link>
      <nav className="flex items-center gap-4 sm:gap-6" aria-label={t("Nettsted", "Site")}>
        <Link href="/konto" className="font-mono text-[11px] uppercase tracking-widest text-neutral-500 hover:text-neutral-900">
          {t("Konto", "Account")}
        </Link>
        <Link
          href={actionHref}
          className="font-mono text-[11px] uppercase tracking-widest text-neutral-400 transition-colors hover:text-neutral-700"
        >
          {t(actionLabel, actionLabelEn ?? actionLabel)}
        </Link>
        <SprakKnapp variant="lys" />
      </nav>
    </header>
  )
}

"use client"

import { CONTACT_EMAIL, shippedProjects } from "@/lib/projects"
import { Ikon } from "./ikoner"

function OsKnapp({ children, onClick, href }: { children: React.ReactNode; onClick?: () => void; href?: string }) {
  const stil = "os-knapp inline-flex min-h-[26px] min-w-[76px] items-center justify-center gap-2 px-3 text-[12px] text-black"
  if (href) {
    return (
      <a href={href} className={stil}>
        {children}
      </a>
    )
  }
  return (
    <button type="button" onClick={onClick} className={stil}>
      {children}
    </button>
  )
}

/** "About" dialog: the personal bit lives here instead of on the desktop. */
export function OmThodh({ lukk }: { lukk: () => void }) {
  return (
    <div className="flex h-full flex-col gap-4 p-4 text-[12px] text-black">
      <div className="flex gap-4">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center bg-gradient-to-b from-[#23206b] to-[#d9607a] text-2xl font-black text-white shadow-[inset_-2px_-2px_#0006,inset_2px_2px_#fff6]">
          t
        </div>
        <div className="space-y-1.5">
          <p className="text-[15px] font-bold">thodh.com 98</p>
          <p>Student. Boler. Vibekoder.</p>
          <p className="text-neutral-700">
            Når en app ligger bak en betalingsvegg, eller jeg savner noe jeg trenger – hvorfor ikke bare lage det?
          </p>
        </div>
      </div>
      <div className="os-inn space-y-1 p-2.5 text-neutral-700">
        <p>Installerte programmer: {shippedProjects.length}</p>
        <p>Lisensiert til: deg, gratis, for alltid.</p>
        <p>Lær → Bygg → Del</p>
      </div>
      <div className="mt-auto flex justify-end gap-2">
        <OsKnapp href={`mailto:${CONTACT_EMAIL}`}>Kontakt…</OsKnapp>
        <OsKnapp onClick={lukk}>OK</OsKnapp>
      </div>
    </div>
  )
}

export function Papirkurv() {
  return (
    <div className="flex h-full items-center gap-4 p-5 text-[12px] text-black">
      <Ikon navn="papirkurv" storrelse={40} className="shrink-0" />
      <p>Papirkurven er tom. Alle dårlige ideer ble shippet likevel.</p>
    </div>
  )
}

export function Side({ href, aktiv }: { href: string; aktiv: boolean }) {
  return (
    <div className="relative h-full bg-white">
      <iframe src={href} title={href} className="h-full w-full border-0" />
      {/* Clicks inside an iframe never reach this page, so an inactive window gets a click shield to focus it. */}
      {!aktiv ? <div className="absolute inset-0" /> : null}
    </div>
  )
}

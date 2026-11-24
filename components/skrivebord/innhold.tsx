"use client"

import { CONTACT_EMAIL, shippedProjects } from "@/lib/projects"
import { useT } from "@/lib/sprak"
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
  const t = useT()
  return (
    <div className="flex h-full flex-col gap-4 p-4 text-[12px] text-black">
      <div className="flex gap-4">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center bg-gradient-to-b from-[var(--os-tittel)] to-[var(--os-tittel-2)] text-2xl font-black text-white shadow-[inset_-2px_-2px_#0006,inset_2px_2px_#fff6]">
          t
        </div>
        <div className="space-y-1.5">
          <p className="text-[15px] font-bold">thodh.com 98</p>
          <p>{t("Student. Boler. Vibekoder.", "Student. Lifter. Vibecoder.")}</p>
          <p className="text-neutral-700">
            {t(
              "Når en app ligger bak en betalingsvegg, eller jeg savner noe jeg trenger – hvorfor ikke bare lage det?",
              "When an app is behind a paywall, or I'm missing something I need — why not just build it?",
            )}
          </p>
        </div>
      </div>
      <div className="os-inn space-y-1 p-2.5 text-neutral-700">
        <p>{t("Installerte programmer", "Installed programs")}: {shippedProjects.length}</p>
        <p>{t("Lisensiert til: deg, gratis, for alltid.", "Licensed to: you, free, forever.")}</p>
        <p>{t("Lær → Bygg → Del", "Learn → Build → Share")}</p>
      </div>
      <div className="mt-auto flex justify-end gap-2">
        <OsKnapp href={`mailto:${CONTACT_EMAIL}`}>{t("Kontakt…", "Contact…")}</OsKnapp>
        <OsKnapp onClick={lukk}>OK</OsKnapp>
      </div>
    </div>
  )
}

export function Papirkurv() {
  const t = useT()
  return (
    <div className="flex h-full items-center gap-4 p-5 text-[12px] text-black">
      <Ikon navn="papirkurv" storrelse={40} className="shrink-0" />
      <p>
        {t(
          "Papirkurven er tom. Alle dårlige ideer ble shippet likevel.",
          "The Recycle Bin is empty. All bad ideas were shipped anyway.",
        )}
      </p>
    </div>
  )
}

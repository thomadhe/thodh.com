import type { Metadata } from "next"
import { BouncingApps } from "@/components/bouncing-apps"
import { SiteHeader } from "@/components/site-header"
import { CONTACT_EMAIL } from "@/lib/projects"

export const metadata: Metadata = {
  title: "Kontakt",
  description: "Si hei til Thomas.",
}

function MailIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m3 7 9 6 9-6" />
    </svg>
  )
}

export default function KontaktPage() {
  return (
    <div className="page-grid flex min-h-full flex-col">
      <div className="mx-auto flex min-h-full w-full max-w-lg flex-1 flex-col px-5 sm:px-6">
        <SiteHeader actionHref="/" actionLabel="Hub" />

        <main className="flex flex-1 flex-col pt-12">
          <section className="flex flex-1 flex-col items-center text-center">
            <p className="font-mono text-[11px] font-medium uppercase tracking-[0.22em] text-emerald-700/80">
              Kontakt
            </p>
            <h1 className="mt-4 max-w-sm text-[2rem] font-semibold leading-[1.15] tracking-tight text-neutral-950 sm:text-[2.2rem]">
              Si hei
            </h1>
            <p className="mt-5 max-w-md font-mono text-[13px] leading-7 text-neutral-500">
              Send en e-post hvis du vil snakke.
            </p>

            <div className="relative mt-8 min-h-[320px] w-full flex-1">
              <BouncingApps />
            </div>

            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="mt-4 mb-8 inline-flex h-12 w-full max-w-md items-center justify-center gap-2 rounded-2xl bg-neutral-950 text-sm font-medium text-white transition-colors hover:bg-neutral-800"
            >
              <MailIcon />
              Kontakt meg
            </a>
          </section>
        </main>
      </div>
    </div>
  )
}

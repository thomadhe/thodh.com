import type { Metadata } from "next"
import { BouncingApps } from "@/components/bouncing-apps"
import { ContactButton } from "@/components/contact-button"
import { SiteHeader } from "@/components/site-header"

export const metadata: Metadata = {
  title: "Kontakt",
  description: "Send en e-post til Thomas på thodhel@gmail.com.",
}

export default function KontaktPage() {
  return (
    <div className="page-grid flex min-h-full flex-col">
      <div className="mx-auto flex min-h-full w-full max-w-lg flex-1 flex-col px-5 sm:px-6">
        <SiteHeader actionHref="/" actionLabel="Hub" />

        <main className="flex flex-1 flex-col pt-12">
          <section className="flex flex-1 flex-col items-center text-center">
            <h1 className="max-w-sm text-[2rem] font-semibold leading-[1.15] tracking-tight text-neutral-950 sm:text-[2.2rem]">
              Si hei
            </h1>
            <p className="mt-5 max-w-md font-mono text-[13px] leading-7 text-neutral-500">
              Send en e-post hvis du vil snakke.
            </p>

            <div className="relative mt-8 min-h-[280px] w-full flex-1">
              <BouncingApps />
            </div>

            <ContactButton className="mt-4 mb-8" />
          </section>
        </main>
      </div>
    </div>
  )
}

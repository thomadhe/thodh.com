import { BouncingApps } from "@/components/bouncing-apps"
import { ProjectCard } from "@/components/project-card"
import { SiteHeader } from "@/components/site-header"
import {
  buildingProjects,
  CONTACT_EMAIL,
  shippedProjects,
} from "@/lib/projects"

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

export default function Home() {
  return (
    <div className="page-grid min-h-full">
      <div className="mx-auto flex min-h-full w-full max-w-lg flex-col px-5 sm:px-6">
        <SiteHeader actionHref="/kontakt" actionLabel="Kontakt" />

        <main className="flex flex-1 flex-col gap-16 py-14 sm:py-16">
          <section className="flex flex-col items-center text-center">
            <p className="font-mono text-[11px] font-medium uppercase tracking-[0.22em] text-emerald-700/80">
              Om meg
            </p>
            <h1 className="mt-4 max-w-sm text-[2rem] font-semibold leading-[1.15] tracking-tight text-neutral-950 sm:text-[2.35rem]">
              Thomas bygger nyttige ting
            </h1>
            <p className="mt-6 max-w-md font-mono text-[13px] leading-7 text-neutral-500">
              Student på NTNU. Viber litt på fritiden, ta en titt på hva
              jeg har lagd :)
            </p>
            <div className="relative mt-8 h-[300px] w-full">
              <BouncingApps />
            </div>
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="mt-2 inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-neutral-950 text-sm font-medium text-white transition-colors hover:bg-neutral-800"
            >
              <MailIcon />
              Kontakt meg
            </a>
          </section>

          <section>
            <div className="mb-4">
              <p className="font-mono text-[11px] font-medium uppercase tracking-[0.22em] text-neutral-400">
                Shipped
              </p>
              <h2 className="mt-2 text-xl font-semibold tracking-tight text-neutral-950">
                Ute nå
              </h2>
            </div>

            <div className="overflow-hidden rounded-3xl border border-black/5 bg-white">
              {shippedProjects.map((project) => (
                <ProjectCard key={project.id} project={project} />
              ))}
            </div>
          </section>

          <section>
            <div className="mb-4">
              <p className="font-mono text-[11px] font-medium uppercase tracking-[0.22em] text-neutral-400">
                Building
              </p>
              <h2 className="mt-2 text-xl font-semibold tracking-tight text-neutral-950">
                Under arbeid
              </h2>
            </div>

            <div className="overflow-hidden rounded-3xl border border-black/5 bg-white">
              {buildingProjects.map((project, i) => (
                <div key={project.id}>
                  {i > 0 ? <div className="h-px bg-black/5" /> : null}
                  <ProjectCard project={project} />
                </div>
              ))}
            </div>
          </section>
        </main>

        <footer className="border-t border-black/5 py-8">
          <p className="text-center font-mono text-[11px] uppercase tracking-[0.18em] text-neutral-400">
            Lær → Bygg → Del
          </p>
        </footer>
      </div>
    </div>
  )
}

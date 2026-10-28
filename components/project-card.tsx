import { Badge, IndexMark } from "@/components/badge"
import { LiveDuration } from "@/components/live-duration"
import { formatStarted, type Project } from "@/lib/projects"

export function ProjectCard({ project }: { project: Project }) {
  const external = project.href?.startsWith("https://") ?? false
  const barColor =
    project.status === "shipped" ? "bg-emerald-500" : "bg-blue-500"

  return (
    <article className="p-5 sm:p-6">
      <div className="flex items-start gap-3.5">
        <IndexMark n={project.index} />
        <div className="min-w-0 flex-1 pt-0.5">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            {project.href ? (
              <a
                href={project.href}
                target={external ? "_blank" : undefined}
                rel={external ? "noopener noreferrer" : undefined}
                className="text-[15px] font-semibold tracking-tight text-neutral-950 transition-colors hover:text-neutral-600"
              >
                {project.name}
                <span aria-hidden="true" className="ml-1.5 inline-block text-neutral-400">
                  {external ? "↗" : "→"}
                </span>
              </a>
            ) : (
              <h3 className="text-[15px] font-semibold tracking-tight text-neutral-950">
                {project.name}
              </h3>
            )}
            <Badge variant={project.status}>
              {project.status === "shipped" ? "Shipped" : "Building"}
            </Badge>
          </div>
          <p className="mt-1.5 text-sm leading-6 text-neutral-500">
            {project.description}
          </p>
          <p className="mt-3 font-mono text-[11px] text-neutral-400">
            {project.status === "building"
              ? `${project.category} · Startet ${formatStarted(project.startedAt)}`
              : project.category}
          </p>

          {project.status === "building" ? (
            <div className="mt-5 grid grid-cols-2 gap-4">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-neutral-400">
                  Building time
                </p>
                <p className="mt-1.5 text-[15px] font-semibold tracking-tight text-neutral-950">
                  <LiveDuration startedAt={project.startedAt} />
                </p>
                <p className="mt-1 font-mono text-[10px] text-neutral-400">
                  Teller live
                </p>
              </div>
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-neutral-400">
                  Completed
                </p>
                <p className="mt-1.5 text-[15px] font-semibold tracking-tight text-neutral-950">
                  {project.progress}%
                </p>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-neutral-100">
                  <div
                    className={`h-full rounded-full ${barColor}`}
                    style={{ width: `${project.progress}%` }}
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="mt-5">
              <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-neutral-400">
                Completed
              </p>
              <p className="mt-1.5 text-[15px] font-semibold tracking-tight text-neutral-950">
                {project.progress}%
              </p>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-neutral-100">
                <div
                  className={`h-full rounded-full ${barColor}`}
                  style={{ width: `${project.progress}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </article>
  )
}

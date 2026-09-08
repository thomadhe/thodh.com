import type { ReactNode } from "react"
import type { ProjectStatus } from "@/lib/projects"

export function Badge({
  variant,
  children,
}: {
  variant: ProjectStatus
  children: ReactNode
}) {
  const styles =
    variant === "shipped"
      ? "bg-emerald-50 text-emerald-700"
      : "bg-stone-100 text-stone-600"
  const dot = variant === "shipped" ? "bg-emerald-500" : "bg-stone-400"

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-mono text-[10px] font-medium uppercase tracking-wider ${styles}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
      {children}
    </span>
  )
}

export function IndexMark({ n }: { n: string }) {
  return (
    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-neutral-900 font-mono text-xs font-medium text-white">
      {n}
    </span>
  )
}

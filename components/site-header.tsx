import Link from "next/link"

export function SiteHeader({
  actionHref,
  actionLabel,
}: {
  actionHref: string
  actionLabel: string
}) {
  return (
    <header className="flex items-center justify-between border-b border-black/5 py-5">
      <Link
        href="/"
        className="font-mono text-xs tracking-tight text-neutral-500 transition-colors hover:text-neutral-800"
      >
        thodh.com
      </Link>
      <Link
        href={actionHref}
        className="font-mono text-[11px] uppercase tracking-widest text-neutral-400 transition-colors hover:text-neutral-700"
      >
        {actionLabel}
      </Link>
    </header>
  )
}

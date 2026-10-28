import { CONTACT_EMAIL } from "@/lib/projects"

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

export function ContactButton({ className = "" }: { className?: string }) {
  const href = `mailto:${CONTACT_EMAIL}`

  return (
    <div className={`relative z-10 w-full max-w-md ${className}`}>
      <a
        href={href}
        className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-neutral-950 text-sm font-medium text-white transition-colors hover:bg-neutral-800"
      >
        <MailIcon />
        Kontakt meg
      </a>
      <a
        href={href}
        className="mt-2 block text-center font-mono text-[12px] text-neutral-400 transition-colors hover:text-neutral-700"
      >
        {CONTACT_EMAIL}
      </a>
    </div>
  )
}

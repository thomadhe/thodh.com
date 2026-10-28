export type ProjectStatus = "shipped" | "building";

export type Project = {
  id: string
  name: string
  href?: string
  description: string
  category: string
  status: ProjectStatus
  startedAt: string
  progress: number
  index: string
}

export type BounceApp = {
  id: string
  label: string
  letter: string
  className: string
  logo?: string
}

export const shippedProjects: Project[] = [
  {
    id: "karrierepiloten",
    name: "Karrierepiloten.com",
    href: "https://karrierepiloten.com",
    description:
      "En AI-jobbsøker som finner jobber og skriver søknaden for deg.",
    category: "Web app · AI",
    status: "shipped",
    startedAt: "2026-08-25T09:30:00+02:00",
    progress: 100,
    index: "1",
  },
  {
    id: "sjakk",
    name: "Sjakk for 2;)",
    href: "/sjakk",
    description: "Spill sammen eller inviter en venn på nett. Egne klokker, lek og trening.",
    category: "Web app · Spill",
    status: "shipped",
    startedAt: "2026-09-16T18:18:33+02:00",
    progress: 100,
    index: "2",
  },
  {
    id: "spill",
    name: "Dagens spill",
    href: "/spill",
    description: "Fire daglige minispill: Mer eller mindre, Anelsesløs, Stavebien og Sangløs.",
    category: "Web app · Spill",
    status: "shipped",
    startedAt: "2026-10-28T13:00:00+01:00",
    progress: 100,
    index: "3",
  },
]

export const buildingProjects: Project[] = [
  {
    id: "focusfish",
    name: "Focusfish",
    description: "En gamifisert pomodoro-app.",
    category: "App · Fokus",
    status: "building",
    startedAt: "2026-09-08T02:30:00+02:00",
    progress: 16,
    index: "1",
  },
  {
    id: "otsjoba",
    name: "Otsjoba",
    href: "/otsjoba",
    description: "Øv på italiensk og russisk med veiledede samtaler og ordtrening.",
    category: "Web app · Språk",
    status: "building",
    startedAt: "2026-09-01T10:00:00+02:00",
    progress: 38,
    index: "2",
  },
]

export const bounceApps: BounceApp[] = [
  {
    id: "karrierepiloten",
    label: "Karrierepiloten",
    letter: "K",
    className: "bg-[#f3efe6] text-neutral-900",
    logo: "/logos/karrierepiloten.jpg",
  },
  {
    id: "focusfish",
    label: "Focusfish",
    letter: "F",
    className: "bg-[#0f4c5c] text-white",
    logo: "/logos/focusfish.svg",
  },
  {
    id: "otsjoba",
    label: "Otsjoba",
    letter: "O",
    className: "bg-[#3f5c45] text-white",
    logo: "/logos/spraklarer.svg",
  },
  {
    id: "sjakk",
    label: "Sjakk for 2;)",
    letter: "♞",
    className: "bg-[#171318] text-[#eadbbd]",
    logo: "/sjakk/favicon.svg",
  },
  {
    id: "spill",
    label: "Dagens spill",
    letter: "⇅",
    className: "bg-emerald-600 text-white",
  },
]

export const CONTACT_EMAIL = "thodhel@gmail.com"

export function formatStarted(iso: string) {
  return new Intl.DateTimeFormat("nb-NO", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso))
}

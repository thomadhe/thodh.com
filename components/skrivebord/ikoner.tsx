// Original 32×32 pixel-style desktop icons. Decorative; the label next to them carries the meaning.

export type IkonNavn =
  | "datamaskin"
  | "mappe"
  | "spillmappe"
  | "sjakk"
  | "brev"
  | "person"
  | "papirkurv"
  | "ball"
  | "nett"
  | "dokument"
  | "mel"
  | "anelse"
  | "bie"
  | "note"
  | "jord"
  | "form"
  | "stjerne"
  | "flagg"
  | "sok"
  | "film"

const omriss = "#111"

const tegninger: Record<IkonNavn, React.ReactNode> = {
  datamaskin: (
    <>
      <rect x="4" y="4" width="24" height="17" fill="#d6d6cf" stroke={omriss} />
      <rect x="7" y="7" width="18" height="11" fill="#1d7d78" />
      <rect x="9" y="9" width="7" height="2" fill="#bff3ee" />
      <rect x="12" y="21" width="8" height="3" fill="#a9a9a2" stroke={omriss} />
      <rect x="6" y="24" width="20" height="5" fill="#d6d6cf" stroke={omriss} />
      <rect x="20" y="26" width="4" height="1" fill="#2fbf4a" />
    </>
  ),
  mappe: (
    <>
      <path d="M3 9h10l2 2h14v16H3Z" fill="#e9c043" stroke={omriss} />
      <path d="M3 13h26v14H3Z" fill="#f7d96b" stroke={omriss} />
    </>
  ),
  spillmappe: (
    <>
      <path d="M3 9h10l2 2h14v16H3Z" fill="#e9c043" stroke={omriss} />
      <path d="M3 13h26v14H3Z" fill="#f7d96b" stroke={omriss} />
      <path d="M11 15l4 4h-2.5v4h-3v-4H7Z" fill="#16a34a" />
      <path d="M21 25l-4-4h2.5v-4h3v4H25Z" fill="#e11d48" />
    </>
  ),
  sjakk: (
    <>
      <path
        d="M11 27h12v-3l-2-2c0-4 1-6 3-8l-2-6-4-2-3 2-4 6 2 2 3-2c0 3-2 5-4 7l-1 3Z"
        fill="#f5f5f0"
        stroke={omriss}
        strokeLinejoin="round"
      />
      <rect x="9" y="27" width="16" height="2" fill="#5b5b55" stroke={omriss} />
      <rect x="16" y="9" width="2" height="2" fill={omriss} />
    </>
  ),
  brev: (
    <>
      <rect x="3" y="8" width="26" height="17" fill="#fbfbf6" stroke={omriss} />
      <path d="M3 8l13 10L29 8" fill="none" stroke={omriss} />
      <rect x="22" y="10" width="5" height="5" fill="#e11d48" />
    </>
  ),
  person: (
    <>
      <circle cx="16" cy="11" r="6" fill="#f2c79b" stroke={omriss} />
      <path d="M5 29c1-7 6-10 11-10s10 3 11 10Z" fill="#3d6fd1" stroke={omriss} />
    </>
  ),
  papirkurv: (
    <>
      <path d="M8 9h16l-2 20H10Z" fill="#c9d4d8" stroke={omriss} />
      <rect x="6" y="6" width="20" height="3" fill="#e3eaec" stroke={omriss} />
      <path d="M12 12l1 14M16 12v14M20 12l-1 14" stroke="#7d8a8f" />
    </>
  ),
  ball: (
    <>
      <circle cx="16" cy="16" r="12" fill="#f43f5e" stroke={omriss} />
      <path d="M5 13c7 3 15 3 22 0M7 22c6-2 12-2 18 0" fill="none" stroke="#fde68a" strokeWidth="2" />
      <circle cx="12" cy="10" r="2" fill="#fff" opacity=".7" />
    </>
  ),
  nett: (
    <>
      <circle cx="16" cy="16" r="12" fill="#3d8fd1" stroke={omriss} />
      <path d="M9 9c3 2 4 5 2 8s1 6 4 7M19 5c-1 3 1 5 4 5s3 4 2 6" fill="none" stroke="#7ee08a" strokeWidth="3" />
      <ellipse cx="16" cy="16" rx="12" ry="12" fill="none" stroke={omriss} />
    </>
  ),
  dokument: (
    <>
      <path d="M7 3h13l6 6v20H7Z" fill="#fbfbf6" stroke={omriss} />
      <path d="M20 3v6h6" fill="#d6d6cf" stroke={omriss} />
      <path d="M10 13h12M10 17h12M10 21h9" stroke="#5b5b55" />
    </>
  ),
  mel: (
    <>
      <rect x="3" y="3" width="26" height="26" rx="3" fill="#2b2d31" stroke={omriss} />
      <path d="M11 6l6 7h-4v11H9V13H5Z" fill="#34d399" />
      <path d="M21 26l-6-7h4V8h4v11h4Z" fill="#f43f5e" />
    </>
  ),
  anelse: (
    <>
      <rect x="3" y="3" width="26" height="26" rx="3" fill="#2b2d31" stroke={omriss} />
      <rect x="7" y="8" width="18" height="3" fill="#34d399" />
      <rect x="7" y="13" width="14" height="3" fill="#34d399" />
      <rect x="7" y="18" width="10" height="3" fill="#fcd34d" />
      <rect x="7" y="23" width="5" height="3" fill="#f43f5e" />
    </>
  ),
  bie: (
    <>
      <rect x="3" y="3" width="26" height="26" rx="3" fill="#2b2d31" stroke={omriss} />
      <path d="M10 8h12l5 8-5 8H10l-5-8Z" fill="#fde047" />
      <path d="M12 13h2l3-3v12l-3-3h-2Z" fill="#111" />
      <path d="M19 12c1.5 1 1.5 7 0 8" fill="none" stroke="#111" strokeWidth="1.5" />
    </>
  ),
  note: (
    <>
      <rect x="3" y="3" width="26" height="26" rx="3" fill="#2b2d31" stroke={omriss} />
      <path d="M13 22V9l10-2v13" fill="none" stroke="#a78bfa" strokeWidth="2.5" />
      <circle cx="11" cy="22" r="3" fill="#a78bfa" />
      <circle cx="21" cy="20" r="3" fill="#a78bfa" />
    </>
  ),
  jord: (
    <>
      <rect x="3" y="3" width="26" height="26" rx="3" fill="#2b2d31" stroke={omriss} />
      <circle cx="16" cy="16" r="9.5" fill="#22d3ee" />
      <path d="M10 10h5v3h-2v4h-4l-1.5-3ZM17 15h5l2 3-2 5h-3l-1-4ZM18 8h4l1 2h-4Z" fill="#0e7490" />
    </>
  ),
  form: (
    <>
      <rect x="3" y="3" width="26" height="26" rx="3" fill="#2b2d31" stroke={omriss} />
      <path d="M9 9l5-2 3 3 5-1 1 5-2 3 2 4-4 4-3-2-4 1-2-4-3-1 1-5Z" fill="#38bdf8" />
    </>
  ),
  stjerne: (
    <>
      <rect x="3" y="3" width="26" height="26" rx="3" fill="#2b2d31" stroke={omriss} />
      <path d="M16 6l2.6 6.4 6.9.5-5.3 4.4 1.7 6.7L16 20.3 10.1 24l1.7-6.7-5.3-4.4 6.9-.5Z" fill="#e879f9" />
    </>
  ),
  flagg: (
    <>
      <rect x="3" y="3" width="26" height="26" rx="3" fill="#2b2d31" stroke={omriss} />
      <rect x="7" y="9" width="18" height="14" fill="#f43f5e" />
      <rect x="7" y="14" width="18" height="4" fill="#fff" />
      <rect x="11" y="9" width="4" height="14" fill="#fff" />
      <rect x="16" y="9" width="9" height="5" fill="#1f2937" opacity=".85" />
      <rect x="7" y="18" width="4" height="5" fill="#1f2937" opacity=".85" />
    </>
  ),
  sok: (
    <>
      <rect x="3" y="3" width="26" height="26" rx="3" fill="#2b2d31" stroke={omriss} />
      <circle cx="14" cy="14" r="6" fill="none" stroke="#60a5fa" strokeWidth="3" />
      <path d="M18.5 18.5 24 24" stroke="#60a5fa" strokeWidth="3.5" />
    </>
  ),
  film: (
    <>
      <rect x="3" y="3" width="26" height="26" rx="3" fill="#2b2d31" stroke={omriss} />
      <rect x="7" y="11" width="18" height="12" rx="1" fill="#fb923c" />
      <path d="M7 7h18l-1.5 4H8.5Z" fill="#fdba74" />
      <circle cx="13" cy="17" r="1.6" fill="#2b2d31" />
      <circle cx="19" cy="17" r="1.6" fill="#2b2d31" />
    </>
  ),
}

export function Ikon({ navn, storrelse = 32, className = "" }: { navn: IkonNavn; storrelse?: number; className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      width={storrelse}
      height={storrelse}
      className={className}
      aria-hidden="true"
      shapeRendering="crispEdges"
    >
      {tegninger[navn]}
    </svg>
  )
}

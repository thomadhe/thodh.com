// The 6/7-stegern logo: the "six seven" meme's two palm-up hands, weighing a 6 against a 7. Pixel art on a
// 32 grid, shared by the desktop icon and the game's header tile.

/** One palm-up hand of the 6–7 gesture, sleeve on the left and fingers pointing right; palm top at row p. */
function Hand({ p }: { p: number }) {
  return (
    <>
      <rect x="4" y={p - 1} width="2" height="6" fill="#a3e635" />
      <rect x="6" y={p - 1} width="1" height="6" fill="#f4f4f5" />
      <path
        d={`M8 ${p - 3}h2v3H7v-1h1Zm-1 3h10v1H7Zm10-1h1v2h-1ZM7 ${p + 1}h5v1H7Zm0 1h10v1H7Zm0 1h5v1H7Zm1 1h8v1H8Z`}
        fill="#fcc21b"
      />
      <path d={`M12 ${p + 1}h5v1h-5Zm0 2h4v1h-4Zm-3 2h5v1H9Z`} fill="#c27c0e" />
    </>
  )
}

/** The 6–7 logo: two palm-up hands weighing a 6 against a 7, the left one up. Drawn on a 32 grid, inside 4–28. */
export function SeksSjuHender() {
  return (
    <>
      <Hand p={14} />
      <g transform="matrix(-1 0 0 1 32 0)">
        <Hand p={20} />
      </g>
      <path d="M10 4h5v2h-5ZM9 5h2v8H9Zm1 3h4v2h-4Zm3 1h2v4h-2Zm-3 3h4v2h-4ZM17 10h6v2h-6Zm4 2h2v2h-2Zm-1 2h2v2h-2Zm-1 2h2v4h-2Z" fill="#f4f4f5" />
    </>
  )
}

/** The logo on its own, for the header tile: the hands fill the box, no tile of their own. */
export function StegernLogo({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="3 3 26 26" className={className} aria-hidden="true" shapeRendering="crispEdges">
      <SeksSjuHender />
    </svg>
  )
}

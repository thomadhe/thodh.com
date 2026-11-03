// Shown at once when a game opens, while its page renders on the server. Prefetched with the link.
export default function Loading() {
  return (
    <div className="spill-mork min-h-dvh" aria-busy="true">
      <div className="mx-auto w-full max-w-lg px-4 pt-6 sm:px-6">
        <div className="h-8 w-40 animate-pulse rounded-xl bg-white/5" />
        <div className="mt-8 h-72 animate-pulse rounded-3xl bg-white/5" />
      </div>
    </div>
  )
}

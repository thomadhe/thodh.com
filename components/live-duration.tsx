"use client"

import { useEffect, useRef } from "react"

function pad(n: number, size = 2) {
  return n.toString().padStart(size, "0")
}

export function formatDuration(ms: number) {
  const safe = Math.max(0, ms)
  const d = Math.floor(safe / 86_400_000)
  const h = Math.floor((safe % 86_400_000) / 3_600_000)
  const m = Math.floor((safe % 3_600_000) / 60_000)
  const s = Math.floor((safe % 60_000) / 1000)
  return `${d}d ${h}h ${m}m ${pad(s)}s`
}

export function LiveDuration({ startedAt }: { startedAt: string }) {
  const ref = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const start = new Date(startedAt).getTime()
    const tick = () => {
      if (ref.current) {
        ref.current.textContent = formatDuration(Date.now() - start)
      }
    }

    tick()
    const id = window.setInterval(tick, 250)
    return () => window.clearInterval(id)
  }, [startedAt])

  return <span ref={ref} className="tabular-nums">--d --h --m --s</span>
}

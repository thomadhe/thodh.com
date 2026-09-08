"use client"

import { useEffect, useRef, useState } from "react"
import { bounceApps } from "@/lib/projects"

type Body = {
  id: string
  x: number
  y: number
  vx: number
  vy: number
  spin: number
  angle: number
  r: number
  mass: number
}

type Pointer = {
  id: number
  grabbing: Body | null
  startX: number
  startY: number
  lastX: number
  lastY: number
  lastT: number
}

const SIZE = 76
const RADIUS = SIZE / 2
const GRAVITY = 2100
const RESTITUTION = 0.68
const WALL_RESTITUTION = 0.55
const FRICTION = 0.18
const AIR = 0.996
const FLOOR_PAD = 10

function hitTest(bodies: Body[], x: number, y: number) {
  for (let i = bodies.length - 1; i >= 0; i -= 1) {
    const b = bodies[i]
    if (Math.hypot(x - b.x, y - b.y) <= b.r) return b
  }
  return null
}

function collide(a: Body, b: Body) {
  const dx = b.x - a.x
  const dy = b.y - a.y
  const dist = Math.hypot(dx, dy) || 0.0001
  const minDist = a.r + b.r
  if (dist >= minDist) return

  const nx = dx / dist
  const ny = dy / dist
  const overlap = minDist - dist
  const invA = 1 / a.mass
  const invB = 1 / b.mass
  const invSum = invA + invB

  a.x -= nx * overlap * (invA / invSum)
  a.y -= ny * overlap * (invA / invSum)
  b.x += nx * overlap * (invB / invSum)
  b.y += ny * overlap * (invB / invSum)

  const rvx = b.vx - a.vx
  const rvy = b.vy - a.vy
  const velN = rvx * nx + rvy * ny
  if (velN > 0) return

  const j = (-(1 + RESTITUTION) * velN) / invSum
  a.vx -= j * invA * nx
  a.vy -= j * invA * ny
  b.vx += j * invB * nx
  b.vy += j * invB * ny

  a.spin += (ny * a.vx - nx * a.vy) * 0.002
  b.spin -= (ny * b.vx - nx * b.vy) * 0.002
}

function kick(body: Body, originX: number, originY: number) {
  const dx = body.x - originX
  const dy = body.y - originY
  const dist = Math.hypot(dx, dy) || 1
  body.vx += (dx / dist) * (420 + Math.random() * 380) + (Math.random() - 0.5) * 220
  body.vy += (dy / dist) * 180 - (780 + Math.random() * 520)
  body.spin += (Math.random() - 0.5) * 14
}

export function BouncingApps() {
  const viewportRef = useRef<HTMLDivElement>(null)
  const bodiesRef = useRef<Body[]>([])
  const nodeRefs = useRef<Record<string, HTMLButtonElement | null>>({})
  const pointerRef = useRef<Pointer | null>(null)
  const gravityRef = useRef({ x: 0, y: GRAVITY })
  const [motionOn, setMotionOn] = useState(false)
  const [motionHint, setMotionHint] = useState(false)

  useEffect(() => {
    const root = viewportRef.current
    if (!root) return

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    let width = root.clientWidth
    let height = root.clientHeight
    let running = true
    let last = performance.now()

    const seed = () => {
      width = root.clientWidth
      height = root.clientHeight
      bodiesRef.current = bounceApps.map((app, i) => {
        const count = bounceApps.length
        const x = width * ((i + 1) / (count + 1))
        const y = height - RADIUS - FLOOR_PAD - 8 - (i % 2) * 10
        return {
          id: app.id,
          x,
          y,
          vx: (Math.random() - 0.5) * 40,
          vy: 0,
          spin: 0,
          angle: 0,
          r: RADIUS,
          mass: 1,
        }
      })
    }

    seed()
    for (const b of bodiesRef.current) {
      const el = nodeRefs.current[b.id]
      if (el) {
        el.style.transform = `translate3d(${b.x - b.r}px, ${b.y - b.r}px, 0)`
      }
    }

    const resize = () => {
      width = root.clientWidth
      height = root.clientHeight
      for (const b of bodiesRef.current) {
        b.x = Math.min(width - b.r, Math.max(b.r, b.x))
        b.y = Math.min(height - b.r - FLOOR_PAD, Math.max(b.r, b.y))
      }
    }

    const observer = new ResizeObserver(resize)
    observer.observe(root)

    const step = (dt: number) => {
      const g = gravityRef.current
      const bodies = bodiesRef.current
      const grab = pointerRef.current?.grabbing ?? null

      for (const b of bodies) {
        if (grab && grab.id === b.id) continue
        if (!reduced) {
          b.vx += g.x * dt
          b.vy += g.y * dt
          b.vx *= AIR
          b.vy *= AIR
        }
        b.x += b.vx * dt
        b.y += b.vy * dt
        b.angle += b.spin * dt
        b.spin *= 0.992

        if (b.x < b.r) {
          b.x = b.r
          b.vx = Math.abs(b.vx) * WALL_RESTITUTION
        } else if (b.x > width - b.r) {
          b.x = width - b.r
          b.vx = -Math.abs(b.vx) * WALL_RESTITUTION
        }

        if (b.y < b.r) {
          b.y = b.r
          b.vy = Math.abs(b.vy) * WALL_RESTITUTION
        } else if (b.y > height - b.r - FLOOR_PAD) {
          b.y = height - b.r - FLOOR_PAD
          b.vy = -Math.abs(b.vy) * WALL_RESTITUTION
          b.vx *= 1 - FRICTION
          b.spin *= 0.86
        }
      }

      for (let i = 0; i < bodies.length; i += 1) {
        for (let j = i + 1; j < bodies.length; j += 1) {
          collide(bodies[i], bodies[j])
        }
      }

      for (const b of bodies) {
        const el = nodeRefs.current[b.id]
        if (!el) continue
        el.style.transform = `translate3d(${b.x - b.r}px, ${b.y - b.r}px, 0) rotate(${b.angle}rad)`
      }
    }

    const loop = (now: number) => {
      if (!running) return
      const dt = Math.min(0.032, (now - last) / 1000)
      last = now
      step(dt / 2)
      step(dt / 2)
      requestAnimationFrame(loop)
    }

    const toLocal = (event: PointerEvent) => {
      const rect = root.getBoundingClientRect()
      return { x: event.clientX - rect.left, y: event.clientY - rect.top }
    }

    const onDown = (event: PointerEvent) => {
      const { x, y } = toLocal(event)
      const body = hitTest(bodiesRef.current, x, y)
      if (!body) return
      event.preventDefault()
      root.setPointerCapture(event.pointerId)
      pointerRef.current = {
        id: event.pointerId,
        grabbing: body,
        startX: x,
        startY: y,
        lastX: x,
        lastY: y,
        lastT: performance.now(),
      }
      body.vx = 0
      body.vy = 0
      body.spin = 0
    }

    const onMove = (event: PointerEvent) => {
      const pointer = pointerRef.current
      if (!pointer || pointer.id !== event.pointerId || !pointer.grabbing) return
      const { x, y } = toLocal(event)
      const now = performance.now()
      const dt = Math.max(0.008, (now - pointer.lastT) / 1000)
      const body = pointer.grabbing
      body.vx = (x - pointer.lastX) / dt
      body.vy = (y - pointer.lastY) / dt
      body.x = Math.min(width - body.r, Math.max(body.r, x))
      body.y = Math.min(height - body.r - FLOOR_PAD, Math.max(body.r, y))
      pointer.lastX = x
      pointer.lastY = y
      pointer.lastT = now
    }

    const onUp = (event: PointerEvent) => {
      const pointer = pointerRef.current
      if (!pointer || pointer.id !== event.pointerId) return
      const body = pointer.grabbing
      const { x, y } = toLocal(event)
      const wasClick =
        body && Math.hypot(x - pointer.startX, y - pointer.startY) < 10
      if (body && wasClick) {
        kick(body, x, y)
      } else if (body) {
        body.vx *= 0.9
        body.vy *= 0.9
      }
      pointerRef.current = null
    }

    root.addEventListener("pointerdown", onDown)
    root.addEventListener("pointermove", onMove)
    root.addEventListener("pointerup", onUp)
    root.addEventListener("pointercancel", onUp)

    requestAnimationFrame(loop)

    return () => {
      running = false
      observer.disconnect()
      root.removeEventListener("pointerdown", onDown)
      root.removeEventListener("pointermove", onMove)
      root.removeEventListener("pointerup", onUp)
      root.removeEventListener("pointercancel", onUp)
    }
  }, [])

  useEffect(() => {
    if (!motionOn) {
      gravityRef.current = { x: 0, y: GRAVITY }
      return
    }

    const onOrient = (event: DeviceOrientationEvent) => {
      const gamma = event.gamma ?? 0
      const beta = event.beta ?? 0
      const gx = (gamma / 45) * GRAVITY
      const gy = (beta / 45) * GRAVITY
      gravityRef.current = {
        x: Math.max(-GRAVITY, Math.min(GRAVITY, gx)),
        y: Math.max(-GRAVITY, Math.min(GRAVITY, gy + GRAVITY * 0.35)),
      }
    }

    window.addEventListener("deviceorientation", onOrient)
    return () => window.removeEventListener("deviceorientation", onOrient)
  }, [motionOn])

  async function enableMotion() {
    const DeviceMotion = window.DeviceOrientationEvent as
      | (typeof DeviceOrientationEvent & {
          requestPermission?: () => Promise<PermissionState>
        })
      | undefined

    try {
      if (DeviceMotion?.requestPermission) {
        const state = await DeviceMotion.requestPermission()
        if (state !== "granted") {
          setMotionHint(true)
          return
        }
      }
      setMotionOn(true)
      setMotionHint(false)
    } catch {
      setMotionHint(true)
    }
  }

  return (
    <div className="relative h-full min-h-[240px] w-full">
      <div
        ref={viewportRef}
        className="absolute inset-0 touch-none overflow-hidden"
      >
        {bounceApps.map((app) => (
          <button
            key={app.id}
            type="button"
            aria-label={app.label}
            ref={(node) => {
              nodeRefs.current[app.id] = node
            }}
            className={`absolute top-0 left-0 flex h-[76px] w-[76px] cursor-grab select-none items-center justify-center overflow-hidden rounded-2xl shadow-[0_10px_24px_rgba(0,0,0,0.18)] outline-none active:cursor-grabbing ${app.className}`}
            style={{ willChange: "transform" }}
          >
            {app.logo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={app.logo}
                alt=""
                draggable={false}
                className={
                  app.logo.endsWith(".svg")
                    ? "h-full w-full"
                    : "h-[84%] w-[84%] object-contain"
                }
              />
            ) : (
              <span className="text-xl font-semibold tracking-tight">
                {app.letter}
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="pointer-events-none absolute inset-x-0 top-3 flex justify-end pr-3">
        <button
          type="button"
          onClick={enableMotion}
          className="pointer-events-auto rounded-full border border-black/8 bg-white/80 px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-neutral-500 backdrop-blur-sm transition-colors hover:text-neutral-800"
        >
          {motionOn ? "Bevegelse på" : "Aktiver telefonbevegelse"}
        </button>
      </div>
      {motionHint ? (
        <p className="pointer-events-none absolute top-12 right-3 font-mono text-[10px] text-neutral-400">
          Bevegelse er ikke tilgjengelig i denne nettleseren
        </p>
      ) : null}
    </div>
  )
}

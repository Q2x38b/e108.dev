import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { play } from 'cuelume'
import { frame, ballImage, playHead, W, H, BALL_SIZE, GRASS_EDGE } from './scene'
import { useHaptics } from '../../hooks/useHaptics'

// Pixel-art water polo pool under the footer. Players swim up the pool and
// pass near one goal, then swim back and pass near the other. Draws at 30
// fps, only while on screen.
//
// The ball can be taken out of the game: click it to pick it up and it
// follows the pointer around the page; click again to throw it, and it
// bounces around the window with gravity until you catch it again. Scrolling
// the pool out of view puts the ball back.
const FPS = 30
// Still frame for reduced motion: the ball mid-pass
const STILL = 4.85
// Hit radius around the ball, in canvas pixels
const GRAB = 6

// Physics, in CSS pixels and seconds
const GRAVITY = 2600
const WALL_BOUNCE = 0.75
const FLOOR_BOUNCE = 0.62
const AIR_DRAG = 0.25 // per second
const ROLL_DRAG = 2.4 // per second while on the floor
const MAX_THROW = 4200
// Carried just below-right of the pointer so the cursor stays visible
const CARRY_X = 14
const CARRY_Y = 14

type Mode = 'scene' | 'held' | 'flying'

// Bloom around the grass. A copy of each frame is drawn to a canvas behind
// the scene and blurred with a CSS filter, which fades out gradually with no
// boundary, so it glows past the edges. The crisp scene on top fades out
// across the grass band, opaque at the deck and transparent at the outer
// edge, so the grass dissolves into that glow.
const GLOW_BLUR = 14 // CSS px

const pct = (n: number, of: number) => `${((n / of) * 100).toFixed(2)}%`

// Opaque inside the deck, fading to transparent at the grass's outer edge:
// a horizontal and a vertical ramp, intersected
const GRASS_FADE = (() => {
  const g = GRASS_EDGE
  const across = `linear-gradient(to right, transparent ${pct(g.left, W)}, #000 ${pct(g.left + g.width, W)}, #000 ${pct(g.right - g.width, W)}, transparent ${pct(g.right, W)})`
  const down = `linear-gradient(to bottom, transparent ${pct(g.top, H)}, #000 ${pct(g.top + g.width, H)}, #000 ${pct(g.bottom - g.width, H)}, transparent ${pct(g.bottom, H)})`
  return `${across}, ${down}`
})()

interface Ball {
  x: number
  y: number
  vx: number
  vy: number
  angle: number
  r: number
}

export function WaterPolo() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const glowRef = useRef<HTMLCanvasElement>(null)
  const ballRef = useRef<HTMLCanvasElement>(null)
  const haptics = useHaptics()

  // Scene state read by the render loop
  const mode = useRef<Mode>('scene')
  const hover = useRef(false)
  const ballAt = useRef<[number, number]>([0, 0])
  const redraw = useRef<() => void>(() => {})

  // Free ball state, outside React so physics never re-renders
  const ball = useRef<Ball>({ x: 0, y: 0, vx: 0, vy: 0, angle: 0, r: 10 })
  const pointer = useRef({ x: 0, y: 0 })
  const samples = useRef<{ t: number; x: number; y: number }[]>([])
  const [free, setFree] = useState(false) // mounts the floating ball
  const [size, setSize] = useState(20)

  // ── Scene loop ────────────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return

    const image = ctx.createImageData(W, H)
    const glow = glowRef.current?.getContext('2d')
    let lastT = 0
    let lastS = 0
    const draw = (time: number, s: number) => {
      lastT = time
      lastS = s
      ballAt.current = frame(image.data, time, s, {
        hideBall: mode.current !== 'scene',
        ballHover: hover.current && mode.current === 'scene',
      })
      ctx.putImageData(image, 0, 0)
      if (glow) {
        glow.clearRect(0, 0, W, H)
        glow.drawImage(canvas, 0, 0)
      }
    }
    redraw.current = () => draw(lastT, lastS)

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      draw(STILL, STILL)
      return
    }

    let raf = 0
    let visible = false
    let last = -Infinity
    const start = performance.now()
    const tick = (now: number) => {
      raf = requestAnimationFrame(tick)
      if (now - last < 1000 / FPS - 1) return
      last = now
      const t = (now - start) / 1000
      draw(t, playHead(t))
    }
    const playLoop = () => {
      if (raf || !visible || document.hidden) return
      raf = requestAnimationFrame(tick)
    }
    const pause = () => {
      cancelAnimationFrame(raf)
      raf = 0
    }

    draw(0, 0)
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting
      if (visible) playLoop()
      else pause()
    })
    observer.observe(canvas)
    const onVisibility = () => (document.hidden ? pause() : playLoop())
    document.addEventListener('visibilitychange', onVisibility)

    return () => {
      pause()
      observer.disconnect()
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [])

  // ── Picking up and putting back ───────────────────────────────────────
  const pickUp = useCallback(
    (clientX: number, clientY: number) => {
      if (mode.current === 'scene') {
        // Start exactly where the scene's ball is, at the scene's scale
        const rect = canvasRef.current!.getBoundingClientRect()
        const scale = rect.width / W
        const [bx, by] = ballAt.current
        const r = (BALL_SIZE * scale) / 2
        ball.current = {
          x: rect.left + (bx / W) * rect.width,
          y: rect.top + (by / H) * rect.height,
          vx: 0,
          vy: 0,
          angle: 0,
          r,
        }
        setSize(r * 2)
      }
      pointer.current = { x: clientX, y: clientY }
      samples.current = [{ t: performance.now(), x: clientX, y: clientY }]
      mode.current = 'held'
      hover.current = false
      setFree(true)
      redraw.current()
      haptics.selection()
      play('press')
    },
    [haptics],
  )

  const putBack = useCallback(() => {
    if (mode.current === 'scene') return
    mode.current = 'scene'
    setFree(false)
    redraw.current()
  }, [])

  // Scrolling the pool out of view returns the ball to the game
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) putBack()
    })
    observer.observe(canvas)
    return () => observer.disconnect()
  }, [putBack])

  // ── Holding, throwing and the physics loop ────────────────────────────
  useEffect(() => {
    if (!free) return
    const el = ballRef.current
    const ctx = el?.getContext('2d')
    if (!el || !ctx) return
    const img = ctx.createImageData(BALL_SIZE, BALL_SIZE)
    img.data.set(ballImage())
    ctx.putImageData(img, 0, 0)

    const onMove = (e: PointerEvent) => {
      pointer.current = { x: e.clientX, y: e.clientY }
      const now = performance.now()
      samples.current.push({ t: now, x: e.clientX, y: e.clientY })
      while (samples.current.length > 2 && now - samples.current[0].t > 120) samples.current.shift()
    }

    // While held, the next click anywhere throws, and doesn't also click
    // whatever happens to be under the pointer
    let swallowClick = false
    const onDown = (e: PointerEvent) => {
      if (mode.current !== 'held') return
      e.preventDefault()
      e.stopPropagation()
      swallowClick = true
      const now = performance.now()
      const old = samples.current.find((p) => now - p.t <= 120) ?? samples.current[0]
      const dt = Math.max(0.016, (now - old.t) / 1000)
      let vx = (pointer.current.x - old.x) / dt
      let vy = (pointer.current.y - old.y) / dt
      const speed = Math.hypot(vx, vy)
      if (speed < 250) {
        // No flick: a lob up and toward the middle of the screen
        vx = (ball.current.x < window.innerWidth / 2 ? 1 : -1) * 260
        vy = -1500
      } else if (speed > MAX_THROW) {
        vx = (vx / speed) * MAX_THROW
        vy = (vy / speed) * MAX_THROW
      }
      ball.current.vx = vx
      ball.current.vy = vy
      mode.current = 'flying'
      haptics.soft()
      play('release')
    }
    const onClick = (e: MouseEvent) => {
      if (!swallowClick) return
      swallowClick = false
      e.preventDefault()
      e.stopPropagation()
    }

    window.addEventListener('pointermove', onMove, { passive: true })
    window.addEventListener('pointerdown', onDown, { capture: true })
    window.addEventListener('click', onClick, { capture: true })

    let raf = 0
    let last = performance.now()
    let lastBounceSound = 0
    const step = (now: number) => {
      raf = requestAnimationFrame(step)
      const dt = Math.min(0.033, (now - last) / 1000)
      last = now
      const b = ball.current
      const vw = window.innerWidth
      const vh = window.innerHeight

      if (mode.current === 'held') {
        // Ease toward the carry point so picking up and fast moves feel weighty
        const k = Math.min(1, dt * 22)
        const nx = b.x + (pointer.current.x + CARRY_X - b.x) * k
        b.angle += (nx - b.x) / b.r
        b.x = nx
        b.y += (pointer.current.y + CARRY_Y - b.y) * k
      } else if (mode.current === 'flying') {
        b.vy += GRAVITY * dt
        const drag = Math.exp(-AIR_DRAG * dt)
        b.vx *= drag
        b.vy *= drag
        b.x += b.vx * dt
        b.y += b.vy * dt
        let impact = 0
        if (b.x < b.r) {
          b.x = b.r
          impact = Math.abs(b.vx)
          b.vx = Math.abs(b.vx) * WALL_BOUNCE
        } else if (b.x > vw - b.r) {
          b.x = vw - b.r
          impact = Math.abs(b.vx)
          b.vx = -Math.abs(b.vx) * WALL_BOUNCE
        }
        if (b.y < b.r) {
          b.y = b.r
          impact = Math.max(impact, Math.abs(b.vy))
          b.vy = Math.abs(b.vy) * WALL_BOUNCE
        }
        if (b.y > vh - b.r) {
          b.y = vh - b.r
          impact = Math.max(impact, Math.abs(b.vy))
          b.vy = Math.abs(b.vy) < 120 ? 0 : -Math.abs(b.vy) * FLOOR_BOUNCE
        }
        if (b.y >= vh - b.r - 0.5) {
          // Rolling along the bottom of the window
          b.vx *= Math.exp(-ROLL_DRAG * dt)
          if (Math.abs(b.vx) < 4) b.vx = 0
        }
        // Spin matches the distance travelled
        b.angle += (b.vx * dt) / b.r
        if (impact > 650 && now - lastBounceSound > 90) {
          lastBounceSound = now
          play('tick')
        }
      }

      el.style.transform = `translate3d(${b.x - b.r}px, ${b.y - b.r}px, 0) rotate(${b.angle}rad)`
    }
    raf = requestAnimationFrame(step)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerdown', onDown, { capture: true })
      window.removeEventListener('click', onClick, { capture: true })
    }
  }, [free, haptics])

  // ── Scene pointer handling ────────────────────────────────────────────
  const overSceneBall = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const cx = ((e.clientX - rect.left) / rect.width) * W
    const cy = ((e.clientY - rect.top) / rect.height) * H
    const [bx, by] = ballAt.current
    return Math.hypot(cx - bx, cy - by) <= GRAB
  }
  const onCanvasMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (mode.current !== 'scene') return
    const over = overSceneBall(e)
    if (over !== hover.current) {
      hover.current = over
      e.currentTarget.style.cursor = over ? 'grab' : ''
      redraw.current()
    }
  }
  const onCanvasLeave = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!hover.current) return
    hover.current = false
    e.currentTarget.style.cursor = ''
    redraw.current()
  }
  const onCanvasDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (mode.current !== 'scene' || !overSceneBall(e)) return
    e.preventDefault()
    e.currentTarget.style.cursor = ''
    pickUp(e.clientX, e.clientY)
  }
  // Catch the ball again while it's flying or resting
  const onBallDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (mode.current !== 'flying') return
    e.preventDefault()
    e.stopPropagation()
    pickUp(e.clientX, e.clientY)
  }

  return (
    <div className="waterpolo" aria-hidden="true">
      <div className="waterpolo-frame">
        <canvas
          ref={glowRef}
          width={W}
          height={H}
          className="waterpolo-glow"
          style={{ filter: `blur(${GLOW_BLUR}px)` }}
        />
        <canvas
          ref={canvasRef}
          width={W}
          height={H}
          className="waterpolo-canvas"
          style={{
            maskImage: GRASS_FADE,
            WebkitMaskImage: GRASS_FADE,
            maskComposite: 'intersect',
            WebkitMaskComposite: 'source-in',
          }}
          onPointerMove={onCanvasMove}
          onPointerLeave={onCanvasLeave}
          onPointerDown={onCanvasDown}
        />
      </div>
      {free &&
        createPortal(
          <canvas
            ref={ballRef}
            width={BALL_SIZE}
            height={BALL_SIZE}
            className="waterpolo-free-ball"
            style={{ width: size, height: size }}
            onPointerDown={onBallDown}
          />,
          document.body,
        )}
    </div>
  )
}

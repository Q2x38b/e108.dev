/* eslint-disable react-refresh/only-export-components -- vendored from interior.dev; exports its hook beside the component by design */
// Skeleton → content crossfade, from interior.dev (skeleton-swap).
// Adapted for this site: imports from framer-motion (already a dependency),
// colours come from the site's CSS tokens instead of Tailwind's stone
// palette, and the box grows with its content rather than scrolling.
import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'

const CROSSFADE = {
  type: 'spring',
  stiffness: 260,
  damping: 34,
  mass: 0.8,
} as const

const WIDTHS = [100, 93, 97, 88, 95, 91] as const

function widthFor(index: number, total: number) {
  if (total > 1 && index === total - 1) return 62
  return WIDTHS[(index * 7 + 3) % WIDTHS.length]
}

export type UseSkeletonSwapOptions = {
  ready: boolean
  delay?: number
  minVisible?: number
}

// The skeleton only appears if loading outlasts `delay`, and once shown it
// stays for at least `minVisible` so it never flickers.
export function useSkeletonSwap({
  ready,
  delay = 120,
  minVisible = 380,
}: UseSkeletonSwapOptions) {
  const [visible, setVisible] = useState(false)
  const shownAt = useRef(0)

  useEffect(() => {
    if (!ready) {
      if (visible) return
      const t = setTimeout(() => {
        shownAt.current = performance.now()
        setVisible(true)
      }, delay)
      return () => clearTimeout(t)
    }

    if (!visible) return
    const rest = Math.max(0, minVisible - (performance.now() - shownAt.current))
    const t = setTimeout(() => setVisible(false), rest)
    return () => clearTimeout(t)
  }, [ready, visible, delay, minVisible])

  return { showSkeleton: visible, busy: !ready }
}

export type SkeletonSwapProps = {
  ready: boolean
  children: React.ReactNode
  lines?: number
  lineHeight?: number
  barHeight?: number
  reserve?: number
  delay?: number
  minVisible?: number
  label?: string
  skeleton?: React.ReactNode
  className?: string
}

export function SkeletonSwap({
  ready,
  children,
  lines = 3,
  lineHeight = 21,
  barHeight = 9,
  reserve,
  delay = 120,
  minVisible = 380,
  label,
  skeleton,
  className = '',
}: SkeletonSwapProps) {
  const { showSkeleton } = useSkeletonSwap({ ready, delay, minVisible })
  const reduced = useReducedMotion()

  const box = reserve ?? lines * lineHeight

  return (
    <div
      aria-busy={!ready}
      aria-label={label}
      style={{ minHeight: box }}
      className={`relative grid ${className}`}
    >
      <motion.div
        className="col-start-1 row-start-1 min-w-0"
        initial={false}
        animate={
          reduced
            ? { opacity: showSkeleton ? 0 : 1 }
            : {
                opacity: showSkeleton ? 0 : 1,
                scale: showSkeleton ? 0.99 : 1,
                filter: showSkeleton ? 'blur(4px)' : 'blur(0px)',
              }
        }
        transition={reduced ? { duration: 0 } : CROSSFADE}
        style={{
          transformOrigin: 'top left',
          pointerEvents: showSkeleton ? 'none' : undefined,
        }}
      >
        {children}
      </motion.div>

      <AnimatePresence initial={false}>
        {showSkeleton ? (
          <motion.div
            key="skeleton"
            aria-hidden
            className="pointer-events-none col-start-1 row-start-1 w-full self-start"
            initial={reduced ? { opacity: 1 } : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={reduced ? { opacity: 0 } : { opacity: 0, filter: 'blur(3px)' }}
            transition={reduced ? { duration: 0 } : CROSSFADE}
          >
            {skeleton ?? (
              <div className="w-full">
                {Array.from({ length: lines }, (_, i) => (
                  <div key={i} className="flex items-center" style={{ height: lineHeight }}>
                    <div
                      style={{
                        height: barHeight,
                        width: `${widthFor(i, lines)}%`,
                        borderRadius: 5,
                        background: 'var(--hover-bg)',
                      }}
                    />
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        ) : null}
      </AnimatePresence>

      {label ? (
        <span role="status" className="sr-only">
          {ready ? `${label} loaded` : ''}
        </span>
      ) : null}
    </div>
  )
}

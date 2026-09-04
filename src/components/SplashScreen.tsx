import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { useSplash } from '../contexts/SplashContext'

const EASE = [0.23, 1, 0.32, 1] as const

// Full-screen favicon splash. index.html paints a static twin of this the
// instant the HTML parses (before the bundle has even downloaded); this
// component takes over on mount, pixel-for-pixel, and owns the exit.
export function SplashScreen() {
  const { showSplash, finishSplash } = useSplash()

  useEffect(() => {
    document.getElementById('splash-static')?.remove()
  }, [])

  return createPortal(
    <AnimatePresence onExitComplete={finishSplash}>
      {showSplash && (
        <motion.div
          className="splash"
          initial={false}
          // The mark fades first; the frosted surface dissolves just after
          exit={{ opacity: 0, transition: { duration: 0.4, delay: 0.22, ease: EASE } }}
          aria-hidden="true"
        >
          <motion.svg
            className="splash-mark"
            viewBox="0 0 100 100"
            fill="none"
            stroke="currentColor"
            strokeWidth="14"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={false}
            exit={{ opacity: 0, scale: 0.94, filter: 'blur(6px)', transition: { duration: 0.3, ease: EASE } }}
          >
            {/* Rising Hook: the E's three bars, the lowest turning up into the J */}
            <path d="M24 28H54" />
            <path d="M24 50H54" />
            <path d="M24 72H62C70 72 76 66 76 56" />
          </motion.svg>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  )
}

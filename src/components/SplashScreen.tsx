import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { useSplash } from '../contexts/SplashContext'

const EASE = [0.23, 1, 0.32, 1] as const

// Full-screen favicon splash. index.html paints a static twin of this the
// instant the HTML parses (before the bundle has even downloaded); this
// component takes over on mount, pixel-for-pixel, and owns the exit.
export function SplashScreen() {
  const { isSplashing } = useSplash()

  useEffect(() => {
    document.getElementById('splash-static')?.remove()
  }, [])

  return createPortal(
    <AnimatePresence>
      {isSplashing && (
        <motion.div
          className="splash"
          initial={false}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.45, ease: EASE }}
          aria-hidden="true"
        >
          <motion.svg
            className="splash-mark"
            viewBox="0 0 1024 1024"
            fill="none"
            initial={false}
            exit={{ opacity: 0, scale: 1.08, filter: 'blur(8px)' }}
            transition={{ duration: 0.35, ease: EASE }}
          >
            <path
              d="M620 260H790V700C790 820 710 900 590 900H500C380 900 300 820 300 700C300 580 380 500 500 500H610"
              stroke="currentColor"
              strokeWidth="90"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </motion.svg>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  )
}

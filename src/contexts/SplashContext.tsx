import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'

// The splash holds for at least MIN_HOLD_MS after React mounts (the static
// copy in index.html has usually been showing for a while before that),
// lifts once the current page reports its data is ready, and never
// outstays MAX_HOLD_MS even if a page forgets to report.
const MIN_HOLD_MS = 1000
const MAX_HOLD_MS = 3200

interface SplashState {
  /** The overlay should be on screen (drops when the page may lift it). */
  showSplash: boolean
  /** True until the overlay has fully faded out — pages render nothing before then. */
  isSplashing: boolean
  markPageReady: () => void
  /** Called by the overlay once its exit animation has finished. */
  finishSplash: () => void
}

const SplashContext = createContext<SplashState>({
  showSplash: false,
  isSplashing: false,
  markPageReady: () => {},
  finishSplash: () => {},
})

export function SplashProvider({ children }: { children: ReactNode }) {
  const [pageReady, setPageReady] = useState(false)
  const [minElapsed, setMinElapsed] = useState(false)
  const [maxElapsed, setMaxElapsed] = useState(false)

  useEffect(() => {
    const min = window.setTimeout(() => setMinElapsed(true), MIN_HOLD_MS)
    const max = window.setTimeout(() => setMaxElapsed(true), MAX_HOLD_MS)
    return () => {
      window.clearTimeout(min)
      window.clearTimeout(max)
    }
  }, [])

  const [done, setDone] = useState(false)

  const showSplash = !((pageReady && minElapsed) || maxElapsed)
  const isSplashing = !done

  // index.html sets this class before first paint so every .stagger-in
  // holds at its first frame; dropping it once the overlay is fully gone
  // lets them all play together on a clean stage.
  useEffect(() => {
    document.documentElement.classList.toggle('is-splashing', isSplashing)
  }, [isSplashing])

  const markPageReady = useCallback(() => setPageReady(true), [])
  const finishSplash = useCallback(() => setDone(true), [])

  const value = useMemo(
    () => ({ showSplash, isSplashing, markPageReady, finishSplash }),
    [showSplash, isSplashing, markPageReady, finishSplash],
  )

  return <SplashContext.Provider value={value}>{children}</SplashContext.Provider>
}

export function useSplash() {
  return useContext(SplashContext)
}

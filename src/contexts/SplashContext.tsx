import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'

// The splash holds for at least MIN_HOLD_MS after React mounts (the static
// copy in index.html has usually been showing for a while before that),
// lifts once the current page reports its data is ready, and never
// outstays MAX_HOLD_MS even if a page forgets to report.
const MIN_HOLD_MS = 1000
const MAX_HOLD_MS = 3200

interface SplashState {
  isSplashing: boolean
  markPageReady: () => void
}

const SplashContext = createContext<SplashState>({
  isSplashing: false,
  markPageReady: () => {},
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

  const isSplashing = !((pageReady && minElapsed) || maxElapsed)

  // index.html sets this class before first paint so every .stagger-in
  // holds at its first frame; dropping it here lets them all play together
  // the moment the splash starts to lift.
  useEffect(() => {
    document.documentElement.classList.toggle('is-splashing', isSplashing)
  }, [isSplashing])

  const markPageReady = useCallback(() => setPageReady(true), [])

  const value = useMemo(() => ({ isSplashing, markPageReady }), [isSplashing, markPageReady])

  return <SplashContext.Provider value={value}>{children}</SplashContext.Provider>
}

export function useSplash() {
  return useContext(SplashContext)
}

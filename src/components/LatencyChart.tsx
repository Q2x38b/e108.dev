import { useEffect, useRef, useState } from 'react'

interface LivelinePoint {
  time: number  // Unix timestamp in SECONDS
  value: number
}

export function useThemeMode(): 'light' | 'dark' {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof document !== 'undefined') {
      return document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light'
    }
    return 'light'
  })

  useEffect(() => {
    const observer = new MutationObserver(() => {
      const newTheme = document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light'
      setTheme(newTheme)
    })

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme']
    })

    return () => observer.disconnect()
  }, [])

  return theme
}

// Get color based on latency
function getColor(latency: number): string {
  if (latency < 120) return '#22c55e' // green
  if (latency < 200) return '#f59e0b' // amber/orange
  return '#ef4444' // red
}

export function useLatency() {
  const [data, setData] = useState<LivelinePoint[]>([])
  const [currentLatency, setCurrentLatency] = useState<number>(0)
  const intervalRef = useRef<number | null>(null)

  useEffect(() => {
    const measureLatency = async () => {
      const start = performance.now()
      try {
        await fetch(`/api/ping?cb=${Date.now()}`, {
          cache: 'no-store'
        })
        const latency = Math.round(performance.now() - start)
        const point: LivelinePoint = {
          time: Math.floor(Date.now() / 1000),  // Convert to seconds
          value: latency
        }

        setData(prev => {
          const newData = [...prev, point]
          // Keep last 90 points (3 minutes at 2s intervals)
          if (newData.length > 90) {
            return newData.slice(-90)
          }
          return newData
        })
        setCurrentLatency(latency)
      } catch {
        // Network error - ignore
      }
    }

    // Initial measurement
    measureLatency()

    // Measure every 2 seconds
    intervalRef.current = window.setInterval(measureLatency, 2000)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [])

  const color = currentLatency > 0 ? getColor(currentLatency) : '#f59e0b'

  return { data, currentLatency, color }
}

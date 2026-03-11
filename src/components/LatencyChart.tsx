import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { Liveline } from 'liveline'

interface LivelinePoint {
  time: number  // Unix timestamp in SECONDS
  value: number
}

function useThemeMode(): 'light' | 'dark' {
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

export function LatencyChart() {
  const [data, setData] = useState<LivelinePoint[]>([])
  const [currentLatency, setCurrentLatency] = useState<number>(0)
  const intervalRef = useRef<number | null>(null)
  const theme = useThemeMode()

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

  // Get color based on latency
  const getColor = (latency: number): string => {
    if (latency < 100) return '#22c55e' // green
    if (latency < 200) return '#f59e0b' // amber/orange
    return '#ef4444' // red
  }

  const color = currentLatency > 0 ? getColor(currentLatency) : '#f59e0b'

  return (
    <motion.section
      className="latency-section"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
    >
      <motion.div
        className="latency-chart-container"
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, delay: 0.2, ease: 'easeOut' }}
      >
        {data.length > 0 && (
          <Liveline
            data={data}
            value={currentLatency}
            color={color}
            theme={theme}
            grid={true}
            badge={true}
            fill={true}
            pulse={true}
            scrub={true}
            momentum={true}
            showValue={true}
            window={90}
            formatValue={(v: number) => `${Math.round(v)}ms`}
            formatTime={(t: number) => {
              const date = new Date(t * 1000)
              return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
            }}
          />
        )}
      </motion.div>
    </motion.section>
  )
}

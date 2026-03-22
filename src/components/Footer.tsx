import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Liveline } from 'liveline'
import { useAuth, SignedIn } from '../contexts/AuthContext'
import { useEditMode } from '../contexts/EditModeContext'
import { useHaptics } from '../hooks/useHaptics'
import { useLatency, useThemeMode } from './LatencyChart'

function LoginModal({ onClose }: { onClose: () => void }) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState(false)
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const haptics = useHaptics()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    haptics.rigid()
    setLoading(true)
    const success = await login(password)
    if (success) {
      haptics.nudge()
      onClose()
    } else {
      haptics.buzz()
      setError(true)
      setPassword('')
    }
    setLoading(false)
  }

  return (
    <div
      className="login-modal-overlay"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="login-modal-title"
    >
      <motion.div
        className="login-modal"
        onClick={(e) => e.stopPropagation()}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.15 }}
      >
        <form onSubmit={handleSubmit}>
          <span id="login-modal-title" className="sr-only">Login</span>
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => { setPassword(e.target.value); setError(false) }}
            autoFocus
            className={error ? 'error' : ''}
            disabled={loading}
            required
            spellCheck="false"
            autoComplete="current-password"
            aria-invalid={error}
            aria-describedby={error ? 'login-error' : undefined}
          />
          {error && <span id="login-error" className="sr-only">Invalid password</span>}
          <button type="submit" disabled={loading} aria-busy={loading}>
            {loading ? '...' : 'Login'}
          </button>
        </form>
      </motion.div>
    </div>
  )
}

interface FooterProps {
  showEditControls?: boolean
  showSignature?: boolean
}

export function Footer({ showEditControls = false, showSignature = true }: FooterProps) {
  const [time, setTime] = useState(new Date())
  const [clickCount, setClickCount] = useState(0)
  const [showLogin, setShowLogin] = useState(false)
  const [showGraph, setShowGraph] = useState(false)
  const { isAuthenticated, logout } = useAuth()
  const editModeContext = useEditMode()
  const haptics = useHaptics()
  const { data, currentLatency, color } = useLatency()
  const theme = useThemeMode()
  const pingRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    if (clickCount >= 5 && !isAuthenticated) {
      setShowLogin(true)
      setClickCount(0)
    }
    const resetTimer = setTimeout(() => setClickCount(0), 2000)
    return () => clearTimeout(resetTimer)
  }, [clickCount, isAuthenticated])

  // Close popover on outside click
  useEffect(() => {
    if (!showGraph) return
    const handleClickOutside = (e: MouseEvent) => {
      if (pingRef.current && !pingRef.current.contains(e.target as Node)) {
        setShowGraph(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showGraph])

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    })
  }

  const scrollToTop = () => {
    haptics.soft()
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleLogout = async () => {
    haptics.nudge()
    await logout()
  }

  const handleToggleEditMode = () => {
    haptics.selection()
    editModeContext?.toggleEditMode()
  }

  const handlePingClick = () => {
    haptics.soft()
    setShowGraph(prev => !prev)
  }

  return (
    <>
      <footer className="footer">
        <div className="footer-bottom">
          <div className="footer-left">
            <span
              className="footer-text footer-secret"
              onClick={() => setClickCount(c => c + 1)}
            >
              © 2025
            </span>
            <span className="footer-dot">•</span>
            <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noopener noreferrer" className="footer-link">CC BY 4.0</a>
            <span className="footer-dot">•</span>
            <span className="footer-quote-inline">The only limit is yourself.</span>
          </div>
          <div className="footer-right">
            <div className="footer-ping-wrapper" ref={pingRef}>
              <button
                className="footer-ping"
                onClick={handlePingClick}
                aria-label={`Latency: ${currentLatency}ms. Click to ${showGraph ? 'hide' : 'show'} graph.`}
                aria-expanded={showGraph}
              >
                <span className="footer-ping-dot" style={{ backgroundColor: color }} />
                <span className="footer-ping-value">
                  {currentLatency > 0 ? `${currentLatency}ms` : '...'}
                </span>
              </button>

              <AnimatePresence>
                {showGraph && (
                  <motion.div
                    className="footer-ping-popover"
                    initial={{ opacity: 0, scale: 0.95, y: 8 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 8 }}
                    transition={{ duration: 0.2, ease: 'easeOut' }}
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
                        momentum={false}
                        showValue={false}
                        window={30}
                        lerpSpeed={0.15}
                        formatValue={(v: number) => `${Math.round(v)}ms`}
                        formatTime={(t: number) => {
                          const date = new Date(t * 1000)
                          return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
                        }}
                      />
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <span className="footer-time">{formatTime(time)}</span>

            {showEditControls && editModeContext && (
              <SignedIn>
                <motion.button
                  className={`edit-mode-btn ${editModeContext.isEditMode ? 'active' : ''}`}
                  onClick={handleToggleEditMode}
                  whileTap={{ scale: 0.96 }}
                  aria-label={editModeContext.isEditMode ? 'Exit edit mode' : 'Enter edit mode'}
                  aria-pressed={editModeContext.isEditMode}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </svg>
                </motion.button>
                <motion.button
                  className="logout-btn-small"
                  onClick={handleLogout}
                  whileTap={{ scale: 0.96 }}
                  aria-label="Logout"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                    <polyline points="16 17 21 12 16 7" />
                    <line x1="21" y1="12" x2="9" y2="12" />
                  </svg>
                </motion.button>
              </SignedIn>
            )}

            <button
              className="back-to-top"
              onClick={scrollToTop}
              aria-label="Back to top"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="M12 19V5M5 12l7-7 7 7" />
              </svg>
            </button>
          </div>
        </div>
        {showSignature && (
          <div className="footer-signature">
            <img src="/signature.png" alt="EJ" className="signature-img" />
          </div>
        )}
      </footer>
      <AnimatePresence>
        {showLogin && <LoginModal onClose={() => setShowLogin(false)} />}
      </AnimatePresence>
    </>
  )
}

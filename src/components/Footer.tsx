import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useAuth, SignedIn } from '../contexts/AuthContext'
import { useEditMode } from '../contexts/EditModeContext'

function LoginModal({ onClose }: { onClose: () => void }) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState(false)
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const success = await login(password)
    if (success) {
      onClose()
    } else {
      setError(true)
      setPassword('')
    }
    setLoading(false)
  }

  return (
    <div className="login-modal-overlay" onClick={onClose}>
      <motion.div
        className="login-modal"
        onClick={(e) => e.stopPropagation()}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
      >
        <form onSubmit={handleSubmit}>
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => { setPassword(e.target.value); setError(false) }}
            autoFocus
            className={error ? 'error' : ''}
            disabled={loading}
          />
          <button type="submit" disabled={loading}>
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
  const { isAuthenticated, logout } = useAuth()
  const editModeContext = useEditMode()

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

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    })
  }

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleLogout = async () => {
    await logout()
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
            <span className="footer-time">{formatTime(time)}</span>

            {showEditControls && editModeContext && (
              <SignedIn>
                <motion.button
                  className={`edit-mode-btn ${editModeContext.isEditMode ? 'active' : ''}`}
                  onClick={editModeContext.toggleEditMode}
                  whileTap={{ scale: 0.95 }}
                  title={editModeContext.isEditMode ? 'Exit edit mode' : 'Enter edit mode'}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </svg>
                </motion.button>
                <motion.button
                  className="logout-btn-small"
                  onClick={handleLogout}
                  whileTap={{ scale: 0.95 }}
                  title="Logout"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
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
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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

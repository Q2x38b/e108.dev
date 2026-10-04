import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useConvex } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { useAuth, SignedIn } from '../contexts/AuthContext'
import { useEditMode } from '../contexts/EditModeContext'
import { useHaptics } from '../hooks/useHaptics'
import { play } from 'cuelume'
import { readSoundEnabled, applySoundEnabled } from '../lib/soundPreference'
import { TooltipGroup, TooltipGroupTrigger, createTooltipGroup } from '../components/TooltipGroup'

// Tracks the cursor entry/exit point on a button so the ::before hover
// background can scale out from where the pointer arrives. Mirrors the
// helper used by the header nav buttons in Home.tsx.
// The footer's icon buttons share one tooltip that glides between them.
const footerTooltip = createTooltipGroup()

function setCursorOrigin(el: HTMLElement, e: PointerEvent) {
  const { clientX, clientY } = e
  const { top, left } = el.getBoundingClientRect()
  const x = clientX - left
  const y = clientY - top
  el.style.setProperty('--x', `${x}px`)
  el.style.setProperty('--y', `${y}px`)
}

function cursorOriginRef(el: HTMLElement | null) {
  if (!el) return
  el.addEventListener('pointerenter', (e) => setCursorOrigin(el, e))
  el.addEventListener('pointerleave', (e) => setCursorOrigin(el, e))
}

const SoundOnIcon = () => (
  <svg viewBox="0 0 18 18" fill="currentColor" aria-hidden="true">
    <path d="M11.35,1.567c-.4-.219-.889-.203-1.273,.044l-5.295,3.389H2.25c-1.241,0-2.25,1.009-2.25,2.25v3.5c0,1.241,1.009,2.25,2.25,2.25h2.531l5.295,3.389c.205,.131,.439,.198,.675,.198,.206,0,.412-.051,.599-.153,.401-.219,.65-.64,.65-1.097V2.664c0-.457-.249-.877-.65-1.097Z" />
    <path d="M14.444,7.056c-.293-.293-.769-.293-1.061,0-.293,.293-.293,.768,0,1.061,.236,.236,.366,.55,.366,.884s-.13,.647-.366,.884c-.293,.292-.293,.768,0,1.061,.146,.146,.338,.22,.53,.22s.384-.073,.53-.22c.52-.519,.806-1.209,.806-1.944s-.286-1.425-.806-1.944Z" />
    <path d="M15.329,5.111c-.293,.293-.293,.768,0,1.061,1.56,1.56,1.56,4.098,0,5.657-.293,.293-.293,.768,0,1.061,.146,.146,.338,.22,.53,.22s.384-.073,.53-.22c1.039-1.039,1.611-2.42,1.611-3.889s-.572-2.851-1.611-3.889c-.293-.293-.768-.293-1.061,0Z" />
  </svg>
)

const SoundOffIcon = () => (
  <svg viewBox="0 0 18 18" fill="currentColor" aria-hidden="true">
    <path d="M14.35,1.567c-.4-.219-.889-.203-1.273,.044l-5.295,3.389h-3.531c-1.241,0-2.25,1.009-2.25,2.25v3.5c0,1.241,1.009,2.25,2.25,2.25h3.531l5.295,3.389c.205,.131,.439,.198,.675,.198,.206,0,.412-.051,.599-.153,.401-.219,.65-.64,.65-1.097V2.664c0-.457-.249-.877-.65-1.097Z" />
  </svg>
)

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
  showQuote?: boolean
  className?: string
}

export function Footer({
  showEditControls = false,
  showSignature = true,
  showQuote = true,
  className = ''
}: FooterProps) {
  const [time, setTime] = useState(new Date())
  const [clickCount, setClickCount] = useState(0)
  const [showLogin, setShowLogin] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [soundOn, setSoundOn] = useState(readSoundEnabled)
  const { isAuthenticated, logout } = useAuth()
  const editModeContext = useEditMode()
  const haptics = useHaptics()
  const convex = useConvex()

  const handleExport = async () => {
    haptics.soft()
    setExporting(true)
    try {
      const data = await convex.query(api.content.getHomepageData)
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `portfolio-export-${new Date().toISOString().slice(0, 10)}.json`
      a.click()
      URL.revokeObjectURL(url)
    } finally {
      setExporting(false)
    }
  }

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

  const toggleSound = () => {
    const next = !soundOn
    haptics.selection()
    applySoundEnabled(next)
    setSoundOn(next)
    // Confirms unmuting audibly; muting is silent by definition
    if (next) play('toggle')
  }

  const handleToggleEditMode = () => {
    haptics.selection()
    editModeContext?.toggleEditMode()
  }

  return (
    <>
      <footer className={`footer ${className}`}>
        <div className="footer-content">
          <div className="footer-main">
            <span
              className="footer-copyright"
              onClick={() => setClickCount(c => c + 1)}
            >
              © 2025
            </span>
            <span className="footer-sep">·</span>
            <a
              href="https://creativecommons.org/licenses/by/4.0/"
              target="_blank"
              rel="noopener noreferrer"
              className="footer-link"
            >
              CC BY 4.0
            </a>
          </div>

          <div className="footer-actions">
            {showSignature && (
              <span className="footer-signature-inline" aria-label="Ethan Jerla" role="img">
                {/* Rising Hook mark, same geometry as the favicon */}
                <svg
                  className="footer-logo"
                  viewBox="0 0 100 100"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="14"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M24 28H54" />
                  <path d="M24 50H54" />
                  <path d="M24 72H62C70 72 76 66 76 56" />
                </svg>
              </span>
            )}
            <span className="footer-time">{formatTime(time)}</span>

            <TooltipGroup handle={footerTooltip}>
              {showEditControls && editModeContext && (
                <SignedIn>
                  <div className="footer-edit-controls">
                    <TooltipGroupTrigger
                      handle={footerTooltip}
                      payload={editModeContext.isEditMode ? 'Exit edit mode' : 'Edit'}
                      render={<motion.button whileTap={{ scale: 0.95 }} />}
                      className={`footer-btn ${editModeContext.isEditMode ? 'active' : ''}`}
                      onClick={handleToggleEditMode}
                      aria-label={editModeContext.isEditMode ? 'Exit edit mode' : 'Enter edit mode'}
                      aria-pressed={editModeContext.isEditMode}
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                      </svg>
                    </TooltipGroupTrigger>
                    <TooltipGroupTrigger
                      handle={footerTooltip}
                      payload="Export"
                      render={<motion.button whileTap={{ scale: 0.95 }} />}
                      className="footer-btn"
                      onClick={handleExport}
                      aria-label="Export data"
                      disabled={exporting}
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="7 10 12 15 17 10" />
                        <line x1="12" y1="15" x2="12" y2="3" />
                      </svg>
                    </TooltipGroupTrigger>
                    <TooltipGroupTrigger
                      handle={footerTooltip}
                      payload="Log out"
                      render={<motion.button whileTap={{ scale: 0.95 }} />}
                      className="footer-btn"
                      onClick={handleLogout}
                      aria-label="Logout"
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                        <polyline points="16 17 21 12 16 7" />
                        <line x1="21" y1="12" x2="9" y2="12" />
                      </svg>
                    </TooltipGroupTrigger>
                  </div>
                </SignedIn>
              )}

              <TooltipGroupTrigger
                handle={footerTooltip}
                payload={soundOn ? 'Mute sounds' : 'Unmute sounds'}
                // Stay open across the click so the label visibly flips
                closeOnClick={false}
                type="button"
                className="footer-btn footer-top footer-sound"
                onClick={toggleSound}
                aria-label="Sound effects"
                aria-pressed={soundOn}
                ref={cursorOriginRef}
              >
                <span className="footer-sound-icon">
                  <span
                    className={`shelf-icon-anim shelf-icon-anim-overlay ${soundOn ? 'is-shown' : ''}`}
                    aria-hidden="true"
                  >
                    <SoundOnIcon />
                  </span>
                  <span
                    className={`shelf-icon-anim ${soundOn ? '' : 'is-shown'}`}
                    aria-hidden="true"
                  >
                    <SoundOffIcon />
                  </span>
                </span>
              </TooltipGroupTrigger>

              <TooltipGroupTrigger
                handle={footerTooltip}
                payload="Back to top"
                type="button"
                className="footer-btn footer-top"
                onClick={scrollToTop}
                aria-label="Back to top"
                ref={cursorOriginRef}
              >
                <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <polyline points="10.25 7.75 6 3.5 1.75 7.75" />
                </svg>
              </TooltipGroupTrigger>
            </TooltipGroup>
          </div>
        </div>

        {showQuote && (
          <div className="footer-quote-row">
            <span className="footer-quote">“The only limit is yourself”</span>
          </div>
        )}

      </footer>
      <AnimatePresence>
        {showLogin && <LoginModal onClose={() => setShowLogin(false)} />}
      </AnimatePresence>
    </>
  )
}

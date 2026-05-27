import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useHaptics } from '../hooks/useHaptics'

// Theme types
type ThemePreference = 'light' | 'dark' | 'system'

// Cursor origin helper for button hover animations
function cursorOriginRef(el: HTMLElement | null) {
  if (!el) return
  const setCursorOrigin = (e: PointerEvent) => {
    const { clientX, clientY } = e
    const { top, left } = el.getBoundingClientRect()
    el.style.setProperty('--x', `${(clientX - left)}px`)
    el.style.setProperty('--y', `${(clientY - top)}px`)
    el.style.setProperty('--cursor-origin', `${clientX - left}px ${clientY - top}px`)
  }
  el.addEventListener('pointerenter', setCursorOrigin)
  el.addEventListener('pointerleave', setCursorOrigin)
}

interface HeaderProps {
  theme: 'light' | 'dark'
  preference: ThemePreference
  setPreference: (theme: ThemePreference) => void
  showBackLink?: boolean
  currentPage?: 'home' | 'blog'
}

export function Header({ theme, preference, setPreference, showBackLink = false, currentPage }: HeaderProps) {
  const [isMobile, setIsMobile] = useState(false)
  const haptics = useHaptics()
  const location = useLocation()

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 520)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Theme icons
  const sunIcon = (
    <svg viewBox="0 0 20 20">
      <circle cx="10" cy="10" r="4" strokeWidth="0" fill="currentColor" />
      <line x1="10" y1="2" x2="10" y2="3.5" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="2" />
      <line x1="15.657" y1="4.343" x2="14.596" y2="5.404" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="2" />
      <line x1="18" y1="10" x2="16.5" y2="10" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="2" />
      <line x1="15.657" y1="15.657" x2="14.596" y2="14.596" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="2" />
      <line x1="10" y1="18" x2="10" y2="16.5" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="2" />
      <line x1="4.343" y1="15.657" x2="5.404" y2="14.596" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="2" />
      <line x1="2" y1="10" x2="3.5" y2="10" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="2" />
      <line x1="4.343" y1="4.343" x2="5.404" y2="5.404" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="2" />
    </svg>
  )

  const moonIcon = (
    <svg viewBox="0 0 24 24" fill="currentColor" stroke="none">
      <path d="M20.985 12.486a9 9 0 1 1-9.473-9.472c.405-.022.617.46.402.803a6 6 0 0 0 8.268 8.268c.344-.215.825-.004.803.401" />
    </svg>
  )

  const handleThemeToggle = () => {
    haptics.soft()
    setPreference(theme === 'light' ? 'dark' : 'light')
  }

  return (
    <header className="shared-header stagger-in stagger-in-1">
      <div className="shared-header-left">
        {showBackLink ? (
          <Link to="/" className="shared-header-back" ref={cursorOriginRef} aria-label="Go back">
            <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="17" y1="10" x2="3" y2="10" />
              <polyline points="8 5 3 10 8 15" />
            </svg>
          </Link>
        ) : (
          <Link to="/" className="shared-header-name">Ethan Jerla</Link>
        )}
      </div>

      <nav className="shared-header-nav">
        <Link
          to="/blog"
          className={`shared-header-btn nav-tooltip-btn ${currentPage === 'blog' ? 'active' : ''}`}
          aria-label="Writing"
          ref={cursorOriginRef}
        >
          <svg viewBox="0 0 20 20" fill="currentColor" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2">
            <line x1="17" y1="17" x2="12" y2="17" fill="none" />
            <path d="m3,17l1-4.5L12.914,3.586c.781-.781,2.047-.781,2.828,0l.672.672c.781.781.781,2.047,0,2.828l-8.914,8.914-4.5,1Z" />
          </svg>
          <div className="nav-tooltip">Writing</div>
        </Link>
        <Link
          to="/#shelf"
          className="shared-header-btn nav-tooltip-btn"
          aria-label="Shelf"
          ref={cursorOriginRef}
        >
          <svg viewBox="0 0 24 24" fill="currentColor" stroke="none">
            <path d="M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V7a1 1 0 0 1 1-1 2 2 0 0 0 0-4H8a2 2 0 0 0 0 4 1 1 0 0 1 1 1z" />
            <path d="M12 17v5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none" />
          </svg>
          <div className="nav-tooltip">Shelf</div>
        </Link>
        <button
          className="shared-header-btn theme-toggle"
          onClick={handleThemeToggle}
          aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`}
          ref={cursorOriginRef}
        >
          <AnimatePresence mode="wait" initial={false}>
            <motion.span
              key={theme}
              initial={{ opacity: 0, scale: 0.5, rotate: -90 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              exit={{ opacity: 0, scale: 0.5, rotate: 90 }}
              transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              {theme === 'dark' ? moonIcon : sunIcon}
            </motion.span>
          </AnimatePresence>
        </button>
      </nav>
    </header>
  )
}

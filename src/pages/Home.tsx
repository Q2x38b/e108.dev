import React, { useEffect, useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence, LayoutGroup, useMotionValue, useTransform, animate, type PanInfo } from 'framer-motion'

// Cursor origin helper for button hover animations
function setCursorOrigin(el: HTMLElement, e: PointerEvent) {
  const { clientX, clientY } = e
  const { top, left } = el.getBoundingClientRect()
  const x = clientX - left
  const y = clientY - top
  el.style.setProperty('--x', `${x}px`)
  el.style.setProperty('--y', `${y}px`)
  el.style.setProperty('--cursor-origin', `${x}px ${y}px`)
}

// Ref callback to attach cursor origin tracking
function cursorOriginRef(el: HTMLElement | null) {
  if (!el) return
  el.addEventListener('pointerenter', (e) => setCursorOrigin(el, e))
  el.addEventListener('pointerleave', (e) => setCursorOrigin(el, e))
}

// Tracks the cursor on the wrapping link but writes --x/--y onto its
// inner icon circle (so the ::before scale-in originates from the
// pointer entry point on the circle, not the whole flex item).
function profileLinkOriginRef(el: HTMLElement | null) {
  if (!el) return
  const icon = el.querySelector('.profile-expand-link-icon') as HTMLElement | null
  if (!icon) return
  const update = (e: PointerEvent) => {
    const { top, left } = icon.getBoundingClientRect()
    icon.style.setProperty('--x', `${e.clientX - left}px`)
    icon.style.setProperty('--y', `${e.clientY - top}px`)
  }
  el.addEventListener('pointerenter', update)
  el.addEventListener('pointerleave', update)
}
import { useQuery } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { SignedIn, useAuth } from '../contexts/AuthContext'
import { EditModeProvider, useEditMode } from '../contexts/EditModeContext'
import { EditableSection } from '../components/EditableSection'
import { ProfileEditor, AboutEditor, SkillEditor, ProjectEditor, ExperienceEditor, ShelfEditor } from '../components/editors'
import { useHaptics } from '../hooks/useHaptics'
import { Footer } from '../components/Footer'
import { Carousel_002 } from '../components/ui/skiper-ui/skiper48'
import { ShelfCarousel } from '../components/ShelfCarousel'

// Navigation links
const navLinks: string[] = []

// Accordion component
function Accordion({ title, content, isOpen, onToggle, id }: {
  title: string
  content: string
  isOpen: boolean
  onToggle: () => void
  id: string
}) {
  const haptics = useHaptics()
  const contentId = `accordion-content-${id}`
  const headerId = `accordion-header-${id}`

  const handleToggle = () => {
    haptics.soft()
    onToggle()
  }

  return (
    <div className="accordion">
      <button
        id={headerId}
        className={`accordion-header ${isOpen ? 'open' : ''}`}
        onClick={handleToggle}
        aria-expanded={isOpen}
        aria-controls={contentId}
      >
        <span className={`accordion-title ${isOpen ? 'active' : ''}`}>{title}</span>
        <span className={`accordion-icon ${isOpen ? 'open' : ''}`} aria-hidden="true">
          <span className="accordion-icon-bar accordion-icon-horizontal" />
          <span className="accordion-icon-bar accordion-icon-vertical" />
        </span>
      </button>
      <div
        id={contentId}
        className="accordion-content-wrapper"
        role="region"
        aria-labelledby={headerId}
        style={{
          display: 'grid',
          gridTemplateRows: isOpen ? '1fr' : '0fr',
          transition: 'grid-template-rows 0.2s ease-out'
        }}
      >
        <div style={{ overflow: 'hidden' }}>
          <div
            className="accordion-content"
            dangerouslySetInnerHTML={{ __html: content }}
          />
        </div>
      </div>
    </div>
  )
}

// Icons for accordion groups
const AccordionIcons: { [key: string]: React.ReactNode } = {
  default: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
      <polyline points="14 2 14 8 20 8"/>
    </svg>
  ),
  technical: (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20">
      <path d="m3.034,12.231c-.111.475.072,1.01.555,1.286l5.83,3.332c.36.206.801.206,1.161,0l5.83-3.332c.483-.276.667-.811.555-1.286" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
      <path d="m10.58,3.154l5.83,3.332c.786.449.786,1.582,0,2.031l-5.83,3.332c-.36.205-.801.205-1.161,0l-5.83-3.332c-.786-.449-.786-1.582,0-2.031l5.83-3.332c.36-.205.801-.205,1.161,0Z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" fill="currentColor" />
    </svg>
  ),
  athletics: (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20">
      <circle cx="11.5" cy="3.5" r="2" fill="currentColor" />
      <path d="m9.161,12.269c-.184,0-.37-.029-.554-.09-.917-.306-1.413-1.296-1.107-2.213l.911-2.734c.306-.917,1.299-1.412,2.213-1.107.917.306,1.413,1.296,1.107,2.213l-.911,2.734c-.244.733-.927,1.197-1.66,1.197Z" fill="currentColor" />
      <polyline points="10.038 7.032 7 7.25 5.5 9.25" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
      <polyline points="10.635 7.276 12.5 9.75 14.75 10" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
      <polyline points="8.614 11.037 11.25 13.75 11.75 17" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
      <polyline points="6.25 17.25 7.75 15 7.857 14.001" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
    </svg>
  ),
  leadership: (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20">
      <circle cx="6.5" cy="8" r="2" fill="currentColor" />
      <circle cx="13.5" cy="5" r="2" fill="currentColor" />
      <path d="m18.16,12.226c-.744-1.96-2.573-3.226-4.66-3.226-1.509,0-2.876.669-3.803,1.776,1.498.77,2.699,2.071,3.332,3.74.058.153.092.309.127.465.115.005.229.02.344.02,1.297,0,2.594-.299,3.881-.898.711-.331,1.053-1.155.778-1.876Z" fill="currentColor" />
      <path d="m11.16,15.226c-.744-1.96-2.573-3.226-4.66-3.226s-3.916,1.266-4.66,3.226c-.275.722.067,1.546.778,1.877,1.288.599,2.584.898,3.881.898s2.594-.299,3.881-.898c.711-.331,1.053-1.155.778-1.876Z" fill="currentColor" />
    </svg>
  ),
  academics: (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 18 18">
      <path d="M10.488,12.39c-.459,.236-.974,.36-1.488,.36s-1.031-.125-1.489-.361l-4.011-2.064v3.676c0,1.805,2.767,2.75,5.5,2.75s5.5-.945,5.5-2.75v-3.676l-4.012,2.065Z" fill="currentColor" />
      <path d="M16.719,9.226c-.026-.806,.056-1.611,.216-2.402,.018-.13,.065-.191,.065-.449,0-.601-.332-1.146-.866-1.421L9.802,1.694c-.502-.259-1.102-.258-1.604,0L1.866,4.955c-.534,.275-.866,.819-.866,1.42s.332,1.146,.866,1.421l6.332,3.259c.251,.129,.526,.194,.802,.194s.551-.065,.802-.194l5.451-2.806c-.019,.341-.045,.682-.034,1.024,.024,.772,.126,1.546,.301,2.301,.08,.347,.389,.581,.729,.581,.057,0,.113-.006,.17-.02,.403-.093,.655-.496,.562-.899-.152-.66-.241-1.336-.262-2.011Z" fill="currentColor" />
    </svg>
  ),
  code: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="16 18 22 12 16 6"/>
      <polyline points="8 6 2 12 8 18"/>
    </svg>
  ),
  design: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <circle cx="12" cy="12" r="6"/>
      <circle cx="12" cy="12" r="2"/>
    </svg>
  ),
  tools: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
    </svg>
  ),
  calendar: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
      <line x1="16" y1="2" x2="16" y2="6"/>
      <line x1="8" y1="2" x2="8" y2="6"/>
      <line x1="3" y1="10" x2="21" y2="10"/>
      <rect x="6" y="13" width="3" height="3" rx="0.5"/>
      <rect x="10.5" y="13" width="3" height="3" rx="0.5"/>
      <rect x="15" y="13" width="3" height="3" rx="0.5"/>
    </svg>
  ),
}

// Chevron icon for accordion
const ChevronIcon = ({ isOpen }: { isOpen: boolean }) => (
  <motion.svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    animate={{ rotate: isOpen ? 180 : 0 }}
    transition={{ type: 'spring', duration: 0.3, bounce: 0 }}
  >
    <polyline points="6 9 12 15 18 9"/>
  </motion.svg>
)

// Single accordion item within a group
interface AccordionItemData {
  id: string
  title: string
  content: string
  icon?: string
}

// Grouped accordion
function AccordionGroup({
  items,
  openId,
  onToggle
}: {
  items: AccordionItemData[]
  openId: string | null
  onToggle: (id: string) => void
}) {
  const haptics = useHaptics()

  const handleToggle = (id: string) => {
    haptics.selection()
    onToggle(id)
  }

  return (
    <div className="accordion-group-container">
      <div className="accordion-group-box">
        {items.map((item, itemIndex) => {
          const isOpen = item.id === openId
          const isFirst = itemIndex === 0
          const isLast = itemIndex === items.length - 1

          return (
            <div
              key={item.id}
              className={`accordion-group-item ${isOpen ? 'open' : ''} ${isFirst ? 'first' : ''} ${isLast ? 'last' : ''}`}
            >
              <button
                className="accordion-group-header"
                onClick={() => handleToggle(item.id)}
                aria-expanded={isOpen}
              >
                <span className="accordion-group-icon" aria-hidden="true">
                  {AccordionIcons[item.icon || 'default'] || AccordionIcons.default}
                </span>
                <span className="accordion-group-title">{item.title}</span>
                <span className="accordion-group-chevron">
                  <ChevronIcon isOpen={isOpen} />
                </span>
              </button>

              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    className="accordion-group-content-wrapper"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{
                      height: { type: 'spring', duration: 0.35, bounce: 0 },
                      opacity: { duration: 0.15, ease: 'easeOut' }
                    }}
                  >
                    <div
                      className="accordion-group-content"
                      dangerouslySetInnerHTML={{ __html: item.content }}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// Theme types
type ThemePreference = 'light' | 'dark' | 'system'
type ResolvedTheme = 'light' | 'dark'

// Theme hook
export function useTheme() {
  const [preference, setPreference] = useState<ThemePreference>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('theme-preference')
      if (saved === 'dark' || saved === 'light' || saved === 'system') return saved
      return 'system'
    }
    return 'system'
  })

  const getSystemTheme = (): ResolvedTheme => {
    if (typeof window !== 'undefined') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    }
    return 'light'
  }

  const resolvedTheme: ResolvedTheme = preference === 'system' ? getSystemTheme() : preference

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', resolvedTheme)
    localStorage.setItem('theme-preference', preference)
  }, [preference, resolvedTheme])

  useEffect(() => {
    if (preference !== 'system') return

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = () => {
      document.documentElement.setAttribute('data-theme', getSystemTheme())
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [preference])

  const toggle = () => {
    setPreference(resolvedTheme === 'light' ? 'dark' : 'light')
  }

  return { theme: resolvedTheme, preference, setPreference, toggle }
}

// Theme dropdown component
function ThemeDropdown({ preference, setPreference, resolvedTheme }: {
  preference: ThemePreference
  setPreference: (theme: ThemePreference) => void
  resolvedTheme: 'light' | 'dark'
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const dropdownRef = React.useRef<HTMLDivElement>(null)
  const haptics = useHaptics()

  // Check for mobile
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 520)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Theme icons (filled)
  const monitorIcon = (
    <svg viewBox="0 0 24 24" fill="currentColor" stroke="none">
      <path d="M4 3h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z" />
      <path d="M8 21h8M12 17v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none" />
    </svg>
  )

  const sunIcon = (
    <svg viewBox="0 0 20 20">
      <circle cx="10" cy="10" r="4" strokeWidth="0" fill="currentColor" />
      <line x1="10" y1="2" x2="10" y2="3.5" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
      <line x1="15.657" y1="4.343" x2="14.596" y2="5.404" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
      <line x1="18" y1="10" x2="16.5" y2="10" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
      <line x1="15.657" y1="15.657" x2="14.596" y2="14.596" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
      <line x1="10" y1="18" x2="10" y2="16.5" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
      <line x1="4.343" y1="15.657" x2="5.404" y2="14.596" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
      <line x1="2" y1="10" x2="3.5" y2="10" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
      <line x1="4.343" y1="4.343" x2="5.404" y2="5.404" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
    </svg>
  )

  const moonIcon = (
    <svg viewBox="0 0 24 24" fill="currentColor" stroke="none">
      <path d="M20.985 12.486a9 9 0 1 1-9.473-9.472c.405-.022.617.46.402.803a6 6 0 0 0 8.268 8.268c.344-.215.825-.004.803.401" />
    </svg>
  )

  const options: { value: ThemePreference; label: string; icon: React.ReactNode }[] = [
    {
      value: 'light',
      label: 'Light',
      icon: sunIcon
    },
    {
      value: 'system',
      label: 'System',
      icon: monitorIcon
    },
    {
      value: 'dark',
      label: 'Dark',
      icon: moonIcon
    }
  ]

  const currentIcon = preference === 'system' ? monitorIcon : preference === 'dark' ? moonIcon : sunIcon

  // Mobile: simple toggle between light and dark
  const handleMobileToggle = () => {
    haptics.selection()
    // Toggle based on resolved theme (what's actually showing)
    setPreference(resolvedTheme === 'light' ? 'dark' : 'light')
  }

  // Mobile: render simple toggle
  if (isMobile) {
    return (
      <button
        className="theme-toggle"
        onClick={handleMobileToggle}
        aria-label={`Switch to ${resolvedTheme === 'light' ? 'dark' : 'light'} theme`}
        ref={cursorOriginRef}
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={resolvedTheme}
            initial={{ opacity: 0, scale: 0.5, rotate: -90 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            exit={{ opacity: 0, scale: 0.5, rotate: 90 }}
            transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            {resolvedTheme === 'dark' ? moonIcon : sunIcon}
          </motion.span>
        </AnimatePresence>
      </button>
    )
  }

  // Desktop: dropdown with all options
  return (
    <div className="theme-dropdown" ref={dropdownRef}>
      <button
        className="theme-toggle"
        onClick={() => { haptics.soft(); setIsOpen((v) => !v) }}
        aria-label="Change theme"
        aria-expanded={isOpen}
        ref={cursorOriginRef}
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={preference}
            initial={{ opacity: 0, scale: 0.5, rotate: -90 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            exit={{ opacity: 0, scale: 0.5, rotate: 90 }}
            transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            {currentIcon}
          </motion.span>
        </AnimatePresence>
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="theme-dropdown-menu"
            initial={{ opacity: 0, y: -4, scale: 0.95, x: "-50%" }}
            animate={{ opacity: 1, y: 0, scale: 1, x: "-50%" }}
            exit={{ opacity: 0, y: -4, scale: 0.95, x: "-50%" }}
            transition={{ duration: 0.15, ease: [0.23, 1, 0.32, 1] }}
          >
            {options.map((option) => (
              <button
                key={option.value}
                className={`theme-dropdown-item ${preference === option.value ? 'active' : ''}`}
                onClick={() => {
                  haptics.selection()
                  setPreference(option.value)
                  setIsOpen(false)
                }}
                aria-label={`${option.label} theme`}
                aria-pressed={preference === option.value}
              >
                <span className="theme-dropdown-icon" aria-hidden="true">{option.icon}</span>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// Components
// Profile expansion modal links (matches socialLinks)
const profileExpandLinks = [
  { platform: 'github', url: 'https://github.com/Q2x38b', label: 'GitHub', icon: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
    </svg>
  )},
  { platform: 'x', url: 'https://x.com/q2x38b', label: 'Twitter', icon: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M4 4l11.733 16h4.267l-11.733 -16z" />
      <path d="M4 20l6.768 -6.768m2.46 -2.46l6.772 -6.772" />
    </svg>
  )},
  { platform: 'linkedin', url: 'https://linkedin.com/in/ethan-jerla-1b0901364', label: 'LinkedIn', icon: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
      <rect x="2" y="9" width="4" height="12" />
      <circle cx="4" cy="4" r="2" />
    </svg>
  )},
  { platform: 'email', url: 'mailto:hello@e108.dev', label: 'Email', icon: (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m3,7l6.504,3.716c.307.176.685.176.992,0l6.504-3.716" />
      <rect x="3" y="4" width="14" height="12" rx="3" ry="3" />
    </svg>
  )}
]

function Header({ preference, setPreference, resolvedTheme, location, profileImageUrl, profileName, profileTitle, onEditProfile }: {
  preference: ThemePreference
  setPreference: (theme: ThemePreference) => void
  resolvedTheme: 'light' | 'dark'
  location: string
  profileImageUrl: string
  profileName: string
  profileTitle: string
  onEditProfile: () => void
}) {
  const [profileExpanded, setProfileExpanded] = useState(false)
  const [isProfileDragging, setIsProfileDragging] = useState(false)
  const haptics = useHaptics()

  // Draggable profile image state
  const dragX = useMotionValue(0)
  const dragY = useMotionValue(0)
  const dragRotate = useTransform(dragX, [-200, 200], [-25, 25])

  const handleProfileDragStart = () => {
    setIsProfileDragging(true)
    haptics.soft()
  }

  const handleProfileDrag = (_: unknown, info: PanInfo) => {
    dragX.set(info.offset.x)
    dragY.set(info.offset.y)
  }

  const handleProfileDragEnd = () => {
    setIsProfileDragging(false)
    haptics.soft()
    // Magnetic snap-back with bouncy spring animation
    const springConfig = { type: 'spring' as const, stiffness: 150, damping: 12, mass: 1.5 }
    animate(dragX, 0, springConfig)
    animate(dragY, 0, springConfig)
  }

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id.toLowerCase())
    element?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleShelfClick = () => {
    haptics.soft()
    scrollToSection('shelf')
  }

  const handleProfileClick = () => {
    haptics.soft()
    setProfileExpanded(true)
  }

  // Lock body scroll when modal is open and reset drag position
  useEffect(() => {
    if (profileExpanded) {
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth
      document.body.style.overflow = 'hidden'
      document.body.style.paddingRight = `${scrollbarWidth}px`
      // Reset drag position immediately when modal opens
      dragX.jump(0)
      dragY.jump(0)
    } else {
      document.body.style.overflow = ''
      document.body.style.paddingRight = ''
      // Also reset when closing to ensure clean state for next open
      dragX.jump(0)
      dragY.jump(0)
    }
    return () => {
      document.body.style.overflow = ''
      document.body.style.paddingRight = ''
    }
  }, [profileExpanded])

  return (
    <>
    <header className="header stagger-in stagger-in-1">
      {/* Name row with nav on right */}
      <div className="header-row">
        <EditableSection sectionId="profile" onEdit={onEditProfile}>
          <div className="header-identity">
            <button
              className="header-name-btn"
              onClick={handleProfileClick}
              aria-label="View profile links"
              ref={cursorOriginRef}
            >
              <h1 className="header-name">{profileName}</h1>
            </button>
            <p className="header-title">{profileTitle}</p>
          </div>
        </EditableSection>

        <nav className="header-nav">
          <Link to="/blog" className="header-nav-btn nav-tooltip-btn" aria-label="Writing" ref={cursorOriginRef} draggable={false}>
            <svg viewBox="0 0 20 20" fill="currentColor" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2">
              <line x1="17" y1="17" x2="12" y2="17" fill="none" />
              <path d="m3,17l1-4.5L12.914,3.586c.781-.781,2.047-.781,2.828,0l.672.672c.781.781.781,2.047,0,2.828l-8.914,8.914-4.5,1Z" />
            </svg>
            <div className="nav-tooltip">Writing</div>
          </Link>
          <button type="button" className="header-nav-btn nav-tooltip-btn" aria-label="Shelf" onClick={handleShelfClick} ref={cursorOriginRef}>
            <svg viewBox="0 0 24 24" fill="currentColor" stroke="none">
              <path d="M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V7a1 1 0 0 1 1-1 2 2 0 0 0 0-4H8a2 2 0 0 0 0 4 1 1 0 0 1 1 1z" />
              <path d="M12 17v5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none" />
            </svg>
            <div className="nav-tooltip">Shelf</div>
          </button>
          <button className="header-nav-btn location-btn" aria-label="Location" ref={cursorOriginRef}>
            <svg viewBox="0 0 24 24" fill="currentColor" stroke="none">
              <path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0zm-8 3a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" fillRule="evenodd" />
            </svg>
            <div className="location-tooltip">
              {location}
            </div>
          </button>
          <ThemeDropdown
            preference={preference}
            setPreference={setPreference}
            resolvedTheme={resolvedTheme}
          />
        </nav>
      </div>
    </header>

    {/* Profile Expansion Modal */}
    <AnimatePresence>
      {profileExpanded && (
        <motion.div
          className="profile-expand-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
          onClick={() => !isProfileDragging && setProfileExpanded(false)}
        >
          <motion.div
            className="profile-expand-content"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
            onClick={(e) => e.stopPropagation()}
            style={{ pointerEvents: isProfileDragging ? 'none' : 'auto' }}
          >
            <motion.div
              className="profile-expand-image-wrapper"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.3, delay: 0.05, ease: [0.23, 1, 0.32, 1] }}
              drag
              dragConstraints={{ top: 0, left: 0, right: 0, bottom: 0 }}
              dragElastic={1}
              style={{
                x: dragX,
                y: dragY,
                rotate: dragRotate,
                cursor: 'grab',
                pointerEvents: 'auto',
                zIndex: isProfileDragging ? 10 : 1,
              }}
              whileDrag={{ cursor: 'grabbing' }}
              onDragStart={handleProfileDragStart}
              onDrag={handleProfileDrag}
              onDragEnd={handleProfileDragEnd}
              whileTap={{ scale: 0.95 }}
            >
              <img
                src={profileImageUrl}
                alt="Profile"
                className="profile-expand-image"
                draggable={false}
              />
            </motion.div>
            <motion.div
              className="profile-expand-links"
              initial={{ opacity: 0, y: 20 }}
              animate={{
                opacity: isProfileDragging ? 0 : 1,
                y: isProfileDragging ? 30 : 0,
                scale: isProfileDragging ? 0.9 : 1
              }}
              transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
            >
              {profileExpandLinks.map((link, index) => (
                <motion.a
                  key={link.platform}
                  href={link.url}
                  className="profile-expand-link"
                  target={link.url.startsWith('mailto:') ? undefined : '_blank'}
                  rel={link.url.startsWith('mailto:') ? undefined : 'noopener noreferrer'}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: 0.15 + index * 0.05, ease: [0.23, 1, 0.32, 1] }}
                  onClick={() => haptics.selection()}
                  ref={profileLinkOriginRef}
                  draggable={false}
                >
                  <span className="profile-expand-link-icon">
                    {link.icon}
                  </span>
                  <span className="profile-expand-link-label">{link.label}</span>
                </motion.a>
              ))}
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
    </>
  )
}

interface AboutData {
  bio: string[]
}

// Hardcoded social links
const socialLinks = [
  { platform: 'github', url: 'https://github.com/Q2x38b', label: 'GitHub' },
  { platform: 'x', url: 'https://x.com/q2x38b', label: 'Twitter' },
  { platform: 'linkedin', url: 'https://linkedin.com/in/ethan-jerla-1b0901364', label: 'LinkedIn' },
  { platform: 'email', url: 'mailto:hello@e108.dev', label: 'Email' }
]

function About({ about, onEdit }: { about: AboutData; onEdit: () => void }) {
  const renderBio = (text: string) => {
    return <span dangerouslySetInnerHTML={{ __html: text }} />
  }

  return (
    <EditableSection sectionId="about" onEdit={onEdit}>
      <section id="about" className="section stagger-in stagger-in-3">
        <div className="bio">
          {about.bio.map((paragraph, index) => (
            <p key={index}>{renderBio(paragraph)}</p>
          ))}
        </div>
        <div className="social-links">
          {socialLinks.map((link) => (
            <a
              key={link.platform}
              href={link.url}
              className="social-link"
              target={link.url.startsWith('mailto:') ? undefined : '_blank'}
              rel={link.url.startsWith('mailto:') ? undefined : 'noopener noreferrer'}
            >
              {link.platform === 'github' && (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
                </svg>
              )}
              {link.platform === 'x' && (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 4l11.733 16h4.267l-11.733 -16z" />
                  <path d="M4 20l6.768 -6.768m2.46 -2.46l6.772 -6.772" />
                </svg>
              )}
              {link.platform === 'linkedin' && (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
                  <rect x="2" y="9" width="4" height="12" />
                  <circle cx="4" cy="4" r="2" />
                </svg>
              )}
              {link.platform === 'email' && (
                <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2">
                  <path d="m3,7l6.504,3.716c.307.176.685.176.992,0l6.504-3.716" />
                  <rect x="3" y="4" width="14" height="12" rx="3" ry="3" />
                </svg>
              )}
              {link.label}
            </a>
          ))}
        </div>
      </section>
    </EditableSection>
  )
}

interface SkillData {
  _id: string
  title: string
  content: string
  order: number
}

function Skills({ skills, onEdit }: { skills: SkillData[]; onEdit: () => void }) {
  const [openId, setOpenId] = useState<string | null>(null)

  // Assign icons based on skill title keywords
  const getIconForSkill = (title: string): string => {
    const lowerTitle = title.toLowerCase()
    if (lowerTitle.includes('athletic') || lowerTitle.includes('sport') || lowerTitle.includes('physical') || lowerTitle.includes('running')) return 'athletics'
    if (lowerTitle.includes('leadership') || lowerTitle.includes('leader') || lowerTitle.includes('manag')) return 'leadership'
    if (lowerTitle.includes('academic') || lowerTitle.includes('school') || lowerTitle.includes('education') || lowerTitle.includes('learning')) return 'academics'
    if (lowerTitle.includes('technical') || lowerTitle.includes('tech')) return 'technical'
    if (lowerTitle.includes('code') || lowerTitle.includes('programming') || lowerTitle.includes('development')) return 'code'
    if (lowerTitle.includes('design') || lowerTitle.includes('ui') || lowerTitle.includes('ux')) return 'design'
    if (lowerTitle.includes('tool') || lowerTitle.includes('workflow')) return 'tools'
    if (lowerTitle.includes('schedule') || lowerTitle.includes('plan') || lowerTitle.includes('time')) return 'calendar'
    return 'default'
  }

  // Convert skills to accordion items
  const accordionItems: AccordionItemData[] = skills.map(skill => ({
    id: skill._id,
    title: skill.title,
    content: skill.content || '',
    icon: getIconForSkill(skill.title)
  }))

  const handleToggle = (id: string) => {
    setOpenId(openId === id ? null : id)
  }

  return (
    <EditableSection sectionId="skills" onEdit={onEdit}>
      <section id="skills" className="section stagger-in stagger-in-6">
        <h2 className="section-title">Skills</h2>
        <AccordionGroup
          items={accordionItems}
          openId={openId}
          onToggle={handleToggle}
        />
      </section>
    </EditableSection>
  )
}

interface ProjectLink {
  label: string
  url: string
}

interface ProjectData {
  _id: string
  name: string
  description: string
  year: string
  details: string
  tech: string[]
  url?: string
  links?: ProjectLink[]
  images?: string[]
  noModal?: boolean
  order: number
}

function Work({ projects, onEdit }: { projects: ProjectData[]; onEdit: () => void }) {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const selectedProject = projects.find(p => p.name === selectedId)
  const haptics = useHaptics()

  useEffect(() => {
    if (selectedId) {
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth
      document.body.style.overflow = 'hidden'
      document.body.style.paddingRight = `${scrollbarWidth}px`
    } else {
      document.body.style.overflow = ''
      document.body.style.paddingRight = ''
    }
    return () => {
      document.body.style.overflow = ''
      document.body.style.paddingRight = ''
    }
  }, [selectedId])

  // Group projects by year
  const projectsByYear = projects.reduce((acc, project) => {
    const year = project.year
    if (!acc[year]) {
      acc[year] = []
    }
    acc[year].push(project)
    return acc
  }, {} as Record<string, ProjectData[]>)

  // Sort years in descending order (most recent first)
  const sortedYears = Object.keys(projectsByYear).sort((a, b) => parseInt(b) - parseInt(a))

  return (
    <>
      <EditableSection sectionId="work" onEdit={onEdit}>
        <section id="work" className="section work-section stagger-in stagger-in-4">
          <h2 className="section-title section-title-with-icon">
            <svg width="15" height="15" viewBox="0 0 20 20" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2">
              <rect x="3" y="3" width="5" height="5" rx="1.5" ry="1.5" fill="none" />
              <rect x="12" y="3" width="5" height="5" rx="1.5" ry="1.5" transform="translate(8.136 -8.642) rotate(45)" fill="currentColor" />
              <rect x="3" y="12" width="5" height="5" rx="1.5" ry="1.5" fill="none" />
              <rect x="12" y="12" width="5" height="5" rx="1.5" ry="1.5" fill="none" />
            </svg>
            Work
          </h2>
          <LayoutGroup>
            <div className="work-table">
              {sortedYears.map((year) => (
                <div key={year} className="work-year-group">
                  <div className="work-year-label">{year}</div>
                  <div className="work-year-entries">
                    {projectsByYear[year].map((project) => {
                      const hasDetails = project.details && project.details.trim() !== ''
                      const primaryLink = project.url || (project.links && project.links.length > 0 ? project.links[0].url : null)
                      // Only treat as external link if URL is valid (starts with http/https)
                      const isValidExternalUrl = primaryLink && (primaryLink.startsWith('http://') || primaryLink.startsWith('https://'))
                      const shouldLinkDirectly = !hasDetails && isValidExternalUrl

                      if (project.noModal) {
                        return (
                          <div key={project._id} className="work-entry work-entry-static">
                            <span className="work-entry-name">{project.name}</span>
                            {project.description && (
                              <span className="work-entry-description">{project.description}</span>
                            )}
                            <span className="work-entry-date">{project.year}</span>
                          </div>
                        )
                      }

                      if (shouldLinkDirectly) {
                        return (
                          <a
                            key={project._id}
                            href={primaryLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="work-entry work-entry-external"
                            onClick={() => haptics.soft()}
                          >
                            <span className="work-entry-name">{project.name}</span>
                            {project.description && (
                              <span className="work-entry-description">{project.description}</span>
                            )}
                            <span className="work-entry-date-wrapper">
                              <span className="work-entry-date">{project.year}</span>
                              <svg className="work-entry-external-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                                <polyline points="15 3 21 3 21 9" />
                                <line x1="10" y1="14" x2="21" y2="3" />
                              </svg>
                            </span>
                          </a>
                        )
                      }

                      // Preload images on hover
                      const preloadImages = () => {
                        if (project.images && project.images.length > 0) {
                          project.images.forEach(src => {
                            const img = new Image()
                            img.src = src
                          })
                        }
                      }

                      return (
                        <button
                          key={project._id}
                          className="work-entry"
                          onClick={() => { haptics.soft(); setSelectedId(project.name) }}
                          onMouseEnter={preloadImages}
                          onFocus={preloadImages}
                        >
                          <span className="work-entry-name">{project.name}</span>
                          {project.description && (
                            <span className="work-entry-description">{project.description}</span>
                          )}
                          <span className="work-entry-date">{project.year}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          </LayoutGroup>
        </section>
      </EditableSection>

      <AnimatePresence>
        {selectedId && selectedProject && (
          <motion.div
            className="work-modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
            onClick={() => setSelectedId(null)}
          >
            <motion.div
              className={`work-modal ${selectedProject.images && selectedProject.images.length > 0 ? 'work-modal-with-images' : ''}`}
              initial={{ opacity: 0, scale: 0.96, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 8 }}
              transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                className="work-modal-close"
                onClick={() => { haptics.soft(); setSelectedId(null) }}
                aria-label="Close"
              >
                <svg viewBox="0 0 24 24" fill="none">
                  <line x1="18" y1="6" x2="6" y2="18" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
                  <line x1="6" y1="6" x2="18" y2="18" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
                </svg>
              </button>

              {selectedProject.images && selectedProject.images.length > 0 && (
                <div className="work-modal-carousel">
                  <Carousel_002
                    images={selectedProject.images.map((src, idx) => ({
                      src,
                      alt: `${selectedProject.name} image ${idx + 1}`
                    }))}
                    showPagination={true}
                    loop={true}
                  />
                </div>
              )}

              <div className="work-modal-content">
                <div className="work-modal-header">
                  <h3 className="work-modal-title">{selectedProject.name}</h3>
                  <span className="work-modal-year">{selectedProject.year}</span>
                </div>
                <p className="work-modal-details">
                  {selectedProject.details}
                </p>
                <div className="work-modal-tech">
                  {selectedProject.tech.map((t) => (
                    <span key={t} className="work-modal-tag">{t}</span>
                  ))}
                </div>
                {selectedProject.links && selectedProject.links.length > 0 && (
                  <div className="work-modal-links">
                    {selectedProject.links.map((link, index) => (
                      <a
                        key={index}
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="work-modal-link"
                      >
                        {link.label}
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M7 17L17 7M17 7H7M17 7V17" />
                        </svg>
                      </a>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

interface ExperienceData {
  _id: string
  company: string
  role: string
  date: string
  details?: string
  order: number
}

function Experience({ experiences, onEdit }: { experiences: ExperienceData[]; onEdit: () => void }) {
  // Sort: pending (no date) first, then by date descending
  const sortedExperiences = [...experiences].sort((a, b) => {
    if (!a.date && b.date) return -1
    if (a.date && !b.date) return 1
    return 0
  })

  return (
    <EditableSection sectionId="experience" onEdit={onEdit}>
      <section id="experience" className="section stagger-in stagger-in-5">
        <h2 className="section-title section-title-with-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20">
            <path d="m17,6l-7.293,7.293c-.391.391-1.024.391-1.414,0l-2.586-2.586c-.391-.391-1.024-.391-1.414,0l-2.293,2.293" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
            <polyline points="17 13 17 6 10 6" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
          </svg>
          Timeline
        </h2>
        <div className="timeline">
          {sortedExperiences.map((exp) => {
            const isPending = !exp.date

            return (
              <div key={exp._id} className={`timeline-item ${isPending ? 'pending' : ''}`}>
                {isPending ? (
                  <svg className="timeline-marker" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" aria-hidden="true">
                    <circle cx="10" cy="10" r="7" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"/>
                  </svg>
                ) : (
                  <svg className="timeline-marker" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" aria-hidden="true">
                    <path d="m10,2C5.589,2,2,5.589,2,10s3.589,8,8,8,8-3.589,8-8S14.411,2,10,2Zm0,11c-1.657,0-3-1.343-3-3s1.343-3,3-3,3,1.343,3,3-1.343,3-3,3Z" fill="currentColor" strokeWidth="0"/>
                  </svg>
                )}
                <div className="timeline-content">
                  <div className="timeline-header">
                    <span className="timeline-company">{exp.company}</span>
                    <span className="timeline-date">{exp.date || 'Upcoming'}</span>
                  </div>
                  <span className="timeline-role">{exp.role}</span>
                </div>
              </div>
            )
          })}
        </div>
      </section>
    </EditableSection>
  )
}

// Edit mode indicator
function EditModeIndicator() {
  const { isEditMode } = useEditMode()

  if (!isEditMode) return null

  return (
    <motion.div
      className="edit-mode-indicator"
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
    >
      Edit Mode Active
    </motion.div>
  )
}


// Loading skeleton
function LoadingSkeleton() {
  return (
    <div className="container">
      {/* Skeleton Header */}
      <div className="skeleton-header">
        <div className="skeleton-nav">
          <div className="skeleton-nav-item" />
          <div className="skeleton-nav-item" />
          <div className="skeleton-nav-item" />
          <div className="skeleton-nav-item" />
        </div>
        <div className="skeleton-header-right">
          <div className="skeleton-location" />
          <div className="skeleton-theme-btn" />
        </div>
      </div>

      <div className="loading-skeleton">
        {/* Profile Section */}
        <div className="skeleton-profile">
          <div className="skeleton-avatar" />
          <div className="skeleton-text skeleton-name" />
          <div className="skeleton-text skeleton-title" />
        </div>

        {/* About Section */}
        <div className="skeleton-section">
          <div className="skeleton-text skeleton-heading" />
          <div className="skeleton-text skeleton-paragraph" />
          <div className="skeleton-text skeleton-paragraph skeleton-paragraph-short" />
          <div className="skeleton-social-links">
            <div className="skeleton-social-link" />
            <div className="skeleton-social-link" />
            <div className="skeleton-social-link" />
          </div>
        </div>

        {/* Skills Section */}
        <div className="skeleton-section">
          <div className="skeleton-text skeleton-heading" />
          <div className="skeleton-accordion" />
          <div className="skeleton-accordion" />
          <div className="skeleton-accordion" />
          <div className="skeleton-accordion" />
        </div>

        {/* Work Section */}
        <div className="skeleton-section">
          <div className="skeleton-text skeleton-heading" />
          <div className="skeleton-work-item" />
          <div className="skeleton-work-item" />
          <div className="skeleton-work-item" />
        </div>

        {/* Experience Section */}
        <div className="skeleton-section">
          <div className="skeleton-text skeleton-heading" />
          <div className="skeleton-experience-row" />
          <div className="skeleton-experience-row" />
        </div>
      </div>
    </div>
  )
}

// Main content component (wrapped with EditModeProvider)
function HomeContent() {
  const { theme: resolvedTheme, preference, setPreference } = useTheme()
  const { setEditingSection } = useEditMode()

  // Fetch all content from Convex
  const profile = useQuery(api.content.getProfile)
  const about = useQuery(api.content.getAbout)
  const skills = useQuery(api.content.getSkills)
  const projects = useQuery(api.content.getProjects)
  const experiences = useQuery(api.content.getExperiences)
  const footer = useQuery(api.content.getFooter)
  const shelfItems = useQuery(api.shelf.list)

  // Editor states
  const [editingProfile, setEditingProfile] = useState(false)
  const [editingAbout, setEditingAbout] = useState(false)
  const [editingSkills, setEditingSkills] = useState(false)
  const [editingProjects, setEditingProjects] = useState(false)
  const [editingExperiences, setEditingExperiences] = useState(false)
  const [editingShelf, setEditingShelf] = useState(false)

  // Scroll to hash target (e.g., /#shelf) once content has loaded
  useEffect(() => {
    if (!window.location.hash) return
    const id = window.location.hash.slice(1)
    const el = document.getElementById(id)
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [skills, projects, experiences])

  // Show loading skeleton while fetching data from Convex
  if (profile === undefined || about === undefined || skills === undefined ||
      projects === undefined || experiences === undefined || footer === undefined) {
    return <LoadingSkeleton />
  }

  // If no data exists in Convex, show loading (data should be seeded)
  if (!profile || !about || !footer) {
    return <LoadingSkeleton />
  }

  // Use data from Convex directly
  const profileData = profile
  const aboutData = about
  const skillsData = skills
  const projectsData = projects
  const experiencesData = experiences
  const footerData = footer

  const handleCloseEditor = (setter: (v: boolean) => void) => {
    setter(false)
    setEditingSection(null)
  }

  return (
    <>
    <div className="container">
      <Header
        preference={preference}
        setPreference={setPreference}
        resolvedTheme={resolvedTheme}
        location={profileData.location}
        profileImageUrl={profileData.imageUrl}
        profileName={profileData.name}
        profileTitle={profileData.title}
        onEditProfile={() => { setEditingProfile(true); setEditingSection('profile') }}
      />
      <EditModeIndicator />
      <About
        about={aboutData}
        onEdit={() => { setEditingAbout(true); setEditingSection('about') }}
      />
      <Work
        projects={projectsData as ProjectData[]}
        onEdit={() => { setEditingProjects(true); setEditingSection('work') }}
      />
      <Experience
        experiences={experiencesData as ExperienceData[]}
        onEdit={() => { setEditingExperiences(true); setEditingSection('experience') }}
      />
      <Skills
        skills={skillsData as SkillData[]}
        onEdit={() => { setEditingSkills(true); setEditingSection('skills') }}
      />
      <EditableSection sectionId="shelf" onEdit={() => { setEditingShelf(true); setEditingSection('shelf') }}>
        <ShelfCarousel />
      </EditableSection>
      <Footer showEditControls={true} showSignature={true} showQuote={true} className="stagger-in stagger-in-8" />

      {/* Editors */}
      <AnimatePresence>
        {editingProfile && profile && (
          <ProfileEditor
            profile={profile}
            onClose={() => handleCloseEditor(setEditingProfile)}
          />
        )}
        {editingAbout && about && (
          <AboutEditor
            about={about}
            onClose={() => handleCloseEditor(setEditingAbout)}
          />
        )}
        {editingSkills && skills.length > 0 && (
          <SkillEditor
            skills={skills}
            onClose={() => handleCloseEditor(setEditingSkills)}
          />
        )}
        {editingProjects && projects.length > 0 && (
          <ProjectEditor
            projects={projects}
            onClose={() => handleCloseEditor(setEditingProjects)}
          />
        )}
        {editingExperiences && experiences.length > 0 && (
          <ExperienceEditor
            experiences={experiences}
            onClose={() => handleCloseEditor(setEditingExperiences)}
          />
        )}
        {editingShelf && (
          <ShelfEditor
            items={(shelfItems as never[]) || []}
            onClose={() => handleCloseEditor(setEditingShelf)}
          />
        )}
      </AnimatePresence>
    </div>
    </>
  )
}

export default function Home() {
  return (
    <EditModeProvider>
      <HomeContent />
    </EditModeProvider>
  )
}

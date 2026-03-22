import React, { useEffect, useState, useRef, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence, LayoutGroup, useMotionValue, useTransform, useSpring } from 'framer-motion'
import { useQuery, useConvex } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { SignedIn, useAuth } from '../contexts/AuthContext'
import { EditModeProvider, useEditMode } from '../contexts/EditModeContext'
import { EditableSection } from '../components/EditableSection'
import { ProfileEditor, AboutEditor, SkillEditor, ProjectEditor, ExperienceEditor } from '../components/editors'
import { useHaptics } from '../hooks/useHaptics'
import { useLatency, useThemeMode } from '../components/LatencyChart'
import { Liveline } from 'liveline'

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
  resolvedTheme: ResolvedTheme
}) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = React.useRef<HTMLDivElement>(null)
  const haptics = useHaptics()

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
    <svg viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2" fill="none" />
      <path d="M12 20v2" fill="none" />
      <path d="m4.93 4.93 1.41 1.41" fill="none" />
      <path d="m17.66 17.66 1.41 1.41" fill="none" />
      <path d="M2 12h2" fill="none" />
      <path d="M20 12h2" fill="none" />
      <path d="m6.34 17.66-1.41 1.41" fill="none" />
      <path d="m19.07 4.93-1.41 1.41" fill="none" />
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

  return (
    <div className="theme-dropdown" ref={dropdownRef}>
      <button
        className="theme-toggle"
        onClick={() => { haptics.soft(); setIsOpen(!isOpen) }}
        aria-label="Change theme"
        aria-expanded={isOpen}
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={resolvedTheme}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15, ease: [0.23, 1, 0.32, 1] }}
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
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
      <polyline points="22,6 12,13 2,6" />
    </svg>
  )}
]

function Header({ theme, preference, setPreference, location, profileImageUrl }: {
  theme: ResolvedTheme
  preference: ThemePreference
  setPreference: (theme: ThemePreference) => void
  location: string
  profileImageUrl: string
}) {
  const [profileExpanded, setProfileExpanded] = useState(false)
  const [isProfileDragging, setIsProfileDragging] = useState(false)
  const convex = useConvex()
  const haptics = useHaptics()

  // Draggable profile image state
  const dragX = useMotionValue(0)
  const dragY = useMotionValue(0)
  const springX = useSpring(dragX, { stiffness: 300, damping: 25 })
  const springY = useSpring(dragY, { stiffness: 300, damping: 25 })
  const dragRotate = useTransform(dragX, [-200, 200], [-25, 25])
  const dragScale = useTransform(
    [dragX, dragY],
    ([x, y]: number[]) => {
      const distance = Math.sqrt(x * x + y * y)
      return Math.max(0.85, 1 - distance / 600)
    }
  )

  const handleProfileDragStart = () => {
    setIsProfileDragging(true)
    haptics.soft()
  }

  const handleProfileDragEnd = () => {
    setIsProfileDragging(false)
    // Close menu after dragging ends
    haptics.soft()
    setProfileExpanded(false)
    // Reset position with spring animation
    dragX.set(0)
    dragY.set(0)
  }

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id.toLowerCase())
    element?.scrollIntoView({ behavior: 'smooth' })
  }

  const prefetchShelf = () => {
    // Prefetch shelf data on hover - result is cached by Convex
    convex.query(api.shelf.list, {})
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
      springX.jump(0)
      springY.jump(0)
    } else {
      document.body.style.overflow = ''
      document.body.style.paddingRight = ''
    }
    return () => {
      document.body.style.overflow = ''
      document.body.style.paddingRight = ''
    }
  }, [profileExpanded, dragX, dragY, springX, springY])

  return (
    <>
    <header className="header stagger-in stagger-in-1">
      <div className="header-left">
        <button
          className="header-profile-button"
          onClick={handleProfileClick}
          aria-label="View profile links"
        >
          <img
            src={profileImageUrl}
            alt="Profile"
            className="header-profile-image"
          />
        </button>
      </div>

      <div className="header-pill">
        {/* Navigation icons */}
        <Link to="/blog" className="header-pill-btn" aria-label="Writing">
          <svg viewBox="0 0 24 24" fill="currentColor" stroke="none">
            <path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z" />
            <path d="M13 21h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none" />
          </svg>
        </Link>
        <Link to="/shelf" className="header-pill-btn" aria-label="Shelf" onMouseEnter={prefetchShelf}>
          <svg viewBox="0 0 24 24" fill="currentColor" stroke="none">
            <path d="M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V7a1 1 0 0 1 1-1 2 2 0 0 0 0-4H8a2 2 0 0 0 0 4 1 1 0 0 1 1 1z" />
            <path d="M12 17v5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none" />
          </svg>
        </Link>
        <button className="header-pill-btn location-btn" aria-label="Location">
          <svg viewBox="0 0 24 24" fill="currentColor" stroke="none">
            <path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0zm-8 3a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" fillRule="evenodd" />
          </svg>
          <div className="location-tooltip">
            {location}
          </div>
        </button>
        <div className="header-pill-btn header-pill-btn-theme">
          <ThemeDropdown
            preference={preference}
            setPreference={setPreference}
            resolvedTheme={theme}
          />
        </div>
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
              dragConstraints={false}
              dragElastic={0.1}
              style={{
                x: springX,
                y: springY,
                rotate: dragRotate,
                scale: dragScale,
                cursor: 'grab',
                pointerEvents: 'auto',
                zIndex: isProfileDragging ? 10 : 1,
              }}
              whileDrag={{ cursor: 'grabbing' }}
              onDragStart={handleProfileDragStart}
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

interface ProfileData {
  name: string
  title: string
  imageUrl: string
  location: string
}

function Profile({ profile, onEdit }: { profile: ProfileData; onEdit: () => void }) {
  return (
    <EditableSection sectionId="profile" onEdit={onEdit}>
      <section className="profile stagger-in stagger-in-2">
        <h1 className="profile-name">{profile.name}</h1>
        <p className="profile-title">{profile.title}</p>
      </section>
    </EditableSection>
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
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <polyline points="22,6 12,13 2,6" />
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
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  return (
    <EditableSection sectionId="skills" onEdit={onEdit}>
      <section id="skills" className="section stagger-in stagger-in-6">
        <h2 className="section-title">Skills</h2>
        <div className="accordion-list">
          {skills.map((skill, index) => (
            <div key={skill._id}>
              <Accordion
                id={skill._id}
                title={skill.title}
                content={skill.content}
                isOpen={openIndex === index}
                onToggle={() => setOpenIndex(openIndex === index ? null : index)}
              />
            </div>
          ))}
        </div>
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
  order: number
}

// Image Carousel Component
function ImageCarousel({ images }: { images: string[] }) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [direction, setDirection] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const haptics = useHaptics()

  // Autoplay every 5 seconds
  useEffect(() => {
    if (!images || images.length <= 1 || isPaused) return

    const interval = setInterval(() => {
      setDirection(1)
      setCurrentIndex((prev) => (prev + 1) % images.length)
    }, 5000)

    return () => clearInterval(interval)
  }, [images, isPaused])

  if (!images || images.length === 0) return null

  const goToNext = () => {
    haptics.soft()
    setDirection(1)
    setCurrentIndex((prev) => (prev + 1) % images.length)
  }

  const goToPrev = () => {
    haptics.soft()
    setDirection(-1)
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length)
  }

  const variants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 60 : -60,
      opacity: 0,
      scale: 0.98
    }),
    center: {
      x: 0,
      opacity: 1,
      scale: 1
    },
    exit: (direction: number) => ({
      x: direction < 0 ? 60 : -60,
      opacity: 0,
      scale: 0.98
    })
  }

  return (
    <div
      className="image-carousel"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="image-carousel-container">
        <AnimatePresence initial={false} custom={direction} mode="wait">
          <motion.img
            key={currentIndex}
            src={images[currentIndex]}
            alt={`Project image ${currentIndex + 1}`}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
            className="image-carousel-image"
          />
        </AnimatePresence>
      </div>

      {images.length > 1 && (
        <div className="image-carousel-pill">
          <button
            className="image-carousel-pill-btn"
            onClick={goToPrev}
            aria-label="Previous image"
          >
            <svg viewBox="0 0 24 24" fill="none">
              <path d="M14.5 18L8.5 12L14.5 6" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>

          <div className="image-carousel-pill-dots">
            {images.map((_, idx) => (
              <button
                key={idx}
                className={`image-carousel-pill-dot ${idx === currentIndex ? 'active' : ''}`}
                onClick={() => {
                  haptics.selection()
                  setDirection(idx > currentIndex ? 1 : -1)
                  setCurrentIndex(idx)
                }}
                aria-label={`Go to image ${idx + 1}`}
              />
            ))}
          </div>

          <button
            className="image-carousel-pill-btn"
            onClick={goToNext}
            aria-label="Next image"
          >
            <svg viewBox="0 0 24 24" fill="none">
              <path d="M9.5 18L15.5 12L9.5 6" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      )}
    </div>
  )
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
            <svg width="13" height="13" stroke="currentColor" strokeWidth="2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83z" /><path d="M2 12a1 1 0 0 0 .58.91l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9A1 1 0 0 0 22 12" /><path d="M2 17a1 1 0 0 0 .58.91l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9A1 1 0 0 0 22 17" /></svg>
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

                      return (
                        <button
                          key={project._id}
                          className="work-entry"
                          onClick={() => { haptics.soft(); setSelectedId(project.name) }}
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
                <ImageCarousel images={selectedProject.images} />
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
  order: number
}

function Experience({ experiences, onEdit }: { experiences: ExperienceData[]; onEdit: () => void }) {
  return (
    <EditableSection sectionId="experience" onEdit={onEdit}>
      <section id="experience" className="section stagger-in stagger-in-5">
        <h2 className="section-title">Experience</h2>
        <div className="experience-list">
          {experiences.map((exp) => (
            <div key={exp._id} className="experience-row">
              <span className="experience-company">{exp.company}</span>
              <span className="experience-line" />
              <span className="experience-role">{exp.role}</span>
              <span className="experience-date">
                {exp.date || <span className="blink-cursor">_</span>}
              </span>
            </div>
          ))}
        </div>
      </section>
    </EditableSection>
  )
}

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
    <div className="login-modal-overlay" onClick={onClose}>
      <motion.div
        className="login-modal"
        onClick={(e) => e.stopPropagation()}
        initial={{ opacity: 0, scale: 0.96, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 8 }}
        transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
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

function Footer({ copyrightYear }: { copyrightYear: string }) {
  const [time, setTime] = useState(new Date())
  const [clickCount, setClickCount] = useState(0)
  const [showLogin, setShowLogin] = useState(false)
  const [showGraph, setShowGraph] = useState(false)
  const { isAuthenticated, logout } = useAuth()
  const { isEditMode, toggleEditMode } = useEditMode()
  const haptics = useHaptics()
  const { data, currentLatency, color } = useLatency()
  const theme = useThemeMode()
  const pingRef = React.useRef<HTMLDivElement>(null)

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

  // Close ping popover on outside click
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
    toggleEditMode()
  }

  const handlePingClick = () => {
    haptics.soft()
    setShowGraph(prev => !prev)
  }

  return (
    <>
      <footer className="footer stagger-in stagger-in-8">
        {/* Desktop: quote at top, Mobile: quote in top row */}
        <div className="footer-quote-row">
          <span className="footer-quote-inline">The only limit is yourself</span>
        </div>

        <div className="footer-bottom">
          <div className="footer-left">
            <span
              className="footer-text footer-secret"
              onClick={() => setClickCount(c => c + 1)}
            >
              © {copyrightYear}
            </span>
            <span className="footer-dot">•</span>
            <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noopener noreferrer" className="footer-link">CC BY 4.0</a>
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

            <SignedIn>
              <motion.button
                className={`edit-mode-btn ${isEditMode ? 'active' : ''}`}
                onClick={handleToggleEditMode}
                whileTap={{ scale: 0.95 }}
                title={isEditMode ? 'Exit edit mode' : 'Enter edit mode'}
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

            <motion.button
              className="back-to-top"
              onClick={scrollToTop}
              whileTap={{ scale: 0.95 }}
              aria-label="Back to top"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 19V5M5 12l7-7 7 7" />
              </svg>
            </motion.button>
          </div>
        </div>
        <div className="footer-signature">
          <img src="/signature.png" alt="EJ" className="signature-img" />
        </div>
      </footer>
      <AnimatePresence>
        {showLogin && <LoginModal onClose={() => setShowLogin(false)} />}
      </AnimatePresence>
    </>
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

// Section definitions for mobile scroll indicator
const sections = [
  { id: 'top', label: 'Top' },
  { id: 'about', label: 'About' },
  { id: 'work', label: 'Work' },
  { id: 'experience', label: 'Experience' },
  { id: 'skills', label: 'Skills' },
]

// Mobile scroll indicator component
function MobileScrollIndicator() {
  const [currentSection, setCurrentSection] = useState('Top')
  const [scrollProgress, setScrollProgress] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [isVisible, setIsVisible] = useState(false)
  const trackRef = useRef<HTMLDivElement>(null)
  const haptics = useHaptics()
  const hideTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const lastSectionRef = useRef('Top')

  // Calculate scroll progress and current section
  const updateScrollState = useCallback(() => {
    const scrollTop = window.scrollY
    const docHeight = document.documentElement.scrollHeight - window.innerHeight
    const progress = Math.min(Math.max(scrollTop / docHeight, 0), 1)
    setScrollProgress(progress)

    // Determine current section based on scroll position
    let current = 'Top'
    for (const section of sections) {
      if (section.id === 'top') continue
      const element = document.getElementById(section.id)
      if (element) {
        const rect = element.getBoundingClientRect()
        if (rect.top <= window.innerHeight * 0.4) {
          current = section.label
        }
      }
    }

    // Trigger haptic when section changes
    if (current !== lastSectionRef.current) {
      haptics.selection()
      lastSectionRef.current = current
    }

    setCurrentSection(current)
  }, [haptics])

  // Show indicator when scrolling
  const handleScroll = useCallback(() => {
    setIsVisible(true)
    updateScrollState()

    // Hide after delay if not dragging
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current)
    }
    if (!isDragging) {
      hideTimeoutRef.current = setTimeout(() => {
        setIsVisible(false)
      }, 3500)
    }
  }, [isDragging, updateScrollState])

  useEffect(() => {
    // Check if mobile
    const checkMobile = () => window.innerWidth <= 520
    if (!checkMobile()) return

    window.addEventListener('scroll', handleScroll, { passive: true })
    updateScrollState()

    return () => {
      window.removeEventListener('scroll', handleScroll)
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current)
      }
    }
  }, [handleScroll, updateScrollState])

  // Hide scroll indicator when clicking anywhere else on the page
  useEffect(() => {
    const handleInteraction = (e: Event) => {
      const target = e.target as HTMLElement
      // Don't hide if clicking on the scroll indicator itself
      if (target.closest('.mobile-scroll-indicator')) return

      // Hide immediately when clicking buttons, dropdowns, or interactive elements
      if (target.closest('button, a, input, select, [role="button"], .theme-dropdown')) {
        setIsVisible(false)
        if (hideTimeoutRef.current) {
          clearTimeout(hideTimeoutRef.current)
        }
      }
    }

    window.addEventListener('touchstart', handleInteraction, { passive: true })
    window.addEventListener('mousedown', handleInteraction)

    return () => {
      window.removeEventListener('touchstart', handleInteraction)
      window.removeEventListener('mousedown', handleInteraction)
    }
  }, [])

  // Handle drag start
  const handleDragStart = (e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault()
    setIsDragging(true)
    setIsVisible(true)
    haptics.soft()

    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current)
    }
  }

  // Handle drag move - maps track position directly to scroll position
  const handleDragMove = useCallback((clientY: number) => {
    if (!isDragging || !trackRef.current) return

    const track = trackRef.current
    const rect = track.getBoundingClientRect()
    const relativeY = clientY - rect.top
    const progress = Math.min(Math.max(relativeY / rect.height, 0), 1)

    const docHeight = document.documentElement.scrollHeight - window.innerHeight
    const targetScroll = progress * docHeight

    // Temporarily disable smooth scroll and set directly
    document.documentElement.style.scrollBehavior = 'auto'
    window.scrollTo(0, targetScroll)
    // Re-enable after a frame
    requestAnimationFrame(() => {
      document.documentElement.style.scrollBehavior = ''
    })
  }, [isDragging])

  // Handle drag end
  const handleDragEnd = () => {
    setIsDragging(false)
    haptics.soft()

    hideTimeoutRef.current = setTimeout(() => {
      setIsVisible(false)
    }, 3500)
  }

  // Touch and mouse event handlers
  useEffect(() => {
    if (!isDragging) return

    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault()
      handleDragMove(e.touches[0].clientY)
    }

    const handleMouseMove = (e: MouseEvent) => {
      handleDragMove(e.clientY)
    }

    const handleEnd = () => {
      handleDragEnd()
    }

    window.addEventListener('touchmove', handleTouchMove, { passive: false })
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('touchend', handleEnd)
    window.addEventListener('mouseup', handleEnd)

    return () => {
      window.removeEventListener('touchmove', handleTouchMove)
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('touchend', handleEnd)
      window.removeEventListener('mouseup', handleEnd)
    }
  }, [isDragging, handleDragMove])

  // Only show on mobile
  const [isMobile, setIsMobile] = useState(false)
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= 520)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  if (!isMobile) return null

  const shouldShow = isVisible || isDragging

  return (
    <AnimatePresence>
      {shouldShow && (
        <motion.div
          key="scroll-indicator"
          className="mobile-scroll-indicator"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 20 }}
          transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
        >
          <div
            className="mobile-scroll-track"
            ref={trackRef}
            onTouchStart={handleDragStart}
            onMouseDown={handleDragStart}
          >
            {/* Thumb container */}
            <div
              className="mobile-scroll-thumb"
              style={{ top: `${scrollProgress * 100}%` }}
            >
              <div className="mobile-scroll-label-wrapper">
                <div className="mobile-scroll-label">
                  {currentSection}
                </div>
              </div>
              {/* Small bar indicator */}
              <div className="mobile-scroll-thumb-indicator" />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
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
  const { theme, preference, setPreference } = useTheme()
  const { setEditingSection } = useEditMode()

  // Fetch all content from Convex
  const profile = useQuery(api.content.getProfile)
  const about = useQuery(api.content.getAbout)
  const skills = useQuery(api.content.getSkills)
  const projects = useQuery(api.content.getProjects)
  const experiences = useQuery(api.content.getExperiences)
  const footer = useQuery(api.content.getFooter)

  // Editor states
  const [editingProfile, setEditingProfile] = useState(false)
  const [editingAbout, setEditingAbout] = useState(false)
  const [editingSkills, setEditingSkills] = useState(false)
  const [editingProjects, setEditingProjects] = useState(false)
  const [editingExperiences, setEditingExperiences] = useState(false)

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
    <MobileScrollIndicator />
    <div className="container">
      <Header theme={theme} preference={preference} setPreference={setPreference} location={profileData.location} profileImageUrl={profileData.imageUrl} />
      <EditModeIndicator />

      <Profile
        profile={profileData}
        onEdit={() => { setEditingProfile(true); setEditingSection('profile') }}
      />
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
      <Footer copyrightYear={footerData.copyrightYear} />

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

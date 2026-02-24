import { useEffect, useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion'
import { useQuery } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { SignedIn, useAuth } from '../contexts/AuthContext'
import { EditModeProvider, useEditMode } from '../contexts/EditModeContext'
import { EditableSection } from '../components/EditableSection'
import { ProfileEditor, AboutEditor, SkillEditor, ProjectEditor, ExperienceEditor } from '../components/editors'

// Animation variants
const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
}

const stagger = {
  visible: {
    transition: {
      staggerChildren: 0.1
    }
  }
}

// Navigation links
const navLinks = ['About', 'Work', 'Experience']

// Accordion component
function Accordion({ title, content, isOpen, onToggle }: {
  title: string
  content: string
  isOpen: boolean
  onToggle: () => void
}) {
  return (
    <div className="accordion">
      <button className="accordion-header" onClick={onToggle}>
        <span className={`accordion-title ${isOpen ? 'active' : ''}`}>{title}</span>
        <span className="accordion-icon">{isOpen ? '−' : '+'}</span>
      </button>
      <div
        className="accordion-content-wrapper"
        style={{
          display: 'grid',
          gridTemplateRows: isOpen ? '1fr' : '0fr',
          transition: 'grid-template-rows 0.25s ease-out'
        }}
      >
        <div style={{ overflow: 'hidden' }}>
          <div className="accordion-content">
            <p>{content}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

// Theme hook
export function useTheme() {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('theme')
      if (saved === 'dark' || saved === 'light') return saved
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    }
    return 'light'
  })

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('theme', theme)
  }, [theme])

  const toggle = () => setTheme(t => t === 'light' ? 'dark' : 'light')

  return { theme, toggle }
}

// Components
function Header({ theme, toggleTheme, location }: { theme: 'light' | 'dark'; toggleTheme: () => void; location: string }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id.toLowerCase())
    element?.scrollIntoView({ behavior: 'smooth' })
    setMobileMenuOpen(false)
  }

  return (
    <motion.header
      className="header"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Desktop navigation */}
      <nav className="nav nav-desktop">
        {navLinks.map((link) => (
          <span
            key={link}
            className="nav-link"
            onClick={() => scrollToSection(link)}
          >
            {link}
          </span>
        ))}
        <Link to="/blog" className="nav-link">Writing</Link>
      </nav>

      {/* Mobile menu toggle */}
      <button
        className="mobile-menu-toggle"
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        aria-label="Toggle menu"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          {mobileMenuOpen ? (
            <>
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </>
          ) : (
            <>
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </>
          )}
        </svg>
      </button>

      <div className="header-right">
        <div className="location">
          <svg className="location-icon globe-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="12" cy="12" r="10" />
            <path d="M2 12h20" />
            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
          </svg>
          {location}
        </div>
        <motion.button
          className="theme-toggle"
          onClick={toggleTheme}
          whileTap={{ scale: 0.95 }}
          aria-label="Toggle theme"
        >
          {theme === 'light' ? (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="5" />
              <line x1="12" y1="1" x2="12" y2="3" />
              <line x1="12" y1="21" x2="12" y2="23" />
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
              <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
              <line x1="1" y1="12" x2="3" y2="12" />
              <line x1="21" y1="12" x2="23" y2="12" />
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
              <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
            </svg>
          )}
        </motion.button>
      </div>

      {/* Mobile navigation dropdown */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.nav
            className="nav-mobile"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
          >
            {navLinks.map((link) => (
              <span
                key={link}
                className="nav-link-mobile"
                onClick={() => scrollToSection(link)}
              >
                {link}
              </span>
            ))}
            <Link to="/blog" className="nav-link-mobile" onClick={() => setMobileMenuOpen(false)}>Writing</Link>
          </motion.nav>
        )}
      </AnimatePresence>
    </motion.header>
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
      <motion.section
        className="profile"
        variants={fadeInUp}
        initial="hidden"
        animate="visible"
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <div className="profile-image-wrapper">
          <img
            src={profile.imageUrl}
            alt="Profile"
            className="profile-image"
          />
        </div>
        <h1 className="profile-name">{profile.name}</h1>
        <p className="profile-title">{profile.title}</p>
      </motion.section>
    </EditableSection>
  )
}

interface AboutData {
  bio: string[]
}

// Hardcoded social links
const socialLinks = [
  { platform: 'github', url: 'https://github.com/Q2x38b', label: 'GitHub' },
  { platform: 'linkedin', url: 'https://linkedin.com/in/ethan-jerla-1b0901364', label: 'LinkedIn' },
  { platform: 'email', url: 'mailto:hello@e108.dev', label: 'Email' }
]

function About({ about, onEdit }: { about: AboutData; onEdit: () => void }) {
  const renderBio = (text: string) => {
    return <span dangerouslySetInnerHTML={{ __html: text }} />
  }

  return (
    <EditableSection sectionId="about" onEdit={onEdit}>
      <motion.section
        id="about"
        className="section"
        variants={fadeInUp}
        initial="hidden"
        animate="visible"
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <h2 className="section-title">About</h2>
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
      </motion.section>
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
      <motion.section
        id="skills"
        className="section"
        variants={fadeInUp}
        initial="hidden"
        animate="visible"
        transition={{ duration: 0.5, delay: 0.25 }}
      >
        <h2 className="section-title">Skills</h2>
        <div className="accordion-list">
          {skills.map((skill, index) => (
            <Accordion
              key={skill._id}
              title={skill.title}
              content={skill.content}
              isOpen={openIndex === index}
              onToggle={() => setOpenIndex(openIndex === index ? null : index)}
            />
          ))}
        </div>
      </motion.section>
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
  order: number
}

function Work({ projects, onEdit }: { projects: ProjectData[]; onEdit: () => void }) {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
  const selectedProject = projects.find(p => p.name === selectedId)
  const listRef = useRef<HTMLDivElement>(null)
  const hoverTimeoutRef = useRef<number | null>(null)

  useEffect(() => {
    if (selectedId) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [selectedId])

  const handleMouseEnter = (index: number) => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current)
      hoverTimeoutRef.current = null
    }
    setHoveredIndex(index)
  }

  const handleMouseLeave = () => {
    hoverTimeoutRef.current = window.setTimeout(() => {
      setHoveredIndex(null)
    }, 50)
  }

  return (
    <>
      <EditableSection sectionId="work" onEdit={onEdit}>
        <motion.section
          id="work"
          className="section"
          variants={stagger}
          initial="hidden"
          animate="visible"
        >
          <motion.h2
            className="section-title"
            variants={fadeInUp}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            Work
          </motion.h2>
          <LayoutGroup>
            <div className="work-list" ref={listRef}>
              {projects.map((project, index) => (
                <motion.div
                  key={project._id}
                  className="work-item"
                  variants={fadeInUp}
                  transition={{ duration: 0.4, delay: 0.35 + index * 0.05 }}
                  onClick={() => setSelectedId(project.name)}
                  onMouseEnter={() => handleMouseEnter(index)}
                  onMouseLeave={handleMouseLeave}
                >
                  {hoveredIndex === index && (
                    <motion.div
                      className="work-item-bg"
                      layoutId="work-hover-bg"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ type: 'spring', bounce: 0.2, duration: 0.3 }}
                    />
                  )}
                  <div className="work-info">
                    <div className="work-name">{project.name}</div>
                    <div className="work-description">{project.description}</div>
                  </div>
                  <div className="work-meta">
                    <span className="work-year">{project.year}</span>
                    <span className="work-arrow">+</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </LayoutGroup>
        </motion.section>
      </EditableSection>

      <AnimatePresence>
        {selectedId && selectedProject && (
          <motion.div
            className="work-modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={() => setSelectedId(null)}
          >
            <motion.div
              className="work-modal"
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.15, ease: 'easeOut' }}
              onClick={(e) => e.stopPropagation()}
            >
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
              <button
                className="work-modal-close"
                onClick={() => setSelectedId(null)}
                aria-label="Close"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
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
      <motion.section
        id="experience"
        className="section"
        variants={stagger}
        initial="hidden"
        animate="visible"
      >
        <motion.h2
          className="section-title"
          variants={fadeInUp}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          Experience
        </motion.h2>
        <div className="experience-list">
          {experiences.map((exp, index) => (
            <motion.div
              key={exp._id}
              className="experience-row"
              variants={fadeInUp}
              transition={{ duration: 0.4, delay: 0.55 + index * 0.05 }}
            >
              <span className="experience-company">{exp.company}</span>
              <span className="experience-line" />
              <span className="experience-role">
                {exp.role}
                {!exp.date && <span className="blink-cursor">_</span>}
              </span>
              {exp.date && <span className="experience-date">{exp.date}</span>}
            </motion.div>
          ))}
        </div>
      </motion.section>
    </EditableSection>
  )
}

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

function Footer({ copyrightYear }: { copyrightYear: string }) {
  const [time, setTime] = useState(new Date())
  const [clickCount, setClickCount] = useState(0)
  const [showLogin, setShowLogin] = useState(false)
  const { isAuthenticated, logout } = useAuth()
  const { isEditMode, toggleEditMode } = useEditMode()

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
      <motion.footer
        className="footer"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.7 }}
      >
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
            <span className="footer-time">{formatTime(time)}</span>

            <SignedIn>
              <motion.button
                className={`edit-mode-btn ${isEditMode ? 'active' : ''}`}
                onClick={toggleEditMode}
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
      </motion.footer>
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
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
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
  const { theme, toggle } = useTheme()
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
    <div className="container">
      <Header theme={theme} toggleTheme={toggle} location={profileData.location} />
      <EditModeIndicator />

      <Profile
        profile={profileData}
        onEdit={() => { setEditingProfile(true); setEditingSection('profile') }}
      />
      <About
        about={aboutData}
        onEdit={() => { setEditingAbout(true); setEditingSection('about') }}
      />
      <Skills
        skills={skillsData as SkillData[]}
        onEdit={() => { setEditingSkills(true); setEditingSection('skills') }}
      />
      <Work
        projects={projectsData as ProjectData[]}
        onEdit={() => { setEditingProjects(true); setEditingSection('work') }}
      />
      <Experience
        experiences={experiencesData as ExperienceData[]}
        onEdit={() => { setEditingExperiences(true); setEditingSection('experience') }}
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
  )
}

export default function Home() {
  return (
    <EditModeProvider>
      <HomeContent />
    </EditModeProvider>
  )
}

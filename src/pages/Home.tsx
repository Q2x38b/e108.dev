import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { SignedIn, useAuth } from '../contexts/AuthContext'

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

// Data
const navLinks = ['About', 'Work', 'Experience']

const projects = [
  {
    name: 'Eagle Scout Project',
    description: 'Community service & leadership',
    year: '2025',
    details: 'Restored and improved a ceremonial area at Goforth Elementary. Planned, organized, and led volunteers through the entire project.',
    tech: ['Leadership', 'Project Management', 'Community Service'],
    url: '#'
  },
  {
    name: 'American Rocketry Challenge',
    description: 'Top 25 national finish',
    year: '2022',
    details: 'Led rocket club team to a top 25 national finish. Invited to the NASA Student Launch Program for exceptional performance.',
    tech: ['Engineering', 'Team Lead', 'NASA'],
    url: '#'
  },
  {
    name: 'Portfolio Website',
    description: 'Personal site you\'re viewing now',
    year: '2025',
    details: 'Built this portfolio from scratch with React, TypeScript..',
    tech: ['React', 'TypeScript', 'Convex'],
    url: '#'
  },
  {
    name: 'Science Fair',
    description: '1st place district • Houston qualifier',
    year: '2022',
    details: 'Won first place in division at district science fair and qualified for the Houston Science Fair competition.',
    tech: ['Research', 'Presentation', 'Analysis'],
    url: '#'
  }
]

const experiences = [
  {
    company: 'Chad T Wilson Law',
    role: 'Legal Intern',
    date: '2025 - now'
  },
  {
    company: 'Red River Cantina',
    role: 'Server & ToGo',
    date: '2024 - now'
  },
  {
    company: 'Clear Creek High School',
    role: 'Senior',
    date: '2022 - 2026'
  },
  {
    company: 'Future: UT Austin',
    role: 'Aspiring Law Student',
    date: ''
  }
]

const skills = [
  {
    title: 'Leadership',
    content: 'Eagle Scout and Senior Patrol Leader leading 50+ scouts. Water polo team captain. PALs Program mentor for 2 years. National Youth Leadership Training graduate.'
  },
  {
    title: 'Athletics',
    content: '2-time UIL Water Polo State Champion. Southwest Zone Olympic Development Team goalie. All-State tournament team. TISCA All-Region. THSCA Super Elite team.'
  },
  {
    title: 'Academics',
    content: '10 AP courses including Computer Science, Physics, Economics, and Government. 1st place district science fair. Houston Science Fair qualifier.'
  },
  {
    title: 'Technical',
    content: 'Web development with React, TypeScript, and modern frameworks. Computer programming through AP CS coursework. Microsoft Office proficiency.'
  }
]

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
function Header({ theme, toggleTheme }: { theme: 'light' | 'dark'; toggleTheme: () => void }) {
  const { isAuthenticated, logout } = useAuth()

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id.toLowerCase())
    element?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <motion.header
      className="header"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <nav className="nav">
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
      <div className="header-right">
        <div className="location">
          <span className="location-dot" />
          Houston, TX
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
        <SignedIn>
          <motion.button
            className="logout-btn"
            onClick={logout}
            whileTap={{ scale: 0.95 }}
            aria-label="Logout"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
          </motion.button>
        </SignedIn>
      </div>
    </motion.header>
  )
}

function Profile() {
  return (
    <motion.section
      className="profile"
      variants={fadeInUp}
      initial="hidden"
      animate="visible"
      transition={{ duration: 0.5, delay: 0.1 }}
    >
      <div className="profile-image-wrapper">
        <img
          src="/profile.svg"
          alt="Profile"
          className="profile-image"
        />
      </div>
      <h1 className="profile-name">Ethan Jerla</h1>
      <p className="profile-title">Student • Developer • Eagle Scout • Athlete</p>
    </motion.section>
  )
}

function About() {
  return (
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
        <p>
          I'm a student, athlete, developer, and leader who thrives on collaboration and continuous learning. When I'm not busy designing or engineering, I'm playing sports, traveling, and exploring.
        </p>
        <p>
          I'm currently working on my future and my college goals. Driven by a passion for growth and learning, I create web experiences that solve problems and create delightful experiences.
        </p>
      </div>
      <div className="social-links">
        <a href="https://github.com/Q2x38b" className="social-link" target="_blank" rel="noopener noreferrer">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
          </svg>
          GitHub
        </a>
        <a href="mailto:hello@e108.dev" className="social-link">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
            <polyline points="22,6 12,13 2,6" />
          </svg>
          Email
        </a>
      </div>
    </motion.section>
  )
}

function Skills() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  return (
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
            key={skill.title}
            title={skill.title}
            content={skill.content}
            isOpen={openIndex === index}
            onToggle={() => setOpenIndex(openIndex === index ? null : index)}
          />
        ))}
      </div>
    </motion.section>
  )
}

function Work() {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const selectedProject = projects.find(p => p.name === selectedId)

  // Lock body scroll when modal is open
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

  return (
    <>
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
        <div className="work-list">
          {projects.map((project, index) => (
            <motion.div
              key={project.name}
              layoutId={project.name}
              className="work-item"
              variants={fadeInUp}
              transition={{ duration: 0.4, delay: 0.35 + index * 0.05 }}
              onClick={() => setSelectedId(project.name)}
            >
              <div className="work-info">
                <motion.div layoutId={`title-${project.name}`} className="work-name">{project.name}</motion.div>
                <motion.div layoutId={`desc-${project.name}`} className="work-description">{project.description}</motion.div>
              </div>
              <div className="work-meta">
                <motion.span layoutId={`year-${project.name}`} className="work-year">{project.year}</motion.span>
                <span className="work-arrow">+</span>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.section>

      <AnimatePresence>
        {selectedId && selectedProject && (
          <motion.div
            className="work-modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onClick={() => setSelectedId(null)}
          >
            <motion.div
              layoutId={selectedId}
              className="work-modal"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="work-modal-header">
                <motion.h3 layoutId={`title-${selectedId}`} className="work-modal-title">{selectedProject.name}</motion.h3>
                <motion.span layoutId={`year-${selectedId}`} className="work-modal-year">{selectedProject.year}</motion.span>
              </div>
              <motion.p
                className="work-modal-details"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                {selectedProject.details}
              </motion.p>
              <motion.div
                className="work-modal-tech"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.25 }}
              >
                {selectedProject.tech.map((t) => (
                  <span key={t} className="work-modal-tag">{t}</span>
                ))}
              </motion.div>
              <motion.button
                className="work-modal-close"
                onClick={() => setSelectedId(null)}
                aria-label="Close"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1 }}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

function Experience() {
  return (
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
            key={exp.company}
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
  )
}

function LoginModal({ onClose }: { onClose: () => void }) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState(false)
  const { login } = useAuth()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (login(password)) {
      onClose()
    } else {
      setError(true)
      setPassword('')
    }
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
          />
          <button type="submit">Login</button>
        </form>
      </motion.div>
    </div>
  )
}

function Footer() {
  const [time, setTime] = useState(new Date())
  const [clickCount, setClickCount] = useState(0)
  const [showLogin, setShowLogin] = useState(false)
  const { isAuthenticated } = useAuth()

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

  return (
    <>
      <motion.footer
        className="footer"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.7 }}
      >
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

export default function Home() {
  const { theme, toggle } = useTheme()

  return (
    <div className="container">
      <Header theme={theme} toggleTheme={toggle} />
      <Profile />
      <About />
      <Skills />
      <Work />
      <Experience />
      <Footer />
    </div>
  )
}

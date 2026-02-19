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
    name: 'Project Alpha',
    description: 'Design system & component library',
    year: '2025',
    url: '#'
  },
  {
    name: 'Dashboard Pro',
    description: 'Analytics platform for startups',
    year: '2024',
    url: '#'
  },
  {
    name: 'Mobile App',
    description: 'iOS app for daily habits',
    year: '2024',
    url: '#'
  },
  {
    name: 'E-commerce Site',
    description: 'Modern shopping experience',
    year: '2023',
    url: '#'
  }
]

const experiences = [
  {
    role: 'Senior Developer',
    company: 'Tech Company',
    companyUrl: '#',
    date: '2024 - Present'
  },
  {
    role: 'Full Stack Developer',
    company: 'Startup Inc',
    companyUrl: '#',
    date: '2022 - 2024'
  },
  {
    role: 'Frontend Developer',
    company: 'Agency',
    companyUrl: '#',
    date: '2020 - 2022'
  }
]

const skills = [
  {
    title: 'Frontend Development',
    content: 'Building modern web applications with React, TypeScript, and Next.js. Creating responsive, accessible interfaces with attention to detail and performance.'
  },
  {
    title: 'Backend Development',
    content: 'Designing APIs and server-side logic with Node.js, Python, and Go. Working with databases like PostgreSQL, MongoDB, and Redis.'
  },
  {
    title: 'Design Systems',
    content: 'Creating scalable design systems and component libraries. Establishing design tokens, documentation, and patterns for consistent user experiences.'
  },
  {
    title: 'DevOps & Infrastructure',
    content: 'Setting up CI/CD pipelines, containerization with Docker, and cloud infrastructure on AWS and Vercel. Monitoring and observability.'
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
        <Link to="/blog" className="nav-link">Blog</Link>
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
          src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=120&h=120&fit=crop&crop=face"
          alt="Profile"
          className="profile-image"
        />
      </div>
      <h1 className="profile-name">Ethan Jerla</h1>
      <p className="profile-title">Student</p>
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
        <a href="#" className="social-link" target="_blank" rel="noopener noreferrer">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z" />
          </svg>
          Twitter
        </a>
        <a href="#" className="social-link" target="_blank" rel="noopener noreferrer">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
          </svg>
          GitHub
        </a>
        <a href="mailto:hello@example.com" className="social-link">
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
  return (
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
          <motion.a
            key={project.name}
            href={project.url}
            className="work-item"
            variants={fadeInUp}
            transition={{ duration: 0.4, delay: 0.35 + index * 0.05 }}
            whileHover={{ x: 2 }}
          >
            <div className="work-info">
              <div className="work-name">{project.name}</div>
              <div className="work-description">{project.description}</div>
            </div>
            <div className="work-meta">
              <span className="work-year">{project.year}</span>
              <span className="work-arrow">↗</span>
            </div>
          </motion.a>
        ))}
      </div>
    </motion.section>
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
            key={exp.role + exp.company}
            className="experience-item"
            variants={fadeInUp}
            transition={{ duration: 0.4, delay: 0.55 + index * 0.05 }}
          >
            <div>
              <div className="experience-role">{exp.role}</div>
              <div className="experience-company">
                <a href={exp.companyUrl}>{exp.company}</a>
              </div>
            </div>
            <div className="experience-date">{exp.date}</div>
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
      hour12: false,
      timeZone: 'America/Los_Angeles'
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
        <div className="footer-left">
          <span
            className="footer-text footer-secret"
            onClick={() => setClickCount(c => c + 1)}
          >
            © 2025
          </span>
          <span className="footer-dot">•</span>
          <span className="footer-text">CC BY 4.0</span>
        </div>
        <div className="footer-right">
          <span className="footer-time">{formatTime(time)} PST</span>
          <motion.button
            className="back-to-top"
            onClick={scrollToTop}
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.95 }}
            aria-label="Back to top"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 19V5M5 12l7-7 7 7" />
            </svg>
          </motion.button>
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

import { useParams, Link, useNavigate } from 'react-router-dom'
import { useQuery, useMutation } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { SignedIn, useAuth } from '../contexts/AuthContext'
import { useTheme } from './Home'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeSlug from 'rehype-slug'
import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneDark, oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { AnimatePresence, motion } from 'framer-motion'

// Text-to-speech utilities
function stripMarkdown(text: string): string {
  return text
    .replace(/```[\s\S]*?```/g, '') // Remove code blocks
    .replace(/`[^`]+`/g, '') // Remove inline code
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Links to text
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, '') // Remove images
    .replace(/#{1,6}\s*/g, '') // Remove heading markers
    .replace(/\*\*([^*]+)\*\*/g, '$1') // Bold
    .replace(/\*([^*]+)\*/g, '$1') // Italic
    .replace(/__([^_]+)__/g, '$1') // Bold underscore
    .replace(/_([^_]+)_/g, '$1') // Italic underscore
    .replace(/~~([^~]+)~~/g, '$1') // Strikethrough
    .replace(/^\s*[-*+]\s+/gm, '') // List items
    .replace(/^\s*\d+\.\s+/gm, '') // Numbered lists
    .replace(/^\s*>/gm, '') // Blockquotes
    .replace(/\[\^(\d+)\]/g, '') // Citation refs
    .replace(/\[\^(\d+)\]:.*/g, '') // Citation definitions
    .replace(/\|.*\|/g, '') // Tables
    .replace(/---+/g, '') // Horizontal rules
    .replace(/\n{3,}/g, '\n\n') // Multiple newlines
    .trim()
}

function splitIntoSections(text: string): string[] {
  const cleanText = stripMarkdown(text)
  // Split by paragraphs (double newlines) or sentences for better chunking
  const paragraphs = cleanText.split(/\n\n+/).filter(p => p.trim().length > 0)
  return paragraphs
}

interface AudioPlayerProps {
  content: string
  title: string
  onClose: () => void
}

function AudioPlayer({ content, onClose }: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentSection, setCurrentSection] = useState(0)
  const [progress, setProgress] = useState(0)
  const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null)
  const sectionsRef = useRef<string[]>([])
  const progressIntervalRef = useRef<number | null>(null)

  const sections = useMemo(() => splitIntoSections(content), [content])

  useEffect(() => {
    sectionsRef.current = sections
  }, [sections])

  // Load best available voice
  useEffect(() => {
    const loadVoices = () => {
      const availableVoices = speechSynthesis.getVoices()
      const englishVoices = availableVoices.filter(v => v.lang.startsWith('en'))

      // Prioritize: Samantha (macOS), Google voices, then Natural/Premium voices
      const sortedVoices = englishVoices.sort((a, b) => {
        const getScore = (v: SpeechSynthesisVoice) => {
          if (v.name === 'Samantha') return 100
          if (v.name.includes('Google')) return 90
          if (v.name.includes('Samantha')) return 85
          if (v.name.includes('Natural') || v.name.includes('Premium') || v.name.includes('Enhanced')) return 80
          if (v.name.includes('Karen') || v.name.includes('Daniel')) return 70
          return 0
        }
        return getScore(b) - getScore(a)
      })

      if (sortedVoices.length > 0 && !selectedVoice) {
        setSelectedVoice(sortedVoices[0])
      } else if (availableVoices.length > 0 && !selectedVoice) {
        setSelectedVoice(availableVoices[0])
      }
    }

    loadVoices()
    speechSynthesis.addEventListener('voiceschanged', loadVoices)
    return () => speechSynthesis.removeEventListener('voiceschanged', loadVoices)
  }, [selectedVoice])

  useEffect(() => {
    return () => {
      speechSynthesis.cancel()
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current)
    }
  }, [])

  const speakSection = useCallback((index: number) => {
    if (index >= sectionsRef.current.length) {
      setIsPlaying(false)
      setProgress(100)
      return
    }

    const utterance = new SpeechSynthesisUtterance(sectionsRef.current[index])
    if (selectedVoice) utterance.voice = selectedVoice
    utterance.rate = 0.95
    utterance.pitch = 1

    utterance.onend = () => {
      const nextIndex = index + 1
      if (nextIndex < sectionsRef.current.length) {
        setCurrentSection(nextIndex)
        speakSection(nextIndex)
      } else {
        setIsPlaying(false)
        setProgress(100)
      }
    }

    utterance.onerror = () => setIsPlaying(false)
    speechSynthesis.speak(utterance)
  }, [selectedVoice])

  useEffect(() => {
    if (isPlaying && sections.length > 0) {
      progressIntervalRef.current = window.setInterval(() => {
        const baseProgress = (currentSection / sections.length) * 100
        const sectionProgress = (1 / sections.length) * 100 * 0.5
        setProgress(Math.min(baseProgress + sectionProgress, 100))
      }, 100)
    } else if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current)
    }
    return () => {
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current)
    }
  }, [isPlaying, currentSection, sections.length])

  const togglePlayPause = () => {
    if (isPlaying) {
      speechSynthesis.cancel()
      setIsPlaying(false)
    } else {
      setIsPlaying(true)
      speakSection(currentSection)
    }
  }

  const seekToSection = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const percentage = (e.clientX - rect.left) / rect.width
    const sectionIndex = Math.floor(percentage * sections.length)
    speechSynthesis.cancel()
    setCurrentSection(sectionIndex)
    setProgress(percentage * 100)
    if (isPlaying) setTimeout(() => speakSection(sectionIndex), 100)
  }

  return (
    <motion.div
      className="audio-player"
      initial={{ y: 50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 50, opacity: 0 }}
      transition={{ type: 'spring', damping: 25, stiffness: 300 }}
    >
      <button className="audio-player-btn" onClick={togglePlayPause} aria-label={isPlaying ? 'Pause' : 'Play'}>
        {isPlaying ? (
          <svg viewBox="0 0 24 24" fill="currentColor">
            <rect x="6" y="4" width="4" height="16" />
            <rect x="14" y="4" width="4" height="16" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" fill="currentColor">
            <polygon points="6 4 18 12 6 20 6 4" />
          </svg>
        )}
      </button>

      <div className="audio-player-progress" onClick={seekToSection}>
        <div className="audio-player-progress-bar" style={{ width: `${progress}%` }} />
      </div>

      <button className="audio-player-close" onClick={onClose} aria-label="Close">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </motion.div>
  )
}

function formatDate(timestamp: number) {
  return new Date(timestamp).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button className="copy-btn" onClick={handleCopy} aria-label="Copy code">
      {copied ? (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
        </svg>
      )}
    </button>
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
      hour12: false
    })
  }

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
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
      </footer>
      <AnimatePresence>
        {showLogin && <LoginModal onClose={() => setShowLogin(false)} />}
      </AnimatePresence>
    </>
  )
}

// Extract citations from content
function extractCitations(content: string): { content: string; citations: { num: number; text: string }[] } {
  const citations: { num: number; text: string }[] = []
  const citationPattern = /\[\^(\d+)\]:\s*(.+?)(?=\n\[\^|\n\n|$)/gs

  let match
  while ((match = citationPattern.exec(content)) !== null) {
    citations.push({
      num: parseInt(match[1]),
      text: match[2].trim()
    })
  }

  // Remove citation definitions from content
  const cleanContent = content.replace(/\n?\[\^(\d+)\]:\s*.+?(?=\n\[\^|\n\n|$)/gs, '')

  return { content: cleanContent, citations: citations.sort((a, b) => a.num - b.num) }
}

export default function BlogPost() {
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()
  const { theme, toggle } = useTheme()
  const post = useQuery(api.posts.getBySlug, slug ? { slug } : 'skip')
  const deletePost = useMutation(api.posts.remove)
  const recordView = useMutation(api.views.recordView)
  const viewCount = useQuery(api.views.getViewCount, post ? { postId: post._id } : 'skip')
  const [linkCopied, setLinkCopied] = useState(false)
  const [showAudioPlayer, setShowAudioPlayer] = useState(false)

  // Record view on mount
  useEffect(() => {
    if (post) {
      // Get or create a visitor ID
      let visitorId = localStorage.getItem('visitor_id')
      if (!visitorId) {
        visitorId = `v-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`
        localStorage.setItem('visitor_id', visitorId)
      }
      recordView({ postId: post._id, visitorId }).catch(() => {
        // Silently fail if view recording fails
      })
    }
  }, [post, recordView])

  const copyLink = useCallback(() => {
    navigator.clipboard.writeText(window.location.href)
    setLinkCopied(true)
    setTimeout(() => setLinkCopied(false), 2000)
  }, [])

  const copyHeaderLink = useCallback((id: string) => {
    const url = `${window.location.origin}${window.location.pathname}#${id}`
    navigator.clipboard.writeText(url)
  }, [])

  const handleDelete = async () => {
    if (post && window.confirm('Delete this post?')) {
      await deletePost({ id: post._id })
      navigate('/blog')
    }
  }

  useEffect(() => {
    // Handle hash links on page load
    if (window.location.hash) {
      const id = window.location.hash.slice(1)
      const element = document.getElementById(id)
      if (element) {
        setTimeout(() => {
          element.scrollIntoView({ behavior: 'smooth' })
        }, 100)
      }
    }
  }, [post])

  const { content: cleanContent, citations } = useMemo(() => {
    if (!post) return { content: '', citations: [] }
    return extractCitations(post.content)
  }, [post])

  if (post === undefined) {
    return (
      <div className="blog-container">
        <p className="blog-loading">Loading...</p>
      </div>
    )
  }

  if (post === null) {
    return (
      <div className="blog-container">
        <p className="blog-empty">Post not found.</p>
        <Link to="/blog" className="back-link">← Back to blog</Link>
      </div>
    )
  }

  return (
    <div className="blog-container">
      <header className="blog-header">
        <nav className="breadcrumb">
          <Link to="/" className="breadcrumb-link">Home</Link>
          <span className="breadcrumb-sep">/</span>
          <Link to="/blog" className="breadcrumb-link">Writing</Link>
          <span className="breadcrumb-sep">/</span>
          <span className="breadcrumb-current">Article</span>
        </nav>
        <div className="header-right">
          <button
            className="theme-toggle"
            onClick={toggle}
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
          </button>
        </div>
      </header>

      <article className="blog-article">
        <header className="article-header">
          <h1 className="article-title">{post.title}</h1>
          <div className="article-meta">
            <span className="article-date">{formatDate(post.createdAt)}</span>
            <SignedIn>
              <Link to={`/blog/edit/${post.slug}`} className="edit-link">Edit</Link>
              <button className="delete-btn" onClick={handleDelete}>Delete</button>
            </SignedIn>
          </div>
          <div className="article-actions">
            {viewCount !== undefined && viewCount > 0 && (
              <span className="article-views">{viewCount} views</span>
            )}
            <button className="listen-btn" onClick={() => setShowAudioPlayer(true)} aria-label="Listen to article">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
              <span>Listen</span>
            </button>
            <button className="copy-link-btn" onClick={copyLink} aria-label="Copy link">
              {linkCopied ? (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                  <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                </svg>
              )}
            </button>
          </div>
        </header>

        <div className="article-content">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeSlug]}
            components={{
              h1: ({ children, id }) => (
                <h1 id={id} className="heading-with-link" onClick={() => id && copyHeaderLink(id)}>
                  {children}
                  <span className="heading-link-icon">#</span>
                </h1>
              ),
              h2: ({ children, id }) => (
                <h2 id={id} className="heading-with-link" onClick={() => id && copyHeaderLink(id)}>
                  {children}
                  <span className="heading-link-icon">#</span>
                </h2>
              ),
              h3: ({ children, id }) => (
                <h3 id={id} className="heading-with-link" onClick={() => id && copyHeaderLink(id)}>
                  {children}
                  <span className="heading-link-icon">#</span>
                </h3>
              ),
              // Handle citation references [^1]
              sup: ({ children }) => {
                const text = String(children)
                const citationMatch = text.match(/\[(\d+)\]/)
                if (citationMatch) {
                  const num = citationMatch[1]
                  return (
                    <sup>
                      <a href={`#citation-${num}`} className="citation-ref" id={`ref-${num}`}>
                        [{num}]
                      </a>
                    </sup>
                  )
                }
                return <sup>{children}</sup>
              },
              code({ className, children, ...props }) {
                const match = /language-(\w+)/.exec(className || '')
                const codeString = String(children).replace(/\n$/, '')

                if (match) {
                  return (
                    <div className="code-block">
                      <div className="code-header">
                        <span className="code-language">{match[1]}</span>
                        <CopyButton text={codeString} />
                      </div>
                      <SyntaxHighlighter
                        style={theme === 'dark' ? oneDark : oneLight}
                        language={match[1]}
                        PreTag="div"
                        customStyle={{
                          margin: 0,
                          borderRadius: '0 0 8px 8px',
                          fontSize: '0.875rem'
                        }}
                      >
                        {codeString}
                      </SyntaxHighlighter>
                    </div>
                  )
                }

                return (
                  <code className="inline-code" {...props}>
                    {children}
                  </code>
                )
              }
            }}
          >
            {cleanContent}
          </ReactMarkdown>

          {citations.length > 0 && (
            <div className="citations-section">
              <h3 className="citations-title">References</h3>
              <ol className="citations-list">
                {citations.map((citation) => (
                  <li key={citation.num} id={`citation-${citation.num}`} className="citation-item">
                    <a href={`#ref-${citation.num}`} className="citation-back">^</a>
                    <span className="citation-text">{citation.text}</span>
                  </li>
                ))}
              </ol>
            </div>
          )}
        </div>
      </article>

      <Footer />

      <AnimatePresence>
        {showAudioPlayer && (
          <AudioPlayer
            content={cleanContent}
            title={post.title}
            onClose={() => {
              speechSynthesis.cancel()
              setShowAudioPlayer(false)
            }}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

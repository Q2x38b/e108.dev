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

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
}

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

// Piper TTS types
interface PiperEngine {
  generate: (text: string, voice: string, speaker: number) => Promise<{ file: Blob }>
}

// Global engine instance to persist across component mounts
let piperEnginePromise: Promise<PiperEngine> | null = null
let piperEngineInstance: PiperEngine | null = null

// Minimal TTS engine - only uses ONNX and Phonemize runtimes
// Avoids importing PiperWebEngine which pulls in @huggingface/transformers
class MinimalPiperEngine implements PiperEngine {
  private onnxRuntime: any
  private phonemizeRuntime: any
  private voiceProvider: any
  private voiceCache: Map<string, any> = new Map()

  constructor(onnxRuntime: any, phonemizeRuntime: any, voiceProvider: any) {
    this.onnxRuntime = onnxRuntime
    this.phonemizeRuntime = phonemizeRuntime
    this.voiceProvider = voiceProvider
  }

  async generate(text: string, voice: string, speaker: number = 0): Promise<{ file: Blob }> {
    // Cache voice data to avoid re-fetching
    let voiceData = this.voiceCache.get(voice)
    if (!voiceData) {
      voiceData = await this.voiceProvider.fetch(voice)
      this.voiceCache.set(voice, voiceData)
    }

    const phonemeData = await this.phonemizeRuntime.phonemize(text, voiceData)
    const result = await this.onnxRuntime.generate(phonemeData, voiceData, speaker)
    return result
  }
}

// Suppress transformers worker errors (they don't affect TTS functionality)
let errorsSuppressed = false
function suppressTransformersErrors() {
  if (errorsSuppressed) return
  errorsSuppressed = true

  const originalError = console.error
  const originalLog = console.log
  const originalWarn = console.warn

  const shouldSuppress = (args: any[]) => {
    const msg = args[0]?.toString?.() || ''
    return msg.includes('worker sent an error') || msg.includes('Uncaught Event')
  }

  console.error = (...args) => {
    if (shouldSuppress(args)) return
    originalError.apply(console, args)
  }
  console.log = (...args) => {
    if (shouldSuppress(args)) return
    originalLog.apply(console, args)
  }
  console.warn = (...args) => {
    if (shouldSuppress(args)) return
    originalWarn.apply(console, args)
  }
}

async function initPiperEngine(): Promise<PiperEngine> {
  if (piperEngineInstance) return piperEngineInstance
  if (piperEnginePromise) return piperEnginePromise

  piperEnginePromise = (async () => {
    // Suppress worker errors before importing piper-tts-web
    suppressTransformersErrors()

    const { OnnxWebRuntime, PhonemizeWebRuntime, HuggingFaceVoiceProvider } = await import('piper-tts-web')

    const onnxRuntime = new OnnxWebRuntime({ numThreads: 1 })
    const phonemizeRuntime = new PhonemizeWebRuntime()
    const voiceProvider = new HuggingFaceVoiceProvider()

    const engine = new MinimalPiperEngine(onnxRuntime, phonemizeRuntime, voiceProvider)
    piperEngineInstance = engine
    return engine
  })()

  return piperEnginePromise
}

interface AudioPlayerProps {
  content: string
  title: string
  onClose: () => void
}

function AudioPlayer({ content, onClose }: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [loadingProgress, setLoadingProgress] = useState('')
  const [progress, setProgress] = useState(0)
  const [duration, setDuration] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)

  const audioRef = useRef<HTMLAudioElement | null>(null)
  const audioUrlRef = useRef<string | null>(null)
  const engineRef = useRef<PiperEngine | null>(null)

  // Clean text for TTS
  const cleanContent = useMemo(() => stripMarkdown(content), [content])

  // Always preload the Piper TTS engine on mount
  useEffect(() => {
    setLoadingProgress('Initializing voice engine...')
    initPiperEngine().then(engine => {
      engineRef.current = engine
      setLoadingProgress('')
    }).catch(() => setLoadingProgress(''))
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current = null
      }
      if (audioUrlRef.current) {
        URL.revokeObjectURL(audioUrlRef.current)
        audioUrlRef.current = null
      }
    }
  }, [])

  // Generate and play audio
  const generateAndPlay = useCallback(async () => {
    if (isLoading) return

    try {
      setIsLoading(true)
      setLoadingProgress('Loading voice model...')

      // Get or initialize engine
      if (!engineRef.current) {
        engineRef.current = await initPiperEngine()
      }

      setLoadingProgress('Generating audio...')
      const response = await engineRef.current.generate(cleanContent, 'en_US-kusal-medium', 0)

      // Cleanup old audio URL
      if (audioUrlRef.current) {
        URL.revokeObjectURL(audioUrlRef.current)
      }

      // Create new audio element
      const url = URL.createObjectURL(response.file)
      audioUrlRef.current = url

      const audio = new Audio(url)
      audioRef.current = audio

      audio.onloadedmetadata = () => {
        setDuration(audio.duration)
        setIsLoading(false)
        setLoadingProgress('')
        audio.play()
        setIsPlaying(true)
      }

      audio.ontimeupdate = () => {
        setCurrentTime(audio.currentTime)
        setProgress((audio.currentTime / audio.duration) * 100)
      }

      audio.onended = () => {
        setIsPlaying(false)
        setProgress(100)
      }

      audio.onerror = () => {
        setIsLoading(false)
        setLoadingProgress('Error playing audio')
        setIsPlaying(false)
      }

    } catch (error) {
      console.error('TTS error:', error)
      setIsLoading(false)
      setLoadingProgress('Error generating audio')
    }
  }, [cleanContent, isLoading])

  const togglePlayPause = useCallback(() => {
    if (isLoading) return

    if (audioRef.current && audioUrlRef.current) {
      // Audio already generated, just play/pause
      if (isPlaying) {
        audioRef.current.pause()
        setIsPlaying(false)
      } else {
        audioRef.current.play()
        setIsPlaying(true)
      }
    } else {
      // Generate audio first
      generateAndPlay()
    }
  }, [isPlaying, isLoading, generateAndPlay])

  const handleSeek = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!audioRef.current || !duration) return

    const rect = e.currentTarget.getBoundingClientRect()
    const percentage = (e.clientX - rect.left) / rect.width
    const newTime = percentage * duration

    audioRef.current.currentTime = newTime
    setCurrentTime(newTime)
    setProgress(percentage * 100)
  }, [duration])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <motion.div
      className="audio-player"
      initial={{ y: 50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 50, opacity: 0 }}
      transition={{ type: 'spring', damping: 25, stiffness: 300 }}
    >
      <button
        className="audio-player-btn"
        onClick={togglePlayPause}
        aria-label={isLoading ? 'Loading' : isPlaying ? 'Pause' : 'Play'}
        disabled={isLoading}
      >
        {isLoading ? (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="loading-spinner">
            <circle cx="12" cy="12" r="10" strokeDasharray="32" strokeLinecap="round" />
          </svg>
        ) : isPlaying ? (
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

      <div className="audio-player-middle">
        {loadingProgress ? (
          <span className="audio-player-loading-text">{loadingProgress}</span>
        ) : (
          <>
            <div className="audio-player-progress" onClick={handleSeek}>
              <div className="audio-player-progress-bar" style={{ width: `${progress}%` }} />
            </div>
            {duration > 0 && (
              <span className="audio-player-time">
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
            )}
          </>
        )}
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
  }).toUpperCase()
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

interface ShareModalProps {
  title: string
  subtitle?: string
  titleImage?: string
  onClose: () => void
  onCopy: () => void
}

function ShareModal({ title, subtitle, titleImage, onClose, onCopy }: ShareModalProps) {
  const [showMore, setShowMore] = useState(false)
  const url = window.location.href

  const handleCopyLink = () => {
    onCopy()
    onClose()
  }

  const handlePreviewClick = () => {
    onCopy()
    onClose()
  }

  const shareToFacebook = () => {
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank', 'width=600,height=400')
  }

  const shareToEmail = () => {
    window.location.href = `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(url)}`
  }

  const shareToTwitter = () => {
    window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`, '_blank', 'width=600,height=400')
  }

  const shareToLinkedIn = () => {
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`, '_blank', 'width=600,height=400')
  }

  const shareToReddit = () => {
    window.open(`https://reddit.com/submit?url=${encodeURIComponent(url)}&title=${encodeURIComponent(title)}`, '_blank', 'width=600,height=400')
  }

  const shareToBluesky = () => {
    window.open(`https://bsky.app/intent/compose?text=${encodeURIComponent(title + ' ' + url)}`, '_blank', 'width=600,height=400')
  }

  const shareToHackerNews = () => {
    window.open(`https://news.ycombinator.com/submitlink?u=${encodeURIComponent(url)}&t=${encodeURIComponent(title)}`, '_blank', 'width=600,height=400')
  }

  return (
    <motion.div
      className="share-modal-overlay"
      onClick={onClose}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="share-modal"
        onClick={(e) => e.stopPropagation()}
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
      >
        <div className="share-modal-header">
          <h2>Share this post</h2>
          <button className="share-modal-close" onClick={onClose} aria-label="Close">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <button className="share-preview-card" onClick={handlePreviewClick}>
          {titleImage ? (
            <img src={titleImage} alt="" className="share-preview-image" />
          ) : (
            <div className="share-preview-placeholder" />
          )}
          <div className="share-preview-info">
            <div className="share-preview-source">
              <img src="/profile.png" alt="" className="share-preview-icon" />
              <span>Ethan Jerla</span>
            </div>
            <h3 className="share-preview-title">{title}</h3>
          </div>
        </button>

        <div className="share-options">
          <button className="share-option" onClick={handleCopyLink}>
            <div className="share-option-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
              </svg>
            </div>
            <span>Copy link</span>
          </button>

          <button className="share-option" onClick={shareToFacebook}>
            <div className="share-option-icon">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
            </div>
            <span>Facebook</span>
          </button>

          <button className="share-option" onClick={shareToEmail}>
            <div className="share-option-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="2" y="4" width="20" height="16" rx="2" />
                <path d="M22 6l-10 7L2 6" />
              </svg>
            </div>
            <span>Email</span>
          </button>

          <div className="share-option-wrapper">
            <button className="share-option" onClick={() => setShowMore(!showMore)}>
              <div className="share-option-icon">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <circle cx="5" cy="12" r="2" />
                  <circle cx="12" cy="12" r="2" />
                  <circle cx="19" cy="12" r="2" />
                </svg>
              </div>
              <span>More</span>
            </button>

            <AnimatePresence>
              {showMore && (
                <motion.div
                  className="share-more-dropdown"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <button onClick={shareToBluesky}>
                    <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
                      <path d="M12 10.8c-1.087-2.114-4.046-6.053-6.798-7.995C2.566.944 1.561 1.266.902 1.565.139 1.908 0 3.08 0 3.768c0 .69.378 5.65.624 6.479.815 2.736 3.713 3.66 6.383 3.364.136-.02.275-.039.415-.056-.138.022-.276.04-.415.056-3.912.58-7.387 2.005-2.83 7.078 5.013 5.19 6.87-1.113 7.823-4.308.953 3.195 2.05 9.271 7.733 4.308 4.267-4.308 1.172-6.498-2.74-7.078a8.741 8.741 0 0 1-.415-.056c.14.017.279.036.415.056 2.67.297 5.568-.628 6.383-3.364.246-.828.624-5.79.624-6.478 0-.69-.139-1.861-.902-2.206-.659-.298-1.664-.62-4.3 1.24C16.046 4.748 13.087 8.687 12 10.8Z"/>
                    </svg>
                    <span>Bluesky</span>
                  </button>
                  <button onClick={shareToTwitter}>
                    <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                    </svg>
                    <span>X (Twitter)</span>
                  </button>
                  <button onClick={shareToLinkedIn}>
                    <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
                      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                    </svg>
                    <span>LinkedIn</span>
                  </button>
                  <button onClick={shareToReddit}>
                    <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
                      <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z"/>
                    </svg>
                    <span>Reddit</span>
                  </button>
                  <button onClick={shareToHackerNews}>
                    <div className="share-hn-icon">Y</div>
                    <span>Hacker News</span>
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    </motion.div>
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

// Extract headings from markdown content (H2 only for TOC - sections)
function extractHeadings(content: string): { id: string; text: string; level: number }[] {
  const headingRegex = /^(##)\s+(.+)$/gm
  const headings: { id: string; text: string; level: number }[] = []
  let match

  while ((match = headingRegex.exec(content)) !== null) {
    const level = match[1].length
    const text = match[2].trim()
    const id = text
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
    headings.push({ id, text, level })
  }

  return headings
}

// Table of Contents Sidebar Component
interface TOCSidebarProps {
  headings: { id: string; text: string; level: number }[]
  isOpen: boolean
  onToggle: () => void
  activeHeadingId: string | null
}

function TOCSidebar({ headings, isOpen, onToggle, activeHeadingId }: TOCSidebarProps) {
  const linesRef = useRef<HTMLDivElement>(null)
  const isDraggingRef = useRef(false)
  const hasDraggedRef = useRef(false)
  const startYRef = useRef(0)
  const startScrollRef = useRef(0)

  const scrollToHeading = (id: string) => {
    const element = document.getElementById(id)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
      onToggle() // Close after clicking
    }
  }

  // Get the display headings for the lines
  const displayHeadings = headings.filter(h => h.level <= 2).slice(0, 6)

  // Handle drag to scroll with snap to headings
  const handleDragStart = useCallback((clientY: number) => {
    isDraggingRef.current = true
    hasDraggedRef.current = false
    startYRef.current = clientY
    startScrollRef.current = window.scrollY
    document.body.style.userSelect = 'none'
  }, [])

  const handleDragMove = useCallback((clientY: number) => {
    if (!isDraggingRef.current || !linesRef.current) return

    const deltaY = clientY - startYRef.current

    // Only consider it a drag if moved more than 5 pixels
    if (Math.abs(deltaY) > 5) {
      hasDraggedRef.current = true
    }

    const linesRect = linesRef.current.getBoundingClientRect()
    const relativeY = clientY - linesRect.top
    const progress = Math.max(0, Math.min(1, relativeY / linesRect.height))

    // Map progress to heading index
    const headingIndex = Math.round(progress * (displayHeadings.length - 1))
    const targetHeading = displayHeadings[headingIndex]

    if (targetHeading) {
      const element = document.getElementById(targetHeading.id)
      if (element) {
        const targetScroll = element.offsetTop - 100 // Offset for header
        window.scrollTo({ top: targetScroll, behavior: 'auto' })
      }
    }
  }, [displayHeadings])

  const handleDragEnd = useCallback(() => {
    isDraggingRef.current = false
    document.body.style.userSelect = ''

    // Snap to nearest heading on release
    if (hasDraggedRef.current && displayHeadings.length > 0) {
      const scrollPosition = window.scrollY + 150
      let closestHeading = displayHeadings[0]
      let closestDistance = Infinity

      for (const heading of displayHeadings) {
        const element = document.getElementById(heading.id)
        if (element) {
          const distance = Math.abs(element.offsetTop - scrollPosition)
          if (distance < closestDistance) {
            closestDistance = distance
            closestHeading = heading
          }
        }
      }

      const element = document.getElementById(closestHeading.id)
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    }
  }, [displayHeadings])

  // Mouse events
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    handleDragStart(e.clientY)
  }, [handleDragStart])

  // Touch events
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    handleDragStart(e.touches[0].clientY)
  }, [handleDragStart])

  // Global mouse/touch move and end
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => handleDragMove(e.clientY)
    const handleMouseUp = () => handleDragEnd()
    const handleTouchMove = (e: TouchEvent) => {
      if (isDraggingRef.current) {
        e.preventDefault()
        handleDragMove(e.touches[0].clientY)
      }
    }
    const handleTouchEnd = () => handleDragEnd()

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
    document.addEventListener('touchmove', handleTouchMove, { passive: false })
    document.addEventListener('touchend', handleTouchEnd)

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
      document.removeEventListener('touchmove', handleTouchMove)
      document.removeEventListener('touchend', handleTouchEnd)
    }
  }, [handleDragMove, handleDragEnd])

  return (
    <>
      <div
        className="toc-toggle-btn-minimal"
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        onClick={() => {
          // Only toggle if didn't drag (clicked)
          if (!hasDraggedRef.current) {
            onToggle()
          }
          hasDraggedRef.current = false
        }}
        role="button"
        tabIndex={0}
        aria-label="Toggle table of contents or drag to scroll"
      >
        <div className="toc-lines-minimal" ref={linesRef}>
          {displayHeadings.map((heading, i) => (
            <span
              key={i}
              className={`toc-line-minimal ${activeHeadingId === heading.id ? 'active' : ''}`}
            />
          ))}
        </div>
      </div>

      <AnimatePresence>
        {isOpen && linesRef.current && (
          <motion.div
            className="toc-popup"
            initial={{ opacity: 0, scale: 0.95, y: "-50%" }}
            animate={{ opacity: 1, scale: 1, y: "-50%" }}
            exit={{ opacity: 0, scale: 0.95, y: "-50%" }}
            transition={{ duration: 0.15 }}
            style={{
              top: linesRef.current.getBoundingClientRect().top +
                   linesRef.current.getBoundingClientRect().height / 2
            }}
          >
            <div className="toc-popup-header">CONTENTS</div>
            <nav className="toc-popup-nav">
              {headings.map((heading, index) => (
                <button
                  key={index}
                  className={`toc-popup-item ${heading.level > 1 ? 'toc-popup-item-sub' : ''} ${activeHeadingId === heading.id ? 'active' : ''}`}
                  onClick={() => scrollToHeading(heading.id)}
                >
                  {heading.text}
                </button>
              ))}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

// More Articles Section
interface Post {
  _id: string
  title: string
  subtitle?: string
  slug: string
  shortId?: string
  titleImage?: string
  createdAt: number
  viewCount?: number
}

interface MoreArticlesProps {
  currentPostId: string
  posts: Post[]
}

function MoreArticles({ currentPostId, posts }: MoreArticlesProps) {
  const [activeTab, setActiveTab] = useState<'top' | 'latest' | 'discussions'>('top')
  const navigate = useNavigate()

  const filteredPosts = useMemo(() => {
    const otherPosts = posts.filter(p => p._id !== currentPostId)

    switch (activeTab) {
      case 'top':
        return [...otherPosts].sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0)).slice(0, 3)
      case 'latest':
        return [...otherPosts].sort((a, b) => b.createdAt - a.createdAt).slice(0, 3)
      case 'discussions':
        return otherPosts.slice(0, 3)
      default:
        return otherPosts.slice(0, 3)
    }
  }, [posts, currentPostId, activeTab])

  const formatArticleDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }).toUpperCase()
  }

  if (filteredPosts.length === 0) return null

  return (
    <section className="more-articles">
      <div className="more-articles-tabs-container">
        <div className="more-articles-tabs">
          <button
            className={`more-articles-tab ${activeTab === 'top' ? 'active' : ''}`}
            onClick={() => setActiveTab('top')}
          >
            Top
          </button>
          <button
            className={`more-articles-tab ${activeTab === 'latest' ? 'active' : ''}`}
            onClick={() => setActiveTab('latest')}
          >
            Latest
          </button>
          <button
            className={`more-articles-tab ${activeTab === 'discussions' ? 'active' : ''}`}
            onClick={() => setActiveTab('discussions')}
          >
            Discussions
          </button>
        </div>
      </div>

      <div className="more-articles-divider" />

      <div className="more-articles-list">
        {filteredPosts.map((post) => (
          <Link
            key={post._id}
            to={`/blog/${post.shortId}`}
            className="more-article-item"
          >
            <div className="more-article-content">
              <h3 className="more-article-title">{post.title}</h3>
              {post.subtitle && (
                <p className="more-article-subtitle">{post.subtitle}</p>
              )}
              <span className="more-article-meta">
                {formatArticleDate(post.createdAt)} · ETHAN JERLA
              </span>
            </div>
            {post.titleImage && (
              <img src={post.titleImage} alt="" className="more-article-image" />
            )}
          </Link>
        ))}
      </div>

      <button
        className="see-all-btn"
        onClick={() => navigate('/blog')}
      >
        See all
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M9 18l6-6-6-6" />
        </svg>
      </button>
    </section>
  )
}

export default function BlogPost() {
  const { shortId } = useParams<{ shortId: string }>()
  const navigate = useNavigate()
  const { theme, toggle } = useTheme()
  const post = useQuery(api.posts.getByShortId, shortId ? { shortId } : 'skip')
  const allPosts = useQuery(api.posts.listWithViews)
  const deletePost = useMutation(api.posts.remove)
  const recordView = useMutation(api.views.recordView)
  const viewCount = useQuery(api.views.getViewCount, post ? { postId: post._id } : 'skip')
  const [linkCopied, setLinkCopied] = useState(false)
  const [showAudioPlayer, setShowAudioPlayer] = useState(false)
  const [showShareModal, setShowShareModal] = useState(false)
  const [tocOpen, setTocOpen] = useState(false)
  const [activeHeadingId, setActiveHeadingId] = useState<string | null>(null)

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

  const headings = useMemo(() => {
    if (!post) return []
    return extractHeadings(post.content)
  }, [post])

  // Track active heading on scroll with RAF throttling
  useEffect(() => {
    if (headings.length === 0) return

    let rafId: number | null = null
    let lastActiveId: string | null = null

    const updateActiveHeading = () => {
      const scrollPosition = window.scrollY + 150

      let currentHeading: string | null = null
      for (const heading of headings) {
        const element = document.getElementById(heading.id)
        if (element && element.offsetTop <= scrollPosition) {
          currentHeading = heading.id
        }
      }

      if (!currentHeading && headings.length > 0) {
        currentHeading = headings[0].id
      }

      // Only update state if the active heading changed
      if (currentHeading !== lastActiveId) {
        lastActiveId = currentHeading
        setActiveHeadingId(currentHeading)
      }
    }

    const handleScroll = () => {
      if (rafId) return
      rafId = requestAnimationFrame(() => {
        updateActiveHeading()
        rafId = null
      })
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    updateActiveHeading()

    return () => {
      window.removeEventListener('scroll', handleScroll)
      if (rafId) cancelAnimationFrame(rafId)
    }
  }, [headings])

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
    <div className="blog-container blog-post-layout">
      {/* Table of Contents Sidebar */}
      {headings.length > 0 && (
        <TOCSidebar
          headings={headings}
          isOpen={tocOpen}
          onToggle={() => setTocOpen(!tocOpen)}
          activeHeadingId={activeHeadingId}
        />
      )}

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

      <motion.article
        className="blog-article"
        variants={fadeInUp}
        initial="hidden"
        animate="visible"
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <header className="article-header-new">
          <h1 className="article-title-main">{post.title}</h1>
          {post.subtitle && (
            <p className="article-subtitle">{post.subtitle}</p>
          )}

          <div className="article-author-row">
            <img
              src="/profile.png"
              alt="Ethan Jerla"
              className="article-author-image article-author-image-bg"
            />
            <div className="article-author-info">
              <span className="article-author-name">ETHAN JERLA</span>
              <span className="article-author-date">{formatDate(post.createdAt)}</span>
            </div>
            <div className="article-author-actions">
              <button className="listen-btn-small" onClick={() => setShowAudioPlayer(true)} aria-label="Listen to article">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <polygon points="5 3 19 12 5 21 5 3" />
                </svg>
              </button>
              <button className={`share-btn-icon ${linkCopied ? 'copied' : ''}`} onClick={() => setShowShareModal(true)} aria-label="Share">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="18" cy="5" r="3" />
                  <circle cx="6" cy="12" r="3" />
                  <circle cx="18" cy="19" r="3" />
                  <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                  <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                </svg>
              </button>
              <div className="article-views-pill">
                {viewCount || 0} views
              </div>
            </div>
          </div>

          <SignedIn>
            <div className="article-admin-actions">
              <Link to={`/blog/edit/${post.shortId}`} className="edit-link">Edit</Link>
              <button className="delete-btn" onClick={handleDelete}>Delete</button>
            </div>
          </SignedIn>
        </header>

        <div className="article-divider" />

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

      </motion.article>

      {/* More Articles Section */}
      {allPosts && (
        <MoreArticles
          currentPostId={post._id}
          posts={allPosts as Post[]}
        />
      )}

      <Footer />

      <AnimatePresence>
        {showAudioPlayer && (
          <AudioPlayer
            content={cleanContent}
            title={post.title}
            onClose={() => setShowAudioPlayer(false)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showShareModal && (
          <ShareModal
            title={post.title}
            subtitle={post.subtitle}
            titleImage={post.titleImage}
            onClose={() => setShowShareModal(false)}
            onCopy={copyLink}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {linkCopied && (
          <motion.div
            className="toast"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.2 }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            Copied
          </motion.div>
        )}
      </AnimatePresence>

      <div className="blog-blur-bottom" />
    </div>
  )
}

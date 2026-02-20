import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery, useMutation } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { SignedIn, SignedOut, useAuth } from '../contexts/AuthContext'
import { useTheme } from './Home'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeSlug from 'rehype-slug'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneDark, oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { AnimatePresence, motion } from 'framer-motion'

function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
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
      <footer className="footer">
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
      </footer>
      <AnimatePresence>
        {showLogin && <LoginModal onClose={() => setShowLogin(false)} />}
      </AnimatePresence>
    </>
  )
}

// Floating toolbar component
function FloatingToolbar({
  position,
  onFormat,
  onAddCitation,
  visible
}: {
  position: { top: number; left: number }
  onFormat: (type: string) => void
  onAddCitation: () => void
  visible: boolean
}) {
  if (!visible) return null

  return (
    <div
      className="floating-toolbar"
      style={{ top: position.top, left: position.left }}
    >
      <button onClick={() => onFormat('bold')} title="Bold">
        <strong>B</strong>
      </button>
      <button onClick={() => onFormat('italic')} title="Italic">
        <em>I</em>
      </button>
      <button onClick={() => onFormat('strikethrough')} title="Strikethrough">
        <s>S</s>
      </button>
      <span className="toolbar-divider-v" />
      <button onClick={() => onFormat('link')} title="Link">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
          <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
          <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
        </svg>
      </button>
      <button onClick={() => onFormat('code')} title="Code">
        <code>`</code>
      </button>
      <button onClick={onAddCitation} title="Add Citation">
        <sup>[1]</sup>
      </button>
    </div>
  )
}

// Citation modal
function CitationModal({
  onClose,
  onAdd,
  citationNum
}: {
  onClose: () => void
  onAdd: (text: string) => void
  citationNum: number
}) {
  const [text, setText] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (text.trim()) {
      onAdd(text.trim())
    }
  }

  return (
    <div className="citation-modal-overlay" onClick={onClose}>
      <div className="citation-modal" onClick={(e) => e.stopPropagation()}>
        <h3>Add Citation [{citationNum}]</h3>
        <form onSubmit={handleSubmit}>
          <textarea
            placeholder="Enter citation text (e.g., source, author, URL)"
            value={text}
            onChange={(e) => setText(e.target.value)}
            autoFocus
            rows={3}
          />
          <div className="citation-modal-actions">
            <button type="button" onClick={onClose} className="cancel-btn">Cancel</button>
            <button type="submit" className="save-btn" disabled={!text.trim()}>Add</button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function BlogEditor() {
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()
  const { theme, toggle } = useTheme()
  const isEditing = !!slug
  const editorRef = useRef<HTMLTextAreaElement>(null)

  const existingPost = useQuery(
    api.posts.getBySlug,
    slug ? { slug } : 'skip'
  )

  const createPost = useMutation(api.posts.create)
  const updatePost = useMutation(api.posts.update)

  const [title, setTitle] = useState('')
  const [subtitle, setSubtitle] = useState('')
  const [content, setContent] = useState('')
  const [customSlug, setCustomSlug] = useState('')
  const [titleImage, setTitleImage] = useState('')
  const [published, setPublished] = useState(false)
  const [saving, setSaving] = useState(false)

  // Floating toolbar state
  const [toolbarVisible, setToolbarVisible] = useState(false)
  const [toolbarPosition, setToolbarPosition] = useState({ top: 0, left: 0 })
  const [selection, setSelection] = useState({ start: 0, end: 0, text: '' })

  // Citation modal state
  const [showCitationModal, setShowCitationModal] = useState(false)
  const [citations, setCitations] = useState<{ num: number; text: string }[]>([])

  useEffect(() => {
    if (existingPost) {
      setTitle(existingPost.title)
      setSubtitle(existingPost.subtitle || '')
      setContent(existingPost.content)
      setCustomSlug(existingPost.slug)
      setTitleImage(existingPost.titleImage || '')
      setPublished(existingPost.published)

      // Extract existing citations
      const citationPattern = /\[\^(\d+)\]:\s*(.+?)(?=\n\[\^|\n\n|$)/gs
      const existingCitations: { num: number; text: string }[] = []
      let match
      while ((match = citationPattern.exec(existingPost.content)) !== null) {
        existingCitations.push({
          num: parseInt(match[1]),
          text: match[2].trim()
        })
      }
      setCitations(existingCitations)
    }
  }, [existingPost])

  const handleSave = async () => {
    if (!title.trim() || !content.trim()) {
      alert('Title and content are required')
      return
    }

    setSaving(true)
    const postSlug = customSlug || slugify(title)

    // Build content with citations at the end
    let finalContent = content
    if (citations.length > 0) {
      // Remove existing citation definitions
      finalContent = content.replace(/\n?\[\^(\d+)\]:\s*.+?(?=\n\[\^|\n\n|$)/gs, '')
      // Add citations at the end
      const citationDefs = citations
        .sort((a, b) => a.num - b.num)
        .map(c => `[^${c.num}]: ${c.text}`)
        .join('\n')
      finalContent = finalContent.trimEnd() + '\n\n' + citationDefs
    }

    try {
      if (isEditing && existingPost) {
        await updatePost({
          id: existingPost._id,
          title,
          subtitle: subtitle || undefined,
          slug: postSlug,
          content: finalContent,
          titleImage: titleImage || undefined,
          published
        })
      } else {
        await createPost({
          title,
          subtitle: subtitle || undefined,
          slug: postSlug,
          content: finalContent,
          titleImage: titleImage || undefined,
          published
        })
      }
      navigate(`/blog/${postSlug}`)
    } catch (error) {
      console.error('Error saving post:', error)
      alert('Error saving post')
    } finally {
      setSaving(false)
    }
  }

  const handleTextSelect = useCallback(() => {
    const textarea = editorRef.current
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd

    if (start !== end) {
      const selectedText = textarea.value.substring(start, end)
      setSelection({ start, end, text: selectedText })

      // Calculate position for floating toolbar
      const rect = textarea.getBoundingClientRect()
      const lines = textarea.value.substring(0, start).split('\n')
      const lineHeight = 24 // Approximate line height
      const topOffset = lines.length * lineHeight - textarea.scrollTop

      setToolbarPosition({
        top: rect.top + topOffset - 50,
        left: rect.left + 100
      })
      setToolbarVisible(true)
    } else {
      setToolbarVisible(false)
    }
  }, [])

  const handleFormat = useCallback((type: string) => {
    const textarea = editorRef.current
    if (!textarea) return

    const { start, end, text } = selection
    let newText = ''
    let cursorOffset = 0

    switch (type) {
      case 'bold':
        newText = `**${text}**`
        cursorOffset = 2
        break
      case 'italic':
        newText = `*${text}*`
        cursorOffset = 1
        break
      case 'strikethrough':
        newText = `~~${text}~~`
        cursorOffset = 2
        break
      case 'code':
        newText = `\`${text}\``
        cursorOffset = 1
        break
      case 'link':
        newText = `[${text}](url)`
        cursorOffset = text.length + 3
        break
      default:
        newText = text
    }

    const before = content.substring(0, start)
    const after = content.substring(end)
    setContent(before + newText + after)
    setToolbarVisible(false)

    // Restore focus and cursor position
    setTimeout(() => {
      textarea.focus()
      const newPos = start + newText.length
      textarea.setSelectionRange(newPos, newPos)
    }, 0)
  }, [content, selection])

  const handleAddCitation = useCallback(() => {
    setToolbarVisible(false)
    setShowCitationModal(true)
  }, [])

  const insertCitation = useCallback((citationText: string) => {
    const textarea = editorRef.current
    if (!textarea) return

    const newNum = citations.length + 1
    setCitations([...citations, { num: newNum, text: citationText }])

    // Insert citation reference at cursor
    const cursor = textarea.selectionStart
    const before = content.substring(0, cursor)
    const after = content.substring(cursor)
    const citationRef = `[^${newNum}]`

    setContent(before + citationRef + after)
    setShowCitationModal(false)

    // Restore focus
    setTimeout(() => {
      textarea.focus()
      const newPos = cursor + citationRef.length
      textarea.setSelectionRange(newPos, newPos)
    }, 0)
  }, [content, citations])

  const insertMarkdown = (syntax: string, wrap = false) => {
    const textarea = editorRef.current
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const text = textarea.value
    const selected = text.substring(start, end)

    let newText: string
    let cursorPos: number

    if (wrap && selected) {
      newText = text.substring(0, start) + syntax + selected + syntax + text.substring(end)
      cursorPos = end + syntax.length * 2
    } else {
      newText = text.substring(0, start) + syntax + text.substring(end)
      cursorPos = start + syntax.length
    }

    setContent(newText)
    setTimeout(() => {
      textarea.focus()
      textarea.setSelectionRange(cursorPos, cursorPos)
    }, 0)
  }

  // Extract content without citation definitions for preview
  const previewContent = content.replace(/\n?\[\^(\d+)\]:\s*.+?(?=\n\[\^|\n\n|$)/gs, '')

  return (
    <div className="blog-container editor-container">
      <SignedOut>
        <div className="auth-required">
          <p>You must be signed in to create or edit posts.</p>
          <Link to="/blog" className="back-link">← Back to blog</Link>
        </div>
      </SignedOut>

      <SignedIn>
        <header className="blog-header">
          <nav className="breadcrumb">
            <Link to="/" className="breadcrumb-link">Home</Link>
            <span className="breadcrumb-sep">/</span>
            <Link to="/blog" className="breadcrumb-link">Writing</Link>
            <span className="breadcrumb-sep">/</span>
            <span className="breadcrumb-current">{isEditing ? 'Edit' : 'New'}</span>
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

        <div className="editor-main">
          <div className="editor-fields">
            <input
              type="text"
              className="editor-title-input"
              placeholder="Post title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <input
              type="text"
              className="editor-subtitle-input"
              placeholder="Subtitle (optional, e.g., 'Lesson #36: noticing the unnoticed')"
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
            />
            <input
              type="text"
              className="editor-slug-input"
              placeholder="custom-slug (optional)"
              value={customSlug}
              onChange={(e) => setCustomSlug(e.target.value)}
            />
            <div className="editor-image-field">
              <input
                type="text"
                className="editor-image-input"
                placeholder="Title image URL (optional)"
                value={titleImage}
                onChange={(e) => setTitleImage(e.target.value)}
              />
              {titleImage && (
                <div className="editor-image-preview">
                  <img src={titleImage} alt="Title preview" />
                  <button
                    type="button"
                    className="editor-image-remove"
                    onClick={() => setTitleImage('')}
                    aria-label="Remove image"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="editor-toolbar">
            <button onClick={() => insertMarkdown('**', true)} title="Bold"><strong>B</strong></button>
            <button onClick={() => insertMarkdown('*', true)} title="Italic"><em>I</em></button>
            <button onClick={() => insertMarkdown('~~', true)} title="Strikethrough"><s>S</s></button>
            <span className="toolbar-divider" />
            <button onClick={() => insertMarkdown('# ')} title="Heading 1">H1</button>
            <button onClick={() => insertMarkdown('## ')} title="Heading 2">H2</button>
            <button onClick={() => insertMarkdown('### ')} title="Heading 3">H3</button>
            <span className="toolbar-divider" />
            <button onClick={() => insertMarkdown('- ')} title="List">•</button>
            <button onClick={() => insertMarkdown('1. ')} title="Numbered list">1.</button>
            <button onClick={() => insertMarkdown('> ')} title="Quote">"</button>
            <span className="toolbar-divider" />
            <button onClick={() => insertMarkdown('[text](url)')} title="Link">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14" style={{ display: 'inline' }}>
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
              </svg>
            </button>
            <button onClick={() => insertMarkdown('`', true)} title="Inline code">`</button>
            <button onClick={() => insertMarkdown('```\n\n```')} title="Code block">{'</>'}</button>
            <span className="toolbar-divider" />
            <button onClick={() => setShowCitationModal(true)} title="Add Citation">
              <sup>[n]</sup>
            </button>
          </div>

          <div className="editor-split">
            <div className="editor-pane">
              <textarea
                ref={editorRef}
                id="editor"
                className="editor-textarea"
                placeholder="Write your post in Markdown..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                onSelect={handleTextSelect}
                onBlur={() => setTimeout(() => setToolbarVisible(false), 200)}
              />
            </div>

            <div className="preview-pane">
              <div className="preview-label">Preview</div>
              <div className="editor-preview article-content">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  rehypePlugins={[rehypeSlug]}
                  components={{
                    code({ className, children, ...props }) {
                      const match = /language-(\w+)/.exec(className || '')
                      const codeString = String(children).replace(/\n$/, '')

                      if (match) {
                        return (
                          <div className="code-block">
                            <div className="code-header">
                              <span className="code-language">{match[1]}</span>
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
                  {previewContent || '*Start typing to see preview...*'}
                </ReactMarkdown>

                {citations.length > 0 && (
                  <div className="citations-section">
                    <h3 className="citations-title">References</h3>
                    <ol className="citations-list">
                      {citations.map((citation) => (
                        <li key={citation.num} className="citation-item">
                          <span className="citation-text">{citation.text}</span>
                        </li>
                      ))}
                    </ol>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="editor-actions">
            <label className="publish-toggle">
              <input
                type="checkbox"
                checked={published}
                onChange={(e) => setPublished(e.target.checked)}
              />
              <span>Publish</span>
            </label>
            <div className="editor-buttons">
              <button className="cancel-btn" onClick={() => navigate('/blog')}>
                Cancel
              </button>
              <button className="save-btn" onClick={handleSave} disabled={saving}>
                {saving ? 'Saving...' : isEditing ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>

        <Footer />
      </SignedIn>

      <FloatingToolbar
        position={toolbarPosition}
        onFormat={handleFormat}
        onAddCitation={handleAddCitation}
        visible={toolbarVisible}
      />

      {showCitationModal && (
        <CitationModal
          onClose={() => setShowCitationModal(false)}
          onAdd={insertCitation}
          citationNum={citations.length + 1}
        />
      )}
    </div>
  )
}

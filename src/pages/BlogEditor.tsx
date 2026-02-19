import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useQuery, useMutation } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { SignedIn, SignedOut } from '@clerk/clerk-react'
import { useTheme } from './Home'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeSlug from 'rehype-slug'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneDark, oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism'

function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
}

export default function BlogEditor() {
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()
  const { theme, toggle } = useTheme()
  const isEditing = !!slug

  const existingPost = useQuery(
    api.posts.getBySlug,
    slug ? { slug } : 'skip'
  )

  const createPost = useMutation(api.posts.create)
  const updatePost = useMutation(api.posts.update)

  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [customSlug, setCustomSlug] = useState('')
  const [published, setPublished] = useState(false)
  const [preview, setPreview] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (existingPost) {
      setTitle(existingPost.title)
      setContent(existingPost.content)
      setCustomSlug(existingPost.slug)
      setPublished(existingPost.published)
    }
  }, [existingPost])

  const handleSave = async () => {
    if (!title.trim() || !content.trim()) {
      alert('Title and content are required')
      return
    }

    setSaving(true)
    const postSlug = customSlug || slugify(title)

    try {
      if (isEditing && existingPost) {
        await updatePost({
          id: existingPost._id,
          title,
          slug: postSlug,
          content,
          published
        })
      } else {
        await createPost({
          title,
          slug: postSlug,
          content,
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

  const insertMarkdown = (syntax: string, wrap = false) => {
    const textarea = document.getElementById('editor') as HTMLTextAreaElement
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

  return (
    <div className="blog-container editor-container">
      <SignedOut>
        <div className="auth-required">
          <p>You must be signed in to create or edit posts.</p>
          <Link to="/blog" className="back-link">← Back to blog</Link>
        </div>
      </SignedOut>

      <SignedIn>
        <motion.header
          className="blog-header"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <nav className="breadcrumb">
            <Link to="/" className="breadcrumb-link">Home</Link>
            <span className="breadcrumb-sep">/</span>
            <Link to="/blog" className="breadcrumb-link">Writing</Link>
            <span className="breadcrumb-sep">/</span>
            <span className="breadcrumb-current">{isEditing ? 'Edit' : 'New'}</span>
          </nav>
          <div className="header-right">
            <motion.button
              className="theme-toggle"
              onClick={toggle}
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
        </motion.header>

        <motion.div
          className="editor-main"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
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
              className="editor-slug-input"
              placeholder="custom-slug (optional)"
              value={customSlug}
              onChange={(e) => setCustomSlug(e.target.value)}
            />
          </div>

          <div className="editor-toolbar">
            <button onClick={() => insertMarkdown('**', true)} title="Bold">B</button>
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
            <button onClick={() => insertMarkdown('[text](url)')} title="Link">🔗</button>
            <button onClick={() => insertMarkdown('`', true)} title="Inline code">`</button>
            <button onClick={() => insertMarkdown('```\n\n```')} title="Code block">{'</>'}</button>
            <span className="toolbar-divider" />
            <button
              className={preview ? 'active' : ''}
              onClick={() => setPreview(!preview)}
            >
              Preview
            </button>
          </div>

          {preview ? (
            <div className="editor-preview">
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
                {content || '*No content yet*'}
              </ReactMarkdown>
            </div>
          ) : (
            <textarea
              id="editor"
              className="editor-textarea"
              placeholder="Write your post in Markdown..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
          )}

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
        </motion.div>
      </SignedIn>
    </div>
  )
}

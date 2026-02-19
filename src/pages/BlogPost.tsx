import { useParams, Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useQuery, useMutation } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { SignedIn } from '../contexts/AuthContext'
import { useTheme } from './Home'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeSlug from 'rehype-slug'
import { useState, useEffect, useCallback } from 'react'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneDark, oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism'

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
}

function formatDate(timestamp: number) {
  return new Date(timestamp).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
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

export default function BlogPost() {
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()
  const { theme, toggle } = useTheme()
  const post = useQuery(api.posts.getBySlug, slug ? { slug } : 'skip')
  const deletePost = useMutation(api.posts.remove)
  const [linkCopied, setLinkCopied] = useState(false)

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
          <span className="breadcrumb-current">Article</span>
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

      <motion.article
        className="blog-article"
        variants={fadeInUp}
        initial="hidden"
        animate="visible"
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <header className="article-header">
          <h1 className="article-title">{post.title}</h1>
          <div className="article-meta">
            <span className="article-date">{formatDate(post.createdAt)}</span>
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
            <SignedIn>
              <Link to={`/blog/edit/${post.slug}`} className="edit-link">Edit</Link>
              <button className="delete-btn" onClick={handleDelete}>Delete</button>
            </SignedIn>
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
            {post.content}
          </ReactMarkdown>
        </div>
      </motion.article>
    </div>
  )
}

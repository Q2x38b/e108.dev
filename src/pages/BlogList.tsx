import { Link } from 'react-router-dom'
import { useQuery } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { SignedIn } from '../contexts/AuthContext'
import { useTheme } from './Home'
import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Footer } from '../components/Footer'

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
}

interface Post {
  _id: string
  title: string
  subtitle?: string
  slug: string
  shortId?: string
  content: string
  excerpt?: string
  titleImage?: string
  published: boolean
  createdAt: number
  updatedAt: number
}

type ViewMode = 'card' | 'list'

function formatDate(timestamp: number) {
  return new Date(timestamp).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })
}

function formatDateCompact(timestamp: number) {
  const date = new Date(timestamp)
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${month}/${day}`
}

function getYear(timestamp: number) {
  return new Date(timestamp).getFullYear().toString()
}

export default function BlogList() {
  const { theme, toggle } = useTheme()
  const posts = useQuery(api.posts.list)
  const [viewMode, setViewMode] = useState<ViewMode>('card')
  const [searchQuery, setSearchQuery] = useState('')

  // Filter posts based on search query
  const filteredPosts = useMemo(() => {
    if (!posts) return []
    if (!searchQuery.trim()) return posts as Post[]

    const query = searchQuery.toLowerCase()
    return (posts as Post[]).filter(post =>
      post.title.toLowerCase().includes(query) ||
      (post.subtitle && post.subtitle.toLowerCase().includes(query))
    )
  }, [posts, searchQuery])

  // Group posts by year for list view
  const groupedPosts = useMemo(() => {
    const groups: { year: string; posts: Post[] }[] = []
    let currentYear = ''

    filteredPosts.forEach(post => {
      const year = getYear(post.createdAt)
      if (year !== currentYear) {
        currentYear = year
        groups.push({ year, posts: [post] })
      } else {
        groups[groups.length - 1].posts.push(post)
      }
    })

    return groups
  }, [filteredPosts])

  return (
    <div className="blog-list-layout">
      <motion.header
        className="blog-header blog-list-header"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <nav className="breadcrumb">
          <Link to="/" className="breadcrumb-link">Home</Link>
          <span className="breadcrumb-sep">/</span>
          <span className="breadcrumb-current">Writing</span>
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
          <SignedIn>
            <Link to="/blog/new" className="add-post-btn" aria-label="New post">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </Link>
          </SignedIn>
        </div>
      </motion.header>

      <div className="blog-list-title">
        <h1 className="blog-title">Writing</h1>
      </div>

      {/* Search Bar and View Toggle */}
      <div className="blog-search-bar">
        <div className="blog-search-input">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" />
          </svg>
          <input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="blog-view-toggle">
          <button
            className={`view-toggle-btn ${viewMode === 'card' ? 'active' : ''}`}
            onClick={() => setViewMode('card')}
            aria-label="Card view"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="7" height="7" />
              <rect x="14" y="3" width="7" height="7" />
              <rect x="3" y="14" width="7" height="7" />
              <rect x="14" y="14" width="7" height="7" />
            </svg>
          </button>
          <button
            className={`view-toggle-btn ${viewMode === 'list' ? 'active' : ''}`}
            onClick={() => setViewMode('list')}
            aria-label="List view"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
        </div>
      </div>

      <main className="blog-list-content">
        {posts === undefined ? (
          <div className="blog-loading-spinner-container">
            <div className="blog-loading-spinner" />
          </div>
        ) : filteredPosts.length === 0 ? (
          <p className="blog-empty">{searchQuery ? 'No posts found.' : 'No posts yet.'}</p>
        ) : viewMode === 'card' ? (
          /* Card View */
          <div className="blog-card-list">
            {filteredPosts.map((post: Post, index: number) => (
              <motion.div
                key={`${viewMode}-${post._id}`}
                variants={fadeInUp}
                initial="hidden"
                animate="visible"
                transition={{ duration: 0.4, delay: index * 0.05 }}
              >
                <Link to={`/blog/${post.shortId}`} className="blog-card">
                  <div className="blog-card-content">
                    <h2 className="blog-card-title">{post.title}</h2>
                    {post.subtitle && (
                      <p className="blog-card-subtitle">{post.subtitle}</p>
                    )}
                    <span className="blog-card-meta">{formatDate(post.createdAt)}</span>
                  </div>
                  {post.titleImage && (
                    <div className="blog-card-image">
                      <img src={post.titleImage} alt="" />
                    </div>
                  )}
                </Link>
              </motion.div>
            ))}
          </div>
        ) : (
          /* List/Table View - Grouped by Year */
          <div className="blog-table-list">
            {groupedPosts.map((group, groupIndex) => (
              <div key={group.year} className="blog-year-group">
                <motion.div
                  className="blog-year-header"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.4, delay: groupIndex * 0.1 }}
                >
                  <span className="blog-year-label">{group.year}</span>
                </motion.div>
                <div className="blog-year-entries">
                  {group.posts.map((post: Post, index: number) => (
                    <motion.div
                      key={`${viewMode}-${post._id}`}
                      variants={fadeInUp}
                      initial="hidden"
                      animate="visible"
                      transition={{ duration: 0.4, delay: groupIndex * 0.1 + index * 0.03 }}
                    >
                      <Link to={`/blog/${post.shortId}`} className="blog-table-row">
                        <span className="blog-table-title">{post.title}</span>
                        <span className="blog-table-date">{formatDateCompact(post.createdAt)}</span>
                      </Link>
                    </motion.div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <Footer showSignature={false} />
      <div className="blog-blur-bottom" />
    </div>
  )
}

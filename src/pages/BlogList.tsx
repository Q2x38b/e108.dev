import { Link } from 'react-router-dom'
import { useQuery } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { SignedIn } from '../contexts/AuthContext'
import { useTheme } from './Home'
import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Footer } from '../components/Footer'
import { useHaptics } from '../hooks/useHaptics'

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
  publishedAt?: number
  createdAt: number
  updatedAt: number
}

// Helper to get the display date (prefer publishedAt over createdAt)
function getDisplayDate(post: Post): number {
  return post.publishedAt || post.createdAt
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

export default function BlogList() {
  // Initialize theme (ensures data-theme is set when landing directly on this page)
  useTheme()
  const posts = useQuery(api.posts.list)
  const [viewMode, setViewMode] = useState<ViewMode>('card')
  const [searchQuery, setSearchQuery] = useState('')
  const haptics = useHaptics()

  // Filter and sort posts based on search query (sorted by publishedAt desc)
  const filteredPosts = useMemo(() => {
    if (!posts) return []

    let result = posts as Post[]

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      result = result.filter(post =>
        post.title.toLowerCase().includes(query) ||
        (post.subtitle && post.subtitle.toLowerCase().includes(query))
      )
    }

    // Sort by publishedAt (or createdAt as fallback) descending
    return result.sort((a, b) => getDisplayDate(b) - getDisplayDate(a))
  }, [posts, searchQuery])

  return (
    <div className="blog-list-layout">
      <header className="blog-header stagger-in stagger-in-1">
        <Link to="/" className="blog-back-btn" aria-label="Back to home" draggable={false} onClick={() => haptics.soft()}>
          <svg aria-hidden="true" fill="none" height="20" viewBox="0 0 24 24" width="20" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M9.70711 4.70711C10.0976 4.31658 10.0976 3.68342 9.70711 3.29289C9.31658 2.90237 8.68342 2.90237 8.29289 3.29289L3.29289 8.29289C2.90237 8.68342 2.90237 9.31658 3.29289 9.70711L8.29289 14.7071C8.68342 15.0976 9.31658 15.0976 9.70711 14.7071C10.0976 14.3166 10.0976 13.6834 9.70711 13.2929L6.41421 10H10.4C12.0967 10 13.309 10.0008 14.2594 10.0784C15.198 10.1551 15.7927 10.3018 16.27 10.545C17.2108 11.0243 17.9757 11.7892 18.455 12.73C18.6982 13.2073 18.8449 13.802 18.9216 14.7406C18.9992 15.691 19 16.9033 19 18.6V20C19 20.5523 19.4477 21 20 21C20.5523 21 21 20.5523 21 20V18.5556C21 16.913 21 15.6191 20.9149 14.5778C20.8281 13.5154 20.6478 12.6283 20.237 11.8221C19.5659 10.5049 18.4951 9.43407 17.1779 8.76295C16.3717 8.35217 15.4846 8.17186 14.4222 8.08507C13.3809 7.99999 12.087 7.99999 10.4444 8L6.41421 8L9.70711 4.70711Z"
              fill="currentColor"
            />
          </svg>
          <span>Back</span>
        </Link>
      </header>

      <div className="blog-list-title stagger-in stagger-in-2">
        <div className="blog-title-row">
          <h1 className="blog-title">Writing</h1>
          <SignedIn>
            <Link to="/blog/new" className="add-post-btn" aria-label="New post">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </Link>
          </SignedIn>
        </div>
      </div>

      {/* Search Bar and View Toggle */}
      <div className="blog-search-bar stagger-in stagger-in-3">
        <div className="blog-search-input">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" />
          </svg>
          <input
            type="search"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label="Search posts"
            spellCheck="false"
            autoComplete="off"
          />
        </div>
        <div className="blog-view-toggle" role="group" aria-label="View mode">
          <button
            className={`view-toggle-btn ${viewMode === 'card' ? 'active' : ''}`}
            onClick={() => { haptics.selection(); setViewMode('card') }}
            aria-label="Card view"
            aria-pressed={viewMode === 'card'}
          >
            <svg viewBox="0 0 20 20" fill="currentColor" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" aria-hidden="true">
              <rect x="3" y="3" width="5" height="5" rx="1.5" ry="1.5" />
              <rect x="12" y="3" width="5" height="5" rx="1.5" ry="1.5" />
              <rect x="3" y="12" width="5" height="5" rx="1.5" ry="1.5" />
              <rect x="12" y="12" width="5" height="5" rx="1.5" ry="1.5" />
            </svg>
          </button>
          <button
            className={`view-toggle-btn ${viewMode === 'list' ? 'active' : ''}`}
            onClick={() => { haptics.selection(); setViewMode('list') }}
            aria-label="List view"
            aria-pressed={viewMode === 'list'}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
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
                    <span className="blog-card-meta">{formatDate(getDisplayDate(post))}</span>
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
          /* List/Table View */
          <div className="blog-table-list">
            {filteredPosts.map((post: Post, index: number) => (
              <motion.div
                key={`${viewMode}-${post._id}`}
                variants={fadeInUp}
                initial="hidden"
                animate="visible"
                transition={{ duration: 0.4, delay: index * 0.03 }}
              >
                <Link to={`/blog/${post.shortId}`} className="blog-table-row">
                  <span className="blog-table-title">{post.title}</span>
                  <span className="blog-table-date">{formatDateCompact(getDisplayDate(post))}</span>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </main>

      <Footer showEditControls={true} showSignature={true} showQuote={true} />
      <div className="blog-blur-bottom" />
    </div>
  )
}

import { Link } from 'react-router-dom'
import { useQuery } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { SignedIn } from '../contexts/AuthContext'
import { useTheme } from './Home'
import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Footer } from '../components/Footer'
import { Header } from '../components/Header'
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
  const { theme: resolvedTheme, preference, setPreference } = useTheme()
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
      <Header
        theme={resolvedTheme}
        preference={preference}
        setPreference={setPreference}
        showBackLink={true}
        currentPage="blog"
      />

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

      <Footer showSignature={false} showQuote={false} />
      <div className="blog-blur-bottom" />
    </div>
  )
}

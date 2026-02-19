import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useQuery } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { SignedIn } from '@clerk/clerk-react'
import { useTheme } from './Home'

interface Post {
  _id: string
  title: string
  slug: string
  content: string
  excerpt?: string
  published: boolean
  createdAt: number
  updatedAt: number
}

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

export default function BlogList() {
  const { theme, toggle } = useTheme()
  const posts = useQuery(api.posts.list)

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
          <span className="breadcrumb-current">Writing</span>
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

      <motion.main
        variants={fadeInUp}
        initial="hidden"
        animate="visible"
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <h1 className="blog-title">Writing</h1>

        {posts === undefined ? (
          <p className="blog-loading">Loading...</p>
        ) : posts.length === 0 ? (
          <p className="blog-empty">No posts yet.</p>
        ) : (
          <ul className="post-list">
            {(posts as Post[]).map((post: Post, index: number) => (
              <motion.li
                key={post._id}
                variants={fadeInUp}
                initial="hidden"
                animate="visible"
                transition={{ duration: 0.4, delay: 0.15 + index * 0.05 }}
              >
                <Link to={`/blog/${post.slug}`} className="post-item">
                  <span className="post-date">{formatDate(post.createdAt)}</span>
                  <span className="post-title-link">{post.title}</span>
                </Link>
              </motion.li>
            ))}
          </ul>
        )}
      </motion.main>
    </div>
  )
}

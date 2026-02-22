import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import type { JSONContent } from '@tiptap/core'
import { generateHTML } from '@tiptap/html'
import { StarterKit } from '@tiptap/starter-kit'
import { Link } from '@tiptap/extension-link'
import { Highlight } from '@tiptap/extension-highlight'
import { TaskList } from '@tiptap/extension-task-list'
import { TaskItem } from '@tiptap/extension-task-item'
import { Underline } from '@tiptap/extension-underline'
import { Table } from '@tiptap/extension-table'
import { TableRow } from '@tiptap/extension-table-row'
import { TableCell } from '@tiptap/extension-table-cell'
import { TableHeader } from '@tiptap/extension-table-header'

interface PreviewModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  subtitle?: string
  content: JSONContent | null
  titleImage?: string
  publishDate?: Date
}

// Basic extensions for rendering (without interactive features)
const extensions = [
  StarterKit,
  Link,
  Highlight,
  TaskList,
  TaskItem,
  Underline,
  Table,
  TableRow,
  TableCell,
  TableHeader,
]

export function PreviewModal({
  isOpen,
  onClose,
  title,
  subtitle,
  content,
  titleImage,
  publishDate,
}: PreviewModalProps) {
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    })
  }

  // Generate HTML from JSONContent
  const contentHtml = content
    ? generateHTML(content, extensions)
    : '<p>No content yet...</p>'

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="preview-modal-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="preview-modal"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="preview-modal-header">
              <h2>Preview</h2>
              <button onClick={onClose} className="preview-modal-close">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="preview-modal-content">
              {titleImage && (
                <div className="preview-title-image">
                  <img src={titleImage} alt={title} />
                </div>
              )}

              <article className="preview-article">
                <header className="preview-header">
                  <h1 className="preview-title">{title || 'Untitled'}</h1>
                  {subtitle && <p className="preview-subtitle">{subtitle}</p>}
                  {publishDate && (
                    <time className="preview-date">{formatDate(publishDate)}</time>
                  )}
                </header>

                <div
                  className="preview-body article-content"
                  dangerouslySetInnerHTML={{ __html: contentHtml }}
                />
              </article>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

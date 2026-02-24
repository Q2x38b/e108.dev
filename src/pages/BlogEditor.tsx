import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery, useMutation } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from './Home'
import type { JSONContent } from '@tiptap/core'
import { BlockEditor } from '../components/editor/BlockEditor'
import { PreviewModal } from '../components/editor/PreviewModal'
import { ImageCropModal } from '../components/editor/ImageCropModal'
import { ArrowLeft, Eye, Check, Calendar, X, Upload } from 'lucide-react'
import { jsonToMarkdown } from '../lib/jsonToMarkdown'
import { markdownToJson } from '../lib/markdownToJson'
import { Footer } from '../components/Footer'

function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
}

export default function BlogEditor() {
  const { shortId } = useParams<{ shortId: string }>()
  const navigate = useNavigate()
  const { theme, toggle } = useTheme()
  const { isAuthenticated } = useAuth()
  const isEditing = !!shortId

  // Redirect unauthenticated users to blog list
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/blog', { replace: true })
    }
  }, [isAuthenticated, navigate])

  const existingPost = useQuery(
    api.posts.getByShortId,
    shortId ? { shortId } : 'skip'
  )

  const createPost = useMutation(api.posts.create)
  const updatePost = useMutation(api.posts.update)
  const generateUploadUrl = useMutation(api.files.generateUploadUrl)
  const saveImage = useMutation(api.files.saveImage)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const [title, setTitle] = useState('')
  const [subtitle, setSubtitle] = useState('')
  const [content, setContent] = useState<JSONContent | null>(null)
  const [customSlug, setCustomSlug] = useState('')
  const [titleImage, setTitleImage] = useState('')
  const [published, setPublished] = useState(false)
  const [publishDate, setPublishDate] = useState<Date>(new Date())
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(true)
  const [showPreview, setShowPreview] = useState(false)
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [fileToCrop, setFileToCrop] = useState<File | null>(null)

  // Load existing post data
  useEffect(() => {
    if (existingPost) {
      setTitle(existingPost.title)
      setSubtitle(existingPost.subtitle || '')
      setCustomSlug(existingPost.slug)
      setTitleImage(existingPost.titleImage || '')
      setPublished(existingPost.published)

      // Load content - prefer contentJson, fall back to converting markdown
      if (existingPost.contentJson) {
        setContent(existingPost.contentJson as JSONContent)
      } else if (existingPost.content) {
        // Convert markdown to JSON for editing
        setContent(markdownToJson(existingPost.content))
      }

      // Set publish date
      if (existingPost.publishedAt) {
        setPublishDate(new Date(existingPost.publishedAt))
      } else {
        setPublishDate(new Date(existingPost.createdAt))
      }
    }
  }, [existingPost])

  const handleContentUpdate = useCallback((newContent: JSONContent) => {
    setContent(newContent)
    setSaved(false)
  }, [])

  const handleImageUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file')
      return
    }

    setUploading(true)
    try {
      // Get upload URL from Convex
      const uploadUrl = await generateUploadUrl()

      // Upload the file
      const response = await fetch(uploadUrl, {
        method: 'POST',
        headers: { 'Content-Type': file.type },
        body: file,
      })

      if (!response.ok) {
        throw new Error('Upload failed')
      }

      const { storageId } = await response.json()

      // Save image metadata and get URL
      const result = await saveImage({
        storageId,
        fileName: file.name,
        contentType: file.type,
      })

      // Use the URL returned from Convex
      if (result.url) {
        setTitleImage(result.url)
        setSaved(false)
      }
    } catch (error) {
      console.error('Error uploading image:', error)
      alert('Failed to upload image')
    } finally {
      setUploading(false)
    }
  }

  const handleSave = async (shouldPublish = false) => {
    if (!title.trim()) {
      alert('Title is required')
      return
    }

    setSaving(true)
    const postSlug = customSlug || slugify(title)

    // Convert JSONContent to markdown for backward compatibility
    const markdownContent = content ? jsonToMarkdown(content) : ''

    try {
      if (isEditing && existingPost) {
        await updatePost({
          id: existingPost._id,
          title,
          subtitle: subtitle || undefined,
          slug: postSlug,
          content: markdownContent,
          contentJson: content || undefined,
          titleImage: titleImage || undefined,
          published: shouldPublish ? true : published,
          publishedAt: publishDate.getTime(),
        })
        setSaved(true)
        if (shouldPublish) {
          navigate(`/blog/${existingPost.shortId}`)
        }
      } else {
        await createPost({
          title,
          subtitle: subtitle || undefined,
          slug: postSlug,
          content: markdownContent,
          contentJson: content || undefined,
          titleImage: titleImage || undefined,
          published: shouldPublish,
          publishedAt: publishDate.getTime(),
        })
        navigate('/blog')
      }
    } catch (error) {
      console.error('Error saving post:', error)
      alert('Error saving post')
    } finally {
      setSaving(false)
    }
  }

  const formatDateForInput = (date: Date) => {
    return date.toISOString().split('T')[0]
  }

  const formatDateDisplay = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  // Don't render anything if not authenticated (will redirect)
  if (!isAuthenticated) {
    return (
      <div className="blog-editor-page">
        <div className="auth-required">
          <p>Redirecting...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="blog-editor-page">
      {/* Top header bar */}
      <header className="editor-header">
          <div className="editor-header-left">
            <Link to="/blog" className="editor-back-btn">
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div className="editor-save-status">
              {saving ? (
                <span className="saving">Saving...</span>
              ) : saved ? (
                <span className="saved">
                  <span className="saved-dot" />
                  Saved
                </span>
              ) : (
                <span className="unsaved">Unsaved changes</span>
              )}
            </div>
          </div>

          <div className="editor-header-right">
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

            <button
              className="editor-preview-btn"
              onClick={() => setShowPreview(true)}
            >
              <Eye className="w-4 h-4" />
              Preview
            </button>

            <button
              className="editor-publish-btn"
              onClick={() => handleSave(true)}
              disabled={saving}
            >
              <Check className="w-4 h-4" />
              {published ? 'Update' : 'Publish'}
            </button>
          </div>
        </header>

        {/* Main editor area */}
        <main className="editor-main">
          {/* Post metadata */}
          <div className="editor-metadata">
            {/* Title image */}
            <div className="editor-image-field">
              <div className="editor-image-input-row">
                <input
                  type="text"
                  className="editor-image-input"
                  placeholder="Title image URL (optional)"
                  value={titleImage}
                  onChange={(e) => {
                    setTitleImage(e.target.value)
                    setSaved(false)
                  }}
                />
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="editor-image-file-input"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) {
                      if (!file.type.startsWith('image/')) {
                        alert('Please select an image file')
                        return
                      }
                      setFileToCrop(file)
                    }
                    e.target.value = ''
                  }}
                />
                <button
                  type="button"
                  className="editor-image-upload-btn"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                >
                  {uploading ? (
                    <span className="upload-spinner" />
                  ) : (
                    <Upload className="w-4 h-4" />
                  )}
                  {uploading ? 'Uploading...' : 'Upload'}
                </button>
              </div>
              {titleImage && (
                <div className="editor-image-preview">
                  <img src={titleImage} alt="Title preview" />
                  <button
                    type="button"
                    className="editor-image-remove"
                    onClick={() => {
                      setTitleImage('')
                      setSaved(false)
                    }}
                    aria-label="Remove image"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            {/* Title */}
            <input
              type="text"
              className="editor-title-input"
              placeholder="Title"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value)
                setSaved(false)
              }}
            />

            {/* Subtitle */}
            <input
              type="text"
              className="editor-subtitle-input"
              placeholder="Add a subtitle..."
              value={subtitle}
              onChange={(e) => {
                setSubtitle(e.target.value)
                setSaved(false)
              }}
            />

            {/* Author and Date */}
            <div className="editor-meta-row">
              <div className="editor-author-tags">
                <span className="author-tag">
                  Ethan Jerla
                  <button className="author-tag-remove" title="Remove author">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              </div>

              <div className="editor-date-picker" ref={(el) => {
                if (el) {
                  const handleClickOutside = (e: MouseEvent) => {
                    if (!el.contains(e.target as Node)) {
                      setShowDatePicker(false)
                    }
                  }
                  document.addEventListener('click', handleClickOutside)
                }
              }}>
                <button
                  className="date-picker-btn"
                  onClick={() => setShowDatePicker(!showDatePicker)}
                >
                  <Calendar className="w-4 h-4" />
                  {formatDateDisplay(publishDate)}
                </button>
                {showDatePicker && (
                  <div className="date-picker-dropdown">
                    <input
                      type="date"
                      value={formatDateForInput(publishDate)}
                      onChange={(e) => {
                        setPublishDate(new Date(e.target.value))
                        setSaved(false)
                        setShowDatePicker(false)
                      }}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Custom slug */}
            <input
              type="text"
              className="editor-slug-input"
              placeholder="custom-slug (optional)"
              value={customSlug}
              onChange={(e) => {
                setCustomSlug(e.target.value)
                setSaved(false)
              }}
            />
          </div>

          {/* Block editor */}
          <div className="editor-content-area">
            <BlockEditor
              content={content}
              onUpdate={handleContentUpdate}
              placeholder="Start writing..."
            />
          </div>
        </main>

      <Footer />

      {/* Preview Modal */}
      <PreviewModal
        isOpen={showPreview}
        onClose={() => setShowPreview(false)}
        title={title}
        subtitle={subtitle}
        content={content}
        titleImage={titleImage}
        publishDate={publishDate}
      />

      {/* Image Crop Modal */}
      {fileToCrop && (
        <ImageCropModal
          file={fileToCrop}
          onCropComplete={(croppedFile) => {
            setFileToCrop(null)
            handleImageUpload(croppedFile)
          }}
          onCancel={() => setFileToCrop(null)}
        />
      )}
    </div>
  )
}

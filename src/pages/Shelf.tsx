import { useState, useRef, useCallback, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useMutation } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { SignedIn, useAuth } from '../contexts/AuthContext'
import { useTheme } from './Home'
import { motion, AnimatePresence } from 'framer-motion'
import { Footer } from '../components/Footer'

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
}

type ItemType = 'image' | 'quote' | 'text'
type ItemSize = 'small' | 'medium' | 'large'

interface ShelfItem {
  _id: string
  type: ItemType
  // Image fields
  storageId?: string
  fileName?: string
  contentType?: string
  url?: string | null
  // Quote fields
  quoteText?: string
  quoteAuthor?: string
  quoteSource?: string
  // Text fields
  textContent?: string
  textLabel?: string
  // Common fields
  caption?: string
  aspectRatio?: number
  size?: ItemSize
  backgroundColor?: string
  uploadedAt: number
}


const BACKGROUND_COLORS = [
  { name: 'Default', value: '' },
  { name: 'Warm', value: '#f5e6d3' },
  { name: 'Cool', value: '#e3edf7' },
  { name: 'Sage', value: '#e8ede5' },
  { name: 'Blush', value: '#f7e4e4' },
  { name: 'Slate', value: '#2d3748' },
  { name: 'Charcoal', value: '#1a1a2e' },
]

export default function Shelf() {
  const { theme, toggle } = useTheme()
  const { sessionToken } = useAuth()
  const items = useQuery(api.shelf.list)
  const generateUploadUrl = useMutation(api.files.generateUploadUrl)
  const addImage = useMutation(api.shelf.addImage)
  const addQuote = useMutation(api.shelf.addQuote)
  const addText = useMutation(api.shelf.addText)
  const removeItem = useMutation(api.shelf.remove)

  const [isUploading, setIsUploading] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [addType, setAddType] = useState<ItemType>('image')
  const [selectedItem, setSelectedItem] = useState<ShelfItem | null>(null)
  const [dragActive, setDragActive] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Image preview states
  const [pendingFile, setPendingFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  // Form states
  const [uploadCaption, setUploadCaption] = useState('')
  const [quoteText, setQuoteText] = useState('')
  const [quoteAuthor, setQuoteAuthor] = useState('')
  const [quoteSource, setQuoteSource] = useState('')
  const [textContent, setTextContent] = useState('')
  const [textLabel, setTextLabel] = useState('')
  const [itemSize, setItemSize] = useState<ItemSize>('medium')
  const [backgroundColor, setBackgroundColor] = useState('')

  const shelfItems = useMemo(() => {
    if (!items) return []
    return items as ShelfItem[]
  }, [items])

  const resetForm = () => {
    setUploadCaption('')
    setQuoteText('')
    setQuoteAuthor('')
    setQuoteSource('')
    setTextContent('')
    setTextLabel('')
    setItemSize('medium')
    setBackgroundColor('')
    setAddType('image')
    // Clear file preview
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
    }
    setPendingFile(null)
    setPreviewUrl(null)
  }

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    const files = e.dataTransfer.files
    if (files && files[0]) {
      handleFileSelect(files[0])
    }
  }, [])

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleFileSelect(file)
    }
  }

  const handleFileSelect = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file')
      return
    }

    // Clear previous preview
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
    }

    // Create preview URL and store the file
    const url = URL.createObjectURL(file)
    setPreviewUrl(url)
    setPendingFile(file)
  }

  const handleAddImage = async () => {
    if (!sessionToken || !pendingFile) return

    setIsUploading(true)
    try {
      const aspectRatio = await getImageAspectRatio(pendingFile)
      const uploadUrl = await generateUploadUrl()

      const result = await fetch(uploadUrl, {
        method: 'POST',
        headers: { 'Content-Type': pendingFile.type },
        body: pendingFile,
      })

      if (!result.ok) {
        throw new Error('Upload failed')
      }

      const { storageId } = await result.json()

      await addImage({
        token: sessionToken,
        storageId,
        fileName: pendingFile.name,
        contentType: pendingFile.type,
        caption: uploadCaption || undefined,
        aspectRatio,
      })

      resetForm()
      setShowAddModal(false)
    } catch (error) {
      console.error('Upload error:', error)
      alert('Failed to upload image')
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const getImageAspectRatio = (file: File): Promise<number> => {
    return new Promise((resolve) => {
      const img = new Image()
      img.onload = () => {
        resolve(img.width / img.height)
        URL.revokeObjectURL(img.src)
      }
      img.onerror = () => {
        resolve(1)
      }
      img.src = URL.createObjectURL(file)
    })
  }

  const handleAddQuote = async () => {
    if (!sessionToken || !quoteText.trim()) return

    setIsUploading(true)
    try {
      await addQuote({
        token: sessionToken,
        quoteText: quoteText.trim(),
        quoteAuthor: quoteAuthor.trim() || undefined,
        quoteSource: quoteSource.trim() || undefined,
        size: itemSize,
        backgroundColor: backgroundColor || undefined,
      })

      resetForm()
      setShowAddModal(false)
    } catch (error) {
      console.error('Add quote error:', error)
      alert('Failed to add quote')
    } finally {
      setIsUploading(false)
    }
  }

  const handleAddText = async () => {
    if (!sessionToken || !textContent.trim()) return

    setIsUploading(true)
    try {
      await addText({
        token: sessionToken,
        textContent: textContent.trim(),
        textLabel: textLabel.trim() || undefined,
        size: itemSize,
        backgroundColor: backgroundColor || undefined,
      })

      resetForm()
      setShowAddModal(false)
    } catch (error) {
      console.error('Add text error:', error)
      alert('Failed to add text')
    } finally {
      setIsUploading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!sessionToken) return
    if (!confirm('Are you sure you want to delete this item?')) return

    try {
      await removeItem({ token: sessionToken, id: id as any })
      setSelectedItem(null)
    } catch (error) {
      console.error('Delete error:', error)
      alert('Failed to delete item')
    }
  }

  const isDarkBg = (color: string) => {
    if (!color) return false
    return ['#2d3748', '#1a1a2e'].includes(color)
  }

  const renderItem = (item: ShelfItem, index: number) => {
    if (item.type === 'image') {
      return (
        <motion.div
          key={item._id}
          className="shelf-item shelf-item-image"
          variants={fadeInUp}
          initial="hidden"
          animate="visible"
          transition={{ duration: 0.4, delay: index * 0.03 }}
          onClick={() => setSelectedItem(item)}
        >
          {item.url && (
            <img
              src={item.url}
              alt={item.caption || item.fileName}
              loading="lazy"
            />
          )}
          {item.caption && (
            <div className="shelf-item-caption">
              <span>{item.caption}</span>
            </div>
          )}
        </motion.div>
      )
    }

    if (item.type === 'quote') {
      const bgStyle = item.backgroundColor ? { backgroundColor: item.backgroundColor } : {}
      const isDark = isDarkBg(item.backgroundColor || '')
      return (
        <motion.div
          key={item._id}
          className={`shelf-item shelf-item-quote shelf-item-${item.size || 'medium'} ${isDark ? 'dark-bg' : ''}`}
          style={bgStyle}
          variants={fadeInUp}
          initial="hidden"
          animate="visible"
          transition={{ duration: 0.4, delay: index * 0.03 }}
          onClick={() => setSelectedItem(item)}
        >
          <div className="shelf-quote-content">
            <svg className="shelf-quote-mark" viewBox="0 0 24 24" fill="currentColor">
              <path d="M6.5 10c-.223 0-.437.034-.65.065.069-.232.14-.468.254-.68.114-.308.292-.575.469-.844.148-.291.409-.488.601-.737.201-.242.475-.403.692-.604.213-.21.492-.315.714-.463.232-.133.434-.28.65-.35l.539-.222.474-.197-.485-1.938-.597.144c-.191.048-.424.104-.689.171-.271.05-.56.187-.882.312-.317.143-.686.238-1.028.467-.344.218-.741.4-1.091.692-.339.301-.748.562-1.05.944-.33.358-.656.734-.909 1.162-.293.408-.492.856-.702 1.299-.19.443-.343.896-.468 1.336-.237.882-.343 1.72-.384 2.437-.034.718-.014 1.315.028 1.747.015.204.043.402.063.539l.025.168.026-.006A4.5 4.5 0 1 0 6.5 10zm11 0c-.223 0-.437.034-.65.065.069-.232.14-.468.254-.68.114-.308.292-.575.469-.844.148-.291.409-.488.601-.737.201-.242.475-.403.692-.604.213-.21.492-.315.714-.463.232-.133.434-.28.65-.35l.539-.222.474-.197-.485-1.938-.597.144c-.191.048-.424.104-.689.171-.271.05-.56.187-.882.312-.317.143-.686.238-1.028.467-.344.218-.741.4-1.091.692-.339.301-.748.562-1.05.944-.33.358-.656.734-.909 1.162-.293.408-.492.856-.702 1.299-.19.443-.343.896-.468 1.336-.237.882-.343 1.72-.384 2.437-.034.718-.014 1.315.028 1.747.015.204.043.402.063.539l.025.168.026-.006A4.5 4.5 0 1 0 17.5 10z"/>
            </svg>
            <blockquote>{item.quoteText}</blockquote>
            {(item.quoteAuthor || item.quoteSource) && (
              <cite>
                {item.quoteAuthor && <span className="quote-author">{item.quoteAuthor}</span>}
                {item.quoteSource && <span className="quote-source">{item.quoteSource}</span>}
              </cite>
            )}
          </div>
        </motion.div>
      )
    }

    if (item.type === 'text') {
      const bgStyle = item.backgroundColor ? { backgroundColor: item.backgroundColor } : {}
      const isDark = isDarkBg(item.backgroundColor || '')
      return (
        <motion.div
          key={item._id}
          className={`shelf-item shelf-item-text shelf-item-${item.size || 'small'} ${isDark ? 'dark-bg' : ''}`}
          style={bgStyle}
          variants={fadeInUp}
          initial="hidden"
          animate="visible"
          transition={{ duration: 0.4, delay: index * 0.03 }}
          onClick={() => setSelectedItem(item)}
        >
          <div className="shelf-text-content">
            {item.textLabel && <span className="text-label">{item.textLabel}</span>}
            <p>{item.textContent}</p>
          </div>
        </motion.div>
      )
    }

    return null
  }

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
          <span className="breadcrumb-current">Shelf</span>
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
            <button
              className="add-post-btn"
              onClick={() => setShowAddModal(true)}
              aria-label="Add item"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </button>
          </SignedIn>
        </div>
      </motion.header>

      <div className="blog-list-title">
        <h1 className="shelf-artistic-title">shelf</h1>
      </div>

      <main className="blog-list-content shelf-content">
        {items === undefined ? (
          <div className="blog-loading-spinner-container">
            <div className="blog-loading-spinner" />
          </div>
        ) : shelfItems.length === 0 ? (
          <p className="shelf-empty">No items yet.</p>
        ) : (
          <div className="shelf-masonry">
            {shelfItems.map((item, index) => renderItem(item, index))}
          </div>
        )}
      </main>

      {/* Add Item Modal */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div
            className="shelf-modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => { setShowAddModal(false); resetForm(); }}
          >
            <motion.div
              className="shelf-modal shelf-add-modal"
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
            >
              <h2>Add to Shelf</h2>

              {/* Type Selector */}
              <div className="shelf-type-selector">
                <button
                  className={`type-btn ${addType === 'image' ? 'active' : ''}`}
                  onClick={() => setAddType('image')}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <polyline points="21 15 16 10 5 21" />
                  </svg>
                  Image
                </button>
                <button
                  className={`type-btn ${addType === 'quote' ? 'active' : ''}`}
                  onClick={() => setAddType('quote')}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V21z" />
                    <path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3z" />
                  </svg>
                  Quote
                </button>
                <button
                  className={`type-btn ${addType === 'text' ? 'active' : ''}`}
                  onClick={() => setAddType('text')}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="17" y1="10" x2="3" y2="10" />
                    <line x1="21" y1="6" x2="3" y2="6" />
                    <line x1="21" y1="14" x2="3" y2="14" />
                    <line x1="17" y1="18" x2="3" y2="18" />
                  </svg>
                  Text
                </button>
              </div>

              {/* Image Upload */}
              {addType === 'image' && (
                <>
                  {previewUrl ? (
                    <div className="shelf-image-preview">
                      <img src={previewUrl} alt="Preview" />
                      <button
                        className="shelf-preview-change"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        Change image
                      </button>
                    </div>
                  ) : (
                    <div
                      className={`shelf-upload-zone ${dragActive ? 'active' : ''}`}
                      onDragEnter={handleDrag}
                      onDragLeave={handleDrag}
                      onDragOver={handleDrag}
                      onDrop={handleDrop}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="17 8 12 3 7 8" />
                        <line x1="12" y1="3" x2="12" y2="15" />
                      </svg>
                      <p>Drag & drop or click to upload</p>
                    </div>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileInputChange}
                    style={{ display: 'none' }}
                  />
                  <div className="shelf-upload-caption">
                    <input
                      type="text"
                      placeholder="Caption (optional)"
                      value={uploadCaption}
                      onChange={(e) => setUploadCaption(e.target.value)}
                    />
                  </div>
                </>
              )}

              {/* Quote Form */}
              {addType === 'quote' && (
                <div className="shelf-form">
                  <textarea
                    placeholder="Enter your quote..."
                    value={quoteText}
                    onChange={(e) => setQuoteText(e.target.value)}
                    rows={4}
                  />
                  <input
                    type="text"
                    placeholder="Author (optional)"
                    value={quoteAuthor}
                    onChange={(e) => setQuoteAuthor(e.target.value)}
                  />
                  <input
                    type="text"
                    placeholder="Source (optional)"
                    value={quoteSource}
                    onChange={(e) => setQuoteSource(e.target.value)}
                  />
                  <div className="shelf-form-row">
                    <label>Size</label>
                    <div className="size-selector">
                      {(['small', 'medium', 'large'] as ItemSize[]).map((size) => (
                        <button
                          key={size}
                          className={`size-btn ${itemSize === size ? 'active' : ''}`}
                          onClick={() => setItemSize(size)}
                        >
                          {size}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="shelf-form-row">
                    <label>Background</label>
                    <div className="color-selector">
                      {BACKGROUND_COLORS.map((color) => (
                        <button
                          key={color.value || 'default'}
                          className={`color-btn ${backgroundColor === color.value ? 'active' : ''}`}
                          style={{ backgroundColor: color.value || 'var(--bg-secondary)' }}
                          onClick={() => setBackgroundColor(color.value)}
                          title={color.name}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Text Form */}
              {addType === 'text' && (
                <div className="shelf-form">
                  <input
                    type="text"
                    placeholder="Label (optional, e.g. 'Currently Reading')"
                    value={textLabel}
                    onChange={(e) => setTextLabel(e.target.value)}
                  />
                  <textarea
                    placeholder="Enter your text..."
                    value={textContent}
                    onChange={(e) => setTextContent(e.target.value)}
                    rows={3}
                  />
                  <div className="shelf-form-row">
                    <label>Size</label>
                    <div className="size-selector">
                      {(['small', 'medium', 'large'] as ItemSize[]).map((size) => (
                        <button
                          key={size}
                          className={`size-btn ${itemSize === size ? 'active' : ''}`}
                          onClick={() => setItemSize(size)}
                        >
                          {size}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="shelf-form-row">
                    <label>Background</label>
                    <div className="color-selector">
                      {BACKGROUND_COLORS.map((color) => (
                        <button
                          key={color.value || 'default'}
                          className={`color-btn ${backgroundColor === color.value ? 'active' : ''}`}
                          style={{ backgroundColor: color.value || 'var(--bg-secondary)' }}
                          onClick={() => setBackgroundColor(color.value)}
                          title={color.name}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              )}

              <div className="shelf-modal-actions">
                <button
                  className="shelf-modal-cancel"
                  onClick={() => { setShowAddModal(false); resetForm(); }}
                >
                  Cancel
                </button>
                {addType === 'image' && pendingFile && (
                  <button
                    className="shelf-modal-submit"
                    onClick={handleAddImage}
                    disabled={isUploading}
                  >
                    Add
                  </button>
                )}
                {addType === 'quote' && (
                  <button
                    className="shelf-modal-submit"
                    onClick={handleAddQuote}
                    disabled={!quoteText.trim() || isUploading}
                  >
                    Add
                  </button>
                )}
                {addType === 'text' && (
                  <button
                    className="shelf-modal-submit"
                    onClick={handleAddText}
                    disabled={!textContent.trim() || isUploading}
                  >
                    Add
                  </button>
                )}
              </div>

              {isUploading && (
                <div className="shelf-uploading">
                  <div className="blog-loading-spinner" />
                  <span>Adding...</span>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Item Preview Modal */}
      <AnimatePresence>
        {selectedItem && (
          <motion.div
            className="shelf-modal-overlay shelf-preview-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedItem(null)}
          >
            <motion.div
              className="shelf-preview-modal"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              onClick={(e) => e.stopPropagation()}
            >
              {selectedItem.type === 'image' && selectedItem.url && (
                <>
                  <img
                    src={selectedItem.url}
                    alt={selectedItem.caption || selectedItem.fileName}
                  />
                  {selectedItem.caption && (
                    <p className="shelf-preview-caption">{selectedItem.caption}</p>
                  )}
                </>
              )}

              {selectedItem.type === 'quote' && (
                <div className="shelf-preview-quote">
                  <blockquote>{selectedItem.quoteText}</blockquote>
                  {(selectedItem.quoteAuthor || selectedItem.quoteSource) && (
                    <cite>
                      {selectedItem.quoteAuthor && <span className="quote-author">{selectedItem.quoteAuthor}</span>}
                      {selectedItem.quoteSource && <span className="quote-source">{selectedItem.quoteSource}</span>}
                    </cite>
                  )}
                </div>
              )}

              {selectedItem.type === 'text' && (
                <div className="shelf-preview-text">
                  {selectedItem.textLabel && <span className="text-label">{selectedItem.textLabel}</span>}
                  <p>{selectedItem.textContent}</p>
                </div>
              )}

              <SignedIn>
                <button
                  className="shelf-preview-delete"
                  onClick={() => handleDelete(selectedItem._id)}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                    <line x1="10" y1="11" x2="10" y2="17" />
                    <line x1="14" y1="11" x2="14" y2="17" />
                  </svg>
                </button>
              </SignedIn>
              <button
                className="shelf-preview-close"
                onClick={() => setSelectedItem(null)}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <Footer showSignature={false} />
      <div className="blog-blur-bottom" />
    </div>
  )
}

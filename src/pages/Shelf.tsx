import { useState, useRef, useCallback, useMemo, useEffect } from 'react'
import { useQuery, useMutation } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { SignedIn, useAuth } from '../contexts/AuthContext'
import { useTheme } from './Home'
import { motion, AnimatePresence } from 'framer-motion'
import { useHaptics } from '../hooks/useHaptics'
import { Link } from 'react-router-dom'
import { LazyImage } from '@/components/lazy-image'

type ItemType = 'image' | 'quote' | 'text'
type ItemSize = 'small' | 'medium' | 'large'
type QuoteStyle = 'default' | 'bar'

interface ShelfItem {
  _id: string
  type: ItemType
  storageId?: string
  fileName?: string
  contentType?: string
  url?: string | null
  quoteText?: string
  quoteAuthor?: string
  quoteSource?: string
  quoteStyle?: QuoteStyle
  textContent?: string
  textLabel?: string
  caption?: string
  aspectRatio?: number
  size?: ItemSize
  backgroundColor?: string
  order?: number
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
  { name: 'Graphite', value: '#374151' },
  { name: 'Onyx', value: '#18181b' },
  { name: 'Midnight', value: '#0f172a' },
  { name: 'Stone', value: '#292524' },
  { name: 'Zinc', value: '#27272a' },
]

// Grid configuration for canvas layout
const GRID_COLS = 6
const CELL_WIDTH = 320
const CELL_HEIGHT = 400
const CELL_GAP = 40
const CANVAS_PADDING = 500 // Extra space outside content for scrolling

export default function Shelf() {
  const { theme: resolvedTheme } = useTheme()
  const { sessionToken } = useAuth()
  const items = useQuery(api.shelf.list)
  const haptics = useHaptics()
  const generateUploadUrl = useMutation(api.files.generateUploadUrl)
  const addImage = useMutation(api.shelf.addImage)
  const addQuote = useMutation(api.shelf.addQuote)
  const addText = useMutation(api.shelf.addText)
  const updateItem = useMutation(api.shelf.update)
  const removeItem = useMutation(api.shelf.remove)

  // Canvas state
  const canvasRef = useRef<HTMLDivElement>(null)
  const [isPanning, setIsPanning] = useState(false)
  const [panStart, setPanStart] = useState({ x: 0, y: 0 })
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const [initialOffset, setInitialOffset] = useState({ x: 0, y: 0 })
  const [hasInitialized, setHasInitialized] = useState(false)

  // Momentum/inertia state
  const velocityRef = useRef({ x: 0, y: 0 })
  const lastPosRef = useRef({ x: 0, y: 0 })
  const lastTimeRef = useRef(0)
  const animationRef = useRef<number | null>(null)
  const hasDraggedRef = useRef(false)
  const clickedItemRef = useRef<ShelfItem | null>(null)

  const [isUploading, setIsUploading] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [addType, setAddType] = useState<ItemType>('image')
  const [selectedItem, setSelectedItem] = useState<ShelfItem | null>(null)
  const [editingItem, setEditingItem] = useState<ShelfItem | null>(null)
  const [dragActive, setDragActive] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [pendingFile, setPendingFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  // Form states for add
  const [uploadCaption, setUploadCaption] = useState('')
  const [quoteText, setQuoteText] = useState('')
  const [quoteAuthor, setQuoteAuthor] = useState('')
  const [quoteSource, setQuoteSource] = useState('')
  const [quoteStyle, setQuoteStyle] = useState<QuoteStyle>('default')
  const [textContent, setTextContent] = useState('')
  const [textLabel, setTextLabel] = useState('')
  const [itemSize, setItemSize] = useState<ItemSize>('medium')
  const [backgroundColor, setBackgroundColor] = useState('')

  // Form states for edit
  const [editCaption, setEditCaption] = useState('')
  const [editQuoteText, setEditQuoteText] = useState('')
  const [editQuoteAuthor, setEditQuoteAuthor] = useState('')
  const [editQuoteSource, setEditQuoteSource] = useState('')
  const [editQuoteStyle, setEditQuoteStyle] = useState<QuoteStyle>('default')
  const [editTextContent, setEditTextContent] = useState('')
  const [editTextLabel, setEditTextLabel] = useState('')
  const [editItemSize, setEditItemSize] = useState<ItemSize>('medium')
  const [editBackgroundColor, setEditBackgroundColor] = useState('')

  const shelfItems = useMemo(() => {
    if (!items) return []
    return items as ShelfItem[]
  }, [items])

  // Calculate item positions in a grid layout (offset by padding)
  const itemPositions = useMemo(() => {
    return shelfItems.map((item, index) => {
      const col = index % GRID_COLS
      const row = Math.floor(index / GRID_COLS)
      return {
        item,
        x: CANVAS_PADDING + col * (CELL_WIDTH + CELL_GAP),
        y: CANVAS_PADDING + row * (CELL_HEIGHT + CELL_GAP),
      }
    })
  }, [shelfItems])

  // Calculate canvas bounds (content area + padding on all sides)
  const canvasBounds = useMemo(() => {
    if (itemPositions.length === 0) return { width: 0, height: 0 }
    const rows = Math.ceil(shelfItems.length / GRID_COLS)
    const contentWidth = GRID_COLS * (CELL_WIDTH + CELL_GAP) - CELL_GAP
    const contentHeight = rows * (CELL_HEIGHT + CELL_GAP) - CELL_GAP
    return {
      width: contentWidth + CANVAS_PADDING * 2,
      height: contentHeight + CANVAS_PADDING * 2,
    }
  }, [itemPositions.length, shelfItems.length])

  // Center canvas on load
  useEffect(() => {
    if (!hasInitialized && canvasBounds.width > 0 && canvasRef.current) {
      const viewportWidth = window.innerWidth
      const viewportHeight = window.innerHeight
      const centerX = (viewportWidth - canvasBounds.width) / 2
      const centerY = (viewportHeight - canvasBounds.height) / 2
      setOffset({ x: centerX, y: centerY })
      setHasInitialized(true)
    }
  }, [canvasBounds, hasInitialized])

  // Momentum animation
  const applyMomentum = useCallback(() => {
    const friction = 0.96
    const minVelocity = 0.3

    // Boost initial velocity for more powerful slide
    velocityRef.current.x *= 1.5
    velocityRef.current.y *= 1.5

    const animate = () => {
      velocityRef.current.x *= friction
      velocityRef.current.y *= friction

      if (Math.abs(velocityRef.current.x) < minVelocity && Math.abs(velocityRef.current.y) < minVelocity) {
        velocityRef.current = { x: 0, y: 0 }
        animationRef.current = null
        return
      }

      setOffset(prev => ({
        x: prev.x + velocityRef.current.x,
        y: prev.y + velocityRef.current.y,
      }))

      animationRef.current = requestAnimationFrame(animate)
    }

    animationRef.current = requestAnimationFrame(animate)
  }, [])

  // Stop momentum when starting a new pan
  const stopMomentum = useCallback(() => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current)
      animationRef.current = null
    }
    velocityRef.current = { x: 0, y: 0 }
  }, [])

  // Mouse panning handlers
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return // Only left click
    if ((e.target as HTMLElement).closest('.floating-panel, .modal-overlay')) return
    stopMomentum()
    hasDraggedRef.current = false
    setIsPanning(true)
    setPanStart({ x: e.clientX, y: e.clientY })
    setInitialOffset({ ...offset })
    lastPosRef.current = { x: e.clientX, y: e.clientY }
    lastTimeRef.current = performance.now()
  }, [offset, stopMomentum])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isPanning) return
    const now = performance.now()
    const dt = now - lastTimeRef.current

    const dx = e.clientX - panStart.x
    const dy = e.clientY - panStart.y

    // Mark as dragged if moved more than 5px
    if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
      hasDraggedRef.current = true
      document.body.style.cursor = 'grabbing'
    }

    if (dt > 0) {
      velocityRef.current = {
        x: (e.clientX - lastPosRef.current.x) * (16 / dt),
        y: (e.clientY - lastPosRef.current.y) * (16 / dt),
      }
    }

    lastPosRef.current = { x: e.clientX, y: e.clientY }
    lastTimeRef.current = now

    setOffset({
      x: initialOffset.x + dx,
      y: initialOffset.y + dy,
    })
  }, [isPanning, panStart, initialOffset])

  const handleMouseUp = useCallback(() => {
    if (isPanning) {
      setIsPanning(false)
      document.body.style.cursor = ''

      // Only select item if we didn't drag
      if (!hasDraggedRef.current && clickedItemRef.current) {
        haptics.selection()
        setSelectedItem(clickedItemRef.current)
      } else if (hasDraggedRef.current) {
        applyMomentum()
      }
      clickedItemRef.current = null
    }
  }, [isPanning, applyMomentum, haptics])

  // Touch panning handlers
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if ((e.target as HTMLElement).closest('.floating-panel, .modal-overlay')) return
    stopMomentum()
    hasDraggedRef.current = false
    const touch = e.touches[0]
    setIsPanning(true)
    setPanStart({ x: touch.clientX, y: touch.clientY })
    setInitialOffset({ ...offset })
    lastPosRef.current = { x: touch.clientX, y: touch.clientY }
    lastTimeRef.current = performance.now()
  }, [offset, stopMomentum])

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isPanning) return
    const touch = e.touches[0]
    const now = performance.now()
    const dt = now - lastTimeRef.current

    const dx = touch.clientX - panStart.x
    const dy = touch.clientY - panStart.y

    // Mark as dragged if moved more than 5px
    if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
      hasDraggedRef.current = true
    }

    if (dt > 0) {
      velocityRef.current = {
        x: (touch.clientX - lastPosRef.current.x) * (16 / dt),
        y: (touch.clientY - lastPosRef.current.y) * (16 / dt),
      }
    }

    lastPosRef.current = { x: touch.clientX, y: touch.clientY }
    lastTimeRef.current = now

    setOffset({
      x: initialOffset.x + dx,
      y: initialOffset.y + dy,
    })
  }, [isPanning, panStart, initialOffset])

  const handleTouchEnd = useCallback(() => {
    if (isPanning) {
      setIsPanning(false)

      // Only select item if we didn't drag
      if (!hasDraggedRef.current && clickedItemRef.current) {
        haptics.selection()
        setSelectedItem(clickedItemRef.current)
      } else if (hasDraggedRef.current) {
        applyMomentum()
      }
      clickedItemRef.current = null
    }
  }, [isPanning, applyMomentum, haptics])

  // Wheel handler for scrolling
  const handleWheel = useCallback((e: React.WheelEvent) => {
    if ((e.target as HTMLElement).closest('.floating-panel, .modal-overlay')) return
    e.preventDefault()
    setOffset(prev => ({
      x: prev.x - e.deltaX,
      y: prev.y - e.deltaY,
    }))
  }, [])

  // Reset view to center
  const resetView = useCallback(() => {
    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight
    const centerX = (viewportWidth - canvasBounds.width) / 2
    const centerY = (viewportHeight - canvasBounds.height) / 2
    setOffset({ x: centerX, y: centerY })
    haptics.soft()
  }, [canvasBounds, haptics])

  const resetForm = () => {
    setUploadCaption('')
    setQuoteText('')
    setQuoteAuthor('')
    setQuoteSource('')
    setQuoteStyle('default')
    setTextContent('')
    setTextLabel('')
    setItemSize('medium')
    setBackgroundColor('')
    setAddType('image')
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setPendingFile(null)
    setPreviewUrl(null)
  }

  const openEditModal = (item: ShelfItem) => {
    setEditingItem(item)
    setEditCaption(item.caption || '')
    setEditQuoteText(item.quoteText || '')
    setEditQuoteAuthor(item.quoteAuthor || '')
    setEditQuoteSource(item.quoteSource || '')
    setEditQuoteStyle(item.quoteStyle || 'default')
    setEditTextContent(item.textContent || '')
    setEditTextLabel(item.textLabel || '')
    setEditItemSize(item.size || 'medium')
    setEditBackgroundColor(item.backgroundColor || '')
    setSelectedItem(null)
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
    if (files && files[0]) handleFileSelect(files[0])
  }, [])

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFileSelect(file)
  }

  const handleFileSelect = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file')
      return
    }
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    const url = URL.createObjectURL(file)
    setPreviewUrl(url)
    setPendingFile(file)
  }

  const getImageAspectRatio = (file: File): Promise<number> => {
    return new Promise((resolve) => {
      const img = new Image()
      img.onload = () => {
        resolve(img.width / img.height)
        URL.revokeObjectURL(img.src)
      }
      img.onerror = () => resolve(1)
      img.src = URL.createObjectURL(file)
    })
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
      if (!result.ok) throw new Error('Upload failed')
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
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
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
        quoteStyle: quoteStyle,
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

  const handleUpdate = async () => {
    if (!sessionToken || !editingItem) return
    setIsUploading(true)
    try {
      await updateItem({
        token: sessionToken,
        id: editingItem._id as any,
        caption: editCaption || undefined,
        quoteText: editQuoteText || undefined,
        quoteAuthor: editQuoteAuthor || undefined,
        quoteSource: editQuoteSource || undefined,
        quoteStyle: editQuoteStyle,
        textContent: editTextContent || undefined,
        textLabel: editTextLabel || undefined,
        size: editItemSize,
        backgroundColor: editBackgroundColor || undefined,
      })
      setEditingItem(null)
    } catch (error) {
      console.error('Update error:', error)
      alert('Failed to update item')
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
      setEditingItem(null)
    } catch (error) {
      console.error('Delete error:', error)
      alert('Failed to delete item')
    }
  }

  const isDarkBg = (color: string) => {
    if (!color) return false
    return ['#2d3748', '#1a1a2e', '#374151', '#18181b', '#0f172a', '#292524', '#27272a'].includes(color)
  }

  return (
    <div
      className="canvas-container"
      ref={canvasRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onWheel={handleWheel}
      style={{ cursor: isPanning ? 'grabbing' : 'grab' }}
    >
      {/* Canvas content */}
      <div
        className="canvas-content"
        style={{
          transform: `translate(${offset.x}px, ${offset.y}px)`,
        }}
      >
        {items === undefined ? (
          <div className="canvas-loading">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : shelfItems.length === 0 ? (
          <div className="canvas-empty">
            <p className="text-muted-foreground">No items yet. Add something to your shelf.</p>
          </div>
        ) : (
          itemPositions.map(({ item, x, y }) => (
            <div
              key={item._id}
              className="canvas-item"
              style={{
                left: x,
                top: y,
                width: CELL_WIDTH,
              }}
              onMouseDown={() => { clickedItemRef.current = item }}
              onTouchStart={() => { clickedItemRef.current = item }}
            >
              {item.type === 'image' && item.url && (
                <div className="canvas-item-image">
                  <LazyImage
                    alt={item.caption || item.fileName || 'Image'}
                    containerClassName="rounded-lg"
                    inView={true}
                    ratio={item.aspectRatio || 1}
                    src={item.url}
                  />
                  {item.caption && (
                    <p className="canvas-item-caption">{item.caption}</p>
                  )}
                </div>
              )}

              {item.type === 'quote' && (
                <div
                  className={`canvas-item-quote ${isDarkBg(item.backgroundColor || '') ? 'dark' : ''} ${item.quoteStyle === 'bar' ? 'bar-style' : ''}`}
                  style={{ backgroundColor: item.backgroundColor || undefined }}
                >
                  {item.quoteStyle === 'bar' ? (
                    <div className="shelf-quote-bar-wrapper">
                      <div className="shelf-quote-bar-line" />
                      <div className="shelf-quote-bar-content">
                        <blockquote>"{item.quoteText}"</blockquote>
                        {(item.quoteAuthor || item.quoteSource) && (
                          <cite>
                            {item.quoteAuthor && <span className="quote-author">— {item.quoteAuthor}</span>}
                            {item.quoteSource && <span className="quote-source">{item.quoteSource}</span>}
                          </cite>
                        )}
                      </div>
                    </div>
                  ) : (
                    <>
                      <svg className="shelf-quote-icon" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M4.583 17.321C3.553 16.227 3 15 3 13.011c0-3.5 2.457-6.637 6.03-8.188l.893 1.378c-3.335 1.804-3.987 4.145-4.247 5.621.537-.278 1.24-.375 1.929-.311 1.804.167 3.226 1.648 3.226 3.489a3.5 3.5 0 01-3.5 3.5c-1.073 0-2.099-.49-2.748-1.179zm10 0C13.553 16.227 13 15 13 13.011c0-3.5 2.457-6.637 6.03-8.188l.893 1.378c-3.335 1.804-3.987 4.145-4.247 5.621.537-.278 1.24-.375 1.929-.311 1.804.167 3.226 1.648 3.226 3.489a3.5 3.5 0 01-3.5 3.5c-1.073 0-2.099-.49-2.748-1.179z"/>
                      </svg>
                      <blockquote>{item.quoteText}</blockquote>
                      {(item.quoteAuthor || item.quoteSource) && (
                        <cite>
                          {item.quoteAuthor && <span className="quote-author">— {item.quoteAuthor}</span>}
                          {item.quoteSource && <span className="quote-source">{item.quoteSource}</span>}
                        </cite>
                      )}
                    </>
                  )}
                </div>
              )}

              {item.type === 'text' && (
                <div
                  className={`canvas-item-text ${isDarkBg(item.backgroundColor || '') ? 'dark' : ''}`}
                  style={{ backgroundColor: item.backgroundColor || 'var(--accent)' }}
                >
                  {item.textLabel && (
                    <span className="canvas-item-text-label">
                      {item.textLabel}
                    </span>
                  )}
                  <p>{item.textContent}</p>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Floating navigation panel */}
      <div className="floating-panel">
        <Link to="/" className="floating-panel-btn" onClick={() => haptics.soft()}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </Link>
        <button className="floating-panel-btn" onClick={resetView} title="Reset view">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
            <path d="M3 3v5h5" />
          </svg>
        </button>
        <SignedIn>
          <button
            className="floating-panel-btn"
            onClick={() => { haptics.soft(); setShowAddModal(true) }}
            title="Add item"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </button>
        </SignedIn>
      </div>

      {/* Canvas info */}
      <div className="canvas-info">
        <span>Shelf</span>
        <span className="canvas-info-count">{shelfItems.length} items</span>
      </div>

      {/* Add Modal */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => { setShowAddModal(false); resetForm() }}
          >
            <motion.div
              className="modal-content"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="mb-4 text-xl font-semibold">Add to Shelf</h2>

              <div className="mb-4 flex gap-2">
                {(['image', 'quote', 'text'] as ItemType[]).map((type) => (
                  <button
                    key={type}
                    className={`flex-1 rounded-lg py-2 text-sm font-medium transition-colors ${addType === type ? 'bg-primary text-primary-foreground' : 'bg-accent hover:bg-accent/80'}`}
                    onClick={() => { haptics.selection(); setAddType(type) }}
                  >
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </button>
                ))}
              </div>

              {addType === 'image' && (
                <>
                  {previewUrl ? (
                    <div className="mb-4">
                      <img src={previewUrl} alt="Preview" className="w-full rounded-lg" />
                      <button
                        className="mt-2 text-sm text-primary hover:underline"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        Change image
                      </button>
                    </div>
                  ) : (
                    <div
                      className={`mb-4 flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 transition-colors ${dragActive ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}`}
                      onDragEnter={handleDrag}
                      onDragLeave={handleDrag}
                      onDragOver={handleDrag}
                      onDrop={handleDrop}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <svg className="mb-2 h-8 w-8 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="17 8 12 3 7 8" />
                        <line x1="12" y1="3" x2="12" y2="15" />
                      </svg>
                      <p className="text-sm text-muted-foreground">Drag & drop or click to upload</p>
                    </div>
                  )}
                  <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileInputChange} className="hidden" />
                  <input
                    type="text"
                    placeholder="Caption (optional)"
                    value={uploadCaption}
                    onChange={(e) => setUploadCaption(e.target.value)}
                    className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
                    aria-label="Image caption"
                    spellCheck="true"
                    autoComplete="off"
                  />
                </>
              )}

              {addType === 'quote' && (
                <div className="space-y-3">
                  <textarea
                    placeholder="Enter your quote..."
                    value={quoteText}
                    onChange={(e) => setQuoteText(e.target.value)}
                    rows={4}
                    className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
                    aria-label="Quote text"
                    spellCheck="true"
                  />
                  <input
                    type="text"
                    placeholder="Author (optional)"
                    value={quoteAuthor}
                    onChange={(e) => setQuoteAuthor(e.target.value)}
                    className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
                    aria-label="Quote author"
                    spellCheck="false"
                    autoComplete="off"
                  />
                  <input
                    type="text"
                    placeholder="Source (optional)"
                    value={quoteSource}
                    onChange={(e) => setQuoteSource(e.target.value)}
                    className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
                    aria-label="Quote source"
                    spellCheck="false"
                    autoComplete="off"
                  />
                  <div className="flex flex-wrap gap-2">
                    {BACKGROUND_COLORS.map((color) => (
                      <button
                        key={color.value || 'default'}
                        className={`h-8 w-8 rounded-full border-2 transition-transform ${backgroundColor === color.value ? 'scale-110 border-primary' : 'border-transparent'}`}
                        style={{ backgroundColor: color.value || 'var(--accent)' }}
                        onClick={() => { haptics.selection(); setBackgroundColor(color.value) }}
                        aria-label={`${color.name} background`}
                        aria-pressed={backgroundColor === color.value}
                      />
                    ))}
                  </div>
                </div>
              )}

              {addType === 'text' && (
                <div className="space-y-3">
                  <input
                    type="text"
                    placeholder="Label (optional)"
                    value={textLabel}
                    onChange={(e) => setTextLabel(e.target.value)}
                    className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
                    aria-label="Text label"
                    spellCheck="false"
                    autoComplete="off"
                  />
                  <textarea
                    placeholder="Enter your text..."
                    value={textContent}
                    onChange={(e) => setTextContent(e.target.value)}
                    rows={3}
                    className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
                    aria-label="Text content"
                    spellCheck="true"
                  />
                  <div className="flex flex-wrap gap-2">
                    {BACKGROUND_COLORS.map((color) => (
                      <button
                        key={color.value || 'default'}
                        className={`h-8 w-8 rounded-full border-2 transition-transform ${backgroundColor === color.value ? 'scale-110 border-primary' : 'border-transparent'}`}
                        style={{ backgroundColor: color.value || 'var(--accent)' }}
                        onClick={() => { haptics.selection(); setBackgroundColor(color.value) }}
                        aria-label={`${color.name} background`}
                        aria-pressed={backgroundColor === color.value}
                      />
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-6 flex justify-end gap-2">
                <button
                  className="rounded-lg px-4 py-2 text-sm hover:bg-accent"
                  onClick={() => { haptics.soft(); setShowAddModal(false); resetForm() }}
                >
                  Cancel
                </button>
                <button
                  className="rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground disabled:opacity-50"
                  onClick={() => {
                    haptics.rigid()
                    if (addType === 'image') handleAddImage()
                    else if (addType === 'quote') handleAddQuote()
                    else handleAddText()
                  }}
                  disabled={isUploading || (addType === 'image' && !pendingFile) || (addType === 'quote' && !quoteText.trim()) || (addType === 'text' && !textContent.trim())}
                >
                  {isUploading ? 'Adding...' : 'Add'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Modal */}
      <AnimatePresence>
        {editingItem && (
          <motion.div
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setEditingItem(null)}
          >
            <motion.div
              className="modal-content"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="mb-4 text-xl font-semibold">Edit Item</h2>

              {editingItem.type === 'image' && (
                <div className="space-y-3">
                  {editingItem.url && (
                    <img src={editingItem.url} alt="Preview" className="w-full rounded-lg" />
                  )}
                  <input
                    type="text"
                    placeholder="Caption (optional)"
                    value={editCaption}
                    onChange={(e) => setEditCaption(e.target.value)}
                    className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
                  />
                </div>
              )}

              {editingItem.type === 'quote' && (
                <div className="space-y-3">
                  <textarea
                    placeholder="Enter your quote..."
                    value={editQuoteText}
                    onChange={(e) => setEditQuoteText(e.target.value)}
                    rows={4}
                    className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
                  />
                  <input
                    type="text"
                    placeholder="Author (optional)"
                    value={editQuoteAuthor}
                    onChange={(e) => setEditQuoteAuthor(e.target.value)}
                    className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
                  />
                  <input
                    type="text"
                    placeholder="Source (optional)"
                    value={editQuoteSource}
                    onChange={(e) => setEditQuoteSource(e.target.value)}
                    className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
                  />
                  <div className="flex flex-wrap gap-2">
                    {BACKGROUND_COLORS.map((color) => (
                      <button
                        key={color.value || 'default'}
                        className={`h-8 w-8 rounded-full border-2 transition-transform ${editBackgroundColor === color.value ? 'scale-110 border-primary' : 'border-transparent'}`}
                        style={{ backgroundColor: color.value || 'var(--accent)' }}
                        onClick={() => { haptics.selection(); setEditBackgroundColor(color.value) }}
                        aria-label={`${color.name} background`}
                        aria-pressed={editBackgroundColor === color.value}
                      />
                    ))}
                  </div>
                </div>
              )}

              {editingItem.type === 'text' && (
                <div className="space-y-3">
                  <input
                    type="text"
                    placeholder="Label (optional)"
                    value={editTextLabel}
                    onChange={(e) => setEditTextLabel(e.target.value)}
                    className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
                  />
                  <textarea
                    placeholder="Enter your text..."
                    value={editTextContent}
                    onChange={(e) => setEditTextContent(e.target.value)}
                    rows={3}
                    className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
                  />
                  <div className="flex flex-wrap gap-2">
                    {BACKGROUND_COLORS.map((color) => (
                      <button
                        key={color.value || 'default'}
                        className={`h-8 w-8 rounded-full border-2 transition-transform ${editBackgroundColor === color.value ? 'scale-110 border-primary' : 'border-transparent'}`}
                        style={{ backgroundColor: color.value || 'var(--accent)' }}
                        onClick={() => { haptics.selection(); setEditBackgroundColor(color.value) }}
                        aria-label={`${color.name} background`}
                        aria-pressed={editBackgroundColor === color.value}
                      />
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-6 flex justify-between">
                <button
                  className="rounded-lg px-4 py-2 text-sm text-destructive hover:bg-destructive/10"
                  onClick={() => { haptics.nudge(); handleDelete(editingItem._id) }}
                >
                  Delete
                </button>
                <div className="flex gap-2">
                  <button
                    className="rounded-lg px-4 py-2 text-sm hover:bg-accent"
                    onClick={() => { haptics.soft(); setEditingItem(null) }}
                  >
                    Cancel
                  </button>
                  <button
                    className="rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground disabled:opacity-50"
                    onClick={() => { haptics.rigid(); handleUpdate() }}
                    disabled={isUploading}
                  >
                    {isUploading ? 'Saving...' : 'Save'}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Preview Modal */}
      <AnimatePresence>
        {selectedItem && (
          <motion.div
            className="modal-overlay preview-modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedItem(null)}
          >
            <motion.div
              className="preview-content"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              onClick={(e) => e.stopPropagation()}
            >
              {selectedItem.type === 'image' && selectedItem.url && (
                <img
                  src={selectedItem.url}
                  alt={selectedItem.caption || selectedItem.fileName}
                  className="max-h-[70vh] rounded-lg"
                />
              )}

              {selectedItem.type === 'quote' && (
                <div
                  className={`shelf-quote-preview ${isDarkBg(selectedItem.backgroundColor || '') ? 'dark' : ''} ${selectedItem.quoteStyle === 'bar' ? 'bar-style' : ''}`}
                  style={{ backgroundColor: selectedItem.backgroundColor || undefined }}
                >
                  {selectedItem.quoteStyle === 'bar' ? (
                    <div className="shelf-quote-bar-wrapper">
                      <div className="shelf-quote-bar-line" />
                      <div className="shelf-quote-bar-content">
                        <blockquote>"{selectedItem.quoteText}"</blockquote>
                        {(selectedItem.quoteAuthor || selectedItem.quoteSource) && (
                          <cite>
                            {selectedItem.quoteAuthor && <span className="quote-author">— {selectedItem.quoteAuthor}</span>}
                            {selectedItem.quoteSource && <span className="quote-source">{selectedItem.quoteSource}</span>}
                          </cite>
                        )}
                      </div>
                    </div>
                  ) : (
                    <>
                      <svg className="shelf-quote-icon" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M4.583 17.321C3.553 16.227 3 15 3 13.011c0-3.5 2.457-6.637 6.03-8.188l.893 1.378c-3.335 1.804-3.987 4.145-4.247 5.621.537-.278 1.24-.375 1.929-.311 1.804.167 3.226 1.648 3.226 3.489a3.5 3.5 0 01-3.5 3.5c-1.073 0-2.099-.49-2.748-1.179zm10 0C13.553 16.227 13 15 13 13.011c0-3.5 2.457-6.637 6.03-8.188l.893 1.378c-3.335 1.804-3.987 4.145-4.247 5.621.537-.278 1.24-.375 1.929-.311 1.804.167 3.226 1.648 3.226 3.489a3.5 3.5 0 01-3.5 3.5c-1.073 0-2.099-.49-2.748-1.179z"/>
                      </svg>
                      <blockquote>{selectedItem.quoteText}</blockquote>
                      {(selectedItem.quoteAuthor || selectedItem.quoteSource) && (
                        <cite>
                          {selectedItem.quoteAuthor && <span className="quote-author">— {selectedItem.quoteAuthor}</span>}
                          {selectedItem.quoteSource && <span className="quote-source">{selectedItem.quoteSource}</span>}
                        </cite>
                      )}
                    </>
                  )}
                </div>
              )}

              {selectedItem.type === 'text' && (
                <div className="max-w-lg rounded-lg bg-background p-8">
                  {selectedItem.textLabel && (
                    <span className="mb-2 block text-sm font-medium uppercase tracking-wider text-muted-foreground">
                      {selectedItem.textLabel}
                    </span>
                  )}
                  <p>{selectedItem.textContent}</p>
                </div>
              )}

              <SignedIn>
                <button
                  className="preview-edit-btn"
                  onClick={() => { haptics.soft(); openEditModal(selectedItem) }}
                >
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </svg>
                </button>
              </SignedIn>

              <button
                className="preview-close-btn"
                onClick={() => { haptics.soft(); setSelectedItem(null) }}
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </motion.div>

            {/* Description */}
            {(selectedItem.caption || selectedItem.quoteAuthor || selectedItem.textLabel) && (
              <motion.p
                className="preview-description"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ delay: 0.15 }}
                onClick={(e) => e.stopPropagation()}
              >
                {selectedItem.caption || (selectedItem.quoteAuthor ? `— ${selectedItem.quoteAuthor}` : selectedItem.textLabel)}
              </motion.p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

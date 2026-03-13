import { useState, useRef, useCallback, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useMutation } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { SignedIn, useAuth } from '../contexts/AuthContext'
import { useTheme } from './Home'
import { motion, AnimatePresence } from 'framer-motion'
import { useHaptics } from '../hooks/useHaptics'
import { Footer } from '../components/Footer'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import type { DragEndEvent } from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
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

// Sortable Item for edit mode
function SortableItem({ item, index, isDarkBg }: {
  item: ShelfItem
  index: number
  isDarkBg: (color: string) => boolean
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item._id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 1000 : 1,
  }

  const bgStyle = item.backgroundColor ? { backgroundColor: item.backgroundColor } : {}
  const isDark = isDarkBg(item.backgroundColor || '')

  return (
    <div
      ref={setNodeRef}
      style={{ ...style, ...bgStyle }}
      className={`shelf-reorder-item ${isDark ? 'dark-bg' : ''}`}
      {...attributes}
      {...listeners}
    >
      <div className="shelf-item-drag-handle">
        <svg viewBox="0 0 24 24" fill="currentColor">
          <circle cx="9" cy="6" r="1.5" />
          <circle cx="15" cy="6" r="1.5" />
          <circle cx="9" cy="12" r="1.5" />
          <circle cx="15" cy="12" r="1.5" />
          <circle cx="9" cy="18" r="1.5" />
          <circle cx="15" cy="18" r="1.5" />
        </svg>
      </div>
      {item.type === 'image' && item.url && (
        <img src={item.url} alt={item.caption || item.fileName} />
      )}
      {item.type === 'quote' && (
        <p className="shelf-reorder-quote">"{item.quoteText}"</p>
      )}
      {item.type === 'text' && (
        <p className="shelf-reorder-text">{item.textContent}</p>
      )}
    </div>
  )
}

export default function Shelf() {
  // Initialize theme (ensures data-theme is set when landing directly on this page)
  useTheme()
  const { sessionToken, isAuthenticated } = useAuth()
  const items = useQuery(api.shelf.list)
  const haptics = useHaptics()
  const generateUploadUrl = useMutation(api.files.generateUploadUrl)
  const addImage = useMutation(api.shelf.addImage)
  const addQuote = useMutation(api.shelf.addQuote)
  const addText = useMutation(api.shelf.addText)
  const updateItem = useMutation(api.shelf.update)
  const removeItem = useMutation(api.shelf.remove)
  const reorderItems = useMutation(api.shelf.reorder)

  const [isUploading, setIsUploading] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [addType, setAddType] = useState<ItemType>('image')
  const [selectedItem, setSelectedItem] = useState<ShelfItem | null>(null)
  const [editingItem, setEditingItem] = useState<ShelfItem | null>(null)
  const [dragActive, setDragActive] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
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

  // Get current index of selected item
  const selectedIndex = useMemo(() => {
    if (!selectedItem || !shelfItems.length) return -1
    return shelfItems.findIndex(item => item._id === selectedItem._id)
  }, [selectedItem, shelfItems])

  // Navigation functions
  const goToPrevItem = useCallback(() => {
    if (selectedIndex > 0) {
      haptics.selection()
      setSelectedItem(shelfItems[selectedIndex - 1])
    }
  }, [selectedIndex, shelfItems, haptics])

  const goToNextItem = useCallback(() => {
    if (selectedIndex < shelfItems.length - 1) {
      haptics.selection()
      setSelectedItem(shelfItems[selectedIndex + 1])
    }
  }, [selectedIndex, shelfItems, haptics])

  const goToItem = useCallback((index: number) => {
    if (index >= 0 && index < shelfItems.length) {
      haptics.selection()
      setSelectedItem(shelfItems[index])
    }
  }, [shelfItems, haptics])

  // Distribute items across 4 columns for masonry
  const columns = useMemo(() => {
    const cols: ShelfItem[][] = [[], [], [], []]
    shelfItems.forEach((item, index) => {
      cols[index % 4].push(item)
    })
    return cols
  }, [shelfItems])

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    if (over && active.id !== over.id && sessionToken) {
      const oldIndex = shelfItems.findIndex((item) => item._id === active.id)
      const newIndex = shelfItems.findIndex((item) => item._id === over.id)
      const newItems = arrayMove(shelfItems, oldIndex, newIndex)
      const orderUpdates = newItems.map((item, index) => ({
        id: item._id as any,
        order: index,
      }))
      try {
        await reorderItems({ token: sessionToken, items: orderUpdates })
      } catch (error) {
        console.error('Reorder error:', error)
      }
    }
  }

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
    <div className="blog-container shelf-container">
      <header className="blog-header">
        <nav className="breadcrumb">
          <Link to="/" className="breadcrumb-link">Home</Link>
          <span className="breadcrumb-sep">/</span>
          <span className="breadcrumb-current">Shelf</span>
        </nav>
        <div className="header-right">
          <SignedIn>
            <button
              className={`theme-toggle ${isEditMode ? 'active' : ''}`}
              onClick={() => { haptics.selection(); setIsEditMode(!isEditMode) }}
              aria-label={isEditMode ? 'Exit edit mode' : 'Enter edit mode'}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
              </svg>
            </button>
            <button
              className="theme-toggle"
              onClick={() => { haptics.soft(); setShowAddModal(true) }}
              aria-label="Add item"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </button>
          </SignedIn>
        </div>
      </header>

      <motion.div
        className="shelf-title-section"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="shelf-title">my shelf</h1>
        {isEditMode && (
          <p className="shelf-edit-hint">Drag items to reorder</p>
        )}
      </motion.div>

      {/* Content */}
      <main className="shelf-content">
        {items === undefined ? (
          <div className="flex items-center justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : shelfItems.length === 0 ? (
          <p className="py-20 text-center text-muted-foreground">No items yet.</p>
        ) : isEditMode && isAuthenticated ? (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={shelfItems.map(item => item._id)} strategy={verticalListSortingStrategy}>
              <div className="flex flex-col gap-3">
                {shelfItems.map((item, index) => (
                  <SortableItem key={item._id} item={item} index={index} isDarkBg={isDarkBg} />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4 md:gap-6">
            {columns.map((columnItems, col) => (
              <div className="grid gap-4" key={col}>
                {columnItems.map((item) => {
                  if (item.type === 'image' && item.url) {
                    return (
                      <div
                        key={item._id}
                        onClick={() => setSelectedItem(item)}
                        className="cursor-pointer overflow-hidden rounded-lg transition-transform hover:scale-[1.02]"
                      >
                        <LazyImage
                          alt={item.caption || item.fileName || 'Image'}
                          containerClassName="rounded-lg"
                          inView={true}
                          ratio={item.aspectRatio || 1}
                          src={item.url}
                        />
                        {item.caption && (
                          <p className="mt-2 text-sm text-muted-foreground">{item.caption}</p>
                        )}
                      </div>
                    )
                  }

                  if (item.type === 'quote') {
                    const isDark = isDarkBg(item.backgroundColor || '')
                    const isBarStyle = item.quoteStyle === 'bar'
                    return (
                      <div
                        key={item._id}
                        onClick={() => setSelectedItem(item)}
                        className={`shelf-quote-card ${isDark ? 'dark' : ''} ${isBarStyle ? 'bar-style' : ''}`}
                        style={{ backgroundColor: item.backgroundColor || undefined }}
                      >
                        {isBarStyle ? (
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
                    )
                  }

                  if (item.type === 'text') {
                    const isDark = isDarkBg(item.backgroundColor || '')
                    return (
                      <div
                        key={item._id}
                        onClick={() => setSelectedItem(item)}
                        className={`cursor-pointer rounded-lg p-4 transition-transform hover:scale-[1.02] ${isDark ? 'text-white' : ''}`}
                        style={{ backgroundColor: item.backgroundColor || 'var(--accent)' }}
                      >
                        {item.textLabel && (
                          <span className="mb-1 block text-xs font-medium uppercase tracking-wider opacity-60">
                            {item.textLabel}
                          </span>
                        )}
                        <p className="text-sm">{item.textContent}</p>
                      </div>
                    )
                  }

                  return null
                })}
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Add Modal */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => { setShowAddModal(false); resetForm() }}
          >
            <motion.div
              className="w-full max-w-md rounded-xl bg-background p-6 shadow-xl"
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
                  />
                  <input
                    type="text"
                    placeholder="Author (optional)"
                    value={quoteAuthor}
                    onChange={(e) => setQuoteAuthor(e.target.value)}
                    className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
                  />
                  <input
                    type="text"
                    placeholder="Source (optional)"
                    value={quoteSource}
                    onChange={(e) => setQuoteSource(e.target.value)}
                    className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
                  />
                  <div className="flex flex-wrap gap-2">
                    {BACKGROUND_COLORS.map((color) => (
                      <button
                        key={color.value || 'default'}
                        className={`h-8 w-8 rounded-full border-2 transition-transform ${backgroundColor === color.value ? 'scale-110 border-primary' : 'border-transparent'}`}
                        style={{ backgroundColor: color.value || 'var(--accent)' }}
                        onClick={() => { haptics.selection(); setBackgroundColor(color.value) }}
                        title={color.name}
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
                  />
                  <textarea
                    placeholder="Enter your text..."
                    value={textContent}
                    onChange={(e) => setTextContent(e.target.value)}
                    rows={3}
                    className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
                  />
                  <div className="flex flex-wrap gap-2">
                    {BACKGROUND_COLORS.map((color) => (
                      <button
                        key={color.value || 'default'}
                        className={`h-8 w-8 rounded-full border-2 transition-transform ${backgroundColor === color.value ? 'scale-110 border-primary' : 'border-transparent'}`}
                        style={{ backgroundColor: color.value || 'var(--accent)' }}
                        onClick={() => { haptics.selection(); setBackgroundColor(color.value) }}
                        title={color.name}
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
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setEditingItem(null)}
          >
            <motion.div
              className="w-full max-w-md rounded-xl bg-background p-6 shadow-xl"
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
                        title={color.name}
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
                        title={color.name}
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
            className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/80 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedItem(null)}
          >
            <motion.div
              className="relative max-h-[75vh] max-w-4xl overflow-auto"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              onClick={(e) => e.stopPropagation()}
            >
              {selectedItem.type === 'image' && selectedItem.url && (
                <img
                  src={selectedItem.url}
                  alt={selectedItem.caption || selectedItem.fileName}
                  className="max-h-[80vh] rounded-lg"
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
                  className="absolute right-2 top-2 rounded-full bg-background/80 p-2 backdrop-blur-sm hover:bg-background"
                  onClick={() => { haptics.soft(); openEditModal(selectedItem) }}
                >
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </svg>
                </button>
              </SignedIn>

              <button
                className="absolute left-2 top-2 rounded-full bg-background/80 p-2 backdrop-blur-sm hover:bg-background"
                onClick={() => { haptics.soft(); setSelectedItem(null) }}
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </motion.div>

            {/* Navigation Pill */}
            <motion.div
              className="mt-4 flex items-center gap-2 rounded-full bg-black/20 px-2 py-1.5 backdrop-blur-xl"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ delay: 0.1 }}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 transition-colors hover:bg-white/20 disabled:opacity-30 disabled:hover:bg-white/10"
                onClick={goToPrevItem}
                disabled={selectedIndex <= 0}
                aria-label="Previous"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <path d="M14.5 18L8.5 12L14.5 6" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>

              <button
                className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 transition-colors hover:bg-white/20 disabled:opacity-30 disabled:hover:bg-white/10"
                onClick={goToNextItem}
                disabled={selectedIndex >= shelfItems.length - 1}
                aria-label="Next"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <path d="M9.5 18L15.5 12L9.5 6" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </motion.div>

            {/* Description */}
            {(selectedItem.caption || selectedItem.quoteAuthor || selectedItem.textLabel) && (
              <motion.p
                className="mt-3 max-w-md text-center text-sm text-white/70"
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

      {/* Description */}
      <p className="shelf-description">
        A collection of moments, ideas, and inspirations that have shaped my journey.
      </p>

      <Footer showSignature={false} />
    </div>
  )
}

import { useEffect, useRef, useState } from 'react'
import { useMutation } from 'convex/react'
import { motion } from 'framer-motion'
import {
  DndContext,
  PointerSensor,
  KeyboardSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { api } from '../../../convex/_generated/api'
import { useAuth } from '../../contexts/AuthContext'

type ItemType = 'image' | 'quote' | 'text'
type QuoteStyle = 'default' | 'bar'

interface ShelfItem {
  _id: string
  type: ItemType
  url?: string | null
  fileName?: string
  contentType?: string
  caption?: string
  quoteText?: string
  quoteAuthor?: string
  quoteSource?: string
  quoteStyle?: QuoteStyle
  textContent?: string
  textLabel?: string
  backgroundColor?: string
}

interface ShelfEditorProps {
  items: ShelfItem[]
  onClose: () => void
}

function GripIcon() {
  return (
    <svg viewBox="0 0 20 20" width="14" height="14" fill="currentColor" aria-hidden="true">
      <circle cx="7" cy="5" r="1.4" />
      <circle cx="13" cy="5" r="1.4" />
      <circle cx="7" cy="10" r="1.4" />
      <circle cx="13" cy="10" r="1.4" />
      <circle cx="7" cy="15" r="1.4" />
      <circle cx="13" cy="15" r="1.4" />
    </svg>
  )
}

function SortableItemCard({
  item,
  onFieldChange,
  onRemove,
}: {
  item: ShelfItem
  onFieldChange: (
    item: ShelfItem,
    field: 'caption' | 'quoteText' | 'quoteAuthor' | 'quoteSource' | 'textContent' | 'textLabel',
    value: string,
  ) => void
  onRemove: (item: ShelfItem) => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item._id,
  })

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : undefined,
    position: 'relative',
  }

  return (
    <div ref={setNodeRef} style={style} className="editor-item-card" role="group" aria-label={`${item.type} item`}>
      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
        <button
          type="button"
          {...attributes}
          {...listeners}
          aria-label="Drag to reorder"
          style={{
            cursor: isDragging ? 'grabbing' : 'grab',
            background: 'transparent',
            border: 'none',
            padding: 4,
            marginTop: 4,
            color: 'var(--text-tertiary)',
            display: 'flex',
            alignItems: 'center',
            touchAction: 'none',
          }}
        >
          <GripIcon />
        </button>

        {item.type === 'image' && item.url && (
          <img
            src={item.url}
            alt={item.caption || ''}
            style={{ width: 72, height: 72, objectFit: 'cover', borderRadius: 8, flexShrink: 0 }}
          />
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: '.75rem', textTransform: 'uppercase', letterSpacing: '.05em', color: 'var(--text-tertiary)', marginBottom: 6 }}>
            {item.type}
          </div>

          {item.type === 'image' && (
            <div className="editor-field">
              <label htmlFor={`shelf-caption-${item._id}`}>Caption</label>
              <input
                id={`shelf-caption-${item._id}`}
                type="text"
                defaultValue={item.caption || ''}
                onBlur={(e) => onFieldChange(item, 'caption', e.target.value)}
                placeholder="Caption (optional)"
              />
            </div>
          )}

          {item.type === 'quote' && (
            <>
              <div className="editor-field">
                <label htmlFor={`shelf-quote-${item._id}`}>Quote</label>
                <textarea
                  id={`shelf-quote-${item._id}`}
                  defaultValue={item.quoteText || ''}
                  onBlur={(e) => onFieldChange(item, 'quoteText', e.target.value)}
                  rows={3}
                />
              </div>
              <div className="editor-field">
                <label htmlFor={`shelf-author-${item._id}`}>Author</label>
                <input
                  id={`shelf-author-${item._id}`}
                  type="text"
                  defaultValue={item.quoteAuthor || ''}
                  onBlur={(e) => onFieldChange(item, 'quoteAuthor', e.target.value)}
                />
              </div>
              <div className="editor-field">
                <label htmlFor={`shelf-source-${item._id}`}>Source</label>
                <input
                  id={`shelf-source-${item._id}`}
                  type="text"
                  defaultValue={item.quoteSource || ''}
                  onBlur={(e) => onFieldChange(item, 'quoteSource', e.target.value)}
                />
              </div>
            </>
          )}

          {item.type === 'text' && (
            <>
              <div className="editor-field">
                <label htmlFor={`shelf-tlabel-${item._id}`}>Label</label>
                <input
                  id={`shelf-tlabel-${item._id}`}
                  type="text"
                  defaultValue={item.textLabel || ''}
                  onBlur={(e) => onFieldChange(item, 'textLabel', e.target.value)}
                />
              </div>
              <div className="editor-field">
                <label htmlFor={`shelf-tcontent-${item._id}`}>Content</label>
                <textarea
                  id={`shelf-tcontent-${item._id}`}
                  defaultValue={item.textContent || ''}
                  onBlur={(e) => onFieldChange(item, 'textContent', e.target.value)}
                  rows={2}
                />
              </div>
            </>
          )}
        </div>
      </div>
      <button
        type="button"
        onClick={() => onRemove(item)}
        className="remove-item-btn"
        aria-label="Remove item"
      >
        Remove
      </button>
    </div>
  )
}

const BACKGROUND_COLORS = [
  { name: 'Default', value: '' },
  { name: 'Warm', value: '#f5e6d3' },
  { name: 'Cool', value: '#e3edf7' },
  { name: 'Sage', value: '#e8ede5' },
  { name: 'Blush', value: '#f7e4e4' },
  { name: 'Slate', value: '#2d3748' },
  { name: 'Charcoal', value: '#1a1a2e' },
  { name: 'Onyx', value: '#18181b' },
  { name: 'Midnight', value: '#0f172a' },
]

function getImageAspectRatio(file: File): Promise<number> {
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

export function ShelfEditor({ items, onClose }: ShelfEditorProps) {
  const { sessionToken } = useAuth()
  const generateUploadUrl = useMutation(api.files.generateUploadUrl)
  const addImage = useMutation(api.shelf.addImage)
  const addQuote = useMutation(api.shelf.addQuote)
  const addText = useMutation(api.shelf.addText)
  const updateItem = useMutation(api.shelf.update)
  const removeItem = useMutation(api.shelf.remove)
  const reorderItems = useMutation(api.shelf.reorder)

  // Local ordering — kept in sync with server items, mutated optimistically
  // by drag-to-reorder and randomize before the reorder mutation flushes.
  const [orderedIds, setOrderedIds] = useState<string[]>(() => items.map((i) => i._id))
  useEffect(() => {
    // Reconcile when the server list changes (new add, deletion, etc.)
    setOrderedIds((prev) => {
      const known = new Set(prev)
      const merged: string[] = prev.filter((id) => items.some((i) => i._id === id))
      for (const it of items) if (!known.has(it._id)) merged.push(it._id)
      return merged
    })
  }, [items])

  const orderedItems = orderedIds
    .map((id) => items.find((i) => i._id === id))
    .filter((i): i is ShelfItem => !!i)

  const persistOrder = async (ids: string[]) => {
    if (!sessionToken) return
    try {
      await reorderItems({
        token: sessionToken,
        items: ids.map((id, index) => ({ id: id as never, order: index })),
      })
    } catch (err) {
      console.error('Reorder failed:', err)
    }
  }

  const handleRandomize = () => {
    const shuffled = [...orderedIds]
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }
    setOrderedIds(shuffled)
    void persistOrder(shuffled)
  }

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = orderedIds.indexOf(String(active.id))
    const newIndex = orderedIds.indexOf(String(over.id))
    if (oldIndex < 0 || newIndex < 0) return
    const next = arrayMove(orderedIds, oldIndex, newIndex)
    setOrderedIds(next)
    void persistOrder(next)
  }

  const [busy, setBusy] = useState(false)
  const [addType, setAddType] = useState<ItemType>('image')
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Add form state
  const [pendingFile, setPendingFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [newCaption, setNewCaption] = useState('')
  const [newQuoteText, setNewQuoteText] = useState('')
  const [newQuoteAuthor, setNewQuoteAuthor] = useState('')
  const [newQuoteSource, setNewQuoteSource] = useState('')
  const [newQuoteStyle, setNewQuoteStyle] = useState<QuoteStyle>('default')
  const [newTextContent, setNewTextContent] = useState('')
  const [newTextLabel, setNewTextLabel] = useState('')
  const [newBg, setNewBg] = useState('')

  const resetAddForm = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setPendingFile(null)
    setPreviewUrl(null)
    setNewCaption('')
    setNewQuoteText('')
    setNewQuoteAuthor('')
    setNewQuoteSource('')
    setNewQuoteStyle('default')
    setNewTextContent('')
    setNewTextLabel('')
    setNewBg('')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleFileSelect = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file')
      return
    }
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setPreviewUrl(URL.createObjectURL(file))
    setPendingFile(file)
  }

  const handleAdd = async () => {
    if (!sessionToken) return
    setBusy(true)
    try {
      if (addType === 'image' && pendingFile) {
        const aspectRatio = await getImageAspectRatio(pendingFile)
        const uploadUrl = await generateUploadUrl()
        const res = await fetch(uploadUrl, {
          method: 'POST',
          headers: { 'Content-Type': pendingFile.type },
          body: pendingFile,
        })
        if (!res.ok) throw new Error('Upload failed')
        const { storageId } = await res.json()
        await addImage({
          token: sessionToken,
          storageId,
          fileName: pendingFile.name,
          contentType: pendingFile.type,
          caption: newCaption || undefined,
          aspectRatio,
        })
      } else if (addType === 'quote' && newQuoteText.trim()) {
        await addQuote({
          token: sessionToken,
          quoteText: newQuoteText.trim(),
          quoteAuthor: newQuoteAuthor.trim() || undefined,
          quoteSource: newQuoteSource.trim() || undefined,
          quoteStyle: newQuoteStyle,
          backgroundColor: newBg || undefined,
        })
      } else if (addType === 'text' && newTextContent.trim()) {
        await addText({
          token: sessionToken,
          textContent: newTextContent.trim(),
          textLabel: newTextLabel.trim() || undefined,
          backgroundColor: newBg || undefined,
        })
      }
      resetAddForm()
    } catch (err) {
      console.error('Add shelf item failed:', err)
      alert('Failed to add item')
    } finally {
      setBusy(false)
    }
  }

  const handleItemFieldChange = async (
    item: ShelfItem,
    field: 'caption' | 'quoteText' | 'quoteAuthor' | 'quoteSource' | 'textContent' | 'textLabel',
    value: string,
  ) => {
    if (!sessionToken) return
    try {
      await updateItem({
        token: sessionToken,
        id: item._id as never,
        [field]: value,
      } as never)
    } catch (err) {
      console.error('Update failed:', err)
    }
  }

  const handleRemove = async (item: ShelfItem) => {
    if (!sessionToken) return
    if (!confirm('Delete this shelf item?')) return
    try {
      await removeItem({ token: sessionToken, id: item._id as never })
    } catch (err) {
      console.error('Remove failed:', err)
      alert('Failed to remove item')
    }
  }

  const canAdd =
    (addType === 'image' && !!pendingFile) ||
    (addType === 'quote' && newQuoteText.trim().length > 0) ||
    (addType === 'text' && newTextContent.trim().length > 0)

  return (
    <motion.div
      className="inline-editor-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="shelf-editor-title"
    >
      <motion.div
        className="inline-editor inline-editor-large"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.15 }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 id="shelf-editor-title" className="editor-title">Edit Shelf</h3>

        {/* Existing items */}
        <div className="editor-section">
          <div className="editor-section-header">
            <span>Items ({items.length})</span>
            {items.length > 1 && (
              <button
                type="button"
                onClick={handleRandomize}
                className="add-btn"
                aria-label="Randomize order"
                title="Shuffle item order"
              >
                ↻ Randomize
              </button>
            )}
          </div>

          {items.length === 0 && (
            <p style={{ fontSize: '.8125rem', color: 'var(--text-tertiary)', margin: '4px 0 12px' }}>
              No items yet — add one below.
            </p>
          )}

          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={orderedIds} strategy={verticalListSortingStrategy}>
              {orderedItems.map((item) => (
                <SortableItemCard
                  key={item._id}
                  item={item}
                  onFieldChange={handleItemFieldChange}
                  onRemove={handleRemove}
                />
              ))}
            </SortableContext>
          </DndContext>
        </div>

        {/* Add new item */}
        <div className="editor-section">
          <div className="editor-section-header">
            <span>Add new</span>
          </div>

          <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
            {(['image', 'quote', 'text'] as ItemType[]).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => { setAddType(t); resetAddForm() }}
                className={addType === t ? 'add-btn' : 'remove-item-btn'}
                style={{
                  textTransform: 'capitalize',
                  flex: 1,
                }}
              >
                {t}
              </button>
            ))}
          </div>

          {addType === 'image' && (
            <div className="editor-item-card">
              {previewUrl ? (
                <>
                  <img
                    src={previewUrl}
                    alt="Preview"
                    style={{ width: '100%', maxHeight: 200, objectFit: 'contain', borderRadius: 8, marginBottom: 12 }}
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="remove-item-btn"
                  >
                    Change image
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="add-btn"
                  style={{ width: '100%', padding: '20px' }}
                >
                  Click to choose image
                </button>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={(e) => {
                  const f = e.target.files?.[0]
                  if (f) handleFileSelect(f)
                }}
              />
              <div className="editor-field">
                <label htmlFor="new-shelf-caption">Caption</label>
                <input
                  id="new-shelf-caption"
                  type="text"
                  value={newCaption}
                  onChange={(e) => setNewCaption(e.target.value)}
                  placeholder="Optional caption"
                />
              </div>
            </div>
          )}

          {addType === 'quote' && (
            <div className="editor-item-card">
              <div className="editor-field">
                <label htmlFor="new-shelf-quote">Quote</label>
                <textarea
                  id="new-shelf-quote"
                  value={newQuoteText}
                  onChange={(e) => setNewQuoteText(e.target.value)}
                  placeholder="Quote text"
                  rows={3}
                />
              </div>
              <div className="editor-field">
                <label htmlFor="new-shelf-author">Author</label>
                <input
                  id="new-shelf-author"
                  type="text"
                  value={newQuoteAuthor}
                  onChange={(e) => setNewQuoteAuthor(e.target.value)}
                  placeholder="Author (optional)"
                />
              </div>
              <div className="editor-field">
                <label htmlFor="new-shelf-source">Source</label>
                <input
                  id="new-shelf-source"
                  type="text"
                  value={newQuoteSource}
                  onChange={(e) => setNewQuoteSource(e.target.value)}
                  placeholder="Source (optional)"
                />
              </div>
              <div className="editor-field">
                <label>Style</label>
                <div style={{ display: 'flex', gap: 6 }}>
                  {(['default', 'bar'] as QuoteStyle[]).map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setNewQuoteStyle(s)}
                      className={newQuoteStyle === s ? 'add-btn' : 'remove-item-btn'}
                      style={{ textTransform: 'capitalize' }}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
              <div className="editor-field">
                <label>Background</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {BACKGROUND_COLORS.map((c) => (
                    <button
                      key={c.value || 'default'}
                      type="button"
                      onClick={() => setNewBg(c.value)}
                      aria-label={c.name}
                      aria-pressed={newBg === c.value}
                      style={{
                        width: 24,
                        height: 24,
                        borderRadius: 12,
                        border: newBg === c.value ? '2px solid var(--text)' : '1px solid var(--border)',
                        background: c.value || 'var(--bg)',
                        cursor: 'pointer',
                        padding: 0,
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

          {addType === 'text' && (
            <div className="editor-item-card">
              <div className="editor-field">
                <label htmlFor="new-shelf-tlabel">Label</label>
                <input
                  id="new-shelf-tlabel"
                  type="text"
                  value={newTextLabel}
                  onChange={(e) => setNewTextLabel(e.target.value)}
                  placeholder="Label (optional)"
                />
              </div>
              <div className="editor-field">
                <label htmlFor="new-shelf-tcontent">Content</label>
                <textarea
                  id="new-shelf-tcontent"
                  value={newTextContent}
                  onChange={(e) => setNewTextContent(e.target.value)}
                  placeholder="Text content"
                  rows={2}
                />
              </div>
              <div className="editor-field">
                <label>Background</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {BACKGROUND_COLORS.map((c) => (
                    <button
                      key={c.value || 'default'}
                      type="button"
                      onClick={() => setNewBg(c.value)}
                      aria-label={c.name}
                      aria-pressed={newBg === c.value}
                      style={{
                        width: 24,
                        height: 24,
                        borderRadius: 12,
                        border: newBg === c.value ? '2px solid var(--text)' : '1px solid var(--border)',
                        background: c.value || 'var(--bg)',
                        cursor: 'pointer',
                        padding: 0,
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={handleAdd}
            className="add-btn"
            disabled={!canAdd || busy}
            style={{ width: '100%', marginTop: 8 }}
          >
            {busy ? 'Saving…' : 'Add item'}
          </button>
        </div>

        <div className="editor-actions">
          <button onClick={onClose} className="cancel-btn" disabled={busy}>
            Done
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}

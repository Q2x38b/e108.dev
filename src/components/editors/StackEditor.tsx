import { useState } from 'react'
import { useMutation } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import type { Id } from '../../../convex/_generated/dataModel'
import { useAuth } from '../../contexts/AuthContext'
import { motion } from 'framer-motion'

interface StackItemData {
  _id: string
  name: string
  category: string
  note?: string
  url?: string
  order: number
}

interface StackEditorProps {
  items: StackItemData[]
  onClose: () => void
}

export function StackEditor({ items, onClose }: StackEditorProps) {
  const { sessionToken } = useAuth()
  const updateStackItem = useMutation(api.content.updateStackItem)
  const createStackItem = useMutation(api.content.createStackItem)
  const deleteStackItem = useMutation(api.content.deleteStackItem)

  const [localItems, setLocalItems] = useState(
    items.map(i => ({ ...i, note: i.note ?? '', url: i.url ?? '', isNew: false }))
  )
  const [saving, setSaving] = useState(false)

  // Existing categories as suggestions for the category input
  const categorySuggestions = Array.from(
    new Set([...items.map(i => i.category), ...localItems.map(i => i.category)].filter(Boolean))
  )

  const handleChange = (index: number, field: 'name' | 'category' | 'note' | 'url', value: string) => {
    const updated = [...localItems]
    updated[index] = { ...updated[index], [field]: value }
    setLocalItems(updated)
  }

  const addItem = () => {
    setLocalItems([...localItems, {
      _id: `new-${Date.now()}`,
      name: '',
      category: '',
      note: '',
      url: '',
      order: localItems.length,
      isNew: true
    }])
  }

  const removeItem = (index: number) => {
    setLocalItems(localItems.filter((_, i) => i !== index))
  }

  const handleSave = async () => {
    if (!sessionToken) return
    setSaving(true)
    try {
      // Delete removed items
      const currentIds = new Set(localItems.filter(i => !i.isNew).map(i => i._id))
      for (const item of items) {
        if (!currentIds.has(item._id)) {
          await deleteStackItem({ token: sessionToken, id: item._id as Id<'stackItems'> })
        }
      }

      // Update existing and create new items
      for (const item of localItems) {
        if (item.isNew) {
          if (!item.name.trim()) continue
          await createStackItem({
            token: sessionToken,
            name: item.name.trim(),
            category: item.category.trim(),
            note: item.note.trim(),
            url: item.url.trim()
          })
        } else {
          const original = items.find(i => i._id === item._id)
          if (original && (
            original.name !== item.name ||
            original.category !== item.category ||
            (original.note ?? '') !== item.note ||
            (original.url ?? '') !== item.url
          )) {
            await updateStackItem({
              token: sessionToken,
              id: item._id as Id<'stackItems'>,
              name: item.name.trim(),
              category: item.category.trim(),
              note: item.note.trim(),
              url: item.url.trim()
            })
          }
        }
      }

      onClose()
    } catch (error) {
      console.error('Failed to save:', error)
      alert('Failed to save changes')
    }
    setSaving(false)
  }

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
      aria-labelledby="stack-editor-title"
    >
      <motion.div
        className="inline-editor inline-editor-large"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.15 }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 id="stack-editor-title" className="editor-title">Edit Stack</h3>

        <div className="editor-section">
          <div className="editor-section-header">
            <span>Stack Items</span>
            <button type="button" onClick={addItem} className="add-btn">
              + Add Item
            </button>
          </div>
          <datalist id="stack-category-suggestions">
            {categorySuggestions.map(cat => (
              <option key={cat} value={cat} />
            ))}
          </datalist>
          {localItems.map((item, index) => (
            <div key={item._id} className="editor-item-card" role="group" aria-label={`Stack item ${index + 1}`}>
              <div className="editor-row">
                <div className="editor-field">
                  <label htmlFor={`stack-name-${index}`}>Name</label>
                  <input
                    id={`stack-name-${index}`}
                    type="text"
                    value={item.name}
                    onChange={(e) => handleChange(index, 'name', e.target.value)}
                    placeholder="VS Code"
                    spellCheck="false"
                    autoComplete="off"
                  />
                </div>
                <div className="editor-field">
                  <label htmlFor={`stack-category-${index}`}>Category</label>
                  <input
                    id={`stack-category-${index}`}
                    type="text"
                    value={item.category}
                    onChange={(e) => handleChange(index, 'category', e.target.value)}
                    placeholder="Dev"
                    list="stack-category-suggestions"
                    spellCheck="false"
                    autoComplete="off"
                  />
                </div>
              </div>
              <div className="editor-field">
                <label htmlFor={`stack-note-${index}`}>Note</label>
                <input
                  id={`stack-note-${index}`}
                  type="text"
                  value={item.note}
                  onChange={(e) => handleChange(index, 'note', e.target.value)}
                  placeholder="What you use it for (optional)"
                  autoComplete="off"
                />
              </div>
              <div className="editor-field">
                <label htmlFor={`stack-url-${index}`}>URL</label>
                <input
                  id={`stack-url-${index}`}
                  type="url"
                  value={item.url}
                  onChange={(e) => handleChange(index, 'url', e.target.value)}
                  placeholder="https:// (optional)"
                  spellCheck="false"
                  autoComplete="off"
                />
              </div>
              <button
                type="button"
                onClick={() => removeItem(index)}
                className="remove-item-btn"
                aria-label={`Remove stack item ${index + 1}`}
              >
                Remove
              </button>
            </div>
          ))}
        </div>

        <div className="editor-actions">
          <button onClick={onClose} className="cancel-btn" disabled={saving}>
            Cancel
          </button>
          <button onClick={handleSave} disabled={saving} className="save-btn" aria-busy={saving}>
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}

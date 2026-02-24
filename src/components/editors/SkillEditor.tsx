import { useState, useRef } from 'react'
import { useMutation } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import { useAuth } from '../../contexts/AuthContext'
import { motion } from 'framer-motion'

interface SkillData {
  _id: string
  title: string
  content: string
  order: number
}

interface SkillEditorProps {
  skills: SkillData[]
  onClose: () => void
}

export function SkillEditor({ skills, onClose }: SkillEditorProps) {
  const { sessionToken } = useAuth()
  const updateSkill = useMutation(api.content.updateSkill)
  const createSkill = useMutation(api.content.createSkill)
  const deleteSkill = useMutation(api.content.deleteSkill)

  const [localSkills, setLocalSkills] = useState(skills.map(s => ({ ...s, isNew: false })))
  const [saving, setSaving] = useState(false)
  const textareaRefs = useRef<{ [key: string]: HTMLTextAreaElement | null }>({})

  const handleChange = (index: number, field: 'title' | 'content', value: string) => {
    const updated = [...localSkills]
    updated[index] = { ...updated[index], [field]: value }
    setLocalSkills(updated)
  }

  const insertFormatting = (skillId: string, index: number, type: 'bold' | 'italic' | 'bullet') => {
    const textarea = textareaRefs.current[skillId]
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const text = textarea.value
    const selectedText = text.substring(start, end)

    let newText = ''
    let cursorOffset = 0

    switch (type) {
      case 'bold':
        newText = text.substring(0, start) + `<strong>${selectedText || 'text'}</strong>` + text.substring(end)
        cursorOffset = selectedText ? end + 17 : start + 8
        break
      case 'italic':
        newText = text.substring(0, start) + `<em>${selectedText || 'text'}</em>` + text.substring(end)
        cursorOffset = selectedText ? end + 9 : start + 4
        break
      case 'bullet':
        const bulletTemplate = selectedText
          ? `<ul>\n  <li>${selectedText}</li>\n</ul>`
          : '<ul>\n  <li>Item 1</li>\n  <li>Item 2</li>\n</ul>'
        newText = text.substring(0, start) + bulletTemplate + text.substring(end)
        cursorOffset = start + bulletTemplate.length
        break
    }

    handleChange(index, 'content', newText)
    setTimeout(() => {
      textarea.focus()
      textarea.setSelectionRange(cursorOffset, cursorOffset)
    }, 0)
  }

  const addSkill = () => {
    setLocalSkills([...localSkills, {
      _id: `new-${Date.now()}`,
      title: '',
      content: '',
      order: localSkills.length,
      isNew: true
    }])
  }

  const removeSkill = (index: number) => {
    setLocalSkills(localSkills.filter((_, i) => i !== index))
  }

  const handleSave = async () => {
    if (!sessionToken) return
    setSaving(true)
    try {
      // Delete removed skills
      const currentIds = new Set(localSkills.filter(s => !s.isNew).map(s => s._id))
      for (const skill of skills) {
        if (!currentIds.has(skill._id)) {
          await deleteSkill({ token: sessionToken, id: skill._id })
        }
      }

      // Update existing and create new skills
      for (const skill of localSkills) {
        if (skill.isNew) {
          await createSkill({
            token: sessionToken,
            title: skill.title,
            content: skill.content
          })
        } else {
          const original = skills.find(s => s._id === skill._id)
          if (original && (original.title !== skill.title || original.content !== skill.content)) {
            await updateSkill({
              token: sessionToken,
              id: skill._id,
              title: skill.title,
              content: skill.content
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
      onClick={onClose}
    >
      <motion.div
        className="inline-editor inline-editor-large"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="editor-title">Edit Skills</h3>

        <div className="editor-section">
          <div className="editor-section-header">
            <label>Skills</label>
            <button type="button" onClick={addSkill} className="add-btn">
              + Add Skill
            </button>
          </div>
          {localSkills.map((skill, index) => (
            <div key={skill._id} className="editor-item-card">
              <div className="editor-field">
                <label>Title</label>
                <input
                  type="text"
                  value={skill.title}
                  onChange={(e) => handleChange(index, 'title', e.target.value)}
                  placeholder="Skill title"
                />
              </div>
              <div className="editor-field">
                <label>Content</label>
                <div className="editor-formatting-toolbar">
                  <button
                    type="button"
                    onClick={() => insertFormatting(skill._id, index, 'bold')}
                    className="formatting-btn"
                    title="Bold"
                  >
                    <strong>B</strong>
                  </button>
                  <button
                    type="button"
                    onClick={() => insertFormatting(skill._id, index, 'italic')}
                    className="formatting-btn"
                    title="Italic"
                  >
                    <em>I</em>
                  </button>
                  <button
                    type="button"
                    onClick={() => insertFormatting(skill._id, index, 'bullet')}
                    className="formatting-btn"
                    title="Bullet List"
                  >
                    •
                  </button>
                </div>
                <textarea
                  ref={(el) => { textareaRefs.current[skill._id] = el }}
                  value={skill.content}
                  onChange={(e) => handleChange(index, 'content', e.target.value)}
                  placeholder="Skill description (supports HTML: <strong>, <em>, <ul><li>)"
                  rows={4}
                />
              </div>
              <button
                type="button"
                onClick={() => removeSkill(index)}
                className="remove-item-btn"
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
          <button onClick={handleSave} disabled={saving} className="save-btn">
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}

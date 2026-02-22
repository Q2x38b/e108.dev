import { useState } from 'react'
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

  const handleChange = (index: number, field: 'title' | 'content', value: string) => {
    const updated = [...localSkills]
    updated[index] = { ...updated[index], [field]: value }
    setLocalSkills(updated)
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
                <textarea
                  value={skill.content}
                  onChange={(e) => handleChange(index, 'content', e.target.value)}
                  placeholder="Skill description"
                  rows={2}
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

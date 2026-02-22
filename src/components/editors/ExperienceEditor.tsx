import { useState } from 'react'
import { useMutation } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import { useAuth } from '../../contexts/AuthContext'
import { motion } from 'framer-motion'

interface ExperienceData {
  _id: string
  company: string
  role: string
  date: string
  order: number
}

interface ExperienceEditorProps {
  experiences: ExperienceData[]
  onClose: () => void
}

export function ExperienceEditor({ experiences, onClose }: ExperienceEditorProps) {
  const { sessionToken } = useAuth()
  const updateExperience = useMutation(api.content.updateExperience)
  const createExperience = useMutation(api.content.createExperience)
  const deleteExperience = useMutation(api.content.deleteExperience)

  const [localExperiences, setLocalExperiences] = useState(experiences.map(e => ({ ...e, isNew: false })))
  const [saving, setSaving] = useState(false)

  const handleChange = (index: number, field: 'company' | 'role' | 'date', value: string) => {
    const updated = [...localExperiences]
    updated[index] = { ...updated[index], [field]: value }
    setLocalExperiences(updated)
  }

  const addExperience = () => {
    setLocalExperiences([...localExperiences, {
      _id: `new-${Date.now()}`,
      company: '',
      role: '',
      date: '',
      order: localExperiences.length,
      isNew: true
    }])
  }

  const removeExperience = (index: number) => {
    setLocalExperiences(localExperiences.filter((_, i) => i !== index))
  }

  const handleSave = async () => {
    if (!sessionToken) return
    setSaving(true)
    try {
      // Delete removed experiences
      const currentIds = new Set(localExperiences.filter(e => !e.isNew).map(e => e._id))
      for (const exp of experiences) {
        if (!currentIds.has(exp._id)) {
          await deleteExperience({ token: sessionToken, id: exp._id })
        }
      }

      // Update existing and create new experiences
      for (const exp of localExperiences) {
        if (exp.isNew) {
          await createExperience({
            token: sessionToken,
            company: exp.company,
            role: exp.role,
            date: exp.date
          })
        } else {
          const original = experiences.find(e => e._id === exp._id)
          if (original && (
            original.company !== exp.company ||
            original.role !== exp.role ||
            original.date !== exp.date
          )) {
            await updateExperience({
              token: sessionToken,
              id: exp._id,
              company: exp.company,
              role: exp.role,
              date: exp.date
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
        <h3 className="editor-title">Edit Experience</h3>

        <div className="editor-section">
          <div className="editor-section-header">
            <label>Experiences</label>
            <button type="button" onClick={addExperience} className="add-btn">
              + Add Experience
            </button>
          </div>
          {localExperiences.map((exp, index) => (
            <div key={exp._id} className="editor-item-card">
              <div className="editor-row">
                <div className="editor-field">
                  <label>Company</label>
                  <input
                    type="text"
                    value={exp.company}
                    onChange={(e) => handleChange(index, 'company', e.target.value)}
                    placeholder="Company name"
                  />
                </div>
                <div className="editor-field">
                  <label>Role</label>
                  <input
                    type="text"
                    value={exp.role}
                    onChange={(e) => handleChange(index, 'role', e.target.value)}
                    placeholder="Your role"
                  />
                </div>
              </div>
              <div className="editor-field">
                <label>Date Range</label>
                <input
                  type="text"
                  value={exp.date}
                  onChange={(e) => handleChange(index, 'date', e.target.value)}
                  placeholder="2024 - now (leave empty for blinking cursor)"
                />
              </div>
              <button
                type="button"
                onClick={() => removeExperience(index)}
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

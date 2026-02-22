import { useState } from 'react'
import { useMutation } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import { useAuth } from '../../contexts/AuthContext'
import { motion } from 'framer-motion'
import { Id } from '../../../convex/_generated/dataModel'

interface ProjectData {
  _id: Id<"projects">
  name: string
  description: string
  year: string
  details: string
  tech: string[]
  url?: string
  order: number
}

interface ProjectEditorProps {
  projects: ProjectData[]
  onClose: () => void
}

export function ProjectEditor({ projects, onClose }: ProjectEditorProps) {
  const { sessionToken } = useAuth()
  const updateProject = useMutation(api.content.updateProject)
  const createProject = useMutation(api.content.createProject)
  const deleteProject = useMutation(api.content.deleteProject)

  const [localProjects, setLocalProjects] = useState(projects.map(p => ({
    ...p,
    techString: p.tech.join(', '),
    isNew: false
  })))
  const [saving, setSaving] = useState(false)

  const handleChange = (index: number, field: string, value: string) => {
    const updated = [...localProjects]
    updated[index] = { ...updated[index], [field]: value }
    setLocalProjects(updated)
  }

  const addProject = () => {
    setLocalProjects([...localProjects, {
      _id: `new-${Date.now()}` as Id<"projects">,
      name: '',
      description: '',
      year: new Date().getFullYear().toString(),
      details: '',
      tech: [],
      techString: '',
      url: '#',
      order: localProjects.length,
      isNew: true
    }])
  }

  const removeProject = (index: number) => {
    setLocalProjects(localProjects.filter((_, i) => i !== index))
  }

  const handleSave = async () => {
    if (!sessionToken) return
    setSaving(true)
    try {
      // Delete removed projects
      const currentIds = new Set(localProjects.filter(p => !p.isNew).map(p => p._id))
      for (const project of projects) {
        if (!currentIds.has(project._id)) {
          await deleteProject({ token: sessionToken, id: project._id })
        }
      }

      // Update existing and create new projects
      for (const project of localProjects) {
        const tech = project.techString.split(',').map(t => t.trim()).filter(Boolean)

        if (project.isNew) {
          await createProject({
            token: sessionToken,
            name: project.name,
            description: project.description,
            year: project.year,
            details: project.details,
            tech,
            url: project.url || undefined
          })
        } else {
          const original = projects.find(p => p._id === project._id)
          if (original) {
            await updateProject({
              token: sessionToken,
              id: project._id,
              name: project.name,
              description: project.description,
              year: project.year,
              details: project.details,
              tech,
              url: project.url || undefined
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
        <h3 className="editor-title">Edit Projects</h3>

        <div className="editor-section">
          <div className="editor-section-header">
            <label>Projects</label>
            <button type="button" onClick={addProject} className="add-btn">
              + Add Project
            </button>
          </div>
          {localProjects.map((project, index) => (
            <div key={project._id} className="editor-item-card">
              <div className="editor-row">
                <div className="editor-field">
                  <label>Name</label>
                  <input
                    type="text"
                    value={project.name}
                    onChange={(e) => handleChange(index, 'name', e.target.value)}
                    placeholder="Project name"
                  />
                </div>
                <div className="editor-field editor-field-small">
                  <label>Year</label>
                  <input
                    type="text"
                    value={project.year}
                    onChange={(e) => handleChange(index, 'year', e.target.value)}
                    placeholder="2025"
                  />
                </div>
              </div>
              <div className="editor-field">
                <label>Short Description</label>
                <input
                  type="text"
                  value={project.description}
                  onChange={(e) => handleChange(index, 'description', e.target.value)}
                  placeholder="Brief description shown in list"
                />
              </div>
              <div className="editor-field">
                <label>Details</label>
                <textarea
                  value={project.details}
                  onChange={(e) => handleChange(index, 'details', e.target.value)}
                  placeholder="Full description shown in modal"
                  rows={2}
                />
              </div>
              <div className="editor-field">
                <label>Technologies (comma-separated)</label>
                <input
                  type="text"
                  value={project.techString}
                  onChange={(e) => handleChange(index, 'techString', e.target.value)}
                  placeholder="React, TypeScript, Convex"
                />
              </div>
              <button
                type="button"
                onClick={() => removeProject(index)}
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

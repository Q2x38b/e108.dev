import { useState, useRef, useCallback } from 'react'
import { useMutation, useQuery } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import { useAuth } from '../../contexts/AuthContext'
import { motion, AnimatePresence } from 'framer-motion'

interface ProjectLink {
  label: string
  url: string
}

interface ProjectData {
  _id: string
  name: string
  description: string
  year: string
  details: string
  tech: string[]
  url?: string
  links?: ProjectLink[]
  images?: string[]
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
  const generateUploadUrl = useMutation(api.files.generateUploadUrl)
  const saveImage = useMutation(api.files.saveImage)
  const libraryImages = useQuery(api.files.list)

  const [localProjects, setLocalProjects] = useState(projects.map(p => ({
    ...p,
    techString: p.tech.join(', '),
    links: p.links || [],
    images: p.images || [],
    isNew: false
  })))
  const [saving, setSaving] = useState(false)
  const [uploadingFor, setUploadingFor] = useState<number | null>(null)
  const [showImagePicker, setShowImagePicker] = useState<number | null>(null)
  const fileInputRefs = useRef<{ [key: number]: HTMLInputElement | null }>({})

  const handleImageUpload = useCallback(async (projectIndex: number, file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file')
      return
    }

    setUploadingFor(projectIndex)
    try {
      const uploadUrl = await generateUploadUrl()
      const result = await fetch(uploadUrl, {
        method: 'POST',
        headers: { 'Content-Type': file.type },
        body: file,
      })

      if (!result.ok) throw new Error('Upload failed')

      const { storageId } = await result.json()
      const savedImage = await saveImage({
        storageId,
        fileName: file.name,
        contentType: file.type,
      })

      if (savedImage?.url) {
        const updated = [...localProjects]
        updated[projectIndex].images = [...updated[projectIndex].images, savedImage.url]
        setLocalProjects(updated)
      }
    } catch (error) {
      console.error('Upload error:', error)
      alert('Failed to upload image')
    } finally {
      setUploadingFor(null)
    }
  }, [generateUploadUrl, saveImage, localProjects])

  const addImageFromLibrary = (projectIndex: number, url: string) => {
    const updated = [...localProjects]
    if (!updated[projectIndex].images.includes(url)) {
      updated[projectIndex].images = [...updated[projectIndex].images, url]
      setLocalProjects(updated)
    }
    setShowImagePicker(null)
  }

  const removeImage = (projectIndex: number, imageIndex: number) => {
    const updated = [...localProjects]
    updated[projectIndex].images = updated[projectIndex].images.filter((_, i) => i !== imageIndex)
    setLocalProjects(updated)
  }

  const moveImage = (projectIndex: number, imageIndex: number, direction: 'up' | 'down') => {
    const updated = [...localProjects]
    const images = [...updated[projectIndex].images]
    const newIndex = direction === 'up' ? imageIndex - 1 : imageIndex + 1
    if (newIndex < 0 || newIndex >= images.length) return
    ;[images[imageIndex], images[newIndex]] = [images[newIndex], images[imageIndex]]
    updated[projectIndex].images = images
    setLocalProjects(updated)
  }

  const handleChange = (index: number, field: string, value: string) => {
    const updated = [...localProjects]
    updated[index] = { ...updated[index], [field]: value }
    setLocalProjects(updated)
  }

  const addProject = () => {
    setLocalProjects([...localProjects, {
      _id: `new-${Date.now()}`,
      name: '',
      description: '',
      year: new Date().getFullYear().toString(),
      details: '',
      tech: [],
      techString: '',
      url: '#',
      links: [],
      images: [],
      order: localProjects.length,
      isNew: true
    }])
  }

  const addLink = (projectIndex: number) => {
    const updated = [...localProjects]
    updated[projectIndex].links = [...updated[projectIndex].links, { label: '', url: '' }]
    setLocalProjects(updated)
  }

  const updateLink = (projectIndex: number, linkIndex: number, field: 'label' | 'url', value: string) => {
    const updated = [...localProjects]
    updated[projectIndex].links[linkIndex] = {
      ...updated[projectIndex].links[linkIndex],
      [field]: value
    }
    setLocalProjects(updated)
  }

  const removeLink = (projectIndex: number, linkIndex: number) => {
    const updated = [...localProjects]
    updated[projectIndex].links = updated[projectIndex].links.filter((_, i) => i !== linkIndex)
    setLocalProjects(updated)
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
        const links = project.links.filter(l => l.label.trim() && l.url.trim())
        const images = project.images.filter(Boolean)

        if (project.isNew) {
          await createProject({
            token: sessionToken,
            name: project.name,
            description: project.description,
            year: project.year,
            details: project.details,
            tech,
            url: project.url || undefined,
            links: links.length > 0 ? links : undefined,
            images: images.length > 0 ? images : undefined
          })
        } else {
          const original = projects.find(p => p._id === project._id)
          if (original) {
            await updateProject({
              token: sessionToken,
              id: project._id as any,
              name: project.name,
              description: project.description,
              year: project.year,
              details: project.details,
              tech,
              url: project.url || undefined,
              links: links.length > 0 ? links : undefined,
              images: images.length > 0 ? images : undefined
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
              <div className="editor-field">
                <div className="editor-section-header">
                  <label>Links</label>
                  <button type="button" onClick={() => addLink(index)} className="add-btn add-btn-small">
                    + Add Link
                  </button>
                </div>
                {project.links.map((link, linkIndex) => (
                  <div key={linkIndex} className="editor-link-row">
                    <input
                      type="text"
                      value={link.label}
                      onChange={(e) => updateLink(index, linkIndex, 'label', e.target.value)}
                      placeholder="Label (e.g., Live Demo)"
                      className="editor-link-label"
                    />
                    <input
                      type="text"
                      value={link.url}
                      onChange={(e) => updateLink(index, linkIndex, 'url', e.target.value)}
                      placeholder="URL"
                      className="editor-link-url"
                    />
                    <button
                      type="button"
                      onClick={() => removeLink(index, linkIndex)}
                      className="remove-link-btn"
                      aria-label="Remove link"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>

              {/* Images Section */}
              <div className="editor-field">
                <div className="editor-section-header">
                  <label>Images</label>
                  <div className="editor-image-actions">
                    <button
                      type="button"
                      onClick={() => setShowImagePicker(showImagePicker === index ? null : index)}
                      className="add-btn add-btn-small"
                    >
                      + From Library
                    </button>
                    <input
                      ref={(el) => { fileInputRefs.current[index] = el }}
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) handleImageUpload(index, file)
                        e.target.value = ''
                      }}
                      style={{ display: 'none' }}
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRefs.current[index]?.click()}
                      className="add-btn add-btn-small"
                      disabled={uploadingFor === index}
                    >
                      {uploadingFor === index ? 'Uploading...' : '+ Upload'}
                    </button>
                  </div>
                </div>

                {/* Image Picker Modal */}
                <AnimatePresence>
                  {showImagePicker === index && (
                    <motion.div
                      className="editor-image-picker"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                    >
                      {!libraryImages || libraryImages.length === 0 ? (
                        <p className="editor-image-picker-empty">No images in library</p>
                      ) : (
                        <div className="editor-image-picker-grid">
                          {libraryImages.map((img) => (
                            <button
                              key={img._id}
                              type="button"
                              className="editor-image-picker-item"
                              onClick={() => addImageFromLibrary(index, img.url || '')}
                            >
                              <img src={img.url || ''} alt={img.fileName} />
                            </button>
                          ))}
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Current Images */}
                {project.images.length > 0 && (
                  <div className="editor-images-list">
                    {project.images.map((imgUrl, imgIndex) => (
                      <div key={imgIndex} className="editor-image-item">
                        <img src={imgUrl} alt={`Project image ${imgIndex + 1}`} />
                        <div className="editor-image-item-actions">
                          <button
                            type="button"
                            onClick={() => moveImage(index, imgIndex, 'up')}
                            disabled={imgIndex === 0}
                            className="editor-image-move-btn"
                            aria-label="Move up"
                          >
                            ←
                          </button>
                          <button
                            type="button"
                            onClick={() => moveImage(index, imgIndex, 'down')}
                            disabled={imgIndex === project.images.length - 1}
                            className="editor-image-move-btn"
                            aria-label="Move down"
                          >
                            →
                          </button>
                          <button
                            type="button"
                            onClick={() => removeImage(index, imgIndex)}
                            className="editor-image-remove-btn"
                            aria-label="Remove image"
                          >
                            ×
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
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

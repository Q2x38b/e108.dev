import { useState } from 'react'
import { useMutation } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import { useAuth } from '../../contexts/AuthContext'
import { motion } from 'framer-motion'

interface ProfileData {
  name: string
  title: string
  imageUrl: string
  location: string
}

interface ProfileEditorProps {
  profile: ProfileData
  onClose: () => void
}

export function ProfileEditor({ profile, onClose }: ProfileEditorProps) {
  const { sessionToken } = useAuth()
  const updateProfile = useMutation(api.content.updateProfile)

  const [name, setName] = useState(profile.name)
  const [title, setTitle] = useState(profile.title)
  const [imageUrl, setImageUrl] = useState(profile.imageUrl)
  const [location, setLocation] = useState(profile.location)
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    if (!sessionToken) return
    setSaving(true)
    try {
      await updateProfile({ token: sessionToken, name, title, imageUrl, location })
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
      aria-labelledby="profile-editor-title"
    >
      <motion.div
        className="inline-editor"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.15 }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 id="profile-editor-title" className="editor-title">Edit Profile</h3>

        <div className="editor-field">
          <label htmlFor="profile-name">Name</label>
          <input
            id="profile-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            spellCheck="false"
            autoComplete="name"
          />
        </div>

        <div className="editor-field">
          <label htmlFor="profile-title">Title</label>
          <input
            id="profile-title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., Student • Developer"
            spellCheck="false"
            autoComplete="off"
          />
        </div>

        <div className="editor-field">
          <label htmlFor="profile-image">Profile Image URL</label>
          <input
            id="profile-image"
            type="url"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="/profile.png"
            spellCheck="false"
            autoComplete="off"
          />
        </div>

        <div className="editor-field">
          <label htmlFor="profile-location">Location</label>
          <input
            id="profile-location"
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Houston, TX"
            spellCheck="false"
            autoComplete="off"
          />
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

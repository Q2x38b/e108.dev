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
      onClick={onClose}
    >
      <motion.div
        className="inline-editor"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="editor-title">Edit Profile</h3>

        <div className="editor-field">
          <label>Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div className="editor-field">
          <label>Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., Student • Developer"
          />
        </div>

        <div className="editor-field">
          <label>Profile Image URL</label>
          <input
            type="text"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="/profile.png"
          />
        </div>

        <div className="editor-field">
          <label>Location</label>
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Houston, TX"
          />
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

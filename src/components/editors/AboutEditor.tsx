import { useState } from 'react'
import { useMutation } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import { useAuth } from '../../contexts/AuthContext'
import { motion } from 'framer-motion'

interface SocialLink {
  platform: string
  url: string
  label: string
}

interface AboutData {
  bio: string[]
  socialLinks: SocialLink[]
}

interface AboutEditorProps {
  about: AboutData
  onClose: () => void
}

export function AboutEditor({ about, onClose }: AboutEditorProps) {
  const { sessionToken } = useAuth()
  const updateAbout = useMutation(api.content.updateAbout)

  const [bio, setBio] = useState(about.bio)
  const [socialLinks, setSocialLinks] = useState(about.socialLinks)
  const [saving, setSaving] = useState(false)

  const handleBioChange = (index: number, value: string) => {
    const newBio = [...bio]
    newBio[index] = value
    setBio(newBio)
  }

  const addBioParagraph = () => {
    setBio([...bio, ''])
  }

  const removeBioParagraph = (index: number) => {
    if (bio.length > 1) {
      setBio(bio.filter((_, i) => i !== index))
    }
  }

  const handleSocialLinkChange = (index: number, field: keyof SocialLink, value: string) => {
    const newLinks = [...socialLinks]
    newLinks[index] = { ...newLinks[index], [field]: value }
    setSocialLinks(newLinks)
  }

  const addSocialLink = () => {
    setSocialLinks([...socialLinks, { platform: '', url: '', label: '' }])
  }

  const removeSocialLink = (index: number) => {
    setSocialLinks(socialLinks.filter((_, i) => i !== index))
  }

  const handleSave = async () => {
    if (!sessionToken) return
    setSaving(true)
    try {
      await updateAbout({ token: sessionToken, bio, socialLinks })
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
        <h3 className="editor-title">Edit About Section</h3>

        <div className="editor-section">
          <div className="editor-section-header">
            <label>Bio Paragraphs</label>
            <button type="button" onClick={addBioParagraph} className="add-btn">
              + Add Paragraph
            </button>
          </div>
          {bio.map((paragraph, index) => (
            <div key={index} className="editor-field-row">
              <textarea
                value={paragraph}
                onChange={(e) => handleBioChange(index, e.target.value)}
                placeholder="Enter paragraph text (supports HTML tags like <kbd>, <em>)"
                rows={3}
              />
              {bio.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeBioParagraph(index)}
                  className="remove-btn"
                >
                  ×
                </button>
              )}
            </div>
          ))}
        </div>

        <div className="editor-section">
          <div className="editor-section-header">
            <label>Social Links</label>
            <button type="button" onClick={addSocialLink} className="add-btn">
              + Add Link
            </button>
          </div>
          {socialLinks.map((link, index) => (
            <div key={index} className="editor-link-row">
              <input
                type="text"
                value={link.platform}
                onChange={(e) => handleSocialLinkChange(index, 'platform', e.target.value)}
                placeholder="Platform (e.g., github)"
              />
              <input
                type="text"
                value={link.url}
                onChange={(e) => handleSocialLinkChange(index, 'url', e.target.value)}
                placeholder="URL"
              />
              <input
                type="text"
                value={link.label}
                onChange={(e) => handleSocialLinkChange(index, 'label', e.target.value)}
                placeholder="Label"
              />
              <button
                type="button"
                onClick={() => removeSocialLink(index)}
                className="remove-btn"
              >
                ×
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

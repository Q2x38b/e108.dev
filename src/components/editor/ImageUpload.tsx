import { useState, useRef, useCallback } from 'react'
import { useMutation, useQuery } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import { motion, AnimatePresence } from 'framer-motion'
import { Upload, X, Image as ImageIcon, Loader2, Trash2, Link } from 'lucide-react'

interface ImageUploadProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (url: string) => void
}

export function ImageUpload({ isOpen, onClose, onSelect }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const [urlInput, setUrlInput] = useState('')
  const [activeTab, setActiveTab] = useState<'upload' | 'library' | 'url'>('upload')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const generateUploadUrl = useMutation(api.files.generateUploadUrl)
  const saveImage = useMutation(api.files.saveImage)
  const deleteImage = useMutation(api.files.remove)
  const images = useQuery(api.files.list)

  const handleUpload = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file')
      return
    }

    setUploading(true)
    try {
      // Get upload URL from Convex
      const uploadUrl = await generateUploadUrl()

      // Upload the file
      const result = await fetch(uploadUrl, {
        method: 'POST',
        headers: { 'Content-Type': file.type },
        body: file,
      })

      if (!result.ok) {
        throw new Error('Upload failed')
      }

      const { storageId } = await result.json()

      // Save image metadata
      await saveImage({
        storageId,
        fileName: file.name,
        contentType: file.type,
      })

      // Get the URL and insert
      const url = await fetch(uploadUrl.replace('/upload', `/storage/${storageId}`))
      // Actually, we need to get the URL differently - let's just refresh and use the library
      setActiveTab('library')
    } catch (error) {
      console.error('Upload error:', error)
      alert('Failed to upload image')
    } finally {
      setUploading(false)
    }
  }, [generateUploadUrl, saveImage])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(false)

    const file = e.dataTransfer.files[0]
    if (file) {
      handleUpload(file)
    }
  }, [handleUpload])

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleUpload(file)
    }
  }, [handleUpload])

  const handleUrlSubmit = () => {
    if (urlInput.trim()) {
      onSelect(urlInput.trim())
      onClose()
    }
  }

  const handleImageSelect = (url: string | null) => {
    if (url) {
      onSelect(url)
      onClose()
    }
  }

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (confirm('Delete this image?')) {
      await deleteImage({ id: id as any })
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="image-upload-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="image-upload-modal"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="image-upload-header">
              <h2>Insert Image</h2>
              <button onClick={onClose} className="image-upload-close">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="image-upload-tabs">
              <button
                className={`image-upload-tab ${activeTab === 'upload' ? 'active' : ''}`}
                onClick={() => setActiveTab('upload')}
              >
                <Upload className="w-4 h-4" />
                Upload
              </button>
              <button
                className={`image-upload-tab ${activeTab === 'library' ? 'active' : ''}`}
                onClick={() => setActiveTab('library')}
              >
                <ImageIcon className="w-4 h-4" />
                Library
              </button>
              <button
                className={`image-upload-tab ${activeTab === 'url' ? 'active' : ''}`}
                onClick={() => setActiveTab('url')}
              >
                <Link className="w-4 h-4" />
                URL
              </button>
            </div>

            <div className="image-upload-content">
              {activeTab === 'upload' && (
                <div
                  className={`image-upload-dropzone ${dragActive ? 'drag-active' : ''} ${uploading ? 'uploading' : ''}`}
                  onDragOver={(e) => { e.preventDefault(); setDragActive(true) }}
                  onDragLeave={() => setDragActive(false)}
                  onDrop={handleDrop}
                  onClick={() => !uploading && fileInputRef.current?.click()}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    style={{ display: 'none' }}
                  />
                  {uploading ? (
                    <>
                      <Loader2 className="w-8 h-8 animate-spin" />
                      <p>Uploading...</p>
                    </>
                  ) : (
                    <>
                      <Upload className="w-8 h-8" />
                      <p>Drop an image here or click to upload</p>
                      <span className="text-sm opacity-60">PNG, JPG, GIF up to 10MB</span>
                    </>
                  )}
                </div>
              )}

              {activeTab === 'library' && (
                <div className="image-upload-library">
                  {!images || images.length === 0 ? (
                    <div className="image-upload-empty">
                      <ImageIcon className="w-8 h-8 opacity-40" />
                      <p>No images uploaded yet</p>
                    </div>
                  ) : (
                    <div className="image-upload-grid">
                      {images.map((image) => (
                        <div
                          key={image._id}
                          className="image-upload-item"
                          onClick={() => handleImageSelect(image.url)}
                        >
                          <img src={image.url || ''} alt={image.fileName} />
                          <button
                            className="image-upload-item-delete"
                            onClick={(e) => handleDelete(image._id, e)}
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'url' && (
                <div className="image-upload-url">
                  <input
                    type="url"
                    placeholder="https://example.com/image.png"
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleUrlSubmit()}
                  />
                  <button onClick={handleUrlSubmit} disabled={!urlInput.trim()}>
                    Insert
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

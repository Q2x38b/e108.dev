import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Search } from 'lucide-react'
import * as LucideIcons from 'lucide-react'

interface IconPickerProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (iconName: string) => void
}

// Get all icon names from Lucide (excluding non-icon exports)
const iconNames = Object.keys(LucideIcons).filter(
  (key) =>
    key !== 'default' &&
    key !== 'createLucideIcon' &&
    key !== 'icons' &&
    typeof (LucideIcons as Record<string, unknown>)[key] === 'function' &&
    /^[A-Z]/.test(key)
)

// Categorize icons
const iconCategories: Record<string, string[]> = {
  'Common': ['Home', 'Search', 'Settings', 'User', 'Mail', 'Phone', 'Calendar', 'Clock', 'Heart', 'Star', 'Check', 'X', 'Plus', 'Minus', 'ArrowRight', 'ArrowLeft', 'ChevronRight', 'ChevronDown'],
  'Social': ['Github', 'Twitter', 'Linkedin', 'Facebook', 'Instagram', 'Youtube', 'Twitch', 'MessageCircle', 'Send', 'Share2'],
  'Files': ['File', 'FileText', 'Folder', 'FolderOpen', 'Download', 'Upload', 'Paperclip', 'Archive', 'Trash2', 'Copy'],
  'Media': ['Image', 'Camera', 'Video', 'Music', 'Play', 'Pause', 'Volume2', 'VolumeX', 'Mic', 'Headphones'],
  'Edit': ['Edit', 'Edit2', 'Edit3', 'Pencil', 'Scissors', 'Type', 'Bold', 'Italic', 'Underline', 'Link', 'Unlink'],
  'Alerts': ['AlertCircle', 'AlertTriangle', 'Info', 'HelpCircle', 'Bell', 'BellOff', 'CheckCircle', 'XCircle'],
  'Navigation': ['Menu', 'MoreHorizontal', 'MoreVertical', 'Grid', 'List', 'Sidebar', 'Compass', 'Map', 'MapPin'],
  'Data': ['Database', 'Server', 'Cloud', 'Wifi', 'Globe', 'Rss', 'Activity', 'BarChart', 'PieChart', 'TrendingUp'],
}

export function IconPicker({ isOpen, onClose, onSelect }: IconPickerProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

  const filteredIcons = useMemo(() => {
    if (searchQuery) {
      return iconNames.filter((name) =>
        name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }
    if (selectedCategory && iconCategories[selectedCategory]) {
      return iconCategories[selectedCategory].filter((name) => iconNames.includes(name))
    }
    return iconNames.slice(0, 100) // Show first 100 by default
  }, [searchQuery, selectedCategory])

  const handleIconSelect = (iconName: string) => {
    onSelect(iconName)
    onClose()
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="icon-picker-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="icon-picker-modal"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="icon-picker-header">
              <h3>Select Icon</h3>
              <button onClick={onClose} className="icon-picker-close">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="icon-picker-search">
              <Search className="w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search icons..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value)
                  setSelectedCategory(null)
                }}
                autoFocus
              />
            </div>

            {!searchQuery && (
              <div className="icon-picker-categories">
                {Object.keys(iconCategories).map((category) => (
                  <button
                    key={category}
                    className={`icon-picker-category ${
                      selectedCategory === category ? 'active' : ''
                    }`}
                    onClick={() =>
                      setSelectedCategory(
                        selectedCategory === category ? null : category
                      )
                    }
                  >
                    {category}
                  </button>
                ))}
              </div>
            )}

            <div className="icon-picker-grid">
              {filteredIcons.map((iconName) => {
                const IconComponent = (LucideIcons as Record<string, React.ComponentType<{ className?: string }>>)[iconName]
                if (!IconComponent) return null
                return (
                  <button
                    key={iconName}
                    className="icon-picker-item"
                    onClick={() => handleIconSelect(iconName)}
                    title={iconName}
                  >
                    <IconComponent className="w-5 h-5" />
                  </button>
                )
              })}
            </div>

            {filteredIcons.length === 0 && (
              <div className="icon-picker-empty">No icons found</div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

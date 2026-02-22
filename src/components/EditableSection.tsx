import { ReactNode, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useEditMode } from '../contexts/EditModeContext'
import { useAuth } from '../contexts/AuthContext'

interface EditableSectionProps {
  sectionId: string
  children: ReactNode
  onEdit: () => void
  className?: string
}

export function EditableSection({
  sectionId,
  children,
  onEdit,
  className = ''
}: EditableSectionProps) {
  const { isEditMode, editingSection } = useEditMode()
  const { isAuthenticated } = useAuth()
  const [isHovered, setIsHovered] = useState(false)

  const handleDoubleClick = () => {
    if (isEditMode && isAuthenticated) {
      onEdit()
    }
  }

  // If not in edit mode or editing this section, just render children
  if (!isAuthenticated || !isEditMode || editingSection === sectionId) {
    return <div className={className}>{children}</div>
  }

  return (
    <motion.div
      className={`editable-section ${className} ${isHovered ? 'editable-hover' : ''}`}
      onDoubleClick={handleDoubleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{ position: 'relative' }}
    >
      {children}
      <AnimatePresence>
        {isHovered && (
          <motion.div
            className="edit-indicator"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 5 }}
            transition={{ duration: 0.15 }}
          >
            Double-click to edit
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

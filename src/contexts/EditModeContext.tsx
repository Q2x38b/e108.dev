import { createContext, useContext, useState, ReactNode } from 'react'
import { useAuth } from './AuthContext'

interface EditModeContextType {
  isEditMode: boolean
  toggleEditMode: () => void
  editingSection: string | null
  setEditingSection: (section: string | null) => void
}

const EditModeContext = createContext<EditModeContextType | null>(null)

export function EditModeProvider({ children }: { children: ReactNode }) {
  const [isEditMode, setIsEditMode] = useState(false)
  const [editingSection, setEditingSection] = useState<string | null>(null)
  const { isAuthenticated } = useAuth()

  const toggleEditMode = () => {
    if (!isAuthenticated) return
    setIsEditMode(prev => {
      if (prev) {
        // Exiting edit mode, clear any active editing
        setEditingSection(null)
      }
      return !prev
    })
  }

  // If logged out, disable edit mode
  if (!isAuthenticated && isEditMode) {
    setIsEditMode(false)
    setEditingSection(null)
  }

  return (
    <EditModeContext.Provider value={{
      isEditMode: isAuthenticated && isEditMode,
      toggleEditMode,
      editingSection,
      setEditingSection
    }}>
      {children}
    </EditModeContext.Provider>
  )
}

export function useEditMode() {
  const context = useContext(EditModeContext)
  return context
}

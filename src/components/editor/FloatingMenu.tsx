import { type Editor } from '@tiptap/react'
import { useEffect, useState, useCallback } from 'react'
import tippy, { type Instance } from 'tippy.js'
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Code,
  Link,
  Highlighter,
  RemoveFormatting,
} from 'lucide-react'

interface FloatingMenuProps {
  editor: Editor
}

export function FloatingMenu({ editor }: FloatingMenuProps) {
  const [showLinkInput, setShowLinkInput] = useState(false)
  const [linkUrl, setLinkUrl] = useState('')
  const [tippyInstance, setTippyInstance] = useState<Instance | null>(null)
  const [menuElement, setMenuElement] = useState<HTMLDivElement | null>(null)

  const addLink = useCallback(() => {
    if (linkUrl) {
      editor.chain().focus().setLink({ href: linkUrl }).run()
      setLinkUrl('')
    }
    setShowLinkInput(false)
  }, [editor, linkUrl])

  const removeLink = useCallback(() => {
    editor.chain().focus().unsetLink().run()
    setShowLinkInput(false)
  }, [editor])

  // Create and manage tippy instance
  useEffect(() => {
    if (!menuElement) return

    const instance = tippy(document.body, {
      getReferenceClientRect: null,
      appendTo: () => document.body,
      content: menuElement,
      interactive: true,
      trigger: 'manual',
      placement: 'top',
      hideOnClick: false,
      duration: 100,
    })

    setTippyInstance(instance)

    return () => {
      instance.destroy()
    }
  }, [menuElement])

  // Update tippy position based on selection
  useEffect(() => {
    if (!tippyInstance) return

    const updatePosition = () => {
      const { selection } = editor.state
      const { empty } = selection

      if (empty) {
        tippyInstance.hide()
        return
      }

      // Get the selection coordinates
      const { from, to } = selection
      const start = editor.view.coordsAtPos(from)
      const end = editor.view.coordsAtPos(to)

      // Create a virtual reference element
      const rect = {
        top: start.top,
        bottom: end.bottom,
        left: start.left,
        right: end.right,
        width: end.right - start.left,
        height: end.bottom - start.top,
      }

      tippyInstance.setProps({
        getReferenceClientRect: () => ({
          ...rect,
          x: rect.left,
          y: rect.top,
          toJSON: () => rect,
        }),
      })

      tippyInstance.show()
    }

    // Listen for selection changes
    editor.on('selectionUpdate', updatePosition)
    editor.on('blur', () => {
      setTimeout(() => {
        if (!menuElement?.contains(document.activeElement)) {
          tippyInstance.hide()
        }
      }, 100)
    })

    return () => {
      editor.off('selectionUpdate', updatePosition)
    }
  }, [editor, tippyInstance, menuElement])

  const buttons = [
    {
      icon: Bold,
      action: () => editor.chain().focus().toggleBold().run(),
      isActive: () => editor.isActive('bold'),
      title: 'Bold (Cmd+B)',
    },
    {
      icon: Italic,
      action: () => editor.chain().focus().toggleItalic().run(),
      isActive: () => editor.isActive('italic'),
      title: 'Italic (Cmd+I)',
    },
    {
      icon: Underline,
      action: () => editor.chain().focus().toggleUnderline().run(),
      isActive: () => editor.isActive('underline'),
      title: 'Underline (Cmd+U)',
    },
    {
      icon: Strikethrough,
      action: () => editor.chain().focus().toggleStrike().run(),
      isActive: () => editor.isActive('strike'),
      title: 'Strikethrough',
    },
    {
      icon: Code,
      action: () => editor.chain().focus().toggleCode().run(),
      isActive: () => editor.isActive('code'),
      title: 'Inline code (Cmd+E)',
    },
    {
      icon: Highlighter,
      action: () => editor.chain().focus().toggleHighlight().run(),
      isActive: () => editor.isActive('highlight'),
      title: 'Highlight',
    },
    {
      icon: Link,
      action: () => {
        const previousUrl = editor.getAttributes('link').href
        setLinkUrl(previousUrl || '')
        setShowLinkInput(true)
      },
      isActive: () => editor.isActive('link'),
      title: 'Link (Cmd+K)',
    },
    {
      icon: RemoveFormatting,
      action: () => editor.chain().focus().unsetAllMarks().run(),
      isActive: () => false,
      title: 'Clear formatting',
    },
  ]

  return (
    <div
      ref={setMenuElement}
      className="floating-menu"
      style={{ display: 'none' }}
    >
      {showLinkInput ? (
        <div className="floating-menu-link-input">
          <input
            type="url"
            placeholder="Enter URL..."
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                addLink()
              } else if (e.key === 'Escape') {
                setShowLinkInput(false)
              }
            }}
            autoFocus
          />
          <button onClick={addLink} className="add-btn">
            Add
          </button>
          {editor.isActive('link') && (
            <button onClick={removeLink} className="remove-btn">
              Remove
            </button>
          )}
        </div>
      ) : (
        buttons.map(({ icon: Icon, action, isActive, title }) => (
          <button
            key={title}
            onClick={action}
            className={`floating-menu-btn ${isActive() ? 'active' : ''}`}
            title={title}
          >
            <Icon className="w-4 h-4" />
          </button>
        ))
      )}
    </div>
  )
}

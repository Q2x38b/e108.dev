import { type Editor } from '@tiptap/react'
import { useState, useRef, useEffect } from 'react'
import {
  Undo2,
  Redo2,
  Bold,
  Italic,
  Strikethrough,
  Code,
  Link,
  Image,
  List,
  ListOrdered,
  ChevronDown,
  Minus,
  AlertCircle,
  Table,
  Quote,
  CheckSquare,
} from 'lucide-react'

interface EditorToolbarProps {
  editor: Editor | null
}

type BlockStyle = 'paragraph' | 'heading1' | 'heading2' | 'heading3'

const blockStyles: { value: BlockStyle; label: string }[] = [
  { value: 'paragraph', label: 'Paragraph' },
  { value: 'heading1', label: 'Heading 1' },
  { value: 'heading2', label: 'Heading 2' },
  { value: 'heading3', label: 'Heading 3' },
]

export function EditorToolbar({ editor }: EditorToolbarProps) {
  const [showStyleDropdown, setShowStyleDropdown] = useState(false)
  const [showMoreDropdown, setShowMoreDropdown] = useState(false)
  const styleDropdownRef = useRef<HTMLDivElement>(null)
  const moreDropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (styleDropdownRef.current && !styleDropdownRef.current.contains(event.target as Node)) {
        setShowStyleDropdown(false)
      }
      if (moreDropdownRef.current && !moreDropdownRef.current.contains(event.target as Node)) {
        setShowMoreDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  if (!editor) return null

  const getCurrentBlockStyle = (): string => {
    if (editor.isActive('heading', { level: 1 })) return 'Heading 1'
    if (editor.isActive('heading', { level: 2 })) return 'Heading 2'
    if (editor.isActive('heading', { level: 3 })) return 'Heading 3'
    return 'Paragraph'
  }

  const setBlockStyle = (style: BlockStyle) => {
    switch (style) {
      case 'paragraph':
        editor.chain().focus().setParagraph().run()
        break
      case 'heading1':
        editor.chain().focus().setHeading({ level: 1 }).run()
        break
      case 'heading2':
        editor.chain().focus().setHeading({ level: 2 }).run()
        break
      case 'heading3':
        editor.chain().focus().setHeading({ level: 3 }).run()
        break
    }
    setShowStyleDropdown(false)
  }

  const insertLink = () => {
    const previousUrl = editor.getAttributes('link').href
    const url = window.prompt('Enter URL:', previousUrl)
    if (url === null) return

    if (url === '') {
      editor.chain().focus().unsetLink().run()
    } else {
      editor.chain().focus().setLink({ href: url }).run()
    }
  }

  const insertImage = () => {
    const url = window.prompt('Enter image URL:')
    if (url) {
      editor.chain().focus().setImageBlock({ src: url }).run()
    }
  }

  const moreItems = [
    {
      icon: <Code className="w-4 h-4" />,
      label: 'Code block',
      action: () => editor.chain().focus().setCodeBlock().run(),
    },
    {
      icon: <Minus className="w-4 h-4" />,
      label: 'Divider',
      action: () => editor.chain().focus().setDivider().run(),
    },
    {
      icon: <AlertCircle className="w-4 h-4" />,
      label: 'Callout',
      action: () =>
        editor
          .chain()
          .focus()
          .insertContent({
            type: 'callout',
            attrs: { variant: 'info' },
            content: [{ type: 'paragraph' }],
          })
          .run(),
    },
    {
      icon: <Table className="w-4 h-4" />,
      label: 'Table',
      action: () => editor.chain().focus().insertTable({ rows: 3, cols: 3 }).run(),
    },
    {
      icon: <Quote className="w-4 h-4" />,
      label: 'Quote',
      action: () => editor.chain().focus().setBlockquote().run(),
    },
    {
      icon: <CheckSquare className="w-4 h-4" />,
      label: 'To-do list',
      action: () => editor.chain().focus().toggleTaskList().run(),
    },
  ]

  return (
    <div className="editor-toolbar">
      {/* Undo/Redo */}
      <div className="toolbar-group">
        <button
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          className="toolbar-btn"
          title="Undo"
        >
          <Undo2 className="w-4 h-4" />
        </button>
        <button
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          className="toolbar-btn"
          title="Redo"
        >
          <Redo2 className="w-4 h-4" />
        </button>
      </div>

      <div className="toolbar-divider" />

      {/* Style dropdown */}
      <div className="toolbar-group" ref={styleDropdownRef}>
        <button
          className="toolbar-btn toolbar-dropdown-btn"
          onClick={() => setShowStyleDropdown(!showStyleDropdown)}
        >
          <span>{getCurrentBlockStyle()}</span>
          <ChevronDown className="w-3 h-3 ml-1" />
        </button>
        {showStyleDropdown && (
          <div className="toolbar-dropdown">
            {blockStyles.map((style) => (
              <button
                key={style.value}
                className={`toolbar-dropdown-item ${
                  getCurrentBlockStyle() === style.label ? 'active' : ''
                }`}
                onClick={() => setBlockStyle(style.value)}
              >
                {style.label}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="toolbar-divider" />

      {/* Text formatting */}
      <div className="toolbar-group">
        <button
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`toolbar-btn ${editor.isActive('bold') ? 'active' : ''}`}
          title="Bold"
        >
          <Bold className="w-4 h-4" />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`toolbar-btn ${editor.isActive('italic') ? 'active' : ''}`}
          title="Italic"
        >
          <Italic className="w-4 h-4" />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleStrike().run()}
          className={`toolbar-btn ${editor.isActive('strike') ? 'active' : ''}`}
          title="Strikethrough"
        >
          <Strikethrough className="w-4 h-4" />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleCode().run()}
          className={`toolbar-btn ${editor.isActive('code') ? 'active' : ''}`}
          title="Inline code"
        >
          <Code className="w-4 h-4" />
        </button>
      </div>

      <div className="toolbar-divider" />

      {/* Insert */}
      <div className="toolbar-group">
        <button
          onClick={insertLink}
          className={`toolbar-btn ${editor.isActive('link') ? 'active' : ''}`}
          title="Insert link"
        >
          <Link className="w-4 h-4" />
        </button>
        <button
          onClick={insertImage}
          className="toolbar-btn"
          title="Insert image"
        >
          <Image className="w-4 h-4" />
        </button>
      </div>

      <div className="toolbar-divider" />

      {/* Lists */}
      <div className="toolbar-group">
        <button
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`toolbar-btn ${editor.isActive('bulletList') ? 'active' : ''}`}
          title="Bullet list"
        >
          <List className="w-4 h-4" />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`toolbar-btn ${editor.isActive('orderedList') ? 'active' : ''}`}
          title="Numbered list"
        >
          <ListOrdered className="w-4 h-4" />
        </button>
      </div>

      <div className="toolbar-divider" />

      {/* More dropdown */}
      <div className="toolbar-group" ref={moreDropdownRef}>
        <button
          className="toolbar-btn toolbar-dropdown-btn"
          onClick={() => setShowMoreDropdown(!showMoreDropdown)}
        >
          <span>More</span>
          <ChevronDown className="w-3 h-3 ml-1" />
        </button>
        {showMoreDropdown && (
          <div className="toolbar-dropdown">
            {moreItems.map((item) => (
              <button
                key={item.label}
                className="toolbar-dropdown-item"
                onClick={() => {
                  item.action()
                  setShowMoreDropdown(false)
                }}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

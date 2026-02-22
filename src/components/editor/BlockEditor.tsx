import { useEditor, EditorContent } from '@tiptap/react'
import { StarterKit } from '@tiptap/starter-kit'
import { Placeholder } from '@tiptap/extension-placeholder'
import { Typography } from '@tiptap/extension-typography'
import { Link } from '@tiptap/extension-link'
import { Highlight } from '@tiptap/extension-highlight'
import { TaskList } from '@tiptap/extension-task-list'
import { TaskItem } from '@tiptap/extension-task-item'
import { Underline } from '@tiptap/extension-underline'
import { TextStyle } from '@tiptap/extension-text-style'
import { Color } from '@tiptap/extension-color'
import { Table } from '@tiptap/extension-table'
import { TableRow } from '@tiptap/extension-table-row'
import { TableCell } from '@tiptap/extension-table-cell'
import { TableHeader } from '@tiptap/extension-table-header'
import { useEffect, useMemo } from 'react'
import type { JSONContent } from '@tiptap/core'

import { SlashCommand } from './SlashCommand'
import { FloatingMenu } from './FloatingMenu'
import { EditorToolbar } from './EditorToolbar'
import { Callout } from './extensions/Callout'
import { Divider } from './extensions/Divider'
import { ImageBlock } from './extensions/ImageBlock'

interface BlockEditorProps {
  content: JSONContent | null
  onUpdate: (content: JSONContent) => void
  placeholder?: string
}

export function BlockEditor({ content, onUpdate, placeholder = "Type '/' for commands..." }: BlockEditorProps) {
  // Memoize extensions to prevent recreation on re-renders
  const extensions = useMemo(() => [
    StarterKit.configure({
      dropcursor: {
        color: '#3b82f6',
        width: 2,
      },
      bulletList: {
        keepMarks: true,
        keepAttributes: false,
      },
      orderedList: {
        keepMarks: true,
        keepAttributes: false,
      },
    }),
    Placeholder.configure({
      placeholder: ({ node }) => {
        if (node.type.name === 'heading') {
          return 'Heading'
        }
        return placeholder
      },
    }),
    Typography,
    Link.configure({
      openOnClick: false,
      HTMLAttributes: {
        class: 'editor-link',
      },
    }),
    Highlight.configure({
      multicolor: true,
    }),
    TaskList.configure({
      HTMLAttributes: {
        class: 'task-list',
      },
    }),
    TaskItem.configure({
      nested: true,
      HTMLAttributes: {
        class: 'task-item',
      },
    }),
    Underline,
    TextStyle,
    Color,
    Table.configure({
      resizable: true,
    }),
    TableRow,
    TableCell,
    TableHeader,
    SlashCommand,
    Callout,
    Divider,
    ImageBlock,
  ], [placeholder])

  const editor = useEditor({
    extensions,
    content: content || {
      type: 'doc',
      content: [{ type: 'paragraph' }],
    },
    editorProps: {
      attributes: {
        class: 'block-editor-content',
      },
      handleKeyDown: (view, event) => {
        // Handle backspace at the start of a list item to lift/outdent
        if (event.key === 'Backspace') {
          const { state } = view
          const { selection } = state
          const { $from } = selection

          // Check if cursor is at the start of a text block
          if (selection.empty && $from.parentOffset === 0) {
            const parentNode = $from.parent
            const grandParent = $from.node(-1)

            // If we're in a list item and the paragraph is empty or at start
            if (grandParent?.type.name === 'listItem' || grandParent?.type.name === 'taskItem') {
              if (parentNode.content.size === 0) {
                return false // Let TipTap handle it
              }
            }

            // If we're in a blockquote at the start, lift it
            if ($from.node(-1)?.type.name === 'blockquote' && $from.index(-1) === 0) {
              return false // Let TipTap handle it
            }

            // If we're in a heading at the start, convert to paragraph
            if (parentNode.type.name === 'heading' && parentNode.content.size === 0) {
              return false // Let TipTap handle it
            }
          }
        }

        return false
      },
    },
    onUpdate: ({ editor }) => {
      onUpdate(editor.getJSON())
    },
  })

  // Update content when prop changes
  useEffect(() => {
    if (editor && content) {
      const currentContent = JSON.stringify(editor.getJSON())
      const newContent = JSON.stringify(content)
      if (currentContent !== newContent) {
        editor.commands.setContent(content)
      }
    }
  }, [content, editor])

  if (!editor) return null

  return (
    <div className="block-editor">
      <EditorToolbar editor={editor} />
      <div className="block-editor-wrapper">
        <EditorContent editor={editor} />
        <FloatingMenu editor={editor} />
      </div>
    </div>
  )
}

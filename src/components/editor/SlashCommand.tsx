import { useState, useEffect, useCallback, useRef, type ReactNode, forwardRef, useImperativeHandle } from 'react'
import { Extension, type Editor, type Range } from '@tiptap/core'
import { ReactRenderer } from '@tiptap/react'
import Suggestion, { type SuggestionOptions, type SuggestionProps } from '@tiptap/suggestion'
import tippy, { type Instance } from 'tippy.js'
import {
  Type,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  CheckSquare,
  Quote,
  Code,
  Image,
  Minus,
  AlertCircle,
  Table,
} from 'lucide-react'

interface CommandItem {
  title: string
  description: string
  icon: ReactNode
  command: (props: { editor: Editor; range: Range }) => void
  keywords?: string[]
}

interface CommandGroup {
  title: string
  items: CommandItem[]
}

const commandGroups: CommandGroup[] = [
  {
    title: 'Basic blocks',
    items: [
      {
        title: 'Text',
        description: 'Just start typing with plain text.',
        icon: <Type className="w-4 h-4" />,
        command: ({ editor, range }) => {
          editor.chain().focus().deleteRange(range).setParagraph().run()
        },
        keywords: ['paragraph', 'plain'],
      },
      {
        title: 'Heading 1',
        description: 'Big section heading.',
        icon: <Heading1 className="w-4 h-4" />,
        command: ({ editor, range }) => {
          editor.chain().focus().deleteRange(range).setHeading({ level: 1 }).run()
        },
        keywords: ['h1', 'title', 'big'],
      },
      {
        title: 'Heading 2',
        description: 'Medium section heading.',
        icon: <Heading2 className="w-4 h-4" />,
        command: ({ editor, range }) => {
          editor.chain().focus().deleteRange(range).setHeading({ level: 2 }).run()
        },
        keywords: ['h2', 'subtitle'],
      },
      {
        title: 'Heading 3',
        description: 'Small section heading.',
        icon: <Heading3 className="w-4 h-4" />,
        command: ({ editor, range }) => {
          editor.chain().focus().deleteRange(range).setHeading({ level: 3 }).run()
        },
        keywords: ['h3', 'small'],
      },
    ],
  },
  {
    title: 'Lists',
    items: [
      {
        title: 'Bulleted list',
        description: 'Create a simple bulleted list.',
        icon: <List className="w-4 h-4" />,
        command: ({ editor, range }) => {
          editor.chain().focus().deleteRange(range).toggleBulletList().run()
        },
        keywords: ['bullet', 'unordered', 'ul'],
      },
      {
        title: 'Numbered list',
        description: 'Create a list with numbering.',
        icon: <ListOrdered className="w-4 h-4" />,
        command: ({ editor, range }) => {
          editor.chain().focus().deleteRange(range).toggleOrderedList().run()
        },
        keywords: ['number', 'ordered', 'ol'],
      },
      {
        title: 'To-do list',
        description: 'Track tasks with a to-do list.',
        icon: <CheckSquare className="w-4 h-4" />,
        command: ({ editor, range }) => {
          editor.chain().focus().deleteRange(range).toggleTaskList().run()
        },
        keywords: ['todo', 'task', 'checkbox', 'check'],
      },
    ],
  },
  {
    title: 'Other',
    items: [
      {
        title: 'Quote',
        description: 'Capture a quote.',
        icon: <Quote className="w-4 h-4" />,
        command: ({ editor, range }) => {
          editor.chain().focus().deleteRange(range).setBlockquote().run()
        },
        keywords: ['blockquote', 'cite'],
      },
      {
        title: 'Divider',
        description: 'Visually divide blocks.',
        icon: <Minus className="w-4 h-4" />,
        command: ({ editor, range }) => {
          editor.chain().focus().deleteRange(range).setDivider().run()
        },
        keywords: ['hr', 'line', 'separator'],
      },
      {
        title: 'Callout',
        description: 'Make writing stand out.',
        icon: <AlertCircle className="w-4 h-4" />,
        command: ({ editor, range }) => {
          editor
            .chain()
            .focus()
            .deleteRange(range)
            .insertContent({
              type: 'callout',
              attrs: { variant: 'info' },
              content: [{ type: 'paragraph' }],
            })
            .run()
        },
        keywords: ['alert', 'info', 'warning', 'note'],
      },
      {
        title: 'Code',
        description: 'Capture a code snippet.',
        icon: <Code className="w-4 h-4" />,
        command: ({ editor, range }) => {
          editor.chain().focus().deleteRange(range).setCodeBlock().run()
        },
        keywords: ['snippet', 'programming', 'codeblock'],
      },
      {
        title: 'Image',
        description: 'Upload or embed with a link.',
        icon: <Image className="w-4 h-4" />,
        command: ({ editor, range }) => {
          editor.chain().focus().deleteRange(range).run()
          const url = window.prompt('Enter image URL:')
          if (url) {
            editor.chain().focus().setImageBlock({ src: url }).run()
          }
        },
        keywords: ['picture', 'photo', 'media'],
      },
      {
        title: 'Table',
        description: 'Add a table.',
        icon: <Table className="w-4 h-4" />,
        command: ({ editor, range }) => {
          editor.chain().focus().deleteRange(range).insertTable({ rows: 3, cols: 3 }).run()
        },
        keywords: ['grid', 'spreadsheet'],
      },
    ],
  },
]

// Flatten commands for searching
const allCommands = commandGroups.flatMap((g) => g.items)

interface CommandListProps {
  items: CommandItem[]
  command: (item: CommandItem) => void
  query: string
}

interface CommandListRef {
  onKeyDown: (event: KeyboardEvent) => boolean
}

const CommandList = forwardRef<CommandListRef, CommandListProps>(
  ({ items, command, query }, ref) => {
    const [selectedIndex, setSelectedIndex] = useState(0)
    const containerRef = useRef<HTMLDivElement>(null)

    // Group items while preserving their index in the original items array
    const itemIndexMap = new Map(items.map((item, idx) => [item.title, idx]))
    const groupedItems: { title: string; items: { item: CommandItem; originalIndex: number }[] }[] = []

    for (const group of commandGroups) {
      const matchingItems: { item: CommandItem; originalIndex: number }[] = []
      for (const groupItem of group.items) {
        const originalIndex = itemIndexMap.get(groupItem.title)
        if (originalIndex !== undefined) {
          matchingItems.push({ item: items[originalIndex], originalIndex })
        }
      }
      if (matchingItems.length > 0) {
        groupedItems.push({
          title: group.title,
          items: matchingItems,
        })
      }
    }

    // Flatten for keyboard navigation
    const flatItems = groupedItems.flatMap(g => g.items)
    const totalItems = flatItems.length

    // Store flatItems in ref for keyboard handler
    const flatItemsRef = useRef(flatItems)
    flatItemsRef.current = flatItems

    useImperativeHandle(ref, () => ({
      onKeyDown: (event: KeyboardEvent) => {
        if (event.key === 'ArrowUp') {
          event.preventDefault()
          setSelectedIndex((prev) => (prev - 1 + totalItems) % totalItems)
          return true
        }
        if (event.key === 'ArrowDown') {
          event.preventDefault()
          setSelectedIndex((prev) => (prev + 1) % totalItems)
          return true
        }
        if (event.key === 'Enter') {
          event.preventDefault()
          const currentFlatItems = flatItemsRef.current
          const selectedItem = currentFlatItems[selectedIndex]
          if (selectedItem) {
            executeCommand(selectedItem.originalIndex)
          }
          return true
        }
        return false
      },
    }))

    useEffect(() => {
      setSelectedIndex(0)
    }, [items])

    useEffect(() => {
      const container = containerRef.current
      if (!container) return
      const selectedElement = container.querySelector('[data-selected="true"]') as HTMLElement
      if (selectedElement) {
        selectedElement.scrollIntoView({ block: 'nearest' })
      }
    }, [selectedIndex])

    // Store command ref to ensure it's always fresh
    const commandRef = useRef(command)
    commandRef.current = command
    const itemsRef = useRef(items)
    itemsRef.current = items

    const executeCommand = useCallback((index: number) => {
      const item = itemsRef.current[index]
      if (item) {
        commandRef.current(item)
      }
    }, [])

    return (
      <div
        className="slash-command-menu"
        onMouseDown={(e) => e.preventDefault()}
      >
        {/* Search display */}
        {query && (
          <div className="slash-command-search">
            <span className="text-gray-500">Searching: </span>
            <span className="font-medium">{query}</span>
          </div>
        )}

        {/* Results */}
        <div className="slash-command-results" ref={containerRef}>
          {items.length === 0 ? (
            <div className="slash-command-empty">No results found</div>
          ) : (
            (() => {
              let displayIndex = 0
              return groupedItems.map((group) => (
                <div key={group.title} className="slash-command-group">
                  <div className="slash-command-group-title">{group.title}</div>
                  {group.items.map(({ item, originalIndex }) => {
                    const currentDisplayIndex = displayIndex++
                    return (
                      <div
                        key={item.title}
                        role="button"
                        tabIndex={0}
                        data-selected={currentDisplayIndex === selectedIndex}
                        className={`slash-command-item ${currentDisplayIndex === selectedIndex ? 'selected' : ''}`}
                        onMouseUp={() => executeCommand(originalIndex)}
                        onMouseEnter={() => setSelectedIndex(currentDisplayIndex)}
                      >
                        <div className="slash-command-item-icon">{item.icon}</div>
                        <div className="slash-command-item-content">
                          <span className="slash-command-item-title">{item.title}</span>
                          <span className="slash-command-item-description">{item.description}</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ))
            })()
          )}
        </div>

        {/* Footer */}
        <div className="slash-command-footer">
          <span><kbd>↑</kbd><kbd>↓</kbd> navigate</span>
          <span><kbd>↵</kbd> select</span>
          <span><kbd>esc</kbd> close</span>
        </div>
      </div>
    )
  }
)

CommandList.displayName = 'CommandList'

const suggestionConfig: Omit<SuggestionOptions, 'editor'> = {
  char: '/',
  items: ({ query }: { query: string }) => {
    if (!query) return allCommands
    const lowerQuery = query.toLowerCase()
    return allCommands.filter(
      (item) =>
        item.title.toLowerCase().includes(lowerQuery) ||
        item.keywords?.some((k) => k.toLowerCase().includes(lowerQuery))
    )
  },
  render: () => {
    let component: ReactRenderer | null = null
    let popup: Instance[] | null = null

    return {
      onStart: (props: SuggestionProps<CommandItem>) => {
        component = new ReactRenderer(CommandList, {
          props: {
            items: props.items,
            command: props.command,
            query: props.query,
          },
          editor: props.editor,
        })

        if (!props.clientRect) return

        popup = tippy('body', {
          getReferenceClientRect: props.clientRect as () => DOMRect,
          appendTo: () => document.body,
          content: component.element,
          showOnCreate: true,
          interactive: true,
          trigger: 'manual',
          placement: 'bottom-start',
          offset: [0, 8],
        })
      },

      onUpdate: (props: SuggestionProps<CommandItem>) => {
        component?.updateProps({
          items: props.items,
          command: props.command,
          query: props.query,
        })

        if (!props.clientRect) return

        popup?.[0]?.setProps({
          getReferenceClientRect: props.clientRect as () => DOMRect,
        })
      },

      onKeyDown: (props: { event: KeyboardEvent }) => {
        if (props.event.key === 'Escape') {
          popup?.[0]?.hide()
          return true
        }

        const ref = component?.ref as CommandListRef | null
        return ref?.onKeyDown(props.event) ?? false
      },

      onExit: () => {
        popup?.[0]?.destroy()
        component?.destroy()
      },
    }
  },
}

export const SlashCommand = Extension.create({
  name: 'slashCommand',

  addOptions() {
    return {
      suggestion: suggestionConfig,
    }
  },

  addProseMirrorPlugins() {
    return [
      Suggestion({
        editor: this.editor,
        ...this.options.suggestion,
      }),
    ]
  },
})

import type { JSONContent } from '@tiptap/core'

/**
 * Converts Markdown string to TipTap JSONContent
 * This is a basic parser for migration purposes
 */
export function markdownToJson(markdown: string): JSONContent {
  const lines = markdown.split('\n')
  const content: JSONContent[] = []
  let i = 0

  while (i < lines.length) {
    const line = lines[i]

    // Empty line - skip
    if (line.trim() === '') {
      i++
      continue
    }

    // Heading
    const headingMatch = line.match(/^(#{1,6})\s+(.*)$/)
    if (headingMatch) {
      content.push({
        type: 'heading',
        attrs: { level: headingMatch[1].length },
        content: parseInlineContent(headingMatch[2]),
      })
      i++
      continue
    }

    // Horizontal rule
    if (/^(-{3,}|_{3,}|\*{3,})$/.test(line.trim())) {
      content.push({ type: 'divider' })
      i++
      continue
    }

    // Code block
    if (line.startsWith('```')) {
      const language = line.slice(3).trim()
      const codeLines: string[] = []
      i++
      while (i < lines.length && !lines[i].startsWith('```')) {
        codeLines.push(lines[i])
        i++
      }
      content.push({
        type: 'codeBlock',
        attrs: { language },
        content: [{ type: 'text', text: codeLines.join('\n') }],
      })
      i++ // Skip closing ```
      continue
    }

    // Blockquote
    if (line.startsWith('>')) {
      const quoteLines: string[] = []
      while (i < lines.length && (lines[i].startsWith('>') || lines[i].trim() === '')) {
        if (lines[i].startsWith('>')) {
          quoteLines.push(lines[i].replace(/^>\s?/, ''))
        }
        i++
      }
      content.push({
        type: 'blockquote',
        content: [
          {
            type: 'paragraph',
            content: parseInlineContent(quoteLines.join(' ')),
          },
        ],
      })
      continue
    }

    // Unordered list
    if (/^[-*+]\s/.test(line)) {
      const listItems: JSONContent[] = []
      while (i < lines.length && /^[-*+]\s/.test(lines[i])) {
        const itemText = lines[i].replace(/^[-*+]\s/, '')
        // Check for task list item
        const taskMatch = itemText.match(/^\[([ x])\]\s(.*)$/)
        if (taskMatch) {
          listItems.push({
            type: 'taskItem',
            attrs: { checked: taskMatch[1] === 'x' },
            content: [
              {
                type: 'paragraph',
                content: parseInlineContent(taskMatch[2]),
              },
            ],
          })
        } else {
          listItems.push({
            type: 'listItem',
            content: [
              {
                type: 'paragraph',
                content: parseInlineContent(itemText),
              },
            ],
          })
        }
        i++
      }
      // Check if it's a task list or regular bullet list
      const isTaskList = listItems.some((item) => item.type === 'taskItem')
      content.push({
        type: isTaskList ? 'taskList' : 'bulletList',
        content: listItems,
      })
      continue
    }

    // Ordered list
    if (/^\d+\.\s/.test(line)) {
      const listItems: JSONContent[] = []
      while (i < lines.length && /^\d+\.\s/.test(lines[i])) {
        const itemText = lines[i].replace(/^\d+\.\s/, '')
        listItems.push({
          type: 'listItem',
          content: [
            {
              type: 'paragraph',
              content: parseInlineContent(itemText),
            },
          ],
        })
        i++
      }
      content.push({
        type: 'orderedList',
        content: listItems,
      })
      continue
    }

    // Image
    const imageMatch = line.match(/^!\[([^\]]*)\]\(([^)]+)\)$/)
    if (imageMatch) {
      content.push({
        type: 'imageBlock',
        attrs: {
          src: imageMatch[2],
          alt: imageMatch[1],
          caption: '',
          align: 'center',
          width: '100%',
        },
      })
      i++
      continue
    }

    // Table
    if (line.includes('|') && line.trim().startsWith('|')) {
      const tableRows: JSONContent[] = []
      while (i < lines.length && lines[i].includes('|')) {
        const row = lines[i]
        // Skip separator row
        if (/^\|[\s-:|]+\|$/.test(row)) {
          i++
          continue
        }
        const cells = row
          .split('|')
          .filter((cell) => cell.trim() !== '')
          .map((cell) => ({
            type: 'tableCell',
            content: [
              {
                type: 'paragraph',
                content: parseInlineContent(cell.trim()),
              },
            ],
          }))
        tableRows.push({
          type: 'tableRow',
          content: cells,
        })
        i++
      }
      if (tableRows.length > 0) {
        // Make first row headers
        if (tableRows[0].content) {
          tableRows[0].content = tableRows[0].content.map((cell: JSONContent) => ({
            ...cell,
            type: 'tableHeader',
          }))
        }
        content.push({
          type: 'table',
          content: tableRows,
        })
      }
      continue
    }

    // Regular paragraph
    const paragraphLines: string[] = [line]
    i++
    while (
      i < lines.length &&
      lines[i].trim() !== '' &&
      !lines[i].startsWith('#') &&
      !lines[i].startsWith('>') &&
      !lines[i].startsWith('```') &&
      !/^[-*+]\s/.test(lines[i]) &&
      !/^\d+\.\s/.test(lines[i]) &&
      !/^(-{3,}|_{3,}|\*{3,})$/.test(lines[i].trim())
    ) {
      paragraphLines.push(lines[i])
      i++
    }

    content.push({
      type: 'paragraph',
      content: parseInlineContent(paragraphLines.join(' ')),
    })
  }

  return {
    type: 'doc',
    content: content.length > 0 ? content : [{ type: 'paragraph' }],
  }
}

function parseInlineContent(text: string): JSONContent[] {
  if (!text) return []

  const result: JSONContent[] = []
  let remaining = text

  // Process inline elements
  const patterns: Array<{
    regex: RegExp
    process: (match: RegExpMatchArray) => { node: JSONContent; length: number }
  }> = [
    // Bold
    {
      regex: /^\*\*(.+?)\*\*/,
      process: (match) => ({
        node: {
          type: 'text',
          text: match[1],
          marks: [{ type: 'bold' }],
        },
        length: match[0].length,
      }),
    },
    // Italic
    {
      regex: /^\*(.+?)\*/,
      process: (match) => ({
        node: {
          type: 'text',
          text: match[1],
          marks: [{ type: 'italic' }],
        },
        length: match[0].length,
      }),
    },
    // Strikethrough
    {
      regex: /^~~(.+?)~~/,
      process: (match) => ({
        node: {
          type: 'text',
          text: match[1],
          marks: [{ type: 'strike' }],
        },
        length: match[0].length,
      }),
    },
    // Inline code
    {
      regex: /^`([^`]+)`/,
      process: (match) => ({
        node: {
          type: 'text',
          text: match[1],
          marks: [{ type: 'code' }],
        },
        length: match[0].length,
      }),
    },
    // Link
    {
      regex: /^\[([^\]]+)\]\(([^)]+)\)/,
      process: (match) => ({
        node: {
          type: 'text',
          text: match[1],
          marks: [{ type: 'link', attrs: { href: match[2] } }],
        },
        length: match[0].length,
      }),
    },
  ]

  while (remaining.length > 0) {
    let matched = false

    for (const { regex, process } of patterns) {
      const match = remaining.match(regex)
      if (match) {
        const { node, length } = process(match)
        result.push(node)
        remaining = remaining.slice(length)
        matched = true
        break
      }
    }

    if (!matched) {
      // Find the next special character or end of string
      const nextSpecial = remaining.search(/\*|~|`|\[/)
      if (nextSpecial === -1) {
        // No more special characters, add rest as plain text
        if (remaining.length > 0) {
          result.push({ type: 'text', text: remaining })
        }
        break
      } else if (nextSpecial === 0) {
        // Special char at start but didn't match any pattern, add single char
        result.push({ type: 'text', text: remaining[0] })
        remaining = remaining.slice(1)
      } else {
        // Add text up to the special character
        result.push({ type: 'text', text: remaining.slice(0, nextSpecial) })
        remaining = remaining.slice(nextSpecial)
      }
    }
  }

  // Merge adjacent text nodes without marks
  const merged: JSONContent[] = []
  for (const node of result) {
    const last = merged[merged.length - 1]
    if (
      last &&
      last.type === 'text' &&
      node.type === 'text' &&
      !last.marks &&
      !node.marks
    ) {
      last.text = (last.text || '') + (node.text || '')
    } else {
      merged.push(node)
    }
  }

  return merged
}

import type { JSONContent } from '@tiptap/core'

/**
 * Converts TipTap JSONContent to Markdown string
 */
export function jsonToMarkdown(json: JSONContent): string {
  if (!json.content) return ''
  return json.content.map((node) => nodeToMarkdown(node)).join('\n\n')
}

function nodeToMarkdown(node: JSONContent, listDepth = 0): string {
  if (!node.type) return ''

  switch (node.type) {
    case 'paragraph':
      return contentToMarkdown(node.content || [])

    case 'heading': {
      const level = (node.attrs?.level as number) || 1
      const prefix = '#'.repeat(level)
      return `${prefix} ${contentToMarkdown(node.content || [])}`
    }

    case 'bulletList':
      return (node.content || [])
        .map((item) => nodeToMarkdown(item, listDepth))
        .join('\n')

    case 'orderedList':
      return (node.content || [])
        .map((item, idx) => nodeToMarkdown(item, listDepth, idx + 1))
        .join('\n')

    case 'listItem': {
      const indent = '  '.repeat(listDepth)
      const content = (node.content || [])
        .map((child, idx) => {
          if (idx === 0) {
            return nodeToMarkdown(child, listDepth + 1)
          }
          return nodeToMarkdown(child, listDepth + 1)
        })
        .join('\n')
      return `${indent}- ${content}`
    }

    case 'taskList':
      return (node.content || [])
        .map((item) => nodeToMarkdown(item, listDepth))
        .join('\n')

    case 'taskItem': {
      const indent = '  '.repeat(listDepth)
      const checked = node.attrs?.checked ? 'x' : ' '
      const content = contentToMarkdown(
        node.content?.[0]?.content || []
      )
      return `${indent}- [${checked}] ${content}`
    }

    case 'blockquote': {
      const content = (node.content || [])
        .map((child) => nodeToMarkdown(child))
        .join('\n')
      return content
        .split('\n')
        .map((line) => `> ${line}`)
        .join('\n')
    }

    case 'codeBlock': {
      const language = (node.attrs?.language as string) || ''
      const code = node.content?.[0]?.text || ''
      return `\`\`\`${language}\n${code}\n\`\`\``
    }

    case 'horizontalRule':
    case 'divider':
      return '---'

    case 'image':
    case 'imageBlock': {
      const src = node.attrs?.src || ''
      const alt = node.attrs?.alt || ''
      const caption = node.attrs?.caption || ''
      let result = `![${alt}](${src})`
      if (caption) {
        result += `\n*${caption}*`
      }
      return result
    }

    case 'callout': {
      const variant = node.attrs?.variant || 'info'
      const content = (node.content || [])
        .map((child) => nodeToMarkdown(child))
        .join('\n')
      return `> **${variant.toUpperCase()}:** ${content}`
    }

    case 'table': {
      const rows = node.content || []
      if (rows.length === 0) return ''

      const tableRows = rows.map((row) => {
        const cells = row.content || []
        return (
          '| ' +
          cells
            .map((cell) => contentToMarkdown(cell.content?.[0]?.content || []))
            .join(' | ') +
          ' |'
        )
      })

      // Add header separator after first row
      if (tableRows.length > 0) {
        const firstRow = rows[0]
        const cellCount = firstRow.content?.length || 0
        const separator = '| ' + Array(cellCount).fill('---').join(' | ') + ' |'
        tableRows.splice(1, 0, separator)
      }

      return tableRows.join('\n')
    }

    case 'text':
      return applyMarks(node.text || '', node.marks || [])

    default:
      // Try to extract text content for unknown node types
      if (node.content) {
        return (node.content || [])
          .map((child) => nodeToMarkdown(child, listDepth))
          .join('\n')
      }
      return ''
  }
}

function contentToMarkdown(content: JSONContent[]): string {
  return content.map((node) => {
    if (node.type === 'text') {
      return applyMarks(node.text || '', node.marks || [])
    }
    if (node.type === 'hardBreak') {
      return '  \n'
    }
    return nodeToMarkdown(node)
  }).join('')
}

function applyMarks(text: string, marks: Array<{ type: string; attrs?: Record<string, unknown> }>): string {
  let result = text

  for (const mark of marks) {
    switch (mark.type) {
      case 'bold':
      case 'strong':
        result = `**${result}**`
        break
      case 'italic':
      case 'em':
        result = `*${result}*`
        break
      case 'strike':
        result = `~~${result}~~`
        break
      case 'code':
        result = `\`${result}\``
        break
      case 'link':
        result = `[${result}](${mark.attrs?.href || ''})`
        break
      case 'underline':
        // Markdown doesn't have native underline, use HTML
        result = `<u>${result}</u>`
        break
      case 'highlight':
        result = `==${result}==`
        break
    }
  }

  return result
}

import { Node, mergeAttributes } from '@tiptap/core'
import { ReactNodeViewRenderer, NodeViewWrapper } from '@tiptap/react'

interface DividerComponentProps {
  selected: boolean
}

function DividerComponent({ selected }: DividerComponentProps) {
  return (
    <NodeViewWrapper>
      <div
        className={`divider-block my-6 ${selected ? 'ring-2 ring-blue-500 ring-offset-2 rounded' : ''}`}
        contentEditable={false}
      >
        <hr className="border-t border-gray-300" />
      </div>
    </NodeViewWrapper>
  )
}

export const Divider = Node.create({
  name: 'divider',

  group: 'block',

  atom: true,

  parseHTML() {
    return [
      { tag: 'hr' },
      { tag: 'div[data-type="divider"]' },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return ['hr', mergeAttributes(HTMLAttributes)]
  },

  addNodeView() {
    return ReactNodeViewRenderer(DividerComponent)
  },

  addInputRules() {
    return [
      {
        find: /^(?:---|—-|___|\*\*\*)\s$/,
        handler: ({ state, range, commands }) => {
          commands.deleteRange(range)
          commands.setDivider()

          // Add a paragraph after the divider
          const { tr } = state
          const pos = tr.selection.from
          commands.insertContentAt(pos, { type: 'paragraph' })
        },
      },
    ]
  },

  addCommands() {
    return {
      setDivider:
        () =>
        ({ chain }) => {
          return chain()
            .insertContent({ type: this.name })
            .command(({ tr, dispatch }) => {
              if (dispatch) {
                const { $to } = tr.selection
                const posAfter = $to.end()

                if ($to.nodeAfter) {
                  tr.setSelection(
                    // @ts-expect-error TextSelection exists
                    new (window as unknown as { ProseMirror: { TextSelection: new (doc: unknown, pos: number) => unknown } }).ProseMirror.TextSelection(
                      tr.doc.resolve(posAfter)
                    )
                  )
                } else {
                  // Add a new paragraph after if there's nothing
                  const node = $to.parent.type.contentMatch.defaultType?.create()
                  if (node) {
                    tr.insert(posAfter, node)
                    tr.setSelection(
                      // @ts-expect-error TextSelection exists
                      new (window as unknown as { ProseMirror: { TextSelection: new (doc: unknown, pos: number) => unknown } }).ProseMirror.TextSelection(
                        tr.doc.resolve(posAfter + 1)
                      )
                    )
                  }
                }

                tr.scrollIntoView()
              }

              return true
            })
            .run()
        },
    }
  },
})

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    divider: {
      setDivider: () => ReturnType
    }
  }
}

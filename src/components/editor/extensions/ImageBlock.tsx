import { Node, mergeAttributes } from '@tiptap/core'
import { ReactNodeViewRenderer, NodeViewWrapper } from '@tiptap/react'
import { useState } from 'react'
import { AlignLeft, AlignCenter, AlignRight, ZoomIn, Trash2 } from 'lucide-react'

type ImageAlign = 'left' | 'center' | 'right'

interface ImageBlockComponentProps {
  node: {
    attrs: {
      src: string
      alt: string
      caption: string
      align: ImageAlign
      width: string
    }
  }
  updateAttributes: (attrs: Partial<{
    src: string
    alt: string
    caption: string
    align: ImageAlign
    width: string
  }>) => void
  deleteNode: () => void
  selected: boolean
}

function ImageBlockComponent({ node, updateAttributes, deleteNode, selected }: ImageBlockComponentProps) {
  const { src, alt, caption, align, width } = node.attrs
  const [showLightbox, setShowLightbox] = useState(false)
  const [showControls, setShowControls] = useState(false)

  const alignmentClasses = {
    left: 'mr-auto',
    center: 'mx-auto',
    right: 'ml-auto',
  }

  if (!src) {
    return (
      <NodeViewWrapper>
        <div className="image-placeholder border-2 border-dashed border-gray-300 rounded-lg p-8 text-center my-4 bg-gray-50">
          <p className="text-gray-500">No image URL set</p>
        </div>
      </NodeViewWrapper>
    )
  }

  return (
    <NodeViewWrapper>
      <figure
        className={`image-block my-4 ${alignmentClasses[align]} ${selected ? 'ring-2 ring-blue-500 ring-offset-2 rounded-lg' : ''}`}
        style={{ width: width || '100%', maxWidth: '100%' }}
        onMouseEnter={() => setShowControls(true)}
        onMouseLeave={() => setShowControls(false)}
      >
        <div className="relative">
          <img
            src={src}
            alt={alt || ''}
            className="w-full h-auto rounded-lg"
            draggable={false}
          />

          {/* Controls overlay */}
          {showControls && (
            <div className="absolute top-2 right-2 flex gap-1 bg-white/90 backdrop-blur-sm rounded-lg shadow-lg p-1">
              <button
                onClick={() => setShowLightbox(true)}
                className="p-1.5 hover:bg-gray-100 rounded"
                title="View full size"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <div className="w-px bg-gray-200" />
              <button
                onClick={() => updateAttributes({ align: 'left' })}
                className={`p-1.5 rounded ${align === 'left' ? 'bg-gray-200' : 'hover:bg-gray-100'}`}
                title="Align left"
              >
                <AlignLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => updateAttributes({ align: 'center' })}
                className={`p-1.5 rounded ${align === 'center' ? 'bg-gray-200' : 'hover:bg-gray-100'}`}
                title="Align center"
              >
                <AlignCenter className="w-4 h-4" />
              </button>
              <button
                onClick={() => updateAttributes({ align: 'right' })}
                className={`p-1.5 rounded ${align === 'right' ? 'bg-gray-200' : 'hover:bg-gray-100'}`}
                title="Align right"
              >
                <AlignRight className="w-4 h-4" />
              </button>
              <div className="w-px bg-gray-200" />
              <button
                onClick={deleteNode}
                className="p-1.5 hover:bg-red-100 text-red-500 rounded"
                title="Remove image"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Caption input */}
        <figcaption className="mt-2">
          <input
            type="text"
            value={caption || ''}
            onChange={(e) => updateAttributes({ caption: e.target.value })}
            placeholder="Add a caption..."
            className="w-full text-center text-sm text-gray-500 bg-transparent border-none focus:outline-none focus:ring-0"
          />
        </figcaption>
      </figure>

      {/* Lightbox */}
      {showLightbox && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setShowLightbox(false)}
        >
          <img
            src={src}
            alt={alt || ''}
            className="max-w-full max-h-full object-contain"
          />
          <button
            onClick={() => setShowLightbox(false)}
            className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}
    </NodeViewWrapper>
  )
}

export const ImageBlock = Node.create({
  name: 'imageBlock',

  group: 'block',

  atom: true,

  draggable: true,

  addAttributes() {
    return {
      src: {
        default: '',
      },
      alt: {
        default: '',
      },
      caption: {
        default: '',
      },
      align: {
        default: 'center',
      },
      width: {
        default: '100%',
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'figure[data-type="image-block"]',
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return ['figure', mergeAttributes({ 'data-type': 'image-block' }, HTMLAttributes)]
  },

  addNodeView() {
    return ReactNodeViewRenderer(ImageBlockComponent)
  },

  addCommands() {
    return {
      setImageBlock:
        (attributes) =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs: attributes,
          })
        },
    }
  },
})

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    imageBlock: {
      setImageBlock: (attributes: { src: string; alt?: string; caption?: string; align?: ImageAlign; width?: string }) => ReturnType
    }
  }
}

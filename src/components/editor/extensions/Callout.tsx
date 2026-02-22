import { Node, mergeAttributes } from '@tiptap/core'
import { ReactNodeViewRenderer, NodeViewWrapper, NodeViewContent } from '@tiptap/react'
import { AlertCircle, AlertTriangle, CheckCircle, XCircle, Info } from 'lucide-react'

export type CalloutVariant = 'info' | 'warning' | 'success' | 'error' | 'note'

const variantConfig: Record<CalloutVariant, {
  icon: typeof AlertCircle
  bgColor: string
  borderColor: string
  iconColor: string
}> = {
  info: {
    icon: Info,
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    iconColor: 'text-blue-500',
  },
  warning: {
    icon: AlertTriangle,
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-200',
    iconColor: 'text-yellow-500',
  },
  success: {
    icon: CheckCircle,
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    iconColor: 'text-green-500',
  },
  error: {
    icon: XCircle,
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    iconColor: 'text-red-500',
  },
  note: {
    icon: AlertCircle,
    bgColor: 'bg-gray-50',
    borderColor: 'border-gray-200',
    iconColor: 'text-gray-500',
  },
}

interface CalloutComponentProps {
  node: {
    attrs: {
      variant: CalloutVariant
    }
  }
  updateAttributes: (attrs: Partial<{ variant: CalloutVariant }>) => void
  selected: boolean
}

function CalloutComponent({ node, updateAttributes, selected }: CalloutComponentProps) {
  const variant = node.attrs.variant || 'info'
  const config = variantConfig[variant]
  const Icon = config.icon

  return (
    <NodeViewWrapper>
      <div
        className={`callout-block ${config.bgColor} ${config.borderColor} border-l-4 p-4 my-4 rounded-r-lg ${selected ? 'ring-2 ring-blue-500' : ''}`}
        data-variant={variant}
      >
        <div className="flex gap-3">
          <div className={`flex-shrink-0 ${config.iconColor}`}>
            <Icon className="w-5 h-5 mt-0.5" />
          </div>
          <div className="flex-1 min-w-0">
            <NodeViewContent className="callout-content" />
          </div>
        </div>
        <div className="callout-variant-selector mt-2 flex gap-1">
          {(Object.keys(variantConfig) as CalloutVariant[]).map((v) => {
            const vConfig = variantConfig[v]
            const VIcon = vConfig.icon
            return (
              <button
                key={v}
                onClick={() => updateAttributes({ variant: v })}
                className={`p-1 rounded ${variant === v ? 'bg-white shadow-sm' : 'hover:bg-white/50'} ${vConfig.iconColor}`}
                title={v.charAt(0).toUpperCase() + v.slice(1)}
              >
                <VIcon className="w-4 h-4" />
              </button>
            )
          })}
        </div>
      </div>
    </NodeViewWrapper>
  )
}

export const Callout = Node.create({
  name: 'callout',

  group: 'block',

  content: 'block+',

  defining: true,

  addAttributes() {
    return {
      variant: {
        default: 'info',
        parseHTML: (element) => element.getAttribute('data-variant') || 'info',
        renderHTML: (attributes) => ({
          'data-variant': attributes.variant,
        }),
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="callout"]',
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes({ 'data-type': 'callout' }, HTMLAttributes), 0]
  },

  addNodeView() {
    return ReactNodeViewRenderer(CalloutComponent)
  },
})

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    callout: {
      setCallout: (attributes?: { variant?: CalloutVariant }) => ReturnType
    }
  }
}

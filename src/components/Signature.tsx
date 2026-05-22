import { useState, useEffect, useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import opentype from 'opentype.js'

interface SignatureProps {
  text?: string
  color?: string
  fontSize?: number
  duration?: number
  delay?: number
  className?: string
  inView?: boolean
}

export function Signature({
  text = 'Signature',
  color,
  fontSize = 14,
  duration = 1.5,
  delay = 0,
  className = '',
  inView = false
}: SignatureProps) {
  // Use currentColor if no color specified - this respects CSS color property
  const strokeColor = color || 'currentColor'
  const [pathData, setPathData] = useState<string>('')
  const [viewBox, setViewBox] = useState('0 0 100 50')
  const [animationKey, setAnimationKey] = useState(0)
  const [isLoaded, setIsLoaded] = useState(false)
  const ref = useRef<SVGSVGElement>(null)
  const isInView = useInView(ref, { once: false, amount: 0.5 })

  const shouldAnimate = inView ? isInView : true

  useEffect(() => {
    const loadFont = async () => {
      try {
        const font = await opentype.load('/LastoriaBoldRegular.otf')
        // Get initial path to calculate bounding box
        const initialPath = font.getPath(text, 0, fontSize, fontSize)
        const bbox = initialPath.getBoundingBox()

        const padding = 8
        const strokeWidth = fontSize / 12
        const width = bbox.x2 - bbox.x1 + padding * 2 + strokeWidth
        const height = bbox.y2 - bbox.y1 + padding * 2 + strokeWidth

        // Position text: x offset centers horizontally, y offset positions baseline
        // so full glyph (including ascenders) fits in viewBox
        const xOffset = -bbox.x1 + padding + strokeWidth / 2
        const yOffset = -bbox.y1 + padding + strokeWidth / 2

        const translatedPath = font.getPath(text, xOffset, yOffset, fontSize)

        setPathData(translatedPath.toPathData(2))
        setViewBox(`0 0 ${width} ${height}`)
        setIsLoaded(true)
      } catch (error) {
        console.error('Failed to load signature font:', error)
      }
    }

    loadFont()
  }, [text, fontSize])

  if (!isLoaded) {
    return null
  }

  return (
    <motion.svg
      ref={ref}
      viewBox={viewBox}
      fill="none"
      className={className}
      initial={{ opacity: 0 }}
      animate={{ opacity: shouldAnimate ? 1 : 0 }}
      transition={{ duration: 0.3, delay }}
    >
      <motion.path
        d={pathData}
        stroke={strokeColor}
        strokeWidth={fontSize / 12}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={shouldAnimate ? { pathLength: 1, opacity: 1 } : { pathLength: 0, opacity: 0 }}
        transition={{
          pathLength: { duration, ease: 'easeInOut', delay },
          opacity: { duration: 0.2, delay }
        }}
      />
      <motion.path
        d={pathData}
        fill={strokeColor}
        stroke="none"
        initial={{ opacity: 0 }}
        animate={shouldAnimate ? { opacity: 1 } : { opacity: 0 }}
        transition={{
          opacity: { duration: 0.4, delay: delay + duration * 0.8 }
        }}
      />
    </motion.svg>
  )
}

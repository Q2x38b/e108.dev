import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence, type PanInfo } from 'framer-motion'
import { useQuery } from 'convex/react'
import { play } from 'cuelume'
import { api } from '../../convex/_generated/api'
import { useHaptics } from '../hooks/useHaptics'
import { useAuth } from '../contexts/AuthContext'


// Cursor-origin tracker for the scale-in hover background on prev/next buttons
function setCursorOrigin(el: HTMLElement, e: PointerEvent) {
  const { clientX, clientY } = e
  const { top, left } = el.getBoundingClientRect()
  el.style.setProperty('--x', `${clientX - left}px`)
  el.style.setProperty('--y', `${clientY - top}px`)
}

function cursorOriginRef(el: HTMLElement | null) {
  if (!el) return
  el.addEventListener('pointerenter', (e) => setCursorOrigin(el, e))
  el.addEventListener('pointerleave', (e) => setCursorOrigin(el, e))
}

type ItemType = 'image' | 'quote' | 'text'
type QuoteStyle = 'default' | 'bar'

interface ShelfItem {
  _id: string
  type: ItemType
  url?: string | null
  fileName?: string
  quoteText?: string
  quoteAuthor?: string
  quoteSource?: string
  quoteStyle?: QuoteStyle
  textContent?: string
  textLabel?: string
  caption?: string
  backgroundColor?: string
}

const AUTOPLAY_DELAY = 4500

const DARK_BG_VALUES = new Set([
  '#2d3748',
  '#1a1a2e',
  '#374151',
  '#18181b',
  '#0f172a',
  '#292524',
  '#27272a',
])

function isDarkBg(color?: string) {
  return !!color && DARK_BG_VALUES.has(color)
}

function ShelfCarouselSlide({
  item,
  isExpanded,
}: {
  item: ShelfItem
  isExpanded?: boolean
}) {
  if (item.type === 'image' && item.url) {
    return (
      <div className="shelf-carousel-slide shelf-carousel-slide-image">
        <motion.img
          layoutId={`shelf-img-${item._id}`}
          src={item.url}
          alt={item.caption || item.fileName || 'Shelf image'}
          draggable={false}
          loading="eager"
          // @ts-expect-error -- fetchpriority is a valid img attribute but React types lag
          fetchpriority="high"
          decoding="async"
          style={{ visibility: isExpanded ? 'hidden' : 'visible' }}
        />
      </div>
    )
  }

  if (item.type === 'quote') {
    const dark = isDarkBg(item.backgroundColor)
    return (
      <div
        className={`shelf-carousel-slide shelf-carousel-slide-quote ${dark ? 'dark' : ''} ${item.quoteStyle === 'bar' ? 'bar-style' : ''}`}
        style={{ backgroundColor: item.backgroundColor || undefined }}
      >
        {item.quoteStyle === 'bar' ? (
          <div className="shelf-carousel-quote-bar">
            <div className="shelf-carousel-quote-bar-line" />
            <blockquote>"{item.quoteText}"</blockquote>
          </div>
        ) : (
          <>
            <svg className="shelf-carousel-quote-icon" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M4.583 17.321C3.553 16.227 3 15 3 13.011c0-3.5 2.457-6.637 6.03-8.188l.893 1.378c-3.335 1.804-3.987 4.145-4.247 5.621.537-.278 1.24-.375 1.929-.311 1.804.167 3.226 1.648 3.226 3.489a3.5 3.5 0 01-3.5 3.5c-1.073 0-2.099-.49-2.748-1.179zm10 0C13.553 16.227 13 15 13 13.011c0-3.5 2.457-6.637 6.03-8.188l.893 1.378c-3.335 1.804-3.987 4.145-4.247 5.621.537-.278 1.24-.375 1.929-.311 1.804.167 3.226 1.648 3.226 3.489a3.5 3.5 0 01-3.5 3.5c-1.073 0-2.099-.49-2.748-1.179z" />
            </svg>
            <blockquote>{item.quoteText}</blockquote>
          </>
        )}
      </div>
    )
  }

  if (item.type === 'text') {
    const dark = isDarkBg(item.backgroundColor)
    return (
      <div
        className={`shelf-carousel-slide shelf-carousel-slide-text ${dark ? 'dark' : ''}`}
        style={{ backgroundColor: item.backgroundColor || undefined }}
      >
        <p>{item.textContent}</p>
      </div>
    )
  }

  return null
}

function describeItem(item?: ShelfItem): string {
  if (!item) return ''
  if (item.type === 'image') return item.caption || ''
  if (item.type === 'quote') {
    const parts: string[] = []
    if (item.quoteAuthor) parts.push(`— ${item.quoteAuthor}`)
    if (item.quoteSource) parts.push(item.quoteSource)
    return parts.join(', ')
  }
  if (item.type === 'text') return item.textLabel || ''
  return ''
}

const ChevronLeft = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polyline points="15 18 9 12 15 6" />
  </svg>
)

const ChevronRight = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polyline points="9 18 15 12 9 6" />
  </svg>
)

const PlayIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M11.1967 2.71828C8.53683 0.970354 5 2.8783 5 6.0611V17.9387C5 21.1215 8.53684 23.0294 11.1967 21.2815L20.234 15.3427C22.6384 13.7627 22.6384 10.2371 20.234 8.65706L11.1967 2.71828Z"
      fill="currentColor"
    />
  </svg>
)

const PauseIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M4 6C4 4.34315 5.34315 3 7 3C8.65685 3 10 4.34315 10 6V18C10 19.6569 8.65685 21 7 21C5.34315 21 4 19.6569 4 18V6Z"
      fill="currentColor"
    />
    <path
      d="M14 6C14 4.34315 15.3431 3 17 3C18.6569 3 20 4.34315 20 6V18C20 19.6569 18.6569 21 17 21C15.3431 21 14 19.6569 14 18V6Z"
      fill="currentColor"
    />
  </svg>
)

const GalleryViewIcon = () => (
  <svg viewBox="0 0 20 20" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
    <rect x="3" y="3" width="7" height="6" rx="1" ry="1" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" fill="currentColor" />
    <rect x="14" y="6" width="3" height="10" rx="1" ry="1" fill="currentColor" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
    <rect x="5" y="13" width="5" height="4" rx="1" ry="1" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" fill="currentColor" />
  </svg>
)

const SlideshowViewIcon = () => (
  <svg viewBox="0 0 20 20" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
    <rect x="1" y="5" width="14" height="10" rx="1.5" ry="1.5" transform="translate(-2 18) rotate(-90)" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" fill="currentColor" />
    <line x1="17" y1="15" x2="17" y2="5" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
  </svg>
)

// Matches the blog list's trickle-in: small lift, slight scale-up,
// blur clearing as each card arrives in place.
const galleryFadeInUp = {
  hidden: { opacity: 0, y: 8, scale: 0.98, filter: 'blur(8px)' },
  visible: { opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' },
}

export function ShelfCarousel({ className }: { className?: string }) {
  const items = useQuery(api.shelf.list) as ShelfItem[] | undefined
  const haptics = useHaptics()
  const { isAuthenticated } = useAuth()
  const [activeIndex, setActiveIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(true)
  const [view, setView] = useState<'slideshow' | 'gallery'>('slideshow')
  const [expandedItem, setExpandedItem] = useState<ShelfItem | null>(null)
  // Keeps the source card image hidden while the zoomed clone flies back,
  // so the two never overlap during the close morph.
  const [closingId, setClosingId] = useState<string | null>(null)
  const isDragging = useRef(false)

  const count = items?.length ?? 0

  // Wrap so autoplay loops forever, matching the previous Swiper behaviour
  const step = (delta: number) => {
    setActiveIndex((prev) => (count ? (prev + delta + count) % count : 0))
  }

  const handleImageClick = (item: ShelfItem) => {
    haptics.selection()
    play('loading')
    setClosingId(null)
    setExpandedItem(item)
  }

  const closeExpanded = () => {
    haptics.soft()
    play('release')
    setClosingId(expandedItem?._id ?? null)
    setExpandedItem(null)
  }

  const toggleView = () => {
    haptics.selection()
    play('toggle')
    setView((v) => (v === 'slideshow' ? 'gallery' : 'slideshow'))
  }

  // Autoplay: one timer per slide. Pausing, opening the lightbox, or
  // switching to the gallery grid stops scheduling the next advance.
  const autoplayActive = isPlaying && count > 1 && !expandedItem && view === 'slideshow'
  useEffect(() => {
    if (!autoplayActive) return
    const id = window.setTimeout(() => {
      setActiveIndex((prev) => (prev + 1) % count)
    }, AUTOPLAY_DELAY)
    return () => window.clearTimeout(id)
  }, [autoplayActive, activeIndex, count])

  // Lock body scroll + close on Escape while modal is open
  useEffect(() => {
    if (!expandedItem) return
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth
    const prevOverflow = document.body.style.overflow
    const prevPadding = document.body.style.paddingRight
    document.body.style.overflow = 'hidden'
    document.body.style.paddingRight = `${scrollbarWidth}px`
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeExpanded()
    }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prevOverflow
      document.body.style.paddingRight = prevPadding
      window.removeEventListener('keydown', onKey)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expandedItem])

  // Hide the section entirely for visitors when there's nothing to show.
  // Authenticated admins still see it so they can open the editor.
  if (!items || (items.length === 0 && !isAuthenticated)) return null

  const multipleItems = items.length > 1
  const activeItem = items[activeIndex]
  const description = describeItem(activeItem)

  const handlePrev = () => {
    haptics.soft()
    play('page')
    step(-1)
  }

  const handleNext = () => {
    haptics.soft()
    play('page')
    step(1)
  }

  const togglePlay = () => {
    haptics.selection()
    play('toggle')
    setIsPlaying((v) => !v)
  }

  // Flick or drag past a short threshold moves one card, like the old swipe
  const handleDragEnd = (_: unknown, info: PanInfo) => {
    const { offset, velocity } = info
    if (offset.x < -40 || velocity.x < -350) handleNext()
    else if (offset.x > 40 || velocity.x > 350) handlePrev()
    // Cleared on the next tick so the click that follows pointerup — which
    // fires synchronously after this — is still treated as part of the drag.
    window.setTimeout(() => { isDragging.current = false }, 0)
  }

  const handleCardClick = (item: ShelfItem, index: number) => {
    if (isDragging.current) return
    if (index !== activeIndex) {
      haptics.soft()
      play('page')
      setActiveIndex(index)
      return
    }
    if (item.type === 'image') handleImageClick(item)
  }

  return (
    <section id="shelf" className={`section shelf-carousel-section stagger-in stagger-in-7 ${className || ''}`}>
      <div className="shelf-carousel-header">
        <h2 className="section-title">Shelf</h2>

        {items.length > 0 && (
          <div className="shelf-carousel-controls">
            {multipleItems && view === 'slideshow' && (
            <>
            <button
              type="button"
              className="shelf-carousel-ctrl shelf-carousel-step"
              onClick={handlePrev}
              aria-label="Previous slide"
              ref={cursorOriginRef}
            >
              <ChevronLeft />
            </button>
            <button
              type="button"
              className={`shelf-carousel-ctrl shelf-carousel-play ${isPlaying ? 'is-playing' : ''}`}
              onClick={togglePlay}
              aria-label={isPlaying ? 'Pause autoplay' : 'Play autoplay'}
              aria-pressed={!isPlaying}
            >
              <span
                key={activeIndex}
                className={`shelf-carousel-progress ${autoplayActive ? 'is-running' : ''}`}
                style={{ animationDuration: `${AUTOPLAY_DELAY}ms` }}
                aria-hidden="true"
              />
              <span className="shelf-carousel-ctrl-icon">
                <span
                  className={`shelf-icon-anim shelf-icon-anim-overlay ${isPlaying ? 'is-shown' : ''}`}
                  aria-hidden={!isPlaying}
                >
                  <PauseIcon />
                </span>
                <span
                  className={`shelf-icon-anim ${isPlaying ? '' : 'is-shown'}`}
                  aria-hidden={isPlaying}
                >
                  <PlayIcon />
                </span>
              </span>
            </button>
            <button
              type="button"
              className="shelf-carousel-ctrl shelf-carousel-step"
              onClick={handleNext}
              aria-label="Next slide"
              ref={cursorOriginRef}
            >
              <ChevronRight />
            </button>
            </>
            )}
            <button
              type="button"
              className="shelf-carousel-ctrl shelf-carousel-step shelf-carousel-view-toggle"
              onClick={toggleView}
              aria-label={view === 'slideshow' ? 'Gallery view' : 'Slideshow view'}
              aria-pressed={view === 'gallery'}
              ref={cursorOriginRef}
            >
              <span className="shelf-carousel-ctrl-icon">
                <span
                  className={`shelf-icon-anim shelf-icon-anim-overlay ${view === 'gallery' ? 'is-shown' : ''}`}
                  aria-hidden={view !== 'gallery'}
                >
                  <SlideshowViewIcon />
                </span>
                <span
                  className={`shelf-icon-anim ${view === 'gallery' ? '' : 'is-shown'}`}
                  aria-hidden={view === 'gallery'}
                >
                  <GalleryViewIcon />
                </span>
              </span>
            </button>
          </div>
        )}
      </div>

      {items.length === 0 ? (
        <div className="shelf-carousel-empty">
          Double-click here to add shelf items.
        </div>
      ) : view === 'gallery' ? (
      <div className="shelf-gallery">
        {items.map((item, i) => (
          <motion.div
            key={`gallery-${item._id}`}
            className={`shelf-gallery-item ${item.type === 'image' ? 'is-image' : ''}`}
            variants={galleryFadeInUp}
            initial="hidden"
            animate="visible"
            transition={{ duration: 0.4, delay: Math.min(i * 0.05, 0.6), ease: [0.23, 1, 0.32, 1] }}
            onClick={() => { if (item.type === 'image') handleImageClick(item) }}
          >
            <ShelfCarouselSlide
              item={item}
              isExpanded={expandedItem?._id === item._id || closingId === item._id}
            />
          </motion.div>
        ))}
      </div>
      ) : (
      <motion.div
        initial={{ opacity: 0, translateY: 16 }}
        whileInView={{ opacity: 1, translateY: 0 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
        className="shelf-carousel-wrapper"
      >
        <motion.div
          className="shelf-coverflow"
          drag={multipleItems ? 'x' : false}
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.12}
          onDragStart={() => { isDragging.current = true }}
          onDragEnd={handleDragEnd}
        >
          {items.map((item, i) => {
            // Shortest path around the loop, so cards never sweep the long
            // way when the index wraps past the end.
            let offset = i - activeIndex
            if (offset > count / 2) offset -= count
            if (offset < -count / 2) offset += count

            const absOffset = Math.abs(offset)
            const isActive = offset === 0
            // Cards two deep are invisible, which is also where the wrap
            // teleport happens — so the jump is never seen.
            const opacity = absOffset === 0 ? 1 : absOffset === 1 ? 0.7 : 0

            return (
              <motion.div
                key={item._id}
                className="shelf-card"
                initial={false}
                animate={{
                  x: `${offset * 42}%`,
                  rotateY: isActive ? 0 : offset < 0 ? 38 : -38,
                  z: isActive ? 50 : -absOffset * 60,
                  scale: isActive ? 1 : 1 - absOffset * 0.08,
                  opacity,
                }}
                transition={{ type: 'spring', stiffness: 200, damping: 25 }}
                style={{ zIndex: 100 - absOffset, pointerEvents: absOffset > 1 ? 'none' : 'auto' }}
                onClick={() => handleCardClick(item, i)}
              >
                <ShelfCarouselSlide
                  item={item}
                  isExpanded={expandedItem?._id === item._id || closingId === item._id}
                />
              </motion.div>
            )
          })}
        </motion.div>
      </motion.div>
      )}

      {items.length > 0 && view === 'slideshow' && (
      <div className="shelf-carousel-description" aria-live="polite">
        <AnimatePresence mode="wait" initial={false}>
          <motion.p
            key={activeItem?._id || activeIndex}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.18, ease: [0.23, 1, 0.32, 1] }}
          >
            {description || ' '}
          </motion.p>
        </AnimatePresence>
      </div>
      )}

      {createPortal(
        <AnimatePresence onExitComplete={() => setClosingId(null)}>
          {expandedItem && expandedItem.type === 'image' && expandedItem.url && [
            <motion.div
              key="shelf-expand-backdrop"
              className="shelf-expand-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, transition: { duration: 0.2, ease: [0.23, 1, 0.32, 1] } }}
              transition={{ duration: 0.28, ease: [0.23, 1, 0.32, 1] }}
              onClick={closeExpanded}
            />,
            <motion.img
              key="shelf-expand-image"
              layoutId={`shelf-img-${expandedItem._id}`}
              src={expandedItem.url}
              alt={expandedItem.caption || expandedItem.fileName || 'Shelf image'}
              className="shelf-expand-image"
              draggable={false}
              onClick={(e) => e.stopPropagation()}
              transition={{ type: 'spring', stiffness: 240, damping: 32 }}
              exit={{
                boxShadow: '0 24px 60px -16px rgba(0, 0, 0, 0)',
                transition: { type: 'spring', stiffness: 320, damping: 34 },
              }}
              // Un-hide the card the moment the return morph lands, while
              // the clone still covers it exactly — clearing on unmount
              // instead leaves a blank frame (the "blip").
              onLayoutAnimationComplete={() => setClosingId(null)}
            />,
            expandedItem.caption ? (
              <motion.p
                key="shelf-expand-caption"
                className="shelf-expand-caption"
                initial={{ opacity: 0, x: '-50%', y: 8 }}
                animate={{ opacity: 1, x: '-50%', y: 0 }}
                exit={{ opacity: 0, x: '-50%', y: 8 }}
                transition={{ duration: 0.18, delay: 0.05 }}
                onClick={(e) => e.stopPropagation()}
              >
                {expandedItem.caption}
              </motion.p>
            ) : null,
          ]}
        </AnimatePresence>,
        document.body,
      )}
    </section>
  )
}

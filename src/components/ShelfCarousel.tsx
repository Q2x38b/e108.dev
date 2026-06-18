import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Autoplay, EffectCards } from 'swiper/modules'
import { Swiper, SwiperSlide } from 'swiper/react'
import type { Swiper as SwiperType } from 'swiper'
import { useQuery } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { useHaptics } from '../hooks/useHaptics'
import { useAuth } from '../contexts/AuthContext'
import 'swiper/css'
import 'swiper/css/effect-cards'


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
  onImageClick,
  isExpanded,
}: {
  item: ShelfItem
  onImageClick?: (item: ShelfItem) => void
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
          onClick={(e) => {
            e.stopPropagation()
            onImageClick?.(item)
          }}
          style={{
            cursor: 'pointer',
            visibility: isExpanded ? 'hidden' : 'visible',
          }}
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

export function ShelfCarousel({ className }: { className?: string }) {
  const items = useQuery(api.shelf.list) as ShelfItem[] | undefined
  const haptics = useHaptics()
  const { isAuthenticated } = useAuth()
  const swiperRef = useRef<SwiperType | null>(null)
  const [activeIndex, setActiveIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(true)
  const [progress, setProgress] = useState(0)
  const [expandedItem, setExpandedItem] = useState<ShelfItem | null>(null)
  const wasPlayingBeforeExpand = useRef(false)

  const handleImageClick = (item: ShelfItem) => {
    haptics.selection()
    wasPlayingBeforeExpand.current = isPlaying
    if (swiperRef.current && isPlaying) {
      swiperRef.current.autoplay.stop()
    }
    setExpandedItem(item)
  }

  const closeExpanded = () => {
    haptics.soft()
    setExpandedItem(null)
    if (swiperRef.current && wasPlayingBeforeExpand.current) {
      swiperRef.current.autoplay.start()
    }
  }

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
    swiperRef.current?.slidePrev()
  }

  const handleNext = () => {
    haptics.soft()
    swiperRef.current?.slideNext()
  }

  const togglePlay = () => {
    haptics.selection()
    const swiper = swiperRef.current
    if (!swiper) return
    if (isPlaying) {
      swiper.autoplay.stop()
      setIsPlaying(false)
    } else {
      swiper.autoplay.start()
      setIsPlaying(true)
    }
  }

  return (
    <section id="shelf" className={`section shelf-carousel-section stagger-in stagger-in-7 ${className || ''}`}>
      <div className="shelf-carousel-header">
        <h2 className="section-title">Shelf</h2>

        {multipleItems && (
          <div className="shelf-carousel-controls">
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
                className="shelf-carousel-progress"
                style={{ transform: `scaleX(${progress})` }}
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
          </div>
        )}
      </div>

      {items.length === 0 ? (
        <div className="shelf-carousel-empty">
          Double-click here to add shelf items.
        </div>
      ) : (
      <motion.div
        initial={{ opacity: 0, translateY: 16 }}
        whileInView={{ opacity: 1, translateY: 0 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
        className="shelf-carousel-wrapper"
      >
        <Swiper
          grabCursor
          loop={items.length > 2}
          effect="cards"
          speed={650}
          cardsEffect={{
            slideShadows: false,
            perSlideOffset: 16,
            perSlideRotate: 3,
            rotate: true,
          }}
          modules={[Autoplay, EffectCards]}
          autoplay={multipleItems ? { delay: AUTOPLAY_DELAY, disableOnInteraction: false } : false}
          onSwiper={(s) => { swiperRef.current = s }}
          onSlideChange={(s) => {
            setActiveIndex(s.realIndex)
            setProgress(0)
          }}
          onAutoplayTimeLeft={(_s, _time, p) => {
            // Swiper provides p going from 1 → 0 over the delay.
            // Store as elapsed (0 → 1) so the bar fills left-to-right.
            setProgress(1 - p)
          }}
          onAutoplayStop={() => setProgress(0)}
          className="shelf-carousel"
        >
          {items.map((item) => (
            <SwiperSlide key={item._id} className="shelf-carousel-swiper-slide">
              <ShelfCarouselSlide
                item={item}
                onImageClick={handleImageClick}
                isExpanded={expandedItem?._id === item._id}
              />
            </SwiperSlide>
          ))}
        </Swiper>
      </motion.div>
      )}

      {items.length > 0 && (
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
        <AnimatePresence>
          {expandedItem && expandedItem.type === 'image' && expandedItem.url && [
            <motion.div
              key="shelf-expand-backdrop"
              className="shelf-expand-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
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

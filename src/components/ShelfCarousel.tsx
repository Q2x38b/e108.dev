import { motion } from 'framer-motion'
import { Autoplay, EffectCards, Pagination } from 'swiper/modules'
import { Swiper, SwiperSlide } from 'swiper/react'
import { useQuery } from 'convex/react'
import { api } from '../../convex/_generated/api'
import 'swiper/css'
import 'swiper/css/effect-cards'
import 'swiper/css/pagination'

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

function ShelfCarouselSlide({ item }: { item: ShelfItem }) {
  if (item.type === 'image' && item.url) {
    return (
      <div className="shelf-carousel-slide shelf-carousel-slide-image">
        <img
          src={item.url}
          alt={item.caption || item.fileName || 'Shelf image'}
          draggable={false}
        />
        {item.caption && (
          <span className="shelf-carousel-caption">{item.caption}</span>
        )}
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
            <div className="shelf-carousel-quote-bar-content">
              <blockquote>"{item.quoteText}"</blockquote>
              {(item.quoteAuthor || item.quoteSource) && (
                <cite>
                  {item.quoteAuthor && <span className="quote-author">— {item.quoteAuthor}</span>}
                  {item.quoteSource && <span className="quote-source">{item.quoteSource}</span>}
                </cite>
              )}
            </div>
          </div>
        ) : (
          <>
            <svg className="shelf-carousel-quote-icon" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M4.583 17.321C3.553 16.227 3 15 3 13.011c0-3.5 2.457-6.637 6.03-8.188l.893 1.378c-3.335 1.804-3.987 4.145-4.247 5.621.537-.278 1.24-.375 1.929-.311 1.804.167 3.226 1.648 3.226 3.489a3.5 3.5 0 01-3.5 3.5c-1.073 0-2.099-.49-2.748-1.179zm10 0C13.553 16.227 13 15 13 13.011c0-3.5 2.457-6.637 6.03-8.188l.893 1.378c-3.335 1.804-3.987 4.145-4.247 5.621.537-.278 1.24-.375 1.929-.311 1.804.167 3.226 1.648 3.226 3.489a3.5 3.5 0 01-3.5 3.5c-1.073 0-2.099-.49-2.748-1.179z" />
            </svg>
            <blockquote>{item.quoteText}</blockquote>
            {(item.quoteAuthor || item.quoteSource) && (
              <cite>
                {item.quoteAuthor && <span className="quote-author">— {item.quoteAuthor}</span>}
                {item.quoteSource && <span className="quote-source">{item.quoteSource}</span>}
              </cite>
            )}
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
        {item.textLabel && (
          <span className="shelf-carousel-text-label">{item.textLabel}</span>
        )}
        <p>{item.textContent}</p>
      </div>
    )
  }

  return null
}

export function ShelfCarousel({ className }: { className?: string }) {
  const items = useQuery(api.shelf.list) as ShelfItem[] | undefined

  if (!items || items.length === 0) return null

  return (
    <section id="shelf" className={`section shelf-carousel-section stagger-in stagger-in-7 ${className || ''}`}>
      <h2 className="section-title section-title-with-icon">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2">
          <path d="M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V7a1 1 0 0 1 1-1 2 2 0 0 0 0-4H8a2 2 0 0 0 0 4 1 1 0 0 1 1 1z" fill="currentColor" />
          <path d="M12 17v5" />
        </svg>
        Shelf
      </h2>

      <motion.div
        initial={{ opacity: 0, translateY: 16 }}
        whileInView={{ opacity: 1, translateY: 0 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
        className="shelf-carousel-wrapper"
      >
        <Swiper
          effect="cards"
          grabCursor
          loop={items.length > 2}
          modules={[EffectCards, Autoplay, Pagination]}
          pagination={{ clickable: true }}
          className="shelf-carousel"
          cardsEffect={{
            slideShadows: false,
            perSlideOffset: 8,
            perSlideRotate: 2,
          }}
        >
          {items.map((item) => (
            <SwiperSlide key={item._id} className="shelf-carousel-swiper-slide">
              <ShelfCarouselSlide item={item} />
            </SwiperSlide>
          ))}
        </Swiper>
      </motion.div>
    </section>
  )
}

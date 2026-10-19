import { Link } from 'react-router-dom'
import { Footer } from '../components/Footer'
import { useHaptics } from '../hooks/useHaptics'
import { Logotype, Mark, Construction, ClearSpace } from '../brand/logotype'

// Same cursor-origin hover as the blog back button
function setCursorOrigin(el: HTMLElement, e: PointerEvent) {
  const { top, left } = el.getBoundingClientRect()
  el.style.setProperty('--x', `${e.clientX - left}px`)
  el.style.setProperty('--y', `${e.clientY - top}px`)
}

function cursorOriginRef(el: HTMLElement | null) {
  if (!el) return
  el.addEventListener('pointerenter', (e) => setCursorOrigin(el, e))
  el.addEventListener('pointerleave', (e) => setCursorOrigin(el, e))
}

// Set like the NASA colour blocks: the specs printed on the colour itself
const COLORS = [
  { name: 'Paper', hex: '#FDFDFC', rgb: '253 253 252', cmyk: '0/0/0/1', dark: false },
  { name: 'Ink', hex: '#171717', rgb: '23 23 23', cmyk: '0/0/0/91', dark: true },
  { name: 'Signal', hex: '#3B82F6', rgb: '59 130 246', cmyk: '76/47/0/4', dark: true },
  { name: 'Fog', hex: '#E5E5E5', rgb: '229 229 229', cmyk: '0/0/0/10', dark: false },
  { name: 'Night', hex: '#141414', rgb: '20 20 20', cmyk: '0/0/0/92', dark: true },
  { name: 'Mist', hex: '#A3A3A3', rgb: '163 163 163', cmyk: '0/0/0/36', dark: false },
]

const FILES = [
  { name: 'Logotype', file: '/brand/e108-logotype.svg' },
  { name: 'Mark', file: '/brand/e108-mark.svg' },
  { name: 'Lockup', file: '/brand/e108-lockup.svg' },
]

export default function Brand() {
  const haptics = useHaptics()

  return (
    <div className="brand-layout">
      <header className="blog-header stagger-in stagger-in-1">
        <Link to="/" className="blog-back-btn" aria-label="Back to home" draggable={false} onClick={() => haptics.soft()} ref={cursorOriginRef}>
          <svg aria-hidden="true" fill="none" height="20" viewBox="0 0 24 24" width="20" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M9.70711 4.70711C10.0976 4.31658 10.0976 3.68342 9.70711 3.29289C9.31658 2.90237 8.68342 2.90237 8.29289 3.29289L3.29289 8.29289C2.90237 8.68342 2.90237 9.31658 3.29289 9.70711L8.29289 14.7071C8.68342 15.0976 9.31658 15.0976 9.70711 14.7071C10.0976 14.3166 10.0976 13.6834 9.70711 13.2929L6.41421 10H10.4C12.0967 10 13.309 10.0008 14.2594 10.0784C15.198 10.1551 15.7927 10.3018 16.27 10.545C17.2108 11.0243 17.9757 11.7892 18.455 12.73C18.6982 13.2073 18.8449 13.802 18.9216 14.7406C18.9992 15.691 19 16.9033 19 18.6V20C19 20.5523 19.4477 21 20 21C20.5523 21 21 20.5523 21 20V18.5556C21 16.913 21 15.6191 20.9149 14.5778C20.8281 13.5154 20.6478 12.6283 20.237 11.8221C19.5659 10.5049 18.4951 9.43407 17.1779 8.76295C16.3717 8.35217 15.4846 8.17186 14.4222 8.08507C13.3809 7.99999 12.087 7.99999 10.4444 8L6.41421 8L9.70711 4.70711Z"
              fill="currentColor"
            />
          </svg>
          <span>Back</span>
        </Link>
      </header>

      {/* Cover, after the 1976 manual: two columns of small type, then the word */}
      <section className="brand-cover stagger-in stagger-in-2" aria-label="Cover">
        <div className="brand-cover-meta">
          <span>
            e108
            <br />
            Ethan Jerla
          </span>
          <span>
            Graphics Standards
            <br />
            Edition 1, 2026
          </span>
        </div>
        <Logotype height="auto" className="brand-cover-logo" title="e108 logotype" />
      </section>

      <main className="brand-main stagger-in stagger-in-3">
        <section className="brand-section" id="mark">
          <h2 className="brand-h">The mark</h2>
          <p>
            Three bars, the last one rising: an E with the spine removed. It is the favicon, the avatar,
            and everything under 24px.
          </p>
          <div className="brand-row">
            <figure className="brand-cell brand-cell--paper"><Mark height="auto" /><figcaption>Ink on Paper</figcaption></figure>
            <figure className="brand-cell brand-cell--night"><Mark height="auto" /><figcaption>Fog on Night</figcaption></figure>
            <figure className="brand-cell brand-cell--signal-paper"><Mark height="auto" /><figcaption>Signal on Paper</figcaption></figure>
            <figure className="brand-cell brand-cell--signal"><Mark height="auto" /><figcaption>Paper on Signal</figcaption></figure>
          </div>
        </section>

        <section className="brand-section" id="logotype">
          <h2 className="brand-h">The logotype</h2>
          <p>
            Four letters drawn as one ribbon of equal weight. Straight runs and half-circle turns, nothing
            else. Use it large. Show it in Ink, Fog or Paper on Paper, Mist, Night or Signal, and keep
            one ribbon width (W) clear on every side.
          </p>
          <div className="brand-quad">
            <div className="brand-quad-cell brand-quad-cell--paper">
              <ClearSpace />
              <span className="brand-quad-label">Protected space</span>
            </div>
            <div className="brand-quad-cell brand-quad-cell--mist"><Logotype height="auto" /></div>
            <div className="brand-quad-cell brand-quad-cell--night"><Logotype height="auto" /></div>
            <div className="brand-quad-cell brand-quad-cell--signal"><Logotype height="auto" /></div>
          </div>
        </section>

        <section className="brand-section" id="construction">
          <h2 className="brand-h">Construction</h2>
          <p>
            Cap height 100, ribbon 17, round ends. Every turn is a half circle as wide as the gap it
            bridges. Letters sit one ribbon apart; the e and 1 four closer. Never retype it: it is not
            a font.
          </p>
          <figure className="brand-figure">
            <Construction />
          </figure>
        </section>

        <section className="brand-section" id="color">
          <h2 className="brand-h">Colour</h2>
          <div className="brand-colors">
            {COLORS.map((c) => (
              <div className={`brand-color ${c.dark ? 'is-dark' : ''}`} key={c.name} style={{ background: c.hex }}>
                <div className="brand-color-name">{c.name}</div>
                <dl>
                  <div><dt>RGB</dt><dd>{c.rgb}</dd></div>
                  <div><dt>HEX</dt><dd>{c.hex}</dd></div>
                  <div><dt>CMYK</dt><dd>{c.cmyk}</dd></div>
                </dl>
              </div>
            ))}
          </div>
          <p className="brand-caption">
            Paper and Night are the grounds. Ink and Fog go on them. Signal is for one thing on a page,
            and turns to #60A5FA on Night.
          </p>
        </section>

        <section className="brand-section" id="type">
          <h2 className="brand-h">Typography</h2>
          <div className="brand-type">
            <div className="brand-type-row">
              <span className="brand-type-label">Inter</span>
              <span className="brand-type-sample">
                <strong>Everything that is read.</strong> 500 for titles, 400 for body at 15–16px and 1.55,
                460 for labels. Tabular figures in columns.
              </span>
            </div>
            <div className="brand-type-row">
              <span className="brand-type-label">Cormorant Garamond</span>
              <span className="brand-type-sample brand-type-sample--quote">“The only limit is yourself”</span>
            </div>
          </div>
        </section>

        <section className="brand-section brand-section--files" id="files">
          <h2 className="brand-h">Files</h2>
          <div className="brand-files">
            {FILES.map((f) => (
              <a key={f.file} href={f.file} download onClick={() => haptics.soft()}>
                {f.name} <span>SVG</span>
              </a>
            ))}
          </div>
        </section>
      </main>

      <Footer showQuote={false} />
    </div>
  )
}

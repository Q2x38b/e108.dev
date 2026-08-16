import { useEffect, useRef } from 'react'

// Replaces the native pointer with a custom arrow on fine-pointer devices.
// Position is written straight to the element's transform once per frame —
// no React state — so tracking stays glued to the pointer with zero lag.
export function CustomCursor() {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    // Touch / coarse pointers never show a cursor — leave them alone.
    const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)')
    if (!finePointer.matches) return

    // Only hide the native cursor once we know we can draw a replacement,
    // so a JS failure never leaves the page with no cursor at all.
    const root = document.documentElement
    root.classList.add('custom-cursor-active')

    let frame = 0
    let x = 0
    let y = 0

    const paint = () => {
      frame = 0
      el.style.transform = `translate3d(${x}px, ${y}px, 0)`
    }

    const handleMove = (e: PointerEvent) => {
      x = e.clientX
      y = e.clientY
      if (!frame) frame = requestAnimationFrame(paint)

      // Text fields keep their native I-beam; ours would hide the caret hint.
      const overText = (e.target as Element | null)?.closest?.(
        'input, textarea, [contenteditable="true"]'
      )
      el.classList.toggle('is-over-text', !!overText)
      el.classList.add('is-visible')
    }

    const hide = () => el.classList.remove('is-visible')
    const press = () => el.classList.add('is-pressed')
    const release = () => el.classList.remove('is-pressed')

    window.addEventListener('pointermove', handleMove, { passive: true })
    window.addEventListener('pointerdown', press, { passive: true })
    window.addEventListener('pointerup', release, { passive: true })
    document.addEventListener('mouseleave', hide)
    window.addEventListener('blur', hide)

    return () => {
      root.classList.remove('custom-cursor-active')
      if (frame) cancelAnimationFrame(frame)
      window.removeEventListener('pointermove', handleMove)
      window.removeEventListener('pointerdown', press)
      window.removeEventListener('pointerup', release)
      document.removeEventListener('mouseleave', hide)
      window.removeEventListener('blur', hide)
    }
  }, [])

  return (
    <div className="custom-cursor" ref={ref} aria-hidden="true">
      <svg width="15" height="16" viewBox="0 0 15 16" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M0.338352 4.75957C0.0106866 2.65778 -0.153146 1.60689 0.193613 0.999104C0.495194 0.470506 1.02105 0.107981 1.62234 0.0141302C2.31372 -0.0937799 3.23762 0.433117 5.08543 1.48691L11.2439 4.99903C13.2084 6.11941 14.1907 6.6796 14.4626 7.17871C14.9412 8.05739 14.6968 9.15455 13.8905 9.74704C13.4325 10.0836 12.3054 10.1739 10.051 10.3546L9.86604 10.3694C9.29666 10.4151 9.01197 10.4379 8.75387 10.5059C8.05347 10.6903 7.44343 11.1218 7.03636 11.7209C6.88636 11.9416 6.77006 12.2025 6.53746 12.7242C5.81093 14.3538 5.44766 15.1686 5.12479 15.4553C4.21211 16.2657 2.79262 16.0767 2.12379 15.0557C1.88719 14.6945 1.74977 13.813 1.47494 12.0501L0.338352 4.75957Z" fill="var(--cursor-color)" />
      </svg>
    </div>
  )
}

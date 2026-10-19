// e108 identity primitives.
//
// The logotype is four hand-drawn glyphs, not a typeface. Each is a centerline
// path on a 100-unit cap height stroked with one 17-unit ribbon (round caps
// and joins), built the way the NASA worm is: straight runs, and 180° turns
// whose diameter is the distance between the strokes they join. Rendering as
// strokes keeps the weight uniform at any size and lets colour follow
// currentColor.

export const CAP = 100
export const STROKE = 17
export const LOGOTYPE_WIDTH = 338

export const GLYPHS = [
  // Mid bar, tight turn up and over, the long way round the left, along the
  // bottom, terminal lifting 45°
  {
    char: 'e',
    x: 0,
    width: 100,
    d: 'M 8.5 50 H 70.75 A 20.75 20.75 0 0 0 70.75 8.5 H 50 A 41.5 41.5 0 0 0 50 91.5 H 70.75 A 20.75 20.75 0 0 0 85.42 85.42',
  },
  // Stem with a 45° flag
  { char: '1', x: 113, width: 43, d: 'M 10.5 32.5 L 34.5 8.5 V 91.5' },
  // Pill: straight sides, half-circle ends
  { char: '0', x: 173, width: 72, d: 'M 8.5 36 A 27.5 27.5 0 0 1 63.5 36 V 64 A 27.5 27.5 0 0 1 8.5 64 Z' },
  // Two slots on a shared waist, the upper one narrower
  {
    char: '8',
    x: 262,
    width: 76,
    d: 'M 34.25 8.5 H 41.75 A 20.75 20.75 0 0 1 41.75 50 H 34.25 A 20.75 20.75 0 0 1 34.25 8.5 Z M 29.25 50 H 46.75 A 20.75 20.75 0 0 1 46.75 91.5 H 29.25 A 20.75 20.75 0 0 1 29.25 50 Z',
  },
] as const

// The Rising Hook: three bars, the last curving up. Same geometry as the favicon.
export const MARK_STROKE = 14
export const MARK_PATHS = ['M24 28H54', 'M24 50H54', 'M24 72H62C70 72 76 66 76 56'] as const
// Ink bounds of the mark on its 100 grid (stroke included)
const MARK_INK = { x: 17, y: 21, w: 66, h: 58 }

type SvgProps = Omit<React.SVGProps<SVGSVGElement>, 'height' | 'width'> & {
  height?: number | string
  title?: string
}

export function LogotypePaths() {
  return (
    <g fill="none" stroke="currentColor" strokeWidth={STROKE} strokeLinecap="round" strokeLinejoin="round">
      {GLYPHS.map((g) => (
        <path key={g.char} data-glyph={g.char} transform={`translate(${g.x} 0)`} d={g.d} />
      ))}
    </g>
  )
}

export function Logotype({ height = 32, title = 'e108', ...rest }: SvgProps) {
  return (
    <svg
      viewBox={`0 0 ${LOGOTYPE_WIDTH} ${CAP}`}
      height={height}
      width={typeof height === 'number' ? (height * LOGOTYPE_WIDTH) / CAP : undefined}
      role="img"
      aria-label={title}
      {...rest}
    >
      <LogotypePaths />
    </svg>
  )
}

export function MarkPaths({ strokeWidth = MARK_STROKE }: { strokeWidth?: number }) {
  return (
    <g fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      {MARK_PATHS.map((d) => (
        <path key={d} d={d} />
      ))}
    </g>
  )
}

export function Mark({ height = 32, title = 'e108 mark', ...rest }: SvgProps) {
  return (
    <svg viewBox="0 0 100 100" height={height} width={height} role="img" aria-label={title} {...rest}>
      <MarkPaths />
    </svg>
  )
}

// Mark beside logotype. The mark is scaled so its 14-unit stroke matches the
// ribbon, centred on the cap height, a stroke and a half before the word.
const LOCK_SCALE = STROKE / MARK_STROKE
const LOCK_MARK_W = MARK_INK.w * LOCK_SCALE
const LOCK_MARK_H = MARK_INK.h * LOCK_SCALE
const LOCK_GAP = STROKE * 1.5
export const LOCKUP_WIDTH = Math.round(LOCK_MARK_W + LOCK_GAP + LOGOTYPE_WIDTH)

export function Lockup({ height = 32, title = 'e108', ...rest }: SvgProps) {
  const tx = -MARK_INK.x * LOCK_SCALE
  const ty = (CAP - LOCK_MARK_H) / 2 - MARK_INK.y * LOCK_SCALE
  return (
    <svg
      viewBox={`0 0 ${LOCKUP_WIDTH} ${CAP}`}
      height={height}
      width={typeof height === 'number' ? (height * LOCKUP_WIDTH) / CAP : undefined}
      role="img"
      aria-label={title}
      {...rest}
    >
      <g transform={`translate(${tx.toFixed(2)} ${ty.toFixed(2)}) scale(${LOCK_SCALE.toFixed(4)})`}>
        <MarkPaths />
      </g>
      <g transform={`translate(${(LOCK_MARK_W + LOCK_GAP).toFixed(2)} 0)`}>
        <LogotypePaths />
      </g>
    </svg>
  )
}

// Drawing guides: the ribbon ghosted, centerlines in Signal, the half circles
// every turn is swung from, and the cap height and ribbon dimensioned.
export function Construction(props: React.SVGProps<SVGSVGElement>) {
  const guide = { fill: 'none', stroke: 'currentColor', strokeWidth: 0.6, opacity: 0.35 } as const
  const dashed = { ...guide, strokeDasharray: '2 2' } as const
  const label = { fontSize: 6.5, fill: 'currentColor', opacity: 0.6 } as const
  const h = STROKE / 2
  return (
    <svg viewBox="-34 -22 406 148" role="img" aria-label="Construction of the e108 logotype" {...props}>
      <g opacity={0.1}>
        <LogotypePaths />
      </g>
      {[0, h, 50, CAP - h, CAP].map((y) => (
        <line key={y} x1={-10} x2={LOGOTYPE_WIDTH + 10} y1={y} y2={y} {...(y === 0 || y === CAP ? guide : dashed)} />
      ))}
      {GLYPHS.map((g) => (
        <rect key={g.char} x={g.x} y={0} width={g.width} height={CAP} {...dashed} />
      ))}
      <g {...guide} strokeDasharray="1.5 2.5">
        {/* e */}
        <circle cx={70.75} cy={29.25} r={20.75} />
        <circle cx={50} cy={50} r={41.5} />
        <circle cx={70.75} cy={70.75} r={20.75} />
        {/* 0 */}
        <circle cx={173 + 36} cy={36} r={27.5} />
        <circle cx={173 + 36} cy={64} r={27.5} />
        {/* 8 */}
        <circle cx={262 + 34.25} cy={29.25} r={20.75} />
        <circle cx={262 + 41.75} cy={29.25} r={20.75} />
        <circle cx={262 + 29.25} cy={70.75} r={20.75} />
        <circle cx={262 + 46.75} cy={70.75} r={20.75} />
      </g>
      <g fill="none" stroke="var(--accent-color, #3b82f6)" strokeWidth={0.9} strokeLinecap="round" strokeLinejoin="round">
        {GLYPHS.map((g) => (
          <path key={g.char} transform={`translate(${g.x} 0)`} d={g.d} />
        ))}
      </g>
      <g {...guide}>
        <line x1={-20} x2={-20} y1={0} y2={CAP} />
        <line x1={-23} x2={-17} y1={0} y2={0} />
        <line x1={-23} x2={-17} y1={CAP} y2={CAP} />
        <line x1={LOGOTYPE_WIDTH + 20} x2={LOGOTYPE_WIDTH + 20} y1={0} y2={STROKE} />
        <line x1={LOGOTYPE_WIDTH + 17} x2={LOGOTYPE_WIDTH + 23} y1={0} y2={0} />
        <line x1={LOGOTYPE_WIDTH + 17} x2={LOGOTYPE_WIDTH + 23} y1={STROKE} y2={STROKE} />
        <line x1={100} x2={113} y1={110} y2={110} />
        <line x1={100} x2={100} y1={107} y2={113} />
        <line x1={113} x2={113} y1={107} y2={113} />
      </g>
      <text x={-24} y={52} textAnchor="end" {...label}>100</text>
      <text x={LOGOTYPE_WIDTH + 26} y={11} {...label}>17</text>
      <text x={106.5} y={121} textAnchor="middle" {...label}>13</text>
      <text x={50} y={-8} textAnchor="middle" {...label}>r 20.75 · r 41.5</text>
      <text x={173 + 36} y={-8} textAnchor="middle" {...label}>r 27.5</text>
      <text x={262 + 38} y={-8} textAnchor="middle" {...label}>r 20.75</text>
    </svg>
  )
}

// Protected space: one stroke on every side, never less. Drawn the way the
// NASA manual draws it, with the dimension marked W.
export function ClearSpace(props: React.SVGProps<SVGSVGElement>) {
  const s = STROKE
  const guide = { fill: 'none', stroke: 'var(--accent-color, #3b82f6)', strokeWidth: 0.6, opacity: 0.7 } as const
  const label = { fontSize: 6, fill: 'var(--accent-color, #3b82f6)' } as const
  const tick = { stroke: 'var(--accent-color, #3b82f6)', strokeWidth: 0.6 } as const
  return (
    <svg viewBox={`${-s - 12} ${-s - 12} ${LOGOTYPE_WIDTH + 2 * s + 24} ${CAP + 2 * s + 24}`} role="img" aria-label="Protected space around the logotype" {...props}>
      <rect x={-s} y={-s} width={LOGOTYPE_WIDTH + 2 * s} height={CAP + 2 * s} {...guide} />
      <rect x={0} y={0} width={LOGOTYPE_WIDTH} height={CAP} {...guide} strokeDasharray="1.5 1.5" />
      <LogotypePaths />
      {/* W: top-left corner, horizontal */}
      <g {...tick}>
        <line x1={-s} x2={0} y1={-s - 6} y2={-s - 6} />
        <line x1={-s} x2={-s} y1={-s - 8} y2={-s - 4} />
        <line x1={0} x2={0} y1={-s - 8} y2={-s - 4} />
        <line x1={-s - 6} x2={-s - 6} y1={-s} y2={0} />
        <line x1={-s - 8} x2={-s - 4} y1={-s} y2={-s} />
        <line x1={-s - 8} x2={-s - 4} y1={0} y2={0} />
      </g>
      <text x={-s / 2} y={-s - 8.5} textAnchor="middle" {...label}>W</text>
      <text x={-s - 8.5} y={-s / 2 + 2} textAnchor="end" {...label}>W</text>
    </svg>
  )
}

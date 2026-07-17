// Progressive bottom-of-page blur: eight stacked backdrop-filter layers,
// each masked to a horizontal band, so the blur ramps smoothly from 0.5px
// at the top of the strip to 16px at the viewport edge.
const LAYERS: { blur: number; stops: number[] }[] = [
  { blur: 0.5, stops: [0, 12.5, 25, 37.5] },
  { blur: 1, stops: [12.5, 25, 37.5, 50] },
  { blur: 2, stops: [25, 37.5, 50, 62.5] },
  { blur: 3, stops: [37.5, 50, 62.5, 75] },
  { blur: 5, stops: [50, 62.5, 75, 87.5] },
  { blur: 8, stops: [62.5, 75, 87.5, 100] },
  { blur: 12, stops: [75, 87.5, 100, 112.5] },
  { blur: 16, stops: [87.5, 100] },
]

function maskFor(stops: number[]): string {
  if (stops.length === 2) {
    return `linear-gradient(to bottom, rgba(0,0,0,0) ${stops[0]}%, rgba(0,0,0,1) ${stops[1]}%)`
  }
  const [a, b, c, d] = stops
  return `linear-gradient(to bottom, rgba(0,0,0,0) ${a}%, rgba(0,0,0,1) ${b}%, rgba(0,0,0,1) ${c}%, rgba(0,0,0,0) ${d}%)`
}

export function BottomBlur() {
  return (
    <div className="bottom-page-blur" aria-hidden="true">
      {LAYERS.map((layer, i) => (
        <div
          key={layer.blur}
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: i + 1,
            backdropFilter: `blur(${layer.blur}px)`,
            WebkitBackdropFilter: `blur(${layer.blur}px)`,
            maskImage: maskFor(layer.stops),
            WebkitMaskImage: maskFor(layer.stops),
          }}
        />
      ))}
    </div>
  )
}

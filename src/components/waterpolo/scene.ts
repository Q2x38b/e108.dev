// Pixel-art water polo pool, drawn into a raw RGBA buffer.
//
// Front-on three-quarter view: the long sides of the pool run straight across
// the screen, the short ends straight up and down, and depth (v) is
// foreshortened vertically. Goals are seen side-on, so their side nets carry
// their shape. The floor
// is classified per pixel from world coordinates (grass, deck, coping, wall,
// water, float lines); goals, players and the ball are drawn on top in depth
// order. Pure function of (time, play head), so the same code renders
// frames in the browser and in tests.

export const W = 212
export const H = 94
export const LOOP = 7 // seconds for each half of the cycle: up the pool, then back

const OX = 26
const OY = 32
const PU = 72 // pool length (u)
const PV = 42 // pool width (v)
const SX = 2.2 // screen px per unit along the pool
const SY = 1.05 // screen px per unit of depth
const SH = 0 // rightward lean per unit of depth; 0 keeps the short ends vertical
const COPING = 1.6
const DECK = 5.5
const GRASS = 3.6

type RGB = readonly [number, number, number]

const hex = (h: string): RGB => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)]

const C = {
  grass: [hex('#4e6b33'), hex('#5a7a3a'), hex('#6b8f45'), hex('#7fa354')],
  dirt: hex('#8a6a48'),
  deck: hex('#cdbfa2'),
  deckDark: hex('#b9aa8b'),
  deckLine: hex('#a8987a'),
  coping: hex('#ece8de'),
  lip: hex('#c9c4b6'),
  wall: hex('#6fb6d6'),
  wallLine: hex('#5aa2c4'),
  water: [hex('#2a78ab'), hex('#3089c0'), hex('#4199ce')],
  waterLight: hex('#6dbbe2'),
  sparkle: hex('#d9f2fb'),
  foam: hex('#a9dcef'),
  foamWhite: hex('#eef8fc'),
  shade: hex('#22618d'),
  ropeRed: [hex('#e0473b'), hex('#a8291f')],
  ropeYellow: [hex('#f6cf2a'), hex('#c99c10')],
  ropeGreen: [hex('#2f7a45'), hex('#1d4f2c')],
  markerRed: hex('#d8382d'),
  markerYellow: hex('#f2c51c'),
  markerWhite: hex('#f4f4f2'),
  ropeWhite: [hex('#f4f4f2'), hex('#c3c8cc')],
  post: hex('#f7f7f5'),
  postShade: hex('#c9cdd0'),
  net: hex('#eef1f3'),
  frame: hex('#d4d8dc'),
  frameShade: hex('#9ea5ac'),
  float: hex('#25282c'),
  floatLight: hex('#41474e'),
  skin: hex('#d9a27a'),
  skinDark: hex('#b07a55'),
  skinLight: hex('#ecbd96'),
  capWhite: hex('#f4f4f2'),
  capWhiteShade: hex('#c8cbd0'),
  capBlue: hex('#2a4796'),
  capBlueShade: hex('#1c3270'),
  capRed: hex('#c43a2f'),
  capRedShade: hex('#932920'),
  ball: hex('#f5cf1f'),
  ballLight: hex('#fff3a6'),
  ballShade: hex('#d6a515'),
  ballSeam: hex('#2a2112'),
  ballLine: hex('#141414'),
  outline: hex('#1b2a36'),
} as const

function hash(x: number, y: number): number {
  let h = Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263)
  h = Math.imul(h ^ (h >>> 13), 1274126177)
  return ((h ^ (h >>> 16)) >>> 0) / 4294967295
}

const proj = (u: number, v: number): [number, number] => [OX + u * SX + (PV - v) * SH, OY + v * SY]

class Canvas {
  buf: Uint8ClampedArray
  constructor(buf: Uint8ClampedArray) {
    this.buf = buf
  }
  px(x: number, y: number, c: RGB) {
    x = Math.round(x)
    y = Math.round(y)
    if (x < 0 || y < 0 || x >= W || y >= H) return
    const i = (y * W + x) * 4
    this.buf[i] = c[0]
    this.buf[i + 1] = c[1]
    this.buf[i + 2] = c[2]
    this.buf[i + 3] = 255
  }
  // Dims whatever is already there, so shadows keep the texture under them
  darken(x: number, y: number, k = 0.7) {
    x = Math.round(x)
    y = Math.round(y)
    if (x < 0 || y < 0 || x >= W || y >= H) return
    const i = (y * W + x) * 4
    if (this.buf[i + 3] === 0) return
    this.buf[i] *= k
    this.buf[i + 1] *= k
    this.buf[i + 2] *= k
  }
  line(x0: number, y0: number, x1: number, y1: number, c: RGB, every = 1) {
    const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1)
    for (let i = 0; i <= n; i += every) this.px(x0 + ((x1 - x0) * i) / n, y0 + ((y1 - y0) * i) / n, c)
  }
}

// ── Floor ───────────────────────────────────────────────────────────────
function floor(cv: Canvas, time: number) {
  const inner = COPING + DECK
  // Grass is measured in screen pixels so it is as wide along the long sides
  // as at the short ends, where a world unit is wider on screen
  const grassPx = GRASS * SX
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const v = (y + 0.5 - OY) / SY
      const u = (x + 0.5 - OX - (PV - v) * SH) / SX
      // How far outside the pool rectangle, in world units
      const outU = Math.max(-u, u - PU)
      const outV = Math.max(-v, v - PV)
      const out = Math.max(outU, outV)
      const n = hash(x, y)
      if (out > inner) {
        const g = Math.max((outU - inner) * SX, (outV - inner) * SY) // px into the grass
        if (g > grassPx - 2.6 + n * 4) continue // fuzzy grass edge
        if (g > 1.1) {
          const k = Math.min(3, Math.floor(n * 3.2 + (hash(x >> 1, y >> 1) > 0.7 ? 1 : 0)))
          cv.px(x, y, C.grass[k])
        } else {
          cv.px(x, y, n > 0.25 ? C.dirt : C.grass[1])
        }
        continue
      }
      if (out > COPING) {
        const tu = ((u % 4) + 4) % 4
        const tv = ((v % 4) + 4) % 4
        const grout = tu < 0.46 || tv < 0.96
        cv.px(x, y, grout ? C.deckLine : n > 0.82 ? C.deckDark : C.deck)
        continue
      }
      if (out > 0) {
        cv.px(x, y, out < 0.5 ? C.lip : C.coping)
        continue
      }
      // Inner face of the far wall shows below its edge
      if (v < 2.6) {
        const along = u
        cv.px(x, y, ((along % 3) + 3) % 3 < 0.46 ? C.wallLine : C.wall)
        continue
      }
      // Water, in two layers.
      // 1. Colour: three slow waves running in different directions at
      //    different speeds, so lighter and deeper patches drift past each
      //    other. Banded and dithered into the four water tones.
      const w =
        Math.sin(u * 0.4 + time * 0.9) +
        Math.sin(v * 0.55 - time * 0.65) +
        Math.sin((u + v) * 0.24 + time * 0.45)
      const checker = (x + y) & 1
      let tone = 1
      if (w > 2.1) tone = checker ? 3 : 2
      else if (w > 1.25) tone = 2
      else if (w < -2.0) tone = 0
      else if (w < -1.35) tone = checker ? 0 : 1
      // 2. Light: the pool floor's caustic net, two warped sine grids whose
      //    zero crossings light up as thin wobbly lines, one tone brighter.
      const ca = u * 0.6 + 0.8 * Math.sin(v * 0.45 + time * 0.6)
      const cb = v * 0.62 + 0.8 * Math.sin(u * 0.3 - time * 0.5)
      const net = Math.max(1 - Math.abs(Math.sin(ca)), 1 - Math.abs(Math.sin(cb)))
      if (net > 0.94) tone = Math.min(3, tone + 1)
      let c: RGB = tone === 3 ? C.waterLight : C.water[tone]
      // Rare surface glints, on the net lines only
      if (net > 0.94 && hash(x + 7, y * 13 + Math.floor(time * 2)) > 0.985) c = C.sparkle
      // Faint shadow along the far walls
      if (v < 4.5) c = checker ? C.shade : c
      cv.px(x, y, c)
    }
  }
  // Field ropes along both long sides, wall to wall: ribbed tubes coloured
  // red from the wall to 2 m out from the goal line, yellow to 6 m, green to
  // halfway, with a triangle marker standing on the rope at each change.
  // Distances are measured from the goal line, as on a real field.
  const M = PU / 25 // world units per metre
  for (const v of [5, PV - 5]) {
    const [, ry] = proj(0, v)
    const y = Math.round(ry)
    const [xl] = proj(0, v)
    const [xr] = proj(PU, v)
    for (let x = Math.round(xl); x <= Math.round(xr); x++) {
      const u = (x + 0.5 - OX - (PV - v) * SH) / SX
      const fromGoal = (Math.min(u, PU - u) - GOAL_FRONT) / M
      const tones = fromGoal < 2 ? C.ropeRed : fromGoal < 6 ? C.ropeYellow : C.ropeGreen
      const rib = x % 2 === 0 // corrugation
      cv.px(x, y - 1, rib ? tones[0] : tones[1])
      cv.px(x, y, tones[1])
      cv.darken(x, y + 1, 0.75) // shadow on the water
    }
    for (const [m, col] of [[2, C.markerRed], [6, C.markerYellow], [12.5, C.markerWhite]] as const) {
      for (const u of m === 12.5 ? [PU / 2] : [GOAL_FRONT + m * M, PU - GOAL_FRONT - m * M]) {
        const [mx] = proj(u, v)
        const x = Math.round(mx)
        cv.px(x, y - 4, col)
        for (let i = -1; i <= 1; i++) cv.px(x + i, y - 3, col)
        for (let i = -2; i <= 2; i++) cv.px(x + i, y - 2, i === 2 ? C.lip : col)
        cv.darken(x + 3, y - 1, 0.7)
        cv.darken(x + 3, y, 0.7)
      }
    }
  }
  // Goal line rope at each end, side rope to the goal mouth: red where it
  // meets the side ropes, white by the goal
  for (const u of [GOAL_FRONT, PU - GOAL_FRONT]) {
    crossRope(cv, u, (v) => (Math.min(v - 5, PV - 5 - v) < 4 ? C.ropeRed : C.ropeWhite))
  }
}

// A rope across the pool at u, from each side rope in to the goal posts.
// Seen end-on it runs up and down the screen, two pixels wide with ribs.
function crossRope(cv: Canvas, u: number, tones: (v: number) => readonly [RGB, RGB]) {
  for (const [va, vb] of [[5, GOAL_V0], [GOAL_V1, PV - 5]]) {
    const [xa, ya] = proj(u, va)
    const [, yb] = proj(u, vb)
    const x = Math.round(xa)
    for (let y = Math.round(ya); y <= Math.round(yb); y++) {
      const v = (y + 0.5 - OY) / SY
      const [light, dark] = tones(v)
      cv.px(x, y - 1, y % 2 === 0 ? light : dark)
      cv.px(x + 1, y - 1, dark)
      cv.darken(x + 2, y, 0.75)
    }
  }
}

// ── Goals ───────────────────────────────────────────────────────────────
// Goals are seen side-on: the mouth faces down the pool. Built like a
// competition goal: aluminium frame, square white net, and black floats along the base that stick out past the
// front. Width (v) is kept narrow so the near and far sides overlap into one
// shape instead of reading as two panels.
const GOAL_FRONT = 8 // goal line, from each end wall
const GOAL_BACK = 2
const GOAL_V0 = PV / 2 - 3.5 // far post
const GOAL_V1 = PV / 2 + 3.5 // near post

function goalGeom(uFront: number, uBack: number) {
  const v0 = GOAL_V0
  const v1 = GOAL_V1
  const HGT = 10
  const BACK = 7
  const [fx, y0f] = proj(uFront, v0)
  const [, y1f] = proj(uFront, v1)
  const [kx] = proj(uBack, v0)
  const front = Math.round(fx)
  const back = Math.round(kx)
  const y0 = Math.round(y0f)
  const y1 = Math.round(y1f)
  return {
    HGT,
    BACK,
    front,
    back,
    y0,
    y1,
    dir: Math.sign(back - front), // +1 when the net runs right of the mouth
    xa: Math.min(front, back),
    xb: Math.max(front, back),
    topAt: (x: number) => y0 - HGT + ((HGT - BACK) * (x - front)) / (back - front),
  }
}

function goal(cv: Canvas, uFront: number, uBack: number) {
  const { HGT, BACK, front, back, y0, y1, dir, xa, xb, topAt } = goalGeom(uFront, uBack)

  // Net: a square grid filling the silhouette, so the water shows through
  for (let x = xa; x <= xb; x++) {
    const top = Math.round(topAt(x))
    for (let y = top; y <= y1; y++) {
      if ((x - front) % 3 === 0 || (y - y1) % 3 === 0) cv.px(x, y, C.net)
    }
  }
  // Roof edges and the rear frame
  cv.line(front, y0 - HGT, back, y0 - BACK, C.frameShade)
  cv.line(front, y1 - HGT, back, y1 - BACK, C.frame)
  cv.line(back, y0 - BACK, back, y1, C.frameShade)

  // Near float: a long dark block along the base, rounded at the front
  cv.line(front - dir * 2, y1, back + dir, y1, C.float)
  cv.line(front - dir, y1 + 1, back + dir, y1 + 1, C.float)
  cv.line(front - dir, y1, back, y1, C.floatLight)
  // Front frame, edge-on: posts and crossbar as one upright, lit on the open side
  cv.line(front, y0 - HGT, front, y1, C.frame)
  cv.line(front + dir, y0 - HGT, front + dir, y1 - 1, C.frameShade)
  cv.px(front, y0 - HGT - 1, C.frameShade)
  // Float's wake in the water
  cv.line(xa - 2, y1 + 2, xb + 1, y1 + 2, C.foam)
}

// ── Shadows ─────────────────────────────────────────────────────────────
// Sun from the upper left: every shadow falls down and to the right, longer
// for taller things. Drawn after the floor and before anything that casts.
const SUN_X = 0.8 // px right per px of height
const SUN_Y = 0.35 // px down per px of height

function playerShadow(cv: Canvas, u: number, v: number, raised: boolean) {
  const [sx, sy] = proj(u, v)
  const x0 = Math.round(sx)
  const y0 = Math.round(sy)
  // Head and shoulders fall as a soft oval just right of the body
  for (let i = 0; i <= 7; i++) cv.darken(x0 + 1 + i, y0 + 2, 0.72)
  for (let i = 2; i <= 6; i++) cv.darken(x0 + 2 + i, y0 + 3, 0.78)
  if (raised) {
    // A raised arm throws a long thin shadow across the water
    for (let k = 3; k <= 10; k++) cv.darken(x0 + 3 + k * SUN_X, y0 + 2 + k * SUN_Y, 0.72)
  }
}

// ── Players ─────────────────────────────────────────────────────────────
type Cap = 'white' | 'blue' | 'red'
type Pose = 'swim' | 'tread' | 'raise'

interface Player {
  u: number
  v: number
  cap: Cap
  pose: Pose
  stroke: number // distance swum, drives the arm cycle
  dirU: number
  dirV: number
  face?: Facing // overrides the facing worked out from the direction of travel
}

type Facing = 'front' | 'back' | 'left' | 'right'

function capColors(cap: Cap): [RGB, RGB] {
  if (cap === 'white') return [C.capWhite, C.capWhiteShade]
  if (cap === 'blue') return [C.capBlue, C.capBlueShade]
  return [C.capRed, C.capRedShade]
}

// Upper-body sprites, 9 wide, centred on column 4. C cap, c cap shade and ear
// guards, S skin, s skin shade, L skin highlight, E eyes.
const BODY_FRONT = [
  '...CCC...',
  '..CCCCC..',
  '..cCCCc..',
  '..cSSSc..',
  '..cESEc..',
  '...SsS...',
  '....s....',
  '.sLSSSSs.',
  '.sSSsSSs.',
  '.s.sss.s.',
]
const BODY_BACK = [
  '...CCC...',
  '..CCCCC..',
  '..cCCCc..',
  '..cCCCc..',
  '..cCCCc..',
  '...sss...',
  '....s....',
  '.sLSSSSs.',
  '.sSsSsSs.',
  '.s.sss.s.',
]
// Facing right; mirrored for left
const BODY_SIDE = [
  '...CCC...',
  '..CCCCC..',
  '..CCCCS..',
  '..CccSE..',
  '..CcSSSS.',
  '...sSSs..',
  '....ss...',
  '..sLSSS..',
  '..sSSSSs.',
  '..s.sss..',
]

function player(cv: Canvas, p: Player, time: number) {
  const [sx, sy] = proj(p.u, p.v)
  const x0 = Math.round(sx)
  const y0 = Math.round(sy)
  const [cap, capShade] = capColors(p.cap)
  // Screen direction of travel
  const mdx = p.dirU * SX - p.dirV * SH
  const mdy = p.dirV * SY
  // Mostly sideways travel shows the head in profile; otherwise face or back
  const facing: Facing =
    p.face ?? (Math.abs(mdx) > Math.abs(mdy) * 1.5 ? (mdx > 0 ? 'right' : 'left') : mdy < 0 ? 'back' : 'front')
  const moving = p.pose === 'swim'

  // Disturbed water around the body
  for (let i = -4; i <= 4; i++) {
    cv.px(x0 + i, y0 + 1, Math.abs(i) > 2 ? C.foam : C.shade)
    if (Math.abs(i) <= 3) cv.px(x0 + i, y0, C.shade)
  }
  // Wake behind a swimmer
  if (moving) {
    const len = Math.hypot(mdx, mdy) || 1
    const bx = -mdx / len
    const by = -mdy / len
    for (let k = 3; k < 14; k++) {
      const spread = Math.floor(k / 4)
      for (let s = -spread; s <= spread; s++) {
        if (hash(k * 7 + s, Math.floor(time * 10) + x0) > 0.55 + k * 0.03) {
          cv.px(x0 + bx * k - by * s * 2, y0 + by * k + bx * s, k < 6 ? C.foamWhite : C.foam)
        }
      }
    }
  }

  // Stroke phase: one full cycle (both arms) every 9 units swum
  const phase = (((p.stroke / 9) % 1) + 1) % 1
  const swimming = p.pose === 'swim'
  // Head-up freestyle: the body lifts once per arm stroke
  const bob = swimming && (phase % 0.5) > 0.25 ? 1 : 0
  const yb = swimming ? y0 + 2 - bob : y0
  // The shoulder of the arm that's out of the water rolls up a pixel
  const roll = swimming ? (phase < 0.5 ? 1 : -1) : 0

  // Head and upper body from a sprite map, rows top to bottom ending just
  // above the water. Swimmers sit lower, so their chest rows stay under.
  const rows = facing === 'back' ? BODY_BACK : facing === 'front' ? BODY_FRONT : BODY_SIDE
  const flip = facing === 'left' ? -1 : 1
  const palette: Record<string, RGB> = {
    C: cap,
    c: capShade,
    S: C.skin,
    s: C.skinDark,
    L: C.skinLight,
    E: C.outline,
  }
  rows.forEach((row, j) => {
    const dy = rows.length - j // 1 for the last row
    if (swimming && dy <= 2) return
    for (let i = 0; i < row.length; i++) {
      const col = palette[row[i]]
      if (col) cv.px(x0 + (i - 4) * flip, yb - dy, col)
    }
  })
  // The shoulder of the arm that's out of the water rolls up a pixel
  if (roll) cv.px(x0 + roll * 3, yb - 4, C.skin)

  if (swimming) {
    const len = Math.hypot(mdx, mdy) || 1
    const fx = mdx / len
    const fy = mdy / len
    // Each arm recovers over the water for half the cycle: from behind the
    // body, up over the shoulder with a high elbow, into the water ahead.
    for (const side of [1, -1]) {
      const local = side === 1 ? phase : (phase + 0.5) % 1
      if (local >= 0.5) {
        // Pulling underwater: just a dark shape under the surface ahead
        const k = (local - 0.5) / 0.5
        cv.px(x0 + side * 3 + fx * (4 - k * 6), y0 + 1 + fy * (4 - k * 6), C.shade)
        continue
      }
      const k = local / 0.5
      const th = Math.PI * (1 - k) // π behind → 0 ahead
      const shx = x0 + side * 3
      const shy = yb - 3
      const ex = shx + Math.cos(th) * fx * 3
      const ey = shy + Math.cos(th) * fy * 3 - Math.sin(th) * 4
      const hx = shx + Math.cos(th) * fx * 6
      const hy = shy + Math.cos(th) * fy * 6 - Math.sin(th) * 5
      cv.line(shx, shy, ex, ey, C.skinDark)
      cv.line(ex, ey, hx, hy, C.skin)
      if (k > 0.82) {
        // Entry splash ahead
        const sx2 = shx + fx * 6
        const sy2 = shy + fy * 6 + 2
        cv.px(sx2, sy2, C.foamWhite)
        cv.px(sx2 - 1, sy2, C.foamWhite)
        cv.px(sx2 + 1, sy2, C.foamWhite)
        cv.px(sx2, sy2 - 1, C.foamWhite)
        cv.px(sx2 - 1, sy2 - 2, C.foam)
        cv.px(sx2 + 1, sy2 - 2, C.foam)
      } else if (k < 0.15) {
        // Water running off the hand as it leaves
        cv.px(hx, hy + 1, C.foam)
        cv.px(hx, hy + 2, C.foamWhite)
      }
    }
    // Kick: alternating bursts behind the body
    const kick = Math.floor(phase * 4) % 2 ? 1 : -1
    cv.px(x0 - fx * 6 + kick, y0 - fy * 6 + 1, C.foamWhite)
    cv.px(x0 - fx * 7 + kick * 2, y0 - fy * 7, C.foamWhite)
    cv.px(x0 - fx * 7 - kick, y0 - fy * 7 + 1, C.foam)
  } else if (p.pose === 'tread') {
    // Eggbeater: hands sculling at the surface
    const t2 = Math.floor(time * 4 + p.u) % 2
    cv.px(x0 - 4, y0 - t2, C.skinDark)
    cv.px(x0 + 4, y0 - 1 + t2, C.skinDark)
    cv.px(x0 - 5, y0 + 1 - t2, C.foam)
    cv.px(x0 + 5, y0 + t2, C.foam)
  } else {
    // Arm straight up to throw or catch, on the side the player faces:
    // upper arm from the shoulder, forearm, open hand
    const arm = facing === 'left' ? -1 : 1
    for (let k = 4; k <= 12; k++) cv.px(x0 + arm * 4, yb - k, k > 10 ? C.skin : k > 7 ? C.skinLight : C.skinDark)
    cv.px(x0 + arm * 5, yb - 12, C.skin) // thumb
    cv.px(x0 - arm * 5, y0, C.skinDark) // other hand sculling
    cv.px(x0 - arm * 6, y0 + 1, C.foam)
  }
}

// 7×7 water polo ball: dark outline, curved seams, light top-left, shade
// bottom-right. Drawn around its centre.
export const BALL_SIZE = 7
const BALL = [
  '..OOO..',
  '.OHHKO.',
  'OHHKYYO',
  'OYKYYKO',
  'OKYYKSO',
  '.OYKSO.',
  '..OOO..',
]

function ball(cv: Canvas, x: number, y: number) {
  const bx = Math.round(x) - 3
  const by = Math.round(y) - 3
  const map: Record<string, RGB> = { O: C.ballLine, H: C.ballLight, Y: C.ball, S: C.ballShade, K: C.ballSeam }
  BALL.forEach((row, j) => {
    for (let i = 0; i < row.length; i++) {
      const c = map[row[i]]
      if (c) cv.px(bx + i, by + j, c)
    }
  })
}

// ── Choreography ────────────────────────────────────────────────────────
const smooth = (t: number) => t * t * (3 - 2 * t)
const clamp01 = (t: number) => Math.min(1, Math.max(0, t))
const seg = (s: number, a: number, b: number) => clamp01((s - a) / (b - a))

interface Path {
  from: [number, number]
  to: [number, number]
  start: number
  end: number
}

function along(path: Path, s: number) {
  const k = seg(s, path.start, path.end)
  const e = smooth(k)
  const du = path.to[0] - path.from[0]
  const dv = path.to[1] - path.from[1]
  return {
    u: path.from[0] + du * e,
    v: path.from[1] + dv * e,
    stroke: Math.hypot(du, dv) * e,
    moving: k > 0 && k < 1,
    dirU: du,
    dirV: dv,
  }
}

// One cycle is two halves of LOOP seconds. First half: A pushes the ball up
// the pool to the right, B and the defender swim with them, and A passes to
// B near the right goal. Second half: the mirror image, B pushing it back
// left and passing to A near the left goal. Each half ends exactly where the
// next begins, so the cycle loops without a seam.
const A: Path = { from: [14, 31], to: [36, 28], start: 0, end: 3.6 }
const B: Path = { from: [22, 12], to: [48, 13], start: 0.4, end: 3.9 }
const D: Path = { from: [20, 21], to: [42, 20], start: 0.2, end: 3.9 } // defender
const RAISE = 3.6 // thrower starts lifting the ball
const LIFTED = 4.0 // ball overhead
const THROW = 4.3
const CATCH = 5.4
const LOWER = 6.0 // receiver brings it down in front, ready to swim back
const LOWERED = 6.6

// The same journey backwards, on another player's clock
const back = (p: Path, clock: Path): Path => ({ from: p.to, to: p.from, start: clock.start, end: clock.end })
const sideOf = (du: number): Facing => (du >= 0 ? 'right' : 'left')

export interface FrameOptions {
  hideBall?: boolean // the visitor has picked it up
  ballHover?: boolean // pointer is over it: draw a pick-up ring
}

// Draws one frame and returns where the ball is, in canvas pixels, so the
// page can hit-test it.
export function frame(buf: Uint8ClampedArray, time: number, s: number, opts: FrameOptions = {}): [number, number] {
  buf.fill(0)
  const cv = new Canvas(buf)
  floor(cv, time)

  const half = s < LOOP ? 0 : 1
  const t = s - half * LOOP
  // The carrier always runs on A's clock and the receiver on B's
  const pa = half === 0 ? A : back(A, B)
  const pb = half === 0 ? B : back(B, A)
  const pd = half === 0 ? D : back(D, D)
  const a = along(pa, t)
  const b = along(pb, t)
  const d = along(pd, t)
  const [carrier, receiver] = half === 0 ? [a, b] : [b, a]

  // With the ball taken out of the game by the visitor, nobody passes: the
  // players just swim up the pool and back.
  const noBall = !!opts.hideBall

  // Facing: swimmers face the way they swim. Players treading water face the
  // way they're about to go, turn to each other for the pass, and after it
  // turn to face back down the pool. Without a ball they turn round as soon
  // as they arrive.
  const faceOf = (p: typeof a, partner: typeof a) => {
    if (p.moving) return undefined
    if (noBall) return sideOf(p.stroke > 0 ? -p.dirU : p.dirU) // arrived: face back; not yet left: face ahead
    if (t >= LOWER) return sideOf(-p.dirU)
    if (t >= RAISE) return sideOf(partner.u - p.u)
    return sideOf(p.dirU)
  }
  const carrierFace = faceOf(carrier, receiver)
  const receiverFace = faceOf(receiver, carrier)
  const holder = t < THROW ? carrier : receiver
  const defenderFace = d.moving ? undefined : noBall ? faceOf(d, d) : sideOf(holder.u - d.u)

  const carrierPose: Pose = carrier.moving ? 'swim' : !noBall && t >= RAISE && t < THROW + 0.2 ? 'raise' : 'tread'
  const receiverPose: Pose = receiver.moving ? 'swim' : !noBall && t >= THROW + 0.3 && t < LOWERED ? 'raise' : 'tread'

  // Goalies shade toward the side of the goal the pass is going to, and
  // drift back to centre during the other half
  const passing = smooth(seg(t, 3, 5.6))
  const recover = 1 - smooth(seg(t, 0, 3))
  const gRight = PV / 2 + 1 - 6 * (half === 0 ? passing : recover)
  const gLeft = PV / 2 + 1 - 6 * (half === 1 ? passing : recover)
  const goalieUp = !noBall && t > THROW && t < CATCH + 0.4

  const mk = (p: typeof a, pose: Pose, face: Facing | undefined): Player => ({
    u: p.u,
    v: p.v,
    cap: 'white',
    pose,
    stroke: p.stroke,
    dirU: p.dirU,
    dirV: p.dirV,
    face,
  })
  const players: Player[] = [
    mk(carrier, carrierPose, carrierFace),
    mk(receiver, receiverPose, receiverFace),
    { ...mk(d, d.moving ? 'swim' : 'tread', defenderFace), cap: 'blue' },
    { u: PU - 13, v: gRight, cap: 'red', pose: half === 0 && goalieUp ? 'raise' : 'tread', stroke: 0, dirU: -1, dirV: 0, face: 'left' },
    { u: 13, v: gLeft, cap: 'red', pose: half === 1 && goalieUp ? 'raise' : 'tread', stroke: 0, dirU: 1, dirV: 0, face: 'right' },
  ]

  // Ball: pushed in front of the carrier, lifted overhead, thrown, caught,
  // then set down in front of the receiver facing the way back
  const hand = (p: typeof a, face: Facing | undefined): [number, number] => {
    const [x, y] = proj(p.u, p.v)
    return [x + (face === 'left' ? -4 : 4), y - 16]
  }
  const inFront = (p: typeof a, du: number, dv: number): [number, number] => {
    const len = Math.hypot(du, dv) || 1
    const [x, y] = proj(p.u + (du / len) * 5, p.v + (dv / len) * 5 - 1)
    return [x, y - 2]
  }
  const mix = (p: [number, number], q: [number, number], k: number): [number, number] => [
    p[0] + (q[0] - p[0]) * k,
    p[1] + (q[1] - p[1]) * k,
  ]
  // Depth (v) of a point five units in front of a player, for draw order
  const frontV = (p: typeof a, du: number, dv: number) => p.v + (dv / (Math.hypot(du, dv) || 1)) * 5 - 1
  const dribble = inFront(carrier, carrier.dirU, carrier.dirV)
  const setDown = inFront(receiver, -receiver.dirU, -receiver.dirV)
  const dribbleV = frontV(carrier, carrier.dirU, carrier.dirV)
  const setDownV = frontV(receiver, -receiver.dirU, -receiver.dirV)
  // A held ball sits just in front of its holder's head
  const heldV = (p: typeof a) => p.v + 0.5
  const throwFrom = hand(carrier, carrierFace)
  const catchAt = hand(receiver, receiverFace)
  let ballAt: [number, number]
  let ballV: number // depth, so nearer players can be drawn over it
  let shadow: [number, number] | null = null
  if (t < RAISE) {
    ballAt = dribble
    ballV = dribbleV
  } else if (t < LIFTED) {
    const k = smooth(seg(t, RAISE, LIFTED))
    ballAt = mix(dribble, throwFrom, k)
    ballV = dribbleV + (heldV(carrier) - dribbleV) * k
  } else if (t < THROW) {
    ballAt = throwFrom
    ballV = heldV(carrier)
  } else if (t < CATCH) {
    const k = (t - THROW) / (CATCH - THROW)
    const arc = 7 * 4 * k * (1 - k)
    const at = mix(throwFrom, catchAt, k)
    ballAt = [at[0], at[1] - arc]
    ballV = heldV(carrier) + (heldV(receiver) - heldV(carrier)) * k
    shadow = proj(carrier.u + (receiver.u - carrier.u) * k, carrier.v + (receiver.v - carrier.v) * k)
  } else if (t < LOWER) {
    ballAt = catchAt
    ballV = heldV(receiver)
  } else {
    const k = smooth(seg(t, LOWER, LOWERED))
    ballAt = mix(catchAt, setDown, k)
    ballV = heldV(receiver) + (setDownV - heldV(receiver)) * k
  }

  for (const p of players) playerShadow(cv, p.u, p.v, p.pose === 'raise')
  if (shadow && !opts.hideBall) {
    // The ball's shadow trails further from it the higher it flies
    const h = shadow[1] - ballAt[1]
    const bx = shadow[0] + h * SUN_X * 0.5
    const by = shadow[1] + 2 + h * SUN_Y * 0.5
    for (let i = -2; i <= 2; i++) cv.darken(bx + i, by, 0.68)
    for (let i = -1; i <= 1; i++) cv.darken(bx + i, by + 1, 0.74)
  }

  goal(cv, GOAL_FRONT, GOAL_BACK)
  // Players and the ball back to front: anyone nearer the viewer than the
  // ball is drawn over it
  const order = [...players].sort((p, q) => p.v - q.v)
  let ballDrawn = !!opts.hideBall
  const drawBall = () => {
    ballDrawn = true
    ball(cv, ballAt[0], ballAt[1])
    if (opts.ballHover) {
      // A dotted ring one pixel out from the ball: "you can pick this up"
      const bx = Math.round(ballAt[0])
      const by = Math.round(ballAt[1])
      for (let dy = -5; dy <= 5; dy++)
        for (let dx = -5; dx <= 5; dx++) {
          const r = dx * dx + dy * dy
          if (r >= 17 && r <= 22 && (dx + dy) % 2 === 0) cv.px(bx + dx, by + dy, C.foamWhite)
        }
    }
  }
  for (const p of order) {
    if (!ballDrawn && p.v > ballV) drawBall()
    player(cv, p, time)
  }
  if (!ballDrawn) drawBall()
  goal(cv, PU - GOAL_FRONT, PU - GOAL_BACK)
  return ballAt
}

// The ball sprite on its own, BALL_SIZE square RGBA, for drawing it outside the scene
export function ballImage(): Uint8ClampedArray {
  const buf = new Uint8ClampedArray(BALL_SIZE * BALL_SIZE * 4)
  const map: Record<string, RGB> = { O: C.ballLine, H: C.ballLight, Y: C.ball, S: C.ballShade, K: C.ballSeam }
  BALL.forEach((row, j) => {
    for (let i = 0; i < row.length; i++) {
      const c = map[row[i]]
      if (!c) continue
      const k = (j * BALL_SIZE + i) * 4
      buf[k] = c[0]
      buf[k + 1] = c[1]
      buf[k + 2] = c[2]
      buf[k + 3] = 255
    }
  })
  return buf
}

// Play head through the two-half cycle: up the pool and back
export function playHead(time: number) {
  return time % (2 * LOOP)
}

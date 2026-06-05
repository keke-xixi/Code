import CONFIG from '../config/game.config'

import { SCREEN_WIDTH, SCREEN_HEIGHT } from '../render'



export function getScale() {

  return SCREEN_WIDTH / CONFIG.scale.baseWidth

}



export function getLevelConfig() {

  return GameGlobal.levelConfig

}



export function getPlayArea() {

  const top = SCREEN_HEIGHT * CONFIG.game.hudHeight

  return {

    left: 0,

    top,

    width: SCREEN_WIDTH,

    height: SCREEN_HEIGHT - top,

    bottom: SCREEN_HEIGHT,

  }

}



export function toPixel(rx, ry) {

  const area = getPlayArea()

  return {

    x: area.left + rx * area.width,

    y: area.top + ry * area.height,

  }

}



function smoothCorners(points, cornerRadius) {

  if (points.length < 3) return points

  const smooth = [points[0]]



  for (let i = 1; i < points.length - 1; i += 1) {

    const prev = points[i - 1]

    const curr = points[i]

    const next = points[i + 1]

    const v1x = curr.x - prev.x

    const v1y = curr.y - prev.y

    const v2x = next.x - curr.x

    const v2y = next.y - curr.y

    const len1 = Math.hypot(v1x, v1y)

    const len2 = Math.hypot(v2x, v2y)

    const r = Math.min(cornerRadius, len1 * 0.42, len2 * 0.42)



    if (r < 6 || len1 < 1 || len2 < 1) {

      smooth.push(curr)

      continue

    }



    const p1 = {

      x: curr.x - (v1x / len1) * r,

      y: curr.y - (v1y / len1) * r,

    }

    const p2 = {

      x: curr.x + (v2x / len2) * r,

      y: curr.y + (v2y / len2) * r,

    }

    smooth.push(p1)

    const steps = 8

    for (let s = 1; s <= steps; s += 1) {

      const t = s / steps

      const mt = 1 - t

      smooth.push({

        x: mt * mt * p1.x + 2 * mt * t * curr.x + t * t * p2.x,

        y: mt * mt * p1.y + 2 * mt * t * curr.y + t * t * p2.y,

      })

    }

  }



  smooth.push(points[points.length - 1])

  return smooth

}



export function buildPathPoints() {
  const level = getLevelConfig()
  if (!level) return []
  return buildPathPointsForLevel(level)
}



let slotCache = null
let slotCacheLevelId = null

function distToSegment(px, py, ax, ay, bx, by) {
  const dx = bx - ax
  const dy = by - ay
  const len2 = dx * dx + dy * dy
  if (len2 < 1) return Math.hypot(px - ax, py - ay)
  let t = ((px - ax) * dx + (py - ay) * dy) / len2
  t = Math.max(0, Math.min(1, t))
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy))
}

function minDistToPathPx(px, py, pathPts) {
  let min = Infinity
  for (let i = 0; i < pathPts.length - 1; i += 1) {
    const a = pathPts[i]
    const b = pathPts[i + 1]
    min = Math.min(min, distToSegment(px, py, a.x, a.y, b.x, b.y))
  }
  return min
}

function buildPathPointsForLevel(level) {
  if (!level?.path?.length) return []
  const raw = level.path.map((p) => toPixel(p.x, p.y))
  const radius = CONFIG.scale.pathCornerRadius * getScale()
  return smoothCorners(raw, radius)
}

function generateAutoSlots(level) {
  const manual = level.slots || []
  const pathPts = buildPathPointsForLevel(level)
  if (!pathPts.length) return []

  const scale = getScale()
  const pathClear = CONFIG.scale.pathWidth * scale * 0.5 + CONFIG.scale.slotNestSize * scale * 0.48 + 12
  const slotGap = CONFIG.scale.slotNestSize * scale * 1.08
  const nest = pathPts[pathPts.length - 1]
  const nestBlock = CONFIG.scale.slotNestSize * scale * 1.35
  const auto = []

  for (let ry = 0.10; ry <= 0.90; ry += 0.072) {
    for (let rx = 0.06; rx <= 0.94; rx += 0.068) {
      const pt = toPixel(rx, ry)
      if (minDistToPathPx(pt.x, pt.y, pathPts) < pathClear) continue
      if (Math.hypot(pt.x - nest.x, pt.y - nest.y) < nestBlock) continue

      const nearExisting = manual.some((s) => {
        const m = toPixel(s.x, s.y)
        return Math.hypot(m.x - pt.x, m.y - pt.y) < slotGap
      })
      if (nearExisting) continue

      const nearAuto = auto.some((s) => {
        const a = toPixel(s.x, s.y)
        return Math.hypot(a.x - pt.x, a.y - pt.y) < slotGap
      })
      if (nearAuto) continue

      auto.push({ x: rx, y: ry, free: false, auto: true })
    }
  }
  return auto
}

export function clearSlotCache() {
  slotCache = null
  slotCacheLevelId = null
}

export function getLevelSlots(level) {
  if (!level) return []
  if (slotCacheLevelId === level.id && slotCache) return slotCache
  slotCache = [...(level.slots || []), ...generateAutoSlots(level)]
  slotCacheLevelId = level.id
  return slotCache
}

export function buildSlotPoints() {
  const level = getLevelConfig()
  if (!level) return []
  return getLevelSlots(level).map((s, index) => ({ index, ...toPixel(s.x, s.y) }))
}



export function getWaveCount() {

  return getLevelConfig()?.waves?.length || 0

}



export function dist(a, b) {

  const dx = a.x - b.x

  const dy = a.y - b.y

  return Math.sqrt(dx * dx + dy * dy)

}



export function roundRect(ctx, x, y, w, h, r) {

  const rr = Math.min(r, w / 2, h / 2)

  ctx.beginPath()

  ctx.moveTo(x + rr, y)

  ctx.arcTo(x + w, y, x + w, y + h, rr)

  ctx.arcTo(x + w, y + h, x, y + h, rr)

  ctx.arcTo(x, y + h, x, y, rr)

  ctx.arcTo(x, y, x + w, y, rr)

  ctx.closePath()

}



export function drawStars(ctx, x, y, star, max = 3) {

  ctx.font = 'bold 13px sans-serif'

  ctx.textAlign = 'center'

  ctx.fillStyle = '#F1C40F'

  ctx.strokeStyle = '#B7950B'

  ctx.lineWidth = 2

  ctx.strokeText('★'.repeat(star) + '☆'.repeat(max - star), x, y)

  ctx.fillText('★'.repeat(star) + '☆'.repeat(max - star), x, y)

}



import CONFIG from '../config/game.config'
import { SCREEN_WIDTH, SCREEN_HEIGHT } from '../render'

/** 屏幕缩放系数（相对 375 设计宽） */
export function getScale() {
  return SCREEN_WIDTH / CONFIG.scale.baseWidth
}

/** 比例坐标 → 像素（游戏区，不含 HUD） */
export function toPixel(rx, ry, playTop, playHeight) {
  return {
    x: rx * SCREEN_WIDTH,
    y: playTop + ry * playHeight,
  }
}

/** 获取可玩区域 */
export function getPlayArea() {
  const top = SCREEN_HEIGHT * CONFIG.game.hudHeight
  const bottom = SCREEN_HEIGHT * (1 - CONFIG.game.uiHeight)
  return { top, height: bottom - top, bottom }
}

/** 路径像素点列表 */
export function buildPathPoints() {
  const { top, height } = getPlayArea()
  return CONFIG.path.map((p) => toPixel(p.x, p.y, top, height))
}

/** 槽位像素坐标 */
export function buildSlotPoints() {
  const { top, height } = getPlayArea()
  return CONFIG.slots.map((s, index) => ({
    index,
    ...toPixel(s.x, s.y, top, height),
  }))
}

/** 两点距离 */
export function dist(a, b) {
  const dx = a.x - b.x
  const dy = a.y - b.y
  return Math.sqrt(dx * dx + dy * dy)
}

/** 绘制圆角矩形 */
export function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

/** 绘制血条 */
export function drawHpBar(ctx, x, y, w, ratio) {
  const h = 5
  ctx.fillStyle = '#333'
  ctx.fillRect(x - w / 2, y, w, h)
  ctx.fillStyle = ratio > 0.35 ? '#2ECC71' : '#E74C3C'
  ctx.fillRect(x - w / 2, y, w * Math.max(0, ratio), h)
}

/** 绘制星级 */
export function drawStars(ctx, x, y, star, max = 3) {
  ctx.font = '12px sans-serif'
  ctx.textAlign = 'center'
  ctx.fillStyle = '#F1C40F'
  ctx.fillText('★'.repeat(star) + '☆'.repeat(max - star), x, y)
}

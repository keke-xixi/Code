import CONFIG from '../config/game.config'
import { drawCoverImage, drawSprite, getImage } from '../base/assets'
import { getPlayArea, getScale } from '../map/layout'

export default class Background {
  grassOffset = 0
  cloudOffset = 0

  update() {
    this.grassOffset += 0.3
    this.cloudOffset += 0.15
  }

  tracePath(ctx, pts) {
    ctx.beginPath()
    pts.forEach((p, i) => {
      if (i === 0) ctx.moveTo(p.x, p.y)
      else ctx.lineTo(p.x, p.y)
    })
  }

  renderPath(ctx, pts, scale, theme = {}) {
    if (pts.length < 2) return
    const pathW = CONFIG.scale.pathWidth * scale
    const borderW = pathW + 10 * scale
    const innerW = pathW * 0.38
    const pathOuter = theme.pathOuter || '#B8956A'
    const pathInner = theme.pathInner || '#E8D4B0'

    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'

    this.tracePath(ctx, pts)
    ctx.strokeStyle = 'rgba(62,44,28,0.35)'
    ctx.lineWidth = borderW + 8 * scale
    ctx.shadowColor = 'rgba(0,0,0,0.25)'
    ctx.shadowBlur = 10 * scale
    ctx.stroke()

    this.tracePath(ctx, pts)
    ctx.strokeStyle = pathOuter
    ctx.lineWidth = borderW
    ctx.shadowBlur = 0
    ctx.stroke()

    this.tracePath(ctx, pts)
    ctx.strokeStyle = pathInner
    ctx.lineWidth = pathW
    ctx.stroke()

    this.tracePath(ctx, pts)
    ctx.setLineDash([10 * scale, 14 * scale])
    ctx.strokeStyle = 'rgba(255,255,255,0.28)'
    ctx.lineWidth = innerW
    ctx.stroke()
    ctx.setLineDash([])

    const start = pts[0]
    const nest = pts[pts.length - 1]
    const r = 10 * scale

    ctx.fillStyle = 'rgba(76,175,80,0.9)'
    ctx.beginPath()
    ctx.arc(start.x, start.y, r, 0, Math.PI * 2)
    ctx.fill()
    ctx.strokeStyle = '#fff'
    ctx.lineWidth = 2
    ctx.stroke()
    ctx.fillStyle = '#fff'
    ctx.font = `bold ${Math.floor(11 * scale)}px sans-serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('入', start.x, start.y)

    ctx.fillStyle = 'rgba(229,57,53,0.85)'
    ctx.beginPath()
    ctx.arc(nest.x - 28 * scale, nest.y, r * 0.85, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = '#fff'
    ctx.font = `bold ${Math.floor(10 * scale)}px sans-serif`
    ctx.fillText('守', nest.x - 28 * scale, nest.y)
  }

  render(ctx) {
    const area = getPlayArea()
    const scale = getScale()
    const level = GameGlobal.levelConfig || {}
    const theme = level.theme || {}
    const levelId = level.id || 1
    const levelBg = CONFIG.assets.levelBgs?.[levelId]
    const clouds = getImage(CONFIG.assets.bgClouds)
    const grass = getImage(CONFIG.assets.bgGrass)

    ctx.fillStyle = theme.sky || '#A8D8F0'
    ctx.fillRect(0, area.top, area.width, area.height)

    if (levelBg && drawCoverImage(ctx, levelBg, area.left, area.top, area.width, area.height)) {
      if (theme.overlay) {
        ctx.fillStyle = theme.overlay
        ctx.fillRect(area.left, area.top, area.width, area.height)
      }
    } else if (grass._loaded) {
      const gw = area.width
      const gh = area.height
      const gox = -(this.grassOffset % gw)
      ctx.drawImage(grass, area.left + gox, area.top, gw, gh)
      ctx.drawImage(grass, area.left + gox + gw, area.top, gw, gh)
    } else {
      ctx.fillStyle = theme.grass || '#7CB342'
      ctx.fillRect(area.left, area.top, area.width, area.height)
    }

    if (theme.showClouds !== false && clouds._loaded) {
      const cw = area.width
      const ch = area.height * 0.42
      const ox = -(this.cloudOffset % cw)
      ctx.globalAlpha = levelId === 3 ? 0.45 : 0.78
      ctx.drawImage(clouds, ox, area.top, cw, ch)
      ctx.drawImage(clouds, ox + cw, area.top, cw, ch)
      ctx.globalAlpha = 1
    }

    const pts = GameGlobal.pathPoints || []
    this.renderPath(ctx, pts, scale, theme)

    if (pts.length) {
      const nest = pts[pts.length - 1]
      drawSprite(ctx, CONFIG.assets.nest, nest.x, nest.y, 72 * scale, { bobY: Math.sin(GameGlobal.databus.frame * 0.05) * 2 })
    }
  }
}

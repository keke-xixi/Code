import CONFIG from '../config/game.config'

const cache = {}

function loadImage(src) {
  if (cache[src]) return cache[src]
  const img = wx.createImage()
  img._loaded = false
  img._failed = false
  img.onload = () => { img._loaded = true }
  img.onerror = () => { img._failed = true }
  img.src = src
  cache[src] = img
  return img
}

export function preloadAssets() {
  const { assets } = CONFIG
  const list = [
    assets.bgGrass,
    assets.bgClouds,
    assets.nest,
    assets.slotNest,
    assets.menuBg,
    ...Object.values(assets.levelCards || {}),
    ...Object.values(assets.levelBgs || {}),
    assets.bullet,
    ...Object.values(assets.towers),
    ...Object.values(assets.enemies),
  ]
  list.forEach(loadImage)
  return list
}

export function waitForAssets(timeout = 8000) {
  const list = preloadAssets()
  const start = Date.now()
  return new Promise((resolve) => {
    const tick = () => {
      const ready = list.every((src) => {
        const img = cache[src]
        return img && (img._loaded || img._failed)
      })
      if (ready || Date.now() - start > timeout) resolve()
      else setTimeout(tick, 50)
    }
    tick()
  })
}

export function getImage(src) {
  return cache[src] || loadImage(src)
}

export function drawCoverImage(ctx, src, x, y, w, h) {
  const img = getImage(src)
  if (!img || !img._loaded) return false
  const ir = img.width / img.height
  const dr = w / h
  let sw; let sh; let sx; let sy
  if (ir > dr) {
    sh = img.height
    sw = sh * dr
    sx = (img.width - sw) / 2
    sy = 0
  } else {
    sw = img.width
    sh = sw / dr
    sx = 0
    sy = (img.height - sh) / 2
  }
  ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h)
  return true
}

export function drawSprite(ctx, src, x, y, size, opts = {}) {
  const img = getImage(src)
  if (!img || !img._loaded) {
    ctx.fillStyle = opts.fallback || '#ccc'
    ctx.beginPath()
    ctx.arc(x, y, size / 2, 0, Math.PI * 2)
    ctx.fill()
    return
  }
  const { scaleX = 1, rotation = 0, alpha = 1, bobY = 0 } = opts
  const w = size * scaleX
  const h = size
  ctx.save()
  ctx.globalAlpha = alpha
  ctx.translate(x, y + bobY)
  ctx.rotate(rotation)
  ctx.drawImage(img, -w / 2, -h / 2, w, h)
  ctx.restore()
}

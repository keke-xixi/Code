const CELL = 44
const COLS = 9
const ROWS = 11

let canvas
let ctx
let rafId = 0
let player = { x: 4, y: 5 }
let ores = {}

const oreColors = {
  1: '#6b4423',
  2: '#5c5c5c',
  3: '#7a8b99',
  4: '#e8b923',
}

export const boot = () => {
  canvas = wx.createCanvas()
  ctx = canvas.getContext('2d')
  initMap()
  bindTouch()
  loop()
}

const initMap = () => {
  ores = {}
  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      const key = `${x},${y}`
      ores[key] = {
        type: Math.random() < 0.15 ? 4 : Math.random() < 0.4 ? 2 : 1,
        break: false,
        take: false,
      }
    }
  }
}

const bindTouch = () => {
  wx.onTouchStart((e) => {
    const t = e.touches[0]
    const col = Math.floor(t.clientX / CELL)
    const row = Math.floor(t.clientY / CELL)
    tryMove(col, row)
  })
}

const tryMove = (x, y) => {
  const dx = Math.abs(x - player.x)
  const dy = Math.abs(y - player.y)
  if ((dx === 1 && dy === 0) || (dx === 0 && dy === 1)) {
    player.x = x
    player.y = y
    const key = `${x},${y}`
    const cell = ores[key]
    if (!cell) return
    if (!cell.break) cell.break = true
    else if (!cell.take) cell.take = true
  }
}

const loop = () => {
  draw()
  rafId = requestAnimationFrame(loop)
}

const draw = () => {
  const w = canvas.width
  const h = canvas.height
  ctx.fillStyle = '#0f1419'
  ctx.fillRect(0, 0, w, h)

  ctx.fillStyle = 'rgba(255,255,255,0.08)'
  ctx.font = '14px sans-serif'
  ctx.fillText('MC 小游戏骨架 · 逻辑迁移中', 12, 24)
  ctx.fillText('AppID wxdb70767113810f88', 12, 44)

  const offsetX = Math.floor((w - COLS * CELL) / 2)
  const offsetY = 80

  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      const cell = ores[`${x},${y}`]
      const px = offsetX + x * CELL
      const py = offsetY + y * CELL
      if (!cell.break) {
        ctx.fillStyle = '#1f0a0c'
        ctx.fillRect(px + 1, py + 1, CELL - 2, CELL - 2)
      } else if (!cell.take) {
        ctx.fillStyle = oreColors[cell.type] || '#888'
        ctx.fillRect(px + 4, py + 4, CELL - 8, CELL - 8)
      }
    }
  }

  const px = offsetX + player.x * CELL + CELL / 2
  const py = offsetY + player.y * CELL + CELL / 2
  ctx.fillStyle = '#2575fc'
  ctx.beginPath()
  ctx.arc(px, py, 14, 0, Math.PI * 2)
  ctx.fill()
  ctx.strokeStyle = '#ffd700'
  ctx.lineWidth = 2
  ctx.stroke()
}

export const destroy = () => {
  if (rafId) cancelAnimationFrame(rafId)
}

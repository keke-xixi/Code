import './render'
import CONFIG from './config/game.config'
import DataBus from './databus'
import Tower from './tower/index'
import Enemy from './enemy/index'
import GameInfo from './runtime/gameinfo'
import { buildPathPoints, buildSlotPoints, getPlayArea, getScale } from './map/layout'

const ctx = canvas.getContext('2d')

GameGlobal.databus = new DataBus()
GameGlobal.CONFIG = CONFIG

export default class Main {
  aniId = 0
  gameInfo = new GameInfo()

  constructor() {
    this.gameInfo.on('restart', this.start.bind(this))
    this.gameInfo.bindTouch()
    this.start()
  }

  start() {
    GameGlobal.databus.reset()
    this.prepareWave()
    cancelAnimationFrame(this.aniId)
    this.aniId = requestAnimationFrame(this.loop.bind(this))
  }

  /** 构建下一波生成队列 */
  prepareWave() {
    const db = GameGlobal.databus
    const wave = CONFIG.waves[db.waveIndex]
    if (!wave) {
      db.victory()
      return
    }
    db.waveDelayLeft = wave.delay
    db.spawnQueue = []
    wave.groups.forEach((g) => {
      for (let i = 0; i < g.count; i += 1) {
        db.spawnQueue.push({ type: g.type, wait: i * g.gap })
      }
    })
    db.spawning = true
  }

  spawnTick() {
    const db = GameGlobal.databus
    if (!db.spawning) return

    if (db.waveDelayLeft > 0) {
      db.waveDelayLeft -= 1
      return
    }

    if (!db.spawnQueue.length) {
      if (db.enemys.length === 0) {
        db.waveIndex += 1
        db.spawning = false
        if (db.waveIndex >= CONFIG.waves.length) {
          db.victory()
        } else {
          this.prepareWave()
        }
      }
      return
    }

    const next = db.spawnQueue[0]
    if (next.wait > 0) {
      next.wait -= 1
      return
    }

    db.spawnQueue.shift()
    const enemy = db.pool.getItemByClass('enemy', Enemy)
    enemy.init(next.type)
    db.enemys.push(enemy)
  }

  update() {
    const db = GameGlobal.databus
    if (db.isGameOver) return

    db.frame += 1
    this.spawnTick()
    db.towers.forEach((t) => t.update())
    db.enemys.forEach((e) => e.update())
    db.bullets.forEach((b) => b.update())
  }

  renderBackground() {
    const { top, height, bottom } = getPlayArea()
    const scale = getScale()

    ctx.fillStyle = '#87CE6A'
    ctx.fillRect(0, top, canvas.width, height)

    const pts = buildPathPoints()
    ctx.strokeStyle = '#C4A574'
    ctx.lineWidth = CONFIG.scale.pathWidth * scale
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.beginPath()
    pts.forEach((p, i) => {
      if (i === 0) ctx.moveTo(p.x, p.y)
      else ctx.lineTo(p.x, p.y)
    })
    ctx.stroke()

    const nest = pts[pts.length - 1]
    ctx.fillStyle = '#FFD700'
    ctx.beginPath()
    ctx.arc(nest.x, nest.y, 24 * scale, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = '#8B4513'
    ctx.font = `${Math.floor(12 * scale)}px sans-serif`
    ctx.textAlign = 'center'
    ctx.fillText('窝', nest.x, nest.y + 4)

    buildSlotPoints().forEach((s) => {
      const occupied = GameGlobal.databus.getTowerAtSlot(s.index)
      ctx.fillStyle = occupied ? 'rgba(0,0,0,0.15)' : 'rgba(255,255,255,0.25)'
      ctx.beginPath()
      ctx.arc(s.x, s.y, CONFIG.scale.slotRadius * scale, 0, Math.PI * 2)
      ctx.fill()
      ctx.strokeStyle = 'rgba(93,64,55,0.5)'
      ctx.lineWidth = 2
      ctx.stroke()
    })

    ctx.fillStyle = 'rgba(0,0,0,0.08)'
    ctx.fillRect(0, bottom, canvas.width, canvas.height - bottom)
  }

  render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    this.renderBackground()

    GameGlobal.databus.towers.forEach((t) => t.render(ctx))
    GameGlobal.databus.enemys.forEach((e) => e.render(ctx))
    GameGlobal.databus.bullets.forEach((b) => b.render(ctx))
    this.gameInfo.render(ctx)
  }

  loop() {
    this.update()
    this.render()
    this.aniId = requestAnimationFrame(this.loop.bind(this))
  }
}

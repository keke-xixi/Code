import './render'
import CONFIG from './config/game.config'
import { getLevelById } from './config/levels.config'
import DataBus from './databus'
import Enemy from './enemy/index'
import GameInfo from './runtime/gameinfo'
import Background from './runtime/background'
import Music from './runtime/music'
import Particles from './base/particles'
import { drawSprite, waitForAssets } from './base/assets'
import { buildPathPoints, buildSlotPoints, getScale } from './map/layout'

const ctx = canvas.getContext('2d')

GameGlobal.databus = new DataBus()
GameGlobal.CONFIG = CONFIG
GameGlobal.particles = new Particles()

export default class Main {
  aniId = 0
  gameInfo = new GameInfo()
  background = new Background()
  loading = true

  constructor() {
    this.gameInfo.on('startLevel', (id) => this.startLevel(id))
    this.gameInfo.on('restart', () => this.startLevel(GameGlobal.databus.levelId))
    this.gameInfo.on('menu', () => this.showMenu())
    this.gameInfo.bindTouch()
    waitForAssets().then(() => {
      this.loading = false
      GameGlobal.musicManager = new Music()
      this.showMenu()
    })
    this.loop()
  }

  showMenu() {
    const db = GameGlobal.databus
    db.scene = 'menu'
    db.isGameOver = false
    db.isVictory = false
    db.selectedSlotIndex = -1
    db.selectedTower = null
    db.moveMode = false
    db.showExitConfirm = false
  }

  startLevel(levelId) {
    GameGlobal.levelConfig = getLevelById(levelId)
    GameGlobal.pathPoints = buildPathPoints()
    GameGlobal.databus.reset(levelId)
    this.prepareWave()
    cancelAnimationFrame(this.aniId)
    this.aniId = requestAnimationFrame(this.loop.bind(this))
  }

  prepareWave() {
    const db = GameGlobal.databus
    const waves = GameGlobal.levelConfig.waves
    const wave = waves[db.waveIndex]
    if (!wave) { db.victory(); return }
    db.waveDelayLeft = wave.delay
    db.spawnQueue = []
    wave.groups.forEach((g) => {
      for (let i = 0; i < g.count; i += 1) db.spawnQueue.push({ type: g.type, wait: i * g.gap })
    })
    db.spawning = true
  }

  spawnTick() {
    const db = GameGlobal.databus
    if (!db.spawning) return
    if (db.waveDelayLeft > 0) { db.waveDelayLeft -= 1; return }

    if (!db.spawnQueue.length) {
      if (db.enemys.length === 0) {
        db.waveIndex += 1
        db.spawning = false
        const total = GameGlobal.levelConfig.waves.length
        if (db.waveIndex >= total) db.victory()
        else this.prepareWave()
      }
      return
    }

    const next = db.spawnQueue[0]
    if (next.wait > 0) { next.wait -= 1; return }
    db.spawnQueue.shift()
    const enemy = db.pool.getItemByClass('enemy', Enemy)
    enemy.init(next.type)
    db.enemys.push(enemy)
  }

  update() {
    if (this.loading) return
    const db = GameGlobal.databus
    if (db.scene !== 'playing' || db.isGameOver) return

    db.frame += 1
    this.background.update()
    this.spawnTick()
    db.towers.forEach((t) => t.update())
    db.enemys.forEach((e) => e.update())
    db.bullets.forEach((b) => b.update())
    GameGlobal.particles.update()
  }

  renderSlots() {
    const db = GameGlobal.databus
    const scale = getScale()
    const nestSize = CONFIG.scale.slotNestSize * scale
    buildSlotPoints().forEach((s) => {
      const unlocked = db.isSlotUnlocked(s.index)
      const selected = db.selectedSlotIndex === s.index
      const moveTarget = db.moveMode && unlocked && !db.getTowerAtSlot(s.index)

      if (!unlocked) {
        ctx.globalAlpha = 0.55
        ctx.strokeStyle = selected ? '#FFD54F' : 'rgba(255,255,255,0.45)'
        ctx.lineWidth = selected ? 3 : 2
        ctx.setLineDash([6, 5])
        ctx.beginPath()
        ctx.ellipse(s.x, s.y + nestSize * 0.06, nestSize * 0.5, nestSize * 0.18, 0, 0, Math.PI * 2)
        ctx.stroke()
        ctx.setLineDash([])
        ctx.fillStyle = 'rgba(0,0,0,0.25)'
        ctx.font = `bold ${Math.floor(16 * scale)}px sans-serif`
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText('🔒', s.x, s.y)
        ctx.globalAlpha = 1
        return
      }

      if (selected || moveTarget) {
        ctx.strokeStyle = moveTarget ? '#4FC3F7' : 'rgba(255,235,59,0.85)'
        ctx.lineWidth = 3
        ctx.beginPath()
        ctx.ellipse(s.x, s.y + nestSize * 0.08, nestSize * 0.55, nestSize * 0.2, 0, 0, Math.PI * 2)
        ctx.stroke()
      }
      if (db.isSlotPermanent(s.index)) {
        ctx.strokeStyle = 'rgba(255,213,79,0.5)'
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.arc(s.x, s.y - nestSize * 0.35, 5, 0, Math.PI * 2)
        ctx.stroke()
      }
      drawSprite(ctx, CONFIG.assets.slotNest, s.x, s.y, nestSize, { fallback: '#8D6E63' })
    })
  }

  renderLoading() {
    ctx.fillStyle = '#2C3E50'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.fillStyle = '#ECF0F1'
    ctx.font = 'bold 20px sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('🐔 鸡窝保卫战 加载中...', canvas.width / 2, canvas.height / 2)
  }

  render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    if (this.loading) {
      this.renderLoading()
      return
    }

    const db = GameGlobal.databus
    if (db.scene === 'menu') {
      this.gameInfo.renderMenu(ctx)
      return
    }

    this.background.render(ctx)
    this.renderSlots()
    db.towers.forEach((t) => t.render(ctx))
    db.enemys.forEach((e) => e.render(ctx))
    db.bullets.forEach((b) => b.render(ctx))
    GameGlobal.particles.render(ctx)
    this.gameInfo.render(ctx)
  }

  loop() {
    this.update()
    this.render()
    this.aniId = requestAnimationFrame(this.loop.bind(this))
  }
}

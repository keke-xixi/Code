import CONFIG from '../config/game.config'
import { drawSprite } from '../base/assets'
import { buildPathPoints, dist, getScale } from '../map/layout'

export default class Enemy {
  type = ''
  name = ''
  hp = 0
  maxHp = 0
  speed = 1
  reward = 0
  armor = 0
  pathIndex = 0
  x = 0
  y = 0
  visible = true
  isActive = true
  slowFactor = 1
  slowTicks = 0
  vulnFactor = 1
  vulnTicks = 0
  poisonDmg = 0
  poisonTicks = 0
  regen = 0
  isBoss = false
  size = 36
  facing = 1
  animPhase = Math.random() * 6
  hitFlash = 0
  sprite = ''

  init(type) {
    const cfg = CONFIG.enemies[type]
    const scale = getScale()
    this.type = type
    this.name = cfg.name
    this.sprite = CONFIG.assets.enemies[type]
    this.maxHp = cfg.hp * (1 + GameGlobal.databus.waveIndex * 0.08)
    this.hp = this.maxHp
    this.speed = cfg.speed * scale
    this.reward = cfg.reward
    this.armor = cfg.armor || 0
    this.regen = cfg.special?.regen || 0
    this.isBoss = !!cfg.special?.boss
    this.size = (cfg.size || 36) * scale
    this.pathIndex = 0
    this.slowFactor = 1
    this.slowTicks = 0
    this.vulnFactor = 1
    this.vulnTicks = 0
    this.poisonDmg = cfg.special?.poison || 0
    this.poisonTicks = 0
    this.hitFlash = 0
    this.visible = true
    this.isActive = true
    const pts = buildPathPoints()
    this.x = pts[0].x
    this.y = pts[0].y
  }

  applySlow(ratio, duration = 60) {
    this.slowFactor = Math.min(this.slowFactor, 1 - ratio)
    this.slowTicks = Math.max(this.slowTicks, duration)
  }

  applyVuln(ratio, duration = 60) {
    this.vulnFactor = Math.max(this.vulnFactor, 1 + ratio)
    this.vulnTicks = Math.max(this.vulnTicks, duration)
  }

  takeDamage(rawDmg, pierce = 0) {
    const dmg = rawDmg * this.vulnFactor * (1 - Math.max(0, this.armor - pierce))
    this.hp -= dmg
    this.hitFlash = 6
    if (this.hp <= 0) this.die()
  }

  update() {
    if (!this.isActive) return
    if (this.hitFlash > 0) this.hitFlash -= 1
    this.animPhase += 0.12

    if (this.slowTicks > 0) { this.slowTicks -= 1; if (this.slowTicks <= 0) this.slowFactor = 1 }
    if (this.vulnTicks > 0) { this.vulnTicks -= 1; if (this.vulnTicks <= 0) this.vulnFactor = 1 }
    if (this.poisonTicks > 0 && GameGlobal.databus.frame % 20 === 0) {
      this.hp -= this.poisonDmg
      this.poisonTicks -= 20
      if (this.hp <= 0) this.die()
    }
    if (this.regen > 0) this.hp = Math.min(this.maxHp, this.hp + this.regen)

    const pts = buildPathPoints()
    if (this.pathIndex >= pts.length - 1) {
      this.reachNest()
      return
    }

    const target = pts[this.pathIndex + 1]
    const dx = target.x - this.x
    const dy = target.y - this.y
    const len = Math.sqrt(dx * dx + dy * dy) || 1
    const step = this.speed * this.slowFactor
    this.facing = dx >= 0 ? 1 : -1

    if (len <= step) {
      this.x = target.x
      this.y = target.y
      this.pathIndex += 1
      if (this.pathIndex >= pts.length - 1) this.reachNest()
    } else {
      this.x += (dx / len) * step
      this.y += (dy / len) * step
    }
  }

  reachNest() {
    GameGlobal.databus.lives -= 1
    if (GameGlobal.databus.lives <= 0) GameGlobal.databus.gameOver()
    this.isActive = false
    this.visible = false
    GameGlobal.databus.removeEnemy(this)
  }

  die() {
    const rewardMul = CONFIG.game.rewardMul || 1
    GameGlobal.databus.coins += Math.round(this.reward * rewardMul)
    GameGlobal.particles?.burst(this.x, this.y, CONFIG.enemies[this.type].color, this.isBoss ? 18 : 10)
    this.isActive = false
    this.visible = false
    GameGlobal.databus.removeEnemy(this)
  }

  render(ctx) {
    if (!this.visible) return
    const bobY = Math.sin(this.animPhase) * (this.isBoss ? 4 : 2)
    const wobble = this.hitFlash > 0 ? (this.hitFlash % 2 ? 3 : -3) : 0

    ctx.fillStyle = 'rgba(0,0,0,0.18)'
    ctx.beginPath()
    ctx.ellipse(this.x, this.y + this.size * 0.35, this.size * 0.35, this.size * 0.1, 0, 0, Math.PI * 2)
    ctx.fill()

    drawSprite(ctx, this.sprite, this.x + wobble, this.y, this.size, {
      scaleX: this.facing,
      bobY,
      fallback: CONFIG.enemies[this.type].color,
      alpha: this.hitFlash > 0 ? 0.85 : 1,
    })

    const barW = this.isBoss ? 56 : 40
    ctx.fillStyle = 'rgba(0,0,0,0.5)'
    roundRect(ctx, this.x - barW / 2, this.y - this.size * 0.65, barW, 6, 3)
    ctx.fill()
    ctx.fillStyle = this.hp / this.maxHp > 0.35 ? '#2ECC71' : '#E74C3C'
    roundRect(ctx, this.x - barW / 2, this.y - this.size * 0.65, barW * (this.hp / this.maxHp), 6, 3)
    ctx.fill()

    if (this.isBoss) {
      ctx.fillStyle = '#fff'
      ctx.font = 'bold 10px sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText('BOSS', this.x, this.y - this.size * 0.75)
    }
  }
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

export function findTarget(tower, range) {
  let best = null
  let bestDist = range
  GameGlobal.databus.enemys.forEach((e) => {
    if (!e.isActive) return
    const d = dist(tower, e)
    if (d <= range && d < bestDist) { best = e; bestDist = d }
  })
  return best
}

export function findInRange(x, y, range) {
  return GameGlobal.databus.enemys.filter((e) => e.isActive && dist({ x, y }, e) <= range)
}

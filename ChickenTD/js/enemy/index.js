import CONFIG from '../config/game.config'
import { buildPathPoints, dist, getScale } from '../map/layout'

export default class Enemy {
  type = ''
  name = ''
  color = '#fff'
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
  radius = 14

  init(type) {
    const cfg = CONFIG.enemies[type]
    const scale = getScale()
    this.type = type
    this.name = cfg.name
    this.color = cfg.color
    this.maxHp = cfg.hp * (1 + GameGlobal.databus.waveIndex * 0.08)
    this.hp = this.maxHp
    this.speed = cfg.speed * scale
    this.reward = cfg.reward
    this.armor = cfg.armor || 0
    this.regen = cfg.special?.regen || 0
    this.isBoss = !!cfg.special?.boss
    this.radius = this.isBoss ? 20 * scale : 14 * scale
    this.pathIndex = 0
    this.slowFactor = 1
    this.slowTicks = 0
    this.vulnFactor = 1
    this.vulnTicks = 0
    this.poisonDmg = cfg.special?.poison || 0
    this.poisonTicks = 0
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

  applyPoison(dmg, ticks) {
    this.poisonDmg = Math.max(this.poisonDmg, dmg)
    this.poisonTicks = Math.max(this.poisonTicks, ticks)
  }

  takeDamage(rawDmg, pierce = 0) {
    const effectiveArmor = Math.max(0, this.armor - pierce)
    const dmg = rawDmg * this.vulnFactor * (1 - effectiveArmor)
    this.hp -= dmg
    return dmg
  }

  update() {
    if (!this.isActive) return

    if (this.slowTicks > 0) {
      this.slowTicks -= 1
      if (this.slowTicks <= 0) this.slowFactor = 1
    }
    if (this.vulnTicks > 0) {
      this.vulnTicks -= 1
      if (this.vulnTicks <= 0) this.vulnFactor = 1
    }
    if (this.poisonTicks > 0 && GameGlobal.databus.frame % 20 === 0) {
      this.hp -= this.poisonDmg
      this.poisonTicks -= 20
    }
    if (this.regen > 0) {
      this.hp = Math.min(this.maxHp, this.hp + this.regen)
    }

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

    if (len <= step) {
      this.x = target.x
      this.y = target.y
      this.pathIndex += 1
      if (this.pathIndex >= pts.length - 1) {
        this.reachNest()
      }
    } else {
      this.x += (dx / len) * step
      this.y += (dy / len) * step
    }

    if (this.hp <= 0) this.die()
  }

  reachNest() {
    GameGlobal.databus.lives -= 1
    if (GameGlobal.databus.lives <= 0) GameGlobal.databus.gameOver()
    this.isActive = false
    this.visible = false
    GameGlobal.databus.removeEnemy(this)
  }

  die() {
    GameGlobal.databus.coins += this.reward
    this.isActive = false
    this.visible = false
    GameGlobal.databus.removeEnemy(this)
  }

  render(ctx) {
    if (!this.visible) return
    const scale = getScale()

    ctx.fillStyle = this.color
    ctx.beginPath()
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2)
    ctx.fill()

    ctx.strokeStyle = '#222'
    ctx.lineWidth = this.isBoss ? 3 : 1.5
    ctx.stroke()

    ctx.fillStyle = '#fff'
    ctx.font = `${Math.floor(10 * scale)}px sans-serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(this.isBoss ? '妖' : this.name[0], this.x, this.y)

    const barW = this.isBoss ? 40 * scale : 28 * scale
    ctx.fillStyle = '#333'
    ctx.fillRect(this.x - barW / 2, this.y - this.radius - 10, barW, 4)
    ctx.fillStyle = '#E74C3C'
    ctx.fillRect(this.x - barW / 2, this.y - this.radius - 10, barW * (this.hp / this.maxHp), 4)
  }
}

/** 找范围内最近敌人 */
export function findTarget(tower, range) {
  let best = null
  let bestDist = range
  GameGlobal.databus.enemys.forEach((e) => {
    if (!e.isActive) return
    const d = dist(tower, e)
    if (d <= range && d < bestDist) {
      best = e
      bestDist = d
    }
  })
  return best
}

/** 范围内所有敌人 */
export function findInRange(x, y, range) {
  return GameGlobal.databus.enemys.filter((e) => e.isActive && dist({ x, y }, e) <= range)
}

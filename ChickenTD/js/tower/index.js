import CONFIG from '../config/game.config'
import { findInRange, findTarget } from '../enemy/index'
import { drawStars, getScale } from '../map/layout'

export default class Tower {
  type = ''
  star = 1
  slotIndex = 0
  x = 0
  y = 0
  cooldown = 0
  pulseCooldown = 0
  visible = true

  init(type, slotIndex, x, y) {
    this.type = type
    this.star = 1
    this.slotIndex = slotIndex
    this.x = x
    this.y = y
    this.cooldown = 0
    this.pulseCooldown = 0
    this.visible = true
  }

  getCfg() {
    return CONFIG.towers[this.type]
  }

  getStats() {
    return this.getCfg().stars[this.star]
  }

  getName() {
    return this.getCfg().name
  }

  getColor() {
    return this.getCfg().color
  }

  canUpgrade() {
    return this.star < CONFIG.game.maxStar
  }

  upgradeCost() {
    if (!this.canUpgrade()) return Infinity
    return this.getCfg().starUpgradeCost[this.star + 1]
  }

  tryUpgrade() {
    const cost = this.upgradeCost()
    const db = GameGlobal.databus
    if (!this.canUpgrade() || db.coins < cost) return false
    db.coins -= cost
    this.star += 1
    return true
  }

  update() {
    if (this.cooldown > 0) this.cooldown -= 1
    if (this.pulseCooldown > 0) this.pulseCooldown -= 1

    const stats = this.getStats()
    const scale = getScale()
    const range = stats.range * scale
    const sp = stats.special || {}

    if (this.type === 'satellite' && sp.pulseInterval && this.pulseCooldown <= 0) {
      this.pulseCooldown = sp.pulseInterval
      GameGlobal.databus.enemys.forEach((e) => {
        if (!e.isActive) return
        e.applySlow(sp.pulseSlow, 90)
        e.takeDamage(sp.pulseDmg)
      })
    }

    if (this.cooldown > 0) return

    if (this.type === 'rooster') {
      const targets = findInRange(this.x, this.y, range)
      if (!targets.length) return
      this.cooldown = stats.interval
      targets.forEach((e) => {
        e.applySlow(sp.slow, 50)
        e.takeDamage(stats.damage)
      })
      return
    }

    if (this.type === 'kun') {
      const targets = findInRange(this.x, this.y, range)
      if (!targets.length) return
      this.cooldown = stats.interval
      targets.forEach((e) => {
        e.applyVuln(sp.vuln, 70)
        e.takeDamage(stats.damage)
      })
      return
    }

    const target = findTarget(this, range)
    if (!target) return

    this.cooldown = stats.interval
    let dmg = stats.damage

    if (sp.crit && Math.random() < sp.crit) {
      dmg *= sp.critMul || 2
    }

    if (this.type === 'fighter' || this.type === 'chick' || this.type === 'kungfu') {
      const bullet = GameGlobal.databus.pool.getItemByClass('bullet', Bullet)
      bullet.init(this.x, this.y, target, dmg, sp.armorPierce || 0, this.getColor())
      GameGlobal.databus.bullets.push(bullet)
      return
    }

    target.takeDamage(dmg, sp.armorPierce || 0)
  }

  render(ctx) {
    if (!this.visible) return
    const scale = getScale()
    const r = CONFIG.scale.towerRadius * scale * (1 + (this.star - 1) * 0.08)

    ctx.fillStyle = this.getColor()
    ctx.beginPath()
    ctx.arc(this.x, this.y, r, 0, Math.PI * 2)
    ctx.fill()
    ctx.strokeStyle = '#5D4037'
    ctx.lineWidth = 2
    ctx.stroke()

    ctx.fillStyle = '#fff'
    ctx.font = `bold ${Math.floor(11 * scale)}px sans-serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(this.getName()[0], this.x, this.y)

    drawStars(ctx, this.x, this.y - r - 8, this.star, CONFIG.game.maxStar)

    if (GameGlobal.databus.selectedTower === this) {
      const stats = this.getStats()
      ctx.strokeStyle = 'rgba(255,255,255,0.35)'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.arc(this.x, this.y, stats.range * scale, 0, Math.PI * 2)
      ctx.stroke()
    }
  }
}

class Bullet {
  x = 0
  y = 0
  target = null
  damage = 0
  pierce = 0
  speed = 8
  color = '#fff'
  isActive = true

  init(x, y, target, damage, pierce, color) {
    this.x = x
    this.y = y
    this.target = target
    this.damage = damage
    this.pierce = pierce
    this.color = color
    this.isActive = true
    this.speed = 9 * getScale()
  }

  update() {
    if (!this.isActive || !this.target?.isActive) {
      this.isActive = false
      GameGlobal.databus.removeBullet(this)
      return
    }
    const dx = this.target.x - this.x
    const dy = this.target.y - this.y
    const len = Math.sqrt(dx * dx + dy * dy) || 1
    if (len < this.speed) {
      this.target.takeDamage(this.damage, this.pierce)
      this.isActive = false
      GameGlobal.databus.removeBullet(this)
    } else {
      this.x += (dx / len) * this.speed
      this.y += (dy / len) * this.speed
    }
  }

  render(ctx) {
    if (!this.isActive) return
    ctx.fillStyle = this.color
    ctx.beginPath()
    ctx.arc(this.x, this.y, 4, 0, Math.PI * 2)
    ctx.fill()
  }
}

export { Bullet }

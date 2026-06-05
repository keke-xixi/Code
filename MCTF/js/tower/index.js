import CONFIG from '../config/game.config'
import { drawSprite } from '../base/assets'
import { findInRange, findTarget } from '../enemy/index'
import { drawStars, getScale } from '../map/layout'

function effDmg(value) {
  return Math.round(value * (CONFIG.game.towerDamageMul || 1))
}

function effRange(range, scale) {
  return range * scale * (CONFIG.game.towerRangeMul || 1)
}

export default class Tower {
  type = ''
  star = 1
  slotIndex = 0
  x = 0
  y = 0
  cooldown = 0
  pulseCooldown = 0
  animPhase = Math.random() * 6
  attackAnim = 0
  visible = true

  init(type, slotIndex, x, y) {
    this.type = type
    this.star = 1
    this.slotIndex = slotIndex
    this.x = x
    this.y = y
    this.cooldown = 0
    this.pulseCooldown = 0
    this.attackAnim = 0
    this.visible = true
    GameGlobal.musicManager?.playBuild()
  }

  getCfg() { return CONFIG.towers[this.type] }
  getStats() { return this.getCfg().stars[this.star] }
  getSprite() { return CONFIG.assets.towers[this.type] }

  getRenderY() {
    const scale = getScale()
    const size = CONFIG.scale.towerSize * scale * (1 + (this.star - 1) * 0.06)
    return this.y - CONFIG.scale.towerSitOffset * scale - size * 0.08
  }

  canUpgrade() { return this.star < CONFIG.game.maxStar }
  upgradeCost() {
    if (!this.canUpgrade()) return Infinity
    return this.getCfg().starUpgradeCost[this.star + 1]
  }

  getTotalInvested() {
    const cfg = this.getCfg()
    let total = cfg.cost
    for (let s = 2; s <= this.star; s += 1) total += cfg.starUpgradeCost[s] || 0
    return total
  }

  getSellRefund() {
    return Math.floor(this.getTotalInvested() * CONFIG.game.sellRefundRate)
  }

  bumpStar() {
    if (!this.canUpgrade()) return false
    this.star += 1
    this.attackAnim = 12
    GameGlobal.particles?.burst(this.x, this.y, '#F1C40F', 14)
    return true
  }

  forceUpgrade() {
    return this.bumpStar()
  }

  tryUpgrade() {
    const cost = this.upgradeCost()
    const db = GameGlobal.databus
    if (!this.canUpgrade() || db.coins < cost) return false
    db.coins -= cost
    if (!this.bumpStar()) return false
    GameGlobal.musicManager?.playUpgrade()
    return true
  }

  triggerAttack() {
    this.attackAnim = 8
    GameGlobal.musicManager?.playShoot()
  }

  update() {
    if (this.cooldown > 0) this.cooldown -= 1
    if (this.pulseCooldown > 0) this.pulseCooldown -= 1
    if (this.attackAnim > 0) this.attackAnim -= 1
    this.animPhase += 0.08

    const stats = this.getStats()
    const scale = getScale()
    const range = effRange(stats.range, scale)
    const sp = stats.special || {}

    if (this.type === 'satellite' && sp.pulseInterval && this.pulseCooldown <= 0) {
      this.pulseCooldown = sp.pulseInterval
      this.triggerAttack()
      GameGlobal.databus.enemys.forEach((e) => {
        if (!e.isActive) return
        e.applySlow(sp.pulseSlow, 90)
        e.takeDamage(effDmg(sp.pulseDmg))
      })
      GameGlobal.particles?.burst(this.x, this.y, '#1ABC9C', 20)
    }

    if (this.cooldown > 0) return

    if (this.type === 'rooster') {
      const targets = findInRange(this.x, this.y, range)
      if (!targets.length) return
      this.cooldown = stats.interval
      this.triggerAttack()
      targets.forEach((e) => { e.applySlow(sp.slow, 50); e.takeDamage(effDmg(stats.damage)) })
      return
    }

    if (this.type === 'kun') {
      const targets = findInRange(this.x, this.y, range)
      if (!targets.length) return
      this.cooldown = stats.interval
      this.triggerAttack()
      targets.forEach((e) => { e.applyVuln(sp.vuln, 70); e.takeDamage(effDmg(stats.damage)) })
      return
    }

    const target = findTarget(this, range)
    if (!target) return

    this.cooldown = stats.interval
    this.triggerAttack()
    let dmg = effDmg(stats.damage)
    if (sp.crit && Math.random() < sp.crit) dmg *= sp.critMul || 2

    const bullet = GameGlobal.databus.pool.getItemByClass('bullet', Bullet)
    bullet.init(this.x, this.y - 8, target, dmg, sp.armorPierce || 0)
    GameGlobal.databus.bullets.push(bullet)
  }

  render(ctx) {
    if (!this.visible) return
    const scale = getScale()
    const base = CONFIG.scale.towerSize * scale * (1 + (this.star - 1) * 0.06)
    const punch = this.attackAnim > 0 ? 1 + this.attackAnim * 0.02 : 1
    const bobY = Math.sin(this.animPhase) * 2
    const size = base * punch
    const ry = this.getRenderY()

    if (GameGlobal.databus.selectedTower === this) {
      ctx.strokeStyle = 'rgba(255,255,255,0.25)'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.arc(this.x, ry, effRange(this.getStats().range, scale), 0, Math.PI * 2)
      ctx.stroke()
    }

    drawSprite(ctx, this.getSprite(), this.x, ry, size, { bobY, fallback: this.getCfg().color })
    drawStars(ctx, this.x, ry - size * 0.52, this.star, CONFIG.game.maxStar)
  }
}

class Bullet {
  x = 0
  y = 0
  target = null
  damage = 0
  pierce = 0
  speed = 10
  isActive = true

  init(x, y, target, damage, pierce) {
    this.x = x
    this.y = y
    this.target = target
    this.damage = damage
    this.pierce = pierce
    this.isActive = true
    this.speed = 11 * getScale()
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
      GameGlobal.particles?.burst(this.target.x, this.target.y, '#FFEB3B', 6)
      GameGlobal.musicManager?.playHit()
      this.isActive = false
      GameGlobal.databus.removeBullet(this)
    } else {
      this.x += (dx / len) * this.speed
      this.y += (dy / len) * this.speed
    }
  }

  render(ctx) {
    if (!this.isActive) return
    drawSprite(ctx, CONFIG.assets.bullet, this.x, this.y, 16 * getScale(), { fallback: '#FFD54F' })
  }
}

export { Bullet }

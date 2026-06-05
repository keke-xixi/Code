import Emitter from '../libs/tinyemitter'
import CONFIG from '../config/game.config'
import Tower from '../tower/index'
import { buildSlotPoints, dist, getPlayArea, getScale, roundRect } from '../map/layout'
import { SCREEN_WIDTH, SCREEN_HEIGHT } from '../render'

export default class GameInfo extends Emitter {
  bindTouch() {
    wx.onTouchStart(this.onTouch.bind(this))
  }

  onTouch(e) {
    const db = GameGlobal.databus
    if (db.isGameOver) {
      if (this.hitRestart(e)) this.emit('restart')
      return
    }

    const touch = e.touches[0]
    const x = touch.clientX
    const y = touch.clientY

    if (this.handleUpgradePanel(x, y)) return
    if (this.handleShop(x, y)) return
    if (this.handleSlotTap(x, y)) return
    if (this.handleTowerTap(x, y)) return

    db.selectedSlotIndex = -1
    db.selectedTower = null
    db.shopTowerId = null
  }

  hitRestart(e) {
    const touch = e.touches[0]
    const btn = this.getRestartBtn()
    return touch.clientX >= btn.x && touch.clientX <= btn.x + btn.w
      && touch.clientY >= btn.y && touch.clientY <= btn.y + btn.h
  }

  getUiTop() {
    return SCREEN_HEIGHT * (1 - CONFIG.game.uiHeight)
  }

  getHudBottom() {
    return SCREEN_HEIGHT * CONFIG.game.hudHeight
  }

  handleSlotTap(x, y) {
    const db = GameGlobal.databus
    const scale = getScale()
    const r = CONFIG.scale.slotRadius * scale * 1.2

    for (const s of buildSlotPoints()) {
      if (dist({ x, y }, s) > r) continue
      const existing = db.getTowerAtSlot(s.index)
      if (existing) {
        db.selectedTower = existing
        db.selectedSlotIndex = -1
        db.shopTowerId = null
        return true
      }
      db.selectedSlotIndex = s.index
      db.selectedTower = null
      db.shopTowerId = CONFIG.towerOrder[0]
      return true
    }
    return false
  }

  handleTowerTap(x, y) {
    const db = GameGlobal.databus
    const scale = getScale()

    for (const t of db.towers) {
      const r = CONFIG.scale.towerRadius * scale * 1.4
      if (dist({ x, y }, t) <= r) {
        db.selectedTower = t
        db.selectedSlotIndex = -1
        db.shopTowerId = null
        return true
      }
    }
    return false
  }

  handleShop(x, y) {
    const db = GameGlobal.databus
    if (db.selectedSlotIndex < 0) return false

    const uiTop = this.getUiTop()
    if (y < uiTop) return false

    const items = this.getShopItems()
    for (const item of items) {
      if (x >= item.x && x <= item.x + item.w && y >= item.y && y <= item.y + item.h) {
        db.shopTowerId = item.towerId
        this.buildTower(item.towerId)
        return true
      }
    }
    return false
  }

  buildTower(towerId) {
    const db = GameGlobal.databus
    const cfg = CONFIG.towers[towerId]
    const slot = buildSlotPoints()[db.selectedSlotIndex]
    if (!slot || db.coins < cfg.cost || db.getTowerAtSlot(slot.index)) return

    db.coins -= cfg.cost
    const tower = new Tower()
    tower.init(towerId, slot.index, slot.x, slot.y)
    db.towers.push(tower)
    db.selectedSlotIndex = -1
    db.shopTowerId = null
    db.selectedTower = tower
  }

  handleUpgradePanel(x, y) {
    const db = GameGlobal.databus
    if (!db.selectedTower) return false

    const panel = this.getUpgradePanel()
    if (x >= panel.upgrade.x && x <= panel.upgrade.x + panel.upgrade.w
      && y >= panel.upgrade.y && y <= panel.upgrade.y + panel.upgrade.h) {
      db.selectedTower.tryUpgrade()
      return true
    }
    if (x >= panel.close.x && x <= panel.close.x + panel.close.w
      && y >= panel.close.y && y <= panel.close.y + panel.close.h) {
      db.selectedTower = null
      return true
    }
    return false
  }

  getShopItems() {
    const uiTop = this.getUiTop()
    const scale = getScale()
    const list = CONFIG.towerOrder
    const pad = 8 * scale
    const w = (SCREEN_WIDTH - pad * (list.length + 1)) / list.length
    const h = SCREEN_HEIGHT * CONFIG.game.uiHeight - pad * 2

    return list.map((id, i) => ({
      towerId: id,
      action: 'build',
      x: pad + i * (w + pad),
      y: uiTop + pad,
      w,
      h,
    }))
  }

  getUpgradePanel() {
    const uiTop = this.getUiTop()
    const scale = getScale()
    const pad = 10 * scale
    const w = SCREEN_WIDTH - pad * 2
    const h = 56 * scale
    const y = uiTop + pad
    const btnW = w * 0.45
    return {
      upgrade: { x: pad, y, w: btnW, h },
      close: { x: pad + btnW + pad, y, w: btnW, h },
    }
  }

  getRestartBtn() {
    const w = 160
    const h = 44
    return {
      x: SCREEN_WIDTH / 2 - w / 2,
      y: SCREEN_HEIGHT / 2 + 40,
      w,
      h,
    }
  }

  renderHud(ctx) {
    const db = GameGlobal.databus
    const scale = getScale()
    const hudH = SCREEN_HEIGHT * CONFIG.game.hudHeight

    ctx.fillStyle = 'rgba(45,52,54,0.85)'
    ctx.fillRect(0, 0, SCREEN_WIDTH, hudH)

    ctx.fillStyle = '#fff'
    ctx.font = `bold ${Math.floor(13 * scale)}px sans-serif`
    ctx.textAlign = 'left'
    ctx.textBaseline = 'middle'
    ctx.fillText(`❤ ${db.lives}`, 12, hudH / 2)
    ctx.fillText(`🪙 ${db.coins}`, 80 * scale, hudH / 2)
    ctx.fillText(`🌊 ${Math.min(db.waveIndex + 1, CONFIG.waves.length)}/${CONFIG.waves.length}`, 160 * scale, hudH / 2)
    ctx.textAlign = 'right'
    ctx.fillText(CONFIG.game.title, SCREEN_WIDTH - 12, hudH / 2)
  }

  renderShop(ctx) {
    const db = GameGlobal.databus
    if (db.selectedSlotIndex < 0) return

    const uiTop = this.getUiTop()
    ctx.fillStyle = 'rgba(44,62,80,0.92)'
    ctx.fillRect(0, uiTop, SCREEN_WIDTH, SCREEN_HEIGHT - uiTop)

    ctx.fillStyle = '#ECF0F1'
    ctx.font = '14px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('选择防御鸡建造', SCREEN_WIDTH / 2, uiTop + 16)

    this.getShopItems().forEach((item) => {
      const cfg = CONFIG.towers[item.towerId]
      const canBuy = db.coins >= cfg.cost

      roundRect(ctx, item.x, item.y, item.w, item.h, 8)
      ctx.fillStyle = canBuy ? cfg.color : '#7F8C8D'
      ctx.fill()
      ctx.strokeStyle = '#fff'
      ctx.lineWidth = db.shopTowerId === item.towerId ? 3 : 1
      ctx.stroke()

      ctx.fillStyle = '#fff'
      ctx.font = 'bold 12px sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText(cfg.name, item.x + item.w / 2, item.y + item.h * 0.35)
      ctx.font = '11px sans-serif'
      ctx.fillText(`🪙${cfg.cost}`, item.x + item.w / 2, item.y + item.h * 0.65)
    })
  }

  renderUpgrade(ctx) {
    const db = GameGlobal.databus
    const t = db.selectedTower
    if (!t) return

    const uiTop = this.getUiTop()
    ctx.fillStyle = 'rgba(44,62,80,0.92)'
    ctx.fillRect(0, uiTop, SCREEN_WIDTH, SCREEN_HEIGHT - uiTop)

    const cfg = t.getCfg()
    const stats = t.getStats()
    ctx.fillStyle = '#ECF0F1'
    ctx.font = '14px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText(`${cfg.name}  ${'★'.repeat(t.star)}`, SCREEN_WIDTH / 2, uiTop + 18)
    ctx.font = '11px sans-serif'
    ctx.fillText(`伤害${stats.damage}  射程${stats.range}  间隔${stats.interval}`, SCREEN_WIDTH / 2, uiTop + 36)

    const panel = this.getUpgradePanel()

    roundRect(ctx, panel.upgrade.x, panel.upgrade.y, panel.upgrade.w, panel.upgrade.h, 8)
    ctx.fillStyle = t.canUpgrade() && db.coins >= t.upgradeCost() ? '#27AE60' : '#95A5A6'
    ctx.fill()
    ctx.fillStyle = '#fff'
    ctx.font = 'bold 13px sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    const upText = t.canUpgrade() ? `升星 🪙${t.upgradeCost()}` : '已满星'
    ctx.fillText(upText, panel.upgrade.x + panel.upgrade.w / 2, panel.upgrade.y + panel.upgrade.h / 2)

    roundRect(ctx, panel.close.x, panel.close.y, panel.close.w, panel.close.h, 8)
    ctx.fillStyle = '#E74C3C'
    ctx.fill()
    ctx.fillText('关闭', panel.close.x + panel.close.w / 2, panel.close.y + panel.close.h / 2)
  }

  renderGameOver(ctx) {
    const db = GameGlobal.databus
    if (!db.isGameOver) return

    ctx.fillStyle = 'rgba(0,0,0,0.65)'
    ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT)

    ctx.fillStyle = '#fff'
    ctx.font = 'bold 22px sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    const title = db.isVictory ? '🎉 鸡窝守住了！' : '💔 鸡窝被攻破'
    ctx.fillText(title, SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2 - 30)
    ctx.font = '14px sans-serif'
    ctx.fillText(`最终金币 ${db.coins}`, SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2)

    const btn = this.getRestartBtn()
    roundRect(ctx, btn.x, btn.y, btn.w, btn.h, 10)
    ctx.fillStyle = '#3498DB'
    ctx.fill()
    ctx.fillStyle = '#fff'
    ctx.font = 'bold 16px sans-serif'
    ctx.fillText('再来一局', btn.x + btn.w / 2, btn.y + btn.h / 2)
  }

  render(ctx) {
    this.renderHud(ctx)
    this.renderShop(ctx)
    this.renderUpgrade(ctx)
    this.renderGameOver(ctx)
  }
}

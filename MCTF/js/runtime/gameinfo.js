import Emitter from '../libs/tinyemitter'
import CONFIG from '../config/game.config'
import LEVELS from '../config/levels.config'
import { drawCoverImage, drawSprite, getImage } from '../base/assets'
import { addPermanentSlot, isLevelUnlocked } from '../base/progress'
import Tower from '../tower/index'
import {
  buildSlotPoints, dist, drawStars, getLevelConfig, getLevelSlots, getScale, getWaveCount, roundRect,
} from '../map/layout'
import { SCREEN_WIDTH, SCREEN_HEIGHT } from '../render'

const FPS = 60

export default class GameInfo extends Emitter {
  menuIndex = 0
  menuDragX = 0
  touchX = 0
  touchY = 0
  touchMoved = false
  touchStartScene = 'menu'

  bindTouch() {
    wx.onTouchStart(this.onTouchStart.bind(this))
    wx.onTouchMove(this.onTouchMove.bind(this))
    wx.onTouchEnd(this.onTouchEnd.bind(this))
  }

  onTouchStart(e) {
    const t = e.touches[0]
    this.touchX = t.clientX
    this.touchY = t.clientY
    this.touchMoved = false
    this.touchStartScene = GameGlobal.databus.scene
    if (GameGlobal.databus.scene === 'menu') return
    this.handleGameTouch(t.clientX, t.clientY, e)
  }

  onTouchMove(e) {
    if (GameGlobal.databus.scene !== 'menu') return
    const t = e.touches[0]
    const dx = t.clientX - this.touchX
    const dy = t.clientY - this.touchY
    if (Math.abs(dx) > 6 || Math.abs(dy) > 6) this.touchMoved = true
    this.menuDragX = dx
  }

  onTouchEnd() {
    const db = GameGlobal.databus
    if (db.scene !== 'menu') return
    if (this.touchStartScene !== 'menu') {
      this.menuDragX = 0
      return
    }

    const threshold = 45
    if (Math.abs(this.menuDragX) >= threshold) {
      if (this.menuDragX < 0 && this.menuIndex < LEVELS.length - 1) this.menuIndex += 1
      else if (this.menuDragX > 0 && this.menuIndex > 0) this.menuIndex -= 1
    } else if (!this.touchMoved) {
      this.handleMenuTap(this.touchX, this.touchY)
    }
    this.menuDragX = 0
  }

  isSelectionActive() {
    const db = GameGlobal.databus
    return db.selectedSlotIndex >= 0 || !!db.selectedTower
  }

  getBottomBar() {
    const h = SCREEN_HEIGHT * CONFIG.game.bottomBarHeight
    return { x: 0, y: SCREEN_HEIGHT - h, w: SCREEN_WIDTH, h }
  }

  getExitBtn() {
    const hudH = SCREEN_HEIGHT * CONFIG.game.hudHeight
    return { x: 8, y: 5, w: 48, h: hudH - 10 }
  }

  getExitConfirmBtns() {
    const y = SCREEN_HEIGHT / 2 + 18
    const w = 88
    const g = 12
    return {
      ok: { x: SCREEN_WIDTH / 2 - w - g / 2, y, w, h: 40 },
      cancel: { x: SCREEN_WIDTH / 2 + g / 2, y, w, h: 40 },
    }
  }

  handleGameTouch(x, y, e) {
    const db = GameGlobal.databus

    if (db.showExitConfirm) {
      const c = this.getExitConfirmBtns()
      if (this.inRect(x, y, c.ok)) {
        db.showExitConfirm = false
        this.emit('menu')
        return
      }
      if (this.inRect(x, y, c.cancel)) {
        db.showExitConfirm = false
        return
      }
      return
    }

    if (this.inRect(x, y, this.getExitBtn()) && !db.isGameOver) {
      db.showExitConfirm = true
      db.selectedSlotIndex = -1
      db.selectedTower = null
      db.moveMode = false
      return
    }

    if (db.isGameOver) {
      this.handleGameOverTouch(x, y)
      return
    }

    if (db.waveDelayLeft > 0 && this.inRect(x, y, this.getCountdownBtn())) {
      this.startWaveEarly()
      return
    }

    if (this.isSelectionActive()) {
      if (this.handleBottomBarTouch(x, y)) return
      const bar = this.getBottomBar()
      if (y < bar.y) {
        if (this.handleSlotTap(x, y)) return
        if (this.handleTowerTap(x, y)) return
        db.selectedSlotIndex = -1
        db.selectedTower = null
        db.moveMode = false
        return
      }
      return
    }

    if (this.handleSlotTap(x, y)) return
    if (this.handleTowerTap(x, y)) return
    db.selectedSlotIndex = -1
    db.selectedTower = null
    db.moveMode = false
  }

  getMenuCardMetrics() {
    return {
      cardW: SCREEN_WIDTH * 0.44,
      cardH: SCREEN_HEIGHT * 0.58,
      gap: 26,
      cardY: SCREEN_HEIGHT * 0.16,
    }
  }

  getMenuCardRect(i) {
    const m = this.getMenuCardMetrics()
    const spacing = m.cardW + m.gap
    const cx = SCREEN_WIDTH / 2 + (i - this.menuIndex) * spacing + this.menuDragX
    return {
      x: cx - m.cardW / 2,
      y: m.cardY,
      w: m.cardW,
      h: m.cardH,
      index: i,
      active: i === this.menuIndex,
    }
  }

  getMenuStartBtn() {
    const m = this.getMenuCardMetrics()
    return {
      x: SCREEN_WIDTH / 2 - 96,
      y: m.cardY + m.cardH + 14,
      w: 192,
      h: 44,
    }
  }

  handleMenuTap(x, y) {
    if (x < SCREEN_WIDTH * 0.12 && this.menuIndex > 0) {
      this.menuIndex -= 1
      return
    }
    if (x > SCREEN_WIDTH * 0.88 && this.menuIndex < LEVELS.length - 1) {
      this.menuIndex += 1
      return
    }

    const lv = LEVELS[this.menuIndex]
    if (!isLevelUnlocked(lv.id)) return
    const btn = this.getMenuStartBtn()
    const card = this.getMenuCardRect(this.menuIndex)
    if (this.inRect(x, y, btn) || this.inRect(x, y, card)) {
      this.emit('startLevel', lv.id)
    }
  }

  handleGameOverTouch(x, y) {
    const btns = this.getGameOverButtons()
    if (this.inRect(x, y, btns.retry)) this.emit('restart')
    else if (btns.next && this.inRect(x, y, btns.next)) this.emit('startLevel', GameGlobal.databus.levelId + 1)
    else if (this.inRect(x, y, btns.menu)) this.emit('menu')
  }

  handleSlotTap(x, y) {
    const db = GameGlobal.databus
    const r = CONFIG.scale.slotRadius * getScale() * 1.2
    for (const s of buildSlotPoints()) {
      if (dist({ x, y }, s) > r) continue

      if (db.moveMode && db.selectedTower) {
        if (!db.isSlotUnlocked(s.index) || db.getTowerAtSlot(s.index)) return true
        this.moveTower(db.selectedTower, s)
        return true
      }

      const existing = db.getTowerAtSlot(s.index)
      if (existing) {
        db.selectedTower = existing
        db.selectedSlotIndex = -1
        db.moveMode = false
        return true
      }

      db.selectedSlotIndex = s.index
      db.selectedTower = null
      db.moveMode = false
      return true
    }
    return false
  }

  handleTowerTap(x, y) {
    const db = GameGlobal.databus
    const r = CONFIG.scale.towerSize * getScale() * 0.55
    for (const t of db.towers) {
      if (dist({ x, y }, { x: t.x, y: t.getRenderY() }) <= r) {
        db.selectedTower = t
        db.selectedSlotIndex = -1
        db.moveMode = false
        return true
      }
    }
    return false
  }

  handleBottomBarTouch(x, y) {
    const db = GameGlobal.databus
    const bar = this.getBottomBar()
    if (y < bar.y) return false

    if (db.selectedTower) {
      const btns = this.getTowerButtons(bar)
      if (this.inRect(x, y, btns.upgrade)) { db.selectedTower.tryUpgrade(); return true }
      if (this.inRect(x, y, btns.move)) { db.moveMode = !db.moveMode; return true }
      if (this.inRect(x, y, btns.sell)) { this.sellTower(db.selectedTower); return true }
      if (this.inRect(x, y, btns.close)) { db.selectedTower = null; db.moveMode = false; return true }
      return true
    }

    if (db.selectedSlotIndex >= 0) {
      const slot = buildSlotPoints()[db.selectedSlotIndex]
      if (slot && !db.isSlotUnlocked(slot.index)) {
        const btns = this.getNestButtons(bar)
        if (this.inRect(x, y, btns.rent)) { this.rentNest(slot.index); return true }
        if (!db.isSlotPermanent(slot.index) && this.inRect(x, y, btns.permanent)) {
          this.permanentNest(slot.index)
          return true
        }
        if (this.inRect(x, y, btns.close)) { db.selectedSlotIndex = -1; return true }
        return true
      }

      for (const item of this.getShopItems(bar)) {
        if (this.inRect(x, y, item)) {
          this.buildTower(item.towerId)
          return true
        }
      }
      return true
    }
    return false
  }

  inRect(x, y, r) {
    return x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h
  }

  startWaveEarly() {
    const db = GameGlobal.databus
    if (db.waveDelayLeft <= 0) return
    const bonus = getLevelConfig().earlyWaveBonus || 15
    db.coins += bonus
    db.waveDelayLeft = 0
    GameGlobal.particles?.burst(SCREEN_WIDTH / 2, SCREEN_HEIGHT * 0.2, '#FFD54F', 12)
  }

  buildTower(towerId) {
    const db = GameGlobal.databus
    const cfg = CONFIG.towers[towerId]
    const slot = buildSlotPoints()[db.selectedSlotIndex]
    if (!slot || !db.isSlotUnlocked(slot.index) || db.coins < cfg.cost || db.getTowerAtSlot(slot.index)) return
    db.coins -= cfg.cost
    const tower = new Tower()
    tower.init(towerId, slot.index, slot.x, slot.y)
    db.towers.push(tower)
    db.selectedSlotIndex = -1
    db.selectedTower = tower
  }

  rentNest(slotIndex) {
    const db = GameGlobal.databus
    const level = getLevelConfig()
    const cost = level.nestRentCost
    if (db.isSlotUnlocked(slotIndex) || db.coins < cost) return
    db.coins -= cost
    db.unlockSlot(slotIndex, false)
    db.selectedSlotIndex = slotIndex
    GameGlobal.particles?.burst(buildSlotPoints()[slotIndex].x, buildSlotPoints()[slotIndex].y, '#8D6E63', 10)
  }

  permanentNest(slotIndex) {
    const db = GameGlobal.databus
    const level = getLevelConfig()
    const cost = level.nestPermanentCost
    if (db.isSlotUnlocked(slotIndex) || db.coins < cost) return
    db.coins -= cost
    db.unlockSlot(slotIndex, true)
    addPermanentSlot(db.levelId, slotIndex)
    db.selectedSlotIndex = slotIndex
    GameGlobal.particles?.burst(buildSlotPoints()[slotIndex].x, buildSlotPoints()[slotIndex].y, '#FFD54F', 18)
  }

  sellTower(tower) {
    const db = GameGlobal.databus
    if (!tower) return
    db.coins += tower.getSellRefund()
    GameGlobal.particles?.burst(tower.x, tower.y, '#FFD54F', 16)
    db.removeTower(tower)
  }

  moveTower(tower, slot) {
    const db = GameGlobal.databus
    const level = getLevelConfig()
    const cost = level.moveCost
    if (!tower || !slot || db.coins < cost) return
    db.coins -= cost
    tower.slotIndex = slot.index
    tower.x = slot.x
    tower.y = slot.y
    db.moveMode = false
    GameGlobal.particles?.burst(slot.x, slot.y, '#4FC3F7', 10)
  }

  drawActionBtn(ctx, rect, main, sub, bg, enabled = true) {
    roundRect(ctx, rect.x, rect.y, rect.w, rect.h, 8)
    ctx.fillStyle = enabled ? bg : '#607D8B'
    ctx.fill()
    ctx.strokeStyle = 'rgba(255,255,255,0.85)'
    ctx.lineWidth = 2
    ctx.stroke()
    ctx.fillStyle = '#FFFFFF'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.font = 'bold 12px sans-serif'
    const cy = rect.y + rect.h / 2
    if (sub) {
      ctx.fillText(main, rect.x + rect.w / 2, cy - 8)
      ctx.font = '10px sans-serif'
      ctx.fillText(sub, rect.x + rect.w / 2, cy + 9)
    } else {
      ctx.fillText(main, rect.x + rect.w / 2, cy)
    }
  }

  getCountdownBtn() {
    const hudH = SCREEN_HEIGHT * CONFIG.game.hudHeight
    return { x: SCREEN_WIDTH / 2 - 90, y: hudH + 6, w: 180, h: 34 }
  }

  getShopItems(bar) {
    const list = CONFIG.towerOrder
    const gap = 6
    const pad = 10
    const itemW = (bar.w - pad * 2 - gap * (list.length - 1)) / list.length
    const itemH = bar.h - 28
    const startY = bar.y + 22
    return list.map((id, i) => ({
      towerId: id,
      x: bar.x + pad + i * (itemW + gap),
      y: startY,
      w: itemW,
      h: itemH,
    }))
  }

  getTowerButtons(bar) {
    const h = 44
    const gap = 8
    const y = bar.y + bar.h / 2 - h / 2 + 4
    const right = bar.x + bar.w - 10
    const closeW = 56
    const sellW = 76
    const moveW = 76
    const upgradeW = 88
    const closeX = right - closeW
    const sellX = closeX - gap - sellW
    const moveX = sellX - gap - moveW
    const upgradeX = moveX - gap - upgradeW
    return {
      upgrade: { x: upgradeX, y, w: upgradeW, h },
      move: { x: moveX, y, w: moveW, h },
      sell: { x: sellX, y, w: sellW, h },
      close: { x: closeX, y, w: closeW, h },
    }
  }

  getNestButtons(bar) {
    const h = 42
    const y = bar.y + bar.h / 2 - h / 2 + 6
    const closeW = 48
    const permW = 140
    const rentW = 120
    const gap = 8
    const right = bar.x + bar.w - 12
    const closeX = right - closeW
    const permX = closeX - gap - permW
    const rentX = permX - gap - rentW
    return {
      rent: { x: rentX, y, w: rentW, h },
      permanent: { x: permX, y, w: permW, h },
      close: { x: closeX, y, w: closeW, h },
    }
  }

  getGameOverButtons() {
    const db = GameGlobal.databus
    const y = SCREEN_HEIGHT / 2 + 44
    const h = 44
    const hasNext = db.isVictory && db.levelId < 3 && isLevelUnlocked(db.levelId + 1)
    if (hasNext) {
      const w = 120
      const gap = 12
      const total = w * 3 + gap * 2
      const startX = SCREEN_WIDTH / 2 - total / 2
      return {
        retry: { x: startX, y, w, h },
        next: { x: startX + w + gap, y, w, h },
        menu: { x: startX + (w + gap) * 2, y, w, h },
      }
    }
    const w = 140
    const gap = 16
    return {
      retry: { x: SCREEN_WIDTH / 2 - w - gap / 2, y, w, h },
      next: null,
      menu: { x: SCREEN_WIDTH / 2 + gap / 2, y, w, h },
    }
  }

  renderMenuCard(ctx, card, lv, unlocked) {
    const menu = lv.menu || {}
    const accent = menu.accent || '#66BB6A'
    const accentDark = menu.accentDark || '#2E7D32'
    const scale = card.active ? 1 : 0.88
    const cx = card.x + card.w / 2
    const cy = card.y + card.h / 2
    const w = card.w * scale
    const h = card.h * scale
    const x = cx - w / 2
    const y = cy - h / 2

    ctx.save()
    ctx.globalAlpha = card.active ? 1 : 0.72

    roundRect(ctx, x, y, w, h, 16)
    ctx.save()
    ctx.clip()
    const imgSrc = CONFIG.assets.levelCards[lv.id]
    if (!drawCoverImage(ctx, imgSrc, x, y, w, h * 0.72)) {
      const g = ctx.createLinearGradient(x, y, x, y + h)
      g.addColorStop(0, accent)
      g.addColorStop(1, accentDark)
      ctx.fillStyle = g
      ctx.fillRect(x, y, w, h * 0.72)
    }
    const infoG = ctx.createLinearGradient(x, y + h * 0.55, x, y + h)
    infoG.addColorStop(0, 'rgba(0,0,0,0)')
    infoG.addColorStop(1, 'rgba(0,0,0,0.75)')
    ctx.fillStyle = infoG
    ctx.fillRect(x, y + h * 0.5, w, h * 0.5)
    ctx.restore()

    roundRect(ctx, x, y, w, h, 16)
    ctx.strokeStyle = card.active ? accent : 'rgba(255,255,255,0.35)'
    ctx.lineWidth = card.active ? 4 : 2
    ctx.stroke()

    ctx.fillStyle = '#FFFFFF'
    ctx.textAlign = 'left'
    ctx.textBaseline = 'alphabetic'
    ctx.font = 'bold 18px sans-serif'
    ctx.fillText(`第${lv.id}关 ${lv.name}`, x + 14, y + h - 52)
    ctx.font = '12px sans-serif'
    ctx.fillStyle = 'rgba(255,255,255,0.9)'
    const freeNests = getLevelSlots(lv).filter((s) => s.free).length
    ctx.fillText(`${lv.desc} · ${freeNests}窝 · ${lv.waves.length}波`, x + 14, y + h - 30)

    if (!unlocked) {
      ctx.fillStyle = 'rgba(0,0,0,0.55)'
      roundRect(ctx, x, y, w, h, 16)
      ctx.fill()
      ctx.fillStyle = '#ECEFF1'
      ctx.font = 'bold 22px sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText('🔒 未解锁', cx, cy)
      ctx.font = '12px sans-serif'
      ctx.fillText('通关上一关解锁', cx, cy + 26)
    }
    ctx.restore()
  }

  renderMenu(ctx) {
    const bg = getImage(CONFIG.assets.menuBg)
    if (bg._loaded) {
      drawCoverImage(ctx, CONFIG.assets.menuBg, 0, 0, SCREEN_WIDTH, SCREEN_HEIGHT)
      ctx.fillStyle = 'rgba(0,0,0,0.35)'
      ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT)
    } else {
      const g = ctx.createLinearGradient(0, 0, 0, SCREEN_HEIGHT)
      g.addColorStop(0, '#5D8A52')
      g.addColorStop(1, '#2E5230')
      ctx.fillStyle = g
      ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT)
    }

    ctx.fillStyle = '#FFFFFF'
    ctx.font = 'bold 26px sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.shadowColor = 'rgba(0,0,0,0.5)'
    ctx.shadowBlur = 6
    ctx.fillText('鸡窝保卫战', SCREEN_WIDTH / 2, SCREEN_HEIGHT * 0.08)
    ctx.shadowBlur = 0
    ctx.font = '13px sans-serif'
    ctx.fillStyle = 'rgba(255,255,255,0.85)'
    ctx.fillText('左右滑动选关', SCREEN_WIDTH / 2, SCREEN_HEIGHT * 0.08 + 28)

    if (this.menuIndex > 0) {
      ctx.fillStyle = 'rgba(255,255,255,0.7)'
      ctx.font = 'bold 28px sans-serif'
      ctx.fillText('‹', SCREEN_WIDTH * 0.06, SCREEN_HEIGHT * 0.48)
    }
    if (this.menuIndex < LEVELS.length - 1) {
      ctx.fillStyle = 'rgba(255,255,255,0.7)'
      ctx.font = 'bold 28px sans-serif'
      ctx.fillText('›', SCREEN_WIDTH * 0.94, SCREEN_HEIGHT * 0.48)
    }

    LEVELS.forEach((lv, i) => {
      const card = this.getMenuCardRect(i)
      if (card.x + card.w < -20 || card.x > SCREEN_WIDTH + 20) return
      this.renderMenuCard(ctx, card, lv, isLevelUnlocked(lv.id))
    })

    const dotsY = this.getMenuCardMetrics().cardY + this.getMenuCardMetrics().cardH + 4
    LEVELS.forEach((_, i) => {
      ctx.beginPath()
      ctx.arc(SCREEN_WIDTH / 2 + (i - 1) * 16, dotsY, i === this.menuIndex ? 6 : 4, 0, Math.PI * 2)
      ctx.fillStyle = i === this.menuIndex ? '#FFD54F' : 'rgba(255,255,255,0.45)'
      ctx.fill()
    })

    const cur = LEVELS[this.menuIndex]
    const unlocked = isLevelUnlocked(cur.id)
    const btn = this.getMenuStartBtn()
    roundRect(ctx, btn.x, btn.y, btn.w, btn.h, 12)
    ctx.fillStyle = unlocked ? (cur.menu?.accentDark || '#2E7D32') : '#607D8B'
    ctx.fill()
    ctx.strokeStyle = 'rgba(255,255,255,0.8)'
    ctx.lineWidth = 2
    ctx.stroke()
    ctx.fillStyle = '#FFFFFF'
    ctx.font = 'bold 16px sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(unlocked ? '开始挑战' : '尚未解锁', btn.x + btn.w / 2, btn.y + btn.h / 2)
  }

  renderHud(ctx) {
    const db = GameGlobal.databus
    const level = getLevelConfig()
    const hudH = SCREEN_HEIGHT * CONFIG.game.hudHeight
    const g = ctx.createLinearGradient(0, 0, 0, hudH)
    g.addColorStop(0, 'rgba(76,120,68,0.95)')
    g.addColorStop(1, 'rgba(56,94,52,0.98)')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, SCREEN_WIDTH, hudH)

    const exit = this.getExitBtn()
    roundRect(ctx, exit.x, exit.y, exit.w, exit.h, 8)
    ctx.fillStyle = 'rgba(46,125,50,0.9)'
    ctx.fill()
    ctx.strokeStyle = 'rgba(255,255,255,0.45)'
    ctx.lineWidth = 1.5
    ctx.stroke()
    ctx.fillStyle = '#fff'
    ctx.font = 'bold 13px sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('退出', exit.x + exit.w / 2, exit.y + exit.h / 2)

    ctx.fillStyle = '#FFEB3B'
    ctx.font = `bold ${Math.floor(15 * getScale())}px sans-serif`
    ctx.textAlign = 'left'
    ctx.fillText(`❤ ${db.lives}`, exit.x + exit.w + 10, hudH / 2)
    ctx.fillStyle = '#fff'
    ctx.fillText(`🪙 ${db.coins}`, exit.x + exit.w + 72, hudH / 2)
    const totalWaves = getWaveCount()
    ctx.fillText(`🌊 ${db.waveIndex + 1}/${totalWaves}`, exit.x + exit.w + 148, hudH / 2)
    ctx.fillText(level.name, exit.x + exit.w + 228, hudH / 2)

    if (db.waveDelayLeft > 0) {
      const btn = this.getCountdownBtn()
      const sec = Math.ceil(db.waveDelayLeft / FPS)
      roundRect(ctx, btn.x, btn.y, btn.w, btn.h, 10)
      ctx.fillStyle = 'rgba(0,0,0,0.45)'
      ctx.fill()
      ctx.strokeStyle = '#FFD54F'
      ctx.lineWidth = 2
      ctx.stroke()
      ctx.fillStyle = '#FFF9C4'
      ctx.font = 'bold 13px sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText(`⏱ 下一波 ${sec}s · 点击提前+${level.earlyWaveBonus}🪙`, btn.x + btn.w / 2, btn.y + btn.h / 2)
    }

    ctx.textAlign = 'right'
    ctx.fillStyle = '#F1F8E9'
    ctx.font = `bold ${Math.floor(14 * getScale())}px sans-serif`
    ctx.fillText(CONFIG.game.title, SCREEN_WIDTH - 12, hudH / 2)

    if (!this.isSelectionActive() && !db.isGameOver && db.waveDelayLeft <= 0) {
      ctx.textAlign = 'center'
      ctx.fillStyle = 'rgba(255,255,255,0.65)'
      ctx.font = '11px sans-serif'
      const hint = db.moveMode ? '点击空鸡窝完成移动' : '🔒点锁窝购买 · 点鸡升星/移动/拆除'
      ctx.fillText(hint, SCREEN_WIDTH / 2, hudH - 4)
    }
  }

  renderBottomBar(ctx) {
    const db = GameGlobal.databus
    if (!this.isSelectionActive()) return

    const bar = this.getBottomBar()
    ctx.fillStyle = 'rgba(0,0,0,0.55)'
    ctx.fillRect(0, bar.y - 6, SCREEN_WIDTH, 6)
    roundRect(ctx, bar.x, bar.y, bar.w, bar.h, 0)
    const g = ctx.createLinearGradient(bar.x, bar.y, bar.x, bar.y + bar.h)
    g.addColorStop(0, 'rgba(62,88,58,0.96)')
    g.addColorStop(1, 'rgba(45,68,42,0.98)')
    ctx.fillStyle = g
    ctx.fill()

    const slot = db.selectedSlotIndex >= 0 ? buildSlotPoints()[db.selectedSlotIndex] : null
    const locked = slot && !db.isSlotUnlocked(slot.index)

    ctx.fillStyle = '#E8F5E9'
    ctx.font = 'bold 13px sans-serif'
    ctx.textAlign = 'left'
    ctx.textBaseline = 'top'
    let title = '选择防御鸡'
    if (db.selectedTower) title = db.moveMode ? '点击目标鸡窝移动' : '升星强化'
    else if (locked) title = '解锁鸡窝'
    ctx.fillText(title, bar.x + 12, bar.y + 6)

    if (locked) {
      const level = getLevelConfig()
      const btns = this.getNestButtons(bar)
      const canRent = db.coins >= level.nestRentCost
      const canPerm = !db.isSlotPermanent(slot.index) && db.coins >= level.nestPermanentCost

      this.drawActionBtn(ctx, btns.rent, '租用', `${level.nestRentCost}金`, '#5D4037', canRent)
      if (!db.isSlotPermanent(slot.index)) {
        this.drawActionBtn(ctx, btns.permanent, '永久', `${level.nestPermanentCost}金`, '#F57F17', canPerm)
      }
      this.drawActionBtn(ctx, btns.close, '关闭', '', '#C62828', true)
      return
    }

    if (db.selectedSlotIndex >= 0) {
      this.getShopItems(bar).forEach((item) => {
        const cfg = CONFIG.towers[item.towerId]
        const can = db.coins >= cfg.cost
        roundRect(ctx, item.x, item.y, item.w, item.h, 8)
        ctx.fillStyle = can ? 'rgba(255,255,255,0.14)' : 'rgba(0,0,0,0.25)'
        ctx.fill()
        ctx.strokeStyle = can ? cfg.color : '#78909C'
        ctx.lineWidth = 2
        ctx.stroke()
        drawSprite(ctx, CONFIG.assets.towers[item.towerId], item.x + item.w / 2, item.y + item.h * 0.38, 36, { fallback: cfg.color })
        ctx.fillStyle = '#ECEFF1'
        ctx.font = 'bold 11px sans-serif'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'alphabetic'
        ctx.fillText(cfg.name, item.x + item.w / 2, item.y + item.h - 18)
        ctx.fillStyle = can ? '#FFD54F' : '#90A4AE'
        ctx.font = '10px sans-serif'
        ctx.fillText(`🪙${cfg.cost}`, item.x + item.w / 2, item.y + item.h - 4)
      })
      return
    }

    if (db.selectedTower) {
      const t = db.selectedTower
      const cfg = t.getCfg()
      const stats = t.getStats()
      const level = getLevelConfig()
      drawSprite(ctx, CONFIG.assets.towers[t.type], bar.x + 48, bar.y + bar.h / 2 + 6, 52, { fallback: cfg.color })
      drawStars(ctx, bar.x + 48, bar.y + 28, t.star, CONFIG.game.maxStar)
      ctx.fillStyle = '#CFD8DC'
      ctx.font = '11px sans-serif'
      ctx.textAlign = 'left'
      ctx.textBaseline = 'top'
      ctx.fillText(`${cfg.name} · ${cfg.desc}`, bar.x + 92, bar.y + 28)
      const showDmg = Math.round(stats.damage * (CONFIG.game.towerDamageMul || 1))
      const showRange = Math.round(stats.range * (CONFIG.game.towerRangeMul || 1))
      ctx.fillText(`伤害${showDmg} 射程${showRange}`, bar.x + 92, bar.y + 46)

      const btns = this.getTowerButtons(bar)
      const canUp = t.canUpgrade() && db.coins >= t.upgradeCost()
      const canMove = db.coins >= level.moveCost
      const refund = t.getSellRefund()

      this.drawActionBtn(
        ctx, btns.upgrade,
        t.canUpgrade() ? '升星' : '满星',
        t.canUpgrade() ? `${t.upgradeCost()}金` : '',
        '#2E7D32', canUp,
      )
      this.drawActionBtn(
        ctx, btns.move,
        db.moveMode ? '取消' : '移动',
        db.moveMode ? '' : `${level.moveCost}金`,
        db.moveMode ? '#546E7A' : '#1565C0', canMove || db.moveMode,
      )
      this.drawActionBtn(ctx, btns.sell, '拆除', `返${refund}金`, '#E65100', true)
      this.drawActionBtn(ctx, btns.close, '关闭', '', '#C62828', true)
    }
  }

  renderGameOver(ctx) {
    const db = GameGlobal.databus
    if (!db.isGameOver) return
    const level = getLevelConfig()
    ctx.fillStyle = 'rgba(0,0,0,0.72)'
    ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT)
    ctx.fillStyle = '#fff'
    ctx.font = 'bold 26px sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(db.isVictory ? `🎉 ${level.name} 通关！` : '💔 鸡窝被攻破', SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2 - 40)
    ctx.font = '15px sans-serif'
    if (db.isVictory && db.levelId < 3) ctx.fillText('下一关已解锁', SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2 - 10)
    ctx.fillText(`最终金币 ${db.coins}`, SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2 + 14)

    const btns = this.getGameOverButtons()
    const drawBtn = (b, label, color) => {
      roundRect(ctx, b.x, b.y, b.w, b.h, 10)
      ctx.fillStyle = color
      ctx.fill()
      ctx.fillStyle = '#fff'
      ctx.font = 'bold 14px sans-serif'
      ctx.fillText(label, b.x + b.w / 2, b.y + b.h / 2)
    }
    drawBtn(btns.retry, '再来一局', '#43A047')
    if (btns.next) drawBtn(btns.next, '下一关', '#1976D2')
    drawBtn(btns.menu, '选关', '#5D4037')
  }

  renderExitConfirm(ctx) {
    const db = GameGlobal.databus
    if (!db.showExitConfirm) return
    ctx.fillStyle = 'rgba(0,0,0,0.6)'
    ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT)
    roundRect(ctx, SCREEN_WIDTH / 2 - 110, SCREEN_HEIGHT / 2 - 50, 220, 100, 12)
    ctx.fillStyle = 'rgba(40,60,36,0.96)'
    ctx.fill()
    ctx.fillStyle = '#fff'
    ctx.font = 'bold 18px sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('退出？', SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2 - 18)
    const c = this.getExitConfirmBtns()
    const drawBtn = (b, label, color) => {
      roundRect(ctx, b.x, b.y, b.w, b.h, 8)
      ctx.fillStyle = color
      ctx.fill()
      ctx.fillStyle = '#fff'
      ctx.font = 'bold 14px sans-serif'
      ctx.fillText(label, b.x + b.w / 2, b.y + b.h / 2)
    }
    drawBtn(c.ok, '确定', '#2E7D32')
    drawBtn(c.cancel, '继续', '#546E7A')
  }

  render(ctx) {
    this.renderHud(ctx)
    this.renderBottomBar(ctx)
    this.renderGameOver(ctx)
    this.renderExitConfirm(ctx)
  }
}

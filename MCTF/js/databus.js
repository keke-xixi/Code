import CONFIG from './config/game.config'
import { getLevelById } from './config/levels.config'
import Pool from './base/pool'
import { getPermanentSlots, unlockLevel } from './base/progress'
import { clearSlotCache, getLevelSlots } from './map/layout'

let instance

export default class DataBus {
  frame = 0
  scene = 'menu'
  levelId = 1
  coins = 0
  lives = 0
  waveIndex = 0
  isGameOver = false
  isVictory = false

  towers = []
  enemys = []
  bullets = []
  slotStates = []

  selectedSlotIndex = -1
  selectedTower = null
  moveMode = false
  showExitConfirm = false

  spawnQueue = []
  waveDelayLeft = 0
  spawning = false

  pool = new Pool()

  constructor() {
    if (instance) return instance
    instance = this
  }

  reset(levelId = 1) {
    clearSlotCache()
    const level = getLevelById(levelId)
    const slots = getLevelSlots(level)
    const perm = getPermanentSlots(levelId)
    this.frame = 0
    this.scene = 'playing'
    this.levelId = levelId
    this.coins = level.initialCoins
    this.lives = level.initialLives
    this.waveIndex = 0
    this.isGameOver = false
    this.isVictory = false
    this.towers = []
    this.enemys = []
    this.bullets = []
    this.selectedSlotIndex = -1
    this.selectedTower = null
    this.moveMode = false
    this.showExitConfirm = false
    this.spawnQueue = []
    this.waveDelayLeft = 0
    this.spawning = false
    this.slotStates = slots.map((s, i) => ({
      unlocked: s.free || perm.includes(i),
      permanent: perm.includes(i),
    }))
  }

  isSlotUnlocked(index) {
    return !!this.slotStates[index]?.unlocked
  }

  isSlotPermanent(index) {
    return !!this.slotStates[index]?.permanent
  }

  unlockSlot(index, permanent = false) {
    if (!this.slotStates[index]) return
    this.slotStates[index].unlocked = true
    if (permanent) this.slotStates[index].permanent = true
  }

  gameOver() {
    this.isGameOver = true
  }

  victory() {
    this.isVictory = true
    this.isGameOver = true
    unlockLevel(this.levelId + 1)
  }

  removeEnemy(enemy) {
    const i = this.enemys.indexOf(enemy)
    if (i >= 0) {
      this.enemys.splice(i, 1)
      this.pool.recover('enemy', enemy)
    }
  }

  removeBullet(bullet) {
    const i = this.bullets.indexOf(bullet)
    if (i >= 0) {
      this.bullets.splice(i, 1)
      this.pool.recover('bullet', bullet)
    }
  }

  getTowerAtSlot(slotIndex) {
    return this.towers.find((t) => t.slotIndex === slotIndex)
  }

  removeTower(tower) {
    const i = this.towers.indexOf(tower)
    if (i >= 0) this.towers.splice(i, 1)
    if (this.selectedTower === tower) {
      this.selectedTower = null
      this.moveMode = false
    }
  }
}

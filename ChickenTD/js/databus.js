import CONFIG from './config/game.config'
import Pool from './base/pool'

let instance

export default class DataBus {
  frame = 0
  coins = 0
  lives = 0
  waveIndex = 0
  isGameOver = false
  isVictory = false

  towers = []
  enemys = []
  bullets = []

  /** 当前选中的空槽 index，或已建塔对象 */
  selectedSlotIndex = -1
  selectedTower = null
  shopTowerId = null

  /** 波次生成队列 */
  spawnQueue = []
  waveDelayLeft = 0
  spawning = false

  pool = new Pool()

  constructor() {
    if (instance) return instance
    instance = this
  }

  reset() {
    const g = CONFIG.game
    this.frame = 0
    this.coins = g.initialCoins
    this.lives = g.initialLives
    this.waveIndex = 0
    this.isGameOver = false
    this.isVictory = false
    this.towers = []
    this.enemys = []
    this.bullets = []
    this.selectedSlotIndex = -1
    this.selectedTower = null
    this.shopTowerId = null
    this.spawnQueue = []
    this.waveDelayLeft = 120
    this.spawning = false
  }

  gameOver() {
    this.isGameOver = true
  }

  victory() {
    this.isVictory = true
    this.isGameOver = true
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
}

import { ref, reactive, computed, onMounted, nextTick, watch } from 'vue'
import {
  CELL_SIZE,
  EXTEND_AMOUNT,
  WORLD_DEFAULT,
  ZOOM,
  COMBO,
  ORE_TYPES,
} from '@/config/game.js'
import { meetsRarity } from '@/config/shop.js'
import { exchangeDiamondForGold } from '@/services/game/exchange.js'
import { initializeWorldOres, extendWorldOres } from '@/services/game/world.js'
import { loadSave, persistSave, clearSave } from '@/services/game/save.js'
import {
  getLayerInfo,
  getLayerProgress,
  getNextLayerHint,
} from '@/services/game/progress.js'
import {
  computeUpgradeEffects,
  purchaseUpgrade,
} from '@/services/game/upgrades.js'

let floatId = 0

export function useMiningGame({ toastRef } = {}) {
  const screenHeight = ref(0)
  const screenWidth = ref(0)
  const cellSize = CELL_SIZE
  const extendAmount = EXTEND_AMOUNT

  const worldBounds = reactive({
    left: WORLD_DEFAULT.left,
    right: WORLD_DEFAULT.right,
    top: WORLD_DEFAULT.top,
    bottom: WORLD_DEFAULT.bottom,
  })
  const worldOres = ref({})
  const scale = ref(ZOOM.default)
  const offsetX = ref(0)
  const offsetY = ref(0)
  const isAnimating = ref(false)
  const isMoving = ref(false)
  const isMining = ref(false)
  const allMoney = ref(0)
  const moveTrackArr = ref([])
  const maxDepth = ref(0)
  const totalCollected = ref(0)
  const comboCount = ref(0)
  const lastCollectAt = ref(0)
  const floatingItems = ref([])
  const ownedUpgrades = ref({})
  const diamonds = ref(0)
  const gachaPity = ref({ streak: 0, redStreak: 0 })

  const state = reactive({
    x: WORLD_DEFAULT.spawnX,
    y: WORLD_DEFAULT.spawnY,
  })

  const touchState = reactive({
    startX: 0,
    startY: 0,
    isTouching: false,
    lastMoveTime: 0,
  })

  const settingsModalRef = ref(null)
  const shopModalRef = ref(null)

  const upgradeEffects = computed(() =>
    computeUpgradeEffects(ownedUpgrades.value),
  )

  const currentOre = computed(() => {
    const key = `${state.x},${state.y}`
    const ore = worldOres.value[key]
    if (!ore) return { name: '岩层', color: '#333', price: 0 }
    const meta = ORE_TYPES[ore.type] || ORE_TYPES[1]
    return { ...meta, ...ore }
  })

  const depth = computed(() => state.y)
  const layerInfo = computed(() => getLayerInfo(state.y))
  const layerProgress = computed(() => getLayerProgress(state.y))
  const nextHint = computed(() => getNextLayerHint(state.y))

  const gridRows = computed(() => worldBounds.bottom - worldBounds.top)
  const gridCols = computed(() => worldBounds.right - worldBounds.left)
  const worldWidth = computed(() => gridCols.value * cellSize)
  const worldHeight = computed(() => gridRows.value * cellSize)

  const visibleRows = computed(() => {
    const start = Math.max(1, Math.floor(-offsetY.value / cellSize) - 2)
    const end = Math.min(
      gridRows.value,
      Math.ceil((screenHeight.value / scale.value - offsetY.value) / cellSize) + 2,
    )
    return Array.from({ length: end - start + 1 }, (_, i) => start + i)
  })

  const visibleCols = computed(() => {
    const start = Math.max(1, Math.floor(-offsetX.value / cellSize) - 2)
    const end = Math.min(
      gridCols.value,
      Math.ceil((screenWidth.value / scale.value - offsetX.value) / cellSize) + 2,
    )
    return Array.from({ length: end - start + 1 }, (_, i) => start + i)
  })

  const addFloating = (text, type = 'gold') => {
    const id = ++floatId
    floatingItems.value.push({
      id,
      text,
      type,
      style: {
        left: 30 + Math.random() * 40 + '%',
        top: 35 + Math.random() * 15 + '%',
      },
    })
    setTimeout(() => {
      floatingItems.value = floatingItems.value.filter((f) => f.id !== id)
    }, 1100)
  }

  const triggerMiningAnim = () => {
    isMining.value = true
    setTimeout(() => {
      isMining.value = false
    }, upgradeEffects.value.mineMs)
  }

  const updateMaxDepth = () => {
    if (state.y > maxDepth.value) maxDepth.value = state.y
  }

  const collectOre = (x, y, silent = false) => {
    const key = `${x},${y}`
    const row = worldOres.value[key]
    if (!row || !row.break || row.take) return 0

    const meta = ORE_TYPES[row.type] || ORE_TYPES[1]
    const fx = upgradeEffects.value
    const now = Date.now()

    if (now - lastCollectAt.value < COMBO.windowMs) {
      comboCount.value = Math.min(comboCount.value + 1, 12)
    } else {
      comboCount.value = 1
    }
    lastCollectAt.value = now

    const comboBonus = Math.min(
      (comboCount.value - 1) * COMBO.bonusPerStack,
      COMBO.maxBonus,
    )
    const depthBonus = y * fx.depthGoldPct
    let gain = Math.round(
      meta.price * fx.goldMultiplier * (1 + comboBonus + depthBonus),
    )

    if (Math.random() < fx.critChance) {
      gain = Math.round(gain * fx.critMultiplier)
      if (!silent) addFloating(`暴击! +${gain}`, 'gold')
    } else if (!silent) {
      addFloating(comboCount.value > 1 ? `+${gain} 连击` : `+${gain}`, 'gold')
    }

    row.take = true
    allMoney.value += gain
    totalCollected.value += 1

    if (
      !silent &&
      (meta.rarity === 'epic' || meta.rarity === 'legendary')
    ) {
      toastRef?.value?.showSuccess(`${meta.name} +${gain}`)
    }

    return gain
  }

  const manhattan = (x1, y1, x2, y2) =>
    Math.abs(x1 - x2) + Math.abs(y1 - y2)

  const collectExposedInRadius = (cx, cy, radius) => {
    for (let x = cx - radius; x <= cx + radius; x++) {
      for (let y = cy - radius; y <= cy + radius; y++) {
        if (manhattan(cx, cy, x, y) > radius) continue
        if (x === cx && y === cy) continue
        collectOre(x, y, true)
      }
    }
  }

  const breakCell = (x, y, triggerAnim = true) => {
    const key = `${x},${y}`
    const row = worldOres.value[key]
    if (!row || row.break) return false
    row.break = true
    if (triggerAnim) triggerMiningAnim()
    return true
  }

  const bonusBreakAround = (cx, cy) => {
    const r = upgradeEffects.value.bonusBreakRadius
    if (r <= 0) return
    const fx = upgradeEffects.value

    for (let x = cx - r; x <= cx + r; x++) {
      for (let y = cy - r; y <= cy + r; y++) {
        if (x === cx && y === cy) continue
        if (manhattan(cx, cy, x, y) > r) continue
        if (breakCell(x, y, false)) {
          if (fx.oneHitMine || fx.autoOnBreak) {
            collectOre(x, y, true)
          }
        }
      }
    }
  }

  const processCell = (x, y) => {
    const key = `${x},${y}`
    const row = worldOres.value[key]
    if (!row) return

    const fx = upgradeEffects.value

    if (!row.break) {
      breakCell(x, y, true)
      if (fx.oneHitMine || fx.autoOnBreak) {
        collectOre(x, y)
      }
      bonusBreakAround(x, y)
      return
    }

    if (!row.take) {
      collectOre(x, y)
    }
  }

  const afterMoveEffects = (x, y) => {
    const r = upgradeEffects.value.pickupRadius
    if (r > 0) {
      collectExposedInRadius(x, y, r)
    }
  }

  const moveMethod = (x, y) => {
    moveTo(x, y)
    processCell(x, y)
    afterMoveEffects(x, y)
    recordMove(x, y)
    updateMaxDepth()
  }

  const tryMoveTo = (xOrPayload, y) => {
    const x = typeof xOrPayload === 'object' ? xOrPayload.x : xOrPayload
    const targetY = typeof xOrPayload === 'object' ? xOrPayload.y : y
    const dx = Math.abs(x - state.x)
    const dy = Math.abs(targetY - state.y)
    if ((dx === 1 && dy === 0) || (dx === 0 && dy === 1)) {
      moveMethod(x, targetY)
    }
  }

  const recordMove = (x, y) => {
    moveTrackArr.value.push({ x, y })
  }

  const moveTo = (x, y) => {
    const extended = extendWorldIfNeeded(x, y)
    isMoving.value = true
    state.x = x
    state.y = y
    if (extended) centerViewOnBox()
    else ensureBoxInView()
    setTimeout(() => {
      isMoving.value = false
    }, upgradeEffects.value.moveMs)
  }

  const extendWorldIfNeeded = (x, y) => {
    let extended = false
    if (x < worldBounds.left) {
      worldBounds.left -= extendAmount
      extended = true
    } else if (x >= worldBounds.right) {
      worldBounds.right += extendAmount
      extended = true
    }
    if (y < worldBounds.top) {
      worldBounds.top -= extendAmount
      extended = true
    } else if (y >= worldBounds.bottom) {
      worldBounds.bottom += extendAmount
      extended = true
    }
    if (extended) {
      worldOres.value = extendWorldOres(worldOres.value, worldBounds)
    }
    return extended
  }

  const ensureBoxInView = () => {
    const cw = screenWidth.value
    const ch = screenHeight.value
    const boxScreenX =
      (state.x - worldBounds.left) * cellSize * scale.value +
      offsetX.value * scale.value
    const boxScreenY =
      (state.y - worldBounds.top) * cellSize * scale.value +
      offsetY.value * scale.value
    const boxSize = cellSize * scale.value
    const threshold = 50
    let newOffsetX = offsetX.value
    let newOffsetY = offsetY.value

    if (boxScreenX < threshold) {
      newOffsetX += (threshold - boxScreenX) / scale.value
    } else if (boxScreenX + boxSize > cw - threshold) {
      newOffsetX -= (boxScreenX + boxSize - (cw - threshold)) / scale.value
    }
    if (boxScreenY < threshold) {
      newOffsetY += (threshold - boxScreenY) / scale.value
    } else if (boxScreenY + boxSize > ch - threshold) {
      newOffsetY -= (boxScreenY + boxSize - (ch - threshold)) / scale.value
    }

    const minOffsetX = -(worldWidth.value * scale.value - cw) / scale.value
    const minOffsetY = -(worldHeight.value * scale.value - ch) / scale.value
    newOffsetX = Math.max(minOffsetX, Math.min(0, newOffsetX))
    newOffsetY = Math.max(minOffsetY, Math.min(0, newOffsetY))

    if (
      Math.abs(newOffsetX - offsetX.value) > 0.1 ||
      Math.abs(newOffsetY - offsetY.value) > 0.1
    ) {
      isAnimating.value = true
      offsetX.value = newOffsetX
      offsetY.value = newOffsetY
      setTimeout(() => {
        isAnimating.value = false
      }, 300)
    }
  }

  const centerViewOnBox = () => {
    const cw = screenWidth.value
    const ch = screenHeight.value
    const targetOffsetX = -(
      (state.x - worldBounds.left) * cellSize - cw / (2 * scale.value)
    )
    const targetOffsetY = -(
      (state.y - worldBounds.top) * cellSize - ch / (2 * scale.value)
    )
    const minOffsetX = -(worldWidth.value * scale.value - cw) / scale.value
    const minOffsetY = -(worldHeight.value * scale.value - ch) / scale.value
    offsetX.value = Math.max(minOffsetX, Math.min(0, targetOffsetX))
    offsetY.value = Math.max(minOffsetY, Math.min(0, targetOffsetY))
  }

  const zoomTo = (newScale) => {
    isAnimating.value = true
    scale.value = newScale
    setTimeout(() => {
      isAnimating.value = false
      ensureBoxInView()
    }, 300)
  }

  const zoomIn = () => zoomTo(Math.min(ZOOM.max, scale.value + ZOOM.step))
  const zoomOut = () => zoomTo(Math.max(ZOOM.min, scale.value - ZOOM.step))

  const moveBox = (direction) => {
    let newX = state.x
    let newY = state.y
    switch (direction) {
      case 'w':
        newY -= 1
        break
      case 'a':
        newX -= 1
        break
      case 's':
        newY += 1
        break
      case 'd':
        newX += 1
        break
      default:
        break
    }
    moveMethod(newX, newY)
  }

  const handleTouchStart = (e) => {
    touchState.startX = e.touches[0].clientX
    touchState.startY = e.touches[0].clientY
    touchState.isTouching = true
  }

  const handleTouchMove = (e) => {
    if (!touchState.isTouching) return
    e.preventDefault()
    const currentX = e.touches[0].clientX
    const currentY = e.touches[0].clientY
    const now = Date.now()
    if (now - touchState.lastMoveTime < 100) return
    touchState.lastMoveTime = now
    const diffX = currentX - touchState.startX
    const diffY = currentY - touchState.startY
    if (Math.abs(diffX) > 30 || Math.abs(diffY) > 30) {
      if (Math.abs(diffX) > Math.abs(diffY)) {
        moveBox(diffX > 0 ? 'd' : 'a')
      } else {
        moveBox(diffY > 0 ? 's' : 'w')
      }
      touchState.startX = currentX
      touchState.startY = currentY
    }
  }

  const handleTouchEnd = () => {
    touchState.isTouching = false
  }

  const openSettings = () => {
    nextTick(() => settingsModalRef.value?.open())
  }

  const openShop = () => {
    nextTick(() => shopModalRef.value?.open())
  }

  const exchangeDiamond = (packId) => {
    const result = exchangeDiamondForGold(diamonds.value, packId)
    if (!result.ok) {
      toastRef?.value?.showWarning(result.message)
      return
    }
    diamonds.value = result.diamondsLeft
    allMoney.value += result.gold
    persistAll()
    toastRef?.value?.showSuccess(
      `兑换 +${formatGold(result.gold)} 金币`,
    )
  }

  const formatGold = (n) => {
    if (n >= 10000) return `${(n / 10000).toFixed(1)}万`
    if (n >= 1000) return `${(n / 1000).toFixed(1)}k`
    return String(n)
  }

  const buyUpgrade = (categoryId) => {
    const result = purchaseUpgrade(
      ownedUpgrades.value,
      categoryId,
      allMoney.value,
    )
    if (!result.ok) {
      toastRef?.value?.showWarning(result.message)
      return
    }
    ownedUpgrades.value = result.owned
    allMoney.value = result.moneyLeft
    persistAll()
    toastRef?.value?.showSuccess(`获得 ${result.boughtName}`)
  }

  const persistAll = () => {
    persistSave({
      money: allMoney.value,
      moveTrack: moveTrackArr.value,
      position: { x: state.x, y: state.y },
      worldOres: worldOres.value,
      maxDepth: maxDepth.value,
      totalCollected: totalCollected.value,
      upgrades: ownedUpgrades.value,
      diamonds: diamonds.value,
      gachaPity: gachaPity.value,
    })
  }

  const saveGame = () => {
    persistAll()
    toastRef?.value?.showSuccess('已存档')
  }

  const reloadFromSave = () => {
    const save = loadSave()
    allMoney.value = save.money
    diamonds.value = save.diamonds || 0
    ownedUpgrades.value = save.upgrades || {}
    gachaPity.value = save.gachaPity || { streak: 0, redStreak: 0 }
  }

  const openGacha = () => {
    uni.navigateTo({ url: '/pages/gacha/index' })
  }

  const applySave = (save) => {
    allMoney.value = save.money
    moveTrackArr.value = save.moveTrack
    state.x = save.position.x
    state.y = save.position.y
    maxDepth.value = Math.max(save.maxDepth || 0, state.y)
    totalCollected.value = save.totalCollected || 0
    ownedUpgrades.value = save.upgrades || {}
    diamonds.value = save.diamonds || 0
    gachaPity.value = save.gachaPity || { streak: 0, redStreak: 0 }
    if (save.worldOres && Object.keys(save.worldOres).length > 0) {
      worldOres.value = save.worldOres
    } else {
      worldOres.value = initializeWorldOres(worldBounds)
    }
  }

  const restoreBreakState = () => {
    moveTrackArr.value.forEach((item) => {
      const key = `${item.x},${item.y}`
      if (worldOres.value[key]) worldOres.value[key].break = true
    })
  }

  const ensureWorldBoundsContainPosition = (x, y) => {
    let extended = false
    if (x < worldBounds.left) {
      worldBounds.left = Math.min(worldBounds.left, x - extendAmount)
      extended = true
    } else if (x >= worldBounds.right) {
      worldBounds.right = Math.max(worldBounds.right, x + extendAmount)
      extended = true
    }
    if (y < worldBounds.top) {
      worldBounds.top = Math.min(worldBounds.top, y - extendAmount)
      extended = true
    } else if (y >= worldBounds.bottom) {
      worldBounds.bottom = Math.max(worldBounds.bottom, y + extendAmount)
      extended = true
    }
    if (extended) {
      worldOres.value = extendWorldOres(worldOres.value, worldBounds)
    }
  }

  const gameReset = () => {
    clearSave()
    moveTrackArr.value = []
    allMoney.value = 0
    maxDepth.value = 0
    totalCollected.value = 0
    comboCount.value = 0
    ownedUpgrades.value = {}
    diamonds.value = 0
    gachaPity.value = { streak: 0, redStreak: 0 }
    state.x = WORLD_DEFAULT.spawnX
    state.y = WORLD_DEFAULT.spawnY
    Object.assign(worldBounds, {
      left: WORLD_DEFAULT.left,
      right: WORLD_DEFAULT.right,
      top: WORLD_DEFAULT.top,
      bottom: WORLD_DEFAULT.bottom,
    })
    worldOres.value = initializeWorldOres(worldBounds)
    scale.value = ZOOM.default
    offsetX.value = 0
    offsetY.value = 0
    nextTick(() => {
      centerViewOnBox()
      toastRef?.value?.showSuccess('重新开始')
    })
  }

  const initGame = () => {
    const systemInfo = uni.getSystemInfoSync()
    screenHeight.value = systemInfo.windowHeight
    screenWidth.value = systemInfo.windowWidth
    const save = loadSave()
    applySave(save)
    ensureWorldBoundsContainPosition(state.x, state.y)
    nextTick(() => {
      centerViewOnBox()
      restoreBreakState()
      updateMaxDepth()
    })
  }

  onMounted(initGame)
  watch([worldWidth, worldHeight], ensureBoxInView)

  return {
    screenHeight,
    cellSize,
    worldBounds,
    worldOres,
    scale,
    offsetX,
    offsetY,
    isAnimating,
    isMoving,
    isMining,
    allMoney,
    diamonds,
    gachaPity,
    state,
    currentOre,
    depth,
    layerInfo,
    layerProgress,
    nextHint,
    comboCount,
    maxDepth,
    totalCollected,
    floatingItems,
    ownedUpgrades,
    upgradeEffects,
    visibleRows,
    visibleCols,
    worldWidth,
    worldHeight,
    settingsModalRef,
    shopModalRef,
    tryMoveTo,
    moveBox,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    openSettings,
    openShop,
    buyUpgrade,
    exchangeDiamond,
    reloadFromSave,
    openGacha,
    saveGame,
    gameReset,
    zoomIn,
    zoomOut,
  }
}

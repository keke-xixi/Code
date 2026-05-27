import { STORAGE_KEYS } from '@/config/storage.js'
import { WORLD_DEFAULT } from '@/config/game.js'

export const loadSave = () => {
  const money = uni.getStorageSync(STORAGE_KEYS.MONEY)
  const moveTrack = uni.getStorageSync(STORAGE_KEYS.MOVE_TRACK)
  const userPosition = uni.getStorageSync(STORAGE_KEYS.USER_POSITION)
  const worldOres = uni.getStorageSync(STORAGE_KEYS.WORLD_ORES)
  const maxDepth = uni.getStorageSync(STORAGE_KEYS.MAX_DEPTH)
  const totalCollected = uni.getStorageSync(STORAGE_KEYS.TOTAL_COLLECTED)
  const upgrades = uni.getStorageSync(STORAGE_KEYS.UPGRADES)

  return {
    money: money ? Number(money) : 0,
    moveTrack: Array.isArray(moveTrack) ? moveTrack : [],
    position: userPosition || {
      x: WORLD_DEFAULT.spawnX,
      y: WORLD_DEFAULT.spawnY,
    },
    worldOres: worldOres && typeof worldOres === 'object' ? worldOres : null,
    maxDepth: maxDepth ? Number(maxDepth) : 0,
    totalCollected: totalCollected ? Number(totalCollected) : 0,
    upgrades: upgrades && typeof upgrades === 'object' ? upgrades : {},
  }
}

export const persistSave = (payload) => {
  const {
    money,
    moveTrack,
    position,
    worldOres,
    maxDepth,
    totalCollected,
    upgrades,
  } = payload

  uni.setStorageSync(STORAGE_KEYS.MONEY, money)
  uni.setStorageSync(STORAGE_KEYS.MOVE_TRACK, moveTrack)
  uni.setStorageSync(STORAGE_KEYS.USER_POSITION, position)
  if (worldOres) {
    uni.setStorageSync(STORAGE_KEYS.WORLD_ORES, worldOres)
  }
  if (maxDepth != null) {
    uni.setStorageSync(STORAGE_KEYS.MAX_DEPTH, maxDepth)
  }
  if (totalCollected != null) {
    uni.setStorageSync(STORAGE_KEYS.TOTAL_COLLECTED, totalCollected)
  }
  if (upgrades != null) {
    uni.setStorageSync(STORAGE_KEYS.UPGRADES, upgrades)
  }
}

export const clearSave = () => {
  persistSave({
    money: 0,
    moveTrack: [],
    position: { x: WORLD_DEFAULT.spawnX, y: WORLD_DEFAULT.spawnY },
    worldOres: null,
    maxDepth: 0,
    totalCollected: 0,
    upgrades: {},
  })
  uni.removeStorageSync(STORAGE_KEYS.WORLD_ORES)
}

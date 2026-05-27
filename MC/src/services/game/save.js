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
  const disabledUpgrades = uni.getStorageSync(STORAGE_KEYS.DISABLED_UPGRADES)
  const diamonds = uni.getStorageSync(STORAGE_KEYS.DIAMONDS)
  const gachaPity = uni.getStorageSync(STORAGE_KEYS.GACHA_PITY)

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
    disabledUpgrades:
      disabledUpgrades && typeof disabledUpgrades === 'object'
        ? disabledUpgrades
        : {},
    diamonds: diamonds ? Number(diamonds) : 0,
    gachaPity:
      gachaPity && typeof gachaPity === 'object'
        ? gachaPity
        : { streak: 0, redStreak: 0 },
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
    disabledUpgrades,
    diamonds,
    gachaPity,
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
  if (disabledUpgrades != null) {
    uni.setStorageSync(STORAGE_KEYS.DISABLED_UPGRADES, disabledUpgrades)
  }
  if (diamonds != null) {
    uni.setStorageSync(STORAGE_KEYS.DIAMONDS, diamonds)
  }
  if (gachaPity != null) {
    uni.setStorageSync(STORAGE_KEYS.GACHA_PITY, gachaPity)
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
    disabledUpgrades: {},
    diamonds: 0,
    gachaPity: { streak: 0, redStreak: 0 },
  })
  uni.removeStorageSync(STORAGE_KEYS.WORLD_ORES)
}

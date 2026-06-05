const STORAGE_KEY = 'mctf_progress'

const defaultProgress = () => ({
  unlockedLevels: [1],
  permanentSlots: {},
})

function load() {
  try {
    const raw = wx.getStorageSync(STORAGE_KEY)
    if (!raw) return defaultProgress()
    return {
      unlockedLevels: raw.unlockedLevels || [1],
      permanentSlots: raw.permanentSlots || {},
    }
  } catch (e) {
    return defaultProgress()
  }
}

function save(data) {
  try {
    wx.setStorageSync(STORAGE_KEY, data)
  } catch (e) { /* ignore */ }
}

let cache = load()

export function getProgress() {
  return cache
}

export function isLevelUnlocked(levelId) {
  return cache.unlockedLevels.includes(levelId)
}

export function unlockLevel(levelId) {
  if (levelId > 3 || cache.unlockedLevels.includes(levelId)) return
  cache.unlockedLevels.push(levelId)
  cache.unlockedLevels.sort((a, b) => a - b)
  save(cache)
}

export function getPermanentSlots(levelId) {
  return cache.permanentSlots[String(levelId)] || []
}

export function addPermanentSlot(levelId, slotIndex) {
  const key = String(levelId)
  const list = cache.permanentSlots[key] || []
  if (list.includes(slotIndex)) return
  list.push(slotIndex)
  cache.permanentSlots[key] = list
  save(cache)
}

export function isPermanentSlot(levelId, slotIndex) {
  return getPermanentSlots(levelId).includes(slotIndex)
}

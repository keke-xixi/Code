import { STORAGE_KEYS, GAME_CONFIG } from '@/global/config'

export const loadGameSave = () => ({
  money: uni.getStorageSync(STORAGE_KEYS.MONEY) || 0,
  moveTrack: uni.getStorageSync(STORAGE_KEYS.MOVE_TRACK) || [],
  position: uni.getStorageSync(STORAGE_KEYS.USER_POSITION) || {
    ...GAME_CONFIG.INITIAL_POSITION,
  },
})

export const saveGameProgress = ({ money, moveTrack, position }) => {
  uni.setStorageSync(STORAGE_KEYS.MONEY, money)
  uni.setStorageSync(STORAGE_KEYS.MOVE_TRACK, moveTrack)
  uni.setStorageSync(STORAGE_KEYS.USER_POSITION, position)
}

export const clearGameSave = () => {
  const empty = {
    money: 0,
    moveTrack: [],
    position: { ...GAME_CONFIG.INITIAL_POSITION },
  }
  saveGameProgress(empty)
  return empty
}

import { DEPTH_RANGES, DEPTH_MILESTONES } from '@/config/game.js'
import { getRange } from './world.js'

/** 当前深度层信息 */
export const getLayerInfo = (y) => {
  const range = getRange(y)
  return {
    title: range.title || '未知区域',
    label: range.label,
    min: range.min,
    max: range.max,
  }
}

/** 在当前层内的进度 0-100 */
export const getLayerProgress = (y) => {
  const range = getRange(y)
  if (!range.max || range.max <= range.min) return 0
  const span = range.max - range.min + 1
  const pos = Math.min(Math.max(y - range.min, 0), span)
  return Math.round((pos / span) * 100)
}

/** 下一层提示文案 */
export const getNextLayerHint = (y) => {
  const sorted = [...DEPTH_RANGES].sort((a, b) => a.min - b.min)
  for (const r of sorted) {
    if (y < r.min) {
      const need = r.min - y
      return `再下挖 ${need} 层 → ${r.title}`
    }
  }
  return '已抵达最深层，传说矿等你！'
}

/** 未达成的最近里程碑 */
export const getNextMilestone = (y, achieved = []) => {
  const set = new Set(achieved)
  return DEPTH_MILESTONES.find((m) => y < m && !set.has(m)) || null
}

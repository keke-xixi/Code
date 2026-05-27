import {
  ORE_TYPES,
  DEPTH_RANGES,
  GAME_CONFIG,
  DEFAULT_ORE,
} from '@/global/config'

export const getRange = (y) => {
  for (const range of DEPTH_RANGES) {
    if (y >= range.min && y <= range.max) return range
  }
  return { min: 0, max: 0, label: '表层', leave: 1, rate: [1] }
}

export const generateOreType = (y) => {
  const range = getRange(y)
  if (!range?.rate) return 1

  const random = Math.random()
  let cumulative = 0
  for (let level = 1; level <= range.leave; level++) {
    cumulative += range.rate[level - 1] || 0
    if (random < cumulative) return level
  }
  return 1
}

const createOreCell = (y) => {
  const level = generateOreType(y)
  const meta = ORE_TYPES[level]
  return {
    type: level,
    name: meta.name,
    color: meta.color,
    price: meta.price,
    break: false,
    take: false,
  }
}

export const initializeWorldOres = (worldBounds) => {
  const ores = {}
  for (let x = worldBounds.left; x < worldBounds.right; x++) {
    for (let y = worldBounds.top; y < worldBounds.bottom; y++) {
      ores[`${x},${y}`] = createOreCell(y)
    }
  }
  return ores
}

export const extendWorldOres = (ores, worldBounds) => {
  const newOres = { ...ores }
  for (let x = worldBounds.left; x < worldBounds.right; x++) {
    for (let y = worldBounds.top; y < worldBounds.bottom; y++) {
      const key = `${x},${y}`
      if (!newOres[key]) newOres[key] = createOreCell(y)
    }
  }
  return newOres
}

export const getOreMeta = (type) => ORE_TYPES[type] || DEFAULT_ORE

export const getOreSymbol = (type) => ORE_TYPES[type]?.symbol || '●'

export { GAME_CONFIG }

import { ORE_TYPES, DEPTH_RANGES } from '@/config/game.js'

export const getRange = (y) => {
  for (const range of DEPTH_RANGES) {
    if (y >= range.min && y <= range.max) {
      return range
    }
  }
  return { min: 0, max: 0, label: '0', title: '地表', leave: 1, rate: [1] }
}

export const generateOreType = (y) => {
  const range = getRange(y)
  if (!range?.rate) return 1

  const random = Math.random()
  let cumulative = 0

  for (let level = 1; level <= range.leave; level++) {
    cumulative += range.rate[level - 1] || 0
    if (random < cumulative) {
      return level
    }
  }
  return 1
}

export const createOreCell = (oreLevel) => {
  const meta = ORE_TYPES[oreLevel] || ORE_TYPES[1]
  return {
    type: oreLevel,
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
      const key = `${x},${y}`
      ores[key] = createOreCell(generateOreType(y))
    }
  }
  return ores
}

export const extendWorldOres = (ores, worldBounds) => {
  const newOres = { ...ores }
  for (let x = worldBounds.left; x < worldBounds.right; x++) {
    for (let y = worldBounds.top; y < worldBounds.bottom; y++) {
      const key = `${x},${y}`
      if (!newOres[key]) {
        newOres[key] = createOreCell(generateOreType(y))
      }
    }
  }
  return newOres
}

export const getOreMeta = (type) => ORE_TYPES[type] || ORE_TYPES[1]

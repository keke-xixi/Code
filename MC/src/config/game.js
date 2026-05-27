/** 游戏玩法与数值配置 */
export const CELL_SIZE = 50
export const EXTEND_AMOUNT = 5

export const WORLD_DEFAULT = {
  left: 0,
  right: 20,
  top: 0,
  bottom: 20,
  spawnX: 10,
  spawnY: 10,
}

export const ZOOM = {
  min: 0.5,
  max: 3,
  step: 0.2,
  default: 1,
}

/** 稀有度：影响光效与反馈 */
export const RARITY = {
  common: { id: 'common', label: '普通', minPrice: 0 },
  uncommon: { id: 'uncommon', label: '优良', minPrice: 10 },
  rare: { id: 'rare', label: '稀有', minPrice: 30 },
  epic: { id: 'epic', label: '史诗', minPrice: 100 },
  legendary: { id: 'legendary', label: '传说', minPrice: 500 },
}

/** 矿石类型 */
export const ORE_TYPES = {
  1: {
    name: '泥土',
    color: '#6b4423',
    glow: '#8b5a2b',
    price: 1,
    rarity: 'common',
  },
  2: {
    name: '石块',
    color: '#5c5c5c',
    glow: '#8a8a8a',
    price: 5,
    rarity: 'common',
  },
  3: {
    name: '铁矿',
    color: '#7a8b99',
    glow: '#b8c5d0',
    price: 10,
    rarity: 'uncommon',
  },
  4: {
    name: '黄金',
    color: '#e8b923',
    glow: '#ffe566',
    price: 30,
    rarity: 'rare',
  },
  5: {
    name: '钻石',
    color: '#7ee8ff',
    glow: '#c8f7ff',
    price: 100,
    rarity: 'epic',
  },
  6: {
    name: '红物质',
    color: '#e0115f',
    glow: '#ff6b9d',
    price: 500,
    rarity: 'legendary',
  },
  7: {
    name: '虚空水晶',
    color: '#9966cc',
    glow: '#d4a5ff',
    price: 1000,
    rarity: 'legendary',
  },
  8: {
    name: '黑洞碎片',
    color: '#1a1a2e',
    glow: '#4a4a8a',
    price: 10000,
    rarity: 'legendary',
  },
}

/** 深度 → 矿石概率（label 为 HUD 展示名） */
export const DEPTH_RANGES = [
  { min: 9000, max: 10000, label: '9000-10000', title: '宇宙核心', leave: 9, rate: [0, 0, 0, 0, 0, 0, 0.4, 0.3, 0.3] },
  { min: 7000, max: 9000, label: '7000-9000', title: '虚空裂隙', leave: 8, rate: [0, 0, 0.3, 0.2, 0.2, 0.1, 0.1, 0.1] },
  { min: 5000, max: 7000, label: '5000-7000', title: '熔岩海', leave: 7, rate: [0, 0.2, 0.2, 0.2, 0.2, 0.1, 0.1] },
  { min: 2000, max: 5000, label: '2000-5000', title: '水晶洞窟', leave: 6, rate: [0.2, 0.2, 0.2, 0.2, 0.2] },
  { min: 500, max: 2000, label: '500-2000', title: '富矿带', leave: 5, rate: [0.3, 0.3, 0.2, 0.1, 0.1] },
  { min: 50, max: 500, label: '50-500', title: '地下矿井', leave: 4, rate: [0.4, 0.3, 0.2, 0.1] },
  { min: 10, max: 50, label: '10-50', title: '碎石层', leave: 3, rate: [0.6, 0.3, 0.1] },
  { min: 1, max: 10, label: '1-10', title: '表层土壤', leave: 2, rate: [0.9, 0.1] },
]

/** 深度里程碑（耐玩反馈） */
export const DEPTH_MILESTONES = [10, 50, 100, 500, 1000, 2000, 5000, 7000, 9000]

/** 连击：连续采集间隔内加成 */
export const COMBO = {
  windowMs: 2500,
  bonusPerStack: 0.08,
  maxBonus: 0.5,
}

export const DIRECTION_PAD = {
  w: { label: '↑', variant: 'up' },
  a: { label: '←', variant: 'left' },
  s: { label: '↓', variant: 'down' },
  d: { label: '→', variant: 'right' },
}

export default {
  CELL_SIZE,
  EXTEND_AMOUNT,
  WORLD_DEFAULT,
  ZOOM,
  ORE_TYPES,
  DEPTH_RANGES,
  DEPTH_MILESTONES,
  COMBO,
  DIRECTION_PAD,
  RARITY,
}

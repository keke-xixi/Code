/** 矿石类型 */
export const ORE_TYPES = {
  1: { name: '土', color: '#8B4513', price: 1, symbol: '🟫' },
  2: { name: '石头', color: '#696969', price: 5, symbol: '🪨' },
  3: { name: '铁', color: '#708090', price: 10, symbol: '⛓️' },
  4: { name: '黄金', color: '#FFD700', price: 30, symbol: '🪙' },
  5: { name: '钻石', color: '#B9F2FF', price: 100, symbol: '💎' },
  6: { name: '红物质', color: '#E0115F', price: 500, symbol: '🔴' },
  7: { name: '虚空水晶', color: '#9966CC', price: 1000, symbol: '🔮' },
  8: { name: '黑洞碎片', color: '#2F4F4F', price: 10000, symbol: '⚫' },
}

/** 深度层：y 越大稀有矿概率越高 */
export const DEPTH_RANGES = [
  { min: 9000, max: 10000, label: '9000-10000', leave: 9, rate: [0, 0, 0, 0, 0, 0, 0.4, 0.3, 0.3] },
  { min: 7000, max: 9000, label: '7000-9000', leave: 8, rate: [0, 0, 0.3, 0.2, 0.2, 0.1, 0.1, 0.1] },
  { min: 5000, max: 7000, label: '5000-7000', leave: 7, rate: [0, 0.2, 0.2, 0.2, 0.2, 0.1, 0.1] },
  { min: 2000, max: 5000, label: '2000-5000', leave: 6, rate: [0.2, 0.2, 0.2, 0.2, 0.2] },
  { min: 500, max: 2000, label: '500-2000', leave: 5, rate: [0.3, 0.3, 0.2, 0.1, 0.1] },
  { min: 50, max: 500, label: '50-500', leave: 4, rate: [0.4, 0.3, 0.2, 0.1] },
  { min: 10, max: 50, label: '10-50', leave: 3, rate: [0.6, 0.3, 0.1] },
  { min: 1, max: 10, label: '1-10', leave: 2, rate: [0.9, 0.1] },
]

export const GAME_CONFIG = {
  CELL_SIZE: 50,
  EXTEND_AMOUNT: 5,
  INITIAL_BOUNDS: { left: 0, right: 20, top: 0, bottom: 20 },
  INITIAL_POSITION: { x: 10, y: 10 },
  SCALE_MIN: 0.5,
  SCALE_MAX: 3,
  SCALE_STEP: 0.2,
  VIEW_THRESHOLD: 50,
  SWIPE_THRESHOLD: 30,
  SWIPE_COOLDOWN_MS: 100,
  ZOOM_ANIM_MS: 300,
  MOVE_ANIM_MS: 200,
  UNBROKEN_CELL_COLOR: '#1a1210',
}

/** 未挖掘格子的默认矿石展示 */
export const DEFAULT_ORE = { name: '岩层', color: '#4a4a4a', price: 0 }

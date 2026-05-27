/** 商店品阶前缀（用于拼接名称） */
export const TIER_NAMES = [
  '工具',
  '基础',
  '高级',
  '精英',
  '终极',
  '绝对',
  '最高',
  '宇宙',
  '无穷',
]

const tier = (i, effects, price) => ({
  level: i + 1,
  tierName: TIER_NAMES[i],
  price,
  ...effects,
})

/**
 * 商店目录：每类最多 9 级，逐级购买
 * owned[categoryId] = 当前等级 (0=未购买)
 */
export const SHOP_CATALOG = [
  {
    id: 'auto_collect',
    name: '自动矿袋',
    icon: '💰',
    suffix: '矿袋',
    desc: '凿开即入账，并自动搜刮周围已暴露矿石',
    tiers: [
      tier(0, { autoOnBreak: true, pickupRadius: 0 }, 150),
      tier(1, { autoOnBreak: true, pickupRadius: 1 }, 800),
      tier(2, { autoOnBreak: true, pickupRadius: 2 }, 3500),
      tier(3, { autoOnBreak: true, pickupRadius: 3 }, 12000),
      tier(4, { autoOnBreak: true, pickupRadius: 4 }, 45000),
      tier(5, { autoOnBreak: true, pickupRadius: 5 }, 150000),
      tier(6, { autoOnBreak: true, pickupRadius: 6 }, 500000),
      tier(7, { autoOnBreak: true, pickupRadius: 8 }, 2000000),
      tier(8, { autoOnBreak: true, pickupRadius: 12 }, 8000000),
    ],
  },
  {
    id: 'mining_yield',
    name: '产金增幅',
    icon: '✨',
    suffix: '金印',
    desc: '提升矿石结算金币',
    tiers: [
      tier(0, { goldMultiplier: 1.08 }, 200),
      tier(1, { goldMultiplier: 1.15 }, 1000),
      tier(2, { goldMultiplier: 1.25 }, 5000),
      tier(3, { goldMultiplier: 1.4 }, 20000),
      tier(4, { goldMultiplier: 1.6 }, 80000),
      tier(5, { goldMultiplier: 1.85 }, 300000),
      tier(6, { goldMultiplier: 2.15 }, 1000000),
      tier(7, { goldMultiplier: 2.6 }, 4000000),
      tier(8, { goldMultiplier: 3.2 }, 15000000),
    ],
  },
  {
    id: 'mining_speed',
    name: '迅掘',
    icon: '⚡',
    suffix: '靴',
    desc: '移动与挥镐更快',
    tiers: [
      tier(0, { moveMs: 170, mineMs: 280 }, 180),
      tier(1, { moveMs: 140, mineMs: 240 }, 900),
      tier(2, { moveMs: 115, mineMs: 200 }, 4000),
      tier(3, { moveMs: 95, mineMs: 170 }, 15000),
      tier(4, { moveMs: 75, mineMs: 140 }, 55000),
      tier(5, { moveMs: 60, mineMs: 110 }, 200000),
      tier(6, { moveMs: 45, mineMs: 90 }, 700000),
      tier(7, { moveMs: 32, mineMs: 70 }, 2500000),
      tier(8, { moveMs: 20, mineMs: 50 }, 10000000),
    ],
  },
  {
    id: 'break_power',
    name: '破岩',
    icon: '⛏️',
    suffix: '之力',
    desc: '一镐凿穿并直接收矿（无需踩第二次）',
    tiers: [
      tier(0, { oneHitMine: true }, 500),
      tier(1, { oneHitMine: true, bonusBreakRadius: 0 }, 2500),
      tier(2, { oneHitMine: true, bonusBreakRadius: 1 }, 10000),
      tier(3, { oneHitMine: true, bonusBreakRadius: 1 }, 40000),
      tier(4, { oneHitMine: true, bonusBreakRadius: 2 }, 160000),
      tier(5, { oneHitMine: true, bonusBreakRadius: 2 }, 600000),
      tier(6, { oneHitMine: true, bonusBreakRadius: 3 }, 2200000),
      tier(7, { oneHitMine: true, bonusBreakRadius: 3 }, 8000000),
      tier(8, { oneHitMine: true, bonusBreakRadius: 4 }, 30000000),
    ],
  },
  {
    id: 'pickaxe_skin',
    name: '神镐涂装',
    icon: '🎨',
    suffix: '镐',
    desc: '更换镐头光芒颜色（纯外观）',
    tiers: [
      tier(0, { pickColor: '#c0c0c0', pickGlow: '#e8e8e8' }, 100),
      tier(1, { pickColor: '#cd7f32', pickGlow: '#ffb347' }, 500),
      tier(2, { pickColor: '#ffd700', pickGlow: '#fff4a3' }, 2000),
      tier(3, { pickColor: '#7ee8ff', pickGlow: '#c8f7ff' }, 8000),
      tier(4, { pickColor: '#b366ff', pickGlow: '#e0b0ff' }, 30000),
      tier(5, { pickColor: '#ff6b9d', pickGlow: '#ffb3d9' }, 120000),
      tier(6, { pickColor: '#4ade80', pickGlow: '#9ae6b0' }, 450000),
      tier(7, { pickColor: '#ff4500', pickGlow: '#ff8c69' }, 1800000),
      tier(8, { pickColor: '#ffffff', pickGlow: '#e0ffff' }, 7000000),
    ],
  },
  {
    id: 'metal_detector',
    name: '金属探测',
    icon: '📡',
    suffix: '仪',
    desc: '预知周围岩层内的矿脉品质',
    tiers: [
      tier(0, { detectorRadius: 1, showRarity: 'uncommon' }, 300),
      tier(1, { detectorRadius: 2, showRarity: 'uncommon' }, 1500),
      tier(2, { detectorRadius: 3, showRarity: 'rare' }, 6000),
      tier(3, { detectorRadius: 4, showRarity: 'rare' }, 25000),
      tier(4, { detectorRadius: 5, showRarity: 'epic' }, 100000),
      tier(5, { detectorRadius: 6, showRarity: 'epic' }, 380000),
      tier(6, { detectorRadius: 8, showRarity: 'legendary' }, 1400000),
      tier(7, { detectorRadius: 10, showRarity: 'legendary' }, 5000000),
      tier(8, { detectorRadius: 14, showRarity: 'legendary' }, 20000000),
    ],
  },
  {
    id: 'lucky_star',
    name: '幸运',
    icon: '🍀',
    suffix: '星',
    desc: '暴击双倍乃至多倍金币',
    tiers: [
      tier(0, { critChance: 0.05, critMultiplier: 2 }, 400),
      tier(1, { critChance: 0.08, critMultiplier: 2 }, 2000),
      tier(2, { critChance: 0.12, critMultiplier: 2.5 }, 9000),
      tier(3, { critChance: 0.16, critMultiplier: 2.5 }, 35000),
      tier(4, { critChance: 0.22, critMultiplier: 3 }, 140000),
      tier(5, { critChance: 0.28, critMultiplier: 3 }, 520000),
      tier(6, { critChance: 0.35, critMultiplier: 3.5 }, 1900000),
      tier(7, { critChance: 0.42, critMultiplier: 4 }, 7000000),
      tier(8, { critChance: 0.5, critMultiplier: 5 }, 28000000),
    ],
  },
  {
    id: 'depth_bonus',
    name: '深潜',
    icon: '🌊',
    suffix: '协议',
    desc: '深度越深，金币结算越高',
    tiers: [
      tier(0, { depthGoldPct: 0.005 }, 250),
      tier(1, { depthGoldPct: 0.01 }, 1200),
      tier(2, { depthGoldPct: 0.018 }, 5500),
      tier(3, { depthGoldPct: 0.028 }, 22000),
      tier(4, { depthGoldPct: 0.04 }, 85000),
      tier(5, { depthGoldPct: 0.055 }, 320000),
      tier(6, { depthGoldPct: 0.075 }, 1200000),
      tier(7, { depthGoldPct: 0.1 }, 4500000),
      tier(8, { depthGoldPct: 0.15 }, 18000000),
    ],
  },
]

export const DEFAULT_EFFECTS = {
  goldMultiplier: 1,
  pickupRadius: 0,
  autoOnBreak: false,
  oneHitMine: false,
  bonusBreakRadius: 0,
  moveMs: 200,
  mineMs: 320,
  pickColor: '#c0c0c0',
  pickGlow: '#e8e8e8',
  detectorRadius: 0,
  showRarity: 'legendary',
  critChance: 0,
  critMultiplier: 2,
  depthGoldPct: 0,
}

const RARITY_RANK = {
  common: 0,
  uncommon: 1,
  rare: 2,
  epic: 3,
  legendary: 4,
}

export const meetsRarity = (oreRarity, minRarity) =>
  (RARITY_RANK[oreRarity] ?? 0) >= (RARITY_RANK[minRarity] ?? 99)

export default SHOP_CATALOG

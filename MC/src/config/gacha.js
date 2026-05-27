/** 抽卡品阶 */
export const GACHA_RARITY = {
  white: {
    id: 'white',
    label: '普通',
    color: '#d8dce3',
    border: '#9aa3b2',
    glow: 'rgba(200, 210, 220, 0.4)',
    weight: 48,
  },
  blue: {
    id: 'blue',
    label: '稀有',
    color: '#7eb8ff',
    border: '#3d8bfd',
    glow: 'rgba(61, 139, 253, 0.55)',
    weight: 30,
  },
  purple: {
    id: 'purple',
    label: '史诗',
    color: '#d4a5ff',
    border: '#9966cc',
    glow: 'rgba(153, 102, 204, 0.6)',
    weight: 15,
  },
  gold: {
    id: 'gold',
    label: '传说',
    color: '#ffd700',
    border: '#e8b923',
    glow: 'rgba(255, 215, 0, 0.65)',
    weight: 6,
  },
  red: {
    id: 'red',
    label: '神话',
    color: '#ff6b6b',
    border: '#e0115f',
    glow: 'rgba(255, 50, 80, 0.75)',
    weight: 1,
  },
}

/** 抽卡价格 */
export const GACHA_COST = {
  single: { gold: 380, diamond: 1 },
  multi: { gold: 3400, diamond: 9, count: 10 },
}

/** 保底：连续未出紫及以上时强制 */
export const GACHA_PITY = {
  purpleMin: 25,
  redMin: 120,
}

/**
 * 奖池 item.type:
 * - gold / diamond：直接到账
 * - upgrade：随机升级一个已购类目 +1（未满级）
 * - upgrade_pick：玩家购买时用 categoryId（红卡全类目+1 特殊处理）
 */
export const GACHA_POOL = [
  // 白
  { id: 'w_g50', rarity: 'white', type: 'gold', amount: 50, name: '零钱袋', icon: '💰', desc: '金币 +50' },
  { id: 'w_g80', rarity: 'white', type: 'gold', amount: 80, name: '铜矿收益', icon: '🪙', desc: '金币 +80' },
  { id: 'w_g120', rarity: 'white', type: 'gold', amount: 120, name: '碎石补贴', icon: '⛏️', desc: '金币 +120' },
  { id: 'w_d1', rarity: 'white', type: 'diamond', amount: 1, name: '碎钻', icon: '💎', desc: '钻石 +1' },
  { id: 'w_snack', rarity: 'white', type: 'gold', amount: 30, name: '矿工便当', icon: '🍞', desc: '金币 +30' },
  { id: 'w_ore', rarity: 'white', type: 'gold', amount: 100, name: '土块回购', icon: '🟫', desc: '金币 +100' },

  // 蓝
  { id: 'b_g300', rarity: 'blue', type: 'gold', amount: 300, name: '铁矿箱', icon: '📦', desc: '金币 +300' },
  { id: 'b_g500', rarity: 'blue', type: 'gold', amount: 500, name: '银矿箱', icon: '🎁', desc: '金币 +500' },
  { id: 'b_d2', rarity: 'blue', type: 'diamond', amount: 2, name: '双钻', icon: '💎', desc: '钻石 +2' },
  { id: 'b_d3', rarity: 'blue', type: 'diamond', amount: 3, name: '小钻袋', icon: '👝', desc: '钻石 +3' },
  { id: 'b_up1', rarity: 'blue', type: 'upgrade', amount: 1, name: '工具强化券', icon: '🎫', desc: '随机装备 +1 级' },
  { id: 'b_g800', rarity: 'blue', type: 'gold', amount: 800, name: '矿井分红', icon: '💼', desc: '金币 +800' },

  // 紫
  { id: 'p_g2k', rarity: 'purple', type: 'gold', amount: 2000, name: '黄金仓', icon: '🏆', desc: '金币 +2000' },
  { id: 'p_g5k', rarity: 'purple', type: 'gold', amount: 5000, name: '富豪保险箱', icon: '🔐', desc: '金币 +5000' },
  { id: 'p_d5', rarity: 'purple', type: 'diamond', amount: 5, name: '钻光礼盒', icon: '✨', desc: '钻石 +5' },
  { id: 'p_d8', rarity: 'purple', type: 'diamond', amount: 8, name: '紫晶宝库', icon: '🔮', desc: '钻石 +8' },
  { id: 'p_up2', rarity: 'purple', type: 'upgrade', amount: 2, name: '精英锻造券', icon: '⚒️', desc: '随机装备 +2 级' },
  { id: 'p_combo', rarity: 'purple', type: 'gold', amount: 3500, name: '连击赏金', icon: '⚡', desc: '金币 +3500' },

  // 金
  { id: 'g_g15k', rarity: 'gold', type: 'gold', amount: 15000, name: '龙窟宝藏', icon: '🐉', desc: '金币 +15000' },
  { id: 'g_g30k', rarity: 'gold', type: 'gold', amount: 30000, name: '王座金库', icon: '👑', desc: '金币 +30000' },
  { id: 'g_d15', rarity: 'gold', type: 'diamond', amount: 15, name: '传说钻箱', icon: '💠', desc: '钻石 +15' },
  { id: 'g_d25', rarity: 'gold', type: 'diamond', amount: 25, name: '耀金钻石', icon: '🌟', desc: '钻石 +25' },
  { id: 'g_up3', rarity: 'gold', type: 'upgrade', amount: 3, name: '传说进阶书', icon: '📜', desc: '随机装备 +3 级' },
  { id: 'g_all1', rarity: 'gold', type: 'upgrade_all', amount: 1, name: '全员特训', icon: '🎖️', desc: '全部装备 +1 级' },

  // 红（低概率）
  { id: 'r_d100', rarity: 'red', type: 'diamond', amount: 100, name: '百钻神匣', icon: '💎', desc: '钻石 +100' },
  { id: 'r_d60', rarity: 'red', type: 'diamond', amount: 60, name: '赤焰钻池', icon: '🔥', desc: '钻石 +60' },
  { id: 'r_g100k', rarity: 'red', type: 'gold', amount: 100000, name: '宇宙金矿', icon: '🌌', desc: '金币 +100000' },
  { id: 'r_all2', rarity: 'red', type: 'upgrade_all', amount: 2, name: '神话觉醒', icon: '∞', desc: '全部装备 +2 级' },
  { id: 'r_max', rarity: 'red', type: 'upgrade_max', amount: 1, name: '无穷契约', icon: '🏅', desc: '随机满级一件装备' },
  { id: 'r_d80g50k', rarity: 'red', type: 'bundle', gold: 50000, diamond: 80, name: '神话大礼包', icon: '🎊', desc: '5万金币 +80钻' },
]

export default { GACHA_RARITY, GACHA_POOL, GACHA_COST, GACHA_PITY }

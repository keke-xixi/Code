import {
  GACHA_RARITY,
  GACHA_POOL,
  GACHA_COST,
  GACHA_PITY,
} from '@/config/gacha.js'
import { SHOP_CATALOG } from '@/config/shop.js'

const RARITY_ORDER = ['white', 'blue', 'purple', 'gold', 'red']
const RARITY_RANK = { white: 0, blue: 1, purple: 2, gold: 3, red: 4 }

const poolByRarity = GACHA_POOL.reduce((acc, item) => {
  if (!acc[item.rarity]) acc[item.rarity] = []
  acc[item.rarity].push(item)
  return acc
}, {})

const totalWeight = Object.values(GACHA_RARITY).reduce((s, r) => s + r.weight, 0)

const rollRarity = () => {
  let roll = Math.random() * totalWeight
  for (const key of RARITY_ORDER) {
    const w = GACHA_RARITY[key].weight
    if (roll < w) return key
    roll -= w
  }
  return 'white'
}

const pickItem = (rarity) => {
  const list = poolByRarity[rarity] || poolByRarity.white
  return list[Math.floor(Math.random() * list.length)]
}

const upgradableCategories = (owned) =>
  SHOP_CATALOG.filter((c) => (owned[c.id] || 0) < c.tiers.length).map((c) => c.id)

const applyRandomUpgrade = (owned, levels = 1) => {
  const cats = upgradableCategories(owned)
  if (!cats.length) return { owned, categoryId: null }
  const id = cats[Math.floor(Math.random() * cats.length)]
  const newOwned = { ...owned, [id]: (owned[id] || 0) + levels }
  const cat = SHOP_CATALOG.find((c) => c.id === id)
  const tierIndex = Math.min(newOwned[id] - 1, cat.tiers.length - 1)
  return {
    owned: newOwned,
    categoryId: id,
    tierName: `${cat.tiers[tierIndex].tierName}${cat.suffix}`,
  }
}

const applyUpgradeAll = (owned, levels = 1) => {
  const newOwned = { ...owned }
  for (const cat of SHOP_CATALOG) {
    const cur = newOwned[cat.id] || 0
    newOwned[cat.id] = Math.min(cur + levels, cat.tiers.length)
  }
  return newOwned
}

const applyUpgradeMax = (owned) => {
  const cats = upgradableCategories(owned)
  if (!cats.length) return { owned, categoryId: null }
  const id = cats[Math.floor(Math.random() * cats.length)]
  const cat = SHOP_CATALOG.find((c) => c.id === id)
  return {
    owned: { ...owned, [id]: cat.tiers.length },
    categoryId: id,
    tierName: `${cat.tiers[cat.tiers.length - 1].tierName}${cat.suffix}`,
  }
}

/** 发放单件奖励，返回资源变动 */
export const grantGachaItem = (item, owned, resources) => {
  let { gold, diamond, ownedUpgrades } = resources
  let extra = {}

  switch (item.type) {
    case 'gold':
      gold += item.amount || 0
      break
    case 'diamond':
      diamond += item.amount || 0
      break
    case 'bundle':
      gold += item.gold || 0
      diamond += item.diamond || 0
      break
    case 'upgrade': {
      const r = applyRandomUpgrade(ownedUpgrades, item.amount || 1)
      ownedUpgrades = r.owned
      extra.upgradeName = r.tierName
      break
    }
    case 'upgrade_all':
      ownedUpgrades = applyUpgradeAll(ownedUpgrades, item.amount || 1)
      extra.upgradeAll = item.amount
      break
    case 'upgrade_max': {
      const r = applyUpgradeMax(ownedUpgrades)
      ownedUpgrades = r.owned
      extra.upgradeName = r.tierName
      break
    }
    default:
      break
  }

  return { gold, diamond, ownedUpgrades, extra }
}

const needsPity = (pityState, minRarity) => {
  const minRank = RARITY_RANK[minRarity]
  const streak = pityState.streak || 0
  if (minRarity === 'purple' && streak >= GACHA_PITY.purpleMin) return 'purple'
  if (minRarity === 'red' && (pityState.redStreak || 0) >= GACHA_PITY.redMin) return 'red'
  return null
}

/** 抽 count 次 */
export const pullGacha = (count, { gold, diamond, owned, pity } = {}, payWith = 'gold') => {
  const costCfg = count >= 10 ? GACHA_COST.multi : GACHA_COST.single
  const pulls = count >= 10 ? costCfg.count : 1
  const costGold = payWith === 'gold' ? (count >= 10 ? costCfg.gold : costCfg.gold * pulls) : 0
  const costDiamond = payWith === 'diamond' ? (count >= 10 ? costCfg.diamond : costCfg.diamond * pulls) : 0

  if (payWith === 'gold' && gold < costGold) {
    return { ok: false, message: '金币不足' }
  }
  if (payWith === 'diamond' && diamond < costDiamond) {
    return { ok: false, message: '钻石不足' }
  }

  let curGold = gold - costGold
  let curDiamond = diamond - costDiamond
  let curOwned = { ...owned }
  const pityState = { streak: pity?.streak || 0, redStreak: pity?.redStreak || 0 }
  const results = []

  for (let i = 0; i < pulls; i++) {
    let rarity = rollRarity()
    const forcePurple = needsPity(pityState, 'purple')
    const forceRed = needsPity(pityState, 'red')
    if (forceRed) rarity = 'red'
    else if (forcePurple && RARITY_RANK[rarity] < RARITY_RANK.purple) {
      rarity = 'purple'
    }

    const item = { ...pickItem(rarity), rarityMeta: GACHA_RARITY[rarity] }
    const granted = grantGachaItem(item, curOwned, {
      gold: curGold,
      diamond: curDiamond,
      ownedUpgrades: curOwned,
    })
    curGold = granted.gold
    curDiamond = granted.diamond
    curOwned = granted.ownedUpgrades

    if (RARITY_RANK[rarity] >= RARITY_RANK.purple) {
      pityState.streak = 0
    } else {
      pityState.streak += 1
    }
    if (rarity === 'red') {
      pityState.redStreak = 0
    } else {
      pityState.redStreak += 1
    }

    results.push({ ...item, extra: granted.extra })
  }

  return {
    ok: true,
    results,
    gold: curGold,
    diamond: curDiamond,
    owned: curOwned,
    pity: pityState,
    cost: { gold: costGold, diamond: costDiamond },
  }
}

export const getGachaRatesText = () =>
  RARITY_ORDER.map((k) => {
    const r = GACHA_RARITY[k]
    return `${r.label} ${((r.weight / totalWeight) * 100).toFixed(1)}%`
  }).join(' · ')

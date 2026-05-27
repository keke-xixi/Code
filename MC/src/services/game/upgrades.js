import {
  SHOP_CATALOG,
  DEFAULT_EFFECTS,
  TIER_NAMES,
} from '@/config/shop.js'

/** 合并已购等级 → 最终效果（同类取最高级条目） */
export const computeUpgradeEffects = (owned = {}) => {
  const effects = { ...DEFAULT_EFFECTS }

  for (const cat of SHOP_CATALOG) {
    const level = owned[cat.id] || 0
    if (level < 1) continue
    const tier = cat.tiers[Math.min(level - 1, cat.tiers.length - 1)]
    if (!tier) continue

    if (tier.goldMultiplier != null) {
      effects.goldMultiplier *= tier.goldMultiplier
    }
    if (tier.pickupRadius != null) {
      effects.pickupRadius = Math.max(effects.pickupRadius, tier.pickupRadius)
    }
    if (tier.autoOnBreak) effects.autoOnBreak = true
    if (tier.oneHitMine) effects.oneHitMine = true
    if (tier.bonusBreakRadius != null) {
      effects.bonusBreakRadius = Math.max(
        effects.bonusBreakRadius,
        tier.bonusBreakRadius,
      )
    }
    if (tier.moveMs != null) {
      effects.moveMs = Math.min(effects.moveMs, tier.moveMs)
    }
    if (tier.mineMs != null) {
      effects.mineMs = Math.min(effects.mineMs, tier.mineMs)
    }
    if (tier.pickColor) effects.pickColor = tier.pickColor
    if (tier.pickGlow) effects.pickGlow = tier.pickGlow
    if (tier.detectorRadius != null) {
      effects.detectorRadius = Math.max(
        effects.detectorRadius,
        tier.detectorRadius,
      )
    }
    if (tier.showRarity) effects.showRarity = tier.showRarity
    if (tier.critChance != null) {
      effects.critChance = Math.max(effects.critChance, tier.critChance)
    }
    if (tier.critMultiplier != null) {
      effects.critMultiplier = Math.max(
        effects.critMultiplier,
        tier.critMultiplier,
      )
    }
    if (tier.depthGoldPct != null) {
      effects.depthGoldPct = Math.max(effects.depthGoldPct, tier.depthGoldPct)
    }
  }

  return effects
}

export const getCategoryLevel = (owned, categoryId) => owned[categoryId] || 0

export const getNextTier = (owned, categoryId) => {
  const cat = SHOP_CATALOG.find((c) => c.id === categoryId)
  if (!cat) return null
  const level = getCategoryLevel(owned, categoryId)
  if (level >= cat.tiers.length) return null
  return cat.tiers[level]
}

export const getTierDisplayName = (cat, tierIndex) => {
  const t = cat.tiers[tierIndex]
  if (!t) return ''
  return `${t.tierName}${cat.suffix}`
}

export const buildShopList = (owned = {}) =>
  SHOP_CATALOG.map((cat) => {
    const level = getCategoryLevel(owned, cat.id)
    const next = getNextTier(owned, cat.id)
    const currentName =
      level > 0 ? getTierDisplayName(cat, level - 1) : '未装备'
    return {
      ...cat,
      level,
      maxLevel: cat.tiers.length,
      currentName,
      nextTier: next
        ? {
            ...next,
            displayName: getTierDisplayName(cat, level),
          }
        : null,
    }
  })

export const canPurchase = (owned, categoryId, money) => {
  const next = getNextTier(owned, categoryId)
  if (!next) return false
  return money >= next.price
}

export const purchaseUpgrade = (owned, categoryId, money) => {
  const next = getNextTier(owned, categoryId)
  if (!next || money < next.price) {
    return { ok: false, message: '金币不足或已满级' }
  }
  const newOwned = { ...owned, [categoryId]: (owned[categoryId] || 0) + 1 }
  return {
    ok: true,
    owned: newOwned,
    cost: next.price,
    moneyLeft: money - next.price,
    boughtName: getTierDisplayName(
      SHOP_CATALOG.find((c) => c.id === categoryId),
      newOwned[categoryId] - 1,
    ),
  }
}

export { SHOP_CATALOG, TIER_NAMES }

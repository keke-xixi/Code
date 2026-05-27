import {
  SHOP_CATALOG,
  DEFAULT_EFFECTS,
  TIER_NAMES,
} from '@/config/shop.js'

/** 是否已装备（已购且未在卸下列表中） */
export const isCategoryEquipped = (disabled = {}, categoryId, level) => {
  if (!level || level < 1) return false
  return !disabled[categoryId]
}

/** 合并已购且已装备 → 最终效果 */
export const computeUpgradeEffects = (owned = {}, disabled = {}) => {
  const effects = { ...DEFAULT_EFFECTS }

  for (const cat of SHOP_CATALOG) {
    const level = owned[cat.id] || 0
    if (level < 1 || disabled[cat.id]) continue
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
    if (tier.absorbRadius != null) {
      effects.absorbRadius = Math.max(effects.absorbRadius, tier.absorbRadius)
    }
    if (tier.absorbCooldownMs != null) {
      effects.absorbCooldownMs =
        effects.absorbCooldownMs > 0
          ? Math.min(effects.absorbCooldownMs, tier.absorbCooldownMs)
          : tier.absorbCooldownMs
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

export const buildShopList = (owned = {}, disabled = {}) =>
  SHOP_CATALOG.map((cat) => {
    const level = getCategoryLevel(owned, cat.id)
    const next = getNextTier(owned, cat.id)
    const equipped = isCategoryEquipped(disabled, cat.id, level)
    const currentName =
      level > 0 ? getTierDisplayName(cat, level - 1) : '未购买'
    return {
      ...cat,
      level,
      equipped,
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

/** 购买后自动装备（从卸下列表移除） */
export const equipAfterPurchase = (disabled, categoryId) => {
  if (!disabled[categoryId]) return disabled
  const next = { ...disabled }
  delete next[categoryId]
  return next
}

/** 切换装备 / 卸下 */
export const toggleEquipment = (disabled, categoryId, owned) => {
  const level = getCategoryLevel(owned, categoryId)
  if (level < 1) {
    return { ok: false, message: '尚未购买该装备' }
  }
  const next = { ...disabled }
  if (next[categoryId]) {
    delete next[categoryId]
    return { ok: true, disabled: next, equipped: true }
  }
  next[categoryId] = true
  return { ok: true, disabled: next, equipped: false }
}

export { SHOP_CATALOG, TIER_NAMES }

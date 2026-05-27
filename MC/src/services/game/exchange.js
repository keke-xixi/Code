import { DIAMOND_EXCHANGE_PACKS } from '@/config/exchange.js'

export const getExchangePacks = () => DIAMOND_EXCHANGE_PACKS

export const exchangeDiamondForGold = (diamonds, packId) => {
  const pack = DIAMOND_EXCHANGE_PACKS.find((p) => p.id === packId)
  if (!pack) return { ok: false, message: '兑换档位不存在' }
  if (diamonds < pack.diamonds) {
    return { ok: false, message: `需要 ${pack.diamonds} 钻` }
  }
  return {
    ok: true,
    diamondsLeft: diamonds - pack.diamonds,
    gold: pack.gold,
    pack,
  }
}

import { GACHA_RARITY } from '@/config/gacha.js'

/** 品阶 → 动画星级（对齐原大屏 3/4/5 星逻辑） */
export const RARITY_STAR = {
  white: 3,
  blue: 3,
  purple: 4,
  gold: 5,
  red: 5,
}

/** 粒子 / 光效配色 */
export const ANIM_COLORS = {
  3: ['#a0a0a0', '#c0c0c0', '#d3d3d3'],
  4: ['#9c27b0', '#673ab7', '#9575cd'],
  5: ['#ff9800', '#ffeb3b', '#ffc107'],
}

export const rarityToStars = (rarity) => RARITY_STAR[rarity] || 3

export const getAnimTheme = (rarity) => {
  const meta = GACHA_RARITY[rarity] || GACHA_RARITY.white
  const stars = rarityToStars(rarity)
  const colorSet = stars >= 5 ? ANIM_COLORS[5] : stars >= 4 ? ANIM_COLORS[4] : ANIM_COLORS[3]
  return {
    stars,
    border: meta.border,
    color: meta.color,
    glow: meta.glow,
    label: meta.label,
    colorSet,
    lightColor:
      stars >= 5
        ? 'rgba(255,215,0,0.85)'
        : stars >= 4
          ? 'rgba(156,39,176,0.8)'
          : 'rgba(160,160,160,0.75)',
    cardSize: stars >= 5 ? 220 : stars >= 4 ? 200 : 180,
    particleCount: stars >= 5 ? 56 : stars >= 4 ? 42 : 32,
    effectRange: stars >= 5 ? 420 : stars >= 4 ? 340 : 280,
  }
}

/** 生成粒子数据（供 Vue  overlay 渲染，全端可用） */
export const createParticleBatch = (theme, centerX, centerY) => {
  const list = []
  const { colorSet, particleCount, effectRange } = theme

  for (let i = 0; i < particleCount; i++) {
    const angle = Math.random() * Math.PI * 2
    const distance = effectRange * 0.25 + Math.random() * effectRange * 0.75
    const size = (theme.stars >= 5 ? 5 : 4) + Math.random() * 4
    list.push({
      id: `p-${i}-${Date.now()}`,
      x: centerX,
      y: centerY,
      dx: Math.cos(angle) * distance,
      dy: Math.sin(angle) * distance,
      size,
      color: colorSet[Math.floor(Math.random() * colorSet.length)],
      duration: 800 + Math.random() * 900,
    })
  }
  return list
}

/**
 * H5 可选：DOM 粒子（小程序走 GachaEffectOverlay）
 */
export function useGachaEffectDom(elementRef, options = {}) {
  // #ifdef H5
  if (typeof document === 'undefined') return null

  const config = {
    rarity: 3,
    duration: 1500,
    ...options,
  }

  const triggerGacha = (x, y, rarity = config.rarity) => {
    const theme = getAnimTheme(
      Object.keys(RARITY_STAR).find((k) => RARITY_STAR[k] === rarity) || 'white',
    )
    const particles = createParticleBatch(theme, x, y)
    particles.forEach((p) => {
      const el = document.createElement('div')
      el.style.cssText = `
        position:fixed;left:${p.x}px;top:${p.y}px;width:${p.size}px;height:${p.size}px;
        background:${p.color};border-radius:50%;pointer-events:none;z-index:9999;
        animation: gacha-particle-fly ${p.duration}ms ease-out forwards;
        --dx:${p.dx}px;--dy:${p.dy}px;
      `
      document.body.appendChild(el)
      setTimeout(() => el.remove(), p.duration)
    })
  }

  return { triggerGacha, setRarity: (r) => { config.rarity = r } }
  // #endif
  return null
}

export default {
  rarityToStars,
  getAnimTheme,
  createParticleBatch,
  useGachaEffectDom,
}

<template>
  <view class="gacha-page" :style="{ height: pageHeight + 'px' }">
    <!-- 顶栏 -->
    <view class="gacha-page__header">
      <view class="gacha-page__back" @tap="goBack">←</view>
      <view class="gacha-page__head-text">
        <text class="gacha-page__title">深渊召唤</text>
        <text class="gacha-page__sub">白 · 蓝 · 紫 · 金 · 红</text>
      </view>
      <view class="gacha-page__header-right">
        <view
          class="gacha-page__pity-btn"
          aria-label="保底详情"
          @tap="pityOpen = true"
        >
          <text class="gacha-page__pity-btn-icon">👁</text>
        </view>
        <view class="gacha-page__wallet">
          <text>💰 {{ formatMoney(money) }}</text>
          <text v-if="diamonds > 0">💎 {{ diamonds }}</text>
        </view>
      </view>
    </view>

    <!-- 主召唤区 -->
    <view class="gacha-page__stage">
      <view class="gacha-page__ring gacha-page__ring--1" />
      <view class="gacha-page__ring gacha-page__ring--2" />
      <view class="gacha-page__portal" :class="{ 'gacha-page__portal--busy': animating }">
        <text class="gacha-page__portal-icon">{{ animating ? '…' : '✨' }}</text>
      </view>
      <text v-if="animating" class="gacha-page__stage-hint">召唤中</text>
    </view>

    <!-- 操作按钮 -->
    <view class="gacha-page__actions">
      <view class="act-btn act-btn--gold" @tap="doPull(1, 'gold')">
        <text class="act-btn__label">单抽</text>
        <text class="act-btn__cost">💰 {{ GACHA_COST.single.gold }}</text>
      </view>
      <view class="act-btn act-btn--dia" @tap="doPull(1, 'diamond')">
        <text class="act-btn__label">单抽</text>
        <text class="act-btn__cost">💎 {{ GACHA_COST.single.diamond }}</text>
      </view>
      <view class="act-btn act-btn--ten" @tap="doPull(10, 'gold')">
        <text class="act-btn__label">十连</text>
        <text class="act-btn__cost">💰 {{ GACHA_COST.multi.gold }}</text>
      </view>
      <view class="act-btn act-btn--ten-dia" @tap="doPull(10, 'diamond')">
        <text class="act-btn__label">十连</text>
        <text class="act-btn__cost">💎 {{ GACHA_COST.multi.diamond }}</text>
      </view>
    </view>

    <!-- 概率 -->
    <view class="gacha-page__rates">
      <view
        v-for="r in rarityList"
        :key="r.id"
        class="rate-tag"
        :style="{ borderColor: r.border, color: r.color, boxShadow: `0 0 8px ${r.glow}` }"
      >
        {{ r.label }}
      </view>
    </view>

    <!-- 动画层 -->
    <GachaEffectOverlay
      ref="fxRef"
      :rarity="fxRarity"
      :item="fxItem"
      @complete="onFxComplete"
    />

    <!-- 十连结果 -->
    <view v-if="resultOpen" class="result-mask" @tap="resultOpen = false">
      <view class="result-panel" @tap.stop>
        <text class="result-panel__title">召唤结果</text>
        <scroll-view scroll-y class="result-panel__scroll">
          <view class="result-grid">
            <view
              v-for="(card, i) in lastResults"
              :key="i"
              class="result-card"
              :style="resultCardStyle(card.rarity)"
            >
              <text class="result-card__icon">{{ card.icon }}</text>
              <text class="result-card__rarity">{{ rarityMap[card.rarity]?.label }}</text>
              <text class="result-card__name">{{ card.name }}</text>
            </view>
          </view>
        </scroll-view>
        <view class="result-panel__ok" @tap="resultOpen = false">收下</view>
      </view>
    </view>

    <view v-if="pityOpen" class="pity-mask" @tap="pityOpen = false">
      <view class="pity-panel" @tap.stop>
        <text class="pity-panel__title">保底详情</text>
        <view class="pity-panel__row">
          <text class="pity-panel__name">史诗及以上（紫+）</text>
          <text class="pity-panel__val">还差 {{ pityPurpleLeft }} 抽必出</text>
          <text class="pity-panel__sub">已 {{ gachaPity.streak || 0 }} / {{ GACHA_PITY.purpleMin }} 抽未出紫+</text>
        </view>
        <view class="pity-panel__row pity-panel__row--red">
          <text class="pity-panel__name">神话（红）</text>
          <text class="pity-panel__val">还差 {{ pityRedLeft }} 抽必出</text>
          <text class="pity-panel__sub">已 {{ gachaPity.redStreak || 0 }} / {{ GACHA_PITY.redMin }} 抽未出红</text>
        </view>
        <text class="pity-panel__tip">使用下方单抽 / 十连进行召唤</text>
        <view class="pity-panel__ok" @tap="pityOpen = false">知道了</view>
      </view>
    </view>

    <ToastMessage ref="toastRef" :duration="1400" />
  </view>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue'
import { GACHA_RARITY, GACHA_COST, GACHA_PITY } from '@/config/gacha.js'
import { loadSave, persistSave } from '@/services/game/save.js'
import { pullGacha as runPull } from '@/services/game/gacha.js'
import GachaEffectOverlay from '@/components/game/GachaEffectOverlay.vue'
import ToastMessage from '@/components/toast/toastMessage.vue'
import { getSystemMetrics } from '@/utils/system.js'

const toastRef = ref(null)
const pageHeight = ref(600)
const pityOpen = ref(false)

const money = ref(0)
const diamonds = ref(0)
const ownedUpgrades = ref({})
const gachaPity = ref({ streak: 0, redStreak: 0 })

const animating = ref(false)
const fxRef = ref(null)
const fxRarity = ref('white')
const fxItem = ref(null)
const resultOpen = ref(false)
const lastResults = ref([])
const pendingResults = ref(null)

const rarityList = Object.values(GACHA_RARITY)
const rarityMap = GACHA_RARITY
const RANK = { white: 0, blue: 1, purple: 2, gold: 3, red: 4 }

const pityPurpleLeft = computed(() =>
  Math.max(0, GACHA_PITY.purpleMin - (gachaPity.value.streak || 0)),
)
const pityRedLeft = computed(() =>
  Math.max(0, GACHA_PITY.redMin - (gachaPity.value.redStreak || 0)),
)

const formatMoney = (n) => {
  if (n >= 10000) return (n / 10000).toFixed(1) + '万'
  if (n >= 1000) return (n / 1000).toFixed(1) + 'k'
  return String(n)
}

const persistAll = () => {
  persistSave({
    money: money.value,
    moveTrack: uni.getStorageSync('MC_MOVE_TRACK') || [],
    position: uni.getStorageSync('MC_USER_POSITION') || { x: 10, y: 10 },
    worldOres: uni.getStorageSync('MC_WORLD_ORES'),
    maxDepth: uni.getStorageSync('MC_MAX_DEPTH') || 0,
    totalCollected: uni.getStorageSync('MC_TOTAL_COLLECTED') || 0,
    upgrades: ownedUpgrades.value,
    diamonds: diamonds.value,
    gachaPity: gachaPity.value,
  })
}

const loadWallet = () => {
  const save = loadSave()
  money.value = save.money
  diamonds.value = save.diamonds
  ownedUpgrades.value = save.upgrades
  gachaPity.value = save.gachaPity
}

const pickBest = (results) =>
  results.reduce((a, b) => ((RANK[b.rarity] || 0) > (RANK[a.rarity] || 0) ? b : a), results[0])

const resultCardStyle = (rarity) => {
  const r = GACHA_RARITY[rarity] || GACHA_RARITY.white
  return {
    borderColor: r.border,
    boxShadow: `0 0 14px ${r.glow}`,
  }
}

const playFx = (results) => {
  const best = pickBest(results)
  fxRarity.value = best.rarity
  fxItem.value = best
  nextTick(() => fxRef.value?.play())
}

const onFxComplete = () => {
  animating.value = false
  if (pendingResults.value?.length > 1) {
    lastResults.value = pendingResults.value
    resultOpen.value = true
  }
  pendingResults.value = null
}

const doPull = (count, payWith) => {
  if (animating.value) return

  const res = runPull(count, {
    gold: money.value,
    diamond: diamonds.value,
    owned: ownedUpgrades.value,
    pity: gachaPity.value,
  }, payWith)

  if (!res.ok) {
    toastRef.value?.showWarning(res.message)
    return
  }

  money.value = res.gold
  diamonds.value = res.diamond
  ownedUpgrades.value = res.owned
  gachaPity.value = res.pity
  persistAll()

  animating.value = true
  pendingResults.value = res.results

  const best = pickBest(res.results)
  if (best.rarity === 'red') {
    toastRef.value?.showSuccess(`神话 · ${best.name}`)
  } else if (best.rarity === 'gold') {
    toastRef.value?.showSuccess(`传说 · ${best.name}`)
  }

  playFx(res.results)

  if (res.results.length === 1) {
    pendingResults.value = null
  }
}

const goBack = () => uni.navigateBack()

onMounted(() => {
  const sys = getSystemMetrics()
  pageHeight.value = sys.windowHeight
  loadWallet()
})
</script>

<style scoped lang="scss">
.gacha-page {
  background: radial-gradient(ellipse at 50% 20%, #2a2048 0%, #0d1018 55%, #050608 100%);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.gacha-page__header {
  display: flex;
  align-items: center;
  padding: calc(12px + env(safe-area-inset-top)) 14px 10px;
  gap: 10px;
}

.gacha-page__back {
  width: 40px;
  height: 40px;
  line-height: 38px;
  text-align: center;
  font-size: 20px;
  color: #fff;
  background: rgba(255, 255, 255, 0.08);
  border-radius: 12px;
}

.gacha-page__head-text {
  flex: 1;
}

.gacha-page__title {
  display: block;
  font-size: 20px;
  font-weight: 800;
  color: #fff;
  letter-spacing: 2px;
}

.gacha-page__sub {
  font-size: 11px;
  color: #8b7aa8;
}

.gacha-page__header-right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 6px;
}

.gacha-page__wallet {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 2px;
  font-size: 12px;
  font-weight: 600;
  color: #ffd700;
}

.gacha-page__pity-btn {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  background: rgba(126, 232, 255, 0.12);
  border: 1px solid rgba(126, 232, 255, 0.35);
}

.gacha-page__pity-btn-icon {
  font-size: 18px;
  line-height: 1;
  opacity: 0.9;
}

.gacha-page__stage {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: relative;
  min-height: 280px;
}

.gacha-page__ring {
  position: absolute;
  border-radius: 50%;
  border: 2px solid rgba(255, 255, 255, 0.08);
}

.gacha-page__ring--1 {
  width: 260px;
  height: 260px;
  animation: ring-spin 12s linear infinite;
}

.gacha-page__ring--2 {
  width: 200px;
  height: 200px;
  border-color: rgba(180, 120, 255, 0.25);
  animation: ring-spin 8s linear infinite reverse;
}

@keyframes ring-spin {
  to {
    transform: rotate(360deg);
  }
}

.gacha-page__portal {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(180, 120, 255, 0.5), transparent 70%);
  display: flex;
  align-items: center;
  justify-content: center;
  animation: portal-pulse 2s ease-in-out infinite;
}

.gacha-page__portal--busy {
  animation: portal-pulse 0.8s ease-in-out infinite;
  opacity: 0.85;
}

.gacha-page__stage-hint {
  margin-top: 12px;
  font-size: 12px;
  color: #8b7aa8;
  letter-spacing: 2px;
}

.gacha-page__portal-icon {
  font-size: 48px;
}

@keyframes portal-pulse {
  0%,
  100% {
    transform: scale(1);
    opacity: 0.8;
  }
  50% {
    transform: scale(1.08);
    opacity: 1;
  }
}

.gacha-page__actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  padding: 0 16px 12px;
}

.act-btn {
  padding: 14px;
  border-radius: 14px;
  text-align: center;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.act-btn__label {
  display: block;
  font-size: 15px;
  font-weight: 700;
  color: #fff;
}

.act-btn__cost {
  display: block;
  font-size: 12px;
  margin-top: 4px;
  color: #ffd700;
}

.act-btn--gold {
  background: linear-gradient(160deg, #3d4a5c, #2a3344);
}
.act-btn--dia {
  background: linear-gradient(160deg, #2a4060, #1a2840);
}
.act-btn--ten {
  background: linear-gradient(160deg, #6b4423, #4a2f18);
  border-color: rgba(255, 215, 0, 0.35);
}
.act-btn--ten-dia {
  background: linear-gradient(160deg, #4a2860, #2a1540);
  border-color: rgba(180, 120, 255, 0.35);
}

.gacha-page__rates {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  align-items: center;
  gap: 8px;
  width: 100%;
  box-sizing: border-box;
  padding: 10px 16px calc(20px + env(safe-area-inset-bottom));
}

.rate-tag {
  font-size: 11px;
  padding: 4px 10px;
  border-radius: 20px;
  border: 1px solid;
  background: rgba(0, 0, 0, 0.35);
}

.pity-mask {
  position: fixed;
  inset: 0;
  z-index: 1200;
  background: rgba(0, 0, 0, 0.65);
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding: calc(56px + env(safe-area-inset-top)) 16px 16px;
}

.pity-panel {
  width: 100%;
  max-width: 360px;
  padding: 18px 16px;
  border-radius: 14px;
  background: linear-gradient(180deg, #1e2838, #121820);
  border: 1px solid rgba(126, 232, 255, 0.3);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.45);
}

.pity-panel__title {
  display: block;
  text-align: center;
  font-size: 17px;
  font-weight: 800;
  color: #fff;
  margin-bottom: 14px;
}

.pity-panel__row {
  padding: 12px;
  margin-bottom: 10px;
  border-radius: 12px;
  background: rgba(126, 184, 255, 0.08);
  border: 1px solid rgba(126, 184, 255, 0.2);
}

.pity-panel__row--red {
  background: rgba(255, 80, 100, 0.08);
  border-color: rgba(255, 80, 100, 0.25);
}

.pity-panel__name {
  display: block;
  font-size: 13px;
  font-weight: 700;
  color: #d4a5ff;
}

.pity-panel__row--red .pity-panel__name {
  color: #ff8e9e;
}

.pity-panel__val {
  display: block;
  margin-top: 6px;
  font-size: 15px;
  font-weight: 700;
  color: #7ee8ff;
}

.pity-panel__row--red .pity-panel__val {
  color: #ffb3c1;
}

.pity-panel__sub {
  display: block;
  margin-top: 4px;
  font-size: 11px;
  color: #6b7a8f;
}

.pity-panel__tip {
  display: block;
  text-align: center;
  font-size: 11px;
  color: #5a6a7f;
  margin: 4px 0 12px;
}

.pity-panel__ok {
  text-align: center;
  padding: 12px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.1);
  color: #c8d0dc;
  font-size: 14px;
  font-weight: 600;
}

.result-mask {
  position: fixed;
  inset: 0;
  z-index: 1500;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.result-panel {
  width: 100%;
  max-width: 360px;
  max-height: 70vh;
  background: #1a2230;
  border-radius: 16px;
  border: 1px solid rgba(255, 215, 0, 0.25);
  padding: 16px;
}

.result-panel__title {
  text-align: center;
  color: #ffd700;
  font-size: 18px;
  font-weight: 700;
  margin-bottom: 12px;
}

.result-panel__scroll {
  max-height: 50vh;
}

.result-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
}

.result-card {
  padding: 12px;
  border-radius: 12px;
  border: 2px solid;
  background: rgba(0, 0, 0, 0.35);
  text-align: center;
}

.result-card__icon {
  font-size: 28px;
  display: block;
}

.result-card__rarity {
  font-size: 10px;
  margin-top: 4px;
  display: block;
}

.result-card__name {
  font-size: 12px;
  color: #fff;
  margin-top: 2px;
  display: block;
}

.result-panel__ok {
  margin-top: 14px;
  text-align: center;
  padding: 12px;
  background: linear-gradient(180deg, #ffe566, #c9a227);
  color: #1a1408;
  font-weight: 700;
  border-radius: 12px;
}
</style>

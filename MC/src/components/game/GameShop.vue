<template>
  <uni-popup ref="popupRef" type="bottom" :safe-area="false">
    <view class="shop-panel">
      <view class="shop-panel__hero">
        <view class="shop-panel__hero-bg" />
        <view class="shop-panel__hero-inner">
          <view class="shop-panel__top">
            <text class="shop-panel__title">⚔️ 装备铺</text>
            <view class="shop-panel__close" @tap="close">✕</view>
          </view>
          <text class="shop-panel__sub">永久强化 · 越挖越强</text>
          <view class="shop-panel__wallet">
            <text class="shop-panel__gold">💰 {{ formatMoney(money) }}</text>
            <text class="shop-panel__dia">💎 {{ diamonds }}</text>
          </view>
        </view>
      </view>

      <scroll-view class="shop-panel__scroll" scroll-y>
        <view class="exchange-block">
          <text class="exchange-block__title">💎 钻石换金币</text>
          <text class="exchange-block__sub">抽卡所得钻石可在此兑换，再去买装备</text>
          <view class="exchange-block__grid">
            <view
              v-for="pack in exchangePacks"
              :key="pack.id"
              class="exchange-card"
              :class="{ 'exchange-card--off': diamonds < pack.diamonds }"
              @tap="onExchange(pack.id)"
            >
              <text class="exchange-card__cost">💎{{ pack.diamonds }}</text>
              <text class="exchange-card__arrow">→</text>
              <text class="exchange-card__gain">💰{{ formatMoney(pack.gold) }}</text>
              <text class="exchange-card__label">{{ pack.label }}</text>
            </view>
          </view>
        </view>

        <text class="shop-panel__section">装备强化</text>

        <view v-for="item in shopList" :key="item.id" class="gear-card">
          <view class="gear-card__icon-wrap">
            <text class="gear-card__icon">{{ item.icon }}</text>
          </view>
          <view class="gear-card__body">
            <text class="gear-card__name">{{ item.name }}</text>
            <text class="gear-card__desc">{{ item.desc }}</text>
            <text class="gear-card__lv">{{ item.currentName }} · Lv.{{ item.level }}/{{ item.maxLevel }}</text>
          </view>
          <view v-if="item.nextTier" class="gear-card__action">
            <text class="gear-card__price">💰 {{ formatMoney(item.nextTier.price) }}</text>
            <view
              class="gear-card__btn"
              :class="{ 'gear-card__btn--off': money < item.nextTier.price }"
              @tap="onBuy(item.id)"
            >
              {{ item.nextTier.displayName }}
            </view>
          </view>
          <text v-else class="gear-card__max">满级</text>
        </view>
      </scroll-view>
    </view>
  </uni-popup>
</template>

<script setup>
import { ref, computed } from 'vue'
import { buildShopList } from '@/services/game/upgrades.js'
import { getExchangePacks } from '@/services/game/exchange.js'

const props = defineProps({
  money: { type: Number, default: 0 },
  diamonds: { type: Number, default: 0 },
  owned: { type: Object, default: () => ({}) },
})

const emit = defineEmits(['buy', 'exchange'])

const popupRef = ref(null)
const shopList = computed(() => buildShopList(props.owned))
const exchangePacks = getExchangePacks()

const formatMoney = (n) => {
  if (n >= 10000) return (n / 10000).toFixed(1) + '万'
  if (n >= 1000) return (n / 1000).toFixed(1) + 'k'
  return String(n)
}

const open = () => popupRef.value?.open()
const close = () => popupRef.value?.close()
const onBuy = (id) => emit('buy', id)
const onExchange = (id) => emit('exchange', id)

defineExpose({ open, close })
</script>

<style scoped lang="scss">
.shop-panel {
  height: 82vh;
  min-height: 480px;
  background: linear-gradient(180deg, #1e2838 0%, #0e1218 100%);
  border-radius: 18px 18px 0 0;
  border-top: 2px solid rgba(255, 215, 0, 0.3);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.shop-panel__hero {
  position: relative;
  padding: 14px 16px 12px;
}

.shop-panel__hero-bg {
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, rgba(255, 200, 80, 0.12), transparent 60%);
}

.shop-panel__hero-inner {
  position: relative;
}

.shop-panel__top {
  display: flex;
  align-items: center;
}

.shop-panel__title {
  flex: 1;
  font-size: 20px;
  font-weight: 800;
  color: #fff;
}

.shop-panel__close {
  width: 34px;
  height: 34px;
  line-height: 32px;
  text-align: center;
  color: #fff;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 50%;
}

.shop-panel__sub {
  font-size: 12px;
  color: #7a8a9e;
  margin-top: 4px;
}

.shop-panel__wallet {
  display: flex;
  gap: 16px;
  margin-top: 10px;
}

.shop-panel__gold {
  font-size: 16px;
  font-weight: 700;
  color: #ffd700;
}

.shop-panel__dia {
  font-size: 16px;
  font-weight: 700;
  color: #7ee8ff;
}

.exchange-block {
  margin-bottom: 14px;
  padding: 12px;
  border-radius: 14px;
  background: rgba(126, 184, 255, 0.08);
  border: 1px solid rgba(126, 184, 255, 0.25);
}

.exchange-block__title {
  display: block;
  font-size: 15px;
  font-weight: 700;
  color: #e8edf4;
}

.exchange-block__sub {
  display: block;
  font-size: 11px;
  color: #6b7a8f;
  margin: 4px 0 10px;
}

.exchange-block__grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.exchange-card {
  padding: 10px 8px;
  border-radius: 12px;
  background: rgba(0, 0, 0, 0.35);
  border: 1px solid rgba(126, 184, 255, 0.35);
  text-align: center;
}

.exchange-card--off {
  opacity: 0.4;
}

.exchange-card__cost {
  display: block;
  font-size: 13px;
  color: #7ee8ff;
  font-weight: 700;
}

.exchange-card__arrow {
  font-size: 10px;
  color: #5a6a7f;
}

.exchange-card__gain {
  display: block;
  font-size: 13px;
  color: #ffd700;
  font-weight: 700;
}

.exchange-card__label {
  display: block;
  font-size: 10px;
  color: #6b7a8f;
  margin-top: 2px;
}

.shop-panel__section {
  display: block;
  font-size: 13px;
  font-weight: 700;
  color: #8b9cb3;
  margin-bottom: 8px;
}

.shop-panel__scroll {
  flex: 1;
  height: 0;
  padding: 8px 12px calc(16px + env(safe-area-inset-bottom));
}

.gear-card {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
  padding: 12px;
  margin-bottom: 10px;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 215, 0, 0.12);
}

.gear-card__icon-wrap {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: rgba(0, 0, 0, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
}

.gear-card__icon {
  font-size: 24px;
}

.gear-card__body {
  flex: 1;
  min-width: 120px;
}

.gear-card__name {
  display: block;
  font-size: 15px;
  font-weight: 700;
  color: #fff;
}

.gear-card__desc {
  font-size: 11px;
  color: #6b7a8f;
}

.gear-card__lv {
  font-size: 11px;
  color: #7eb8ff;
  margin-top: 2px;
}

.gear-card__action {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 4px;
}

.gear-card__price {
  font-size: 12px;
  color: #9ae6b0;
}

.gear-card__btn {
  padding: 8px 14px;
  background: linear-gradient(180deg, #ffe566, #c9a227);
  color: #1a1408;
  font-size: 12px;
  font-weight: 700;
  border-radius: 10px;
}

.gear-card__btn--off {
  opacity: 0.45;
}

.gear-card__max {
  font-size: 12px;
  color: #ffd700;
}
</style>

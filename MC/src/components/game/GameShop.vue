<template>
  <uni-popup ref="popupRef" type="bottom" :safe-area="true">
    <view class="shop">
      <view class="shop__head">
        <text class="shop__title">⚒️ 地下商店</text>
        <text class="shop__gold">💰 {{ formatMoney(money) }}</text>
        <view class="shop__close" @tap="close">×</view>
      </view>

      <scroll-view class="shop__scroll" scroll-y>
        <view
          v-for="item in shopList"
          :key="item.id"
          class="shop__card"
        >
          <view class="shop__card-top">
            <text class="shop__icon">{{ item.icon }}</text>
            <view class="shop__info">
              <text class="shop__name">{{ item.name }}</text>
              <text class="shop__desc">{{ item.desc }}</text>
              <text class="shop__owned">当前：{{ item.currentName }}（{{ item.level }}/{{ item.maxLevel }}）</text>
            </view>
          </view>

          <view v-if="item.nextTier" class="shop__buy-row">
            <view class="shop__next">
              <text class="shop__next-name">{{ item.nextTier.displayName }}</text>
              <text class="shop__next-price">💰 {{ formatMoney(item.nextTier.price) }}</text>
            </view>
            <view
              class="shop__btn"
              :class="{ 'shop__btn--disabled': money < item.nextTier.price }"
              @tap="onBuy(item.id)"
            >
              购买
            </view>
          </view>
          <text v-else class="shop__max">已满级 ∞</text>
        </view>
      </scroll-view>
    </view>
  </uni-popup>
</template>

<script setup>
import { ref, computed } from 'vue'
import { buildShopList } from '@/services/game/upgrades.js'

const props = defineProps({
  money: { type: Number, default: 0 },
  owned: { type: Object, default: () => ({}) },
})

const emit = defineEmits(['buy'])

const popupRef = ref(null)

const shopList = computed(() => buildShopList(props.owned))

const formatMoney = (n) => {
  if (n >= 100000000) return (n / 100000000).toFixed(1) + '亿'
  if (n >= 10000) return (n / 10000).toFixed(1) + '万'
  if (n >= 1000) return (n / 1000).toFixed(1) + 'k'
  return String(n)
}

const open = () => popupRef.value?.open()
const close = () => popupRef.value?.close()

const onBuy = (categoryId) => {
  emit('buy', categoryId)
}

defineExpose({ open, close })
</script>

<style scoped lang="scss">
.shop {
  max-height: 78vh;
  background: #121820;
  border-radius: 16px 16px 0 0;
  border-top: 1px solid rgba(255, 215, 0, 0.2);
  display: flex;
  flex-direction: column;
}

.shop__head {
  display: flex;
  align-items: center;
  padding: 14px 16px 10px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

.shop__title {
  flex: 1;
  font-size: 17px;
  font-weight: 700;
  color: #ffd700;
}

.shop__gold {
  font-size: 14px;
  color: #9ae6b0;
  margin-right: 12px;
}

.shop__close {
  width: 32px;
  height: 32px;
  line-height: 30px;
  text-align: center;
  font-size: 22px;
  color: #8b9cb3;
  background: rgba(255, 255, 255, 0.06);
  border-radius: 8px;
}

.shop__scroll {
  flex: 1;
  max-height: 65vh;
  padding: 10px 12px calc(16px + env(safe-area-inset-bottom));
}

.shop__card {
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  padding: 12px;
  margin-bottom: 10px;
}

.shop__card-top {
  display: flex;
  gap: 10px;
  margin-bottom: 10px;
}

.shop__icon {
  font-size: 28px;
  width: 40px;
  text-align: center;
}

.shop__info {
  flex: 1;
  min-width: 0;
}

.shop__name {
  display: block;
  font-size: 15px;
  font-weight: 600;
  color: #e8edf4;
}

.shop__desc {
  display: block;
  font-size: 11px;
  color: #6b7a8f;
  margin-top: 2px;
}

.shop__owned {
  display: block;
  font-size: 11px;
  color: #7eb8ff;
  margin-top: 4px;
}

.shop__buy-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.shop__next {
  flex: 1;
  min-width: 0;
}

.shop__next-name {
  display: block;
  font-size: 13px;
  color: #ffd700;
  font-weight: 600;
}

.shop__next-price {
  font-size: 12px;
  color: #9ae6b0;
}

.shop__btn {
  padding: 8px 18px;
  background: linear-gradient(180deg, #ffe566, #c9a227);
  color: #1a1408;
  font-size: 14px;
  font-weight: 700;
  border-radius: 10px;
}

.shop__btn--disabled {
  opacity: 0.4;
}

.shop__max {
  font-size: 12px;
  color: #ffd700;
  text-align: center;
}
</style>

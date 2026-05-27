<template>
  <view class="hud">
    <view class="hud__top">
      <view class="hud__depth">
        <text class="hud__depth-num">Y {{ depth }}</text>
        <text class="hud__depth-zone">{{ layerTitle }}</text>
      </view>
      <view class="hud__money">
        <text class="hud__money-icon">💰</text>
        <text class="hud__money-val">{{ formatMoney(money) }}</text>
        <text class="hud__dia">💎{{ diamonds }}</text>
        <text class="hud__combo" v-if="combo > 1">×{{ combo }}</text>
      </view>
      <view class="hud__actions">
        <view class="hud__btn hud__btn--gacha" @tap="$emit('gacha')">抽</view>
        <view class="hud__btn hud__btn--shop" @tap="$emit('shop')">店</view>
        <view class="hud__btn" @tap="$emit('save')">存</view>
        <view class="hud__btn hud__btn--ghost" @tap="$emit('settings')">设</view>
      </view>
    </view>

    <view class="hud__bar">
      <view class="hud__bar-fill" :style="{ width: layerProgress + '%' }" />
    </view>
    <text class="hud__hint" v-if="nextHint">{{ nextHint }}</text>

    <view class="hud__ore" v-if="currentOre && currentOre.price > 0">
      <view class="hud__ore-gem" :style="{ background: currentOre.color, boxShadow: `0 0 8px ${currentOre.glow || currentOre.color}` }" />
      <text class="hud__ore-name">{{ currentOre.name }}</text>
      <text class="hud__ore-price">+{{ currentOre.price }}</text>
    </view>

    <view class="hud__stats">
      <text>最深 {{ maxDepth }}</text>
      <text>采集 {{ totalCollected }}</text>
    </view>
  </view>
</template>

<script setup>
defineProps({
  depth: { type: Number, default: 0 },
  layerTitle: { type: String, default: '' },
  layerProgress: { type: Number, default: 0 },
  nextHint: { type: String, default: '' },
  money: { type: Number, default: 0 },
  diamonds: { type: Number, default: 0 },
  combo: { type: Number, default: 0 },
  maxDepth: { type: Number, default: 0 },
  totalCollected: { type: Number, default: 0 },
  currentOre: { type: Object, default: null },
})

defineEmits(['save', 'settings', 'shop', 'gacha'])

const formatMoney = (n) => {
  if (n >= 10000) return (n / 10000).toFixed(1) + '万'
  if (n >= 1000) return (n / 1000).toFixed(1) + 'k'
  return String(n)
}
</script>

<style scoped lang="scss">
.hud {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  z-index: 20;
  padding: calc(10px + env(safe-area-inset-top)) 12px 8px;
  pointer-events: none;
  background: linear-gradient(180deg, rgba(0, 0, 0, 0.55) 0%, transparent 100%);
}

.hud__top,
.hud__ore,
.hud__stats,
.hud__btn,
.hud__bar {
  pointer-events: auto;
}

.hud__top {
  display: flex;
  align-items: center;
  gap: 8px;
}

.hud__depth {
  flex: 1;
  min-width: 0;
}

.hud__depth-num {
  display: block;
  font-size: 18px;
  font-weight: 700;
  color: #ffd700;
  line-height: 1.2;
}

.hud__depth-zone {
  font-size: 11px;
  color: #8b9cb3;
}

.hud__money {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 12px;
  background: rgba(0, 0, 0, 0.45);
  border-radius: 20px;
  border: 1px solid rgba(255, 215, 0, 0.25);
}

.hud__money-val {
  font-size: 15px;
  font-weight: 700;
  color: #ffd700;
}

.hud__dia {
  font-size: 12px;
  color: #7ee8ff;
  font-weight: 600;
}

.hud__combo {
  font-size: 12px;
  color: #7ee8ff;
  font-weight: 700;
}

.hud__actions {
  display: flex;
  gap: 6px;
}

.hud__btn {
  width: 36px;
  height: 36px;
  line-height: 36px;
  text-align: center;
  font-size: 14px;
  font-weight: 600;
  color: #1a1408;
  background: linear-gradient(180deg, #ffe566, #c9a227);
  border-radius: 10px;
}

.hud__btn--gacha {
  background: linear-gradient(180deg, #ff8e53, #e85d5d);
  color: #fff;
  box-shadow: 0 0 10px rgba(255, 120, 80, 0.45);
}

.hud__btn--shop {
  background: linear-gradient(180deg, #7eb8ff, #3d6cb9);
  color: #fff;
}

.hud__btn--ghost {
  color: #c8d0dc;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.12);
}

.hud__bar {
  height: 4px;
  margin-top: 8px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 2px;
  overflow: hidden;
}

.hud__bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #3d8bfd, #7ee8ff);
  border-radius: 2px;
  transition: width 0.3s ease;
}

.hud__hint {
  display: block;
  margin-top: 4px;
  font-size: 10px;
  color: #6b7a8f;
}

.hud__ore {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-top: 8px;
  padding: 4px 10px;
  background: rgba(0, 0, 0, 0.35);
  border-radius: 8px;
}

.hud__ore-gem {
  width: 14px;
  height: 14px;
  border-radius: 3px;
  transform: rotate(45deg);
}

.hud__ore-name {
  font-size: 12px;
  color: #e8edf4;
}

.hud__ore-price {
  font-size: 12px;
  color: #9ae6b0;
  font-weight: 600;
}

.hud__stats {
  display: flex;
  gap: 12px;
  margin-top: 6px;
  font-size: 10px;
  color: #5a6a7f;
}
</style>

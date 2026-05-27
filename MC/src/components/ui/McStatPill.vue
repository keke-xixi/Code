<template>
  <view class="mc-stat-pill" :class="{ 'mc-stat-pill--highlight': highlight }">
    <view class="mc-stat-pill__swatch" v-if="swatchColor" :style="{ backgroundColor: swatchColor }" />
    <text class="mc-stat-pill__icon" v-else-if="icon">{{ icon }}</text>
    <view class="mc-stat-pill__text">
      <text class="mc-stat-pill__label" v-if="label">{{ label }}</text>
      <text class="mc-stat-pill__value">{{ value }}</text>
    </view>
  </view>
</template>

<script setup>
defineProps({
  label: { type: String, default: '' },
  value: { type: [String, Number], default: '' },
  icon: { type: String, default: '' },
  swatchColor: { type: String, default: '' },
  highlight: { type: Boolean, default: false },
})
</script>

<style scoped lang="scss">
.mc-stat-pill {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 14px;
  border-radius: 999px;
  background: rgba(0, 0, 0, 0.45);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.12);
  max-width: 42vw;
}

.mc-stat-pill--highlight {
  border-color: rgba(255, 215, 0, 0.35);
  box-shadow: 0 0 12px rgba(255, 215, 0, 0.15);
}

.mc-stat-pill__swatch {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  border: 2px solid rgba(255, 255, 255, 0.5);
  flex-shrink: 0;
}

.mc-stat-pill__icon {
  font-size: 16px;
}

.mc-stat-pill__text {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.mc-stat-pill__label {
  font-size: 11px;
  color: var(--mc-text-muted, #8b9cb3);
}

.mc-stat-pill__value {
  font-size: 14px;
  font-weight: 600;
  color: var(--mc-gold, #ffd700);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>

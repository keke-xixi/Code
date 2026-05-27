<template>
  <view class="mc-info-card" :class="`mc-info-card--${accent}`">
    <view class="mc-info-card__icon" v-if="icon">{{ icon }}</view>
    <view class="mc-info-card__content">
      <text class="mc-info-card__label">{{ label }}</text>
      <text class="mc-info-card__value">{{ value }}</text>
    </view>
  </view>
</template>

<script setup>
defineProps({
  label: { type: String, required: true },
  value: { type: String, default: '' },
  icon: { type: String, default: '' },
  accent: { type: String, default: 'gold' }, // gold | blue | green
})
</script>

<style scoped lang="scss">
.mc-info-card {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 14px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.mc-info-card--gold {
  border-color: rgba(255, 215, 0, 0.2);
}

.mc-info-card--blue {
  border-color: rgba(61, 139, 253, 0.25);
}

.mc-info-card--green {
  border-color: rgba(74, 222, 128, 0.25);
}

.mc-info-card__icon {
  font-size: 22px;
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: rgba(0, 0, 0, 0.25);
  display: flex;
  align-items: center;
  justify-content: center;
}

.mc-info-card__content {
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex: 1;
  min-width: 0;
}

.mc-info-card__label {
  font-size: 12px;
  color: var(--mc-text-muted, #8b9cb3);
}

.mc-info-card__value {
  font-size: 15px;
  font-weight: 600;
  color: var(--mc-text, #e8edf4);
  word-break: break-all;
}
</style>

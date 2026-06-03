<template>
  <view
    class="app-btn"
    :class="[
      `app-btn--${type}`,
      { 'app-btn--block': block, 'app-btn--disabled': disabled, 'app-btn--sm': size === 'sm' },
    ]"
    :style="btnStyle"
    hover-class="app-btn--hover"
    @tap="onTap"
  >
    <text v-if="loading" class="app-btn__text">处理中...</text>
    <text v-else class="app-btn__text"><slot /></text>
  </view>
</template>

<script setup>
import { computed } from 'vue'
import { useTheme } from '@/composables/useTheme.js'

const props = defineProps({
  type: { type: String, default: 'primary' },
  block: { type: Boolean, default: true },
  disabled: { type: Boolean, default: false },
  loading: { type: Boolean, default: false },
  size: { type: String, default: 'md' },
})

const emit = defineEmits(['tap'])
const { theme } = useTheme()

const btnStyle = computed(() => {
  const t = theme.value
  const map = {
    primary: {
      background: t.gradient,
      color: '#ffffff',
      boxShadow: `0 10rpx 28rpx ${t.primary}55`,
      border: 'none',
    },
    ghost: {
      background: '#ffffff',
      color: t.primary,
      border: `2rpx solid ${t.primary}`,
      boxShadow: 'none',
    },
    soft: {
      background: t.primaryLight,
      color: t.primaryDark,
      border: `2rpx solid ${t.primarySoft}`,
      boxShadow: 'none',
    },
    warn: {
      background: '#fff7ed',
      color: '#ea580c',
      border: '2rpx solid #fdba74',
      boxShadow: 'none',
    },
    danger: {
      background: '#fef2f2',
      color: '#dc2626',
      border: '2rpx solid #fca5a5',
      boxShadow: 'none',
    },
  }
  return map[props.type] || map.primary
})

const onTap = () => {
  if (props.disabled || props.loading) return
  emit('tap')
}
</script>

<style lang="scss" scoped>
.app-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 96rpx;
  padding: 0 40rpx;
  border-radius: 16rpx;
  font-size: 32rpx;
  font-weight: 700;
  box-sizing: border-box;

  &--block {
    width: 100%;
    display: flex;
  }

  &--sm {
    height: 88rpx;
    font-size: 30rpx;
  }

  &--disabled {
    opacity: 0.45;
  }

  &--hover {
    opacity: 0.88;
    transform: scale(0.98);
  }

  &__text {
    color: inherit;
    font-weight: 700;
  }
}
</style>

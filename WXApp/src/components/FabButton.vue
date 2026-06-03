<template>
  <view
    class="fab"
    :style="fabStyle"
    hover-class="fab--hover"
    @tap="$emit('tap')"
  >
    <text class="fab__text">{{ label }}</text>
  </view>
</template>

<script setup>
import { computed } from 'vue'
import { useTheme } from '@/composables/useTheme.js'

defineProps({
  label: { type: String, default: '退出' },
})

defineEmits(['tap'])

const { theme } = useTheme()

const fabStyle = computed(() => ({
  background: theme.value.danger,
  boxShadow: `0 8rpx 28rpx ${theme.value.danger}88`,
}))
</script>

<style lang="scss" scoped>
.fab {
  position: fixed;
  right: 32rpx;
  bottom: calc(48rpx + env(safe-area-inset-bottom));
  z-index: 200;
  min-width: 120rpx;
  height: 96rpx;
  padding: 0 36rpx;
  border-radius: 999rpx;
  display: flex;
  align-items: center;
  justify-content: center;

  &--hover {
    opacity: 0.88;
    transform: scale(0.96);
  }

  &__text {
    color: #fff;
    font-size: 30rpx;
    font-weight: 700;
  }
}
</style>

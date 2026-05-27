<template>
  <view class="mc-icon-btn" :class="{ 'mc-icon-btn--active': active }" @tap="$emit('tap')">
    <uni-icons :type="icon" :size="size" :color="color" />
  </view>
</template>

<script setup>
defineProps({
  icon: { type: String, required: true },
  size: { type: Number, default: 22 },
  color: { type: String, default: '#e8edf4' },
  active: { type: Boolean, default: false },
})

defineEmits(['tap'])
</script>

<style scoped lang="scss">
.mc-icon-btn {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.12);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.1s, background 0.15s;

  &:active {
    transform: scale(0.94);
    background: rgba(255, 215, 0, 0.15);
  }
}

.mc-icon-btn--active {
  border-color: rgba(255, 215, 0, 0.4);
}
</style>

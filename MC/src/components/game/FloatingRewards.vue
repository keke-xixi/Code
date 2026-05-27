<template>
  <view class="float-layer">
    <view
      v-for="item in items"
      :key="item.id"
      class="float-item"
      :class="`float-item--${item.type}`"
      :style="item.style"
    >
      {{ item.text }}
    </view>
  </view>
</template>

<script setup>
defineProps({
  items: { type: Array, default: () => [] },
})
</script>

<style scoped lang="scss">
.float-layer {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 25;
  overflow: hidden;
}

.float-item {
  position: absolute;
  font-size: 14px;
  font-weight: 700;
  white-space: nowrap;
  animation: float-up 1.1s ease-out forwards;
  text-shadow: 0 1px 4px rgba(0, 0, 0, 0.8);
}

.float-item--gold {
  color: #ffd700;
}

.float-item--combo {
  color: #7ee8ff;
  font-size: 12px;
}

.float-item--milestone {
  color: #ff9a6b;
  font-size: 13px;
}

@keyframes float-up {
  0% {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
  100% {
    opacity: 0;
    transform: translateY(-48px) scale(1.15);
  }
}
</style>

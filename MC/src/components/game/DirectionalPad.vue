<template>
  <view class="dpad">
    <view class="dpad__row">
      <button class="dpad__btn dpad__btn--up" @touchstart.prevent="$emit('move', 'w')">↑</button>
    </view>
    <view class="dpad__row dpad__row--middle">
      <button class="dpad__btn dpad__btn--left" @touchstart.prevent="$emit('move', 'a')">←</button>
      <button class="dpad__btn dpad__btn--down" @touchstart.prevent="$emit('move', 's')">↓</button>
      <button class="dpad__btn dpad__btn--right" @touchstart.prevent="$emit('move', 'd')">→</button>
    </view>
  </view>
</template>

<script setup>
defineEmits(['move'])
</script>

<style scoped lang="scss">
.dpad {
  position: absolute;
  bottom: calc(28px + env(safe-area-inset-bottom));
  right: 16px;
  z-index: 20;
  padding: 8px;
  border-radius: 20px;
  background: rgba(0, 0, 0, 0.35);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.dpad__row {
  display: flex;
  justify-content: center;
  gap: 8px;
  margin-bottom: 8px;
}

.dpad__row--middle {
  margin-bottom: 0;
}

.dpad__btn {
  width: 52px;
  height: 52px;
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.15);
  color: #fff;
  font-size: 22px;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0;
  padding: 0;
  transition: transform 0.1s;

  &::after {
    border: none;
  }

  &:active {
    transform: scale(0.92);
  }
}

.dpad__btn--up {
  background: linear-gradient(145deg, #e85d5d, #c0392b);
}

.dpad__btn--left {
  background: linear-gradient(145deg, #3498db, #2980b9);
}

.dpad__btn--down {
  background: linear-gradient(145deg, #2ecc71, #27ae60);
}

.dpad__btn--right {
  background: linear-gradient(145deg, #f39c12, #d68910);
}
</style>

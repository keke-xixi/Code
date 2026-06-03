<template>
  <view class="dpad-wrap">
    <view v-if="expanded" class="dpad" @tap.stop>
      <view class="dpad__row">
        <view class="dpad__btn dpad__btn--up" @touchstart.stop.prevent="$emit('move', 'w')">↑</view>
      </view>
      <view class="dpad__row dpad__row--middle">
      <view class="dpad__btn dpad__btn--left" @touchstart.stop.prevent="$emit('move', 'a')">←</view>
      <view class="dpad__btn dpad__btn--down" @touchstart.stop.prevent="$emit('move', 's')">↓</view>
      <view class="dpad__btn dpad__btn--right" @touchstart.stop.prevent="$emit('move', 'd')">→</view>
      </view>
    </view>

    <view
      class="dpad-fab"
      :class="{ 'dpad-fab--open': expanded }"
      @tap="toggle"
    >
      <text class="dpad-fab__icon">{{ expanded ? '✕' : '◎' }}</text>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue'

defineEmits(['move'])

const expanded = ref(false)

const toggle = () => {
  expanded.value = !expanded.value
}
</script>

<style scoped lang="scss">
.dpad-wrap {
  position: absolute;
  right: 14px;
  bottom: calc(20px + env(safe-area-inset-bottom));
  z-index: 20;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 10px;
  pointer-events: none;
}

.dpad,
.dpad-fab {
  pointer-events: auto;
}

.dpad {
  padding: 8px;
  border-radius: 20px;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.35);
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
  line-height: 52px;
  text-align: center;
  transition: transform 0.1s;
}

.dpad__btn:active {
  transform: scale(0.92);
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

.dpad-fab {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.45);
  border: 1px solid rgba(255, 255, 255, 0.15);
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.3);
}

.dpad-fab--open {
  background: rgba(60, 70, 90, 0.75);
  border-color: rgba(126, 184, 255, 0.4);
}

.dpad-fab__icon {
  font-size: 20px;
  color: #c8d0dc;
  line-height: 1;
}

.dpad-fab--open .dpad-fab__icon {
  font-size: 16px;
  color: #7ee8ff;
}
</style>

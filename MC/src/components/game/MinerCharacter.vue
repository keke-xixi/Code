<template>
  <view
    class="miner"
    :class="{ 'miner--mining': mining, 'miner--walk': walking }"
    :style="scaleStyle"
  >
    <view class="miner__shadow" />
    <view class="miner__sprite">
      <!-- 头盔灯 -->
      <view class="miner__lamp" />
      <!-- 头 -->
      <view class="miner__head">
        <view class="miner__eye miner__eye--l" />
        <view class="miner__eye miner__eye--r" />
      </view>
      <!-- 身体 -->
      <view class="miner__body" />
      <!-- 镐子手臂（方向决定挥动侧） -->
      <view class="miner__arm">
        <view class="miner__pick-handle" />
        <view
          class="miner__pick-head"
          :style="{ background: pickGradient, boxShadow: pickShadow }"
        />
      </view>
      <!-- 腿 -->
      <view class="miner__legs">
        <view class="miner__leg miner__leg--l" />
        <view class="miner__leg miner__leg--r" />
      </view>
    </view>
    <view class="miner__dust" v-if="mining" />
  </view>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  mining: { type: Boolean, default: false },
  walking: { type: Boolean, default: false },
  scale: { type: Number, default: 1 },
  pickColor: { type: String, default: '#c0c0c0' },
  pickGlow: { type: String, default: '#e8e8e8' },
})

const scaleStyle = computed(() => ({
  transform: `scale(${1 / props.scale})`,
}))

const pickGradient = computed(
  () =>
    `linear-gradient(135deg, ${props.pickGlow}, ${props.pickColor})`,
)

const pickShadow = computed(
  () => `0 0 6px ${props.pickGlow}, 0 1px 0 #555`,
)
</script>

<style scoped lang="scss">
.miner {
  width: 100%;
  height: 100%;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  transform-origin: center bottom;
}

.miner__shadow {
  position: absolute;
  bottom: 2px;
  width: 28px;
  height: 8px;
  background: rgba(0, 0, 0, 0.35);
  border-radius: 50%;
  filter: blur(2px);
}

.miner__sprite {
  position: relative;
  width: 32px;
  height: 36px;
  z-index: 2;
}

/* 头灯 */
.miner__lamp {
  position: absolute;
  top: -2px;
  left: 50%;
  margin-left: -8px;
  width: 16px;
  height: 6px;
  background: #ffd700;
  border-radius: 3px 3px 0 0;
  box-shadow: 0 0 8px rgba(255, 215, 0, 0.8);
}

.miner__head {
  position: absolute;
  top: 4px;
  left: 50%;
  margin-left: -11px;
  width: 22px;
  height: 14px;
  background: #f4a460;
  border-radius: 4px 4px 2px 2px;
  border: 2px solid #8b6914;
}

.miner__eye {
  position: absolute;
  top: 5px;
  width: 3px;
  height: 3px;
  background: #1a1a1a;
  border-radius: 50%;
}

.miner__eye--l {
  left: 4px;
}

.miner__eye--r {
  right: 4px;
}

.miner__body {
  position: absolute;
  top: 16px;
  left: 50%;
  margin-left: -10px;
  width: 20px;
  height: 12px;
  background: #3d6cb9;
  border-radius: 2px;
  border: 2px solid #1e3a5f;
}

.miner__arm {
  position: absolute;
  top: 14px;
  width: 18px;
  height: 18px;
  transform-origin: 4px 4px;
}

.miner__pick-handle {
  position: absolute;
  width: 3px;
  height: 14px;
  background: #8b4513;
  border-radius: 1px;
  left: 2px;
  top: 2px;
}

.miner__pick-head {
  position: absolute;
  width: 10px;
  height: 6px;
  border-radius: 1px;
  left: -2px;
  top: 12px;
}

.miner__legs {
  position: absolute;
  top: 26px;
  left: 50%;
  margin-left: -10px;
  width: 20px;
  height: 10px;
  display: flex;
  justify-content: space-between;
}

.miner__leg {
  width: 8px;
  height: 10px;
  background: #2d4a6f;
  border-radius: 0 0 2px 2px;
}

/* 始终面朝下方 */
.miner__arm {
  right: -4px;
  transform: rotate(25deg);
}

.miner--mining .miner__arm {
  animation: pick-swing 0.28s ease-in-out 2;
}

.miner--mining .miner__dust {
  display: block;
}

.miner--walk .miner__leg--l {
  animation: leg-step 0.2s ease alternate infinite;
}

.miner--walk .miner__leg--r {
  animation: leg-step 0.2s ease 0.1s alternate infinite;
}

.miner__dust {
  display: none;
  position: absolute;
  bottom: 8px;
  left: 50%;
  margin-left: -12px;
  width: 24px;
  height: 12px;
  background: radial-gradient(ellipse, rgba(180, 140, 80, 0.6) 0%, transparent 70%);
  animation: dust-puff 0.35s ease-out;
}

@keyframes pick-swing {
  0% {
    transform: rotate(10deg);
  }
  50% {
    transform: rotate(55deg);
  }
  100% {
    transform: rotate(10deg);
  }
}

@keyframes leg-step {
  from {
    transform: translateY(0);
  }
  to {
    transform: translateY(-2px);
  }
}

@keyframes dust-puff {
  from {
    opacity: 1;
    transform: scale(0.6);
  }
  to {
    opacity: 0;
    transform: scale(1.4);
  }
}
</style>

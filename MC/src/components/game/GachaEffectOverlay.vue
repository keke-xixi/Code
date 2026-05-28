<template>
  <view v-if="visible" class="gacha-fx" @tap.stop>
    <view class="gacha-fx__dim" />

    <!-- 粒子层 -->
    <view
      v-for="p in particles"
      :key="p.id"
      class="gacha-fx__particle"
      :style="particleStyle(p)"
    />

    <!-- 稀有度光爆 -->
    <view
      v-if="showLight"
      class="gacha-fx__light"
      :style="lightStyle"
    />

    <!-- 卡片翻转 -->
    <view
      v-if="showCard"
      class="gacha-fx__card-wrap"
      :class="{ 'gacha-fx__card-wrap--pop': cardPop }"
    >
      <view class="gacha-fx__card" :style="cardBorderStyle">
        <view class="gacha-fx__card-glow" :style="{ background: theme.glow }" />
        <view class="gacha-fx__card-inner">
          <text class="gacha-fx__icon">{{ item?.icon || '✨' }}</text>
          <view class="gacha-fx__stars">
            <text v-for="n in theme.stars" :key="n" class="gacha-fx__star">★</text>
          </view>
          <text class="gacha-fx__rarity" :style="{ color: theme.color }">{{ theme.label }}</text>
          <text class="gacha-fx__name">{{ item?.name }}</text>
          <text class="gacha-fx__desc">{{ item?.desc }}</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { getAnimTheme, createParticleBatch } from '@/utils/drawCard.js'
import { getSystemMetrics } from '@/utils/system.js'

const props = defineProps({
  rarity: { type: String, default: 'white' },
  item: { type: Object, default: null },
})

const emit = defineEmits(['complete'])

const visible = ref(false)
const particles = ref([])
const showLight = ref(false)
const showCard = ref(false)
const cardPop = ref(false)

const theme = computed(() => getAnimTheme(props.rarity))

const lightStyle = computed(() => ({
  width: theme.value.cardSize * 1.4 + 'px',
  height: theme.value.cardSize * 1.4 + 'px',
  background: `radial-gradient(circle, ${theme.value.lightColor} 0%, transparent 70%)`,
}))

const cardBorderStyle = computed(() => ({
  width: theme.value.cardSize + 'px',
  height: theme.value.cardSize + 'px',
  borderColor: theme.value.border,
  boxShadow: `0 0 28px ${theme.value.glow}, 0 0 60px ${theme.value.glow}, inset 0 0 20px ${theme.value.glow}`,
}))

const particleStyle = (p) => ({
  left: p.x + 'px',
  top: p.y + 'px',
  width: p.size + 'px',
  height: p.size + 'px',
  background: p.color,
  '--dx': p.dx + 'px',
  '--dy': p.dy + 'px',
  animationDuration: p.duration + 'ms',
})

const play = () => {
  const sys = getSystemMetrics()
  const cx = sys.windowWidth / 2
  const cy = sys.windowHeight / 2

  visible.value = true
  particles.value = createParticleBatch(theme.value, cx, cy)
  showLight.value = false
  showCard.value = false
  cardPop.value = false

  setTimeout(() => {
    showLight.value = true
  }, 120)

  setTimeout(() => {
    showCard.value = true
    setTimeout(() => {
      cardPop.value = true
    }, 50)
  }, 380)

  const total = theme.value.stars >= 5 ? 2200 : 1800
  setTimeout(() => {
    visible.value = false
    particles.value = []
    showLight.value = false
    showCard.value = false
    cardPop.value = false
    emit('complete')
  }, total)
}

defineExpose({ play })
</script>

<style scoped lang="scss">
.gacha-fx {
  position: fixed;
  inset: 0;
  z-index: 2000;
  pointer-events: auto;
}

.gacha-fx__dim {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.72);
}

.gacha-fx__particle {
  position: absolute;
  border-radius: 50%;
  margin-left: -4px;
  margin-top: -4px;
  animation: particle-fly ease-out forwards;
  z-index: 2001;
}

@keyframes particle-fly {
  0% {
    transform: translate(0, 0) scale(1);
    opacity: 1;
  }
  100% {
    transform: translate(var(--dx), var(--dy)) scale(0.2);
    opacity: 0;
  }
}

.gacha-fx__light {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%) scale(0.4);
  border-radius: 50%;
  z-index: 2002;
  animation: light-burst 900ms ease-out forwards;
}

@keyframes light-burst {
  0% {
    transform: translate(-50%, -50%) scale(0.3);
    opacity: 0;
  }
  40% {
    opacity: 1;
  }
  100% {
    transform: translate(-50%, -50%) scale(1.6);
    opacity: 0;
  }
}

.gacha-fx__card-wrap {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%) scale(0.5);
  z-index: 2003;
  opacity: 0;
  filter: blur(8px);
  transition: all 0.45s cubic-bezier(0.34, 1.4, 0.64, 1);
}

.gacha-fx__card-wrap--pop {
  transform: translate(-50%, -50%) scale(1);
  opacity: 1;
  filter: blur(0);
}

.gacha-fx__card {
  position: relative;
  border-radius: 18px;
  border: 4px solid;
  overflow: hidden;
  background: rgba(10, 14, 22, 0.92);
}

.gacha-fx__card-glow {
  position: absolute;
  inset: -30%;
  opacity: 0.25;
  filter: blur(20px);
}

.gacha-fx__card-inner {
  position: relative;
  z-index: 1;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 16px;
  box-sizing: border-box;
}

.gacha-fx__icon {
  font-size: 56px;
  line-height: 1;
  filter: drop-shadow(0 4px 12px rgba(0, 0, 0, 0.5));
}

.gacha-fx__stars {
  display: flex;
  gap: 4px;
  margin-top: 8px;
}

.gacha-fx__star {
  font-size: 22px;
  color: #ffe566;
  text-shadow: 0 0 8px rgba(255, 215, 0, 0.8);
  animation: star-twinkle 1.2s ease-in-out infinite;
}

.gacha-fx__star:nth-child(2) {
  animation-delay: 0.15s;
}
.gacha-fx__star:nth-child(3) {
  animation-delay: 0.3s;
}
.gacha-fx__star:nth-child(4) {
  animation-delay: 0.45s;
}
.gacha-fx__star:nth-child(5) {
  animation-delay: 0.6s;
}

@keyframes star-twinkle {
  0%,
  100% {
    transform: scale(1);
    opacity: 0.85;
  }
  50% {
    transform: scale(1.2);
    opacity: 1;
  }
}

.gacha-fx__rarity {
  margin-top: 8px;
  font-size: 14px;
  font-weight: 800;
  letter-spacing: 2px;
}

.gacha-fx__name {
  margin-top: 6px;
  font-size: 17px;
  font-weight: 700;
  color: #fff;
  text-align: center;
}

.gacha-fx__desc {
  margin-top: 4px;
  font-size: 12px;
  color: #9aa8bc;
  text-align: center;
}
</style>

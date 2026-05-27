<template>
  <view class="splash" :style="splashStyle" @tap="goHome">
    <view class="splash__inner">
      <image class="splash__avatar" src="/public/img/role.png" mode="aspectFit" />
      <text class="splash__hint">点击开始挖矿</text>
    </view>
  </view>
</template>

<script setup>
import { computed } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { useStore } from 'vuex'

const store = useStore()
const systemInfo = uni.getSystemInfoSync()

const splashStyle = computed(() => ({
  height: systemInfo.windowHeight + 'px',
  width: systemInfo.windowWidth + 'px',
}))

const goHome = () => {
  uni.redirectTo({ url: '/pages/home/index' })
}

onShow(() => {
  store.dispatch('calculateHeights')
})
</script>

<style scoped lang="scss">
.splash {
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(
    160deg,
    var(--mc-bg-start, #0f1419) 0%,
    #1e3a5f 45%,
    var(--mc-bg-end, #1a2332) 100%
  );
}

.splash__inner {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24px;
}

.splash__avatar {
  width: 200rpx;
  height: 200rpx;
  filter: drop-shadow(0 8px 24px rgba(255, 215, 0, 0.25));
  animation: float 3s ease-in-out infinite;
}

.splash__hint {
  font-size: 14px;
  color: var(--mc-text-muted, #8b9cb3);
  letter-spacing: 2px;
}

@keyframes float {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-12rpx);
  }
}
</style>

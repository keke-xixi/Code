<template>
  <view class="container" :style="customStyle">
    <view class="content">
      <view class="image-container" @tap="goHome">
        <image src="/public/img/role.png" class="img"></image>
        <view class="shadow-effect shadow-1"></view>
        <view class="shadow-effect shadow-2"></view>
        <view class="shadow-effect shadow-3"></view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { computed } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { useStore } from 'vuex'

const store = useStore()
const systemInfo = uni.getSystemInfoSync();

const customStyle = computed(() => {
  return {
    height: systemInfo.windowHeight + 'px',
    width: systemInfo.windowWidth + 'px',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
  }
})

const screenHeight = computed(() => {
  return store.state.screenHeight + 'rpx'
})

const goHome = () => {
	uni.redirectTo({
		url: '/pages/home/index'
	})
}

onShow(() => {
  // 可以在这里添加页面显示时的逻辑
})
</script>

<style scoped lang="scss">
.container {
  overflow: hidden;
  position: relative;
}

.content {
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
}

.image-container {
  position: relative;
  width: 300rpx;
  height: 300rpx;
  display: flex;
  justify-content: center;
  align-items: center;
}

.img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  position: relative;
  z-index: 10;
  filter: drop-shadow(0 0 10rpx rgba(255, 255, 255, 0.5));
  animation: float 3s ease-in-out infinite;
}

.shadow-effect {
  position: absolute;
  border-radius: 50%;
  filter: blur(20rpx);
  animation-duration: 3s;
  animation-timing-function: ease-in-out;
  animation-iteration-count: infinite;
}

.shadow-1 {
  width: 90%;
  height: 90%;
  background: rgba(255, 0, 100, 0.3);
  animation-name: pulse-1;
  z-index: 1;
}

.shadow-2 {
  width: 80%;
  height: 80%;
  background: rgba(0, 200, 255, 0.3);
  animation-name: pulse-2;
  z-index: 2;
}

.shadow-3 {
  width: 70%;
  height: 70%;
  background: rgba(150, 0, 255, 0.3);
  animation-name: pulse-3;
  z-index: 3;
}

@keyframes float {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-20rpx);
  }
}

@keyframes pulse-1 {
  0%, 100% {
    transform: scale(1) rotate(0deg);
    opacity: 0.7;
  }
  50% {
    transform: scale(1.1) rotate(5deg);
    opacity: 0.4;
  }
}

@keyframes pulse-2 {
  0%, 100% {
    transform: scale(1) rotate(10deg);
    opacity: 0.5;
  }
  50% {
    transform: scale(1.15) rotate(-5deg);
    opacity: 0.3;
  }
}

@keyframes pulse-3 {
  0%, 100% {
    transform: scale(1) rotate(-10deg);
    opacity: 0.6;
  }
  50% {
    transform: scale(1.2) rotate(10deg);
    opacity: 0.4;
  }
}
</style>
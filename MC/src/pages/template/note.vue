<template>
  <view class="container" :style="{ height: safeArea,width: allWidth }">
    笔记
  </view>
</template>

<script setup>
import { computed,ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { useStore } from 'vuex'
import emitter from '@/utils/eventBus'

// 获取屏幕信息
const systemInfo = uni.getSystemInfoSync();


const store = useStore()

const allWidth = ref('750rpx')

// 安全区域高度
const safeArea = computed(() => {
  return store.state.navigationBarHeight + 'px'
})

// 屏幕高度 rpx 单位
const screenHeightRpx = ((systemInfo.screenHeight - store.state.navigationBarHeight) / systemInfo.screenWidth) * 750;
const screenHeightRpx2 = (systemInfo.screenHeight - / systemInfo.screenWidth) * 750;


onShow(() => {
   console.log('屏幕宽度:', systemInfo.screenWidth);  // 物理像素
   console.log('屏幕高度:', systemInfo.screenHeight); // 物理像素
   console.log('窗口宽度:', systemInfo.windowWidth);  // 可用宽度
   console.log('窗口高度:', systemInfo.windowHeight); // 可用高度
})

</script>

<style scoped lang="scss">
$heightRate: 35%;
$fontSize: 14px;
.container {
	 background-color: antiquewhite;
}

</style>
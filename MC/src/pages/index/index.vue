<!-- 已废弃：启动页改为直接进入 pages/home/index，保留文件避免旧链接 404 -->
<template>
  <view class="splash-redirect" />
</template>

<script setup>
import { onLoad } from '@dcloudio/uni-app'

onLoad(() => {
  uni.reLaunch({ url: '/pages/home/index' })
})
</script>

<style scoped>
.splash-redirect {
  min-height: 100vh;
  background: #0f1419;
}
</style>

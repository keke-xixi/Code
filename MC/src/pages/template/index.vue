<template>
  <view class="container" :style="{ height: safeArea }">
    
  </view>
</template>

<script setup>
import { computed,ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { useStore } from 'vuex'
import emitter from '@/utils/eventBus'

const store = useStore()

// 安全区域高度
const safeArea = computed(() => {
  return store.state.navigationBarHeight + 'px'
})


onShow(() => {
 
})

</script>

<style scoped lang="scss">
$heightRate: 35%;
$fontSize: 14px;

</style>
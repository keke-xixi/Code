<template>
  <view class="container" :style="{ height: heightRpx + 'rpx' }">
     <view class="top" :style="{ height: unitHeight + 'rpx' }">
     	
     </view>
	 <view class="center" :style="{ height: (heightRpx - unitHeight) + 'rpx' }">
	 	
	 </view>
  </view>
</template>

<script setup>
import { computed,ref,state,reactive } from 'vue'
import { onShow,onLoad } from '@dcloudio/uni-app'
import { useStore } from 'vuex'
import emitter from '@/utils/eventBus'

const store = useStore()
const systemInfo = uni.getSystemInfoSync(); // 获取屏幕信息

// 屏幕高度 rpx 单位
const widthRpx = 750;
const heightRpx = ((systemInfo.screenHeight / systemInfo.screenWidth) * 750).toFixed(2);

// 单位
const unit = ref(10);
const unitWidth = computed(()=>{
	return widthRpx / unit.value;
})
const unitHeight = computed(()=>{
	return heightRpx / unit.value;
})

// 参数
const state = reactive({
	
})

onShow(() => {
  
})

onLoad(() =>{
	
})

</script>

<style scoped lang="scss">
$heightRate: 35%;
$fontSize: 14px;
.container {
	.top {
		
	}
	.center {
		background-color: antiquewhite;
	}
}

</style>
<template>
  <view class="container" :style="{ height: heightRpx + 'rpx' }">
	  <view :style="{ 
		  width: unitWidth + 'rpx',
		  height: unitHeight + 'rpx',
		  top: state.y * unitHeight + 'rpx',
		  left: state.x * unitWidth + 'rpx',
		}" class="user"
		>
	  		<image src="/public/img/role.png" class="img"></image>
			<!-- <image src="/public/img/left.png" class="img left"></image> -->
			<!-- <image src="/public/img/up.png" class="img up"></image> -->
			<!-- <image src="/public/img/left.png" class="img right"></image> -->
			<!-- <image src="/public/img/up.png" class="img down"></image> -->
	  </view>
     <view class="top" :style="{ height: unitHeight + 'rpx' }">
     	 
     </view>
	 <view class="center" 
			:style="{ 
				 height: (heightRpx - unitHeight) + 'rpx',
				 transform: `translateX(${state.translateX * unitWidth}rpx) translateY(${state.translateY * unitHeight}rpx)`,
			}">
	 	  <view 
		       v-for="item in boxList"
			   @tap.stop="clickBox(item)"
			  :style="{
				  width: unitWidth + 'rpx',
				  height: unitHeight + 'rpx',
				  top: item.y * unitHeight + 'rpx',
				  left: item.x * unitWidth + 'rpx',
				  backgroundColor: item.break ? state.breakBoxColor : state.boxColor,
				}" 
				class="box">
	 	  	<view class="box-inner"></view>	
	 	  </view>
	 </view>
  </view>
</template>

<script setup>
import { computed,ref,reactive } from 'vue'
import { onShow,onLoad,onUnload } from '@dcloudio/uni-app'
import { useStore } from 'vuex'
import emitter from '@/utils/eventBus'
import { createLevelDistribution,getRange } from './method.js'

const store = useStore()
const systemInfo = uni.getSystemInfoSync(); // 获取屏幕信息

// 屏幕宽度、高度 rpx 单位
const widthRpx = 750;
const heightRpx = ((systemInfo.screenHeight / systemInfo.screenWidth) * 750).toFixed(2);

// 屏幕宽度、高度 px 单位
const screenWidth = systemInfo.screenWidth;
const screenHeight = systemInfo.screenHeight;

// 单位
const unitX = ref(5);  // 横坐标份数
const unitY = ref(10);  // 纵坐标份数
const unitWidth = computed(()=>{
	return widthRpx / unitX.value;
})
const unitHeight = computed(()=>{
	return heightRpx / unitY.value;
})

// 参数
const state = reactive({
	x: 0,  
	y: 0,
	boxColor: '#0f3461',  // 方块颜色
	breakBoxColor: '#d1e1fd', // 挖完之后颜色
	translateX: 0,
	translateY: 0,
})

// 角色中心点
const roleCenter = computed(()=>{
	return {
		x: state.x + 0.5,
		y: state.y + 0.5
	}
})

// 方块
const boxList = ref([
	{ x: 0,y: 0,level: 0 },
])

// 点击区域
const clickArea = (e) => {
	const { x,y } = e.detail;
	const xRpx = (x * widthRpx / screenWidth).toFixed(2);
	const yRpx = (y * heightRpx / screenHeight).toFixed(2);
}

// 点击盒子
const clickBox = (item) => {
	let roleX = state.x;
	let roleY = state.y - 1;
	let distanceX = item.x - roleX;
	let distanceY = item.y - roleY;
	if(Math.abs(distanceX) === 1 && distanceY === 0) {
		moveRole(distanceX, distanceY,item)
	}else if(Math.abs(distanceY) === 1 && distanceX === 0) {
		moveRole(distanceX, distanceY,item)
	}else {
		
	}
}

// 移动角色
const moveRole = (x = 0,y = 0,item = {}) => {
	state.x += x;
	state.y += y;
	item.break = true;  // 挖掘成功，方块变色
}

// 生成初始方块
function generatePatternArray(maxX, maxY, maxType) {
  const result = [];
  
  for (let x = 0; x < maxX; x++) {
    for (let y = 0; y < maxY; y++) {
      // level 按照规律生成：可以使用取模运算
      const level = (x + y) % maxType;
      
      result.push({
        x,
        y,
        level,
		break: false
      });
    }
  }
  
  return result;
}

// 生成下区域方块
const generateDownBox = ()=> {
	let arr = []
	for (let y = 0; y < unitY.value - 1; y++) {
		arr.push({
			x: state.x + 1,
			y,
			level: 1,
			break: true
		})
	}
	boxList.value = boxList.value.concat(arr);
	
	let row = boxList.value.find(i => i.y === state.y && i.x === (state.x + 1))
	moveRole(1,0,row);
	state.translateX--;
	
}

// 生成上方区域方块
const generateUpBox = ()=> {
	let arr = []
	for (let y = 0; y < unitY.value - 1; y++) {
		arr.push({
			x: state.x + 1,
			y,
			level: 1,
			break: true
		})
	}
	boxList.value = boxList.value.concat(arr);
	
	let row = boxList.value.find(i => i.y === state.y && i.x === (state.x + 1))
	moveRole(1,0,row);
	state.translateX--;
}

// 生成左方区域方块
const generateLeftBox = ()=> {
	let range = getRange(state.y);
	const { rate,leave } = range;
	let boxs = createLevelDistribution(unitY.value,leave,rate);
	console.log(boxs,'boxs')
	if(state.y < unitY.value) { // 还处于第一屏幕 的 y
	   
		boxs.forEach(item =>{
			
		})
	}
}

// 生成右方区域方块
const generateRightBox = ()=> {
	let arr = []
	for (let y = 0; y < unitY.value - 1; y++) {
		arr.push({
			x: state.x + 1,
			y,
			level: 1,
			break: true
		})
	}
	boxList.value = boxList.value.concat(arr);
	
	let row = boxList.value.find(i => i.y === state.y && i.x === (state.x + 1))
	moveRole(1,0,row);
	state.translateX--;
}


// 上下左右
const handleKeyDown = (e)=>{
	switch(e.key) {
		case "w" :
		  generateUpBox()
		break;
		
		case "s" :
		  generateDownBox()
		break;
		
		case "a" :
		  generateLeftBox()
		break;
		
		case "d" :
		  generateRightBox()
		break;
	}
}

onLoad(() =>{
	let arr = generatePatternArray(5, 9, 5);
	boxList.value = arr;
	
	window.addEventListener('keydown', handleKeyDown);
})

onUnload(()=>{
	window.removeEventListener('keydown', handleKeyDown);
})


onShow(() => {
	
  
})



</script>

<style scoped lang="scss">
$heightRate: 35%;
$fontSize: 14px;
.container {
	position: relative;
	.top {
		
	}
	.center {
		position: relative;
		.box {
			position: absolute;
			.box-inner {
			}
			z-index: 5;
		}
	}
	.user {
		position: absolute;
		z-index: 999;
		.right {
			transform: rotate(180deg);
		}
		.down {
			transform: rotate(180deg);
		}
	}
}

</style>
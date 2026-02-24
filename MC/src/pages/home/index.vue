<template>
  <view class="container" ref="containerRef" @touchstart="handleTouchStart" @touchmove="handleTouchMove" :style="{ height: screenHeight + 'px' }">
    <!-- 控制面板 -->
    <view class="controls">
      <button @click="zoomOut" size="mini">-</button>
      <text class="scale-text">缩放: {{ (scale * 100).toFixed(0) }}%</text>
      <button @click="zoomIn" size="mini">+</button>
      <button @click="resetView" size="mini">重置视图</button>
    </view>
    
    <!-- 可移动的世界容器 -->
    <view class="world" 
          :style="{
            width: worldWidth + 'px',
            height: worldHeight + 'px',
            transform: `scale(${scale}) translate(${offsetX}px, ${offsetY}px)`,
            transition: isAnimating ? 'transform 0.3s ease' : 'none'
          }">
      
      <!-- 网格背景 -->
      <view class="grid" :style="gridStyle"></view>
      
      <!-- 移动的盒子 -->
      <view class="user-box" 
            :style="{
              width: cellSize + 'px',
              height: cellSize + 'px',
              left: (state.x - worldBounds.left) * cellSize + 'px',
              top: (state.y - worldBounds.top) * cellSize + 'px',
              transition: isMoving ? 'left 0.2s ease, top 0.2s ease' : 'none'
            }">
        <view class="box-content">
          {{ state.x }}, {{ state.y }}
        </view>
      </view>
    </view>
    
    <!-- 虚拟方向控制 -->
    <view class="virtual-controls">
      <view class="control-row">
        <button @touchstart="move('w')" class="control-btn">↑</button>
      </view>
      <view class="control-row">
        <button @touchstart="move('a')" class="control-btn">←</button>
        <button @touchstart="move('s')" class="control-btn">↓</button>
        <button @touchstart="move('d')" class="control-btn">→</button>
      </view>
    </view>
    
    <!-- 信息显示 -->
    <view class="info-panel">
      <text>位置: ({{ state.x }}, {{ state.y }})</text>
      <text>世界大小: {{ (worldWidth / cellSize).toFixed(0) }} × {{ (worldHeight / cellSize).toFixed(0) }}</text>
    </view>
  </view>
</template>

<script setup>
import { ref, reactive, computed, onMounted, nextTick } from 'vue'

// 屏幕尺寸
const screenHeight = ref(0)

// 基础参数
const cellSize = 50
const extendAmount = 5

// 世界边界
const worldBounds = reactive({
  left: 0,
  right: 20,
  top: 0,
  bottom: 20
})

// 视图状态
const scale = ref(1)
const offsetX = ref(0)
const offsetY = ref(0)
const isAnimating = ref(false)
const isMoving = ref(false)

// 盒子状态
const state = reactive({
  x: 10,
  y: 10
})

// 触摸状态
const startX = ref(0)
const startY = ref(0)

// 容器引用
const containerRef = ref(null)

// 计算世界尺寸
const worldWidth = computed(() => {
  return (worldBounds.right - worldBounds.left) * cellSize
})

const worldHeight = computed(() => {
  return (worldBounds.bottom - worldBounds.top) * cellSize
})

// 网格样式
const gridStyle = computed(() => {
  return {
    width: worldWidth.value + 'px',
    height: worldHeight.value + 'px',
    backgroundSize: `${cellSize}px ${cellSize}px`
  }
})

onMounted(() => {
  getSystemInfo()
  adjustViewAfterExtension()
})

// 获取系统信息
const getSystemInfo = () => {
  const systemInfo = uni.getSystemInfoSync()
  screenHeight.value = systemInfo.windowHeight
}

// 移动控制
const move = (direction) => {
  let newX = state.x
  let newY = state.y
  
  switch(direction) {
    case 'w':
      newY = state.y - 1
      break
    case 'a':
      newX = state.x - 1
      break
    case 's':
      newY = state.y + 1
      break
    case 'd':
      newX = state.x + 1
      break
  }
  
  moveTo(newX, newY)
}

// 移动到指定位置
const moveTo = (x, y) => {
  const extended = extendWorldIfNeeded(x, y)
  
  isMoving.value = true
  state.x = x
  state.y = y
  
  if (extended) {
    adjustViewAfterExtension()
  } else {
    ensureBoxInView()
  }
  
  setTimeout(() => {
    isMoving.value = false
  }, 200)
}

// 检查并扩展世界边界
const extendWorldIfNeeded = (x, y) => {
  let extended = false
  
  if (x < worldBounds.left) {
    worldBounds.left -= extendAmount
    extended = true
  }
  
  if (x >= worldBounds.right) {
    worldBounds.right += extendAmount
    extended = true
  }
  
  if (y < worldBounds.top) {
    worldBounds.top -= extendAmount
    extended = true
  }
  
  if (y >= worldBounds.bottom) {
    worldBounds.bottom += extendAmount
    extended = true
  }
  
  return extended
}

// 扩展后调整视图
const adjustViewAfterExtension = () => {
  const systemInfo = uni.getSystemInfoSync()
  const containerWidth = systemInfo.windowWidth
  const containerHeight = systemInfo.windowHeight
  
  const targetOffsetX = -((state.x - worldBounds.left) * cellSize - containerWidth / (2 * scale.value))
  const targetOffsetY = -((state.y - worldBounds.top) * cellSize - containerHeight / (2 * scale.value))
  
  isAnimating.value = true
  offsetX.value = targetOffsetX
  offsetY.value = targetOffsetY
  
  setTimeout(() => {
    isAnimating.value = false
  }, 300)
}

// 确保盒子在视图中
const ensureBoxInView = () => {
  const systemInfo = uni.getSystemInfoSync()
  const containerWidth = systemInfo.windowWidth
  const containerHeight = systemInfo.windowHeight
  
  const boxScreenX = (state.x - worldBounds.left) * cellSize * scale.value + offsetX.value * scale.value
  const boxScreenY = (state.y - worldBounds.top) * cellSize * scale.value + offsetY.value * scale.value
  const boxSize = cellSize * scale.value
  const threshold = 100
  
  let newOffsetX = offsetX.value
  let newOffsetY = offsetY.value
  
  if (boxScreenX < threshold) {
    newOffsetX += (threshold - boxScreenX) / scale.value
  } else if (boxScreenX + boxSize > containerWidth - threshold) {
    newOffsetX -= (boxScreenX + boxSize - (containerWidth - threshold)) / scale.value
  }
  
  if (boxScreenY < threshold) {
    newOffsetY += (threshold - boxScreenY) / scale.value
  } else if (boxScreenY + boxSize > containerHeight - threshold) {
    newOffsetY -= (boxScreenY + boxSize - (containerHeight - threshold)) / scale.value
  }
  
  if (newOffsetX !== offsetX.value || newOffsetY !== offsetY.value) {
    isAnimating.value = true
    offsetX.value = newOffsetX
    offsetY.value = newOffsetY
    
    setTimeout(() => {
      isAnimating.value = false
    }, 300)
  }
}

// 缩放功能
const zoomIn = () => {
  isAnimating.value = true
  scale.value = Math.min(3, scale.value + 0.1)
  setTimeout(() => {
    isAnimating.value = false
    ensureBoxInView()
  }, 300)
}

const zoomOut = () => {
  isAnimating.value = true
  scale.value = Math.max(0.3, scale.value - 0.1)
  setTimeout(() => {
    isAnimating.value = false
    ensureBoxInView()
  }, 300)
}

// 重置视图
const resetView = () => {
  isAnimating.value = true
  scale.value = 1
  offsetX.value = 0
  offsetY.value = 0
  worldBounds.left = 0
  worldBounds.right = 20
  worldBounds.top = 0
  worldBounds.bottom = 20
  state.x = 10
  state.y = 10
  
  setTimeout(() => {
    isAnimating.value = false
  }, 300)
}

// 触摸事件处理
const handleTouchStart = (e) => {
  startX.value = e.touches[0].clientX
  startY.value = e.touches[0].clientY
}

const handleTouchMove = (e) => {
  if (!startX.value || !startY.value) return
  
  const currentX = e.touches[0].clientX
  const currentY = e.touches[0].clientY
  
  const diffX = currentX - startX.value
  const diffY = currentY - startY.value
  
  // 简单的滑动控制
  if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 10) {
    if (diffX > 0) {
      move('d') // 右滑
    } else {
      move('a') // 左滑
    }
  } else if (Math.abs(diffY) > 10) {
    if (diffY > 0) {
      move('s') // 下滑
    } else {
      move('w') // 上滑
    }
  }
  
  startX.value = currentX
  startY.value = currentY
}
</script>

<style scoped>
.container {
  width: 100%;
  position: relative;
  overflow: hidden;
  background: #f0f2f5;
}

.controls {
  position: absolute;
  top: 10px;
  left: 10px;
  z-index: 10;
  background: rgba(255, 255, 255, 0.9);
  padding: 10px;
  border-radius: 5px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  gap: 10px;
}

.scale-text {
  font-size: 14px;
  color: #333;
}

.world {
  position: absolute;
  top: 0;
  left: 0;
  transform-origin: 0 0;
  background-color: rgba(255, 255, 255, 0.8);
}

.grid {
  position: absolute;
  top: 0;
  left: 0;
  background-image: 
    linear-gradient(to right, rgba(0,0,0,0.1) 1px, transparent 1px),
    linear-gradient(to bottom, rgba(0,0,0,0.1) 1px, transparent 1px);
}

.user-box {
  position: absolute;
  background: linear-gradient(135deg, #6a11cb 0%, #2575fc 100%);
  border-radius: 8px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: bold;
  font-size: 14px;
}

.box-content {
  transform: scale(calc(1 / v-bind(scale)));
}

.virtual-controls {
  position: absolute;
  bottom: 100px;
  right: 20px;
  z-index: 10;
}

.control-row {
  display: flex;
  justify-content: center;
  margin-bottom: 10px;
}

.control-btn {
  width: 60px;
  height: 60px;
  margin: 0 10px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.9);
  border: 2px solid #ddd;
  font-size: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.info-panel {
  position: absolute;
  bottom: 20px;
  left: 10px;
  background: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 10px 15px;
  border-radius: 5px;
  font-size: 12px;
  line-height: 1.5;
  display: flex;
  flex-direction: column;
}
</style>
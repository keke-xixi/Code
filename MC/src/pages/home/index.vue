<template>
  <view class="container" ref="containerRef" @touchstart="handleTouchStart" @touchmove="handleTouchMove" :style="{ height: screenHeight + 'px' }">
    
    <!-- 设置 -->
     <view class="settings" @tap="openConfig">
       <uni-icons type="gear-filled" size="30"></uni-icons>
     </view>
    
    <!-- 可移动的世界容器 -->
    <view class="world" 
          :style="{
            width: worldWidth + 'px',
            height: worldHeight + 'px',
            transform: `scale(${scale}) translate(${offsetX}px, ${offsetY}px)`,
            transition: isAnimating ? 'transform 0.3s ease' : 'none'
          }">
      
      <!-- 网格背景 - 改为可见的盒子网格 -->
      <view class="grid">
        <view v-for="row in gridRows" :key="row" class="grid-row">
          <view v-for="col in gridCols" :key="col" 
          class="grid-cell"
          :class="{
            'current-cell': currentCell.row === row && currentCell.col === col,
            'adjacent-cell': isAdjacentCell(row, col)
          }"
          :style="{
            width: cellSize + 'px',
            height: cellSize + 'px',
            left: (col - 1) * cellSize + 'px',
            top: (row - 1) * cellSize + 'px'
          }">
            <!-- 所有格子的坐标 -->
            <text class="cell-coord">{{ worldBounds.left + col - 1 }},{{ worldBounds.top + row - 1 }}</text>
            <view v-if="currentCell.row === row && currentCell.col === col" class="cell-effect">
              <text class="effect-text">当前</text>
            </view>
          </view>
        </view>
      </view>
      
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
    
    <!-- 系统配置弹窗 -->
     <SystemConfig 
      ref="systemConfigRef"
      :scale="scale"
      :worldWidth="worldWidth"
      :worldHeight="worldHeight"
      :cellSize="cellSize"
      :cellTypes="cellTypes"
      :state="state"
      @resetView="resetView"
      @zoomIn="zoomIn"
      @zoomOut="zoomOut"
      />
  </view>
</template>

<script setup>
import { ref, reactive, computed, onMounted, nextTick } from 'vue';
import SystemConfig from './component/systemConfig.vue'

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

// 其它参数

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
const systemConfigRef = ref(null)

// 计算网格行列
const gridRows = computed(() => {
  return worldBounds.bottom - worldBounds.top
})

const gridCols = computed(() => {
  return worldBounds.right - worldBounds.left
})

// 当前格子位置（网格坐标）
const currentCell = computed(() => {
  return {
    row: state.y - worldBounds.top + 1,
    col: state.x - worldBounds.left + 1
  }
})

// 计算世界尺寸
const worldWidth = computed(() => {
  return (worldBounds.right - worldBounds.left) * cellSize
})

const worldHeight = computed(() => {
  return (worldBounds.bottom - worldBounds.top) * cellSize
})

// 格子类型映射（可以自定义不同位置的格子效果）
const cellTypes = {
  // 特殊位置效果
  '10,10': { type: '起点', effect: '绿色区域，安全区', color: '#4CAF50' },
  '5,5': { type: '森林', effect: '移动速度减半', color: '#2E7D32' },
  '15,15': { type: '沙漠', effect: '消耗体力加倍', color: '#FFB74D' },
  '8,12': { type: '河流', effect: '无法停留', color: '#4FC3F7' },
  '12,8': { type: '山脉', effect: '视野受阻', color: '#8D6E63' }
}

// 判断是否为相邻格子
const isAdjacentCell = (row, col) => {
  const currentRow = currentCell.value.row
  const currentCol = currentCell.value.col
  const dx = Math.abs(col - currentCol)
  const dy = Math.abs(row - currentRow)
  return (dx === 1 && dy === 0) || (dx === 0 && dy === 1)
}

// 获取格子类型
const getCellType = (x, y) => {
  const key = `${x},${y}`
  return cellTypes[key]?.type || '普通格子'
}

// 获取格子效果
const getCellEffect = (x, y) => {
  const key = `${x},${y}`
  return cellTypes[key]?.effect || '无特殊效果'
}

// 获取格子颜色
const getCellColor = (x, y) => {
  const key = `${x},${y}`
  return cellTypes[key]?.color || '#f0f0f0'
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

const openConfig = () => {
    nextTick(() => {
        systemConfigRef.value.openDialog()
    })
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
  
  // 检查目标格子是否可以进入
  if (canMoveTo(newX, newY)) {
    moveTo(newX, newY)
    // 触发格子进入效果
    triggerCellEffect(newX, newY)
  } else {
    uni.showToast({
      title: '无法进入该格子',
      icon: 'none'
    })
  }
}

// 检查是否可以移动到目标格子
const canMoveTo = (x, y) => {
  const key = `${x},${y}`
  // 河流格子无法停留
  if (cellTypes[key]?.type === '河流') {
    return false
  }
  return true
}

// 触发格子效果
const triggerCellEffect = (x, y) => {
  const key = `${x},${y}`
  const effect = cellTypes[key]?.effect
  
  if (effect) {
    uni.showToast({
      title: effect,
      icon: 'none',
      duration: 1500
    })
  }
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

// 获取系统信息
const getSystemInfo = () => {
  const systemInfo = uni.getSystemInfoSync()
  screenHeight.value = systemInfo.windowHeight
}

onMounted(() => {
  getSystemInfo()
  adjustViewAfterExtension()
})

</script>

<style scoped>
.container {
  width: 100%;
  position: relative;
  overflow: hidden;
  background: #1a1a2e;
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
}

.grid {
  position: absolute;
  top: 0;
  left: 0;
}

.grid-cell {
  position: absolute;
  background-color: #f0f0f0;
  border: 1px solid #ccc;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  color: #666;
  transition: all 0.2s ease;
}

.grid-cell.current-cell {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: 2px solid #ffd700;
  color: white;
  transform: scale(1.02);
  z-index: 5;
  box-shadow: 0 0 20px rgba(255, 215, 0, 0.5);
}

.grid-cell.adjacent-cell {
  background-color: #e3f2fd;
  border: 2px dashed #2196f3;
  cursor: pointer;
}

.cell-coord {
  font-size: 10px;
  opacity: 0.7;
}

.cell-effect {
  position: absolute;
  top: 2px;
  right: 2px;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 3px;
  padding: 2px 4px;
}

.effect-text {
  font-size: 8px;
  color: #333;
  font-weight: bold;
}

.user-box {
  position: absolute;
  background: linear-gradient(135deg, #6a11cb 0%, #2575fc 100%);
  border-radius: 8px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: bold;
  font-size: 14px;
  z-index: 10;
  border: 2px solid white;
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

.settings {
  position: absolute;
  top: 20px;
  right: 20px;
  z-index: 10;
  border-radius: 5px;
  padding: 10px;
}
</style>
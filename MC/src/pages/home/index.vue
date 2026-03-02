<template>
  <view class="container" ref="containerRef" 
        @touchstart="handleTouchStart" 
        @touchmove="handleTouchMove" 
        @touchend="handleTouchEnd"
        :style="{ height: screenHeight + 'px' }">
    
    <!-- 设置按钮 -->
    <view class="settings" @tap="openConfig">
      <uni-icons type="gear-filled" size="30" color="#fff"></uni-icons>
    </view>
    
    <!-- 缩放显示 -->
    <view class="scale-indicator">
      <text class="scale-text">{{ Math.round(scale * 100) }}%</text>
    </view>
    
    <!-- 深度显示 -->
    <view class="depth-indicator">
      <text class="depth-text">深度: {{ state.y }}</text>
      <text class="depth-range">{{ currentRange.label }}</text>
    </view>
    
    <!-- 矿石信息 -->
    <view class="ore-info" v-if="currentOre">
      <view class="ore-color" :style="{ backgroundColor: currentOre.color }"></view>
      <view class="ore-details">
        <text class="ore-name">{{ currentOre.name }}</text>
        <text class="ore-price">💰 {{ currentOre.price }}</text>
      </view>
    </view>
    
    <!-- 可移动的世界容器 -->
    <view class="world" 
          :style="{
            width: worldWidth + 'px',
            height: worldHeight + 'px',
            transform: `scale(${scale}) translate(${offsetX}px, ${offsetY}px)`,
            transition: isAnimating ? 'transform 0.3s ease' : 'none'
          }">
      
      <!-- 网格背景 - 矿石显示 -->
      <view class="grid">
        <view v-for="row in visibleRows" :key="row" class="grid-row">
          <view v-for="col in visibleCols" :key="col" 
                class="grid-cell"
                :class="{
                  'current-cell': currentCell.row === row && currentCell.col === col,
                  'adjacent-cell': isAdjacentCell(row, col)
                }"
                :style="{
                  width: cellSize + 'px',
                  height: cellSize + 'px',
                  left: (col - 1) * cellSize + 'px',
                  top: (row - 1) * cellSize + 'px',
                  backgroundColor: getCellColor(worldBounds.left + col - 1, worldBounds.top + row - 1)
                }"
                @tap="tryMoveTo(worldBounds.left + col - 1, worldBounds.top + row - 1)">
            <text class="cell-coord">{{ worldBounds.left + col - 1 }},{{ worldBounds.top + row - 1 }}</text>
            <view class="ore-indicator" :style="{ backgroundColor: getCellColor(worldBounds.left + col - 1, worldBounds.top + row - 1) }">
              <text class="ore-symbol">{{ getOreSymbol(worldBounds.left + col - 1, worldBounds.top + row - 1) }}</text>
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
        <view class="box-content" :style="{ transform: `scale(${1/scale})` }">
          ⛏️
        </view>
      </view>
    </view>
    
    <!-- 虚拟方向控制 -->
    <view class="virtual-controls">
      <view class="control-row">
        <button @touchstart.prevent="move('w')" class="control-btn up">↑</button>
      </view>
      <view class="control-row">
        <button @touchstart.prevent="move('a')" class="control-btn left">←</button>
        <button @touchstart.prevent="move('s')" class="control-btn down">↓</button>
        <button @touchstart.prevent="move('d')" class="control-btn right">→</button>
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
import { ref, reactive, computed, onMounted, nextTick, watch } from 'vue';
import SystemConfig from './component/systemConfig.vue'
import { 
  type_map, 
  getRange, 
  generateOreType, 
  initializeWorldOres, 
  extendWorldOres 
} from './method.js'

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

// 矿石数据存储
const worldOres = ref({})

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
const touchState = reactive({
  startX: 0,
  startY: 0,
  isTouching: false,
  lastMoveTime: 0
})

// 容器引用
const containerRef = ref(null)
const systemConfigRef = ref(null)

// 计算当前深度范围
const currentRange = computed(() => getRange(state.y))

// 计算当前格子的矿石
const currentOre = computed(() => {
  const key = `${state.x},${state.y}`
  return worldOres.value[key] || { name: '未知', color: '#ccc', price: 0 }
})

// 计算可见区域
const visibleRows = computed(() => {
  const start = Math.max(1, Math.floor(-offsetY.value / cellSize) - 2)
  const end = Math.min(gridRows.value, Math.ceil((screenHeight.value / scale.value - offsetY.value) / cellSize) + 2)
  return Array.from({ length: end - start + 1 }, (_, i) => start + i)
})

const visibleCols = computed(() => {
  const start = Math.max(1, Math.floor(-offsetX.value / cellSize) - 2)
  const end = Math.min(gridCols.value, Math.ceil((uni.getSystemInfoSync().windowWidth / scale.value - offsetX.value) / cellSize) + 2)
  return Array.from({ length: end - start + 1 }, (_, i) => start + i)
})

// 计算网格行列
const gridRows = computed(() => worldBounds.bottom - worldBounds.top)
const gridCols = computed(() => worldBounds.right - worldBounds.left)

// 当前格子位置
const currentCell = computed(() => ({
  row: state.y - worldBounds.top + 1,
  col: state.x - worldBounds.left + 1
}))

// 计算世界尺寸
const worldWidth = computed(() => (worldBounds.right - worldBounds.left) * cellSize)
const worldHeight = computed(() => (worldBounds.bottom - worldBounds.top) * cellSize)

// 判断相邻格子
const isAdjacentCell = (row, col) => {
  const currentRow = currentCell.value.row
  const currentCol = currentCell.value.col
  const dx = Math.abs(col - currentCol)
  const dy = Math.abs(row - currentRow)
  return (dx === 1 && dy === 0) || (dx === 0 && dy === 1)
}

// 获取格子颜色
const getCellColor = (x, y) => {
  const key = `${x},${y}`
  return worldOres.value[key]?.color || type_map[1].color
}

// 获取矿石符号
const getOreSymbol = (x, y) => {
  const key = `${x},${y}`
  const ore = worldOres.value[key]
  if (!ore) return '●'
  
  // 根据矿石类型返回不同符号
  const symbols = {
    1: '○', // 土
    2: '◉', // 石头
    3: '◆', // 铁
    4: '★', // 黄金
    5: '💎', // 钻石
    6: '🔴', // 红物质
    7: '🔮', // 虚空水晶
    8: '⚫'  // 黑洞碎片
  }
  return symbols[ore.type] || '●'
}

// 尝试移动到目标格子
const tryMoveTo = (x, y) => {
  const dx = Math.abs(x - state.x)
  const dy = Math.abs(y - state.y)
  
  if ((dx === 1 && dy === 0) || (dx === 0 && dy === 1)) {
    if (canMoveTo(x, y)) {
      moveTo(x, y)
      showOreInfo(x, y)
    }
  } else if (dx !== 0 || dy !== 0) {
    uni.showToast({
      title: '只能移动到相邻格子',
      icon: 'none'
    })
  }
}

// 检查是否可以移动
const canMoveTo = (x, y) => {
  // 所有格子都可以移动，但可以添加特殊规则
  return true
}

// 显示矿石信息
const showOreInfo = (x, y) => {
  const key = `${x},${y}`
  const ore = worldOres.value[key]
  if (ore) {
    uni.showToast({
      title: `${ore.name} 💰 ${ore.price}`,
      icon: 'none',
      duration: 1000
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

// 扩展世界边界
const extendWorldIfNeeded = (x, y) => {
  let extended = false
  const oldBounds = { ...worldBounds }
  
  if (x < worldBounds.left) {
    worldBounds.left -= extendAmount
    extended = true
  } else if (x >= worldBounds.right) {
    worldBounds.right += extendAmount
    extended = true
  }
  
  if (y < worldBounds.top) {
    worldBounds.top -= extendAmount
    extended = true
  } else if (y >= worldBounds.bottom) {
    worldBounds.bottom += extendAmount
    extended = true
  }
  
  // 如果世界扩展了，生成新的矿石
  if (extended) {
    worldOres.value = extendWorldOres(worldOres.value, worldBounds, oldBounds)
  }
  
  return extended
}

// 调整视图
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

// 确保盒子在视野内
const ensureBoxInView = () => {
  const systemInfo = uni.getSystemInfoSync()
  const containerWidth = systemInfo.windowWidth
  const containerHeight = systemInfo.windowHeight
  
  const boxScreenX = (state.x - worldBounds.left) * cellSize * scale.value + offsetX.value * scale.value
  const boxScreenY = (state.y - worldBounds.top) * cellSize * scale.value + offsetY.value * scale.value
  const boxSize = cellSize * scale.value
  const threshold = 50
  
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
  
  // 限制偏移范围
  const maxOffsetX = 0
  const minOffsetX = -(worldWidth.value * scale.value - containerWidth) / scale.value
  const maxOffsetY = 0
  const minOffsetY = -(worldHeight.value * scale.value - containerHeight) / scale.value
  
  newOffsetX = Math.max(minOffsetX, Math.min(maxOffsetX, newOffsetX))
  newOffsetY = Math.max(minOffsetY, Math.min(maxOffsetY, newOffsetY))
  
  if (Math.abs(newOffsetX - offsetX.value) > 0.1 || Math.abs(newOffsetY - offsetY.value) > 0.1) {
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
  const newScale = Math.min(3, scale.value + 0.2)
  zoomTo(newScale)
}

const zoomOut = () => {
  const newScale = Math.max(0.5, scale.value - 0.2)
  zoomTo(newScale)
}

const zoomTo = (newScale) => {
  isAnimating.value = true
  scale.value = newScale
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
  
  // 重新初始化矿石
  worldOres.value = initializeWorldOres(20, 20, worldBounds)
  
  setTimeout(() => {
    isAnimating.value = false
  }, 300)
}

// 移动控制
const move = (direction) => {
  let newX = state.x
  let newY = state.y
  
  switch(direction) {
    case 'w': newY = state.y - 1; break
    case 'a': newX = state.x - 1; break
    case 's': newY = state.y + 1; break
    case 'd': newX = state.x + 1; break
  }
  
  if (canMoveTo(newX, newY)) {
    moveTo(newX, newY)
    showOreInfo(newX, newY)
  }
}

// 触摸事件
const handleTouchStart = (e) => {
  touchState.startX = e.touches[0].clientX
  touchState.startY = e.touches[0].clientY
  touchState.isTouching = true
}

const handleTouchMove = (e) => {
  if (!touchState.isTouching) return
  e.preventDefault()
  
  const currentX = e.touches[0].clientX
  const currentY = e.touches[0].clientY
  const now = Date.now()
  
  if (now - touchState.lastMoveTime < 100) return
  touchState.lastMoveTime = now
  
  const diffX = currentX - touchState.startX
  const diffY = currentY - touchState.startY
  
  if (Math.abs(diffX) > 30 || Math.abs(diffY) > 30) {
    if (Math.abs(diffX) > Math.abs(diffY)) {
      if (diffX > 0) move('d')
      else move('a')
    } else {
      if (diffY > 0) move('s')
      else move('w')
    }
    
    touchState.startX = currentX
    touchState.startY = currentY
  }
}

const handleTouchEnd = () => {
  touchState.isTouching = false
}

// 打开配置弹窗
const openConfig = () => {
  nextTick(() => {
    systemConfigRef.value?.openDialog()
  })
}

// 获取系统信息
const getSystemInfo = () => {
  const systemInfo = uni.getSystemInfoSync()
  screenHeight.value = systemInfo.windowHeight
}

// 初始化世界
onMounted(() => {
  getSystemInfo()
  
  // 初始化矿石
  worldOres.value = initializeWorldOres(20, 20, worldBounds)
  
  nextTick(() => {
    ensureBoxInView()
  })
})

// 监听世界大小变化
watch([worldWidth, worldHeight], () => {
  ensureBoxInView()
})
</script>

<style scoped>
.container {
  width: 100%;
  height: 100vh;
  position: relative;
  overflow: hidden;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  touch-action: none;
}

.scale-indicator {
  position: absolute;
  top: 20px;
  left: 20px;
  z-index: 20;
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(10px);
  padding: 8px 16px;
  border-radius: 30px;
  border: 1px solid rgba(255, 255, 255, 0.3);
}

.depth-indicator {
  position: absolute;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 20;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(10px);
  padding: 8px 20px;
  border-radius: 30px;
  border: 1px solid rgba(255, 255, 255, 0.3);
  display: flex;
  flex-direction: column;
  align-items: center;
}

.depth-text {
  color: #ffd700;
  font-size: 16px;
  font-weight: bold;
}

.depth-range {
  color: rgba(255, 255, 255, 0.7);
  font-size: 12px;
}

.ore-info {
  position: absolute;
  top: 20px;
  right: 80px;
  z-index: 20;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(10px);
  padding: 8px 16px;
  border-radius: 30px;
  border: 1px solid rgba(255, 255, 255, 0.3);
  display: flex;
  align-items: center;
  gap: 10px;
}

.ore-color {
  width: 24px;
  height: 24px;
  border-radius: 12px;
  border: 2px solid white;
}

.ore-details {
  display: flex;
  flex-direction: column;
}

.ore-name {
  color: white;
  font-size: 14px;
  font-weight: bold;
}

.ore-price {
  color: #ffd700;
  font-size: 12px;
}

.scale-text {
  color: white;
  font-size: 16px;
  font-weight: bold;
}

.world {
  position: absolute;
  top: 0;
  left: 0;
  transform-origin: 0 0;
  will-change: transform;
}

.grid {
  position: absolute;
  top: 0;
  left: 0;
}

.grid-cell {
  position: absolute;
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  cursor: pointer;
}

.grid-cell.current-cell {
  border: 3px solid #ffd700;
  transform: scale(1.02);
  z-index: 5;
  box-shadow: 0 0 20px rgba(255, 215, 0, 0.5);
}

.grid-cell.adjacent-cell {
  border: 2px dashed rgba(255, 255, 255, 0.5);
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0% { opacity: 0.7; }
  50% { opacity: 1; }
  100% { opacity: 0.7; }
}

.cell-coord {
  position: absolute;
  top: 2px;
  left: 2px;
  font-size: 8px;
  color: rgba(255, 255, 255, 0.5);
}

.ore-indicator {
  width: 20px;
  height: 20px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.ore-symbol {
  color: white;
  font-size: 12px;
  text-shadow: 0 0 5px rgba(0,0,0,0.5);
}

.user-box {
  position: absolute;
  background: linear-gradient(135deg, #6a11cb 0%, #2575fc 100%);
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: bold;
  font-size: 20px;
  z-index: 10;
  border: 2px solid white;
  animation: float 3s ease-in-out infinite;
}

@keyframes float {
  0% { transform: translateY(0px); }
  50% { transform: translateY(-5px); }
  100% { transform: translateY(0px); }
}

.box-content {
  text-align: center;
  line-height: 1.2;
}

.virtual-controls {
  position: absolute;
  bottom: 40px;
  right: 20px;
  z-index: 20;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-radius: 80px;
  padding: 15px;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.control-row {
  display: flex;
  justify-content: center;
  gap: 10px;
  margin-bottom: 10px;
}

.control-row:last-child {
  margin-bottom: 0;
}

.control-btn {
  width: 60px;
  height: 60px;
  border-radius: 30px;
  background: rgba(255, 255, 255, 0.2);
  border: 2px solid rgba(255, 255, 255, 0.3);
  color: white;
  font-size: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
}

.control-btn:active {
  transform: scale(0.9);
  background: rgba(255, 255, 255, 0.4);
}

.control-btn.up {
  background: linear-gradient(135deg, #ff6b6b 0%, #ee5253 100%);
}

.control-btn.left {
  background: linear-gradient(135deg, #48dbfb 0%, #0abde3 100%);
}

.control-btn.down {
  background: linear-gradient(135deg, #1dd1a1 0%, #10ac84 100%);
}

.control-btn.right {
  background: linear-gradient(135deg, #feca57 0%, #ff9f43 100%);
}

.settings {
  position: absolute;
  top: 20px;
  right: 20px;
  z-index: 20;
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(10px);
  border-radius: 50px;
  padding: 12px;
  border: 1px solid rgba(255, 255, 255, 0.3);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
}

.settings:active {
  transform: scale(0.95);
}

@media (max-width: 768px) {
  .control-btn {
    width: 50px;
    height: 50px;
    font-size: 24px;
  }
  
  .scale-indicator,
  .depth-indicator,
  .ore-info {
    padding: 6px 12px;
    font-size: 14px;
  }
}
</style>
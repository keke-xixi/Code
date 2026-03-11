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

    <view class="settings-add" @tap="saveMoney">
      <uni-icons type="checkmarkempty" size="30" color="#fff"></uni-icons>
    </view>
    
    <!-- 矿石信息 -->
    <view class="ore-info" v-if="currentOre">
      <view class="ore-color" :style="{ backgroundColor: currentOre.color }"></view>
      <view class="ore-details">
        <text class="ore-name">{{ currentOre.name }}</text>
        <text class="ore-price">{{ currentOre.price }} 💰 </text>
      </view>
    </view>
    
    <!-- 深度显示 -->
    <view class="depth-indicator">
      <view class="depth-text">💰 {{ allMoney }} </view>
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
              <!-- <text class="ore-symbol">{{ getOreSymbol(worldBounds.left + col - 1, worldBounds.top + row - 1) }}</text> -->
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
        <button @touchstart.prevent="moveBox('w')" class="control-btn up">↑</button>
      </view>
      <view class="control-row">
        <button @touchstart.prevent="moveBox('a')" class="control-btn left">←</button>
        <button @touchstart.prevent="moveBox('s')" class="control-btn down">↓</button>
        <button @touchstart.prevent="moveBox('d')" class="control-btn right">→</button>
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

    <ToastMessage ref="toastRef" :duration="2000" />
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
const screenWidth = ref(0)

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
const toastRef = ref(null)

// 总共金币
const allMoney = ref(0)

// 移动轨迹
const moveTrackArr = ref([])

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

const cellTypes = reactive({})

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
  const end = Math.min(gridCols.value, Math.ceil((screenWidth.value / scale.value - offsetX.value) / cellSize) + 2)
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
  
  const symbols = {
    1: '○', 2: '◉', 3: '◆', 4: '★', 
    5: '💎', 6: '🔴', 7: '🔮', 8: '⚫'
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
      calculatePrice(x, y)
      recordMove(x, y)
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
  return true
}

// 计算价格
const calculatePrice = (x, y) => {
  const key = `${x},${y}`
  const ore = worldOres.value[key]
  if (ore) {
    console.log(`当前矿石：${ore.name}，价值：${ore.price}金币`)
    allMoney.value += ore.price
  }
}

// 记录移动位置
const recordMove = (x, y) => {
  moveTrackArr.value.push({ x, y })
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
  
  if (extended) {
    worldOres.value = extendWorldOres(worldOres.value, worldBounds, oldBounds)
  }
  
  return extended
}

// 调整视图
const adjustViewAfterExtension = () => {
  centerViewOnBox()
}

// 确保盒子在视野内
const ensureBoxInView = () => {
  const containerWidth = screenWidth.value
  const containerHeight = screenHeight.value
  
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

// 新增：将视图中心对准盒子位置
const centerViewOnBox = () => {
  const containerWidth = screenWidth.value
  const containerHeight = screenHeight.value
  
  // 计算让盒子居中的偏移量
  const targetOffsetX = -((state.x - worldBounds.left) * cellSize - containerWidth / (2 * scale.value))
  const targetOffsetY = -((state.y - worldBounds.top) * cellSize - containerHeight / (2 * scale.value))
  
  // 限制偏移范围
  const maxOffsetX = 0
  const minOffsetX = -(worldWidth.value * scale.value - containerWidth) / scale.value
  const maxOffsetY = 0
  const minOffsetY = -(worldHeight.value * scale.value - containerHeight) / scale.value
  
  offsetX.value = Math.max(minOffsetX, Math.min(maxOffsetX, targetOffsetX))
  offsetY.value = Math.max(minOffsetY, Math.min(maxOffsetY, targetOffsetY))
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
  
  worldOres.value = initializeWorldOres(20, 20, worldBounds)
  
  setTimeout(() => {
    isAnimating.value = false
    centerViewOnBox() // 重置后居中
  }, 300)
}

// 移动控制
const moveBox = (direction) => {
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
    calculatePrice(newX, newY)
    recordMove(newX, newY)
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
      if (diffX > 0) moveBox('d')
      else moveBox('a')
    } else {
      if (diffY > 0) moveBox('s')
      else moveBox('w')
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

// 保存
const saveMoney = () => {
  if(allMoney.value) {
    uni.setStorageSync('MC_MONEY', allMoney.value)
    uni.setStorageSync('MC_MOVE_TRACK', moveTrackArr.value)
    uni.setStorageSync('MC_USER_POSITION', { x: state.x, y: state.y })
    toastRef.value?.showSuccess('保存成功')
  } else {
    toastRef.value?.showWarning('没有金币可保存')
  }
}

// 获取系统信息并加载存档
const getSystemInfo = () => {
  const systemInfo = uni.getSystemInfoSync()
  screenHeight.value = systemInfo.windowHeight
  screenWidth.value = systemInfo.windowWidth

  // 读取存档
  const money = uni.getStorageSync('MC_MONEY')
  const moveTrack = uni.getStorageSync('MC_MOVE_TRACK')
  const userPosition = uni.getStorageSync('MC_USER_POSITION')

  if(money) {
    allMoney.value = money
  }
  
  if(moveTrack) {
    moveTrackArr.value = moveTrack
  }

  if(userPosition) {
    state.x = userPosition.x
    state.y = userPosition.y
  }
}

// 确保世界边界包含玩家位置
const ensureWorldBoundsContainPosition = (x, y) => {
  let extended = false
  const oldBounds = { ...worldBounds }
  
  // 向左扩展
  if (x < worldBounds.left) {
    worldBounds.left = Math.min(worldBounds.left, x - extendAmount)
    extended = true
  }
  // 向右扩展
  else if (x >= worldBounds.right) {
    worldBounds.right = Math.max(worldBounds.right, x + extendAmount)
    extended = true
  }
  
  // 向上扩展
  if (y < worldBounds.top) {
    worldBounds.top = Math.min(worldBounds.top, y - extendAmount)
    extended = true
  }
  // 向下扩展
  else if (y >= worldBounds.bottom) {
    worldBounds.bottom = Math.max(worldBounds.bottom, y + extendAmount)
    extended = true
  }
  
  // 如果扩展了，生成新区块的矿石
  if (extended) {
    worldOres.value = extendWorldOres(worldOres.value, worldBounds, oldBounds)
  }
}

// 初始化世界
onMounted(() => {
  getSystemInfo()
  
  // 初始化矿石
  worldOres.value = initializeWorldOres(20, 20, worldBounds)

  // 根据玩家位置扩展世界边界（如果超出基础范围）
  ensureWorldBoundsContainPosition(state.x, state.y)

  console.log('worldOres:', worldOres.value)
  console.log('moveTrackArr:', moveTrackArr.value)
  console.log('state:', state, cellSize)
  
  
  // 等待DOM更新后，将视图中心对准盒子位置
  nextTick(() => {
    centerViewOnBox()
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

.depth-indicator {
  position: absolute;
  top: 30px;
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
  height: 100%;
}

.ore-info {
  position: absolute;
  top: 20px;
  left: 20px;
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
  border-radius: 80px;
  padding: 15px;
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

.settings, .settings-add {
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

.settings, .settings-add:active {
  transform: scale(0.95);
}

.settings-add {
  right: 80px;
}
</style>
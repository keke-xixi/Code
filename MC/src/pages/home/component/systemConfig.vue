<template>
    <uni-popup ref="configPopupRef" type="center" :mask-click="false">
        <view class="container">
            <!-- 控制面板 -->
            <view class="controls">
                <button @click="zoomOut" size="mini">-</button>
                <text class="scale-text">缩放: {{ (scale * 100).toFixed(0) }}%</text>
                <button @click="zoomIn" size="mini">+</button>
                <button @click="resetView" size="mini">重置视图</button>
            </view>

            <!-- 信息显示 -->
            <view class="info-panel">
                <text>当前位置: ({{ state.x }}, {{ state.y }})</text>
                <text>世界大小: {{ worldWidth / cellSize }} × {{ worldHeight / cellSize }}</text>
                <text>格子类型: {{ getCellType(state.x, state.y) }}</text>
                <text>格子效果: {{ getCellEffect(state.x, state.y) }}</text>
            </view>

            <view class="close" @tap="close">
                X
            </view>
        </view>
    </uni-popup>
</template>

<script setup>
import { computed, ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { useStore } from 'vuex'
import emitter from '@/utils/eventBus'

const store = useStore();
const emit = defineEmits(['zoomOut', 'zoomIn', 'resetView', 'close']);
const props = defineProps({
    scale: {
        type: Number,
        default: 1
    },
    worldWidth: {
        type: Number,
        default: 0
    },
    worldHeight: {
        type: Number,
        default: 0
    },
    cellSize: {
        type: Number,
        default: 0
    },
    state: {
        type: Object,
        default: () => ({ x: 0, y: 0 })
    },
    cellTypes: {
        type: Object,
        default: () => ({})
    }
})

// 参数
const configPopupRef = ref(null)

// 缩放
const zoomOut = () => {
    emit('zoomOut')
}

const zoomIn = () => {
    emit('zoomIn')
}

const resetView = () => {
    emit('resetView')
}

const close = () => {
    configPopupRef.value.close()
}

const openDialog = () => {
    configPopupRef.value.open()
}

// 获取格子类型
const getCellType = (x, y) => {
  const key = `${x},${y}`
  return props.cellTypes[key]?.type || '普通格子'
}

// 获取格子效果
const getCellEffect = (x, y) => {
  const key = `${x},${y}`
  return props.cellTypes[key]?.effect || '无特殊效果'
}

onShow(() => {

})

defineExpose({
    openDialog
})
</script>

<style scoped lang="scss">
.container {
  position: relative;
  top: 0;
  left: 0;
  height: 200px;
  background: rgba(0, 0, 0, 0.8);
}
.controls {
  position: absolute;
  top: 10px;
  left: 10px;
  z-index: 10;
  padding: 10px;
  border-radius: 5px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  color: white;
  display: flex;
  align-items: center;
  gap: 10px;
}
.info-panel {
  position: absolute;
  bottom: 20px;
  left: 10px;
  color: white;
  padding: 15px;
  border-radius: 8px;
  font-size: 12px;
  line-height: 1.8;
  display: flex;
  flex-direction: column;
  min-width: 200px;
  backdrop-filter: blur(5px);
  border: 1px solid rgba(255, 255, 255, 0.1);
}
.close {
    position: absolute;
    top: 10px;
    right: 10px;
    z-index: 10;
    color: #e7e7e9;
    padding: 10px 20px;
    border-radius: 5px;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
    display: flex;
    align-items: center;
    gap: 10px;
}
</style>
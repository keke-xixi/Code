<template>
  <uni-popup ref="popupRef" type="bottom" :safe-area="true">
    <view class="sheet">
      <view class="sheet__handle" />
      <view class="sheet__row">
        <text class="sheet__label">地图缩放</text>
        <view class="sheet__zoom">
          <view class="sheet__tap" @tap="$emit('zoomOut')">−</view>
          <text class="sheet__val">{{ scalePercent }}%</text>
          <view class="sheet__tap" @tap="$emit('zoomIn')">+</view>
        </view>
      </view>
      <view class="sheet__danger" @tap="onReset">重置全部进度</view>
    </view>
  </uni-popup>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  scale: { type: Number, default: 1 },
})

const emit = defineEmits(['zoomIn', 'zoomOut', 'gameReset'])

const popupRef = ref(null)
const scalePercent = computed(() => (props.scale * 100).toFixed(0))

const open = () => popupRef.value?.open()
const close = () => popupRef.value?.close()

const onReset = () => {
  uni.showModal({
    title: '重置进度',
    content: '金币、深度、地图将全部清空',
    confirmColor: '#ff6b6b',
    success: (res) => {
      if (res.confirm) {
        emit('gameReset')
        close()
      }
    },
  })
}

defineExpose({ open, close })
</script>

<style scoped lang="scss">
.sheet {
  background: #151b24;
  border-radius: 16px 16px 0 0;
  padding: 8px 20px calc(20px + env(safe-area-inset-bottom));
  border-top: 1px solid rgba(255, 215, 0, 0.15);
}

.sheet__handle {
  width: 36px;
  height: 4px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 2px;
  margin: 0 auto 16px;
}

.sheet__row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.sheet__label {
  font-size: 15px;
  color: #e8edf4;
}

.sheet__zoom {
  display: flex;
  align-items: center;
  gap: 12px;
}

.sheet__tap {
  width: 40px;
  height: 40px;
  line-height: 40px;
  text-align: center;
  font-size: 20px;
  color: #ffd700;
  background: rgba(255, 255, 255, 0.08);
  border-radius: 10px;
}

.sheet__val {
  min-width: 48px;
  text-align: center;
  font-weight: 600;
  color: #ffd700;
}

.sheet__danger {
  text-align: center;
  padding: 14px;
  font-size: 14px;
  color: #ff8a8a;
  border: 1px solid rgba(255, 107, 107, 0.3);
  border-radius: 10px;
}
</style>

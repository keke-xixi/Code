<template>
  <uni-popup ref="popupRef" type="center" :mask-click="maskClosable" @maskClick="onMaskClick">
    <view class="mc-modal" :class="sizeClass">
      <view class="mc-modal__header" v-if="title || showClose">
        <text class="mc-modal__title" v-if="title">{{ title }}</text>
        <view class="mc-modal__close" v-if="showClose" @tap="close">
          <uni-icons type="closeempty" size="18" color="#8b9cb3" />
        </view>
      </view>
      <view class="mc-modal__body">
        <slot />
      </view>
      <view class="mc-modal__footer" v-if="$slots.footer">
        <slot name="footer" />
      </view>
    </view>
  </uni-popup>
</template>

<script setup>
import { ref } from 'vue'

const props = defineProps({
  title: { type: String, default: '' },
  showClose: { type: Boolean, default: true },
  maskClosable: { type: Boolean, default: false },
  size: { type: String, default: 'md' }, // sm | md | lg
})

const emit = defineEmits(['close'])
const popupRef = ref(null)

const sizeClass = `mc-modal--${props.size}`

const open = () => popupRef.value?.open()
const close = () => {
  popupRef.value?.close()
  emit('close')
}

const onMaskClick = () => {
  if (props.maskClosable) close()
}

defineExpose({ open, close })
</script>

<style scoped lang="scss">
.mc-modal {
  width: 88vw;
  max-width: 400px;
  background: var(--mc-surface, rgba(15, 20, 28, 0.96));
  border: 1px solid var(--mc-border, rgba(255, 215, 0, 0.22));
  border-radius: 16px;
  box-shadow: var(--mc-shadow-panel, 0 8px 32px rgba(0, 0, 0, 0.5));
  overflow: hidden;
  color: var(--mc-text, #e8edf4);
}

.mc-modal--sm {
  max-width: 320px;
}

.mc-modal--lg {
  max-width: 440px;
}

.mc-modal__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 18px 0;
}

.mc-modal__title {
  font-size: 17px;
  font-weight: 600;
  color: var(--mc-gold, #ffd700);
  letter-spacing: 0.5px;
}

.mc-modal__close {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.06);
  display: flex;
  align-items: center;
  justify-content: center;
}

.mc-modal__body {
  padding: 14px 18px 18px;
}

.mc-modal__footer {
  padding: 0 18px 18px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
</style>

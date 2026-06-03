<template>
  <uni-popup ref="popupRef" type="center" :mask-click="false">
    <view class="mc-toast" :class="`mc-toast--${toastType}`">
      <text class="mc-toast__emoji" v-if="displayIcon">{{ displayIcon }}</text>
      <text class="mc-toast__title" v-if="toastTitle">{{ toastTitle }}</text>
      <text class="mc-toast__message">{{ toastMessage }}</text>
      <view class="mc-toast__actions" v-if="toastShowConfirm || toastShowCancel">
        <McButton
          v-if="toastShowCancel"
          variant="ghost"
          size="sm"
          :label="cancelText"
          @tap="handleCancel"
        />
        <McButton
          v-if="toastShowConfirm"
          variant="primary"
          size="sm"
          :label="confirmText"
          @tap="handleConfirm"
        />
      </view>
    </view>
  </uni-popup>
</template>

<script setup>
import { ref, computed } from 'vue'
import McButton from '@/components/ui/McButton.vue'

const props = defineProps({
  type: { type: String, default: 'info' },
  title: { type: String, default: '' },
  message: { type: String, default: '' },
  emoji: { type: String, default: '' },
  showIcon: { type: Boolean, default: true },
  duration: { type: Number, default: 1800 },
  showConfirm: { type: Boolean, default: false },
  confirmText: { type: String, default: '确定' },
  showCancel: { type: Boolean, default: false },
  cancelText: { type: String, default: '取消' },
})

const emit = defineEmits(['confirm', 'cancel', 'close'])

const popupRef = ref(null)
let timer = null

const toastType = ref(props.type)
const toastTitle = ref(props.title)
const toastMessage = ref(props.message)
const toastEmoji = ref(props.emoji)
const toastShowConfirm = ref(props.showConfirm)
const toastShowCancel = ref(props.showCancel)
const toastDuration = ref(props.duration)

const iconEmoji = computed(() => {
  const map = {
    success: '✓',
    error: '✕',
    warning: '!',
    info: 'ℹ',
    loading: '…',
  }
  return map[toastType.value] || 'ℹ'
})

const displayIcon = computed(() => {
  if (toastEmoji.value) return toastEmoji.value
  if (props.showIcon) return iconEmoji.value
  return ''
})

const clearTimer = () => {
  if (timer) {
    clearTimeout(timer)
    timer = null
  }
}

const open = (options = {}) => {
  if (options.type) toastType.value = options.type
  if (options.title) toastTitle.value = options.title
  if (options.message) toastMessage.value = options.message
  if (options.emoji !== undefined) toastEmoji.value = options.emoji
  if (options.showConfirm !== undefined) toastShowConfirm.value = options.showConfirm
  if (options.showCancel !== undefined) toastShowCancel.value = options.showCancel
  if (options.duration !== undefined) toastDuration.value = options.duration

  popupRef.value?.open()
  clearTimer()

  if (
    toastDuration.value > 0 &&
    !toastShowConfirm.value &&
    !toastShowCancel.value
  ) {
    timer = setTimeout(close, toastDuration.value)
  }
}

const close = () => {
  clearTimer()
  popupRef.value?.close()
  emit('close')
}

const handleConfirm = () => {
  emit('confirm')
  close()
}

const handleCancel = () => {
  emit('cancel')
  close()
}

const showSuccess = (msg, options = {}) =>
  open({ type: 'success', message: msg, emoji: '✓', ...options })

const showError = (msg, options = {}) =>
  open({ type: 'error', message: msg, emoji: '✕', ...options })

const showWarning = (msg, options = {}) =>
  open({ type: 'warning', message: msg, emoji: '!', ...options })

const showLoading = (msg = '加载中...', options = {}) =>
  open({ type: 'loading', message: msg, emoji: '', duration: 0, ...options })

defineExpose({ open, close, showSuccess, showError, showWarning, showLoading })
</script>

<style scoped lang="scss">
.mc-toast {
  min-width: 220px;
  max-width: 300px;
  padding: 20px 22px;
  border-radius: 14px;
  background: var(--mc-surface, rgba(15, 20, 28, 0.96));
  border: 1px solid var(--mc-border, rgba(255, 215, 0, 0.2));
  box-shadow: var(--mc-shadow-panel, 0 8px 32px rgba(0, 0, 0, 0.5));
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  text-align: center;
}

.mc-toast__emoji {
  font-size: 28px;
  font-weight: bold;
  color: var(--mc-gold, #ffd700);
}

.mc-toast__title {
  font-size: 16px;
  font-weight: 600;
  color: var(--mc-text, #e8edf4);
}

.mc-toast__message {
  font-size: 14px;
  color: var(--mc-text-muted, #8b9cb3);
  line-height: 1.5;
}

.mc-toast__actions {
  display: flex;
  gap: 8px;
  margin-top: 8px;
  width: 100%;
}

.mc-toast--success .mc-toast__message {
  color: #9ae6b0;
}

.mc-toast--error .mc-toast__message {
  color: #ff9a9a;
}

.mc-toast--warning .mc-toast__message {
  color: #ffe08a;
}
</style>

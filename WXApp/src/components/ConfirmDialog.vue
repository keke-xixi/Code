<template>
  <view v-if="visible" class="confirm-mask" @tap="onMaskTap">
    <view class="confirm-dialog" @tap.stop>
      <text class="confirm-dialog__title">{{ title }}</text>
      <text v-if="content" class="confirm-dialog__content">{{ content }}</text>
      <view class="confirm-dialog__actions">
        <view
          class="confirm-dialog__btn confirm-dialog__btn--cancel"
          hover-class="confirm-dialog__btn--hover"
          @tap="cancel"
        >
          <text>{{ cancelText }}</text>
        </view>
        <view
          class="confirm-dialog__btn confirm-dialog__btn--confirm"
          :class="`confirm-dialog__btn--${confirmType}`"
          :style="confirmStyle"
          hover-class="confirm-dialog__btn--hover"
          @tap="confirm"
        >
          <text>{{ confirmText }}</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { computed } from 'vue'
import { useTheme } from '@/composables/useTheme.js'

const props = defineProps({
  visible: { type: Boolean, default: false },
  title: { type: String, default: '提示' },
  content: { type: String, default: '' },
  confirmText: { type: String, default: '确定' },
  cancelText: { type: String, default: '取消' },
  confirmType: { type: String, default: 'primary' },
  closeOnMask: { type: Boolean, default: true },
})

const emit = defineEmits(['update:visible', 'confirm', 'cancel'])

const { theme } = useTheme()

const confirmStyle = computed(() => {
  if (props.confirmType === 'danger') {
    return { background: theme.value.danger }
  }
  return { background: theme.value.primary }
})

const close = () => emit('update:visible', false)

const cancel = () => {
  close()
  emit('cancel')
}

const confirm = () => {
  close()
  emit('confirm')
}

const onMaskTap = () => {
  if (props.closeOnMask) cancel()
}
</script>

<style lang="scss" scoped>
.confirm-mask {
  position: fixed;
  inset: 0;
  z-index: 1000;
  background: rgba(15, 23, 42, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 48rpx;
  box-sizing: border-box;
}

.confirm-dialog {
  width: 100%;
  max-width: 600rpx;
  background: #ffffff;
  border-radius: 24rpx;
  padding: 40rpx 32rpx 32rpx;
  box-shadow: 0 24rpx 64rpx rgba(15, 23, 42, 0.18);
  box-sizing: border-box;

  &__title {
    display: block;
    font-size: 34rpx;
    font-weight: 700;
    color: var(--c-text, #0f172a);
    text-align: center;
    margin-bottom: 16rpx;
  }

  &__content {
    display: block;
    font-size: 28rpx;
    color: var(--c-text-secondary, #64748b);
    text-align: center;
    line-height: 1.6;
    margin-bottom: 32rpx;
  }

  &__actions {
    display: flex;
    flex-direction: column;
    gap: 12rpx;
  }

  &__btn {
    height: 88rpx;
    border-radius: 16rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 32rpx;
    font-weight: 600;
    box-sizing: border-box;

    &--cancel {
      background: #f8fafc;
      border: 2rpx solid var(--c-border, #e2e8f0);
      color: var(--c-text-secondary, #64748b);
    }

    &--confirm {
      color: #ffffff;
    }

    &--danger {
      background: #ef4444;
    }

    &--hover {
      opacity: 0.88;
    }
  }
}
</style>

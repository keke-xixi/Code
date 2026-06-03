<template>
  <view class="empty-state">
    <text class="empty-state__icon">{{ icon }}</text>
    <text class="empty-state__title">{{ title }}</text>
    <text v-if="desc" class="empty-state__desc">{{ desc }}</text>
    <AppButton v-if="actionText" type="soft" :block="false" size="sm" @tap="$emit('action')">
      {{ actionText }}
    </AppButton>
  </view>
</template>

<script setup>
import AppButton from '@/components/AppButton.vue'

defineProps({
  icon: { type: String, default: '📭' },
  title: { type: String, default: '暂无内容' },
  desc: { type: String, default: '' },
  actionText: { type: String, default: '' },
})

defineEmits(['action'])
</script>

<style lang="scss" scoped>
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 80rpx 40rpx;
  gap: 16rpx;

  &__icon {
    font-size: 80rpx;
    line-height: 1;
    margin-bottom: 8rpx;
  }

  &__title {
    font-size: 30rpx;
    font-weight: 600;
    color: var(--c-text-secondary);
  }

  &__desc {
    font-size: 26rpx;
    color: var(--c-text-muted);
    text-align: center;
    line-height: 1.5;
    margin-bottom: 8rpx;
  }
}
</style>

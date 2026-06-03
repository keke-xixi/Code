<template>
  <view class="theme-picker">
    <view
      v-for="item in themeList"
      :key="item.id"
      class="theme-picker__item"
      :class="{ 'theme-picker__item--active': modelValue === item.id }"
      @tap="$emit('update:modelValue', item.id)"
    >
      <view class="theme-picker__preview" :style="{ background: item.gradient }" />
      <view class="theme-picker__info">
        <text class="theme-picker__name">{{ item.name }}</text>
        <text class="theme-picker__desc">{{ item.desc }}</text>
      </view>
      <view v-if="modelValue === item.id" class="theme-picker__check" :style="{ background: item.primary }">✓</view>
    </view>
  </view>
</template>

<script setup>
import { THEMES } from '@/config/theme.js'

defineProps({
  modelValue: { type: String, default: 'blue' },
})

defineEmits(['update:modelValue'])

const themeList = Object.values(THEMES)
</script>

<style lang="scss" scoped>
.theme-picker {
  display: flex;
  flex-direction: column;
  gap: 16rpx;

  &__item {
    display: flex;
    align-items: center;
    gap: 20rpx;
    padding: 20rpx 24rpx;
    background: var(--c-card);
    border-radius: 20rpx;
    border: 2rpx solid var(--c-border);

    &--active {
      border-color: var(--c-primary);
      background: var(--c-primary-light);
    }
  }

  &__preview {
    width: 72rpx;
    height: 72rpx;
    border-radius: 16rpx;
    flex-shrink: 0;
  }

  &__info {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 4rpx;
  }

  &__name {
    font-size: 30rpx;
    font-weight: 600;
    color: var(--c-text);
  }

  &__desc {
    font-size: 24rpx;
    color: var(--c-text-muted);
  }

  &__check {
    width: 44rpx;
    height: 44rpx;
    border-radius: 50%;
    color: #fff;
    font-size: 24rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }
}
</style>

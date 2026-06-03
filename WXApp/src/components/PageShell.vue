<template>
  <view class="shell" :style="shellStyle">
    <scroll-view scroll-y class="shell__scroll" :show-scrollbar="false">
      <view class="shell__body">
        <slot />
        <view v-if="hasFooter" class="shell__footer-inline">
          <slot name="footer" />
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<script setup>
import { useSlots, computed, onMounted } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { useTheme } from '@/composables/useTheme.js'
import { themeToCssVars } from '@/config/theme.js'

const slots = useSlots()
const hasFooter = computed(() => !!slots.footer)
const { theme, initTheme } = useTheme()

const shellStyle = computed(() => ({
  ...themeToCssVars(theme.value),
  background: theme.value.bg,
}))

const applyNav = () => {
  initTheme()
}

onMounted(applyNav)
onShow(applyNav)
</script>

<style lang="scss" scoped>
.shell {
  min-height: 100vh;
  background: var(--c-bg);
  color: var(--c-text);
  box-sizing: border-box;

  &__scroll {
    min-height: 100vh;
  }

  &__body {
    padding: 24rpx;
    padding-bottom: calc(40rpx + env(safe-area-inset-bottom));
    box-sizing: border-box;
  }

  &__footer-inline {
    margin-top: 32rpx;
    padding-top: 8rpx;
  }
}
</style>

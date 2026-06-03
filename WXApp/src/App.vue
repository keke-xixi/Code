<script>
import { useTheme } from '@/composables/useTheme.js'

export default {
  onLaunch() {
    useTheme().initTheme()
  },
}
</script>

<style lang="scss">
page {
  background: #f5f7fb;
  color: #0f172a;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'PingFang SC',
    'Microsoft YaHei', sans-serif;
  font-size: 28rpx;
  line-height: 1.5;
}

.card {
  background: var(--c-card, #fff);
  border-radius: 24rpx;
  padding: 28rpx;
  box-shadow: var(--c-shadow, 0 8rpx 32rpx rgba(15, 23, 42, 0.06));
  border: 1rpx solid var(--c-border, #e2e8f0);
}

.section-title {
  display: block;
  font-size: 30rpx;
  font-weight: 700;
  color: var(--c-text, #0f172a);
  margin-bottom: 16rpx;
}

.field-label {
  display: block;
  font-size: 24rpx;
  color: var(--c-text-secondary, #64748b);
  margin-bottom: 10rpx;
  padding-left: 4rpx;
}

.field-input {
  height: 88rpx;
  padding: 0 24rpx;
  background: var(--c-input-bg, #f8fafc);
  border-radius: 16rpx;
  font-size: 30rpx;
  border: 1rpx solid var(--c-border, #e2e8f0);
  color: var(--c-text, #0f172a);
}

.field-textarea {
  width: 100%;
  min-height: 200rpx;
  padding: 20rpx 24rpx;
  background: var(--c-input-bg, #f8fafc);
  border-radius: 16rpx;
  font-size: 30rpx;
  border: 1rpx solid var(--c-border, #e2e8f0);
  color: var(--c-text, #0f172a);
  box-sizing: border-box;
}

.action-stack {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.action-row {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.ph {
  color: var(--c-text-muted, #94a3b8);
}
</style>

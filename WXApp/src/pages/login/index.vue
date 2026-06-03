<template>
  <view class="login" :style="pageStyle">
    <view class="login__hero">
      <view class="login__logo-wrap" :style="{ background: theme.gradient, boxShadow: `0 12rpx 32rpx ${theme.primary}55` }">
        <text class="login__logo">☁</text>
      </view>
      <text class="login__title">云笔记</text>
      <text class="login__sub">笔记 · 知识 · 文件，释放手机空间</text>
    </view>

    <view class="login__body">
      <view class="card login__form">
        <text class="field-label">用户名</text>
        <input
          v-model="username"
          class="field-input login__input"
          placeholder="请输入用户名"
          placeholder-class="ph"
        />
        <text class="field-label">密码</text>
        <input
          v-model="password"
          class="field-input login__input"
          password
          placeholder="请输入密码"
          placeholder-class="ph"
        />
        <view
          class="login__btn"
          :class="{ 'login__btn--disabled': loading }"
          :style="btnStyle"
          hover-class="login__btn--hover"
          @tap="handleLogin"
        >
          <text class="login__btn-text">{{ loading ? '登录中...' : '登录' }}</text>
        </view>
        <text class="login__hint">账号由管理员创建，不支持自助注册</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { login } from '@/api/auth.js'
import { setAuth, getToken } from '@/utils/request.js'
import { useTheme } from '@/composables/useTheme.js'
import { themeToCssVars, THEMES } from '@/config/theme.js'

const { theme, initTheme, syncThemeFromUser } = useTheme()
const statusBarHeight = ref(20)

try {
  statusBarHeight.value = uni.getSystemInfoSync().statusBarHeight || 20
} catch {
  statusBarHeight.value = 20
}

const defaultTheme = THEMES.blue
const pageStyle = computed(() => ({
  ...themeToCssVars(defaultTheme),
  background: defaultTheme.gradientSoft,
  paddingTop: statusBarHeight.value + 'px',
}))

const btnStyle = computed(() => ({
  background: defaultTheme.primary,
}))

const username = ref('')
const password = ref('')
const loading = ref(false)

onShow(() => {
  initTheme()
  if (getToken()) {
    uni.reLaunch({ url: '/pages/home/index' })
  }
})

const handleLogin = async () => {
  if (loading.value) return
  if (!username.value.trim() || !password.value) {
    uni.showToast({ title: '请输入账号密码', icon: 'none' })
    return
  }
  loading.value = true
  try {
    const result = await login(username.value.trim(), password.value)
    setAuth(result.token, result.user)
    syncThemeFromUser(result.user)
    uni.reLaunch({ url: '/pages/home/index' })
  } catch (e) {
    uni.showToast({ title: e.message || '登录失败', icon: 'none' })
  } finally {
    loading.value = false
  }
}
</script>

<style lang="scss" scoped>
.login {
  min-height: 100vh;
  background: var(--c-bg);

  &__hero {
    padding: 100rpx 40rpx 60rpx;
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  &__logo-wrap {
    width: 120rpx;
    height: 120rpx;
    border-radius: 32rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 28rpx;
  }

  &__logo {
    font-size: 64rpx;
    line-height: 1;
  }

  &__title {
    font-size: 52rpx;
    font-weight: 800;
    color: var(--c-text);
    letter-spacing: 2rpx;
  }

  &__sub {
    margin-top: 12rpx;
    font-size: 26rpx;
    color: var(--c-text-secondary);
  }

  &__body {
    padding: 0 32rpx 48rpx;
  }

  &__form {
    display: flex;
    flex-direction: column;
    gap: 8rpx;
  }

  &__input {
    margin-bottom: 16rpx;
  }

  &__btn {
    margin-top: 16rpx;
    height: 88rpx;
    border-radius: 16rpx;
    display: flex;
    align-items: center;
    justify-content: center;

    &--disabled {
      opacity: 0.6;
    }

    &--hover {
      opacity: 0.88;
    }
  }

  &__btn-text {
    font-size: 32rpx;
    font-weight: 600;
    color: #ffffff;
  }

  &__hint {
    text-align: center;
    font-size: 24rpx;
    color: var(--c-text-muted);
    margin-top: 20rpx;
  }
}
</style>

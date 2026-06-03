<template>
  <view class="settings-page">
    <PageShell>
      <view class="settings__card" :style="cardStyle">
        <text class="field-label">原密码</text>
        <input
          v-model="pwdForm.oldPassword"
          class="field-input settings__input"
          password
          placeholder="请输入当前密码"
          placeholder-class="ph"
        />
        <text class="field-label">新密码</text>
        <input
          v-model="pwdForm.newPassword"
          class="field-input settings__input"
          password
          placeholder="至少 6 位"
          placeholder-class="ph"
        />
        <text class="field-label">确认新密码</text>
        <input
          v-model="pwdForm.confirmPassword"
          class="field-input"
          password
          placeholder="再次输入新密码"
          placeholder-class="ph"
        />
      </view>

      <view class="settings__about" :style="cardStyle">
        <text class="settings__about-title">云笔记</text>
        <text class="settings__about-desc">个人知识库与文件云存储</text>
      </view>
    </PageShell>

    <view class="settings__footer">
      <view
        class="settings__save"
        :class="{ 'settings__save--disabled': saving }"
        :style="saveBtnStyle"
        hover-class="settings__save--hover"
        @tap="changePwd"
      >
        <text class="settings__save-text">{{ saving ? '修改中...' : '确认修改' }}</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { reactive, ref, computed } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { changePassword, fetchMe } from '@/api/auth.js'
import { ensureLogin, getToken, setAuth, getUser } from '@/utils/request.js'
import { useTheme } from '@/composables/useTheme.js'

const { theme, initTheme, syncThemeFromUser } = useTheme()

const cardStyle = computed(() => ({
  borderLeftColor: theme.value.primary,
  boxShadow: `0 8rpx 28rpx ${theme.value.primary}18`,
}))

const saveBtnStyle = computed(() => ({
  background: theme.value.primary,
}))

const saving = ref(false)
const pwdForm = reactive({
  oldPassword: '',
  newPassword: '',
  confirmPassword: '',
})

onShow(async () => {
  if (!ensureLogin()) return
  initTheme()
  try {
    const user = await fetchMe()
    setAuth(getToken(), user)
    syncThemeFromUser(user)
  } catch {
    syncThemeFromUser(getUser())
  }
})

const changePwd = async () => {
  if (saving.value) return
  const { oldPassword, newPassword, confirmPassword } = pwdForm
  if (!oldPassword || !newPassword) {
    uni.showToast({ title: '请填写完整', icon: 'none' })
    return
  }
  if (newPassword.length < 6) {
    uni.showToast({ title: '新密码至少 6 位', icon: 'none' })
    return
  }
  if (newPassword !== confirmPassword) {
    uni.showToast({ title: '两次新密码不一致', icon: 'none' })
    return
  }
  saving.value = true
  try {
    await changePassword(oldPassword, newPassword)
    uni.showToast({ title: '密码已修改', icon: 'success' })
    pwdForm.oldPassword = ''
    pwdForm.newPassword = ''
    pwdForm.confirmPassword = ''
  } catch (e) {
    uni.showToast({ title: e.message, icon: 'none' })
  } finally {
    saving.value = false
  }
}
</script>

<style lang="scss" scoped>
.settings-page {
  min-height: 100vh;
  padding-bottom: calc(120rpx + env(safe-area-inset-bottom));
  box-sizing: border-box;
}

.settings {
  &__card {
    padding: 28rpx;
    margin-bottom: 24rpx;
    background: #ffffff;
    border-radius: 20rpx;
    border: 1rpx solid var(--c-border);
    border-left-width: 8rpx;
    border-left-style: solid;
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    gap: 8rpx;
  }

  &__input {
    margin-bottom: 8rpx;
  }

  &__about {
    text-align: center;
    padding: 36rpx 28rpx;
    background: #ffffff;
    border-radius: 20rpx;
    border: 1rpx solid var(--c-border);
    border-left-width: 8rpx;
    border-left-style: solid;
    box-sizing: border-box;
  }

  &__about-title {
    display: block;
    font-size: 30rpx;
    font-weight: 700;
    color: var(--c-primary);
    margin-bottom: 8rpx;
  }

  &__about-desc {
    font-size: 24rpx;
    color: var(--c-text-muted);
  }

  &__footer {
    position: fixed;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 100;
    padding: 16rpx 24rpx;
    padding-bottom: calc(16rpx + env(safe-area-inset-bottom));
    background: #ffffff;
    border-top: 1rpx solid #eef0f4;
    box-sizing: border-box;
  }

  &__save {
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

  &__save-text {
    font-size: 32rpx;
    font-weight: 600;
    color: #ffffff;
  }
}
</style>

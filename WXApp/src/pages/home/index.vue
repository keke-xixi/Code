<template>
  <view class="home" :style="pageStyle">
    <view class="home__menu">
      <view
        v-for="item in menuItems"
        :key="item.key"
        class="home__entry"
        :style="entryStyle(item)"
        hover-class="home__entry--hover"
        @tap="item.action"
      >
        <view class="home__entry-icon" :style="{ background: item.iconBg }">
          <text>{{ item.icon }}</text>
        </view>
        <view class="home__entry-body">
          <text class="home__entry-title" :style="{ color: item.titleColor }">{{ item.title }}</text>
          <text class="home__entry-desc">{{ item.desc }}</text>
          <view v-if="item.count != null" class="home__entry-badge" :style="{ background: item.badgeBg, color: item.badgeColor }">
            {{ item.count }}
          </view>
        </view>
        <text class="home__entry-arrow" :style="{ color: item.titleColor }">›</text>
      </view>
    </view>

    <FabButton label="退出" @tap="logout" />
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { fetchStorageSummary } from '@/api/files.js'
import { fetchMe } from '@/api/auth.js'
import { clearAuth, ensureLogin, getToken, getUser, setAuth } from '@/utils/request.js'
import { useTheme } from '@/composables/useTheme.js'
import { themeToCssVars } from '@/config/theme.js'
import FabButton from '@/components/FabButton.vue'

const { theme, initTheme, syncThemeFromUser } = useTheme()
const user = ref(getUser())
const summary = ref(null)

const pageStyle = computed(() => ({
  ...themeToCssVars(theme.value),
  background: theme.value.bg,
}))

const totalFiles = computed(() => {
  if (!summary.value?.files) return 0
  return summary.value.files.reduce((n, f) => n + f.count, 0)
})

const menuItems = computed(() => {
  const t = theme.value
  const items = [
    {
      key: 'notes',
      icon: '📝',
      title: '笔记知识',
      desc: '记录文字、标签与知识备忘',
      count: `${summary.value?.noteCount || 0} 篇`,
      iconBg: t.gradient,
      titleColor: t.primaryDark,
      badgeBg: t.primaryLight,
      badgeColor: t.primaryDark,
      barColor: t.primary,
      action: () => uni.navigateTo({ url: '/pages/notes/list' }),
    },
    {
      key: 'files',
      icon: '📁',
      title: '文件云盘',
      desc: '图片、视频、安装包云端存储',
      count: `${totalFiles.value} 个`,
      iconBg: `linear-gradient(135deg, ${t.accent}, ${t.primary})`,
      titleColor: t.accent,
      badgeBg: t.primarySoft,
      badgeColor: t.primaryDark,
      barColor: t.accent,
      action: () => uni.navigateTo({ url: '/pages/files/index' }),
    },
    {
      key: 'settings',
      icon: '🔒',
      title: '修改密码',
      desc: '更新当前账号登录密码',
      iconBg: t.gradient,
      titleColor: t.primaryDark,
      badgeBg: t.primaryLight,
      badgeColor: t.primaryDark,
      barColor: t.primary,
      action: () => uni.navigateTo({ url: '/pages/settings/index' }),
    },
  ]

  if (user.value?.role === 'admin') {
    items.push({
      key: 'admin',
      icon: '👤',
      title: '用户管理',
      desc: '创建账号、配置主题、禁用用户',
      iconBg: `linear-gradient(135deg, #f59e0b, #ea580c)`,
      titleColor: '#ea580c',
      badgeBg: '#fff7ed',
      badgeColor: '#ea580c',
      barColor: '#f59e0b',
      action: () => uni.navigateTo({ url: '/pages/admin/users' }),
    })
  }

  return items
})

const entryStyle = (item) => ({
  borderLeft: `10rpx solid ${item.barColor}`,
  background: '#ffffff',
  boxShadow: `0 8rpx 32rpx ${item.barColor}22`,
})

onShow(async () => {
  if (!ensureLogin()) return
  initTheme()
  try {
    const me = await fetchMe()
    setAuth(getToken(), me)
    user.value = me
    syncThemeFromUser(me)
  } catch {
    user.value = getUser()
    syncThemeFromUser(user.value)
  }
  uni.setNavigationBarTitle({ title: '云笔记' })
  loadSummary()
})

const loadSummary = async () => {
  try {
    summary.value = await fetchStorageSummary()
  } catch {
    summary.value = { noteCount: 0, files: [] }
  }
}

const logout = () => {
  uni.showModal({
    title: '退出登录',
    content: '确定要退出吗？',
    confirmColor: theme.value.danger,
    success(res) {
      if (res.confirm) {
        clearAuth()
        uni.reLaunch({ url: '/pages/login/index' })
      }
    },
  })
}
</script>

<style lang="scss" scoped>
.home {
  min-height: 100vh;
  padding: 24rpx;
  padding-bottom: calc(160rpx + env(safe-area-inset-bottom));
  box-sizing: border-box;

  &__menu {
    display: flex;
    flex-direction: column;
    gap: 24rpx;
  }

  &__entry {
    display: flex;
    align-items: center;
    gap: 24rpx;
    padding: 36rpx 28rpx 36rpx 32rpx;
    border-radius: 20rpx;
    min-height: 160rpx;
    box-sizing: border-box;

    &--hover {
      opacity: 0.92;
      transform: scale(0.985);
    }
  }

  &__entry-icon {
    width: 100rpx;
    height: 100rpx;
    border-radius: 24rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 44rpx;
    flex-shrink: 0;
    box-shadow: 0 8rpx 20rpx rgba(0, 0, 0, 0.12);
  }

  &__entry-body {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 10rpx;
  }

  &__entry-title {
    font-size: 36rpx;
    font-weight: 800;
  }

  &__entry-desc {
    font-size: 26rpx;
    color: #64748b;
    line-height: 1.45;
  }

  &__entry-badge {
    align-self: flex-start;
    font-size: 24rpx;
    font-weight: 700;
    padding: 6rpx 18rpx;
    border-radius: 999rpx;
    margin-top: 4rpx;
  }

  &__entry-arrow {
    font-size: 52rpx;
    font-weight: 300;
    flex-shrink: 0;
    line-height: 1;
  }
}
</style>

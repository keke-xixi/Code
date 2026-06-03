<template>
  <view class="admin-page">
    <PageShell>
      <view class="admin__card" :style="cardStyle">
        <text class="field-label">用户名</text>
        <input
          v-model="form.username"
          class="field-input admin__field"
          placeholder="请输入用户名"
          placeholder-class="ph"
        />
        <text class="field-label">初始密码</text>
        <input
          v-model="form.password"
          class="field-input admin__field"
          password
          placeholder="至少 6 位"
          placeholder-class="ph"
        />
        <text class="field-label">角色</text>
        <picker :range="roleOptions" range-key="label" @change="onRoleChange">
          <view class="admin__picker">
            <text>{{ roleLabel }}</text>
            <text class="admin__picker-arrow">›</text>
          </view>
        </picker>
        <text class="field-label">界面主题</text>
        <picker :range="themeOptions" range-key="label" @change="onThemeChange">
          <view class="admin__picker">
            <text>{{ themeLabel }}</text>
            <text class="admin__picker-arrow">›</text>
          </view>
        </picker>
      </view>

      <view class="admin__list-head">
        <text class="admin__list-title">用户列表</text>
        <text class="admin__count">{{ users.length }} 人</text>
      </view>

      <view v-if="loading" class="admin__loading">加载中...</view>
      <EmptyState v-else-if="!users.length" icon="👤" title="暂无用户" />

      <view v-for="item in users" :key="item.id" class="admin__item" :style="cardStyle">
        <view class="admin__user">
          <view class="admin__avatar" :style="{ background: avatarBg(item) }">
            {{ item.username.slice(0, 1).toUpperCase() }}
          </view>
          <view class="admin__info">
            <text class="admin__name">{{ item.username }}</text>
            <view class="admin__tags">
              <text class="admin__badge">{{ item.role === 'admin' ? '管理员' : '成员' }}</text>
              <text
                class="admin__badge"
                :class="{ 'admin__badge--off': item.status === 'disabled' }"
              >
                {{ item.status === 'active' ? '正常' : '已禁用' }}
              </text>
              <text class="admin__badge admin__badge--theme" :style="themeBadgeStyle(item.theme)">
                {{ themeName(item.theme) }}
              </text>
            </view>
          </view>
        </view>

        <view class="admin__actions">
          <view
            class="admin__action admin__action--warn"
            :class="{ 'admin__action--disabled': isSelf(item) }"
            hover-class="admin__action--hover"
            @tap="toggleStatus(item)"
          >
            <text>{{ item.status === 'active' ? '禁用' : '启用' }}</text>
          </view>
          <view
            class="admin__action admin__action--soft"
            :style="softBtnStyle"
            hover-class="admin__action--hover"
            @tap="changePwd(item)"
          >
            <text>改密</text>
          </view>
          <view
            class="admin__action admin__action--soft"
            :style="softBtnStyle"
            hover-class="admin__action--hover"
            @tap="changeTheme(item)"
          >
            <text>主题</text>
          </view>
          <view
            class="admin__action admin__action--danger"
            :class="{ 'admin__action--disabled': isSelf(item) }"
            hover-class="admin__action--hover"
            @tap="remove(item)"
          >
            <text>删除</text>
          </view>
        </view>

        <text v-if="isSelf(item)" class="admin__hint">当前登录账号，不可禁用或删除</text>
      </view>
    </PageShell>

    <view class="admin__footer">
      <view
        class="admin__create-btn"
        :class="{ 'admin__create-btn--disabled': creating }"
        :style="saveBtnStyle"
        hover-class="admin__create-btn--hover"
        @tap="create"
      >
        <text class="admin__create-text">{{ creating ? '创建中...' : '创建账号' }}</text>
      </view>
    </view>

    <ConfirmDialog
      v-model:visible="showDeleteDialog"
      title="删除用户"
      :content="deleteContent"
      confirm-text="删除"
      confirm-type="danger"
      @confirm="doRemove"
    />

    <ConfirmDialog
      v-model:visible="showToggleDialog"
      :title="toggleTitle"
      :content="toggleContent"
      :confirm-text="toggleConfirmText"
      confirm-type="danger"
      @confirm="doToggle"
    />
  </view>
</template>

<script setup>
import { computed, reactive, ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { fetchUsers, createUser, updateUser, removeUser } from '@/api/users.js'
import { ensureLogin, getToken, getUser, setAuth } from '@/utils/request.js'
import { useTheme } from '@/composables/useTheme.js'
import { THEMES } from '@/config/theme.js'

const { theme, initTheme, syncThemeFromUser } = useTheme()

const cardStyle = computed(() => ({
  borderLeftColor: theme.value.primary,
  boxShadow: `0 8rpx 28rpx ${theme.value.primary}18`,
}))

const saveBtnStyle = computed(() => ({ background: theme.value.primary }))

const softBtnStyle = computed(() => ({
  background: theme.value.primaryLight,
  color: theme.value.primaryDark,
  borderColor: theme.value.primarySoft,
}))

const users = ref([])
const loading = ref(false)
const creating = ref(false)
const currentUser = ref(getUser())
const showDeleteDialog = ref(false)
const showToggleDialog = ref(false)
const deleteTarget = ref(null)
const toggleTarget = ref(null)
const toggleNext = ref('')

const roleOptions = [
  { label: '普通成员', value: 'user' },
  { label: '管理员', value: 'admin' },
]

const themeOptions = [
  { label: '经典蓝', value: 'blue' },
  { label: '活力橙', value: 'orange' },
]

const form = reactive({ username: '', password: '', role: 'user', theme: 'blue' })

const roleLabel = computed(
  () => roleOptions.find((r) => r.value === form.role)?.label || '普通成员',
)

const themeLabel = computed(
  () => themeOptions.find((t) => t.value === form.theme)?.label || '经典蓝',
)

const deleteContent = computed(() =>
  deleteTarget.value
    ? `确定删除「${deleteTarget.value.username}」？其笔记和文件也会一并删除。`
    : '',
)

const toggleTitle = computed(() => {
  if (!toggleTarget.value) return ''
  return toggleNext.value === 'disabled' ? '禁用用户' : '启用用户'
})

const toggleContent = computed(() => {
  if (!toggleTarget.value) return ''
  const action = toggleNext.value === 'disabled' ? '禁用' : '启用'
  return `确定${action}「${toggleTarget.value.username}」？`
})

const toggleConfirmText = computed(() =>
  toggleNext.value === 'disabled' ? '禁用' : '启用',
)

const isSelf = (item) => item.id === currentUser.value?.id

const themeName = (id) => THEMES[id]?.name || '经典蓝'

const themeBadgeStyle = (id) => {
  const t = THEMES[id] || THEMES.blue
  return { background: t.primaryLight, color: t.primaryDark }
}

const avatarBg = (item) => {
  const t = THEMES[item.theme] || THEMES.blue
  return t.gradient
}

onShow(() => {
  if (!ensureLogin()) return
  initTheme()
  currentUser.value = getUser()
  if (currentUser.value?.role !== 'admin') {
    uni.showToast({ title: '仅管理员可访问', icon: 'none' })
    setTimeout(() => uni.navigateBack(), 600)
    return
  }
  loadUsers()
})

const loadUsers = async () => {
  loading.value = true
  try {
    users.value = await fetchUsers()
  } catch (e) {
    uni.showToast({ title: e.message, icon: 'none' })
  } finally {
    loading.value = false
  }
}

const onRoleChange = (e) => {
  form.role = roleOptions[e.detail.value].value
}

const onThemeChange = (e) => {
  form.theme = themeOptions[e.detail.value].value
}

const syncIfSelf = (item, patch) => {
  if (!isSelf(item)) return
  const next = { ...getUser(), ...patch }
  setAuth(getToken(), next)
  currentUser.value = next
  if (patch.theme) syncThemeFromUser(next)
}

const create = async () => {
  if (creating.value) return
  if (!form.username.trim() || !form.password) {
    uni.showToast({ title: '请填写用户名和密码', icon: 'none' })
    return
  }
  creating.value = true
  try {
    await createUser({
      username: form.username.trim(),
      password: form.password,
      role: form.role,
      theme: form.theme,
    })
    uni.showToast({ title: '创建成功', icon: 'success' })
    form.username = ''
    form.password = ''
    form.role = 'user'
    form.theme = 'blue'
    loadUsers()
  } catch (e) {
    uni.showToast({ title: e.message, icon: 'none' })
  } finally {
    creating.value = false
  }
}

const toggleStatus = (item) => {
  if (isSelf(item)) {
    uni.showToast({ title: '不能禁用当前账号', icon: 'none' })
    return
  }
  toggleTarget.value = item
  toggleNext.value = item.status === 'active' ? 'disabled' : 'active'
  showToggleDialog.value = true
}

const doToggle = async () => {
  if (!toggleTarget.value) return
  const next = toggleNext.value
  const action = next === 'disabled' ? '禁用' : '启用'
  try {
    await updateUser(toggleTarget.value.id, { status: next })
    uni.showToast({ title: `已${action}`, icon: 'success' })
    loadUsers()
  } catch (e) {
    uni.showToast({ title: e.message, icon: 'none' })
  } finally {
    toggleTarget.value = null
  }
}

const changePwd = (item) => {
  uni.showModal({
    title: `修改「${item.username}」密码`,
    editable: true,
    placeholderText: '输入新密码（至少6位）',
    success: async (res) => {
      if (!res.confirm || !res.content) return
      if (res.content.length < 6) {
        uni.showToast({ title: '密码至少6位', icon: 'none' })
        return
      }
      try {
        await updateUser(item.id, { password: res.content })
        uni.showToast({ title: '密码已修改', icon: 'success' })
      } catch (e) {
        uni.showToast({ title: e.message, icon: 'none' })
      }
    },
  })
}

const changeTheme = (item) => {
  uni.showActionSheet({
    itemList: ['经典蓝', '活力橙'],
    success: async (res) => {
      const nextTheme = res.tapIndex === 0 ? 'blue' : 'orange'
      if (nextTheme === item.theme) return
      try {
        await updateUser(item.id, { theme: nextTheme })
        syncIfSelf(item, { theme: nextTheme })
        uni.showToast({ title: '主题已更新', icon: 'success' })
        loadUsers()
      } catch (e) {
        uni.showToast({ title: e.message, icon: 'none' })
      }
    },
  })
}

const remove = (item) => {
  if (isSelf(item)) {
    uni.showToast({ title: '不能删除当前账号', icon: 'none' })
    return
  }
  deleteTarget.value = item
  showDeleteDialog.value = true
}

const doRemove = async () => {
  if (!deleteTarget.value) return
  try {
    await removeUser(deleteTarget.value.id)
    uni.showToast({ title: '已删除', icon: 'success' })
    loadUsers()
  } catch (e) {
    uni.showToast({ title: e.message, icon: 'none' })
  } finally {
    deleteTarget.value = null
  }
}
</script>

<style lang="scss" scoped>
.admin-page {
  min-height: 100vh;
  padding-bottom: calc(120rpx + env(safe-area-inset-bottom));
  box-sizing: border-box;
}

.admin {
  &__card {
    padding: 28rpx;
    margin-bottom: 8rpx;
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

  &__field {
    margin-bottom: 8rpx;
  }

  &__picker {
    height: 88rpx;
    padding: 0 24rpx;
    background: var(--c-input-bg);
    border-radius: 16rpx;
    font-size: 30rpx;
    border: 1rpx solid var(--c-border);
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 8rpx;
    color: var(--c-text);
  }

  &__picker-arrow {
    font-size: 36rpx;
    color: var(--c-text-muted);
  }

  &__list-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin: 24rpx 0 16rpx;
  }

  &__list-title {
    font-size: 28rpx;
    font-weight: 600;
    color: var(--c-text-secondary);
  }

  &__count {
    font-size: 24rpx;
    color: var(--c-text-muted);
  }

  &__loading {
    text-align: center;
    color: var(--c-text-muted);
    padding: 40rpx;
  }

  &__item {
    margin-bottom: 20rpx;
    padding: 24rpx;
    background: #ffffff;
    border-radius: 20rpx;
    border: 1rpx solid var(--c-border);
    border-left-width: 8rpx;
    border-left-style: solid;
    box-sizing: border-box;
  }

  &__user {
    display: flex;
    align-items: center;
    gap: 20rpx;
    margin-bottom: 20rpx;
  }

  &__avatar {
    width: 80rpx;
    height: 80rpx;
    border-radius: 50%;
    color: #fff;
    font-size: 34rpx;
    font-weight: 700;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  &__info {
    flex: 1;
    min-width: 0;
  }

  &__name {
    display: block;
    font-size: 32rpx;
    font-weight: 700;
    color: var(--c-text);
    margin-bottom: 10rpx;
  }

  &__tags {
    display: flex;
    gap: 10rpx;
    flex-wrap: wrap;
  }

  &__badge {
    font-size: 22rpx;
    padding: 6rpx 16rpx;
    border-radius: 999rpx;
    background: var(--c-primary-light);
    color: var(--c-primary);

    &--off {
      background: var(--c-danger-bg);
      color: var(--c-danger);
    }

    &--theme {
      font-weight: 600;
    }
  }

  &__actions {
    display: flex;
    flex-wrap: wrap;
    gap: 12rpx;
  }

  &__action {
    flex: 1;
    min-width: 140rpx;
    height: 72rpx;
    border-radius: 14rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 28rpx;
    font-weight: 600;
    box-sizing: border-box;

    &--soft {
      border: 2rpx solid;
    }

    &--warn {
      background: #fff7ed;
      border: 2rpx solid #fdba74;
      color: #ea580c;
    }

    &--danger {
      background: #fef2f2;
      border: 2rpx solid #fca5a5;
      color: #dc2626;
    }

    &--disabled {
      opacity: 0.45;
    }

    &--hover {
      opacity: 0.88;
    }
  }

  &__hint {
    display: block;
    margin-top: 16rpx;
    font-size: 22rpx;
    color: var(--c-text-muted);
    text-align: center;
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

  &__create-btn {
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

  &__create-text {
    font-size: 32rpx;
    font-weight: 600;
    color: #ffffff;
  }
}
</style>

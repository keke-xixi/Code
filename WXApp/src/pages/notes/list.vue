<template>
  <PageShell>
    <view class="notes__search card">
      <text class="notes__search-icon">🔍</text>
      <input
        v-model="keyword"
        class="notes__search-input"
        placeholder="搜索标题或内容"
        placeholder-class="ph"
        confirm-type="search"
        @confirm="loadNotes"
      />
      <view v-if="keyword" class="notes__search-clear" @tap="clearSearch">×</view>
      <view
        class="notes__create-btn"
        :style="createBtnStyle"
        hover-class="notes__create-btn--hover"
        @tap="createNew"
      >
        <text class="notes__create-btn-icon">＋</text>
      </view>
    </view>

    <view v-if="loading" class="notes__loading">加载中...</view>
    <EmptyState
      v-else-if="!notes.length"
      icon="📝"
      :title="keyword ? '未找到相关笔记' : '还没有笔记'"
      :desc="keyword ? '换个关键词试试' : '点击右侧 + 开始记录'"
      :action-text="keyword ? '' : '新建笔记'"
      @action="createNew"
    />

    <view
      v-for="item in notes"
      :key="item.id"
      class="notes__item"
      :style="itemStyle"
      hover-class="notes__item--hover"
      @tap="editNote(item.id)"
    >
      <view class="notes__body">
        <view class="notes__top">
          <text class="notes__title">{{ item.title || '无标题' }}</text>
          <view v-if="item.tagList?.length" class="notes__tags">
            <text
              v-for="tag in item.tagList.slice(0, 2)"
              :key="tag"
              class="notes__tag"
            >{{ tag }}</text>
            <text v-if="item.tagList.length > 2" class="notes__tag notes__tag--more">
              +{{ item.tagList.length - 2 }}
            </text>
          </view>
        </view>
        <text class="notes__preview">{{ preview(item.content) }}</text>
        <view class="notes__foot">
          <text class="notes__time">{{ formatTime(item.updated_at) }}</text>
          <text class="notes__arrow">›</text>
        </view>
      </view>
    </view>
  </PageShell>
</template>

<script setup>
import { ref, computed } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { fetchNotes } from '@/api/notes.js'
import { ensureLogin } from '@/utils/request.js'
import { useTheme } from '@/composables/useTheme.js'

const { theme } = useTheme()
const createBtnStyle = computed(() => ({
  background: theme.value.primary,
}))

const itemStyle = computed(() => ({
  borderLeftColor: theme.value.primary,
  boxShadow: `0 8rpx 28rpx ${theme.value.primary}18`,
}))

const notes = ref([])
const keyword = ref('')
const loading = ref(false)

const loadNotes = async () => {
  loading.value = true
  try {
    notes.value = await fetchNotes({ keyword: keyword.value.trim() })
  } catch (e) {
    uni.showToast({ title: e.message, icon: 'none' })
  } finally {
    loading.value = false
  }
}

onShow(() => {
  if (!ensureLogin()) return
  loadNotes()
})

const clearSearch = () => {
  keyword.value = ''
  loadNotes()
}

const createNew = () => uni.navigateTo({ url: '/pages/notes/edit' })
const editNote = (id) => uni.navigateTo({ url: `/pages/notes/edit?id=${id}` })

const preview = (text) => {
  const s = String(text || '').replace(/\s+/g, ' ').trim()
  return s.length > 72 ? `${s.slice(0, 72)}...` : s || '暂无内容'
}

const formatTime = (t) => (t ? String(t).replace('T', ' ').slice(0, 16) : '')
</script>

<style lang="scss" scoped>
.notes {
  &__search {
    display: flex;
    align-items: center;
    gap: 12rpx;
    padding: 12rpx 16rpx 12rpx 24rpx;
    margin-bottom: 24rpx;
  }

  &__search-icon {
    font-size: 28rpx;
    flex-shrink: 0;
  }

  &__search-input {
    flex: 1;
    min-width: 0;
    font-size: 28rpx;
    height: 56rpx;
    color: var(--c-text);
  }

  &__search-clear {
    width: 40rpx;
    height: 40rpx;
    border-radius: 50%;
    background: var(--c-primary-light);
    color: var(--c-text-muted);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 28rpx;
    flex-shrink: 0;
  }

  &__create-btn {
    flex-shrink: 0;
    width: 56rpx;
    height: 56rpx;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;

    &--hover {
      opacity: 0.88;
    }
  }

  &__create-btn-icon {
    font-size: 36rpx;
    font-weight: 500;
    color: #ffffff;
    line-height: 1;
    margin-top: -2rpx;
  }

  &__loading {
    text-align: center;
    color: var(--c-text-muted);
    padding: 60rpx;
  }

  &__item {
    margin-bottom: 20rpx;
    padding: 24rpx 24rpx 20rpx 20rpx;
    background: #ffffff;
    border-radius: 20rpx;
    border: 1rpx solid var(--c-border);
    border-left-width: 8rpx;
    border-left-style: solid;
    box-sizing: border-box;

    &--hover {
      opacity: 0.96;
      transform: scale(0.995);
    }
  }

  &__body {
    min-width: 0;
  }

  &__top {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 16rpx;
    margin-bottom: 12rpx;
  }

  &__title {
    flex: 1;
    min-width: 0;
    font-size: 30rpx;
    font-weight: 700;
    color: var(--c-text);
    line-height: 1.4;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__tags {
    flex-shrink: 0;
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 6rpx;
    max-width: 140rpx;
  }

  &__tag {
    font-size: 20rpx;
    padding: 4rpx 12rpx;
    border-radius: 999rpx;
    background: var(--c-primary-light);
    color: var(--c-primary);
    max-width: 140rpx;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    box-sizing: border-box;

    &--more {
      background: var(--c-input-bg);
      color: var(--c-text-muted);
    }
  }

  &__preview {
    display: block;
    font-size: 26rpx;
    color: var(--c-text-secondary);
    line-height: 1.55;
    margin-bottom: 16rpx;
    overflow: hidden;
    text-overflow: ellipsis;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
  }

  &__foot {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  &__time {
    font-size: 22rpx;
    color: var(--c-text-muted);
  }

  &__arrow {
    font-size: 32rpx;
    color: var(--c-text-muted);
    line-height: 1;
    font-weight: 300;
  }
}
</style>

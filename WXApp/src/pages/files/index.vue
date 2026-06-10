<template>
  <PageShell>
    <view class="files__toolbar card">
      <scroll-view scroll-x class="files__tabs" :show-scrollbar="false">
        <view
          v-for="tab in tabs"
          :key="tab.value"
          class="files__tab"
          :class="{ 'files__tab--active': category === tab.value }"
          :style="category === tab.value ? tabActiveStyle : null"
          @tap="switchTab(tab.value)"
        >
          <text class="files__tab-text" :style="category === tab.value ? { color: '#fff' } : null">
            {{ tab.label }}
          </text>
        </view>
      </scroll-view>
      <view
        class="files__upload-btn"
        :style="uploadBtnStyle"
        hover-class="files__upload-btn--hover"
        @tap="pickAndUpload"
      >
        <text class="files__upload-icon">＋</text>
      </view>
    </view>

    <view v-if="loading" class="files__loading">
      <text>加载中...</text>
    </view>

    <template v-else>
      <EmptyState
        v-if="!files.length"
        icon="📁"
        title="暂无文件"
        desc="支持图片、视频、PDF/Word/TXT 文档、安装包"
        action-text="上传文件"
        @action="pickAndUpload"
      />

      <view
        v-for="item in files"
        :key="item.id"
        class="files__item"
        :style="itemStyle"
      >
        <view class="files__row">
          <view
            v-if="item.category === 'image' || (item.category === 'video' && shouldLoadThumb(item))"
            class="files__thumb-wrap"
            :class="{ 'files__thumb-wrap--video': item.category === 'video' }"
            @tap="item.category === 'image' ? previewImage(item) : previewVideo(item)"
          >
            <image
              v-if="item.category === 'image' && thumbMap[item.id]"
              class="files__thumb"
              :src="thumbMap[item.id]"
              mode="aspectFill"
            />
            <video
              v-else-if="item.category === 'video' && thumbMap[item.id]"
              class="files__thumb"
              :src="thumbMap[item.id]"
              :show-center-play-btn="false"
              :controls="false"
              :show-play-btn="false"
              :enable-progress-gesture="false"
              :show-fullscreen-btn="false"
              object-fit="cover"
              muted
            />
            <view v-else class="files__thumb-loading">
              <text v-if="item.category === 'image'" class="files__thumb-loading-icon">🖼</text>
              <text v-else class="files__thumb-loading-icon">🎬</text>
            </view>
            <view v-if="item.category === 'video'" class="files__thumb-play">
              <text class="files__thumb-play-icon">▶</text>
            </view>
          </view>
          <view
            v-else-if="item.category === 'video'"
            class="files__icon-wrap files__icon-wrap--video"
            @tap="previewVideo(item)"
          >
            <text class="files__icon">🎬</text>
            <text class="files__icon-ext">{{ fileExt(item.original_name) || 'MP4' }}</text>
            <view class="files__icon-play"><text>▶</text></view>
          </view>
          <view
            v-else
            class="files__icon-wrap"
            :style="iconWrapStyleFor(item)"
          >
            <text class="files__icon">{{ categoryIcon(item.category, item.original_name) }}</text>
            <text class="files__icon-ext">{{ categoryTheme(item.category, item.original_name).label }}</text>
          </view>

          <view class="files__meta">
            <text class="files__name">{{ item.original_name }}</text>
            <view class="files__tags">
              <text class="files__tag" :style="tagStyle">{{ categoryLabel(item.category) }}</text>
              <text v-if="fileExt(item.original_name)" class="files__tag files__tag--muted">
                {{ fileExt(item.original_name) }}
              </text>
            </view>
            <text class="files__size">
              {{ formatFileSize(item.size) }} · {{ formatFileTime(item.created_at) }}
            </text>
          </view>
        </view>

        <view class="files__actions">
          <view
            v-if="item.category === 'image'"
            class="files__action files__action--primary"
            :style="primaryBtnStyle"
            hover-class="files__action--hover"
            @tap="previewImage(item)"
          >
            <text class="files__action-text files__action-text--primary">预览</text>
          </view>
          <view
            v-if="item.category === 'video'"
            class="files__action files__action--primary"
            :style="primaryBtnStyle"
            hover-class="files__action--hover"
            @tap="previewVideo(item)"
          >
            <text class="files__action-text files__action-text--primary">播放</text>
          </view>
          <view
            v-if="item.category === 'document' || item.category === 'apk' || item.category === 'other'"
            class="files__action files__action--primary"
            :style="primaryBtnStyle"
            hover-class="files__action--hover"
            @tap="openFile(item)"
          >
            <text class="files__action-text files__action-text--primary">打开</text>
          </view>
          <view
            class="files__action files__action--danger"
            hover-class="files__action--hover"
            @tap="remove(item)"
          >
            <text class="files__action-text files__action-text--danger">删除</text>
          </view>
        </view>
      </view>
    </template>

    <ConfirmDialog
      v-model:visible="showDeleteDialog"
      title="删除文件"
      :content="deleteContent"
      confirm-text="删除"
      confirm-type="danger"
      @confirm="doRemove"
    />
  </PageShell>
</template>

<script setup>
import { ref, computed } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { fetchFiles, uploadUserFile, deleteFile } from '@/api/files.js'
import { ensureLogin, downloadAuthFile } from '@/utils/request.js'
import { useTheme } from '@/composables/useTheme.js'
import {
  fileExt,
  categoryLabel,
  categoryIcon,
  categoryTheme,
  formatFileSize,
  formatFileTime,
} from '@/utils/file.js'

const { theme, initTheme } = useTheme()

const uploadBtnStyle = computed(() => ({ background: theme.value.primary }))
const tabActiveStyle = computed(() => ({ background: theme.value.primary }))
const itemStyle = computed(() => ({
  borderLeftColor: theme.value.primary,
  boxShadow: `0 8rpx 28rpx ${theme.value.primary}18`,
}))
const tagStyle = computed(() => ({
  background: theme.value.primaryLight,
  color: theme.value.primaryDark,
}))
const primaryBtnStyle = computed(() => ({ background: theme.value.primary }))

const iconWrapStyleFor = (item) => {
  const t = categoryTheme(item.category, item.original_name)
  return { background: t.bg, borderColor: `${t.accent}33` }
}

const tabs = [
  { label: '全部', value: '' },
  { label: '图片', value: 'image' },
  { label: '视频', value: 'video' },
  { label: '文档', value: 'document' },
  { label: '安装包', value: 'apk' },
]

const category = ref('')
const files = ref([])
const loading = ref(false)
const thumbMap = ref({})
const showDeleteDialog = ref(false)
const deleteTarget = ref(null)

const THUMB_VIDEO_MAX = 30 * 1024 * 1024

const deleteContent = computed(() =>
  deleteTarget.value ? `确定删除「${deleteTarget.value.original_name}」？` : '',
)

const shouldLoadThumb = (item) => {
  if (item.category === 'image') return true
  if (item.category === 'video') return item.size <= THUMB_VIDEO_MAX
  return false
}

const loadThumb = async (item) => {
  if (!shouldLoadThumb(item) || thumbMap.value[item.id]) return
  try {
    const path = await downloadAuthFile(`/files/${item.id}/download`)
    thumbMap.value = { ...thumbMap.value, [item.id]: path }
  } catch {
    /* 缩略图失败时保留占位 */
  }
}

const loadThumbs = async (list) => {
  const targets = list.filter(shouldLoadThumb)
  const batch = 3
  for (let i = 0; i < targets.length; i += batch) {
    await Promise.allSettled(targets.slice(i, i + batch).map(loadThumb))
  }
}

const loadFiles = async () => {
  loading.value = true
  thumbMap.value = {}
  try {
    const params = category.value ? { category: category.value } : {}
    files.value = await fetchFiles(params)
    loadThumbs(files.value)
  } catch (e) {
    uni.showToast({ title: e.message, icon: 'none' })
  } finally {
    loading.value = false
  }
}

onShow(() => {
  if (!ensureLogin()) return
  initTheme()
  loadFiles()
})

const switchTab = (val) => {
  category.value = val
  loadFiles()
}

const pickAndUpload = () => {
  uni.showActionSheet({
    itemList: [
      '上传图片（相册）',
      '上传图片（拍摄）',
      '上传视频',
      '上传文档（PDF/Word/TXT）',
      '上传安装包',
    ],
    success(res) {
      const idx = res.tapIndex
      if (idx === 0) chooseMedia(['image'], ['album'])
      else if (idx === 1) chooseMedia(['image'], ['camera'])
      else if (idx === 2) chooseMedia(['video'], ['album'])
      else if (idx === 3) chooseMessageFile('file')
      else chooseMessageFile('apk')
    },
  })
}

const chooseMedia = (mediaType, sourceType) => {
  uni.chooseMedia({
    count: 1,
    mediaType,
    sourceType,
    success: async (res) => {
      const file = res.tempFiles[0]
      if (file?.tempFilePath) {
        await doUpload(file.tempFilePath, file.name || guessMediaName(file, mediaType))
      }
    },
  })
}

const guessMediaName = (file, mediaType) => {
  if (file?.name) return file.name
  const ext = mediaType.includes('video') ? 'mp4' : 'jpg'
  return `media_${Date.now()}.${ext}`
}

const chooseMessageFile = (kind) => {
  uni.chooseMessageFile({
    count: 1,
    type: 'file',
    extension: kind === 'apk' ? ['apk', 'ipa', 'xapk'] : undefined,
    success: async (res) => {
      const file = res.tempFiles[0]
      if (file?.path) {
        await doUpload(file.path, file.name || '未命名文件')
      }
    },
    fail() {
      uni.showToast({ title: '请从聊天记录或文件管理器选择', icon: 'none' })
    },
  })
}

const doUpload = async (filePath, originalName = '') => {
  uni.showLoading({ title: '上传中' })
  try {
    await uploadUserFile(filePath, originalName)
    uni.showToast({ title: '上传成功', icon: 'success' })
    loadFiles()
  } catch (e) {
    uni.showToast({ title: e.message, icon: 'none' })
  } finally {
    uni.hideLoading()
  }
}

const previewImage = async (item) => {
  uni.showLoading({ title: '加载中' })
  try {
    const path = await downloadAuthFile(`/files/${item.id}/download`)
    uni.previewImage({ urls: [path] })
  } catch (e) {
    uni.showToast({ title: e.message, icon: 'none' })
  } finally {
    uni.hideLoading()
  }
}

const previewVideo = async (item) => {
  uni.showLoading({ title: '加载中' })
  try {
    const path = await downloadAuthFile(`/files/${item.id}/download`)
    uni.previewMedia({ sources: [{ url: path, type: 'video' }] })
  } catch (e) {
    uni.showToast({ title: e.message, icon: 'none' })
  } finally {
    uni.hideLoading()
  }
}

const openFile = async (item) => {
  uni.showLoading({ title: '打开中' })
  try {
    const path = await downloadAuthFile(`/files/${item.id}/download`)
    await new Promise((resolve, reject) => {
      uni.openDocument({
        filePath: path,
        showMenu: true,
        success: resolve,
        fail: reject,
      })
    })
  } catch (e) {
    uni.showToast({ title: e.errMsg || e.message || '无法打开此文件', icon: 'none' })
  } finally {
    uni.hideLoading()
  }
}

const remove = (item) => {
  deleteTarget.value = item
  showDeleteDialog.value = true
}

const doRemove = async () => {
  if (!deleteTarget.value) return
  try {
    await deleteFile(deleteTarget.value.id)
    uni.showToast({ title: '已删除', icon: 'success' })
    loadFiles()
  } catch (e) {
    uni.showToast({ title: e.message, icon: 'none' })
  } finally {
    deleteTarget.value = null
  }
}
</script>

<style lang="scss" scoped>
.files {
  &__toolbar {
    display: flex;
    align-items: center;
    gap: 12rpx;
    padding: 12rpx 16rpx 12rpx 20rpx;
    margin-bottom: 24rpx;
  }

  &__tabs {
    flex: 1;
    min-width: 0;
    white-space: nowrap;
  }

  &__tab {
    display: inline-block;
    padding: 14rpx 24rpx;
    margin-right: 12rpx;
    background: #f8fafc;
    border-radius: 999rpx;
    border: 1rpx solid #e2e8f0;

    &--active {
      border-color: transparent;
    }
  }

  &__tab-text {
    font-size: 26rpx;
    color: #64748b;
  }

  &__upload-btn {
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

  &__upload-icon {
    font-size: 36rpx;
    font-weight: 500;
    color: #ffffff;
    line-height: 1;
    margin-top: -2rpx;
  }

  &__loading {
    text-align: center;
    color: #94a3b8;
    padding: 80rpx 0;
    font-size: 28rpx;
  }

  &__item {
    margin-bottom: 20rpx;
    padding: 24rpx;
    background: #ffffff;
    border-radius: 20rpx;
    border: 1rpx solid #e2e8f0;
    border-left-width: 8rpx;
    border-left-style: solid;
    box-sizing: border-box;
  }

  &__row {
    display: flex;
    gap: 20rpx;
    align-items: flex-start;
    margin-bottom: 20rpx;
  }

  &__thumb-wrap {
    width: 120rpx;
    height: 120rpx;
    border-radius: 16rpx;
    overflow: hidden;
    flex-shrink: 0;
    background: #f1f5f9;
    position: relative;

    &--video {
      background: #1e1b4b;
    }
  }

  &__thumb {
    width: 120rpx;
    height: 120rpx;
    display: block;
  }

  &__thumb-loading {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
  }

  &__thumb-loading-icon {
    font-size: 40rpx;
    opacity: 0.45;
  }

  &__thumb-play {
    position: absolute;
    right: 8rpx;
    bottom: 8rpx;
    width: 36rpx;
    height: 36rpx;
    border-radius: 50%;
    background: rgba(15, 23, 42, 0.72);
    display: flex;
    align-items: center;
    justify-content: center;
  }

  &__thumb-play-icon {
    font-size: 18rpx;
    color: #fff;
    margin-left: 2rpx;
  }

  &__icon-wrap {
    width: 120rpx;
    height: 120rpx;
    border-radius: 16rpx;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    border: 2rpx solid transparent;
    gap: 6rpx;
  }

  &__icon {
    font-size: 44rpx;
    line-height: 1;
  }

  &__icon-ext {
    font-size: 20rpx;
    font-weight: 700;
    color: #64748b;
    letter-spacing: 0.5rpx;
  }

  &__icon-wrap--video {
    background: linear-gradient(145deg, #312e81 0%, #1e1b4b 100%);
    border-color: #6366f133;
    position: relative;

    .files__icon-ext {
      color: #c7d2fe;
    }
  }

  &__icon-play {
    position: absolute;
    right: 8rpx;
    bottom: 8rpx;
    width: 32rpx;
    height: 32rpx;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.9);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 16rpx;
    color: #312e81;
  }

  &__meta {
    flex: 1;
    min-width: 0;
    padding-top: 4rpx;
  }

  &__name {
    display: block;
    font-size: 30rpx;
    font-weight: 700;
    color: #0f172a;
    line-height: 1.45;
    word-break: break-all;
    margin-bottom: 10rpx;
  }

  &__tags {
    display: flex;
    flex-wrap: wrap;
    gap: 8rpx;
    margin-bottom: 10rpx;
  }

  &__tag {
    font-size: 22rpx;
    padding: 4rpx 14rpx;
    border-radius: 999rpx;
    font-weight: 600;

    &--muted {
      background: #f1f5f9;
      color: #64748b;
    }
  }

  &__size {
    display: block;
    font-size: 24rpx;
    color: #94a3b8;
    line-height: 1.4;
  }

  &__actions {
    display: flex;
    gap: 12rpx;
  }

  &__action {
    flex: 1;
    height: 72rpx;
    border-radius: 14rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    box-sizing: border-box;

    &--danger {
      background: #fef2f2;
      border: 2rpx solid #fca5a5;
    }

    &--hover {
      opacity: 0.88;
    }
  }

  &__action-text {
    font-size: 28rpx;
    font-weight: 600;

    &--primary {
      color: #ffffff;
    }

    &--danger {
      color: #dc2626;
    }
  }
}
</style>


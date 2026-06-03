<template>
  <view class="edit-page">
    <PageShell>
      <view class="card edit__form">
        <text class="field-label">标题</text>
        <input
          v-model="form.title"
          class="field-input edit__title"
          placeholder="给笔记起个标题"
          placeholder-class="ph"
          maxlength="120"
        />
        <text class="field-label">内容</text>
        <textarea
          v-model="form.content"
          class="field-textarea edit__content"
          placeholder="记录知识、想法、备忘..."
          placeholder-class="ph"
          maxlength="20000"
        />
        <text class="field-label">标签</text>
        <input
          v-model="form.tags"
          class="field-input"
          placeholder="逗号分隔，如：前端,面试"
          placeholder-class="ph"
        />
      </view>
    </PageShell>

    <view class="edit__footer">
      <view
        v-if="noteId"
        class="edit__delete-btn"
        hover-class="edit__delete-btn--hover"
        @tap="remove"
      >
        <text class="edit__delete-text">删除</text>
      </view>
      <view
        class="edit__save"
        :class="{ 'edit__save--disabled': saving }"
        :style="saveBtnStyle"
        hover-class="edit__save--hover"
        @tap="save"
      >
        <text class="edit__save-text">{{ saving ? '保存中...' : '保存' }}</text>
      </view>
    </view>

    <ConfirmDialog
      v-model:visible="showDeleteDialog"
      title="删除笔记"
      content="删除后无法恢复，确定吗？"
      confirm-text="删除"
      confirm-type="danger"
      @confirm="doRemove"
    />
  </view>
</template>

<script setup>
import { reactive, ref, computed } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { fetchNote, createNote, updateNote, deleteNote } from '@/api/notes.js'
import { ensureLogin } from '@/utils/request.js'
import { useTheme } from '@/composables/useTheme.js'

const { theme } = useTheme()
const saveBtnStyle = computed(() => ({
  background: theme.value.primary,
}))

const noteId = ref(null)
const saving = ref(false)
const showDeleteDialog = ref(false)
const form = reactive({ title: '', content: '', tags: '' })

onLoad(async (query) => {
  if (!ensureLogin()) return
  if (query?.id) {
    noteId.value = Number(query.id)
    uni.setNavigationBarTitle({ title: '编辑笔记' })
    try {
      const note = await fetchNote(noteId.value)
      form.title = note.title
      form.content = note.content
      form.tags = note.tagList?.join(',') || note.tags || ''
    } catch (e) {
      uni.showToast({ title: e.message, icon: 'none' })
    }
  } else {
    uni.setNavigationBarTitle({ title: '新建笔记' })
  }
})

const save = async () => {
  if (saving.value) return
  if (!form.title.trim() && !form.content.trim()) {
    uni.showToast({ title: '标题和内容不能都为空', icon: 'none' })
    return
  }
  saving.value = true
  try {
    const payload = {
      title: form.title.trim(),
      content: form.content,
      tags: form.tags,
    }
    if (noteId.value) {
      await updateNote(noteId.value, payload)
    } else {
      await createNote(payload)
    }
    uni.showToast({ title: '已保存', icon: 'success' })
    setTimeout(() => uni.navigateBack(), 400)
  } catch (e) {
    uni.showToast({ title: e.message, icon: 'none' })
  } finally {
    saving.value = false
  }
}

const remove = () => {
  showDeleteDialog.value = true
}

const doRemove = async () => {
  try {
    await deleteNote(noteId.value)
    uni.showToast({ title: '已删除', icon: 'success' })
    setTimeout(() => uni.navigateBack(), 400)
  } catch (e) {
    uni.showToast({ title: e.message, icon: 'none' })
  }
}
</script>

<style lang="scss" scoped>
.edit-page {
  min-height: 100vh;
  padding-bottom: calc(200rpx + env(safe-area-inset-bottom));
  box-sizing: border-box;
}

.edit {
  &__form {
    display: flex;
    flex-direction: column;
    gap: 8rpx;
  }

  &__title {
    margin-bottom: 8rpx;
    font-weight: 600;
  }

  &__content {
    min-height: 400rpx;
    margin-bottom: 8rpx;
    line-height: 1.7;
  }

  &__footer {
    position: fixed;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 100;
    display: flex;
    flex-direction: column;
    gap: 12rpx;
    padding: 16rpx 24rpx;
    padding-bottom: calc(16rpx + env(safe-area-inset-bottom));
    background: #ffffff;
    border-top: 1rpx solid #eef0f4;
    box-sizing: border-box;
  }

  &__delete-btn {
    height: 88rpx;
    border-radius: 16rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #fef2f2;
    border: 2rpx solid #fca5a5;
    box-sizing: border-box;

    &--hover {
      opacity: 0.88;
    }
  }

  &__delete-text {
    font-size: 32rpx;
    font-weight: 600;
    color: #dc2626;
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

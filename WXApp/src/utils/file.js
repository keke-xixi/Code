import { API_BASE } from '@/config/index.js'
import { getToken } from '@/utils/request.js'

export function fileDownloadUrl(fileId) {
  const token = encodeURIComponent(getToken() || '')
  return `${API_BASE}/files/${fileId}/download?token=${token}`
}

export function fileExt(name = '') {
  const i = String(name).lastIndexOf('.')
  return i >= 0 ? String(name).slice(i + 1).toUpperCase() : ''
}

export function categoryLabel(cat) {
  const map = {
    image: '图片',
    video: '视频',
    document: '文档',
    apk: '安装包',
    other: '其它',
  }
  return map[cat] || '文件'
}

export function categoryIcon(cat, name = '') {
  if (cat === 'image') return '🖼'
  if (cat === 'video') return '🎬'
  if (cat === 'apk') return '📦'
  if (cat === 'document') {
    const ext = fileExt(name).toLowerCase()
    if (ext === 'pdf') return '📕'
    if (['doc', 'docx'].includes(ext)) return '📘'
    if (['xls', 'xlsx'].includes(ext)) return '📗'
    if (['ppt', 'pptx'].includes(ext)) return '📙'
    if (ext === 'txt') return '📝'
    return '📄'
  }
  return '📎'
}

/** 非图片/视频列表项的视觉主题 */
export function categoryTheme(cat, name = '') {
  const ext = fileExt(name).toLowerCase()
  if (cat === 'video') {
    return { bg: '#ede9fe', accent: '#7c3aed', label: 'MP4' }
  }
  if (cat === 'apk') {
    return { bg: '#dcfce7', accent: '#16a34a', label: ext || 'APK' }
  }
  if (cat === 'document') {
    if (ext === 'pdf') return { bg: '#fee2e2', accent: '#dc2626', label: 'PDF' }
    if (['doc', 'docx'].includes(ext)) return { bg: '#dbeafe', accent: '#2563eb', label: ext || 'DOC' }
    if (['xls', 'xlsx'].includes(ext)) return { bg: '#d1fae5', accent: '#059669', label: ext || 'XLS' }
    if (['ppt', 'pptx'].includes(ext)) return { bg: '#ffedd5', accent: '#ea580c', label: ext || 'PPT' }
    return { bg: '#f1f5f9', accent: '#475569', label: ext || 'DOC' }
  }
  return { bg: '#f1f5f9', accent: '#64748b', label: ext || 'FILE' }
}

export function formatFileSize(bytes) {
  const n = Number(bytes) || 0
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`
  return `${(n / 1024 / 1024).toFixed(1)} MB`
}

export function formatFileTime(t) {
  if (!t) return ''
  return String(t).replace('T', ' ').slice(0, 16)
}

import { BASE_URL } from '@/config/index.js'
import { getToken } from '@/utils/request.js'

export function fileDownloadUrl(fileId) {
  const token = encodeURIComponent(getToken() || '')
  return `${BASE_URL}/api/files/${fileId}/download?token=${token}`
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

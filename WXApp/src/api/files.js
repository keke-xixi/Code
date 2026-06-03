import request, { uploadFile } from '@/utils/request.js'

export const fetchFiles = (params = {}) =>
  request({ url: '/api/files', data: params })

export const uploadUserFile = (filePath, originalName = '') =>
  uploadFile(filePath, originalName ? { originalName } : {})

export const deleteFile = (id) =>
  request({ url: `/api/files/${id}`, method: 'DELETE' })

export const fetchStorageSummary = () =>
  request({ url: '/api/files/stats/summary' })

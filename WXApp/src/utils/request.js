import { BASE_URL, STORAGE_KEYS } from '@/config/index.js'

export function getToken() {
  return uni.getStorageSync(STORAGE_KEYS.TOKEN) || ''
}

export function getUser() {
  const raw = uni.getStorageSync(STORAGE_KEYS.USER)
  return raw || null
}

export function setAuth(token, user) {
  uni.setStorageSync(STORAGE_KEYS.TOKEN, token)
  uni.setStorageSync(STORAGE_KEYS.USER, user)
}

export function clearAuth() {
  uni.removeStorageSync(STORAGE_KEYS.TOKEN)
  uni.removeStorageSync(STORAGE_KEYS.USER)
}

export function isAdmin() {
  return getUser()?.role === 'admin'
}

export function gotoLogin() {
  uni.reLaunch({ url: '/pages/login/index' })
}

export function ensureLogin() {
  if (!getToken()) {
    gotoLogin()
    return false
  }
  return true
}

function request(options) {
  const { url, method = 'GET', data, header = {} } = options

  return new Promise((resolve, reject) => {
    uni.request({
      url: BASE_URL + url,
      method,
      data,
      header: {
        'Content-Type': 'application/json',
        Authorization: getToken() ? `Bearer ${getToken()}` : '',
        ...header,
      },
      success(res) {
        const body = res.data
        if (res.statusCode === 401) {
          clearAuth()
          gotoLogin()
          reject(new Error(body?.message || '请先登录'))
          return
        }
        if (body?.code !== 200) {
          reject(new Error(body?.message || '请求失败'))
          return
        }
        resolve(body.result)
      },
      fail(err) {
        reject(new Error(err.errMsg || '网络错误'))
      },
    })
  })
}

export function uploadFile(filePath, formData = {}) {
  return new Promise((resolve, reject) => {
    uni.uploadFile({
      url: `${BASE_URL}/api/files/upload`,
      filePath,
      name: 'file',
      formData,
      header: {
        Authorization: getToken() ? `Bearer ${getToken()}` : '',
      },
      success(res) {
        try {
          const body = JSON.parse(res.data)
          if (body.code !== 200) {
            reject(new Error(body.message || '上传失败'))
            return
          }
          resolve(body.result)
        } catch {
          reject(new Error('上传响应异常'))
        }
      },
      fail(err) {
        reject(new Error(err.errMsg || '上传失败'))
      },
    })
  })
}

/** 带鉴权下载到本地临时路径（用于图片预览等） */
export function downloadAuthFile(url) {
  return new Promise((resolve, reject) => {
    uni.downloadFile({
      url: BASE_URL + url,
      header: {
        Authorization: getToken() ? `Bearer ${getToken()}` : '',
      },
      success(res) {
        if (res.statusCode === 200) {
          resolve(res.tempFilePath)
          return
        }
        reject(new Error('下载失败'))
      },
      fail(err) {
        reject(new Error(err.errMsg || '下载失败'))
      },
    })
  })
}

export default request

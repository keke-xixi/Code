import { API_BASE, STORAGE_KEYS } from '@/config/index.js'

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

function buildUrl(path) {
  const p = path.startsWith('/') ? path : `/${path}`
  return `${API_BASE}${p}`
}

function parseBody(data) {
  if (typeof data === 'string') {
    const text = data.trim()
    if (text.startsWith('<!') || text.startsWith('<html')) {
      throw new Error('接口返回了网页而非 JSON，请检查 API 地址是否指向 /wx-api/api')
    }
    try {
      return JSON.parse(text)
    } catch {
      throw new Error('接口响应格式异常')
    }
  }
  return data
}

function request(options) {
  const { url, method = 'GET', data, header = {} } = options

  return new Promise((resolve, reject) => {
    uni.request({
      url: buildUrl(url),
      method,
      data,
      header: {
        'Content-Type': 'application/json',
        Authorization: getToken() ? `Bearer ${getToken()}` : '',
        ...header,
      },
      success(res) {
        try {
          const body = parseBody(res.data)
          if (res.statusCode === 401) {
            clearAuth()
            gotoLogin()
            reject(new Error(body?.message || '请先登录'))
            return
          }
          if (body?.code !== 200) {
            reject(new Error(body?.message || `请求失败(${res.statusCode})`))
            return
          }
          resolve(body.result)
        } catch (e) {
          reject(e)
        }
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
      url: buildUrl('/files/upload'),
      filePath,
      name: 'file',
      formData,
      header: {
        Authorization: getToken() ? `Bearer ${getToken()}` : '',
      },
      success(res) {
        try {
          const body = parseBody(res.data)
          if (body.code !== 200) {
            reject(new Error(body.message || '上传失败'))
            return
          }
          resolve(body.result)
        } catch (e) {
          reject(e)
        }
      },
      fail(err) {
        reject(new Error(err.errMsg || '上传失败'))
      },
    })
  })
}

/** 带鉴权下载到本地临时路径（用于图片预览等） */
export function downloadAuthFile(path) {
  return new Promise((resolve, reject) => {
    uni.downloadFile({
      url: buildUrl(path),
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

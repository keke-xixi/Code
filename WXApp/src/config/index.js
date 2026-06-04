/** 服务器地址（Nginx /wx-api 反代到 5010） */
export const SERVER_URL = 'https://ljrsin.cn'

/** 云笔记 API 根路径，所有接口都走这里，避免误打到 /api/ 旧后端 */
export const API_BASE = `${SERVER_URL}/wx-api/api`

/** @deprecated 使用 API_BASE */
export const BASE_URL = `${SERVER_URL}/wx-api`

export const STORAGE_KEYS = {
  TOKEN: 'wxapp_token',
  USER: 'wxapp_user',
}

export default { SERVER_URL, API_BASE, BASE_URL, STORAGE_KEYS }

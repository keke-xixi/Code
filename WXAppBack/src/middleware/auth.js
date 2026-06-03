import jwt from 'jsonwebtoken'
import config from '../config/index.js'
import { getOne, sanitizeUser } from '../db/database.js'
import { fail } from '../utils/response.js'

export async function authRequired(req, res, next) {
  const header = req.headers.authorization || ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : null

  if (!token) {
    return fail(res, 401, '请先登录')
  }

  try {
    const payload = jwt.verify(token, config.jwtSecret)
    const user = await getOne('SELECT * FROM wx_users WHERE id = ?', [payload.userId])

    if (!user || user.status !== 'active') {
      return fail(res, 401, '账号不存在或已禁用')
    }

    req.user = sanitizeUser(user)
    next()
  } catch {
    return fail(res, 401, '登录已过期，请重新登录')
  }
}

export function adminRequired(req, res, next) {
  if (req.user?.role !== 'admin') {
    return fail(res, 403, '仅管理员可操作')
  }
  next()
}

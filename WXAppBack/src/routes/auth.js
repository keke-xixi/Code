import { Router } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import config from '../config/index.js'
import { getOne, run, sanitizeUser } from '../db/database.js'
import { authRequired } from '../middleware/auth.js'
import { ok, fail } from '../utils/response.js'

const router = Router()

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body || {}

    if (!username?.trim() || !password) {
      return fail(res, 400, '请输入用户名和密码')
    }

    const user = await getOne(
      'SELECT * FROM wx_users WHERE username = ?',
      [username.trim()],
    )

    if (!user || user.status !== 'active') {
      return fail(res, 401, '用户名或密码错误')
    }

    if (!bcrypt.compareSync(password, user.password_hash)) {
      return fail(res, 401, '用户名或密码错误')
    }

    const token = jwt.sign(
      { userId: user.id, role: user.role },
      config.jwtSecret,
      { expiresIn: config.jwtExpiresIn },
    )

    return ok(res, { token, user: sanitizeUser(user) }, '登录成功')
  } catch (err) {
    console.error('[login]', err.code || err.message)
    const msg = err.code === 'ECONNRESET' || err.code === 'PROTOCOL_CONNECTION_LOST'
      ? '数据库连接中断，请稍后重试'
      : '登录失败'
    return fail(res, 500, msg)
  }
})

router.get('/me', authRequired, (req, res) => ok(res, req.user))

router.post('/change-password', authRequired, async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body || {}

    if (!oldPassword || !newPassword) {
      return fail(res, 400, '请填写原密码和新密码')
    }
    if (newPassword.length < 6) {
      return fail(res, 400, '新密码至少 6 位')
    }

    const user = await getOne('SELECT * FROM wx_users WHERE id = ?', [req.user.id])
    if (!bcrypt.compareSync(oldPassword, user.password_hash)) {
      return fail(res, 400, '原密码不正确')
    }

    const hash = bcrypt.hashSync(newPassword, 10)
    await run('UPDATE wx_users SET password_hash = ? WHERE id = ?', [hash, req.user.id])

    return ok(res, null, '密码已修改')
  } catch (err) {
    console.error('[change-password]', err.message)
    return fail(res, 500, '修改密码失败')
  }
})

router.post('/logout', authRequired, (_req, res) => ok(res, null, '已退出'))

export default router

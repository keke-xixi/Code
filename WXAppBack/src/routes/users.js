import { Router } from 'express'
import bcrypt from 'bcryptjs'
import { getOne, getAll, run, sanitizeUser } from '../db/database.js'
import { authRequired, adminRequired } from '../middleware/auth.js'
import { ok, fail } from '../utils/response.js'

const router = Router()

router.use(authRequired, adminRequired)

router.get('/', async (_req, res) => {
  try {
    const rows = await getAll('SELECT * FROM wx_users ORDER BY id ASC')
    return ok(res, rows.map(sanitizeUser))
  } catch (err) {
    console.error(err)
    return fail(res, 500, '获取用户列表失败')
  }
})

router.post('/', async (req, res) => {
  try {
    const { username, password, role = 'user', theme = 'blue' } = req.body || {}

    if (!username?.trim() || !password) {
      return fail(res, 400, '用户名和密码不能为空')
    }
    if (!['admin', 'user'].includes(role)) {
      return fail(res, 400, '角色无效')
    }
    if (!['blue', 'orange'].includes(theme)) {
      return fail(res, 400, '主题无效')
    }
    if (password.length < 6) {
      return fail(res, 400, '密码至少 6 位')
    }

    const exists = await getOne(
      'SELECT id FROM wx_users WHERE username = ?',
      [username.trim()],
    )
    if (exists) {
      return fail(res, 409, '用户名已存在')
    }

    const hash = bcrypt.hashSync(password, 10)
    const info = await run(
      'INSERT INTO wx_users (username, password_hash, role, status, theme) VALUES (?, ?, ?, ?, ?)',
      [username.trim(), hash, role, 'active', theme],
    )

    const user = await getOne('SELECT * FROM wx_users WHERE id = ?', [info.insertId])
    return ok(res, sanitizeUser(user), '用户已创建')
  } catch (err) {
    console.error(err)
    return fail(res, 500, '创建用户失败')
  }
})

router.patch('/:id', async (req, res) => {
  try {
    const id = Number(req.params.id)
    const { status, password, role, theme } = req.body || {}

    const user = await getOne('SELECT * FROM wx_users WHERE id = ?', [id])
    if (!user) {
      return fail(res, 404, '用户不存在')
    }
    if (id === req.user.id && status === 'disabled') {
      return fail(res, 400, '不能禁用当前登录账号')
    }

    const updates = []
    const params = []

    if (status && ['active', 'disabled'].includes(status)) {
      updates.push('status = ?')
      params.push(status)
    }
    if (role && ['admin', 'user'].includes(role)) {
      if (id === req.user.id && role !== 'admin') {
        return fail(res, 400, '不能降低当前登录账号的管理员权限')
      }
      updates.push('role = ?')
      params.push(role)
    }
    if (password) {
      if (password.length < 6) {
        return fail(res, 400, '密码至少 6 位')
      }
      updates.push('password_hash = ?')
      params.push(bcrypt.hashSync(password, 10))
    }
    if (theme && ['blue', 'orange'].includes(theme)) {
      updates.push('theme = ?')
      params.push(theme)
    }
    if (!updates.length) {
      return fail(res, 400, '没有可更新的字段')
    }

    params.push(id)
    await run(`UPDATE wx_users SET ${updates.join(', ')} WHERE id = ?`, params)

    const updated = await getOne('SELECT * FROM wx_users WHERE id = ?', [id])
    return ok(res, sanitizeUser(updated), '已更新')
  } catch (err) {
    console.error(err)
    return fail(res, 500, '更新用户失败')
  }
})

router.delete('/:id', async (req, res) => {
  try {
    const id = Number(req.params.id)

    if (id === req.user.id) {
      return fail(res, 400, '不能删除当前登录账号')
    }

    const user = await getOne('SELECT id FROM wx_users WHERE id = ?', [id])
    if (!user) {
      return fail(res, 404, '用户不存在')
    }

    await run('DELETE FROM wx_users WHERE id = ?', [id])
    return ok(res, null, '用户已删除')
  } catch (err) {
    console.error(err)
    return fail(res, 500, '删除用户失败')
  }
})

export default router

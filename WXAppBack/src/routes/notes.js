import { Router } from 'express'
import { getOne, getAll, run } from '../db/database.js'
import { authRequired } from '../middleware/auth.js'
import { ok, fail } from '../utils/response.js'

const router = Router()

router.use(authRequired)

function parseTags(raw) {
  if (Array.isArray(raw)) {
    return raw.map((t) => String(t).trim()).filter(Boolean).join(',')
  }
  if (typeof raw === 'string') {
    return raw.split(/[,，]/).map((t) => t.trim()).filter(Boolean).join(',')
  }
  return ''
}

router.get('/', async (req, res) => {
  try {
    const { keyword = '', tag = '' } = req.query
    let sql = 'SELECT * FROM wx_notes WHERE user_id = ?'
    const params = [req.user.id]

    if (keyword) {
      sql += ' AND (title LIKE ? OR content LIKE ?)'
      const kw = `%${keyword}%`
      params.push(kw, kw)
    }
    if (tag) {
      sql += ' AND (tags LIKE ? OR tags LIKE ? OR tags = ?)'
      const t = tag.trim()
      params.push(`${t},%`, `%,${t},%`, t)
    }

    sql += ' ORDER BY updated_at DESC'

    const rows = await getAll(sql, params)
    return ok(res, rows.map((row) => ({
      ...row,
      tagList: row.tags ? row.tags.split(',') : [],
    })))
  } catch (err) {
    console.error(err)
    return fail(res, 500, '获取笔记失败')
  }
})

router.get('/:id', async (req, res) => {
  try {
    const row = await getOne(
      'SELECT * FROM wx_notes WHERE id = ? AND user_id = ?',
      [Number(req.params.id), req.user.id],
    )
    if (!row) {
      return fail(res, 404, '笔记不存在')
    }
    return ok(res, {
      ...row,
      tagList: row.tags ? row.tags.split(',') : [],
    })
  } catch (err) {
    console.error(err)
    return fail(res, 500, '获取笔记失败')
  }
})

router.post('/', async (req, res) => {
  try {
    const { title = '', content = '', tags } = req.body || {}

    const info = await run(
      'INSERT INTO wx_notes (user_id, title, content, tags) VALUES (?, ?, ?, ?)',
      [req.user.id, String(title), String(content), parseTags(tags)],
    )

    const row = await getOne('SELECT * FROM wx_notes WHERE id = ?', [info.insertId])
    return ok(res, {
      ...row,
      tagList: row.tags ? row.tags.split(',') : [],
    }, '笔记已创建')
  } catch (err) {
    console.error(err)
    return fail(res, 500, '创建笔记失败')
  }
})

router.put('/:id', async (req, res) => {
  try {
    const id = Number(req.params.id)
    const { title, content, tags } = req.body || {}

    const existing = await getOne(
      'SELECT id FROM wx_notes WHERE id = ? AND user_id = ?',
      [id, req.user.id],
    )
    if (!existing) {
      return fail(res, 404, '笔记不存在')
    }

    await run(
      `UPDATE wx_notes SET
        title = COALESCE(?, title),
        content = COALESCE(?, content),
        tags = COALESCE(?, tags)
      WHERE id = ? AND user_id = ?`,
      [
        title != null ? String(title) : null,
        content != null ? String(content) : null,
        tags != null ? parseTags(tags) : null,
        id,
        req.user.id,
      ],
    )

    const row = await getOne('SELECT * FROM wx_notes WHERE id = ?', [id])
    return ok(res, {
      ...row,
      tagList: row.tags ? row.tags.split(',') : [],
    }, '笔记已更新')
  } catch (err) {
    console.error(err)
    return fail(res, 500, '更新笔记失败')
  }
})

router.delete('/:id', async (req, res) => {
  try {
    const id = Number(req.params.id)
    const info = await run(
      'DELETE FROM wx_notes WHERE id = ? AND user_id = ?',
      [id, req.user.id],
    )
    if (!info.affectedRows) {
      return fail(res, 404, '笔记不存在')
    }
    return ok(res, null, '笔记已删除')
  } catch (err) {
    console.error(err)
    return fail(res, 500, '删除笔记失败')
  }
})

export default router

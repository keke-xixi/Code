import fs from 'fs'
import path from 'path'
import jwt from 'jsonwebtoken'
import { Router } from 'express'
import multer from 'multer'
import { v4 as uuidv4 } from 'uuid'
import config from '../config/index.js'
import { getOne, getAll, run } from '../db/database.js'
import { authRequired } from '../middleware/auth.js'
import { ok, fail } from '../utils/response.js'

const router = Router()

const DOC_EXT = new Set([
  '.pdf', '.doc', '.docx', '.txt', '.md', '.rtf',
  '.xls', '.xlsx', '.ppt', '.pptx', '.csv',
])

const APK_EXT = new Set(['.apk', '.ipa', '.xapk'])

function detectCategory(mime, originalName) {
  const ext = path.extname(originalName || '').toLowerCase()
  if (mime.startsWith('image/')) return 'image'
  if (mime.startsWith('video/')) return 'video'
  if (APK_EXT.has(ext)) return 'apk'
  if (
    DOC_EXT.has(ext)
    || mime === 'application/pdf'
    || mime.includes('word')
    || mime.includes('document')
    || mime.includes('spreadsheet')
    || mime.includes('presentation')
    || mime.startsWith('text/')
  ) {
    return 'document'
  }
  return 'other'
}

function decodeUserId(req) {
  const header = req.headers.authorization || ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : req.query.token
  if (!token) return null
  try {
    const payload = jwt.verify(token, config.jwtSecret)
    return payload.userId
  } catch {
    return null
  }
}

function userUploadDir(userId) {
  const dir = path.join(config.uploadDir, String(userId))
  fs.mkdirSync(dir, { recursive: true })
  return dir
}

const storage = multer.diskStorage({
  destination(req, _file, cb) {
    cb(null, userUploadDir(req.user.id))
  },
  filename(_req, file, cb) {
    const ext = path.extname(file.originalname) || ''
    cb(null, `${uuidv4()}${ext}`)
  },
})

const upload = multer({
  storage,
  limits: { fileSize: config.maxFileSizeMb * 1024 * 1024 },
})

router.use(authRequired)

router.get('/', async (req, res) => {
  try {
    const { category = '' } = req.query
    let sql = 'SELECT * FROM wx_files WHERE user_id = ?'
    const params = [req.user.id]

    if (category && ['image', 'video', 'apk', 'document', 'other'].includes(category)) {
      sql += ' AND category = ?'
      params.push(category)
    }

    sql += ' ORDER BY created_at DESC'
    const rows = await getAll(sql, params)
    return ok(res, rows.map(normalizeFileRow))
  } catch (err) {
    console.error(err)
    return fail(res, 500, '获取文件列表失败')
  }
})

router.get('/stats/summary', async (req, res) => {
  try {
    const rows = await getAll(
      `SELECT category, COUNT(*) AS count, COALESCE(SUM(size), 0) AS totalSize
       FROM wx_files WHERE user_id = ?
       GROUP BY category`,
      [req.user.id],
    )

    const noteCount = await getOne(
      'SELECT COUNT(*) AS count FROM wx_notes WHERE user_id = ?',
      [req.user.id],
    )

    return ok(res, {
      files: rows,
      noteCount: noteCount.count,
    })
  } catch (err) {
    console.error(err)
    return fail(res, 500, '获取统计失败')
  }
})

router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return fail(res, 400, '请选择文件')
    }

    const originalName = (req.body?.originalName || req.file.originalname || '未命名文件').trim()
    const category = detectCategory(req.file.mimetype, originalName)

    const info = await run(
      `INSERT INTO wx_files (user_id, original_name, stored_name, mime_type, size, category)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        req.user.id,
        originalName,
        req.file.filename,
        req.file.mimetype,
        req.file.size,
        category,
      ],
    )

    const row = await getOne('SELECT * FROM wx_files WHERE id = ?', [info.insertId])
    return ok(res, normalizeFileRow(row), '上传成功')
  } catch (err) {
    console.error(err)
    return fail(res, 500, '上传失败')
  }
})

router.get('/:id/download', async (req, res) => {
  try {
    const userId = decodeUserId(req)
    if (!userId) {
      return fail(res, 401, '请先登录')
    }

    const row = await getOne(
      'SELECT * FROM wx_files WHERE id = ? AND user_id = ?',
      [Number(req.params.id), userId],
    )

    if (!row) {
      return fail(res, 404, '文件不存在')
    }

    const filePath = path.join(config.uploadDir, String(userId), row.stored_name)
    if (!fs.existsSync(filePath)) {
      return fail(res, 404, '文件已丢失')
    }

    const mime = row.mime_type || 'application/octet-stream'
    res.setHeader('Content-Type', mime)
    res.setHeader(
      'Content-Disposition',
      `inline; filename*=UTF-8''${encodeURIComponent(row.original_name)}`,
    )
    return res.sendFile(filePath)
  } catch (err) {
    console.error(err)
    return fail(res, 500, '下载失败')
  }
})

router.delete('/:id', async (req, res) => {
  try {
    const id = Number(req.params.id)
    const row = await getOne(
      'SELECT * FROM wx_files WHERE id = ? AND user_id = ?',
      [id, req.user.id],
    )

    if (!row) {
      return fail(res, 404, '文件不存在')
    }

    const filePath = path.join(config.uploadDir, String(req.user.id), row.stored_name)
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath)
    }

    await run('DELETE FROM wx_files WHERE id = ?', [id])
    return ok(res, null, '文件已删除')
  } catch (err) {
    console.error(err)
    return fail(res, 500, '删除失败')
  }
})

function normalizeFileRow(row) {
  if (!row) return null
  return {
    id: Number(row.id),
    user_id: Number(row.user_id),
    original_name: row.original_name || '未命名文件',
    stored_name: row.stored_name,
    mime_type: row.mime_type || '',
    size: Number(row.size) || 0,
    category: row.category || 'other',
    created_at: row.created_at instanceof Date
      ? row.created_at.toISOString()
      : row.created_at,
  }
}

export default router

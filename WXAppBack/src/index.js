import fs from 'fs'
import express from 'express'
import cors from 'cors'
import config from './config/index.js'
import { initDb } from './db/database.js'
import authRoutes from './routes/auth.js'
import userRoutes from './routes/users.js'
import noteRoutes from './routes/notes.js'
import fileRoutes from './routes/files.js'
import { ok } from './utils/response.js'

fs.mkdirSync(config.uploadDir, { recursive: true })

const app = express()

app.use(cors())
app.use(express.json({ limit: '2mb' }))
app.use(express.urlencoded({ extended: true }))

app.get('/api/health', (_req, res) => {
  ok(res, { service: 'WXAppBack', time: new Date().toISOString() })
})

app.use('/api/auth', authRoutes)
app.use('/api/users', userRoutes)
app.use('/api/notes', noteRoutes)
app.use('/api/files', fileRoutes)

app.use((err, _req, res, _next) => {
  if (err?.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({
      code: 400,
      message: `文件过大，上限 ${config.maxFileSizeMb}MB`,
      result: null,
    })
  }
  console.error(err)
  res.status(500).json({ code: 500, message: '服务器错误', result: null })
})

try {
  await initDb()
} catch (err) {
  console.error('\n[错误] 数据库连接失败:', err.message)
  console.error('请检查 WXAppBack/.env 中的 DB_HOST / DB_USER / DB_PASSWORD / DB_NAME\n')
  process.exit(1)
}

const server = app.listen(config.port, () => {
  console.log('')
  console.log('========================================')
  console.log('  WXAppBack 已启动')
  console.log(`  地址: http://localhost:${config.port}`)
  console.log(`  数据库: ${config.db.host}/${config.db.database}`)
  console.log(`  健康检查: http://localhost:${config.port}/api/health`)
  console.log(`  管理员: ${config.adminUsername} / ${config.adminPassword}`)
  console.log('========================================')
  console.log('')
})

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`\n[错误] 端口 ${config.port} 已被占用，请关闭其它后端进程或在 .env 修改 PORT\n`)
  } else {
    console.error('\n[错误] 服务启动失败:', err.message, '\n')
  }
  process.exit(1)
})

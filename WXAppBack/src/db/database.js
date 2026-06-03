import mysql from 'mysql2/promise'
import bcrypt from 'bcryptjs'
import config from '../config/index.js'

let pool = null

const RETRYABLE = new Set([
  'ECONNRESET',
  'ECONNREFUSED',
  'ETIMEDOUT',
  'PROTOCOL_CONNECTION_LOST',
  'EPIPE',
])

function createPool() {
  const p = mysql.createPool({
    host: config.db.host,
    port: config.db.port,
    user: config.db.user,
    password: config.db.password,
    database: config.db.database,
    waitForConnections: true,
    connectionLimit: 5,
    maxIdle: 2,
    idleTimeout: 30_000,
    queueLimit: 0,
    charset: 'utf8mb4',
    connectTimeout: 20_000,
    enableKeepAlive: true,
    keepAliveInitialDelay: 10_000,
  })

  p.on('connection', (conn) => {
    conn.on('error', (err) => {
      console.error('[db] 连接异常:', err.code || err.message)
    })
  })

  return p
}

async function execute(sql, params = []) {
  let lastError

  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      return await getPool().execute(sql, params)
    } catch (err) {
      lastError = err
      if (!RETRYABLE.has(err.code) || attempt === 3) {
        throw err
      }
      console.warn(`[db] 查询失败(${err.code})，第 ${attempt} 次重试...`)
      await sleep(300 * attempt)
    }
  }

  throw lastError
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export async function initDb() {
  if (pool) return pool

  pool = createPool()

  const conn = await pool.getConnection()
  try {
    await conn.ping()
    console.log(`[db] MySQL 已连接: ${config.db.host}:${config.db.port}/${config.db.database}`)
  } finally {
    conn.release()
  }

  await initSchema()
  await ensureAdmin()
  return pool
}

export function getPool() {
  if (!pool) {
    throw new Error('数据库未初始化，请先调用 initDb()')
  }
  return pool
}

export async function getOne(sql, params = []) {
  const [rows] = await execute(sql, params)
  return rows[0]
}

export async function getAll(sql, params = []) {
  const [rows] = await execute(sql, params)
  return rows
}

export async function run(sql, params = []) {
  const [result] = await execute(sql, params)
  return {
    insertId: result.insertId,
    affectedRows: result.affectedRows,
  }
}

async function initSchema() {
  await run(`
    CREATE TABLE IF NOT EXISTS wx_users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      username VARCHAR(64) NOT NULL UNIQUE,
      password_hash VARCHAR(255) NOT NULL,
      role ENUM('admin', 'user') NOT NULL DEFAULT 'user',
      status ENUM('active', 'disabled') NOT NULL DEFAULT 'active',
      theme ENUM('blue', 'orange') NOT NULL DEFAULT 'blue',
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `)

  await ensureUserThemeColumn()

  await run(`
    CREATE TABLE IF NOT EXISTS wx_notes (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      title VARCHAR(255) NOT NULL DEFAULT '',
      content MEDIUMTEXT NOT NULL,
      tags VARCHAR(500) NOT NULL DEFAULT '',
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_wx_notes_user (user_id),
      CONSTRAINT fk_wx_notes_user FOREIGN KEY (user_id) REFERENCES wx_users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `)

  await run(`
    CREATE TABLE IF NOT EXISTS wx_files (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      original_name VARCHAR(512) NOT NULL,
      stored_name VARCHAR(255) NOT NULL,
      mime_type VARCHAR(128) NOT NULL DEFAULT '',
      size BIGINT NOT NULL DEFAULT 0,
      category ENUM('image', 'video', 'apk', 'document', 'other') NOT NULL DEFAULT 'other',
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_wx_files_user (user_id),
      CONSTRAINT fk_wx_files_user FOREIGN KEY (user_id) REFERENCES wx_users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `)
  await ensureFileCategoryColumn()
}

async function ensureFileCategoryColumn() {
  try {
    const col = await getOne(`SHOW COLUMNS FROM wx_files LIKE 'category'`)
    if (col?.Type && !col.Type.includes('document')) {
      await run(
        `ALTER TABLE wx_files MODIFY category ENUM('image', 'video', 'apk', 'document', 'other') NOT NULL DEFAULT 'other'`,
      )
      console.log('[db] wx_files.category 已支持 document')
    }
  } catch (err) {
    console.warn('[db] wx_files.category 迁移跳过:', err.message)
  }
}

async function ensureUserThemeColumn() {
  const cols = await getAll(`SHOW COLUMNS FROM wx_users LIKE 'theme'`)
  if (!cols.length) {
    await run(
      `ALTER TABLE wx_users ADD COLUMN theme ENUM('blue', 'orange') NOT NULL DEFAULT 'blue' AFTER status`,
    )
    console.log('[db] 已添加 wx_users.theme 字段')
  }
}

async function ensureAdmin() {
  const row = await getOne(
    'SELECT id FROM wx_users WHERE username = ?',
    [config.adminUsername],
  )

  if (!row) {
    const hash = bcrypt.hashSync(config.adminPassword, 10)
    await run(
      'INSERT INTO wx_users (username, password_hash, role, status) VALUES (?, ?, ?, ?)',
      [config.adminUsername, hash, 'admin', 'active'],
    )
    console.log(`[db] 已创建管理员: ${config.adminUsername}`)
  }
}

export function sanitizeUser(row) {
  if (!row) return null
  const { password_hash, ...rest } = row
  return {
    ...rest,
    id: Number(rest.id),
    created_at: rest.created_at instanceof Date
      ? rest.created_at.toISOString()
      : rest.created_at,
  }
}

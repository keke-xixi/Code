/**
 * 同步 minigame/ → dist/wxdb707-game/
 * 微信开发者工具：小游戏模式，AppID wxdb70767113810f88，导入 dist/wxdb707-game
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')
const src = path.join(root, 'minigame')
const dest = path.join(root, 'dist', 'wxdb707-game')

const copy = (from, to) => {
  const stat = fs.statSync(from)
  if (stat.isDirectory()) {
    fs.mkdirSync(to, { recursive: true })
    for (const name of fs.readdirSync(from)) {
      copy(path.join(from, name), path.join(to, name))
    }
    return
  }
  fs.mkdirSync(path.dirname(to), { recursive: true })
  fs.copyFileSync(from, to)
}

if (!fs.existsSync(src)) {
  console.error('缺少 minigame/ 目录')
  process.exit(1)
}

if (fs.existsSync(dest)) {
  fs.rmSync(dest, { recursive: true, force: true })
}
copy(src, dest)

const hint = path.join(dest, '【导入本目录】.txt')
fs.writeFileSync(
  hint,
  [
    '微信小游戏 · AppID: wxdb70767113810f88',
    '',
    '开发者工具：左侧选「小游戏」→ 导入本文件夹 dist/wxdb707-game',
    '',
    '不要导入 dist/dev/mp-weixin（那是 uni 小程序，会报 game.json 找不到）',
  ].join('\r\n'),
  'utf8'
)

console.log('')
console.log('已生成小游戏目录:')
console.log(dest)
console.log('')
console.log('微信开发者工具 → 小游戏 → 导入上述目录')
console.log('AppID: wxdb70767113810f88')
console.log('')

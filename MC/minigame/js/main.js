/**
 * 微信小游戏入口（dev-wexin-game 分支）
 * 当前为可运行骨架，完整玩法需从 src/ uni-app 版逐步迁移
 */
import { boot } from './runtime.js'

let started = false
const start = () => {
  if (started) return
  started = true
  boot()
}

start()
wx.onShow(start)

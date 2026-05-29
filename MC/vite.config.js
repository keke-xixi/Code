import { defineConfig } from 'vite'
import uni from '@dcloudio/vite-plugin-uni'
import fs from 'fs'
import path from 'path'

// 仅 H5 使用单文件打包；小程序等平台由 @dcloudio/vite-plugin-uni 自行分包
const isH5 = process.env.UNI_PLATFORM === 'h5'
const isMpWeixin = process.env.UNI_PLATFORM === 'mp-weixin'

/** 防止用 wxdb707 小游戏 AppID 导入 uni 小程序目录（会报 game.json） */
function mpWeixinImportGuard() {
  return {
    name: 'mp-weixin-import-guard',
    closeBundle() {
      if (!isMpWeixin) return
      const outDir = path.resolve('dist/dev/mp-weixin')
      if (!fs.existsSync(outDir)) return

      const cfgPath = path.join(outDir, 'project.config.json')
      if (fs.existsSync(cfgPath)) {
        const cfg = JSON.parse(fs.readFileSync(cfgPath, 'utf8'))
        cfg.compileType = 'miniprogram'
        cfg.appid = 'wx9430aecf60877fad'
        cfg.description =
          'uni 小程序产物，AppID 须为 wx9430aecf60877fad。小游戏 wxdb707 请导入 dist/wxdb707-game'
        fs.writeFileSync(cfgPath, JSON.stringify(cfg, null, 2))
      }

      fs.writeFileSync(
        path.join(outDir, '【勿导入小游戏】.txt'),
        [
          '你正在看的目录是 uni 编译的「小程序」，不是小游戏。',
          '',
          'AppID wxdb70767113810f88 是小游戏账号，导入本目录会报：',
          '  game.json 未找到',
          '',
          '请改为导入（小游戏模式）：',
          '  c:\\zg\\code\\Code\\MC\\dist\\wxdb707-game',
          '或：',
          '  c:\\zg\\code\\Code\\MC\\minigame',
          '',
          '生成小游戏目录：npm run dev:wx-game',
        ].join('\r\n'),
        'utf8'
      )
    },
  }
}

export default defineConfig({
  plugins: [uni(), mpWeixinImportGuard()],
  build: {
    ...(isH5
      ? {
          rollupOptions: {
            output: {
              inlineDynamicImports: true,
              chunkFileNames: 'js/[name]-[hash].js',
              assetFileNames: 'assets/[name]-[hash][extname]',
              entryFileNames: 'main.js',
            },
          },
          cssCodeSplit: false,
        }
      : {}),
    commonjsOptions: {
      transformMixedEsModules: true,
    },
  },
  optimizeDeps: {
    exclude: ['vue-plugin-hiprint'],
  },
})

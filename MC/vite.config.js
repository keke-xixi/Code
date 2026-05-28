import { defineConfig } from 'vite'
import uni from '@dcloudio/vite-plugin-uni'

// 仅 H5 使用单文件打包；小程序等平台由 @dcloudio/vite-plugin-uni 自行分包
const isH5 = process.env.UNI_PLATFORM === 'h5'

export default defineConfig({
  plugins: [uni()],
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

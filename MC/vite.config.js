import { defineConfig } from 'vite'
import uni from '@dcloudio/vite-plugin-uni'

export default defineConfig({
  plugins: [uni()],
  build: {
    rollupOptions: {
      output: {
        inlineDynamicImports: true, // 关键：禁用代码分割
        chunkFileNames: 'js/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash][extname]',
        entryFileNames: 'main.js',
      }
    },
    cssCodeSplit: false,
    commonjsOptions: {
      transformMixedEsModules: true,
    }
  },
  optimizeDeps: {
    exclude: ['vue-plugin-hiprint'], // 防止 Vite 预构建这个库
  }
})


import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:5000', // 后端 Flask 地址
        changeOrigin: true,
        // 如果后端接口没有 /api 前缀，可以开启重写
        // rewrite: (path) => path.replace(/^\/api/, '')
      }
    }
  }
})
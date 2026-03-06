import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'node:path'

export default defineConfig({
  plugins: [vue()],
  base: '/webadmin/',
  resolve: {
    alias: {
      '@': resolve(__dirname, './src')
    }
  },
  build: {
    sourcemap: true,
    outDir: 'dist',
  },
  server: {
    port: 3002,
    proxy: {
      '/ServerAdmin': {
        target: 'http://localhost:8075',
        changeOrigin: true,
      }
    }
  }
})

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5903,
    proxy: {
      '/v1': {
        target: 'https://kingfisherapi.rthak.com',
        changeOrigin: true,
      }
    }
  },
  build: {
    cssMinify: 'esbuild'
  }
})
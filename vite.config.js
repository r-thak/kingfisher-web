import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { execSync } from 'child_process'

let commitHash = 'dev'
let commitShort = 'dev'

try {
  commitHash = execSync('git rev-parse HEAD').toString().trim()
  commitShort = execSync('git rev-parse --short HEAD').toString().trim()
} catch (e) {
  console.warn('Failed to fetch git commit hash', e)
}

export default defineConfig({
  plugins: [react()],
  define: {
    '__COMMIT_HASH__': JSON.stringify(commitHash),
    '__COMMIT_SHORT__': JSON.stringify(commitShort),
  },
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
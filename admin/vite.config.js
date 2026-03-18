import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/flowhub-api': {
        target: 'https://api.flowhub.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/flowhub-api/, '')
      }
    }
  }
})

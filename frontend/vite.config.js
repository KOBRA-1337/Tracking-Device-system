import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0', // Listen on all network interfaces (for Hamachi access)
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://25.10.65.46:3000', // Use Hamachi IP for backend
        changeOrigin: true,
        secure: false
      }
    }
  }
})


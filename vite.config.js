import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  appType: 'mpa', // Multi-page app
  build: {
    rollupOptions: {
      input: {
        main: './index.html',
        map: './map.html'
      }
    }
  }
})

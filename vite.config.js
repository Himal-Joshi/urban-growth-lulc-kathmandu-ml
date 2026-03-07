import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: '/urban-growth-lulc-kathmandu-ml/',
  plugins: [react()]
})

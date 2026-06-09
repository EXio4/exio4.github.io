import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // User GitHub Pages site (exio4.github.io) deploys at root "/"
  base: '/',
})

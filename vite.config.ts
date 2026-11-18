import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// base './' so the build works under GitHub Pages sub-path (HashRouter handles routing)
export default defineConfig({
  plugins: [react()],
  base: './',
})

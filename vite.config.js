import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Change 'moms-puzzle' to whatever you name your GitHub repo
export default defineConfig({
  plugins: [react()],
  base: '/moms-puzzle/',
})

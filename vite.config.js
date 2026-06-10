import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // Set to '/repo-name/' if deploying to username.github.io/repo-name
  base: '/usa26/',
})

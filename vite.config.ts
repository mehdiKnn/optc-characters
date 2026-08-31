import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: process.env.GITHUB_ACTIONS ? '/optc-characters/' : '/',
  plugins: [react()],
  build: {
    target: 'es2022',
    rolldownOptions: { output: { codeSplitting: false } },
    chunkSizeWarningLimit: 4000,
  },
  test: { environment: 'jsdom', setupFiles: './src/test/setup.ts' },
})

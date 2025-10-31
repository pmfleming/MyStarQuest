/// <reference types="vitest" />

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { configDefaults } from 'vitest/config'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/setupTests.ts',
    exclude: [...configDefaults.exclude, 'tests/**'],
  },
  // Vitest augments the Vite config at runtime; casting keeps type-checking happy.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
} as any)

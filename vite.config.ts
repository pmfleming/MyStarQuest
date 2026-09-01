/// <reference types="vitest" />

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { configDefaults } from 'vitest/config'

const getManualChunk = (moduleId: string) => {
  const id = moduleId.replaceAll('\\', '/')

  if (!id.includes('/node_modules/')) return undefined

  if (
    id.includes('/node_modules/react/') ||
    id.includes('/node_modules/react-dom/') ||
    id.includes('/node_modules/react-router/') ||
    id.includes('/node_modules/react-router-dom/') ||
    id.includes('/node_modules/scheduler/')
  ) {
    return 'vendor-react'
  }

  if (id.includes('/node_modules/three/')) return 'vendor-three'
  if (id.includes('/node_modules/zod/')) return 'vendor-validation'

  return undefined
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: getManualChunk,
      },
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './tests/setup/vitest.setup.ts',
    include: [
      'tests/unit/**/*.test.{ts,tsx}',
      'tests/component/**/*.test.{ts,tsx}',
    ],
    exclude: [...configDefaults.exclude, 'tests/e2e/**'],
  },
  // Vitest augments the Vite config at runtime; casting keeps type-checking happy.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
} as any)

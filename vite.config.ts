import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { configDefaults, defineConfig } from 'vitest/config'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            {
              name: 'vendor-react',
              test: /node_modules[\\/](react(?:-dom|-router(?:-dom)?)?|scheduler)[\\/]/,
            },
            {
              name: 'vendor-three',
              test: /node_modules[\\/]three[\\/]/,
            },
            {
              name: 'vendor-validation',
              test: /node_modules[\\/]zod[\\/]/,
            },
          ],
        },
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
})

import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'

// Independent web entry and output. Capacitor continues to use the core dist/.
export default defineConfig({
  root: fileURLToPath(new URL('.', import.meta.url)),
  base: './',
  publicDir: false,
  cacheDir: '../node_modules/.vite-comic',
  server: {
    host: '127.0.0.1',
    port: 5174,
    strictPort: true,
    fs: { allow: [fileURLToPath(new URL('..', import.meta.url))] },
  },
  preview: { host: '127.0.0.1', port: 4174, strictPort: true },
  build: {
    outDir: fileURLToPath(new URL('./dist', import.meta.url)),
    emptyOutDir: true,
  },
})

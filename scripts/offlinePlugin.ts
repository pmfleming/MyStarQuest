import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import type { Plugin } from 'vite'

export function offlinePlugin(): Plugin {
  return {
    name: 'offline-app-shell',
    apply: 'build',
    enforce: 'post',
    generateBundle(_options, bundle) {
      const names = Object.keys(bundle).sort()
      const core = names
        .filter((name) => /\.(js|css|woff2?)$/.test(name))
        .map((name) => `/${name}`)
      core.push('/data/world-50m-2024.json')
      const template = readFileSync(
        new URL('./offline-worker.js', import.meta.url),
        'utf8'
      )
      const version = createHash('sha256')
        .update(names.join('\n'))
        .update(template)
        .update(
          readFileSync(
            new URL('../public/data/world-50m-2024.json', import.meta.url)
          )
        )
        .update(
          bundle['index.html']?.type === 'asset'
            ? bundle['index.html'].source
            : ''
        )
        .digest('hex')
        .slice(0, 16)
      this.emitFile({
        type: 'asset',
        fileName: 'sw.js',
        source: template.replace(
          '__OFFLINE_BUILD__',
          JSON.stringify({ version, core })
        ),
      })
    },
  }
}

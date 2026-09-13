import { createServer } from 'vite'
import { chromium } from '@playwright/test'
import { readFile, writeFile, mkdir, copyFile } from 'node:fs/promises'
import { dirname, resolve, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const manifestPath = resolve(root, 'docs/assets/weather-layer-prompts.json')
const manifest = JSON.parse(await readFile(manifestPath, 'utf8'))
const masters = resolve(root, 'output/weather/masters')
await mkdir(masters, { recursive: true })
for (const asset of manifest.assets)
  await copyFile(asset.generatedOriginal, resolve(masters, `${asset.id}.png`))
const server = await createServer({
  root,
  server: { host: '127.0.0.1', port: 5200 },
  plugins: [
    {
      name: 'weather-export',
      configureServer(server) {
        server.middlewares.use('/__weather-export', (_req, res) => {
          res.setHeader('Content-Type', 'text/html')
          res.end(
            '<!doctype html><html><body>Weather artwork preparation</body></html>'
          )
        })
      },
    },
  ],
})
await server.listen()
const browser = await chromium.launch({ headless: true })
try {
  const page = await browser.newPage()
  await page.goto(`${server.resolvedUrls.local[0]}__weather-export`)
  for (const asset of manifest.assets) {
    const result = await page.evaluate(async ({ id, kind }) => {
      const source = `/output/weather/masters/${id}.png`
      let canvas
      if (kind === 'character') {
        const { loadWeatherCharacter } =
          await import('/scripts/weatherCharacterComposite.ts')
        canvas = await loadWeatherCharacter(source)
      } else {
        const image = new Image()
        image.src = source
        await image.decode()
        canvas = document.createElement('canvas')
        canvas.width = 768
        canvas.height = 768
        canvas.getContext('2d').drawImage(image, 0, 0, 768, 768)
      }
      const data = canvas
        .getContext('2d')
        .getImageData(0, 0, canvas.width, canvas.height).data
      let transparent = 0,
        opaque = 0,
        green = 0
      for (let i = 0; i < data.length; i += 4) {
        if (data[i + 3] === 0) transparent++
        if (data[i + 3] > 230) opaque++
        if (
          data[i + 3] > 128 &&
          data[i + 1] - Math.max(data[i], data[i + 2]) > 40
        )
          green++
      }
      if (
        kind === 'character' &&
        (transparent < 100 || opaque < 1000 || green !== 0)
      )
        throw new Error(`Invalid character alpha: ${id}`)
      return {
        url: canvas.toDataURL('image/webp', 0.93),
        width: canvas.width,
        height: canvas.height,
        transparent,
        opaque,
      }
    }, asset)
    const output = asset.output.replace(/\.(png|webp)$/, '.webp')
    const destination = resolve(root, output)
    if (
      relative(resolve(root, 'src/assets/themes'), destination).startsWith('..')
    )
      throw new Error('Output outside theme assets')
    await mkdir(dirname(destination), { recursive: true })
    const encoded = Buffer.from(result.url.split(',')[1], 'base64')
    await writeFile(destination, encoded)
    Object.assign(asset, {
      output,
      status: 'exported_and_verified',
      width: result.width,
      height: result.height,
      bytes: encoded.length,
      transparentPixels: result.transparent,
      opaquePixels: result.opaque,
    })
    console.log(`${asset.id}: ${encoded.length} bytes`)
  }
  manifest.production = {
    format: 'webp',
    maxDimension: 768,
    characterBackground:
      'True alpha extracted from generated chroma-key masters during asset preparation; no runtime keying.',
    environmentBackground: 'Opaque outdoor scene',
  }
  manifest.status = 'exported_and_verified'
  await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`)
} finally {
  await browser.close()
  await server.close()
}

import { chromium } from '@playwright/test'
import { mkdir, readFile, writeFile } from 'node:fs/promises'

const root = new URL('../', import.meta.url)
const manifest = JSON.parse(
  await readFile(
    new URL('docs/assets/2026-11-16-dinosaur-depth.json', root),
    'utf8'
  )
)
await mkdir(new URL('src/assets/comic/layers/dinosaur-depth/', root), {
  recursive: true,
})
const browser = await chromium.launch()
try {
  const page = await browser.newPage()
  for (const asset of manifest.assets) {
    const input = (await readFile(asset.generatedSource)).toString('base64')
    const result = await page.evaluate(async (input) => {
      const image = new Image()
      image.src = `data:image/png;base64,${input}`
      await image.decode()
      const canvas = document.createElement('canvas')
      canvas.width = image.width
      canvas.height = image.height
      const context = canvas.getContext('2d')
      context.drawImage(image, 0, 0)
      const pixels = context.getImageData(
        0,
        0,
        canvas.width,
        canvas.height
      ).data
      let transparent = 0
      for (let i = 3; i < pixels.length; i += 4)
        if (pixels[i] === 0) transparent++
      if (transparent / (pixels.length / 4) < 0.4)
        throw new Error('Scenery plate needs an open transparent centre')
      return {
        webp: canvas.toDataURL('image/webp', 0.94).split(',')[1],
        width: canvas.width,
        height: canvas.height,
        transparent,
      }
    }, input)
    const destination = new URL(asset.asset, root)
    const bytes = Buffer.from(result.webp, 'base64')
    const existing = await readFile(destination).catch(() => undefined)
    if (!existing?.equals(bytes)) await writeFile(destination, bytes)
    console.log(
      `${asset.name}: ${result.width}x${result.height}, ${result.transparent} transparent pixels`
    )
  }
} finally {
  await browser.close()
}

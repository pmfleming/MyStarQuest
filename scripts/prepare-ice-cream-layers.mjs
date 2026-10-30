import { chromium } from '@playwright/test'
import { readFile, writeFile } from 'node:fs/promises'

const dir = new URL('../src/assets/comic/layers/ice-cream/', import.meta.url)
const browser = await chromium.launch()
try {
  const page = await browser.newPage()
  for (const name of ['background', 'coral', 'crystal']) {
    const src = `data:image/png;base64,${(await readFile(new URL(`${name}.png`, dir))).toString('base64')}`
    const data = await page.evaluate(
      async ({ src, name }) => {
        const image = new Image()
        image.src = src
        await image.decode()
        const canvas = document.createElement('canvas')
        canvas.width = image.width
        canvas.height = image.height
        const ctx = canvas.getContext('2d')
        ctx.drawImage(image, 0, 0)
        let box = [0, 0, image.width, image.height]
        if (name !== 'background') {
          const pixels = ctx.getImageData(0, 0, image.width, image.height).data
          let x0 = image.width,
            y0 = image.height,
            x1 = 0,
            y1 = 0
          for (let y = 0; y < image.height; y++) {
            for (let x = 0; x < image.width; x++) {
              if (pixels[(y * image.width + x) * 4 + 3] > 24) {
                x0 = Math.min(x0, x)
                y0 = Math.min(y0, y)
                x1 = Math.max(x1, x)
                y1 = Math.max(y1, y)
              }
            }
          }
          box = [x0, y0, x1 - x0 + 1, y1 - y0 + 1]
        }
        const out = document.createElement('canvas')
        const scale = Math.min(1, (name === 'background' ? 1536 : 850) / box[2])
        out.width = Math.round(box[2] * scale)
        out.height = Math.round(box[3] * scale)
        out
          .getContext('2d')
          .drawImage(image, ...box, 0, 0, out.width, out.height)
        return out.toDataURL('image/webp', 0.94).split(',')[1]
      },
      { src, name }
    )
    await writeFile(new URL(`${name}.webp`, dir), Buffer.from(data, 'base64'))
  }
} finally {
  await browser.close()
}

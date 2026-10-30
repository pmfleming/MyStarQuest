import { chromium } from '@playwright/test'
import { readFile, writeFile } from 'node:fs/promises'
const dir = new URL('../src/assets/comic/layers/tidying/', import.meta.url)
const browser = await chromium.launch()
try {
  const page = await browser.newPage()
  for (const [name, source, side] of [
    ['background', 'background', ''],
    ['coral', 'ice-cream-helpers', 'left'],
    ['crystal', 'ice-cream-helpers', 'right'],
    ['yellow', 'cleaning-helpers', 'top'],
    ['mint', 'cleaning-helpers', 'bottom'],
    ['cyan', 'painting-helpers', 'left'],
    ['heart', 'painting-helpers', 'right'],
  ]) {
    const src = `data:image/png;base64,${(await readFile(new URL(`${source}.png`, dir))).toString('base64')}`
    const data = await page.evaluate(
      async ({ src, name, side }) => {
        const image = new Image()
        image.src = src
        await image.decode()
        const canvas = document.createElement('canvas')
        canvas.width = image.width
        canvas.height = image.height
        const ctx = canvas.getContext('2d')
        ctx.drawImage(image, 0, 0)
        if (side) {
          ctx.globalCompositeOperation = 'destination-in'
          const mask = new Path2D()
          if (side === 'left') mask.rect(0, 0, image.width * 0.51, image.height)
          if (side === 'right')
            mask.rect(image.width * 0.51, 0, image.width * 0.49, image.height)
          if (side === 'top' || side === 'bottom') {
            const edge = [
              [0, 0.59],
              [0.4, 0.57],
              [0.44, 0.43],
              [0.53, 0.37],
              [0.61, 0.33],
              [0.8, 0.31],
              [1, 0.31],
            ]
            mask.moveTo(0, side === 'top' ? 0 : image.height)
            mask.lineTo(image.width, side === 'top' ? 0 : image.height)
            for (const [x, y] of [...edge].reverse())
              mask.lineTo(x * image.width, y * image.height)
            mask.closePath()
          }
          ctx.fill(mask)
          ctx.globalCompositeOperation = 'source-over'
        }
        let box = [0, 0, image.width, image.height]
        if (name !== 'background') {
          const pixels = ctx.getImageData(0, 0, image.width, image.height).data
          let x0 = image.width,
            y0 = image.height,
            x1 = 0,
            y1 = 0
          for (let y = 0; y < image.height; y++)
            for (let x = 0; x < image.width; x++)
              if (pixels[(y * image.width + x) * 4 + 3] > 12) {
                x0 = Math.min(x0, x)
                y0 = Math.min(y0, y)
                x1 = Math.max(x1, x)
                y1 = Math.max(y1, y)
              }
          box = [x0, y0, x1 - x0 + 1, y1 - y0 + 1]
        }
        const out = document.createElement('canvas')
        const scale = Math.min(1, (name === 'background' ? 1672 : 900) / box[2])
        out.width = Math.round(box[2] * scale)
        out.height = Math.round(box[3] * scale)
        out
          .getContext('2d')
          .drawImage(canvas, ...box, 0, 0, out.width, out.height)
        return out.toDataURL('image/webp', 0.95).split(',')[1]
      },
      { src, name, side }
    )
    await writeFile(new URL(`${name}.webp`, dir), Buffer.from(data, 'base64'))
  }
} finally {
  await browser.close()
}

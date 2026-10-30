// Preserve the generated alpha while making web-sized runtime assets.
import { chromium } from '@playwright/test'
import { readFile, writeFile } from 'node:fs/promises'
const dir = new URL('../src/assets/comic/layers/cleaning/', import.meta.url)
const browser = await chromium.launch()
try {
  const page = await browser.newPage()
  for (const name of ['background', 'yellow-duster', 'mint-mop']) {
    const src = `data:image/png;base64,${(await readFile(new URL(`${name}.png`, dir))).toString('base64')}`
    const data = await page.evaluate(
      async ({ src, name }) => {
        const image = new Image()
        image.src = src
        await image.decode()
        const canvas = document.createElement('canvas')
        const scale = Math.min(
          1,
          (name === 'background' ? 1672 : 950) / image.width
        )
        canvas.width = Math.round(image.width * scale)
        canvas.height = Math.round(image.height * scale)
        canvas
          .getContext('2d')
          .drawImage(image, 0, 0, canvas.width, canvas.height)
        return canvas.toDataURL('image/webp', 0.94).split(',')[1]
      },
      { src, name }
    )
    await writeFile(new URL(`${name}.webp`, dir), Buffer.from(data, 'base64'))
  }
} finally {
  await browser.close()
}

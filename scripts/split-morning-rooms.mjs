// Extract the six rooms from the original artwork without redrawing characters.
import { chromium } from '@playwright/test'
import { readFile, mkdir, writeFile } from 'node:fs/promises'

const root = new URL('../', import.meta.url)
const source = new URL(
  'src/assets/comic/opening/31a-morning-wake-up.webp',
  root
)
const output = new URL('src/assets/comic/opening/morning-rooms/', root)
const rooms = [
  ['odette-rainbow', 12, 13, 491, 478],
  ['primarina-aquafox', 522, 13, 490, 478],
  ['tangy-sweet', 12, 507, 491, 468],
  ['eclipse-diana', 522, 507, 490, 468],
  ['hopping-doremi', 12, 989, 491, 534],
  ['little-helpers', 522, 989, 490, 534],
]
await mkdir(output, { recursive: true })
const browser = await chromium.launch()
try {
  const page = await browser.newPage()
  const src = `data:image/webp;base64,${(await readFile(source)).toString('base64')}`
  for (const [name, x, y, width, height] of rooms) {
    const data = await page.evaluate(
      async ({ src, x, y, width, height }) => {
        const image = new Image()
        image.src = src
        await image.decode()
        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height
        canvas
          .getContext('2d')
          .drawImage(image, x, y, width, height, 0, 0, width, height)
        return canvas.toDataURL('image/png').split(',')[1]
      },
      { src, x, y, width, height }
    )
    await writeFile(new URL(`${name}.png`, output), Buffer.from(data, 'base64'))
  }
} finally {
  await browser.close()
}

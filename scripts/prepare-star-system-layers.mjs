import { chromium } from '@playwright/test'
import { readFile, writeFile } from 'node:fs/promises'

const dir = new URL('../src/assets/comic/layers/star-system/', import.meta.url)
// Bounds measured on the generated sheet, normalized from its preview dimensions.
const sprites = [
  ['rainbow-planet', 10, 65, 305, 210],
  ['flower-globe', 322, 60, 273, 220],
  ['yellow-planet', 600, 85, 235, 180],
  ['green-planet', 865, 90, 225, 195],
  ['purple-planet', 1110, 70, 285, 200],
  ['umbrella', 5, 303, 275, 265],
  ['lightning', 280, 340, 284, 235],
  ['gift', 564, 367, 305, 208],
  ['bubble', 864, 307, 268, 293],
  ['moon', 1136, 335, 266, 248],
  ['bunny', 35, 585, 255, 270],
  ['spotted-planet', 325, 663, 240, 160],
  ['purple-moons', 601, 630, 229, 167],
  ['droplet', 902, 637, 194, 203],
  ['gem', 1178, 628, 186, 180],
  ['checkerboard', 22, 853, 260, 256],
  ['cards', 282, 874, 312, 234],
]
const browser = await chromium.launch()
try {
  const page = await browser.newPage()
  for (const entry of [['background', 0, 0, 1402, 1122], ...sprites]) {
    const [name, x, y, w, h] = entry
    const src = `data:image/png;base64,${(await readFile(new URL(name === 'background' ? 'background.png' : 'satellites.png', dir))).toString('base64')}`
    const data = await page.evaluate(
      async ({ src, name, x, y, w, h }) => {
        const image = new Image()
        image.src = src
        await image.decode()
        const canvas = document.createElement('canvas')
        const sx = (x * image.width) / 1402
        const sy = (y * image.height) / 1122
        const sw = (w * image.width) / 1402
        const sh = (h * image.height) / 1122
        const scale = Math.min(1, (name === 'background' ? 1672 : 500) / sw)
        canvas.width = Math.round(sw * scale)
        canvas.height = Math.round(sh * scale)
        canvas
          .getContext('2d')
          .drawImage(image, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height)
        return canvas.toDataURL('image/webp', 0.94).split(',')[1]
      },
      { src, name, x, y, w, h }
    )
    await writeFile(new URL(`${name}.webp`, dir), Buffer.from(data, 'base64'))
  }
} finally {
  await browser.close()
}

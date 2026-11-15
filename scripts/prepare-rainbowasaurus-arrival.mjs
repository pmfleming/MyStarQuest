import { chromium } from '@playwright/test'
import { readFile, writeFile } from 'node:fs/promises'

const assets = new URL('../src/assets/', import.meta.url)
const background = await readFile(
  new URL('comic/layers/rainbowasaurus-arrival/background.png', assets)
)
const princess = await readFile(
  new URL('dinosaurs/cartoon/princess-rainbowasaurus.png', assets)
)
const browser = await chromium.launch()
try {
  const page = await browser.newPage()
  // Export the animation's resting frame as the accessible, failure-safe page.
  // These coordinates match storyRainbowasaurusArrivalScene.css.
  const outputs = await page.evaluate(
    async ({ background, princess }) => {
      async function load(data) {
        const image = new Image()
        image.src = `data:image/png;base64,${data}`
        await image.decode()
        return image
      }
      const [plate, actor] = await Promise.all([
        load(background),
        load(princess),
      ])
      const canvas = document.createElement('canvas')
      canvas.width = 1672
      canvas.height = 941
      const ctx = canvas.getContext('2d')
      ctx.drawImage(plate, 0, 0, canvas.width, canvas.height)
      const backgroundWebp = canvas.toDataURL('image/webp', 0.94).split(',')[1]
      const cx = canvas.width * 0.54
      const cy = canvas.height * 0.81
      const rx = canvas.width * 0.14
      const ry = canvas.height * 0.02
      ctx.save()
      ctx.translate(cx, cy)
      ctx.scale(rx, ry)
      const shadow = ctx.createRadialGradient(0, 0, 0, 0, 0, 0.7)
      shadow.addColorStop(0, '#64507755')
      shadow.addColorStop(1, '#64507700')
      ctx.fillStyle = shadow
      ctx.fillRect(-1, -1, 2, 2)
      ctx.restore()
      const width = canvas.width * 0.6
      const height = (width * actor.height) / actor.width
      ctx.drawImage(
        actor,
        cx - width / 2,
        canvas.height * 0.37 - height / 2,
        width,
        height
      )
      return {
        backgroundWebp,
        restingFrame: canvas.toDataURL('image/webp', 0.94).split(',')[1],
      }
    },
    {
      background: background.toString('base64'),
      princess: princess.toString('base64'),
    }
  )
  await writeFile(
    new URL('comic/layers/rainbowasaurus-arrival/background.webp', assets),
    Buffer.from(outputs.backgroundWebp, 'base64')
  )
  await writeFile(
    new URL('comic/opening/62-rainbowasaurus-arrival.webp', assets),
    Buffer.from(outputs.restingFrame, 'base64')
  )
} finally {
  await browser.close()
}

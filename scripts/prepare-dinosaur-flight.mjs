import { chromium } from '@playwright/test'
import { copyFile, mkdir, readFile, writeFile } from 'node:fs/promises'

const root = new URL('../', import.meta.url)
const references = new URL('src/assets/comic/references/dinosaur-flight/', root)
const layers = new URL('src/assets/comic/layers/rainbowasaurus-flight/', root)
const layout = JSON.parse(
  await readFile(
    new URL('src/data/stories/dinosaurFlightLayout.json', root),
    'utf8'
  )
)
const manifest = JSON.parse(
  await readFile(
    new URL('docs/assets/2026-11-01-dinosaur-flight.json', root),
    'utf8'
  )
)
await mkdir(references, { recursive: true })
await mkdir(layers, { recursive: true })
const sources = {}
for (const asset of manifest.selectedAssets) {
  const destination = new URL(`${asset.name}.png`, references)
  try {
    await readFile(destination)
  } catch {
    await copyFile(asset.generatedSource, destination)
  }
  sources[asset.name] = (await readFile(destination)).toString('base64')
}
const dinosaurIds = [
  ...new Set(layout.flatMap((scene) => scene.visitors.map((v) => v.id))),
]
for (const id of dinosaurIds) {
  sources[`dinosaur-${id}`] = (
    await readFile(new URL(`src/assets/dinosaurs/cartoon/${id}.png`, root))
  ).toString('base64')
}
const browser = await chromium.launch()
try {
  const page = await browser.newPage()
  const outputs = await page.evaluate(
    async ({ sources, layout }) => {
      const output = {}
      const sprites = new Set([
        'boarding',
        'riding',
        'riding-lookdown',
        'diana-riding',
        'eclipse-riding',
        ...Object.keys(sources).filter((name) => name.startsWith('dinosaur-')),
      ])
      const images = {}
      for (const [name, base64] of Object.entries(sources)) {
        const source = new Image()
        source.src = `data:image/png;base64,${base64}`
        await source.decode()
        const canvas = document.createElement('canvas')
        let crop = [0, 0, source.width, source.height]
        if (sprites.has(name)) {
          canvas.width = source.width
          canvas.height = source.height
          const ctx = canvas.getContext('2d')
          ctx.drawImage(source, 0, 0)
          const rgba = ctx.getImageData(0, 0, source.width, source.height).data
          let x0 = source.width,
            y0 = source.height,
            x1 = 0,
            y1 = 0
          for (let y = 0; y < source.height; y++) {
            for (let x = 0; x < source.width; x++) {
              if (rgba[(y * source.width + x) * 4 + 3] > 24) {
                x0 = Math.min(x0, x)
                y0 = Math.min(y0, y)
                x1 = Math.max(x1, x)
                y1 = Math.max(y1, y)
              }
            }
          }
          x0 = Math.max(0, x0 - 8)
          y0 = Math.max(0, y0 - 8)
          x1 = Math.min(source.width - 1, x1 + 8)
          y1 = Math.min(source.height - 1, y1 + 8)
          crop = [x0, y0, x1 - x0 + 1, y1 - y0 + 1]
          const scale = Math.min(
            1,
            (name.startsWith('dinosaur-') ? 900 : 1400) / crop[2]
          )
          canvas.width = Math.round(crop[2] * scale)
          canvas.height = Math.round(crop[3] * scale)
        } else {
          canvas.width = 1672
          canvas.height = 941
        }
        canvas
          .getContext('2d')
          .drawImage(source, ...crop, 0, 0, canvas.width, canvas.height)
        const url = canvas.toDataURL('image/webp', 0.94)
        output[`layers/${name}.webp`] = url.split(',')[1]
        const image = new Image()
        image.src = url
        await image.decode()
        images[name] = image
      }
      for (const scene of layout) {
        const canvas = document.createElement('canvas')
        canvas.width = 1672
        canvas.height = 941
        const ctx = canvas.getContext('2d')
        ctx.drawImage(
          images[scene.background],
          0,
          0,
          canvas.width,
          canvas.height
        )
        function place(name, actor, visitor = false) {
          const image = images[name]
          const width = (canvas.width * actor.width) / 100
          const height = (width * image.height) / image.width
          ctx.save()
          ctx.translate(
            (canvas.width * actor.x) / 100,
            (canvas.height * actor.bottom) / 100
          )
          if (actor.flip) ctx.scale(-1, 1)
          if (visitor) {
            if (scene.background === 'lagoon') {
              ctx.globalAlpha = 0.9
              ctx.filter = 'drop-shadow(0 12px 10px #067a9555)'
            } else ctx.filter = 'drop-shadow(0 5px 3px #36342b22)'
          }
          ctx.drawImage(image, -width / 2, -height, width, height)
          ctx.restore()
        }
        scene.visitors.forEach((visitor) =>
          place(`dinosaur-${visitor.id}`, visitor, true)
        )
        output[`layers/${scene.id}-landscape.webp`] = canvas
          .toDataURL('image/webp', 0.94)
          .split(',')[1]
        scene.companions.forEach((member) =>
          place(`${member.id}-riding`, member)
        )
        place(
          scene.mode === 'boarding'
            ? 'boarding'
            : scene.mode === 'tour'
              ? 'riding-lookdown'
              : 'riding',
          scene.rider
        )
        output[`opening/${scene.id}.webp`] = canvas
          .toDataURL('image/webp', 0.94)
          .split(',')[1]
      }
      return output
    },
    { sources, layout }
  )
  for (const [name, data] of Object.entries(outputs)) {
    const destination = name.startsWith('layers/')
      ? new URL(name.slice(7), layers)
      : new URL(`src/assets/comic/${name}`, root)
    await writeFile(destination, Buffer.from(data, 'base64'))
  }
  console.log(
    `Prepared ${Object.keys(outputs).length} animation layers and resting frames for ${layout.length} story pages.`
  )
} finally {
  await browser.close()
}

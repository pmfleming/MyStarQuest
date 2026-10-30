import { chromium } from '@playwright/test'
import { readFile, writeFile, mkdir } from 'node:fs/promises'
const source = await readFile('src/data/stories/seaFriends.ts', 'utf8')
const imports = Object.fromEntries(
  [...source.matchAll(/import (\w+) from '([^']+\.(?:webp|png))'/g)].map(
    (m) => [
      m[1],
      new URL(
        m[2],
        new URL('../src/data/stories/seaFriends.ts', import.meta.url)
      ),
    ]
  )
)
const panels = [
  ...source.matchAll(/id: '([^']+)'[\s\S]*?image: (\w+),/g),
].filter((m) => imports[m[2]])
await mkdir('output/sparkle-review', { recursive: true })
const browser = await chromium.launch()
try {
  const page = await browser.newPage()
  for (let start = 0; start < panels.length; start += 16) {
    const entries = await Promise.all(
      panels.slice(start, start + 16).map(async (m) => ({
        id: m[1],
        src: `data:image/webp;base64,${(await readFile(imports[m[2]])).toString('base64')}`,
      }))
    )
    const data = await page.evaluate(async (entries) => {
      const canvas = document.createElement('canvas')
      canvas.width = 1600
      canvas.height = 1040
      const ctx = canvas.getContext('2d')
      ctx.fillStyle = '#fff'
      ctx.fillRect(0, 0, 1600, 1040)
      for (let i = 0; i < entries.length; i++) {
        const img = new Image()
        img.src = entries[i].src
        await img.decode()
        const x = (i % 4) * 400,
          y = Math.floor(i / 4) * 260
        ctx.drawImage(img, x, y, 400, 225)
        ctx.fillStyle = '#111'
        ctx.font = '16px sans-serif'
        ctx.fillText(entries[i].id, x + 5, y + 246)
      }
      return canvas.toDataURL('image/png').split(',')[1]
    }, entries)
    await writeFile(
      `output/sparkle-review/pages-${start}.png`,
      Buffer.from(data, 'base64')
    )
  }
} finally {
  await browser.close()
}

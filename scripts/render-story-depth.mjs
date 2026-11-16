import { chromium } from '@playwright/test'
import { createServer } from 'vite'
import { readFile, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { resolve } from 'node:path'

/** Bake the runtime composition for reduced motion, loading, and failed-layer fallback. */
export async function renderStoryDepth(ids) {
  const root = new URL('../', import.meta.url)
  const server = await createServer({
    server: { host: '127.0.0.1', port: 0, strictPort: false },
  })
  await server.listen()
  const browser = await chromium.launch()
  try {
    const page = await browser.newPage({
      deviceScaleFactor: 1,
      reducedMotion: 'reduce',
    })
    await page.route('**/depth-export', (route) =>
      route.fulfill({
        contentType: 'text/html',
        body: '<!doctype html><html><head></head><body style="margin:0"></body></html>',
      })
    )
    await page.goto(`${server.resolvedUrls.local[0]}depth-export`)
    const panels = await page.evaluate(async () => {
      const { story } = await import('/src/data/stories/seaFriends.ts')
      const { getStorySceneFactory } = await import('/src/lib/storyScenes.ts')
      return story.panels
        .filter((panel) => getStorySceneFactory(panel.effect))
        .map((panel) => ({
          id: panel.id,
          effect: panel.effect,
          ratio: panel.aspectRatio,
          path: new URL(panel.image, location.href).pathname.slice(1),
        }))
    })
    for (const panel of panels.filter(
      (panel) => !ids || ids.includes(panel.id)
    )) {
      const width =
        panel.ratio === 1.5 ? 1536 : panel.ratio === 1448 / 1086 ? 1448 : 1672
      const height = Math.round(width / panel.ratio)
      await page.setViewportSize({ width, height })
      await page.emulateMedia({
        reducedMotion:
          panel.effect === 'underwater-meeting' ? 'no-preference' : 'reduce',
      })
      await page.evaluate(
        async ({ id, effect, width, height }) => {
          window.depthExportScene?.dispose()
          document.body.replaceChildren()
          const host = document.createElement('div')
          Object.assign(host.style, {
            position: 'relative',
            width: `${width}px`,
            height: `${height}px`,
          })
          host.style.setProperty('--paper-inset', '0px')
          document.body.append(host)
          const { getStorySceneFactory } =
            await import('/src/lib/storyScenes.ts')
          const scene = getStorySceneFactory(effect)(host)
          window.depthExportScene = scene
          await scene.show(id)
          const stage = host.firstElementChild
          if (!stage.classList.contains('ready'))
            throw new Error(`Could not render ${id}`)
          for (const animation of stage.getAnimations({ subtree: true })) {
            animation.pause()
            const timing = animation.effect.getTiming()
            animation.currentTime =
              timing.iterations === Infinity ? 0 : Number(timing.duration)
          }
        },
        { ...panel, width, height }
      )
      const png = await page.screenshot()
      const encoded = await page.evaluate(async (base64) => {
        const image = new Image()
        image.src = `data:image/png;base64,${base64}`
        await image.decode()
        const canvas = document.createElement('canvas')
        canvas.width = image.width
        canvas.height = image.height
        canvas.getContext('2d').drawImage(image, 0, 0)
        return canvas.toDataURL('image/webp', 0.95).split(',')[1]
      }, png.toString('base64'))
      if (!panel.path.startsWith('src/assets/comic/opening/'))
        throw new Error(`Unexpected artwork path ${panel.path}`)
      const destination = new URL(panel.path, root)
      const bytes = Buffer.from(encoded, 'base64')
      const existing = await readFile(destination)
      if (!existing.equals(bytes)) await writeFile(destination, bytes)
      console.log(`Rendered ${panel.id} (${width}x${height})`)
    }
  } finally {
    await browser.close()
    await server.close()
  }
}

if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  await renderStoryDepth()
}

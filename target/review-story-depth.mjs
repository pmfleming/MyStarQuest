import { chromium } from '@playwright/test'
import { writeFile } from 'node:fs/promises'
const browser = await chromium.launch()
try {
  const page = await browser.newPage({ viewport: { width: 1500, height: 1500 } })
  await page.goto('http://127.0.0.1:4187/tests/fixtures/story-reader.html')
  const panels = await page.evaluate(async () => {
    const { story } = await import('/src/data/stories/seaFriends.ts')
    const { getStorySceneFactory } = await import('/src/lib/storyScenes.ts')
    return story.panels.flatMap((panel, index) => getStorySceneFactory(panel.effect) ? [{ page: index + 1, id: panel.id, effect: panel.effect, image: panel.image }] : [])
  })
  await writeFile('docs/assets/2026-11-16-story-depth.json', JSON.stringify({
    rendering: 'Background, independent midground, existing character artwork, foreground scenery. Preserve complete painted composition during page transitions.',
    regenerate: 'node scripts/render-story-depth.mjs',
    generatedScenery: 'docs/assets/2026-11-16-dinosaur-depth.json',
    additionalReview: { photoMoment: 'Existing glove artwork sits above the arriving photograph.', morningRooms: 'Full composed room illustrations; preserve their grid during page turns.' },
    pages: panels.map(({ image, ...panel }) => ({ ...panel, image: image.split('?')[0].replace(/^\//, '') })),
  }, null, 2) + '\n')
  for (let n = 0; n < 2; n++) {
    await page.evaluate(async (panels) => {
      document.head.insertAdjacentHTML('beforeend', '<style>body{margin:0!important;padding:12px!important;background:#253240!important;color:white!important}#audit{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;font:14px sans-serif}#audit figure{margin:0}#audit img{display:block;width:100%;height:250px;object-fit:contain;background:#111}#audit figcaption{padding:5px}</style>')
      document.body.innerHTML = '<div id="audit"></div>'
      const grid = document.querySelector('#audit')
      panels.forEach((panel) => {
        const figure = document.createElement('figure')
        const image = document.createElement('img')
        image.src = panel.image
        const label = document.createElement('figcaption')
        label.textContent = `${panel.page}: ${panel.id}`
        figure.append(image, label)
        grid.append(figure)
      })
      await Promise.all(Array.from(grid.querySelectorAll('img'), (image) => image.decode()))
    }, panels.slice(n * 14, (n + 1) * 14))
    await page.screenshot({ path: `target/story-depth-review-${n + 1}.png`, fullPage: true })
  }
} finally { await browser.close() }

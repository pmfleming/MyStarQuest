import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { resolve } from 'node:path'
import { renderStoryDepth } from './render-story-depth.mjs'

/** Keep the dinosaur artwork preparation commands on the shared scene exporter. */
export async function renderDinosaurDepth(ids) {
  const layout = JSON.parse(
    await readFile(
      new URL('../src/data/stories/dinosaurFlightLayout.json', import.meta.url),
      'utf8'
    )
  )
  await renderStoryDepth(
    ids ?? ['62-rainbowasaurus-arrival', ...layout.map((scene) => scene.id)]
  )
}

if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  await renderDinosaurDepth()
}

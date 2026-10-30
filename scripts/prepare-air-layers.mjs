// Extract and resize existing overlay artwork; preserve character proportions/alpha.
import { chromium } from '@playwright/test'
import { readFile, writeFile, mkdir } from 'node:fs/promises'
const root = new URL('../src/assets/', import.meta.url)
const output = new URL('comic/layers/air/', root)
await mkdir(output, { recursive: true })
const browser = await chromium.launch()
const page = await browser.newPage()
const metadata = {}
async function extract(name, path, mode = 'character', shape) {
  const bytes = await readFile(new URL(path, root))
  const src = `data:image/${path.endsWith('.webp') ? 'webp' : 'png'};base64,${bytes.toString('base64')}`
  const result = await page.evaluate(
    async ({ src, mode, shape }) => {
      const image = new Image()
      image.src = src
      await image.decode()
      const canvas = document.createElement('canvas')
      canvas.width = image.width
      canvas.height = image.height
      const ctx = canvas.getContext('2d')
      ctx.drawImage(image, 0, 0)
      let bounds = [0, 0, canvas.width, canvas.height]
      if (mode === 'character') {
        const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height)
        let x0 = canvas.width,
          y0 = canvas.height,
          x1 = 0,
          y1 = 0
        for (let y = 0; y < canvas.height; y++)
          for (let x = 0; x < canvas.width; x++) {
            if (data[(y * canvas.width + x) * 4 + 3] > 8) {
              x0 = Math.min(x0, x)
              y0 = Math.min(y0, y)
              x1 = Math.max(x1, x)
              y1 = Math.max(y1, y)
            }
          }
        bounds = [x0, y0, x1 - x0 + 1, y1 - y0 + 1]
      }
      if (mode === 'seat') {
        ctx.globalCompositeOperation = 'destination-in'
        ctx.fillStyle = 'black'
        ctx.fill(new Path2D(shape.path))
        bounds = shape.bounds
      }
      if (mode === 'bridge') {
        const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height)
        for (let y = 0; y < canvas.height; y++)
          for (let x = 0; x < canvas.width; x++) {
            const i = (y * canvas.width + x) * 4,
              [r, g, b] = pixels.data.slice(i, i + 3)
            if (!(
              y >= 420 &&
              y <= 653 &&
              x >= 230 &&
              x <= 1270 &&
              r > 135 &&
              g > 65 &&
              r > g * 1.08 &&
              g > b * 1.25
            ))
              pixels.data[i + 3] = 0
          }
        ctx.putImageData(pixels, 0, 0)
      }
      const trimmed = document.createElement('canvas')
      const scale = mode === 'character' ? Math.min(1, 700 / bounds[3]) : 1
      trimmed.width = Math.round(bounds[2] * scale)
      trimmed.height = Math.round(bounds[3] * scale)
      trimmed
        .getContext('2d')
        .drawImage(canvas, ...bounds, 0, 0, trimmed.width, trimmed.height)
      return {
        data: trimmed.toDataURL('image/webp', 0.95).split(',')[1],
        width: trimmed.width,
        height: trimmed.height,
      }
    },
    { src, mode, shape }
  )
  await writeFile(
    new URL(`${name}.webp`, output),
    Buffer.from(result.data, 'base64')
  )
  metadata[name] = { width: result.width, height: result.height }
}
try {
  for (const [name, path] of Object.entries({
    odette: 'teenie/angel-odette-ping.png',
    eclipse: 'teenie/eclipse.webp',
    diana: 'teenie/diana.webp',
    aurora: 'comic/references/sky-visitors/aururo.png',
    green: 'comic/references/sky-visitors/mystery-1.png',
    turtle: 'comic/references/sky-visitors/mystery-2.png',
    hammer: 'comic/references/sky-visitors/mystery-3.png',
    dragon: 'comic/references/sky-visitors/mystery-4.png',
    coral: 'comic/references/helpers/coral.png',
    crystal: 'comic/references/helpers/crystal.png',
    yellow: 'comic/references/helpers/yellow.png',
    curl: 'comic/references/helpers/mint-curl.png',
    lilac: 'comic/references/helpers/lilac.png',
    mint: 'comic/references/helpers/mint.png',
    heart: 'comic/references/helpers/heart.png',
  }))
    await extract(name, path)
  for (const id of [
    '38-rainbow-slide',
    '40-rainbow-stepping-stones',
    '41-cloud-roundabout',
    '42-cloud-trampolines',
    '43-climbing-bridge',
  ])
    await extract(
      id,
      `comic/references/playground-closeups/${id}.png`,
      'background'
    )
  await extract(
    '37-playground-surprise',
    'comic/references/sky-visitors/playground.png',
    'background'
  )
  await extract(
    '39-shell-swings',
    'comic/layers/air/swings-empty-source.png',
    'background'
  )
  // Seat silhouettes from the original artwork; chains are separate SVG lines at runtime.
  await extract(
    'seat-left',
    'comic/references/playground-closeups/39-shell-swings.png',
    'seat',
    {
      path: 'M 463 680 C 455 663 464 655 478 656 C 483 637 487 615 503 612 C 516 607 521 622 528 616 C 529 599 551 593 564 601 C 578 586 591 597 604 614 C 616 601 637 618 642 637 C 648 643 649 658 657 660 C 680 659 697 672 697 687 C 695 699 682 703 675 707 C 663 755 627 775 579 775 C 527 773 489 756 477 714 C 467 709 459 699 463 680 Z',
      bounds: [455, 590, 245, 190],
    }
  )
  await extract(
    'seat-right',
    'comic/references/playground-closeups/39-shell-swings.png',
    'seat',
    {
      path: 'M 764 673 C 765 658 778 657 789 655 C 792 635 801 615 815 612 C 825 607 832 618 838 617 C 843 597 857 592 872 602 C 886 588 901 597 913 613 C 924 603 942 614 946 634 C 956 638 962 653 964 660 C 984 659 1002 674 1001 687 C 998 698 986 704 978 704 C 966 752 929 775 879 776 C 828 772 793 755 779 712 C 763 709 755 693 764 673 Z',
      bounds: [755, 590, 250, 190],
    }
  )
  await extract(
    'bridge-foreground',
    'comic/references/playground-closeups/43-climbing-bridge.png',
    'bridge'
  )
  await writeFile(
    new URL('sizes.json', output),
    JSON.stringify(metadata, null, 2) + '\n'
  )
} finally {
  await browser.close()
}

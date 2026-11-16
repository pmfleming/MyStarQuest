# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: story-dinosaur-flight.spec.ts >> all three mounted friends take off, swoop between pages, and visit every habitat (390)
- Location: tests\e2e\story-dinosaur-flight.spec.ts:135:3

# Error details

```
Error: page.goto: net::ERR_CONNECTION_REFUSED at http://127.0.0.1:4187/tests/fixtures/story-reader.html
Call log:
  - navigating to "http://127.0.0.1:4187/tests/fixtures/story-reader.html", waiting until "load"

```

# Test source

```ts
  1   | import { expect, test, type Page } from '@playwright/test'
  2   | import layout from '../../src/data/stories/dinosaurFlightLayout.json' with { type: 'json' }
  3   |
  4   | async function openFlight(page: Page, offset = 0) {
> 5   |   await page.goto('/tests/fixtures/story-reader.html')
      |              ^ Error: page.goto: net::ERR_CONNECTION_REFUSED at http://127.0.0.1:4187/tests/fixtures/story-reader.html
  6   |   const reader = page.getByRole('dialog')
  7   |   await page.getByRole('button', { name: 'Read Sea friends' }).click()
  8   |   await expect(reader).toHaveAttribute('data-story-opening', 'false')
  9   |   const show = page.getByRole('button', { name: 'Show story controls' })
  10  |   if (await show.isVisible()) await show.click()
  11  |   const slider = page.getByRole('slider', { name: 'Story progress' })
  12  |   await slider.fill(
  13  |     String(
  14  |       Number(await slider.getAttribute('max')) - layout.length + 1 + offset
  15  |     )
  16  |   )
  17  |   await expect(page.locator('.dinosaur-flight-scene.ready.flying')).toHaveCount(
  18  |     1
  19  |   )
  20  |   const hide = page.getByRole('button', { name: 'Hide story controls' })
  21  |   if (await hide.isVisible()) await hide.click()
  22  |   await reader.focus()
  23  | }
  24  |
  25  | async function finishBridge(page: Page) {
  26  |   const bridge = page.locator(
  27  |     '.story-transition[data-transition="dinosaur-flight"]'
  28  |   )
  29  |   await expect(bridge).toHaveAttribute('data-ready', 'true')
  30  |   await expect(bridge.locator('.dinosaur-flight-bridge-rider')).toHaveCount(3)
  31  |   await bridge.evaluate((element) =>
  32  |     element.getAnimations({ subtree: true }).forEach((animation) => {
  33  |       animation.pause()
  34  |       animation.currentTime = Number(animation.effect!.getTiming().duration) - 1
  35  |     })
  36  |   )
  37  |   const landing = await bridge
  38  |     .locator('.dinosaur-flight-bridge-rider > img:first-child')
  39  |     .evaluateAll((images) =>
  40  |       images.map((image) => {
  41  |         const rect = image.getBoundingClientRect()
  42  |         return {
  43  |           id: (image.parentElement as HTMLElement).dataset.rider,
  44  |           x: rect.x,
  45  |           y: rect.y,
  46  |           width: rect.width,
  47  |           height: rect.height,
  48  |         }
  49  |       })
  50  |     )
  51  |   const checkComposition = /dinosaur-meadow|dinosaur-cloud-flight/.test(
  52  |     (await bridge.getAttribute('data-destination'))!
  53  |   )
  54  |   const lastFrame = checkComposition
  55  |     ? await bridge
  56  |         .locator('.story-paper-illustration')
  57  |         .screenshot({ path: test.info().outputPath('handoff-before.png') })
  58  |     : null
  59  |   await bridge.evaluate((element) =>
  60  |     element
  61  |       .getAnimations({ subtree: true })
  62  |       .forEach((animation) => animation.finish())
  63  |   )
  64  |   await expect(bridge).toHaveCount(0)
  65  |   await expect(page.locator('.dinosaur-flight-scene.ready.flying')).toHaveCount(
  66  |     1
  67  |   )
  68  |   const scene = page.locator('.dinosaur-flight-scene.ready.flying')
  69  |   await scene.evaluate((element) =>
  70  |     element.getAnimations({ subtree: true }).forEach((animation) => {
  71  |       animation.pause()
  72  |       animation.currentTime = 0
  73  |     })
  74  |   )
  75  |   for (const pose of landing) {
  76  |     const settled = await scene
  77  |       .locator(`[data-rider="${pose.id}"] img`)
  78  |       .boundingBox()
  79  |     for (const axis of ['x', 'y', 'width', 'height'] as const)
  80  |       expect(
  81  |         Math.abs(settled![axis] - pose[axis]),
  82  |         `${pose.id} ${axis} at the handoff`
  83  |       ).toBeLessThan(1)
  84  |   }
  85  |   if (lastFrame) {
  86  |     const settledFrame = await page
  87  |       .locator('.story-page-surface > .story-paper-illustration')
  88  |       .screenshot({ path: test.info().outputPath('handoff-after.png') })
  89  |     const difference = await page.evaluate(
  90  |       async ([before, after]) => {
  91  |         async function pixels(base64: string) {
  92  |           const image = new Image()
  93  |           image.src = `data:image/png;base64,${base64}`
  94  |           await image.decode()
  95  |           const canvas = document.createElement('canvas')
  96  |           // Ignore fractional device-pixel resampling at the paper edge.
  97  |           canvas.width = 320
  98  |           canvas.height = Math.round((320 * image.height) / image.width)
  99  |           const context = canvas.getContext('2d')!
  100 |           context.drawImage(image, 0, 0, canvas.width, canvas.height)
  101 |           return context.getImageData(0, 0, canvas.width, canvas.height).data
  102 |         }
  103 |         const [a, b] = await Promise.all([pixels(before!), pixels(after!)])
  104 |         if (a.length !== b.length) return Infinity
  105 |         let error = 0
```

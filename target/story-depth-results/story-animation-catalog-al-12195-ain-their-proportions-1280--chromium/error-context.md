# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: story-animation-catalog.spec.ts >> all newly gathered scenes animate in the app and retain their proportions (1280)
- Location: tests\e2e\story-animation-catalog.spec.ts:34:3

# Error details

```
Error: expect(received).toBeCloseTo(expected, precision)

Expected: 1.7768331562167907
Received: 3.9484782898735498

Expected precision:    2
Expected difference: < 0.005
Received difference:   2.1716451336567593
```

# Page snapshot

```yaml
- generic [ref=e1]:
    - main [ref=e3]:
        - radiogroup "Test categories" [ref=e4]:
            - radio "Numbers" [ref=e5] [cursor=pointer]
            - radio "Letters" [ref=e7] [cursor=pointer]
            - radio "Trivia" [ref=e9] [cursor=pointer]
            - radio "Stories" [checked] [ref=e11] [cursor=pointer]
        - article [ref=e17]:
            - group [ref=e19]:
                - generic [ref=e20]:
                    - img "Sea friends story cover"
            - button "Read Sea friends" [ref=e23] [cursor=pointer]
    - dialog "Sea friends story reader" [ref=e24]:
        - generic [ref=e25]:
            - generic [ref=e28]:
                - img "Dingdong Ping flies into the sky playground on her rocket pack, waving and inviting Odette, Aurora and Eclipse to space. The three friends greet her eagerly beneath a glowing view of a ringed planet, moon and stars."
            - button "Previous page" [ref=e29] [cursor=pointer]
            - button "Next page" [ref=e30] [cursor=pointer]
            - generic [ref=e31]:
                - navigation "Story chapters" [ref=e32]:
                    - button "Land" [ref=e33] [cursor=pointer]
                    - button "Sea" [ref=e35] [cursor=pointer]
                    - button "Air" [ref=e37] [cursor=pointer]
                    - button "Space" [ref=e39] [cursor=pointer]
                    - button "Fossils" [ref=e41] [cursor=pointer]
                - button "Return to tests" [ref=e43] [cursor=pointer]
                - slider "Story progress" [active] [ref=e45] [cursor=pointer]: '46'
                - status "Page 47 of 73" [ref=e46]:
                    - generic [aria-hidden] [ref=e48]:
                        - strong [ref=e49]: '47'
                        - generic [ref=e50]: / 73
```

# Test source

```ts
  1   | import { expect, test, type Page } from '@playwright/test'
  2   |
  3   | async function open(page: Page) {
  4   |   await page.goto('/tests/fixtures/story-reader.html')
  5   |   await page.getByRole('button', { name: 'Read Sea friends' }).click()
  6   |   await expect(page.getByRole('dialog')).toHaveAttribute(
  7   |     'data-story-opening',
  8   |     'false'
  9   |   )
  10  |   const controls = page.getByRole('button', { name: 'Show story controls' })
  11  |   if (await controls.isVisible()) await controls.click()
  12  | }
  13  |
  14  | async function jump(page: Page, index: number) {
  15  |   await page.getByRole('slider').fill(String(index))
  16  |   await expect(page.locator('.story-artwork')).toHaveAttribute(
  17  |     'aria-busy',
  18  |     'false'
  19  |   )
  20  |   await expect(page.locator('.story-page-surface')).not.toHaveClass(
  21  |     /story-transition-frame/
  22  |   )
  23  | }
  24  |
  25  | const additions = [
  26  |   [14, 'ice-cream-scene', '.ice-cream-helper', 2],
  27  |   [46, 'dingdong-arrival-scene', '.dingdong-arrival-actor', 1],
  28  |   [49, 'space-flight-scene', '.space-flight-friends', 1],
  29  |   [51, 'star-system-scene', '.star-system-spinner', 17],
  30  |   [52, 'space-flight-scene', '.space-flight-friends', 1],
  31  | ] as const
  32  |
  33  | for (const width of [1280, 390]) {
  34  |   test(`all newly gathered scenes animate in the app and retain their proportions (${width})`, async ({
  35  |     page,
  36  |   }, testInfo) => {
  37  |     test.setTimeout(60000)
  38  |     const errors: string[] = []
  39  |     page.on('pageerror', (error) => errors.push(error.message))
  40  |     await page.setViewportSize({ width, height: width === 390 ? 844 : 800 })
  41  |     await open(page)
  42  |     for (const [index, name, actor, count] of additions) {
  43  |       await jump(page, index)
  44  |       const scene = page.locator(`.${name}.ready`)
  45  |       await expect(scene).toHaveCount(1)
  46  |       await expect(scene.locator(actor)).toHaveCount(count)
  47  |       if (name === 'space-flight-scene' || name === 'dingdong-arrival-scene')
  48  |         await expect(scene).toHaveClass(/flying/)
  49  |       if (index === 52) await expect(scene).toHaveClass(/castle-flight/)
  50  |       const moving = await scene.evaluate((element) => {
  51  |         const animations = element.getAnimations({ subtree: true })
  52  |         animations.forEach((animation) => {
  53  |           animation.pause()
  54  |           animation.currentTime = 6000
  55  |         })
  56  |         return animations.length
  57  |       })
  58  |       expect(moving).toBeGreaterThan(0)
  59  |       const shape = await scene
  60  |         .locator('img')
  61  |         .last()
  62  |         .evaluate((image: HTMLImageElement) => {
  63  |           const style = getComputedStyle(image)
  64  |           return {
  65  |             rendered: parseFloat(style.width) / parseFloat(style.height),
  66  |             natural: image.naturalWidth / image.naturalHeight,
  67  |           }
  68  |         })
> 69  |       expect(shape.rendered).toBeCloseTo(shape.natural, 2)
      |                              ^ Error: expect(received).toBeCloseTo(expected, precision)
  70  |       await page.screenshot({
  71  |         path: testInfo.outputPath(`${index}-${name}.png`),
  72  |       })
  73  |       await page.emulateMedia({ reducedMotion: 'reduce' })
  74  |       await expect
  75  |         .poll(() =>
  76  |           scene.evaluate(
  77  |             (element) => element.getAnimations({ subtree: true }).length
  78  |           )
  79  |         )
  80  |         .toBe(0)
  81  |       await page.emulateMedia({ reducedMotion: 'no-preference' })
  82  |     }
  83  |     await page.getByRole('button', { name: 'Return to tests' }).click()
  84  |     await expect(page.locator('.story-effect-host')).toHaveCount(0)
  85  |     expect(errors).toEqual([])
  86  |   })
  87  | }
  88  |
  89  | test('sparkles respect quiet pages and reduced motion; slow zoom moves the paper with the art', async ({
  90  |   page,
  91  | }) => {
  92  |   await open(page)
  93  |   for (const [index, count] of [
  94  |     [0, 5],
  95  |     [54, 0],
  96  |     [55, 0],
  97  |     [60, 0],
  98  |     [63, 2],
  99  |   ]) {
  100 |     await jump(page, index!)
  101 |     await expect(page.locator('.story-sparkle')).toHaveCount(count!)
  102 |   }
  103 |   await jump(page, 28)
  104 |   await expect(page.locator('.story-sparkles')).toHaveClass(/quiet/)
  105 |   await jump(page, 2)
  106 |   const sheet = page.locator('.story-page-surface')
  107 |   const motion = await sheet.evaluate((element) => {
  108 |     const animation = element
  109 |       .getAnimations()
  110 |       .find(
  111 |         (animation) =>
  112 |           animation instanceof CSSAnimation &&
  113 |           animation.animationName === 'story-scene-breathe'
  114 |       )!
  115 |     animation.pause()
  116 |     animation.currentTime = 18000
  117 |     return {
  118 |       scale: new DOMMatrixReadOnly(getComputedStyle(element).transform).a,
  119 |       imageAnimations: element
  120 |         .querySelector('.story-page-current')!
  121 |         .getAnimations().length,
  122 |     }
  123 |   })
  124 |   expect(motion.scale).toBeCloseTo(1.012, 4)
  125 |   expect(motion.imageAnimations).toBe(0)
  126 |   await page.emulateMedia({ reducedMotion: 'reduce' })
  127 |   await expect(page.locator('.story-sparkles')).toBeHidden()
  128 |   await expect
  129 |     .poll(() => sheet.evaluate((element) => element.getAnimations().length))
  130 |     .toBe(0)
  131 | })
  132 |
  133 | test('missing new layers preserve the original page and later navigation still works', async ({
  134 |   page,
  135 | }) => {
  136 |   await page.route(
  137 |     /\/layers\/(?:ice-cream|space-flight|castle-flight|star-system|dingdong-arrival)\//,
  138 |     (route) =>
  139 |       route.request().resourceType() === 'image'
  140 |         ? route.abort()
  141 |         : route.continue()
  142 |   )
  143 |   await page.emulateMedia({ reducedMotion: 'reduce' })
  144 |   await open(page)
  145 |   for (const [index, name] of additions) {
  146 |     await jump(page, index)
  147 |     await expect(page.locator(`.${name}.ready`)).toHaveCount(0)
  148 |     await expect(page.locator('.story-page-current')).toBeVisible()
  149 |   }
  150 |   await jump(page, 63)
  151 |   await expect(page.locator('.story-page-current')).toHaveAttribute(
  152 |     'src',
  153 |     /61-fossil-dig/
  154 |   )
  155 | })
  156 |
```

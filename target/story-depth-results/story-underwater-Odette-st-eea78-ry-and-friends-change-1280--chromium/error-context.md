# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: story-underwater.spec.ts >> Odette stays stable as scenery and friends change (1280)
- Location: tests\e2e\story-underwater.spec.ts:33:3

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: expect(locator).toHaveCount(expected) failed

Locator:  locator('.underwater-scene')
Expected: 0
Received: 2

Call log:
  - Expect "toHaveCount" locator('.underwater-scene') with timeout 15000ms
  - waiting for locator('.underwater-scene')
    2 × locator resolved to 1 element
      - unexpected value "1"
    3 × locator resolved to 2 elements
      - unexpected value "2"
  - Test timeout of 30000ms exceeded.

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
            - button "Previous page" [ref=e27] [cursor=pointer]
            - button "Next page" [disabled]
            - generic [ref=e28]:
                - navigation "Story chapters" [ref=e29]:
                    - button "Land" [ref=e30] [cursor=pointer]
                    - button "Sea" [active] [ref=e32] [cursor=pointer]
                    - button "Air" [ref=e34] [cursor=pointer]
                    - button "Space" [ref=e36] [cursor=pointer]
                    - button "Fossils" [ref=e38] [cursor=pointer]
                - button "Return to tests" [ref=e40] [cursor=pointer]
                - slider "Story progress" [ref=e42] [cursor=pointer]: '72'
                - status "Page 73 of 73" [ref=e43]:
                    - generic [aria-hidden] [ref=e45]:
                        - strong [ref=e46]: '73'
                        - generic [ref=e47]: / 73
```

# Test source

```ts
  1   | import { expect, test, type Page } from '@playwright/test'
  2   |
  3   | async function openUnderwater(page: Page) {
  4   |   await page.goto('/tests/fixtures/story-reader.html')
  5   |   await page.getByRole('button', { name: 'Read Sea friends' }).click()
  6   |   await expect(page.getByRole('dialog')).toHaveAttribute(
  7   |     'data-story-opening',
  8   |     'false'
  9   |   )
  10  |   const controls = page.getByRole('button', { name: 'Show story controls' })
  11  |   if (await controls.isVisible()) await controls.click()
  12  |   await page.getByRole('button', { name: 'Sea', exact: true }).click()
  13  |   await expect(page.locator('.story-page-current')).toHaveAttribute(
  14  |     'src',
  15  |     /03-leap\.webp/
  16  |   )
  17  |   await page.keyboard.press('ArrowRight')
  18  |   await expect(page.locator('.story-page-current')).toHaveAttribute(
  19  |     'src',
  20  |     /04-transformation\.webp/
  21  |   )
  22  |   await page.keyboard.press('ArrowRight')
  23  |   await expect(page.locator('.story-page-current')).toHaveAttribute(
  24  |     'src',
  25  |     /05-rainbow\.webp/
  26  |   )
  27  | }
  28  |
  29  | for (const viewport of [
  30  |   { width: 1280, height: 800 },
  31  |   { width: 390, height: 844 },
  32  | ]) {
  33  |   test(`Odette stays stable as scenery and friends change (${viewport.width})`, async ({
  34  |     page,
  35  |   }, testInfo) => {
  36  |     const errors: string[] = []
  37  |     page.on('pageerror', (error) => errors.push(error.message))
  38  |     await page.setViewportSize(viewport)
  39  |     await openUnderwater(page)
  40  |     const scene = page.locator('.underwater-scene')
  41  |     await expect(scene).toHaveAttribute('data-panel-id', '05-rainbow')
  42  |     await page.waitForTimeout(2300)
  43  |     const odette = scene.locator('.underwater-odette')
  44  |     const originalBounds = (await odette.boundingBox())!
  45  |     await odette.evaluate((image) => {
  46  |       image.dataset.retained = 'yes'
  47  |     })
  48  |     for (const id of [
  49  |       '06-primarina-aqua',
  50  |       '07-tangy-sweet',
  51  |       '08-eclipse-diana',
  52  |       '09-hop-doremi',
  53  |     ]) {
  54  |       await page.keyboard.press('ArrowRight')
  55  |       await expect(scene).toHaveAttribute('data-panel-id', id)
  56  |       await expect(odette).toHaveAttribute('data-retained', 'yes')
  57  |       await expect(odette).toHaveCSS('transform', 'none')
  58  |       const bounds = (await odette.boundingBox())!
  59  |       for (const key of ['x', 'y', 'width', 'height'] as const)
  60  |         expect(bounds[key]).toBeCloseTo(originalBounds[key], 0)
  61  |       await expect(scene.locator('[data-outgoing]')).toHaveCount(0)
  62  |       expect(await scene.locator('img').count()).toBe(5)
  63  |       await expect(scene.locator('[data-depth="foreground"] img')).toBeVisible()
  64  |     }
  65  |     await page.waitForTimeout(700)
  66  |     await expect(scene.locator('.underwater-background')).not.toHaveCSS(
  67  |       'transform',
  68  |       'none'
  69  |     )
  70  |     await page.screenshot({
  71  |       path: testInfo.outputPath('underwater-friends.png'),
  72  |     })
  73  |     await page.keyboard.press('End')
> 74  |     await expect(scene).toHaveCount(0)
      |                         ^ Error: expect(locator).toHaveCount(expected) failed
  75  |     await expect(page.locator('.story-page-current')).toHaveAttribute(
  76  |       'src',
  77  |       /70-dinosaur-cloud-flight\.webp/
  78  |     )
  79  |     expect(errors).toEqual([])
  80  |   })
  81  | }
  82  |
  83  | test('reduced motion keeps the original page and does not fetch animation layers', async ({
  84  |   page,
  85  | }) => {
  86  |   await page.emulateMedia({ reducedMotion: 'reduce' })
  87  |   const layers: string[] = []
  88  |   page.on('request', (request) => {
  89  |     if (
  90  |       request.resourceType() === 'image' &&
  91  |       request.url().includes('/layers/underwater/')
  92  |     )
  93  |       layers.push(request.url())
  94  |   })
  95  |   await openUnderwater(page)
  96  |   await expect(page.locator('.underwater-scene')).toBeHidden()
  97  |   await expect(page.locator('.story-page-current')).toBeVisible()
  98  |   await page
  99  |     .locator('.story-page-current')
  100 |     .evaluate((image: HTMLImageElement) => image.decode())
  101 |   expect(layers).toEqual([])
  102 | })
  103 |
  104 | test('failed layers fall back to the original illustration and chapter changes remove the scene', async ({
  105 |   page,
  106 | }) => {
  107 |   await page.route('**/layers/underwater/*.webp', (route) =>
  108 |     route.request().resourceType() === 'image'
  109 |       ? route.abort()
  110 |       : route.continue()
  111 |   )
  112 |   await openUnderwater(page)
  113 |   await expect(page.locator('.underwater-scene')).toBeHidden()
  114 |   await page
  115 |     .locator('.story-page-current')
  116 |     .evaluate((image: HTMLImageElement) => image.decode())
  117 |   await page.getByRole('button', { name: 'Space', exact: true }).click()
  118 |   await expect(page.locator('.underwater-scene')).toHaveCount(0)
  119 |   await expect(page.locator('.story-page-current')).toHaveAttribute(
  120 |     'src',
  121 |     /44-dingdong-invitation-v2\.webp/
  122 |   )
  123 | })
  124 |
```

# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: story-depth.spec.ts >> page turns retain complete layered scenes and frozen poses (390)
- Location: tests\e2e\story-depth.spec.ts:4:3

# Error details

```
Error: expect(locator).toHaveAttribute(expected) failed

Locator: getByRole('dialog')
Expected: "false"
Timeout: 15000ms
Error: element(s) not found

Call log:
  - Expect "toHaveAttribute" getByRole('dialog') with timeout 15000ms
  - waiting for getByRole('dialog')

```

# Test source

```ts
  1  | import { expect, test } from '@playwright/test'
  2  |
  3  | for (const width of [1280, 390]) {
  4  |   test(`page turns retain complete layered scenes and frozen poses (${width})`, async ({
  5  |     page,
  6  |   }) => {
  7  |     test.setTimeout(90000)
  8  |     await page.setViewportSize({ width, height: width === 390 ? 844 : 800 })
  9  |     await page.goto('/tests/fixtures/story-reader.html')
  10 |     await page.getByRole('button', { name: 'Read Sea friends' }).click()
> 11 |     await expect(page.getByRole('dialog')).toHaveAttribute(
     |                                            ^ Error: expect(locator).toHaveAttribute(expected) failed
  12 |       'data-story-opening',
  13 |       'false'
  14 |     )
  15 |     const controls = page.getByRole('button', { name: 'Show story controls' })
  16 |     if (await controls.isVisible()) await controls.click()
  17 |     for (const index of [9, 14, 15, 17, 41, 46, 49, 51]) {
  18 |       await page.getByRole('slider').fill(String(index))
  19 |       await expect(page.locator('.story-artwork')).toHaveAttribute(
  20 |         'aria-busy',
  21 |         'false'
  22 |       )
  23 |       await expect(page.locator('.story-transition')).toHaveCount(0)
  24 |       const scene = page.locator('.story-page-surface [data-story-scene].ready')
  25 |       await expect(scene).toHaveCount(1)
  26 |       await expect(
  27 |         scene.locator('[data-depth="foreground"], .tidying-foreground')
  28 |       ).toHaveCount(1)
  29 |       const original = await scene.evaluate((element) => {
  30 |         element.getAnimations({ subtree: true }).forEach((animation) => {
  31 |           animation.pause()
  32 |           animation.currentTime = 1000
  33 |         })
  34 |         return Array.from(element.querySelectorAll('img'), (image) => ({
  35 |           source: image.src,
  36 |           transform: getComputedStyle(image).transform,
  37 |           clip: getComputedStyle(image).clipPath,
  38 |         }))
  39 |       })
  40 |       await page.getByRole('slider').fill(String(index + 1))
  41 |       const transition = page.locator('.story-transition')
  42 |       await expect(transition).toHaveAttribute('data-ready', 'true')
  43 |       await transition.evaluate((element) =>
  44 |         element.getAnimations({ subtree: true }).forEach((animation) => {
  45 |           animation.pause()
  46 |           animation.currentTime =
  47 |             Number(animation.effect!.getTiming().duration) / 2
  48 |         })
  49 |       )
  50 |       const snapshot = transition.locator('.transition-scene-source')
  51 |       await expect(snapshot).toHaveCount(1)
  52 |       await expect(
  53 |         snapshot.locator('[data-depth="foreground"], .tidying-foreground')
  54 |       ).toHaveCount(1)
  55 |       const frozen = await snapshot.evaluate((element) =>
  56 |         Array.from(element.querySelectorAll('img'), (image) => ({
  57 |           source: image.src,
  58 |           transform: getComputedStyle(image).transform,
  59 |           clip: getComputedStyle(image).clipPath,
  60 |         }))
  61 |       )
  62 |       expect(frozen, `page ${index + 1} keeps its artwork and poses`).toEqual(
  63 |         original
  64 |       )
  65 |       await transition.evaluate((element) =>
  66 |         element
  67 |           .getAnimations({ subtree: true })
  68 |           .forEach((animation) => animation.finish())
  69 |       )
  70 |       await expect(transition).toHaveCount(0)
  71 |     }
  72 |   })
  73 | }
  74 |
```

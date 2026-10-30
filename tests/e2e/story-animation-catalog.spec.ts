import { expect, test, type Page } from '@playwright/test'

async function open(page: Page) {
  await page.goto('/tests/fixtures/story-reader.html')
  await page.getByRole('button', { name: 'Read Sea friends' }).click()
  await expect(page.getByRole('dialog')).toHaveAttribute(
    'data-story-opening',
    'false'
  )
  const controls = page.getByRole('button', { name: 'Show story controls' })
  if (await controls.isVisible()) await controls.click()
}

async function jump(page: Page, index: number) {
  await page.getByRole('slider').fill(String(index))
  await expect(page.locator('.story-artwork')).toHaveAttribute(
    'aria-busy',
    'false'
  )
  await expect(page.locator('.story-page-surface')).not.toHaveClass(
    /story-transition-frame/
  )
}

const additions = [
  [14, 'ice-cream-scene', '.ice-cream-helper', 2],
  [46, 'dingdong-arrival-scene', '.dingdong-arrival-actor', 1],
  [49, 'space-flight-scene', '.space-flight-friends', 1],
  [51, 'star-system-scene', '.star-system-spinner', 17],
  [52, 'space-flight-scene', '.space-flight-friends', 1],
] as const

for (const width of [1280, 390]) {
  test(`all newly gathered scenes animate in the app and retain their proportions (${width})`, async ({
    page,
  }, testInfo) => {
    test.setTimeout(60000)
    const errors: string[] = []
    page.on('pageerror', (error) => errors.push(error.message))
    await page.setViewportSize({ width, height: width === 390 ? 844 : 800 })
    await open(page)
    for (const [index, name, actor, count] of additions) {
      await jump(page, index)
      const scene = page.locator(`.${name}.ready`)
      await expect(scene).toHaveCount(1)
      await expect(scene.locator(actor)).toHaveCount(count)
      if (name === 'space-flight-scene' || name === 'dingdong-arrival-scene')
        await expect(scene).toHaveClass(/flying/)
      if (index === 52) await expect(scene).toHaveClass(/castle-flight/)
      const moving = await scene.evaluate((element) => {
        const animations = element.getAnimations({ subtree: true })
        animations.forEach((animation) => {
          animation.pause()
          animation.currentTime = 6000
        })
        return animations.length
      })
      expect(moving).toBeGreaterThan(0)
      const shape = await scene
        .locator('img')
        .last()
        .evaluate((image: HTMLImageElement) => {
          const style = getComputedStyle(image)
          return {
            rendered: parseFloat(style.width) / parseFloat(style.height),
            natural: image.naturalWidth / image.naturalHeight,
          }
        })
      expect(shape.rendered).toBeCloseTo(shape.natural, 2)
      await page.screenshot({
        path: testInfo.outputPath(`${index}-${name}.png`),
      })
      await page.emulateMedia({ reducedMotion: 'reduce' })
      await expect
        .poll(() =>
          scene.evaluate(
            (element) => element.getAnimations({ subtree: true }).length
          )
        )
        .toBe(0)
      await page.emulateMedia({ reducedMotion: 'no-preference' })
    }
    await page.getByRole('button', { name: 'Return to tests' }).click()
    await expect(page.locator('.story-effect-host')).toHaveCount(0)
    expect(errors).toEqual([])
  })
}

test('sparkles respect quiet pages and reduced motion; slow zoom moves the paper with the art', async ({
  page,
}) => {
  await open(page)
  for (const [index, count] of [
    [0, 5],
    [54, 0],
    [55, 0],
    [60, 0],
    [63, 2],
  ]) {
    await jump(page, index!)
    await expect(page.locator('.story-sparkle')).toHaveCount(count!)
  }
  await jump(page, 28)
  await expect(page.locator('.story-sparkles')).toHaveClass(/quiet/)
  await jump(page, 2)
  const sheet = page.locator('.story-page-surface')
  const motion = await sheet.evaluate((element) => {
    const animation = element
      .getAnimations()
      .find(
        (animation) =>
          animation instanceof CSSAnimation &&
          animation.animationName === 'story-scene-breathe'
      )!
    animation.pause()
    animation.currentTime = 18000
    return {
      scale: new DOMMatrixReadOnly(getComputedStyle(element).transform).a,
      imageAnimations: element
        .querySelector('.story-page-current')!
        .getAnimations().length,
    }
  })
  expect(motion.scale).toBeCloseTo(1.012, 4)
  expect(motion.imageAnimations).toBe(0)
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await expect(page.locator('.story-sparkles')).toBeHidden()
  await expect
    .poll(() => sheet.evaluate((element) => element.getAnimations().length))
    .toBe(0)
})

test('missing new layers preserve the original page and later navigation still works', async ({
  page,
}) => {
  await page.route(
    /\/layers\/(?:ice-cream|space-flight|castle-flight|star-system|dingdong-arrival)\//,
    (route) =>
      route.request().resourceType() === 'image'
        ? route.abort()
        : route.continue()
  )
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await open(page)
  for (const [index, name] of additions) {
    await jump(page, index)
    await expect(page.locator(`.${name}.ready`)).toHaveCount(0)
    await expect(page.locator('.story-page-current')).toBeVisible()
  }
  await jump(page, 63)
  await expect(page.locator('.story-page-current')).toHaveAttribute(
    'src',
    /61-fossil-dig/
  )
})

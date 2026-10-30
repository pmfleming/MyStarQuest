import { expect, test, type Page } from '@playwright/test'

async function openUnderwater(page: Page) {
  await page.goto('/tests/fixtures/story-reader.html')
  await page.getByRole('button', { name: 'Read Sea friends' }).click()
  await expect(page.getByRole('dialog')).toHaveAttribute(
    'data-story-opening',
    'false'
  )
  const controls = page.getByRole('button', { name: 'Show story controls' })
  if (await controls.isVisible()) await controls.click()
  await page.getByRole('button', { name: 'Sea', exact: true }).click()
  await expect(page.locator('.story-page-current')).toHaveAttribute(
    'src',
    /03-leap\.webp/
  )
  await page.keyboard.press('ArrowRight')
  await expect(page.locator('.story-page-current')).toHaveAttribute(
    'src',
    /04-transformation\.webp/
  )
  await page.keyboard.press('ArrowRight')
  await expect(page.locator('.story-page-current')).toHaveAttribute(
    'src',
    /05-rainbow\.webp/
  )
}

for (const viewport of [
  { width: 1280, height: 800 },
  { width: 390, height: 844 },
]) {
  test(`Odette stays stable as scenery and friends change (${viewport.width})`, async ({
    page,
  }, testInfo) => {
    const errors: string[] = []
    page.on('pageerror', (error) => errors.push(error.message))
    await page.setViewportSize(viewport)
    await openUnderwater(page)
    const scene = page.locator('.underwater-scene')
    await expect(scene).toHaveAttribute('data-panel-id', '05-rainbow')
    await page.waitForTimeout(2300)
    const odette = scene.locator('.underwater-odette')
    const originalBounds = (await odette.boundingBox())!
    await odette.evaluate((image) => {
      image.dataset.retained = 'yes'
    })
    for (const id of [
      '06-primarina-aqua',
      '07-tangy-sweet',
      '08-eclipse-diana',
      '09-hop-doremi',
    ]) {
      await page.keyboard.press('ArrowRight')
      await expect(scene).toHaveAttribute('data-panel-id', id)
      await expect(odette).toHaveAttribute('data-retained', 'yes')
      await expect(odette).toHaveCSS('transform', 'none')
      const bounds = (await odette.boundingBox())!
      for (const key of ['x', 'y', 'width', 'height'] as const)
        expect(bounds[key]).toBeCloseTo(originalBounds[key], 0)
      await expect(scene.locator('[data-outgoing]')).toHaveCount(0)
      expect(await scene.locator('img').count()).toBe(3)
    }
    await page.waitForTimeout(700)
    await expect(scene.locator('.underwater-background')).not.toHaveCSS(
      'transform',
      'none'
    )
    await page.screenshot({
      path: testInfo.outputPath('underwater-friends.png'),
    })
    await page.keyboard.press('End')
    await expect(scene).toHaveCount(0)
    await expect(page.locator('.story-page-current')).toHaveAttribute(
      'src',
      /61-fossil-dig\.webp/
    )
    expect(errors).toEqual([])
  })
}

test('reduced motion keeps the original page and does not fetch animation layers', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  const layers: string[] = []
  page.on('request', (request) => {
    if (
      request.resourceType() === 'image' &&
      request.url().includes('/layers/underwater/')
    )
      layers.push(request.url())
  })
  await openUnderwater(page)
  await expect(page.locator('.underwater-scene')).toBeHidden()
  await expect(page.locator('.story-page-current')).toBeVisible()
  await page
    .locator('.story-page-current')
    .evaluate((image: HTMLImageElement) => image.decode())
  expect(layers).toEqual([])
})

test('failed layers fall back to the original illustration and chapter changes remove the scene', async ({
  page,
}) => {
  await page.route('**/layers/underwater/*.webp', (route) =>
    route.request().resourceType() === 'image'
      ? route.abort()
      : route.continue()
  )
  await openUnderwater(page)
  await expect(page.locator('.underwater-scene')).toBeHidden()
  await page
    .locator('.story-page-current')
    .evaluate((image: HTMLImageElement) => image.decode())
  await page.getByRole('button', { name: 'Space', exact: true }).click()
  await expect(page.locator('.underwater-scene')).toHaveCount(0)
  await expect(page.locator('.story-page-current')).toHaveAttribute(
    'src',
    /44-dingdong-invitation-v2\.webp/
  )
})

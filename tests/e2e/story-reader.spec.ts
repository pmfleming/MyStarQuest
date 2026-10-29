import { expect, test } from '@playwright/test'

test('desktop story fills the viewport, scrubs, turns pages, and returns focus', async ({
  page,
  browserName,
}) => {
  await page.setViewportSize({ width: 1280, height: 800 })
  await page.goto('/tests/fixtures/story-reader.html')
  await page.getByRole('button', { name: 'Read Sea friends' }).click()
  const reader = page.getByRole('dialog', { name: 'Sea friends story reader' })
  await expect(reader).toBeVisible()
  if (browserName === 'chromium') {
    await expect
      .poll(() => page.evaluate(() => document.fullscreenElement !== null))
      .toBe(true)
  }
  await expect
    .poll(() =>
      reader.evaluate(
        (element) =>
          element.clientWidth === window.innerWidth &&
          element.clientHeight === window.innerHeight
      )
    )
    .toBe(true)
  const image = reader.locator('.story-artwork img')
  await expect
    .poll(() => image.evaluate((img: HTMLImageElement) => img.naturalWidth))
    .toBeGreaterThan(0)
  await expect(image).toHaveCSS('object-fit', 'contain')
  await expect(
    reader.getByRole('button', { name: 'Previous page' })
  ).toBeDisabled()
  await page.keyboard.press('ArrowRight')
  await expect(reader.getByRole('slider')).toHaveValue('1')
  await reader.getByRole('slider').fill('30')
  await expect(reader.getByRole('slider')).toHaveAttribute(
    'aria-valuetext',
    /^31 of \d+:/
  )
  await image.evaluate((img: HTMLImageElement) => img.decode())
  await page.screenshot({
    path: `test-results/story-desktop-${browserName}.png`,
  })
  await reader.getByRole('button', { name: 'Return to tests' }).click()
  await expect(reader).toHaveCount(0)
  await expect(
    page.getByRole('button', { name: 'Read Sea friends' })
  ).toBeFocused()
  await expect
    .poll(() => page.evaluate(() => document.fullscreenElement === null))
    .toBe(true)
})

for (const viewport of [
  { width: 844, height: 390 },
  { width: 390, height: 844 },
]) {
  test(`phone story uses landscape and reveals bottom controls (${viewport.width}×${viewport.height})`, async ({
    browser,
    browserName,
  }) => {
    test.skip(
      browserName === 'firefox',
      'Firefox does not support mobile browser contexts.'
    )
    const context = await browser.newContext({
      viewport,
      isMobile: true,
      hasTouch: true,
    })
    const page = await context.newPage()
    await page.goto('/tests/fixtures/story-reader.html?theme=teenie')
    await expect(
      page.getByRole('button', { name: 'Stories', exact: true })
    ).toHaveAttribute('aria-pressed', 'true')
    await page.getByRole('button', { name: 'Read Sea friends' }).click()
    const reader = page.getByRole('dialog')
    await expect(reader).toBeVisible()
    const stage = reader.locator('.story-stage')
    const dimensions = await stage.evaluate((el) => ({
      width: el.clientWidth,
      height: el.clientHeight,
    }))
    expect(dimensions.width).toBeGreaterThan(dimensions.height)
    await expect(reader.getByRole('slider')).not.toBeVisible()
    const handle = reader.getByRole('button', { name: 'Show story controls' })
    const bounds = await handle.boundingBox()
    if (!bounds) throw new Error('Missing story control handle')
    const x = bounds.x + bounds.width / 2
    const y = bounds.y + bounds.height / 2
    await page.mouse.move(x, y)
    await page.mouse.down()
    // The CSS portrait fallback rotates the logical bottom to the physical left.
    await page.mouse.move(
      viewport.width < viewport.height ? x + 90 : x,
      viewport.width < viewport.height ? y : y - 90,
      { steps: 8 }
    )
    await page.mouse.up()
    await expect(reader.getByRole('slider')).toBeVisible()
    const lastPage = await reader.getByRole('slider').getAttribute('max')
    await reader.getByRole('slider').fill(lastPage!)
    await expect(
      reader.getByRole('button', { name: 'Next page' })
    ).toBeDisabled()
    await reader
      .locator('.story-artwork img')
      .evaluate((img: HTMLImageElement) => img.decode())
    await page.screenshot({
      path: `test-results/story-phone-${viewport.width}-${browserName}.png`,
    })
    await reader.getByRole('button', { name: 'Return to tests' }).click()
    await expect(reader).toHaveCount(0)
    await expect(
      page.getByRole('button', { name: 'Read Sea friends' })
    ).toBeVisible()
    await context.close()
  })
}

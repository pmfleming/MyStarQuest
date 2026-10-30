import { expect, test } from '@playwright/test'

test('reverses an unfinished opening and can reopen without leftover surfaces', async ({
  page,
}) => {
  await page.goto('/tests/fixtures/story-reader.html')
  const read = page.getByRole('button', { name: 'Read Sea friends' })
  await read.click()
  const reader = page.getByRole('dialog', { name: 'Sea friends story reader' })
  await expect(reader).toHaveAttribute('data-story-opening', 'true')
  await reader.dispatchEvent('cancel')
  await expect(reader).toHaveAttribute('data-story-closing', 'true')
  await expect(reader).toHaveCount(0)
  await expect(page.locator('.story-phone-snapshot')).toHaveCount(0)
  await expect(read).toBeFocused()
  await read.click()
  await expect(reader).toHaveAttribute('data-story-opening', 'false')
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await reader.getByRole('button', { name: 'Return to tests' }).click()
  await expect(reader).toHaveCount(0)
  await expect(page.locator('.story-phone-snapshot')).toHaveCount(0)
})

test('desktop story fills the viewport, scrubs, turns pages, and returns focus', async ({
  page,
  browserName,
}) => {
  await page.setViewportSize({ width: 1280, height: 800 })
  await page.addInitScript(() => {
    const animations: string[] = []
    Reflect.set(window, 'storyAnimationNames', animations)
    document.addEventListener('animationstart', (event) => {
      if (
        event.target instanceof HTMLImageElement &&
        event.target.closest('.story-artwork')
      ) {
        animations.push(event.animationName)
      }
    })
  })
  await page.goto('/tests/fixtures/story-reader.html')
  await page
    .getByRole('radiogroup', { name: 'Test categories' })
    .locator('img')
    .evaluateAll((images) =>
      Promise.all(images.map((image) => (image as HTMLImageElement).decode()))
    )
  await page.screenshot({
    path: `test-results/test-categories-princess-${browserName}.png`,
  })
  await page.getByRole('button', { name: 'Read Sea friends' }).click()
  const reader = page.getByRole('dialog', { name: 'Sea friends story reader' })
  await expect(reader).toBeVisible()
  await expect(reader).toHaveAttribute('data-story-opening', 'true')
  const openingShape = await reader.evaluate((element) => {
    const animation = element
      .getAnimations()
      .find((item) => item.id === 'story-book-open')!
    animation.pause()
    animation.currentTime = 0
    const start = element.getBoundingClientRect()
    animation.currentTime = 600
    const middle = element.getBoundingClientRect()
    animation.play()
    return {
      startWidth: start.width,
      startHeight: start.height,
      middleWidth: middle.width,
      finalWidth: innerWidth,
    }
  })
  expect(openingShape.startHeight).toBeGreaterThan(openingShape.startWidth)
  expect(openingShape.middleWidth).toBeGreaterThan(openingShape.startWidth)
  expect(openingShape.middleWidth).toBeLessThan(openingShape.finalWidth)
  await expect(reader).toHaveAttribute('data-story-opening', 'false')
  await expect(reader.locator('.story-phone-snapshot')).toHaveCount(0)
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
  const image = reader.locator('.story-page-current')
  await expect
    .poll(() => image.evaluate((img: HTMLImageElement) => img.naturalWidth))
    .toBeGreaterThan(0)
  await expect(image).toHaveCSS('object-fit', 'contain')
  await expect(
    reader.getByRole('button', { name: 'Previous page' })
  ).toBeDisabled()
  const coverWidth = (await reader
    .locator('.story-page-surface')
    .boundingBox())!.width
  await page.keyboard.press('ArrowRight')
  await expect(reader.getByRole('slider')).toHaveValue('1')
  await expect(reader.locator('.story-artwork')).toHaveAttribute(
    'aria-busy',
    'false'
  )
  await expect
    .poll(
      async () =>
        (await reader.locator('.story-page-surface').boundingBox())!.width
    )
    .toBeGreaterThan(coverWidth + 100)
  await reader.getByRole('slider').fill('30')
  await expect(reader.getByRole('slider')).toHaveAttribute(
    'aria-valuetext',
    /^31 of \d+:/
  )
  await expect(reader.locator('.story-artwork')).toHaveAttribute(
    'aria-busy',
    'false'
  )
  await image.evaluate((img: HTMLImageElement) => img.decode())
  await expect
    .poll(() => page.evaluate(() => Reflect.get(window, 'storyAnimationNames')))
    .toEqual(expect.arrayContaining(['story-page-in', 'story-page-out']))
  await page.screenshot({
    path: `test-results/story-desktop-${browserName}.png`,
    animations: 'disabled',
  })
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await reader.getByRole('button', { name: 'Previous page' }).click()
  await expect(reader.locator('.story-artwork')).toHaveAttribute(
    'aria-busy',
    'false'
  )
  await expect(reader.locator('.story-artwork')).toHaveAttribute(
    'data-direction',
    'previous'
  )
  await expect(image).toHaveCSS('animation-name', 'none')
  await reader.focus()
  await page.keyboard.press('Home')
  await expect(reader.getByRole('slider')).toHaveValue('0')
  await page.keyboard.press('PageUp')
  await expect(reader.getByRole('slider')).toHaveValue('0')
  await page.keyboard.press('End')
  await expect(reader.getByRole('button', { name: 'Next page' })).toBeDisabled()
  await page.keyboard.press('PageDown')
  await expect(reader.getByRole('button', { name: 'Next page' })).toBeDisabled()
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
      page.getByRole('radio', { name: 'Stories', exact: true })
    ).toBeChecked()
    await page
      .getByRole('radiogroup', { name: 'Test categories' })
      .locator('img')
      .evaluateAll((images) =>
        Promise.all(images.map((image) => (image as HTMLImageElement).decode()))
      )
    await page.screenshot({
      path: `test-results/test-categories-teenie-${viewport.width}-${browserName}.png`,
    })
    await page.getByRole('button', { name: 'Read Sea friends' }).click()
    const reader = page.getByRole('dialog')
    await expect(reader).toBeVisible()
    await expect(reader).toHaveAttribute('data-story-opening', 'false')
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
    await expect(reader.locator('.story-artwork')).toHaveAttribute(
      'aria-busy',
      'false'
    )
    await expect(
      reader.getByRole('button', { name: 'Next page' })
    ).toBeDisabled()
    await reader
      .locator('.story-page-current')
      .evaluate((img: HTMLImageElement) => img.decode())
    await page.screenshot({
      path: `test-results/story-phone-${viewport.width}-${browserName}.png`,
      animations: 'disabled',
    })
    await reader.getByRole('button', { name: 'Return to tests' }).click()
    await expect(reader).toHaveAttribute('data-story-closing', 'true')
    await expect(reader).toHaveCount(0)
    await expect(page.locator('.story-phone-snapshot')).toHaveCount(0)
    await expect(
      page.getByRole('button', { name: 'Read Sea friends' })
    ).toBeVisible()
    await context.close()
  })
}

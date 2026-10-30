import { expect, test } from '@playwright/test'
import photoLayout from '../../src/assets/comic/references/birthday/polaroid-layout.json' with { type: 'json' }

const newPanels = [
  '52-dark-castle-entry',
  '53-cloaked-visitor-on-table',
  '54-birthday-surprise-v2',
  '55-birthday-cake-v2',
  '56-birthday-dancing-v2',
  '57-birthday-group-photo-v2',
  '58-odette-polaroid',
  '59-goodbye-space-friends',
  '60-flying-home-to-earth',
  '61-fossil-dig',
]

for (const theme of ['princess', 'teenie']) {
  test(`chapter buttons jump to each chapter and track page turns (${theme})`, async ({
    page,
  }, testInfo) => {
    await page.goto(`/tests/fixtures/story-reader.html?theme=${theme}`)
    await page.getByRole('button', { name: 'Read Sea friends' }).click()
    const reader = page.getByRole('dialog')
    await expect(reader).toHaveAttribute('data-story-opening', 'false')
    const chapters = reader.getByRole('navigation', { name: 'Story chapters' })
    await expect(chapters.getByRole('button')).toHaveCount(5)
    await expect(chapters.getByRole('button')).toHaveText(['', '', '', '', ''])
    await expect(chapters.locator('img')).toHaveCount(5)
    await chapters
      .locator('img')
      .evaluateAll((images) =>
        Promise.all(images.map((image) => (image as HTMLImageElement).decode()))
      )
    for (const [label, image] of [
      ['Land', '01-poffertjes'],
      ['Sea', '03-leap'],
      ['Air', '35-sky-castle-arrival'],
      ['Space', '44-dingdong-invitation-v2'],
      ['Fossils', '61-fossil-dig'],
    ]) {
      const button = chapters.getByRole('button', { name: label, exact: true })
      await button.click()
      await expect(button).toHaveAttribute('aria-current', 'location')
      await expect(reader.locator('.story-page-current')).toHaveAttribute(
        'src',
        new RegExp(`${image}\\.webp`)
      )
    }
    await reader
      .locator('.story-page-current')
      .evaluate((image: HTMLImageElement) => image.decode())
    await page.screenshot({
      path: testInfo.outputPath(`chapters-${theme}.png`),
      animations: 'disabled',
    })
    await chapters.getByRole('button', { name: 'Air', exact: true }).click()
    await page.keyboard.press('ArrowLeft')
    await expect(
      chapters.getByRole('button', { name: 'Sea', exact: true })
    ).toHaveAttribute('aria-current', 'location')
    await reader.focus()
    await page.keyboard.press('Home')
    await expect(
      chapters.getByRole('button', { name: 'Land', exact: true })
    ).toHaveAttribute('aria-current', 'location')
    const sea = chapters.getByRole('button', { name: 'Sea', exact: true })
    await sea.focus()
    await page.keyboard.press('Space')
    await expect(reader.locator('.story-page-current')).toHaveAttribute(
      'src',
      /03-leap\.webp/
    )
  })
}

test('includes every new scene in reading order with the corrected artwork', async ({
  page,
}) => {
  await page.goto('/tests/fixtures/story-reader.html')
  await page.getByRole('button', { name: 'Read Sea friends' }).click()
  const reader = page.getByRole('dialog')
  await expect(reader).toHaveAttribute('data-story-opening', 'false')
  const slider = reader.getByRole('slider')
  const firstNewPage =
    Number(await slider.getAttribute('max')) - newPanels.length + 1
  for (const [offset, filename] of newPanels.entries()) {
    await slider.fill(String(firstNewPage + offset))
    const image = reader.locator('.story-page-current')
    await expect(image).toHaveAttribute('src', new RegExp(`${filename}\\.webp`))
    await image.evaluate((element: HTMLImageElement) => element.decode())
    expect(
      await image.evaluate((element: HTMLImageElement) => element.naturalWidth)
    ).toBe(1672)
  }
  await expect(reader.getByRole('button', { name: 'Next page' })).toBeDisabled()
})

test('plays the birthday photo animation in the app, replays it, and cleans up on return', async ({
  page,
}, testInfo) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  await page.setViewportSize({ width: 1280, height: 800 })
  await page.goto('/tests/fixtures/story-reader.html')
  await page.getByRole('button', { name: 'Read Sea friends' }).click()
  const reader = page.getByRole('dialog')
  await expect(reader).toHaveAttribute('data-story-opening', 'false')
  const slider = reader.getByRole('slider')
  const photoPage = Number(await slider.getAttribute('max')) - 3
  await slider.fill(String(photoPage))
  const moment = reader.locator('.photo-moment')
  await expect(moment).toHaveClass(/playing/)
  await expect
    .poll(() =>
      moment.evaluate(
        (element) => element.getAnimations({ subtree: true }).length
      )
    )
    .toBe(5)
  await moment.evaluate((element) =>
    element.getAnimations({ subtree: true }).forEach((animation) => {
      animation.pause()
      animation.currentTime = 2600
    })
  )
  await page.screenshot({ path: testInfo.outputPath('app-photo-midway.png') })
  await moment.evaluate((element) =>
    element.getAnimations({ subtree: true }).forEach((animation) => {
      animation.currentTime = 5100
    })
  )
  const stage = (await moment.boundingBox())!
  const print = (await reader.locator('.instant-print img').boundingBox())!
  expect(print.x).toBeCloseTo(
    stage.x + (stage.width * photoLayout.photo.x) / photoLayout.canvas.width,
    0
  )
  expect(print.y).toBeCloseTo(
    stage.y + (stage.height * photoLayout.photo.y) / photoLayout.canvas.height,
    0
  )
  expect(print.width).toBeCloseTo(
    (stage.width * photoLayout.photo.width) / photoLayout.canvas.width,
    0
  )
  await moment.evaluate((element) =>
    element
      .getAnimations({ subtree: true })
      .forEach((animation) => animation.finish())
  )
  await expect(moment).not.toHaveClass(/playing/)
  await page.screenshot({ path: testInfo.outputPath('app-photo-finished.png') })
  await slider.fill(String(photoPage - 1))
  await expect(moment).toHaveCount(0)
  await slider.fill(String(photoPage))
  await expect(moment).toHaveClass(/playing/)
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await expect(moment).toBeHidden()
  await slider.fill(String(photoPage - 1))
  await slider.fill(String(photoPage))
  await expect(moment).toBeAttached()
  await expect(moment).toBeHidden()
  await reader.getByRole('button', { name: 'Return to tests' }).click()
  await expect(reader).toHaveCount(0)
  await expect(page.locator('.photo-moment')).toHaveCount(0)
  expect(errors).toEqual([])
})

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
    const chapters = reader.getByRole('navigation', { name: 'Story chapters' })
    await expect(chapters.getByRole('button')).toHaveCount(5)
    await chapters.getByRole('button', { name: 'Fossils', exact: true }).click()
    await expect(reader.locator('.story-page-current')).toHaveAttribute(
      'src',
      /61-fossil-dig\.webp/
    )
    await chapters.getByRole('button', { name: 'Land', exact: true }).click()
    await expect(reader.locator('.story-page-current')).toHaveAttribute(
      'src',
      /01-poffertjes\.webp/
    )
    const lastPage = await reader.getByRole('slider').getAttribute('max')
    await reader.getByRole('slider').fill(String(Number(lastPage) - 3))
    await expect(reader.locator('.photo-moment')).toHaveClass(/playing/)
    await reader.locator('.photo-moment').evaluate((element) =>
      element.getAnimations({ subtree: true }).forEach((animation) => {
        animation.pause()
        animation.currentTime = 2600
      })
    )
    await page.screenshot({
      path: `test-results/story-photo-phone-${viewport.width}-${browserName}.png`,
    })
    await reader.getByRole('slider').fill(lastPage!)
    await expect(reader.locator('.photo-moment')).toHaveCount(0)
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

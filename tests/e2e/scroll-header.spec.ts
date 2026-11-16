import { expect, test } from '@playwright/test'

for (const custom of [false, true]) {
  test(`top bar hides down and returns up (${custom ? 'categories' : 'title'})`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 700 })
    await page.goto(
      `/tests/fixtures/scroll-header.html${custom ? '?custom' : ''}`
    )
    const header = page.locator('.scroll-header')
    const bar = custom ? page.getByRole('radiogroup') : page.getByRole('banner')
    const original = await bar.boundingBox()
    expect(original).not.toBeNull()
    expect(original!.x).toBeGreaterThan(0)
    expect(original!.x + original!.width).toBeLessThan(390)
    const region = page.locator('.app-scroll-region')
    const padding = await region.evaluate(
      (element) => getComputedStyle(element).paddingTop
    )
    const height = await header.evaluate((element) => element.clientHeight)
    const opacity = () =>
      header.evaluate((element) => Number(getComputedStyle(element).opacity))
    for (const offset of [20, 40, 30]) {
      await region.evaluate((element, top) => {
        element.scrollTop = top
      }, offset)
      await expect.poll(opacity).toBeCloseTo(1 - offset / height, 4)
      expect(
        await header.evaluate(
          (element) =>
            new DOMMatrixReadOnly(getComputedStyle(element).transform).m42
        )
      ).toBeCloseTo(-offset)
    }
    // Pausing halfway leaves the bar halfway out, with no timed animation.
    expect(
      await header.evaluate(
        (element) => getComputedStyle(element).transitionDuration
      )
    ).toBe('0s')
    await page.screenshot({
      path: `test-results/scroll-header-${custom ? 'categories' : 'title'}-partial.png`,
    })
    await page.mouse.move(195, 400)
    await page.mouse.wheel(0, 400)
    await expect(header).toHaveAttribute('data-hidden', 'true')
    await expect(header).toHaveAttribute('inert', '')
    await expect
      .poll(() =>
        header.evaluate((element) => element.getBoundingClientRect().bottom)
      )
      .toBeLessThanOrEqual(0)
    await expect(
      page.getByRole('navigation', { name: 'Bottom navigation' })
    ).toBeVisible()
    expect(
      await region.evaluate((element) => getComputedStyle(element).paddingTop)
    ).toBe(padding)
    await page.mouse.wheel(0, -30)
    await expect(header).toHaveAttribute('data-hidden', 'false')
    await expect.poll(opacity).toBeCloseTo(30 / height, 4)
    await page.mouse.wheel(0, -150)
    await expect.poll(opacity).toBe(1)
    await expect(bar).toBeVisible()
    await expect
      .poll(async () => (await bar.boundingBox())?.y)
      .toBe(original!.y)
    expect(
      await region.evaluate((element) => element.scrollTop)
    ).toBeGreaterThan(0)
    await page.screenshot({
      path: `test-results/scroll-header-${custom ? 'categories' : 'title'}.png`,
    })
    await page.mouse.wheel(0, 150)
    await expect(header).toHaveAttribute('data-hidden', 'true')
    await region.evaluate((element) => {
      element.scrollTop = 0
    })
    await expect(header).toHaveAttribute('data-hidden', 'false')
  })
}

test('respects reduced motion', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/tests/fixtures/scroll-header.html')
  expect(
    await page
      .locator('.scroll-header')
      .evaluate((element) => getComputedStyle(element).transitionDuration)
  ).toBe('0s')
  await page.locator('.app-scroll-region').evaluate((element) => {
    element.scrollTop = 40
  })
  const header = page.locator('.scroll-header')
  await expect
    .poll(() =>
      header.evaluate((element) => Number(getComputedStyle(element).opacity))
    )
    .toBeCloseTo(1 - 40 / 79, 4)
  expect(
    await header.evaluate((element) => getComputedStyle(element).transform)
  ).toBe('none')
})

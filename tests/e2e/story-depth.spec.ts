import { expect, test } from '@playwright/test'

for (const width of [1280, 390]) {
  test(`page turns retain complete layered scenes and frozen poses (${width})`, async ({
    page,
  }) => {
    test.setTimeout(90000)
    await page.setViewportSize({ width, height: width === 390 ? 844 : 800 })
    await page.goto('/tests/fixtures/story-reader.html')
    await page.getByRole('button', { name: 'Read Sea friends' }).click()
    await expect(page.getByRole('dialog')).toHaveAttribute(
      'data-story-opening',
      'false'
    )
    const controls = page.getByRole('button', { name: 'Show story controls' })
    if (await controls.isVisible()) await controls.click()
    for (const index of [9, 14, 15, 17, 41, 46, 49, 51]) {
      await page.getByRole('slider').fill(String(index))
      await expect(page.locator('.story-artwork')).toHaveAttribute(
        'aria-busy',
        'false'
      )
      await expect(page.locator('.story-transition')).toHaveCount(0)
      const scene = page.locator('.story-page-surface [data-story-scene].ready')
      await expect(scene).toHaveCount(1)
      await expect(
        scene.locator('[data-depth="foreground"], .tidying-foreground')
      ).toHaveCount(1)
      const original = await scene.evaluate((element) => {
        element.getAnimations({ subtree: true }).forEach((animation) => {
          animation.pause()
          animation.currentTime = 1000
        })
        return Array.from(element.querySelectorAll('img'), (image) => ({
          source: image.src,
          transform: getComputedStyle(image).transform,
          clip: getComputedStyle(image).clipPath,
        }))
      })
      await page.getByRole('slider').fill(String(index + 1))
      const transition = page.locator('.story-transition')
      await expect(transition).toHaveAttribute('data-ready', 'true')
      await transition.evaluate((element) =>
        element.getAnimations({ subtree: true }).forEach((animation) => {
          animation.pause()
          animation.currentTime =
            Number(animation.effect!.getTiming().duration) / 2
        })
      )
      const snapshot = transition.locator('.transition-scene-source')
      await expect(snapshot).toHaveCount(1)
      await expect(
        snapshot.locator('[data-depth="foreground"], .tidying-foreground')
      ).toHaveCount(1)
      const frozen = await snapshot.evaluate((element) =>
        Array.from(element.querySelectorAll('img'), (image) => ({
          source: image.src,
          transform: getComputedStyle(image).transform,
          clip: getComputedStyle(image).clipPath,
        }))
      )
      expect(frozen, `page ${index + 1} keeps its artwork and poses`).toEqual(
        original
      )
      await transition.evaluate((element) =>
        element
          .getAnimations({ subtree: true })
          .forEach((animation) => animation.finish())
      )
      await expect(transition).toHaveCount(0)
    }
  })
}

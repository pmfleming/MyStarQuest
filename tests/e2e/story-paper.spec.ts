import { expect, test } from '@playwright/test'
import { checkNormalStoryTransition } from '../helpers/storyNormalTransition'

for (const width of [1280, 390]) {
  test(`normal page turns cover the destination before fading it in (${width})`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: width === 390 ? 844 : 800 })
    await page.goto('/tests/fixtures/story-reader.html')
    await page.getByRole('button', { name: 'Read Sea friends' }).click()
    await expect(page.getByRole('dialog')).toHaveAttribute(
      'data-story-opening',
      'false'
    )
    for (const key of [
      'ArrowRight',
      'ArrowRight',
      'ArrowRight',
      'ArrowLeft',
      'ArrowLeft',
      'ArrowLeft',
    ]) {
      await page.keyboard.press(key)
      await checkNormalStoryTransition(page, '.story-page-surface')
    }
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.keyboard.press('ArrowRight')
    await expect(page.locator('.story-page-current')).toHaveAttribute(
      'src',
      /01-poffertjes/
    )
    await expect(page.locator('.story-transition')).toHaveCount(0)
    await expect(page.locator('.story-page-surface')).toHaveCSS(
      'visibility',
      'visible'
    )
  })
}

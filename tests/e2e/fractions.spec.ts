import { expect, test } from '@playwright/test'

test('fractions fits a small phone and completes by tapping answer cards (teenie)', async ({
  page,
}) => {
  const theme = 'teenie'
  await page.setViewportSize({ width: 320, height: 800 })
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto(`/tests/fixtures/fractions.html?theme=${theme}`, {
    waitUntil: 'domcontentloaded',
  })
  const increase = page.getByRole('button', {
    name: 'Increase maximum denominator',
  })
  for (let value = 4; value < 9; value++) await increase.click()
  await expect(increase).toBeDisabled()
  await page.getByRole('button', { name: 'Run Fractions', exact: true }).click()
  const check = page.getByRole('button', {
    name: 'Check result Fractions',
    exact: true,
  })
  await expect(check).not.toBeVisible()
  await expect(
    page.getByRole('img', { name: 'Example: 2 out of 9 equal parts' })
  ).toBeVisible()
  for (const denominator of [9, 3, 4, 5, 6]) {
    const choice = page.getByRole('button', {
      name: `2 out of ${denominator} equal parts`,
      exact: true,
    })
    await expect(choice).toBeEnabled()
    const bounds = await choice.boundingBox()
    expect(bounds!.width).toBeGreaterThanOrEqual(44)
    expect(bounds!.height).toBeGreaterThanOrEqual(44)
    await choice.click()
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth
      )
    ).toBe(true)
    if (denominator === 6) {
      await page.screenshot({
        path: `test-results/fractions-${theme}-active.png`,
      })
    }
    await expect(choice).toBeDisabled()
    await expect(page.locator('button.fraction-choice:disabled')).toHaveCount(0)
  }
  await expect(page.getByLabel('Completion count')).toHaveText('1')
  await expect(check).not.toBeVisible()
  await page.screenshot({
    path: `test-results/fractions-${theme}-complete.png`,
  })
})

import { expect, test } from '@playwright/test'

for (const theme of ['teenie', 'princess']) {
  for (const [hour, title, file] of [
    [
      8,
      'Breakfast',
      theme === 'teenie' ? 'eating-breakfast.webp' : 'meal-breakfast.webp',
    ],
    [12, 'Lunch', 'meal-lunch.webp'],
    [18, 'Dinner', 'meal-dinner.webp'],
  ] as const) {
    test(`${theme} ${title} uses matching title, character and plate`, async ({
      page,
    }, testInfo) => {
      await page.setViewportSize({ width: 390, height: 844 })
      await page.clock.install({
        time: new Date(`2026-11-16T${String(hour).padStart(2, '0')}:00:00Z`),
      })
      await page.goto(`/tests/fixtures/meal-chore.html?theme=${theme}`)
      await expect(page.getByRole('heading', { name: title })).toBeVisible()
      const overview = page.getByAltText(`${title} chore`)
      await expect(overview).toHaveAttribute('src', new RegExp(file))
      await expect(overview).toHaveJSProperty('complete', true)
      await expect(overview).not.toHaveJSProperty('naturalWidth', 0)
      await page.screenshot({
        path: testInfo.outputPath('overview.png'),
        fullPage: true,
      })
      await page.getByRole('button', { name: `Run ${title}` }).click()
      await expect(
        page.getByRole('button', { name: `Bite ${title}` }).locator('img')
      ).toHaveAttribute('src', new RegExp(file))
      const plate = page.getByLabel('Dinner plate portions')
      await expect(plate.locator(`image[href$="${file}"]`)).toHaveCount(5)
      await expect(plate).toBeVisible()
      await page.screenshot({
        path: testInfo.outputPath('plate.png'),
        fullPage: true,
      })
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth
        )
      ).toBe(true)
    })
  }
}

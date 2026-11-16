import { test, expect } from '@playwright/test'

for (const theme of ['princess', 'teenie']) {
  test(`three calendar views fit a small phone and share periods (${theme})`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 320, height: 850 })
    await page.goto(`/tests/fixtures/calendar-history.html?theme=${theme}`)
    await expect(
      page.getByRole('radiogroup', { name: 'History type' })
    ).toHaveCount(0)
    const views = page.getByRole('group', { name: 'Calendar views' })
    await expect(views.getByRole('button')).toHaveCount(3)
    await expect(
      page.getByRole('group', { name: 'Calendar navigation' })
    ).toHaveCount(1)
    await expect(page.getByLabel('Calendar date')).toHaveCount(1)
    await expect(page.locator('input[type="date"]')).toHaveCount(0)
    await expect(page.locator('.calendar-weekday')).toHaveCount(7)
    const rows = page.locator('.calendar-history__item')
    for (const period of ['Day', 'Week', 'Month']) {
      await page.getByRole('radio', { name: period, exact: true }).click()
      await views.getByRole('button', { name: 'Calendar', exact: true }).click()
      await expect(rows).toHaveCount(3)
      await expect(
        page.getByRole('button', { name: /^Pok\u00e9mon cards,/ })
      ).toBeVisible()
      await expect(
        page.getByRole('button', { name: /^Practice piano,/ })
      ).toHaveCount(0)
      await views.getByRole('button', { name: 'Chores/Tasks' }).click()
      await expect(rows).toHaveCount(period === 'Day' ? 2 : 3)
      await expect(page.getByRole('button', { name: /^Maths,/ })).toBeVisible()
      await expect(
        page.getByRole('button', { name: /^Pok\u00e9mon cards,/ })
      ).toHaveCount(0)
      await views.getByRole('button', { name: 'Rewards', exact: true }).click()
      await expect(
        page.getByRole('radio', { name: period, exact: true })
      ).toHaveAttribute('aria-checked', 'true')
      await expect(rows).toHaveCount(1)
      await expect(
        page.getByRole('button', { name: /^Pok\u00e9mon cards,/ })
      ).toBeVisible()
      await expect(page.getByRole('radio', { name: 'Year' })).toHaveCount(0)
      await expect
        .poll(() =>
          page
            .locator('img')
            .evaluateAll((images) =>
              images.every(
                (image) =>
                  (image as HTMLImageElement).complete &&
                  (image as HTMLImageElement).naturalWidth > 0
              )
            )
        )
        .toBe(true)
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= window.innerWidth
        )
      ).toBe(true)
      const buttons = await views.getByRole('button').evaluateAll((elements) =>
        elements.map((element) => {
          const rect = element.getBoundingClientRect()
          return { top: rect.top, width: rect.width, height: rect.height }
        })
      )
      expect(new Set(buttons.map((button) => button.top)).size).toBe(1)
      expect(
        buttons.every((button) => button.width >= 44 && button.height >= 44)
      ).toBe(true)
    }
    await page.screenshot({
      path: `test-results/calendar-${theme}-views.png`,
      fullPage: true,
      animations: 'disabled',
    })
    await page.getByRole('button', { name: 'Previous calendar month' }).click()
    await expect(
      page.getByRole('status', { name: 'No rewards received this month' })
    ).toHaveCount(1)
    await page.getByRole('button', { name: 'Next calendar month' }).click()
    await expect(rows).toHaveCount(1)
    await views.getByRole('button', { name: 'Calendar', exact: true }).click()
    await expect(rows).toHaveCount(3)
    await views.getByRole('button', { name: 'Chores/Tasks' }).click()
    await page.getByRole('radio', { name: 'Day', exact: true }).click()
    await page.getByRole('button', { name: 'Previous calendar day' }).click()
    await expect(rows).toHaveCount(0)
    await page.getByRole('button', { name: 'Previous calendar day' }).click()
    await expect(
      page.getByRole('button', { name: /^Practice piano,/ })
    ).toBeVisible()
    await views.getByRole('button', { name: 'Calendar', exact: true }).click()
    await expect(page.getByLabel('Calendar date')).toHaveAttribute(
      'datetime',
      '2026-10-20'
    )
    await expect(rows).toHaveCount(1)
  })
}

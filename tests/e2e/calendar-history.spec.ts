import { test, expect } from '@playwright/test'
for (const theme of ['princess', 'teenie']) {
  test(`calendar history fits a small phone and filters periods (${theme})`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 320, height: 850 })
    await page.goto(`/tests/fixtures/calendar-history.html?theme=${theme}`)
    await expect(
      page.getByRole('button', { name: /^Tidy my room,/ })
    ).toBeVisible()
    await expect(page.getByRole('button', { name: /^Maths,/ })).toBeVisible()
    await expect(
      page.getByRole('button', { name: /^Pokémon cards,/ })
    ).toBeVisible()
    await expect(
      page.getByRole('group', { name: 'Calendar navigation' })
    ).toHaveCount(1)
    await expect(page.getByLabel('Calendar date')).toHaveCount(1)
    await expect(page.locator('input[type="date"]')).toHaveCount(0)
    await expect(page.locator('.calendar-weekday')).toHaveCount(7)
    await expect(page.locator('.calendar-weekday')).toHaveText(
      Array(7).fill('')
    )
    await expect(page.locator('img')).not.toHaveCount(0)
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
    await page
      .locator('img')
      .evaluateAll((images) =>
        Promise.all(images.map((image) => (image as HTMLImageElement).decode()))
      )
    expect(
      await page
        .getByRole('region', { name: 'Activity history', exact: true })
        .evaluate((root) => {
          const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT)
          const labels: string[] = []
          while (walker.nextNode()) {
            const text = walker.currentNode.textContent?.trim() ?? ''
            if ((text.match(/\p{L}+/gu) ?? []).length > 1) labels.push(text)
          }
          return labels
        })
    ).toEqual([])
    const imageTops = await page
      .locator('.calendar-weekday > img')
      .evaluateAll((labels) =>
        labels.map((label) => label.getBoundingClientRect().top)
      )
    expect(Math.max(...imageTops) - Math.min(...imageTops)).toBeLessThan(1)
    await page.screenshot({
      path: `test-results/calendar-${theme}-day.png`,
      fullPage: true,
      animations: 'disabled',
    })
    await page.getByRole('radio', { name: 'Chores completed' }).click()
    await page.getByRole('radio', { name: 'Week', exact: true }).click()
    await expect(
      page.getByRole('button', { name: /^Practice piano,/ })
    ).toBeVisible()
    await expect(
      page.getByRole('button', { name: /^Maths,/ })
    ).not.toBeVisible()
    await expect(
      page.getByRole('img', { name: '3 stars earned', exact: true })
    ).toBeVisible()
    await expect(page.locator('img')).not.toHaveCount(0)
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
    await page
      .locator('img')
      .evaluateAll((images) =>
        Promise.all(images.map((image) => (image as HTMLImageElement).decode()))
      )
    expect(
      await page
        .getByRole('region', { name: 'Activity history', exact: true })
        .evaluate((root) => {
          const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT)
          const labels: string[] = []
          while (walker.nextNode()) {
            const text = walker.currentNode.textContent?.trim() ?? ''
            if ((text.match(/\p{L}+/gu) ?? []).length > 1) labels.push(text)
          }
          return labels
        })
    ).toEqual([])
    await page.screenshot({
      path: `test-results/calendar-${theme}-week.png`,
      fullPage: true,
      animations: 'disabled',
    })
    await page.getByRole('radio', { name: 'Rewards granted' }).click()
    await page.getByRole('radio', { name: 'Year', exact: true }).click()
    await expect(
      page.getByRole('button', { name: /^Birthday toy,/ })
    ).toBeVisible()
    await expect(
      page.getByRole('radio', { name: 'Week', exact: true })
    ).not.toBeVisible()
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth
      )
    ).toBe(true)
    await expect(page.locator('img')).not.toHaveCount(0)
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
    await page
      .locator('img')
      .evaluateAll((images) =>
        Promise.all(images.map((image) => (image as HTMLImageElement).decode()))
      )
    expect(
      await page
        .getByRole('region', { name: 'Activity history', exact: true })
        .evaluate((root) => {
          const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT)
          const labels: string[] = []
          while (walker.nextNode()) {
            const text = walker.currentNode.textContent?.trim() ?? ''
            if ((text.match(/\p{L}+/gu) ?? []).length > 1) labels.push(text)
          }
          return labels
        })
    ).toEqual([])
    await page.screenshot({
      path: `test-results/calendar-${theme}-year.png`,
      fullPage: true,
      animations: 'disabled',
    })
    await page.getByRole('button', { name: 'Previous calendar year' }).click()
    await expect(
      page.getByRole('status', { name: 'No rewards granted this year' })
    ).toBeVisible()
    await page.getByRole('button', { name: 'Next calendar year' }).click()
    await expect(
      page.getByRole('button', { name: /^Birthday toy,/ })
    ).toBeVisible()
  })
}

for (const theme of ['princess', 'teenie']) {
  test(`all filter combinations and date navigation (${theme})`, async ({
    page,
  }) => {
    await page.goto(`/tests/fixtures/calendar-history.html?theme=${theme}`)
    const cases = [
      {
        filter: 'All activity',
        periods: ['Day', 'Week', 'Month'],
        daily: ['Pokémon cards', 'Maths', 'Tidy my room'],
        wider: ['Pokémon cards', 'Maths', 'Tidy my room', 'Practice piano'],
      },
      {
        filter: 'Chores & tests completed',
        periods: ['Day', 'Week', 'Month'],
        daily: ['Maths', 'Tidy my room'],
        wider: ['Maths', 'Tidy my room', 'Practice piano'],
      },
      {
        filter: 'Chores completed',
        periods: ['Day', 'Week', 'Month'],
        daily: ['Tidy my room'],
        wider: ['Tidy my room', 'Practice piano'],
      },
      {
        filter: 'Tests completed',
        periods: ['Day', 'Week', 'Month'],
        daily: ['Maths'],
        wider: ['Maths'],
      },
      {
        filter: 'Rewards granted',
        periods: ['Day', 'Month', 'Year'],
        daily: ['Pokémon cards'],
        wider: ['Pokémon cards'],
      },
    ]
    for (const item of cases) {
      await page.getByRole('radio', { name: item.filter, exact: true }).click()
      for (const period of item.periods) {
        await page.getByRole('radio', { name: period, exact: true }).click()
        const expected =
          period === 'Year'
            ? ['Pokémon cards', 'Birthday toy']
            : period === 'Day'
              ? item.daily
              : item.wider
        const rows = page.locator('.calendar-history__item [role="button"]')
        await expect(rows).toHaveCount(expected.length)
        for (let index = 0; index < expected.length; index++) {
          await expect(rows.nth(index)).toHaveAttribute(
            'aria-label',
            new RegExp(`^${expected[index]},`)
          )
        }
      }
    }
    await page
      .getByRole('radio', { name: 'Chores completed', exact: true })
      .click()
    await page.getByRole('radio', { name: 'Day', exact: true }).click()
    await page.getByRole('button', { name: 'Previous calendar day' }).click()
    await expect(page.getByLabel('Calendar date')).toHaveAttribute(
      'datetime',
      '2026-10-21'
    )
    await expect(page.locator('.calendar-history__item')).toHaveCount(0)
    await page.getByRole('button', { name: 'Previous calendar day' }).click()
    await expect(
      page.getByRole('button', { name: /^Practice piano,/ })
    ).toBeVisible()
    await page.getByRole('radio', { name: 'Week', exact: true }).click()
    await page.getByRole('button', { name: 'Previous calendar week' }).click()
    await expect(page.getByLabel('Calendar date')).toHaveAttribute(
      'datetime',
      '2026-10-13'
    )
    await expect(page.locator('.calendar-history__item')).toHaveCount(0)
    await page.getByRole('button', { name: 'Next calendar week' }).click()
    await expect(page.locator('.calendar-history__item')).toHaveCount(2)
    await page
      .getByRole('radio', { name: 'Rewards granted', exact: true })
      .click()
    await expect(
      page.getByRole('radio', { name: 'Year', exact: true })
    ).toHaveAttribute('aria-checked', 'true')
    await expect(page.locator('.calendar-history__item')).toHaveCount(2)
    await page
      .getByRole('radio', { name: 'Chores completed', exact: true })
      .click()
    await expect(
      page.getByRole('radio', { name: 'Week', exact: true })
    ).toHaveAttribute('aria-checked', 'true')
    await expect(page.locator('.calendar-history__item')).toHaveCount(2)
  })
}

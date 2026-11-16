import { test, expect } from '@playwright/test'

test('visible dates stay expanded when switching history views or returning to a tab', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await page.goto('/tests/fixtures/calendar-history.html?theme=teenie')
  await page.getByRole('radio', { name: 'Week', exact: true }).click()
  await page.getByRole('button', { name: 'Chores/Tasks' }).click()
  const dates = page.locator('.calendar-history__day-reveal')
  await expect
    .poll(() =>
      dates.evaluateAll((nodes) =>
        nodes.every(
          (node) => node.getAnimations({ subtree: true }).length === 0
        )
      )
    )
    .toBe(true)

  for (const view of ['Rewards', 'Chores/Tasks']) {
    await page.getByRole('button', { name: view, exact: true }).click()
    expect(
      await dates.evaluateAll((nodes) =>
        nodes.every(
          (node) =>
            node.getBoundingClientRect().height > 0 &&
            node.getAnimations({ subtree: true }).length === 0
        )
      )
    ).toBe(true)
  }

  const returningDates = await page.locator('main').evaluate(async (main) => {
    const nextFrame = () =>
      new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))
    main.hidden = true
    await nextFrame()
    await nextFrame()
    main.hidden = false
    await nextFrame()
    await nextFrame()
    return [...main.querySelectorAll('.calendar-history__day-reveal')].map(
      (node) => ({
        height: node.getBoundingClientRect().height,
        animations: node.getAnimations({ subtree: true }).length,
      })
    )
  })
  expect(returningDates).toHaveLength(2)
  for (const date of returningDates) {
    expect(date.height).toBeGreaterThan(0)
    expect(date.animations).toBe(0)
  }
})

test('date labels make room for cards and collapse smoothly in reverse', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await page.goto('/tests/fixtures/calendar-history.html?theme=teenie')
  await page.getByRole('radio', { name: 'Week', exact: true }).click()
  const reveal = page.locator('.calendar-history__day-reveal').first()
  await expect(reveal).toHaveAttribute('data-visible', 'false')

  for (const expanding of [true, false]) {
    const samples = await page
      .getByRole('button', {
        name: expanding ? 'Chores/Tasks' : 'Calendar',
        exact: true,
      })
      .evaluate(async (button) => {
        const sample = () => {
          const reveal = document.querySelector(
            '.calendar-history__day-reveal'
          )!
          const list = reveal.nextElementSibling!
          return {
            height: reveal.getBoundingClientRect().height,
            cardTop:
              list.getBoundingClientRect().top -
              reveal.getBoundingClientRect().top,
          }
        }
        const samples = [sample()]
        ;(button as HTMLButtonElement).click()
        const start = performance.now()
        for (const time of [100, 220, 450]) {
          await new Promise<void>((resolve) => {
            const tick = () => {
              if (performance.now() - start >= time) resolve()
              else requestAnimationFrame(tick)
            }
            requestAnimationFrame(tick)
          })
          samples.push(sample())
        }
        return samples
      })
    const heights = samples.map(({ height }) => height)
    if (expanding) {
      expect(heights[0]).toBe(0)
      expect(heights[1]).toBeGreaterThan(0)
      expect(heights[1]).toBeLessThan(heights[2]!)
      expect(heights[2]).toBeLessThan(heights[3]!)
    } else {
      expect(heights[0]).toBeGreaterThan(heights[1]!)
      expect(heights[1]).toBeGreaterThan(heights[2]!)
      expect(heights[2]).toBeGreaterThan(0)
      expect(heights[3]).toBe(0)
    }
    for (const sample of samples) {
      expect(Math.abs(sample.cardTop - sample.height)).toBeLessThan(1)
    }
  }

  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.getByRole('button', { name: 'Chores/Tasks' }).click()
  await expect(page.getByRole('heading', { name: '22 October' })).toBeVisible()
  expect(
    await reveal.evaluate(
      (node) => node.getAnimations({ subtree: true }).length
    )
  ).toBe(0)
  await page.getByRole('button', { name: 'Calendar', exact: true }).click()
  await expect(page.getByRole('heading', { name: '22 October' })).toHaveCount(0)
  expect(
    await reveal.evaluate((node) => node.getBoundingClientRect().height)
  ).toBe(0)
})

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
    ).toHaveCount(0)
    await expect(page.getByLabel('Calendar date')).toHaveCount(1)
    await expect(page.locator('input[type="date"]')).toHaveCount(0)
    await expect(page.locator('.calendar-weekday:visible')).toHaveCount(0)
    const rows = page.locator('.calendar-history__item')
    for (const period of ['Day', 'Week', 'Month']) {
      await page.getByRole('radio', { name: period, exact: true }).click()
      await expect(
        page.getByRole('group', { name: 'Calendar navigation' })
      ).toHaveCount(0)
      await expect(
        page.getByRole('button', { name: /^(Previous|Next) calendar/ })
      ).toHaveCount(0)
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
    await page.getByRole('radio', { name: 'Day', exact: true }).click()
    await expect(
      page.getByRole('button', { name: 'Previous calendar day' })
    ).toHaveCount(0)
    await expect(
      page.getByRole('button', { name: 'Back to today' })
    ).toHaveCount(0)
    await expect(page.locator('.calendar-transition-previous')).toHaveCount(0)
    await expect(page.locator('.character-calendar__calendar')).toBeHidden()
    await views.getByRole('button', { name: 'Calendar', exact: true }).click()
    await expect(page.getByLabel('Calendar date')).toHaveAttribute(
      'datetime',
      '2026-10-22'
    )
    await expect(rows).toHaveCount(3)
  })
}

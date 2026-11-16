import { test, expect } from '@playwright/test'

test('view buttons stay still throughout animated period changes', async ({
  page,
}) => {
  await page.setViewportSize({ width: 560, height: 1200 })
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await page.goto(
    '/tests/fixtures/calendar-layout.html?theme=teenie&date=2026-11-29'
  )
  await expect(
    page.getByRole('radio', { name: 'Day', exact: true })
  ).toBeVisible()
  await page.evaluate(() => document.fonts.ready)
  for (const period of ['Week', 'Month', 'Day', 'Month', 'Week', 'Day']) {
    const movement = await page
      .getByRole('radio', { name: period, exact: true })
      .evaluate(async (button) => {
        const views = document.querySelector('.calendar-history__views')!
        const top = views.getBoundingClientRect().top
        const samples: number[] = []
        ;(button as HTMLButtonElement).click()
        await new Promise<void>((resolve) => {
          const start = performance.now()
          function sample() {
            samples.push(Math.abs(views.getBoundingClientRect().top - top))
            if (performance.now() - start < 450) requestAnimationFrame(sample)
            else resolve()
          }
          requestAnimationFrame(sample)
        })
        return Math.max(...samples)
      })
    expect(
      movement,
      `button row moved while switching to ${period}`
    ).toBeLessThan(1)
  }
})

for (const theme of ['teenie', 'princess']) {
  for (const width of [320, 560]) {
    test(`calendar periods keep the month height (${theme}, ${width}px)`, async ({
      page,
    }, testInfo) => {
      await page.setViewportSize({ width, height: 1000 })
      await page.emulateMedia({ reducedMotion: 'reduce' })
      for (const date of ['2027-02-01', '2026-10-22', '2026-11-29']) {
        await page.goto(
          `/tests/fixtures/calendar-layout.html?theme=${theme}&date=${date}`
        )
        const control = page.locator('.character-calendar')
        await page.getByRole('radio', { name: 'Month', exact: true }).click()
        const month = await control.boundingBox()
        expect(month).not.toBeNull()
        for (const period of ['Day', 'Week']) {
          await page.getByRole('radio', { name: period, exact: true }).click()
          const bounds = await control.boundingBox()
          expect(Math.abs(bounds!.height - month!.height)).toBeLessThan(1)
          expect(
            await page.evaluate(
              () => document.documentElement.scrollWidth <= window.innerWidth
            )
          ).toBe(true)
          if (period === 'Week') {
            await expect(
              page.getByRole('button', { name: /^Select / })
            ).toHaveCount(7)
            await expect(page.locator('.calendar-weekday-row')).toHaveCount(0)
            expect(
              await page.locator('.calendar-date').evaluateAll((cards) =>
                cards.flatMap((card) => {
                  const bounds = card.getBoundingClientRect()
                  const badge = card
                    .querySelector('.calendar-date-weekday')!
                    .getBoundingClientRect()
                  const number = card
                    .querySelector('.calendar-date-number')!
                    .getBoundingClientRect()
                  const inside =
                    badge.top >= bounds.top &&
                    badge.bottom <= bounds.bottom &&
                    badge.left >= bounds.left &&
                    badge.right <= bounds.right &&
                    number.top >= badge.bottom
                  return inside
                    ? []
                    : [
                        {
                          card: bounds.toJSON(),
                          badge: badge.toJSON(),
                          number: number.toJSON(),
                        },
                      ]
                })
              )
            ).toEqual([])
          }
          if (date === '2026-11-29') {
            await control.screenshot({
              path: testInfo.outputPath(`${period}.png`),
            })
          }
        }
      }
    })
  }
}

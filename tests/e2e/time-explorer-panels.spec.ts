import { expect, test } from '@playwright/test'

test('reveals a newly opened calendar below the clock on a short screen', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 707 })
  await page.getByRole('button', { name: 'Show clock', exact: true }).click()
  await page.getByRole('button', { name: 'Show calendar', exact: true }).click()
  const period = page.getByRole('radio', { name: 'Month', exact: true })
  await expect
    .poll(async () => {
      const bounds = await period.boundingBox()
      return bounds !== null && bounds.y >= 0 && bounds.y + bounds.height < 600
    })
    .toBe(true)
  await period.click()
  await expect(page.getByRole('region', { name: /^Agenda for / })).toHaveCount(
    1
  )
})

test.beforeEach(async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 850 })
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await page.addInitScript(() => {
    localStorage.setItem(
      'msq.timeExplorer.v1',
      JSON.stringify({ activePanels: [] })
    )
  })
  await page.route('https://api.open-meteo.com/**', (route) => route.abort())
  await page.goto('/tests/fixtures/time-explorer.html')
})

test('every explorer panel animates in and poofs out before unmounting', async ({
  page,
}) => {
  for (const name of [
    /^Show clock$/,
    /^Show calendar$/,
    /^Show weather:/,
    /^Show globe$/,
  ]) {
    const button = page.getByRole('button', { name })
    await button.click()
    const panel = page.locator('.whimsical-view-transition')
    await expect(panel).toHaveCount(1)
    await expect
      .poll(() =>
        panel.evaluate((node) =>
          node
            .getAnimations({ subtree: true })
            .some((animation) => animation instanceof CSSTransition)
        )
      )
      .toBe(true)
    if (name.source.includes('calendar')) {
      await expect(page.locator('.character-calendar')).toBeVisible()
    }
    if (name.source.includes('weather')) {
      await expect(page.locator('.weather-panel')).toBeVisible()
    }
    await expect
      .poll(() =>
        panel
          .locator('.whimsical-view-transition__surface')
          .evaluate((node) => Number(getComputedStyle(node).opacity))
      )
      .toBe(1)
    const closing = await button.evaluate(async (button) => {
      const panel = document.querySelector('.whimsical-view-transition')!
      const height = panel.getBoundingClientRect().height
      ;(button as HTMLButtonElement).click()
      await new Promise((resolve) => setTimeout(resolve, 100))
      const surface = panel.querySelector(
        '.whimsical-view-transition__surface'
      )!
      return {
        mounted: panel.isConnected,
        hidden: panel.getAttribute('aria-hidden'),
        inert: panel.hasAttribute('inert'),
        before: height,
        after: panel.getBoundingClientRect().height,
        opacity: Number(getComputedStyle(surface).opacity),
        transform: getComputedStyle(surface).transform,
      }
    })
    expect(closing.mounted).toBe(true)
    expect(closing.hidden).toBe('true')
    expect(closing.inert).toBe(true)
    expect(closing.after).toBeGreaterThan(0)
    expect(closing.after).toBeLessThan(closing.before)
    expect(closing.opacity).toBeGreaterThan(0)
    expect(closing.opacity).toBeLessThan(1)
    expect(closing.transform).not.toBe('none')
    await expect(panel).toHaveCount(0)
    await expect(button).toHaveAttribute('aria-pressed', 'false')
  }
})

test('reopening reverses the exit and replacing panels preserves the two-view limit', async ({
  page,
}) => {
  const calendar = page.getByRole('button', {
    name: 'Show calendar',
    exact: true,
  })
  await calendar.click()
  await page.getByRole('radio', { name: 'Month', exact: true }).click()
  const retained = await calendar.evaluate(async (button) => {
    const content = document.querySelector('.character-calendar')
    ;(button as HTMLButtonElement).click()
    await new Promise((resolve) => setTimeout(resolve, 100))
    ;(button as HTMLButtonElement).click()
    await new Promise((resolve) => setTimeout(resolve, 500))
    return content === document.querySelector('.character-calendar')
  })
  expect(retained).toBe(true)
  await expect(
    page.getByRole('radio', { name: 'Month', exact: true })
  ).toHaveAttribute('aria-checked', 'true')
  await page.getByRole('button', { name: 'Show clock', exact: true }).click()
  await page.getByRole('button', { name: /^Show weather:/ }).click()
  await expect(calendar).toHaveAttribute('aria-pressed', 'false')
  await expect(page.locator('.whimsical-view-transition')).toHaveCount(2)
  await expect(
    page.locator('.whimsical-view-transition[data-open="false"]')
  ).toHaveCount(0)

  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.getByRole('button', { name: 'Show clock', exact: true }).click()
  await expect(page.locator('.whimsical-view-transition')).toHaveCount(1)
  await page.getByRole('button', { name: /^Show weather:/ }).click()
  await expect(page.locator('.whimsical-view-transition')).toHaveCount(0)
  await calendar.click()
  expect(
    await page
      .locator('.whimsical-view-transition')
      .evaluate(
        (node) =>
          node
            .getAnimations({ subtree: true })
            .filter((animation) => animation instanceof CSSTransition).length
      )
  ).toBe(0)
})

test('bottom-tab navigation does not replay panel or category animations', async ({
  page,
}) => {
  await page.goto('/tests/fixtures/time-explorer.html?tabs')
  await page.getByRole('button', { name: 'Show clock', exact: true }).click()
  await page.getByRole('button', { name: /^Show weather:/ }).click()
  await page.getByRole('button', { name: 'Rewards tab', exact: true }).click()
  await expect(
    page.getByRole('heading', { name: 'Rewards page' })
  ).toBeVisible()

  const inspectReturn = async (tab: string) =>
    page
      .getByRole('button', { name: tab, exact: true })
      .evaluate(async (button) => {
        ;(button as HTMLButtonElement).click()
        const samples: {
          opacity: string
          transitions: number
          enter: string | null
        }[] = []
        const start = performance.now()
        await new Promise<void>((resolve) => {
          function sample() {
            const panels = document.querySelectorAll(
              '.whimsical-view-transition[data-open="true"]'
            )
            for (const panel of panels) {
              if (!panel.getBoundingClientRect().height) continue
              const surface = panel.querySelector(
                '.whimsical-view-transition__surface'
              )!
              samples.push({
                opacity: getComputedStyle(surface).opacity,
                transitions:
                  panel.getAnimations().length + surface.getAnimations().length,
                enter: panel.getAttribute('data-enter'),
              })
            }
            if (performance.now() - start < 500) requestAnimationFrame(sample)
            else resolve()
          }
          requestAnimationFrame(sample)
        })
        return samples
      })
  const explorer = await inspectReturn('Time Explorer tab')
  expect(explorer.length).toBeGreaterThan(0)
  expect(
    explorer.every(
      (sample) =>
        sample.opacity === '1' &&
        sample.transitions === 0 &&
        sample.enter === 'false'
    )
  ).toBe(true)
  await expect(
    page.getByRole('button', { name: 'Show clock', exact: true })
  ).toHaveAttribute('aria-pressed', 'true')
  await expect(
    page.getByRole('button', { name: /^Show weather:/ })
  ).toHaveAttribute('aria-pressed', 'true')

  await page.getByRole('button', { name: 'Tests tab', exact: true }).click()
  await page.getByRole('radio', { name: 'Letters', exact: true }).click()
  await page.getByRole('textbox', { name: 'Letters answer' }).fill('kept')
  await page.getByRole('button', { name: 'Rewards tab', exact: true }).click()
  await expect(
    page.getByRole('heading', { name: 'Rewards page' })
  ).toBeVisible()
  const categories = await inspectReturn('Tests tab')
  expect(categories.length).toBeGreaterThan(0)
  expect(
    categories.filter(
      (sample) =>
        sample.opacity !== '1' ||
        sample.transitions !== 0 ||
        sample.enter !== 'false'
    )
  ).toEqual([])
  await expect(
    page.getByRole('textbox', { name: 'Letters answer' })
  ).toHaveValue('kept')
  await page.getByRole('radio', { name: 'Numbers', exact: true }).click()
  await expect
    .poll(() =>
      page
        .locator('#test-category-numbers')
        .evaluate(
          (node) =>
            node
              .closest('.whimsical-view-transition')!
              .getAnimations({ subtree: true }).length
        )
    )
    .toBeGreaterThan(0)
})

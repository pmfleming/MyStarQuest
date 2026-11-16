import { expect, test } from '@playwright/test'

test('category views poof in and out in place, preserving previous activities', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 850 })
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await page.goto('/tests/fixtures/test-categories.html')
  await page.getByRole('textbox', { name: 'Numbers answer' }).fill('42')
  let previous = 'numbers'
  for (const next of ['Letters', 'Trivia', 'Stories', 'Numbers']) {
    await expect
      .poll(() =>
        page
          .locator(`#test-category-${previous}`)
          .evaluate((node) =>
            Number(
              getComputedStyle(
                node.closest('.whimsical-view-transition__surface')!
              ).opacity
            )
          )
      )
      .toBe(1)
    const result = await page
      .getByRole('radio', { name: next, exact: true })
      .evaluate(async (button, previous) => {
        const oldPanel = document
          .getElementById(`test-category-${previous}`)!
          .closest('.whimsical-view-transition')!
        ;(button as HTMLButtonElement).click()
        await new Promise((resolve) => setTimeout(resolve, 100))
        const newPanel = document.querySelector(
          '.whimsical-view-transition[data-open="true"]'
        )!
        const opacity = (panel: Element) =>
          Number(
            getComputedStyle(
              panel.querySelector('.whimsical-view-transition__surface')!
            ).opacity
          )
        return {
          oldOpacity: opacity(oldPanel),
          newOpacity: opacity(newPanel),
          sameTop:
            Math.abs(
              oldPanel.getBoundingClientRect().top -
                newPanel.getBoundingClientRect().top
            ) < 1,
          oldInert: oldPanel.hasAttribute('inert'),
        }
      }, previous)
    expect(result.oldOpacity).toBeGreaterThan(0)
    expect(result.oldOpacity).toBeLessThan(1)
    expect(result.newOpacity).toBeGreaterThan(0)
    expect(result.newOpacity).toBeLessThan(1)
    expect(result.sameTop).toBe(true)
    expect(result.oldInert).toBe(true)
    await expect(page.locator(`#test-category-${previous}`)).toBeHidden()
    await expect(
      page.getByRole('region', { name: next, exact: true })
    ).toBeVisible()
    previous = next.toLowerCase()
  }
  await expect(
    page.getByRole('textbox', { name: 'Numbers answer' })
  ).toHaveValue('42')
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth
    )
  ).toBe(true)
})

test('rapid switches reverse cleanly and reduced motion switches immediately', async ({
  page,
}) => {
  await page.goto('/tests/fixtures/test-categories.html')
  await page.getByRole('textbox', { name: 'Numbers answer' }).fill('7')
  await page
    .getByRole('radio', { name: 'Letters', exact: true })
    .evaluate(async (button) => {
      ;(button as HTMLButtonElement).click()
      await new Promise((resolve) => setTimeout(resolve, 80))
      ;(
        document.querySelector(
          '[role="radio"][aria-label="Trivia"]'
        ) as HTMLButtonElement
      ).click()
      await new Promise((resolve) => setTimeout(resolve, 80))
      ;(
        document.querySelector(
          '[role="radio"][aria-label="Numbers"]'
        ) as HTMLButtonElement
      ).click()
    })
  await expect(
    page.locator('.whimsical-view-transition:not([hidden])')
  ).toHaveCount(1)
  await expect(
    page.getByRole('textbox', { name: 'Numbers answer' })
  ).toHaveValue('7')
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.getByRole('radio', { name: 'Letters', exact: true }).click()
  await expect(
    page.locator('.whimsical-view-transition:not([hidden])')
  ).toHaveCount(1)
  expect(
    await page
      .locator('#test-category-letters')
      .evaluate(
        (node) =>
          node
            .closest('.whimsical-view-transition')!
            .getAnimations({ subtree: true }).length
      )
  ).toBe(0)
})

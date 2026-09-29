import { expect, test } from '@playwright/test'

test('fractions fits a small phone and completes through the shared controls (teenie)', async ({
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
  await expect(
    page.getByRole('img', { name: 'Example: 1 out of 2 equal parts' })
  ).toBeVisible()
  for (const [denominator, pieces] of [
    [2, [2]],
    [2, [1]],
    [9, [9]],
    [9, [2]],
    [9, [3]],
  ] as const) {
    for (const index of pieces) {
      const piece = page.getByRole('button', {
        name: `Piece ${index} of ${denominator}`,
      })
      await expect(piece).toBeEnabled()
      const bounds = await piece.boundingBox()
      expect(bounds!.width).toBeGreaterThanOrEqual(44)
      expect(bounds!.height).toBeGreaterThanOrEqual(44)
      const angle = ((index - 0.5) / denominator) * Math.PI * 2 - Math.PI / 2
      if (denominator === 2) {
        await piece.focus()
        await page.keyboard.press('Space')
      } else if (index === 9) {
        const shortcut = page.getByRole('button', {
          name: 'Select slice 9',
          exact: true,
        })
        const shortcutBounds = await shortcut.boundingBox()
        expect(shortcutBounds!.width).toBeGreaterThanOrEqual(44)
        expect(shortcutBounds!.height).toBeGreaterThanOrEqual(44)
        await shortcut.click()
      } else
        await piece.click({
          position: {
            x: bounds!.width * (0.5 + 0.33 * Math.cos(angle)),
            y: bounds!.height * (0.5 + 0.33 * Math.sin(angle)),
          },
        })
    }
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth
      )
    ).toBe(true)
    if (denominator === 9 && pieces[0] === 3) {
      await page.screenshot({
        path: `test-results/fractions-${theme}-active.png`,
      })
    }
    await check.click()
    await expect(
      page.getByRole('button', {
        name: `Piece ${pieces[0]} of ${denominator}`,
      })
    ).toBeDisabled()
    // Wait for the shared celebration/advance before answering the next puzzle.
    await expect(
      page.locator('button.fraction-food-piece:disabled')
    ).toHaveCount(0)
  }
  await expect(page.getByLabel('Completion count')).toHaveText('1')
  await expect(check).not.toBeVisible()
  await page.screenshot({
    path: `test-results/fractions-${theme}-complete.png`,
  })
})

test('level three completes a fraction with multiple pieces (princess)', async ({
  page,
}) => {
  const theme = 'princess'
  await page.setViewportSize({ width: 320, height: 800 })
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto(`/tests/fixtures/fractions.html?theme=${theme}`, {
    waitUntil: 'domcontentloaded',
  })
  await page
    .getByRole('radio', { name: 'Fractions with several pieces' })
    .click()
  await page.getByRole('button', { name: 'Run Fractions', exact: true }).click()
  await expect(
    page.getByRole('img', { name: 'Example: 2 out of 4 equal parts' })
  ).toBeVisible()
  await page
    .getByRole('button', { name: '2 out of 4 equal parts', exact: true })
    .click()
  await page
    .getByRole('button', { name: 'Check result Fractions', exact: true })
    .click()
  await expect(
    page.getByRole('button', { name: '2 out of 4 equal parts', exact: true })
  ).toBeDisabled()
  await expect(
    page.getByRole('img', { name: 'Example: 2 out of 3 equal parts' })
  ).toBeVisible()
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth
    )
  ).toBe(true)
})

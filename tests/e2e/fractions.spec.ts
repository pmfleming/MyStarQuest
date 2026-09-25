import { expect, test } from '@playwright/test'

for (const theme of ['teenie']) {
  test(`fractions fits a small phone and completes through the shared controls (${theme})`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 320, height: 800 })
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto(`/tests/fixtures/fractions.html?theme=${theme}`)
    await page
      .getByRole('button', { name: 'Run Fractions', exact: true })
      .click()
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
      [4, [4]],
      [4, [2]],
      [4, [1, 3, 4]],
    ] as const) {
      for (const index of pieces) {
        const piece = page.getByRole('button', {
          name: `Piece ${index} of ${denominator}`,
        })
        await expect(piece).toBeEnabled()
        const bounds = await piece.boundingBox()
        expect(bounds!.width).toBeGreaterThanOrEqual(44)
        expect(bounds!.height).toBeGreaterThanOrEqual(44)
        await piece.click()
      }
      const bars = page.locator('.fraction-bar')
      if ((await bars.count()) === 2) {
        expect((await bars.nth(0).boundingBox())!.width).toBeCloseTo(
          (await bars.nth(1).boundingBox())!.width,
          0
        )
      }
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= window.innerWidth
        )
      ).toBe(true)
      if (pieces.length === 3) {
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
      await expect(page.locator('button.fraction-piece:disabled')).toHaveCount(
        0
      )
    }
    await expect(page.getByLabel('Completion count')).toHaveText('1')
    await expect(check).not.toBeVisible()
    await page.screenshot({
      path: `test-results/fractions-${theme}-complete.png`,
    })
  })
}

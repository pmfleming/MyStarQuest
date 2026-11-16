import { expect, test } from '@playwright/test'

for (const width of [320, 560]) {
  test(`child avatars fit and remain selected across themes at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 1000 })
    await page.goto('/tests/fixtures/child-avatars.html')
    const picker = page.getByRole('group', { name: 'Select Avatar' })
    await picker
      .getByRole('button', { name: 'Next: Mermaid Odette Ping' })
      .click()
    await expect(
      picker.getByLabel('Selected: Mermaid Odette Ping')
    ).toBeVisible()
    await page.getByRole('button', { name: 'Next: Princess' }).click()
    await expect(
      picker.getByLabel('Selected: Mermaid Odette Ping')
    ).toBeVisible()
    await picker
      .getByRole('button', { name: 'Next: Angel Odette Ping' })
      .focus()
    await page.keyboard.press('Enter')
    await expect(picker.getByLabel('Selected: Angel Odette Ping')).toBeVisible()
    const bounds = await picker.boundingBox()
    expect(bounds!.x).toBeGreaterThanOrEqual(0)
    expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(width)
    await expect(picker.locator('img')).toHaveCount(3)
    await expect
      .poll(() =>
        picker
          .locator('img')
          .evaluateAll((images) =>
            images.every(
              (image) =>
                image instanceof HTMLImageElement &&
                image.complete &&
                image.naturalWidth > 0
            )
          )
      )
      .toBe(true)
    await page.screenshot({
      path: `target/child-avatars-${width}.png`,
      fullPage: true,
    })
  })
}

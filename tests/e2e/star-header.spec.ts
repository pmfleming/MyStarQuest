import { expect, test } from '@playwright/test'

for (const width of [320, 560]) {
  test(`avatar and star replace the title bar at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 850 })
    await page.goto('/tests/fixtures/star-header.html')
    const header = page.getByRole('banner')
    const replay = page.getByRole('button', { name: 'Replay star animation' })
    const menu = page.getByRole('button', { name: 'Open menu' })
    await expect(header).toHaveCount(1)
    const name = header.getByText('Odette', { exact: true })
    await expect(name).toBeHidden()
    const count = header.getByText('103', { exact: true })
    await expect(count).toBeHidden()
    await expect(menu).toHaveCSS('animation-name', 'star-info-avatar-in')
    await expect(replay).toHaveAttribute('data-phase', 'gathered', {
      timeout: 10000,
    })
    await expect(count).toBeVisible()
    await expect(name).toBeVisible()
    await expect(count).toHaveCSS('opacity', '1')
    await expect(name).toHaveCSS('opacity', '1')
    const starBounds = (await header.locator('.star-info__hero').boundingBox())!
    const middleBounds = (await header
      .locator('.star-info__identity')
      .boundingBox())!
    const avatarBounds = (await menu.boundingBox())!
    expect(avatarBounds.x + avatarBounds.width).toBeLessThanOrEqual(
      middleBounds.x + 1
    )
    expect(middleBounds.x + middleBounds.width / 2).toBeLessThan(starBounds.x)
    await expect(name).toHaveCSS('font-family', /MSQ Nunito/)
    await expect(count).toHaveCSS('color', 'rgb(181, 62, 136)')
    await expect(
      header.locator('.star-info__text-sparkles span').first()
    ).toHaveCSS('animation-name', 'star-info-twinkle')
    await expect(header.getByText('stars', { exact: true })).toHaveCount(0)
    await expect(header.getByText('···')).toHaveCount(0)
    await expect(header.getByText('↻')).toHaveCount(0)
    await expect(menu).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)')
    await expect(menu).toHaveCSS('border-width', '0px')
    await expect(header.locator('.star-info__twinkles span').first()).toHaveCSS(
      'animation-name',
      'star-info-twinkle'
    )
    await expect(header.locator('.star-info__twinkles span').first()).toHaveCSS(
      'animation-iteration-count',
      'infinite'
    )
    for (const control of [header, menu, replay, header.getByRole('status')]) {
      const bounds = (await control.boundingBox())!
      expect(bounds.x).toBeGreaterThanOrEqual(0)
      expect(bounds.x + bounds.width).toBeLessThanOrEqual(width)
    }
    const firstChore = (await page
      .getByText('Chore 1', { exact: true })
      .boundingBox())!
    const headerBounds = (await header.boundingBox())!
    expect(firstChore.y).toBeGreaterThan(headerBounds.y + headerBounds.height)
    await page.screenshot({ path: `target/star-header-${width}.png` })
    await replay.click()
    await expect(replay).not.toHaveAttribute('data-phase', 'gathered')
    await expect(count).toBeHidden()
    await expect(name).toBeHidden()
    await expect(page.getByRole('dialog')).toHaveCount(0)
    await menu.click()
    await expect(page.getByRole('dialog', { name: 'Menu' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Sign out' })).toBeVisible()
    await page.getByRole('button', { name: 'Reset today' }).click()
    await expect(page.getByRole('dialog')).toHaveCount(0)
    await expect(menu).toBeFocused()
    await expect(page.getByLabel('Resets')).toHaveText('1')
    await menu.click()
    await page.getByRole('button', { name: 'Children' }).click()
    await expect(
      page.getByRole('heading', { name: 'Children settings' })
    ).toBeVisible()
  })
}

test('keeps the header usable with reduced motion and a long name', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.setViewportSize({ width: 320, height: 850 })
  await page.goto(
    '/tests/fixtures/star-header.html?theme=princess&name=Odette%20Alexandra'
  )
  const replay = page.getByRole('button', { name: 'Replay star animation' })
  await replay.click()
  await expect(replay).toHaveAttribute('data-phase', 'gathered')
  await expect(page.getByRole('status', { name: '103 stars' })).toBeVisible()
  const name = page.getByRole('heading', { name: 'Odette Alexandra' })
  await expect(name).toBeVisible()
  await expect(name).toHaveCSS('font-family', /MSQ Merienda/)
  await expect(page.getByText('103', { exact: true })).toHaveCSS(
    'color',
    'rgb(236, 72, 153)'
  )
  await page.screenshot({ path: 'target/star-header-princess.png' })
  await page.getByRole('button', { name: 'Open menu' }).click()
  await page.keyboard.press('Escape')
  await expect(page.getByRole('button', { name: 'Open menu' })).toBeFocused()
})

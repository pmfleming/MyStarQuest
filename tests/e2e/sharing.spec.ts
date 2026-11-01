import { expect, test } from '@playwright/test'

for (const theme of ['princess', 'teenie']) {
  for (const touch of [true, false]) {
    test.describe(`${theme} ${touch ? 'touch phone' : 'keyboard desktop'}`, () => {
      test.use({
        hasTouch: touch,
        viewport: touch
          ? { width: 320, height: 800 }
          : { width: 1280, height: 900 },
      })

      test('shares all symbols using the standard activity controls without overflow', async ({
        page,
      }) => {
        await page.addInitScript(() => {
          Math.random = () => 0.999
        })
        await page.goto(`/tests/fixtures/sharing.html?theme=${theme}`)
        const activate = async (name: string) => {
          const button = page.getByRole('button', { name, exact: true })
          if (touch) await button.tap()
          else {
            await button.focus()
            await page.keyboard.press('Enter')
          }
        }
        await page
          .getByRole('radio', { name: 'Mixed: 2, 3 or 4 containers' })
          .click()
        await activate('Run Share Equally')
        const noun = theme === 'teenie' ? 'symbols' : 'crowns'
        const board = page.getByRole('group', {
          name: `Share 24 ${noun} equally between 4 containers`,
          exact: true,
        })
        await expect(board).toBeVisible()
        for (const button of await board.getByRole('button').all()) {
          const bounds = await button.boundingBox()
          expect(bounds!.width).toBeGreaterThanOrEqual(44)
          expect(bounds!.height).toBeGreaterThanOrEqual(44)
        }
        // Even a mistaken distribution must render every symbol without clipping.
        for (let i = 0; i < 24; i++) await activate('Add one to container 1')
        await expect(board.locator('img')).toHaveCount(24)
        await expect(
          page.getByRole('button', {
            name: 'Add one to container 2',
            exact: true,
          })
        ).toBeDisabled()
        expect(
          await board.evaluate((element) => {
            const bounds = element.getBoundingClientRect()
            return Array.from(element.querySelectorAll('img')).every(
              (image) => {
                const box = image.getBoundingClientRect()
                return (
                  image.complete &&
                  image.naturalWidth > 0 &&
                  box.left >= bounds.left &&
                  box.right <= bounds.right
                )
              }
            )
          })
        ).toBe(true)
        for (let i = 0; i < 18; i++)
          await activate('Return one from container 1')
        for (let container = 2; container <= 4; container++) {
          for (let i = 0; i < 6; i++)
            await activate(`Add one to container ${container}`)
        }
        await expect(
          page.getByRole('group', {
            name: `0 ${noun} left to share`,
            exact: true,
          })
        ).toBeVisible()
        expect(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= window.innerWidth
          )
        ).toBe(true)
        await page.screenshot({
          path: `test-results/sharing-${theme}-${touch ? 'phone' : 'desktop'}.png`,
          fullPage: true,
          animations: 'disabled',
        })
        await activate('Check result Share Equally')
        await expect(page.getByLabel('Completion count')).toHaveText('1')
        await expect(board).not.toBeVisible()
        await activate('Reset Share Equally')
        await activate('Yes, reset')
        await page.getByRole('radio', { name: 'Easy' }).click()
        await activate('Run Share Equally')
        await expect(
          page.getByRole('group', {
            name: `Share 12 ${noun} equally between 2 containers`,
            exact: true,
          })
        ).toBeVisible()
        await expect(
          page.getByRole('group', {
            name: `12 ${noun} left to share`,
            exact: true,
          })
        ).toBeVisible()
        expect(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= window.innerWidth
          )
        ).toBe(true)
        await page.screenshot({
          path: `test-results/sharing-${theme}-${touch ? 'phone' : 'desktop'}-easy.png`,
          fullPage: true,
          animations: 'disabled',
        })
      })
    })
  }
}

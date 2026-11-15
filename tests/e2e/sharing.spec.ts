import { expect, test } from '@playwright/test'

const FRIENDS = {
  princess: ['Rosa', 'Lily', 'Amara', 'Ruby'],
  teenie: ['Heartsping', 'Happying', 'Lalaping', 'Sparkleping'],
}

for (const theme of ['princess', 'teenie'] as const) {
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
          .getByRole('radio', { name: 'Mixed: 2, 3 or 4 friends' })
          .click()
        await activate('Run Share Equally')
        const friends = FRIENDS[theme]
        // The shared treat varies per question, so match any themed noun.
        const board = page.getByRole('group', {
          name: /^Share 24 [a-z]+ equally between 4 friends$/,
        })
        await expect(board).toBeVisible()
        const expectCardFits = async () => {
          const bounds = await page.locator('[data-card-shell]').boundingBox()
          expect(bounds!.height).toBeLessThanOrEqual(
            page.viewportSize()!.height - 32
          )
          expect(bounds!.width).toBeLessThanOrEqual(380)
        }
        await expectCardFits()
        const items = board.locator('.sharing-counters > *')
        for (const button of await board.getByRole('button').all()) {
          const bounds = await button.boundingBox()
          expect(bounds!.width).toBeGreaterThanOrEqual(44)
          expect(bounds!.height).toBeGreaterThanOrEqual(44)
        }
        // Even a mistaken distribution must render every symbol without clipping.
        for (let i = 0; i < 24; i++) await activate(`Give one to ${friends[0]}`)
        await expect(items).toHaveCount(24)
        await expectCardFits()
        await expect(
          page.getByRole('button', {
            name: `Give one to ${friends[1]}`,
            exact: true,
          })
        ).toBeDisabled()
        // Tokens briefly travel above the rim before settling inside the bowl.
        await board
          .locator('.sharing-token-dropped')
          .evaluateAll(async (tokens) => {
            await Promise.all(
              tokens
                .flatMap((token) => token.getAnimations())
                .map((animation) => animation.finished)
            )
          })
        expect(
          await board.evaluate((element) => {
            const bounds = element.getBoundingClientRect()
            return Array.from(
              element.querySelectorAll('.sharing-counters > *')
            ).every((item) => {
              const box = item.getBoundingClientRect()
              const loaded =
                !(item instanceof HTMLImageElement) ||
                (item.complete && item.naturalWidth > 0)
              return (
                loaded &&
                box.left >= bounds.left &&
                box.right <= bounds.right &&
                box.top >=
                  item.parentElement!.parentElement!.getBoundingClientRect()
                    .top &&
                box.bottom <=
                  item.parentElement!.parentElement!.getBoundingClientRect()
                    .bottom
              )
            })
          })
        ).toBe(true)
        await expect(board.locator('[data-mood="sad"]')).toHaveCount(3)
        for (let i = 0; i < 18; i++)
          await activate(`Take one back from ${friends[0]}`)
        for (const friend of friends.slice(1)) {
          for (let i = 0; i < 6; i++) await activate(`Give one to ${friend}`)
        }
        await expect(
          page.getByRole('group', { name: /^0 [a-z]+ left to share$/ })
        ).toBeVisible()
        await expect(board.locator('[data-mood="happy"]')).toHaveCount(4)
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
            name: /^Share 12 [a-z]+ equally between 2 friends$/,
          })
        ).toBeVisible()
        await expect(
          page.getByRole('group', {
            name: /^12 [a-z]+ left to share$/,
          })
        ).toBeVisible()
        expect(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= window.innerWidth
          )
        ).toBe(true)
        await expectCardFits()
        await page.screenshot({
          path: `test-results/sharing-${theme}-${touch ? 'phone' : 'desktop'}-easy.png`,
          fullPage: true,
          animations: 'disabled',
        })
      })
    })
  }
}

import { expect, test, type Page } from '@playwright/test'
import layout from '../../src/data/stories/dinosaurFlightLayout.json' with { type: 'json' }

async function openFlight(page: Page, offset = 0) {
  await page.goto('/tests/fixtures/story-reader.html')
  const reader = page.getByRole('dialog')
  await page.getByRole('button', { name: 'Read Sea friends' }).click()
  await expect(reader).toHaveAttribute('data-story-opening', 'false')
  const show = page.getByRole('button', { name: 'Show story controls' })
  if (await show.isVisible()) await show.click()
  const slider = page.getByRole('slider', { name: 'Story progress' })
  await slider.fill(
    String(
      Number(await slider.getAttribute('max')) - layout.length + 1 + offset
    )
  )
  await expect(page.locator('.dinosaur-flight-scene.ready.flying')).toHaveCount(
    1
  )
  const hide = page.getByRole('button', { name: 'Hide story controls' })
  if (await hide.isVisible()) await hide.click()
  await reader.focus()
}

async function finishBridge(page: Page) {
  const bridge = page.locator(
    '.story-transition[data-transition="dinosaur-flight"]'
  )
  await expect(bridge).toHaveAttribute('data-ready', 'true')
  await expect(bridge.locator('.dinosaur-flight-bridge-rider')).toHaveCount(3)
  await bridge.evaluate((element) =>
    element
      .getAnimations({ subtree: true })
      .forEach((animation) => animation.finish())
  )
  await expect(bridge).toHaveCount(0)
  await expect(page.locator('.dinosaur-flight-scene.ready.flying')).toHaveCount(
    1
  )
}

for (const width of [1280, 390]) {
  test(`all three mounted friends take off, swoop between pages, and visit every habitat (${width})`, async ({
    page,
  }, testInfo) => {
    test.setTimeout(90000)
    const errors: string[] = []
    page.on('pageerror', (error) => errors.push(error.message))
    await page.setViewportSize({ width, height: width === 390 ? 844 : 800 })
    await openFlight(page)
    const scene = page.locator('.dinosaur-flight-scene.ready.flying')
    await expect(scene).toHaveAttribute('data-mode', 'boarding')
    await page.screenshot({ path: testInfo.outputPath('boarding.png') })
    await page.keyboard.press('ArrowRight')
    const bridge = page.locator(
      '.story-transition[data-transition="dinosaur-flight"]'
    )
    await expect(bridge).toHaveAttribute('data-ready', 'true')
    await bridge.evaluate((element) =>
      element.getAnimations({ subtree: true }).forEach((animation) => {
        animation.pause()
        animation.currentTime = 1400
      })
    )
    await page.screenshot({ path: testInfo.outputPath('between-panels.png') })
    await finishBridge(page)
    await expect(scene).toHaveAttribute('data-mode', 'takeoff')
    const climb = await scene
      .locator('[data-rider="odette"]')
      .evaluate((element) => {
        const animation = element.getAnimations()[0]!
        animation.pause()
        const positions = [0, 6000].map((time) => {
          animation.currentTime = time
          const style = getComputedStyle(element)
          return {
            bottom: parseFloat(style.bottom),
            width: parseFloat(style.width),
          }
        })
        return positions
      })
    expect(climb[1]!.bottom).toBeGreaterThan(climb[0]!.bottom)
    expect(climb[1]!.width).toBeLessThan(climb[0]!.width)
    await page.screenshot({ path: testInfo.outputPath('takeoff.png') })
    for (const destination of layout.slice(2)) {
      await page.keyboard.press('ArrowRight')
      await finishBridge(page)
      await expect(scene).toHaveAttribute('data-panel-id', destination.id)
      await expect(scene.locator('.dinosaur-flight-rider')).toHaveCount(3)
      await expect(scene.locator('[data-mount="digosaurus"]')).toHaveCount(2)
      await expect(scene.locator('[data-rider="diana"] img')).toHaveAttribute(
        'src',
        /diana-riding\.webp/
      )
      await expect(scene.locator('[data-rider="eclipse"] img')).toHaveAttribute(
        'src',
        /eclipse-riding\.webp/
      )
      await expect(scene.locator('[data-rider="odette"] img')).toHaveAttribute(
        'src',
        /riding-lookdown\.webp/
      )
      await expect(scene.locator('.dinosaur-flight-visitor')).toHaveCount(
        destination.visitors.length
      )
      for (const visitor of destination.visitors)
        await expect(
          scene.locator(`[data-dinosaur="${visitor.id}"] img`)
        ).toBeVisible()
      expect(
        await scene.evaluate(
          (element) => element.getAnimations({ subtree: true }).length
        )
      ).toBeGreaterThan(5)
      await scene.evaluate((element) =>
        element.getAnimations({ subtree: true }).forEach((animation) => {
          animation.pause()
          animation.currentTime = 0
        })
      )
      await page.screenshot({
        path: testInfo.outputPath(`${destination.background}.png`),
      })
    }
    // Backward page turns also carry the complete party, and reduced motion settles in place.
    await page.keyboard.press('ArrowLeft')
    await finishBridge(page)
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await expect
      .poll(() =>
        scene.evaluate(
          (element) => element.getAnimations({ subtree: true }).length
        )
      )
      .toBe(0)
    await page.keyboard.press('ArrowRight')
    await expect(scene).toHaveAttribute('data-panel-id', layout.at(-1)!.id)
    await expect(page.locator('.story-transition')).toHaveCount(0)
    const showControls = page.getByRole('button', {
      name: 'Show story controls',
    })
    if (await showControls.isVisible()) await showControls.click()
    await page.getByRole('button', { name: 'Return to tests' }).click()
    await expect(page.locator('.dinosaur-flight-scene')).toHaveCount(0)
    expect(errors).toEqual([])
  })
}

test('missing flight layers keep the complete illustration and fast navigation cancels bridges', async ({
  page,
}) => {
  await page.route('**/rainbowasaurus-flight/diana-riding.webp', (route) =>
    route.abort()
  )
  await page.goto('/tests/fixtures/story-reader.html')
  await page.getByRole('button', { name: 'Read Sea friends' }).click()
  await expect(page.getByRole('dialog')).toHaveAttribute(
    'data-story-opening',
    'false'
  )
  const slider = page.getByRole('slider', { name: 'Story progress' })
  await slider.fill((await slider.getAttribute('max'))!)
  await expect(page.locator('.story-page-current')).toHaveAttribute(
    'src',
    /70-dinosaur-cloud-flight\.webp/
  )
  await expect(page.locator('.dinosaur-flight-scene.ready')).toHaveCount(0)
  await page
    .locator('.story-page-current')
    .evaluate((image: HTMLImageElement) => image.decode())
  await expect(page.locator('.story-page-current')).toBeVisible()
  await page.unroute('**/rainbowasaurus-flight/diana-riding.webp')
  await page.getByRole('dialog').focus()
  await page.keyboard.press('ArrowLeft')
  await expect(page.locator('.story-transition')).toHaveAttribute(
    'data-transition',
    'dinosaur-flight'
  )
  await page.keyboard.press('Home')
  await expect(page.locator('.dinosaur-flight-scene')).toHaveCount(0)
  await expect(page.locator('.story-page-current')).toHaveAttribute(
    'src',
    /sea-friends-poster/
  )
})

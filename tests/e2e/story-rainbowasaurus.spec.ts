import { expect, test, type Page } from '@playwright/test'
import flightLayout from '../../src/data/stories/dinosaurFlightLayout.json' with { type: 'json' }

async function openArrival(page: Page) {
  await page.goto('/tests/fixtures/story-reader.html')
  await page.getByRole('button', { name: 'Read Sea friends' }).click()
  await expect(page.getByRole('dialog')).toHaveAttribute(
    'data-story-opening',
    'false'
  )
  const handle = page.getByRole('button', { name: 'Show story controls' })
  if (await handle.isVisible()) await handle.click()
  const slider = page.getByRole('slider', { name: 'Story progress' })
  await slider.fill(
    String(Number(await slider.getAttribute('max')) - flightLayout.length)
  )
  await expect(page.locator('.story-artwork')).toHaveAttribute(
    'aria-busy',
    'false'
  )
}

for (const width of [1280, 390]) {
  test(`Rainbowasaurus descends from the sky at riding size and replays (${width})`, async ({
    page,
  }, testInfo) => {
    await page.setViewportSize({ width, height: width === 390 ? 844 : 800 })
    await openArrival(page)
    const scene = page.locator('.rainbowasaurus-arrival-scene.ready.flying')
    await expect(scene).toHaveCount(1)
    const actor = scene.locator('.rainbowasaurus-arrival-actor')
    const samples = await actor.evaluate((element) => {
      const animation = element.getAnimations()[0]!
      animation.pause()
      return [0, 2100, 4340, 7000].map((time) => {
        animation.currentTime = time
        const style = getComputedStyle(element)
        const transform = new DOMMatrixReadOnly(style.transform)
        const parent = element.parentElement!
        return {
          top: parseFloat(style.top) / parent.clientHeight,
          width: parseFloat(style.width) / parent.clientWidth,
          scale: Math.hypot(transform.a, transform.b),
          opacity: Number(style.opacity),
        }
      })
    })
    expect(samples[0]!.top).toBeLessThan(0)
    expect(samples[0]!.opacity).toBe(0)
    for (let i = 1; i < samples.length; i++) {
      expect(samples[i]!.top).toBeGreaterThan(samples[i - 1]!.top)
      expect(samples[i]!.scale).toBeGreaterThan(samples[i - 1]!.scale)
    }
    expect(samples[3]!.scale).toBeCloseTo(1)
    expect(samples[3]!.width).toBeCloseTo(0.6, 2)
    const sprite = scene.locator('.rainbowasaurus-arrival-sprite')
    await expect(sprite).toHaveAttribute('src', /princess-rainbowasaurus\.png/)
    await scene.evaluate((element) => {
      element.getAnimations({ subtree: true }).forEach((animation) => {
        animation.pause()
        animation.currentTime = 7000
      })
    })
    await page.screenshot({ path: testInfo.outputPath('arrival-at-dig.png') })

    // Leaving releases the scene; returning starts a fresh descent.
    const slider = page.getByRole('slider', { name: 'Story progress' })
    const last = Number(await slider.getAttribute('max')) - flightLayout.length
    await slider.fill(String(last - 1))
    await expect(scene).toHaveCount(0)
    await slider.fill(String(last))
    await expect(scene).toHaveCount(1)
    expect(
      await actor.evaluate((element) => element.getAnimations()[0]!.currentTime)
    ).toBeLessThan(2000)

    await page.emulateMedia({ reducedMotion: 'reduce' })
    await expect
      .poll(() =>
        scene.evaluate(
          (element) => element.getAnimations({ subtree: true }).length
        )
      )
      .toBe(0)
    await expect(actor).toHaveCSS('opacity', '1')
    await page.getByRole('button', { name: 'Return to tests' }).click()
    await expect(page.locator('.rainbowasaurus-arrival-scene')).toHaveCount(0)
  })
}

test('a missing arrival layer leaves the complete resting illustration visible', async ({
  page,
}) => {
  await page.route(
    '**/layers/rainbowasaurus-arrival/background.webp',
    (route) => route.abort()
  )
  await openArrival(page)
  const fallback = page.locator('.story-page-current')
  await expect(fallback).toBeVisible()
  await expect(fallback).toHaveAttribute(
    'src',
    /62-rainbowasaurus-arrival\.webp/
  )
  await fallback.evaluate((image: HTMLImageElement) => image.decode())
  await expect(page.locator('.rainbowasaurus-arrival-scene.ready')).toHaveCount(
    0
  )
  await expect(page.getByRole('button', { name: 'Next page' })).toBeEnabled()
})

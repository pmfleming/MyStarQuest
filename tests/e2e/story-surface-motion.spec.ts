import { expect, test, type Locator } from '@playwright/test'

async function sampleMorph(reader: Locator) {
  return reader.evaluate((dialog) => {
    const stage = dialog.querySelector<HTMLElement>('.story-stage')!
    const sheet = dialog.querySelector<HTMLElement>('.story-page-surface')!
    const snapshot = dialog.querySelector<HTMLElement>('.story-phone-snapshot')!
    const animations = dialog
      .getAnimations({ subtree: true })
      .filter((animation) =>
        Number.isFinite(animation.effect!.getComputedTiming().endTime)
      )
    animations.forEach((animation) => animation.pause())
    const duration = Number(animations[0]!.effect!.getTiming().duration)
    return [0, 0.25, 0.5, 0.75, 0.99].map((fraction) => {
      animations.forEach((animation) => {
        animation.currentTime = duration * fraction
      })
      const style = getComputedStyle(stage)
      const transform = new DOMMatrixReadOnly(style.transform)
      return {
        fraction,
        width: stage.clientWidth,
        height: stage.clientHeight,
        paperWidth: sheet.offsetWidth,
        paperHeight: sheet.offsetHeight,
        opacity: Number(style.opacity),
        snapshotOpacity: Number(getComputedStyle(snapshot).opacity),
        scaleX: Math.hypot(transform.a, transform.b),
        scaleY: Math.hypot(transform.c, transform.d),
      }
    })
  })
}

for (const width of [1280, 390]) {
  test(`app/book morph keeps the book layout stable and fades synchronized (${width})`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: width === 390 ? 844 : 800 })
    await page.goto('/tests/fixtures/story-reader.html')
    await page
      .getByRole('img', { name: 'Sea friends story cover' })
      .evaluate((image: HTMLImageElement) => image.decode())
    await page.getByRole('button', { name: 'Read Sea friends' }).click()
    const reader = page.getByRole('dialog')
    await expect(reader).toHaveAttribute('data-story-opening', 'true')
    for (const direction of ['open', 'close']) {
      if (direction === 'close') {
        await reader.dispatchEvent('cancel')
        await expect(reader).toHaveAttribute('data-story-closing', 'true')
      }
      const samples = await sampleMorph(reader)
      for (const sample of samples) {
        for (const key of [
          'width',
          'height',
          'paperWidth',
          'paperHeight',
        ] as const)
          expect(sample[key]).toBe(samples[0]![key])
        expect(sample.scaleX).toBeCloseTo(sample.scaleY, 5)
        expect(sample.opacity + sample.snapshotOpacity).toBeCloseTo(1, 5)
      }
      if (direction === 'open')
        expect(samples[4]!.opacity).toBeGreaterThan(samples[0]!.opacity)
      else expect(samples[4]!.opacity).toBeLessThan(samples[0]!.opacity)
      await reader.evaluate((dialog) =>
        dialog.getAnimations({ subtree: true }).forEach((animation) => {
          if (Number.isFinite(animation.effect!.getComputedTiming().endTime))
            animation.finish()
        })
      )
      if (direction === 'open') {
        await expect(reader).toHaveAttribute('data-story-opening', 'false')
        expect(
          await reader
            .locator('.story-stage')
            .evaluate((element: HTMLElement) => element.style.cssText)
        ).toBe('')
        await expect(reader.locator('.story-phone-snapshot')).toHaveCount(0)
      } else await expect(reader).toHaveCount(0)
    }
  })
}

test('reversing a morph preserves the visible shape and image scale', async ({
  page,
}, testInfo) => {
  await page.setViewportSize({ width: 1280, height: 800 })
  await page.goto('/tests/fixtures/story-reader.html')
  await page.getByRole('button', { name: 'Read Sea friends' }).click()
  const reader = page.getByRole('dialog')
  await expect(reader).toHaveAttribute('data-story-opening', 'true')
  const capture = async (time: number) =>
    reader.evaluate((dialog, at) => {
      dialog.getAnimations({ subtree: true }).forEach((animation) => {
        animation.pause()
        animation.currentTime = at
      })
      return [dialog, dialog.querySelector('.story-stage')!].map((element) => {
        const bounds = element.getBoundingClientRect()
        return [bounds.x, bounds.y, bounds.width, bounds.height]
      })
    }, time)
  const before = await capture(600)
  await page.screenshot({ path: testInfo.outputPath('opening-midway.png') })
  await reader.dispatchEvent('cancel')
  await expect(reader).toHaveAttribute('data-story-closing', 'true')
  const after = await capture(0)
  after.forEach((bounds, index) =>
    bounds.forEach((value, axis) =>
      expect(value).toBeCloseTo(before[index]![axis]!, 0)
    )
  )
  await reader.evaluate((dialog) =>
    dialog
      .getAnimations({ subtree: true })
      .forEach((animation) => animation.finish())
  )
  await expect(reader).toHaveCount(0)
  await expect(page.locator('.story-phone-snapshot')).toHaveCount(0)
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.getByRole('button', { name: 'Read Sea friends' }).click()
  await expect(reader).toHaveAttribute('data-story-opening', 'false')
  expect(
    await reader
      .locator('.story-stage')
      .evaluate((element: HTMLElement) => element.style.cssText)
  ).toBe('')
  await reader.dispatchEvent('cancel')
  await expect(reader).toHaveCount(0)
})

import { expect, type Page } from '@playwright/test'

export async function checkNormalStoryTransition(
  page: Page,
  frameSelector: string
) {
  const stage = page.locator('.transition-normal')
  await expect(stage).toHaveAttribute('data-ready', 'true')
  const samples = await stage.evaluate((element, selector) => {
    const frame = document.querySelector<HTMLElement>(selector)!
    const animations = [
      ...element.getAnimations({ subtree: true }),
      ...frame.getAnimations(),
    ]
    const duration = Number(animations[0]!.effect!.getTiming().duration)
    animations.forEach((animation) => animation.pause())
    const source =
      element.querySelector<HTMLImageElement>('.transition-source')!
    const illustration = element.querySelector('.story-paper-illustration')!
    return [0, 0.3, 0.59, 0.6, 0.8, 0.99].map((fraction) => {
      animations.forEach((animation) => {
        animation.currentTime = duration * fraction
      })
      const art = illustration.getBoundingClientRect()
      const image = source.getBoundingClientRect()
      const paper = element.getBoundingClientRect()
      const destination = frame.getBoundingClientRect()
      const transform = new DOMMatrixReadOnly(
        getComputedStyle(source).transform
      )
      return {
        fraction,
        visible: getComputedStyle(frame).visibility,
        opacity: Number(getComputedStyle(element).opacity),
        covers:
          image.left <= art.left + 1 &&
          image.top <= art.top + 1 &&
          image.right >= art.right - 1 &&
          image.bottom >= art.bottom - 1,
        scaleX: transform.a,
        scaleY: transform.d,
        paper: [paper.x, paper.y, paper.width, paper.height],
        destination: [
          destination.x,
          destination.y,
          destination.width,
          destination.height,
        ],
        paperInset: Math.min(art.left - paper.left, art.top - paper.top),
      }
    })
  }, frameSelector)
  for (const sample of samples) {
    expect(sample.covers).toBe(true)
    expect(sample.scaleX).toBeCloseTo(sample.scaleY, 5)
    expect(sample.paperInset).toBeGreaterThan(0)
    if (sample.fraction < 0.6) {
      expect(sample.visible).toBe('hidden')
      expect(sample.opacity).toBe(1)
    } else {
      if (sample.fraction > 0.6) expect(sample.visible).toBe('visible')
      sample.paper.forEach((value, i) =>
        expect(value).toBeCloseTo(sample.destination[i]!, 0)
      )
      expect(sample.opacity).toBeCloseTo((1 - sample.fraction) / 0.4, 2)
    }
  }
  await page.locator(frameSelector).evaluate((frame) => {
    const stage = document.querySelector('.transition-normal')!
    ;[
      ...stage.getAnimations({ subtree: true }),
      ...frame.getAnimations(),
    ].forEach((animation) => animation.finish())
  })
  await expect(stage).toHaveCount(0)
  await expect(page.locator(frameSelector)).toHaveCSS('visibility', 'visible')
}

import type { Page } from '@playwright/test'

// Inspect geometry deterministically even when a short transition would finish
// before a browser round trip on a busy CI runner.
export async function pauseStorySurfaceAnimations(page: Page) {
  await page.evaluate(() => {
    const animate = Element.prototype.animate
    Element.prototype.animate = function (frames, options) {
      const animation = animate.call(this, frames, options)
      if (
        this.matches(
          '.story-reader, .story-stage, .story-phone-snapshot, .story-phone-snapshot > *'
        )
      ) {
        animation.pause()
      }
      return animation
    }
  })
}

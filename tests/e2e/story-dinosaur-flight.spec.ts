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
    element.getAnimations({ subtree: true }).forEach((animation) => {
      animation.pause()
      animation.currentTime = Number(animation.effect!.getTiming().duration) - 1
    })
  )
  const landing = await bridge
    .locator('.dinosaur-flight-bridge-rider > img:first-child')
    .evaluateAll((images) =>
      images.map((image) => {
        const rect = image.getBoundingClientRect()
        return {
          id: (image.parentElement as HTMLElement).dataset.rider,
          x: rect.x,
          y: rect.y,
          width: rect.width,
          height: rect.height,
        }
      })
    )
  const checkComposition = /dinosaur-meadow|dinosaur-cloud-flight/.test(
    (await bridge.getAttribute('data-destination'))!
  )
  const lastFrame = checkComposition
    ? await bridge
        .locator('.story-paper-illustration')
        .screenshot({ path: test.info().outputPath('handoff-before.png') })
    : null
  await bridge.evaluate((element) =>
    element
      .getAnimations({ subtree: true })
      .forEach((animation) => animation.finish())
  )
  await expect(bridge).toHaveCount(0)
  await expect(page.locator('.dinosaur-flight-scene.ready.flying')).toHaveCount(
    1
  )
  const scene = page.locator('.dinosaur-flight-scene.ready.flying')
  await scene.evaluate((element) =>
    element.getAnimations({ subtree: true }).forEach((animation) => {
      animation.pause()
      animation.currentTime = 0
    })
  )
  for (const pose of landing) {
    const settled = await scene
      .locator(`[data-rider="${pose.id}"] img`)
      .boundingBox()
    for (const axis of ['x', 'y', 'width', 'height'] as const)
      expect(
        Math.abs(settled![axis] - pose[axis]),
        `${pose.id} ${axis} at the handoff`
      ).toBeLessThan(1)
  }
  if (lastFrame) {
    const settledFrame = await page
      .locator('.story-page-surface > .story-paper-illustration')
      .screenshot({ path: test.info().outputPath('handoff-after.png') })
    const difference = await page.evaluate(
      async ([before, after]) => {
        async function pixels(base64: string) {
          const image = new Image()
          image.src = `data:image/png;base64,${base64}`
          await image.decode()
          const canvas = document.createElement('canvas')
          // Ignore fractional device-pixel resampling at the paper edge.
          canvas.width = 320
          canvas.height = Math.round((320 * image.height) / image.width)
          const context = canvas.getContext('2d')!
          context.drawImage(image, 0, 0, canvas.width, canvas.height)
          return context.getImageData(0, 0, canvas.width, canvas.height).data
        }
        const [a, b] = await Promise.all([pixels(before!), pixels(after!)])
        if (a.length !== b.length) return Infinity
        let error = 0
        // Match within one sample pixel to tolerate fractional CSS/GPU rasterization.
        for (let i = 0; i < a.length; i += 4) {
          let closest = Infinity
          const x = (i / 4) % 320
          for (let dy = -1; dy <= 1; dy++)
            for (let dx = -1; dx <= 1; dx++) {
              const j = i + (dy * 320 + dx) * 4
              if (x + dx < 0 || x + dx >= 320 || j < 0 || j + 2 >= b.length)
                continue
              let pixelError = 0
              for (let channel = 0; channel < 3; channel++)
                pixelError += Math.abs(a[i + channel]! - b[j + channel]!)
              closest = Math.min(closest, pixelError)
            }
          error += closest
        }
        return error / (a.length * 0.75)
      },
      [lastFrame.toString('base64'), settledFrame.toString('base64')]
    )
    expect(
      difference,
      'the foreground, characters and landscape must survive the handoff together'
      // Less than 1% RGB error allows browser resampling while catching a missing plane.
    ).toBeLessThan(2.5)
  }
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
    await scene.evaluate((element) =>
      element
        .getAnimations({ subtree: true })
        .forEach((animation) => animation.pause())
    )
    const boardingPose = await scene
      .locator('[data-rider="odette"] img')
      .boundingBox()
    await page.screenshot({ path: testInfo.outputPath('boarding.png') })
    await page.keyboard.press('ArrowRight')
    const bridge = page.locator(
      '.story-transition[data-transition="dinosaur-flight"]'
    )
    await expect(bridge).toHaveAttribute('data-ready', 'true')
    await bridge.evaluate((element) =>
      element.getAnimations({ subtree: true }).forEach((animation) => {
        animation.pause()
        animation.currentTime = 0
      })
    )
    const boardingDeparture = await bridge
      .locator('[data-rider="odette"] img:last-child')
      .boundingBox()
    for (const axis of ['x', 'y', 'width', 'height'] as const)
      expect(
        Math.abs(boardingDeparture![axis] - boardingPose![axis])
      ).toBeLessThan(1)
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
    // Turn before the climb is finished: the bridge must retain this exact pose.
    await scene.locator('[data-rider="odette"]').evaluate((element) => {
      element.getAnimations()[0]!.currentTime = 2400
    })
    for (const destination of layout.slice(2)) {
      const departing = await scene
        .locator('[data-rider="odette"] img')
        .boundingBox()
      await page.keyboard.press('ArrowRight')
      await expect(bridge).toHaveAttribute('data-ready', 'true')
      await bridge.evaluate((element) =>
        element.getAnimations({ subtree: true }).forEach((animation) => {
          animation.pause()
          animation.currentTime = 0
        })
      )
      const carried = await bridge
        .locator('[data-rider="odette"] img:last-child')
        .boundingBox()
      for (const axis of ['x', 'y', 'width', 'height'] as const)
        expect(
          Math.abs(carried![axis] - departing![axis]),
          `departure ${axis}`
        ).toBeLessThan(1)
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

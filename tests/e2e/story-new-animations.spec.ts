import { expect, test, type Page } from '@playwright/test'

async function openReader(page: Page) {
  await page.goto('/tests/fixtures/story-reader.html')
  await page.getByRole('button', { name: 'Read Sea friends' }).click()
  await expect(page.getByRole('dialog')).toHaveAttribute(
    'data-story-opening',
    'false'
  )
  const handle = page.getByRole('button', { name: 'Show story controls' })
  if (await handle.isVisible()) await handle.click()
}

async function jump(page: Page, index: number) {
  await page.getByRole('slider', { name: 'Story progress' }).fill(String(index))
  await expect(page.locator('.story-artwork')).toHaveAttribute(
    'aria-busy',
    'false'
  )
  await expect(page.getByRole('slider')).toHaveValue(String(index))
}

const transitions = [
  [3, 'dive', '04-transformation'],
  [11, 'approach', '12-castle-close'],
  [12, 'entrance', '13-entering'],
  [22, 'diamond', '23-diamond-room'],
  [34, 'portal', '33-pink-portal'],
  [35, 'pull', '34-swept-into-portal'],
  [36, 'emerge', '35-sky-castle-arrival'],
  [53, 'doors', '52-dark-castle-entry'],
  [55, 'birthday', '54-birthday-surprise'],
] as const

for (const width of [1280, 390]) {
  test(`tidying animates background helpers while the foreground stays fixed (${width})`, async ({
    page,
  }, testInfo) => {
    await page.setViewportSize({ width, height: width === 390 ? 844 : 800 })
    await openReader(page)
    await jump(page, 17)
    const scene = page.locator('.tidying-scene.ready')
    await expect(scene).toHaveCount(1)
    await expect(scene.locator('.tidying-helpers')).toHaveCount(6)
    const foreground = scene.locator('.tidying-foreground')
    const bounds = await foreground.boundingBox()
    await scene.evaluate((element) =>
      element.getAnimations({ subtree: true }).forEach((animation) => {
        animation.pause()
        animation.currentTime = 2600
      })
    )
    expect(await foreground.boundingBox()).toEqual(bounds)
    expect(
      await foreground.evaluate((element) => element.getAnimations().length)
    ).toBe(0)
    await expect(scene.locator('.tidying-mint')).not.toHaveCSS(
      'transform',
      'none'
    )
    await page.screenshot({ path: testInfo.outputPath('tidying.png') })
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await expect
      .poll(() =>
        scene.evaluate(
          (element) => element.getAnimations({ subtree: true }).length
        )
      )
      .toBe(0)
    await jump(page, 63)
    await expect(scene).toHaveCount(0)
  })

  test(`new cinematic transitions keep paper aligned and settle correctly (${width})`, async ({
    page,
  }, testInfo) => {
    test.setTimeout(60000)
    const errors: string[] = []
    page.on('pageerror', (error) => errors.push(error.message))
    await page.setViewportSize({ width, height: width === 390 ? 844 : 800 })
    await openReader(page)
    for (const [index, kind, destination] of transitions) {
      // Jump back from the final panel to avoid starting another forward effect.
      await jump(page, 63)
      await jump(page, index)
      await page.keyboard.press('ArrowRight')
      const stage = page.locator('.story-transition')
      await expect(stage).toHaveAttribute('data-transition', kind)
      await expect(stage).toHaveAttribute('data-ready', 'true')
      if (kind === 'dive') await page.waitForTimeout(1100)
      await expect(page.locator('.story-page-surface')).toHaveCSS(
        'visibility',
        'hidden'
      )
      await stage.evaluate((element) => {
        element.getAnimations({ subtree: true }).forEach((animation) => {
          animation.pause()
          animation.currentTime =
            Number(animation.effect!.getTiming().duration) / 2
        })
      })
      const alignment = await stage.evaluate((element) => {
        const paper = element.getBoundingClientRect()
        const host = element.parentElement!.getBoundingClientRect()
        const image = element
          .querySelector('.story-paper-illustration')!
          .getBoundingClientRect()
        return {
          dx: paper.x + paper.width / 2 - host.x - host.width / 2,
          dy: paper.y + paper.height / 2 - host.y - host.height / 2,
          insetX: image.x - paper.x,
          insetY: image.y - paper.y,
        }
      })
      expect(Math.abs(alignment.dx)).toBeLessThan(2)
      expect(Math.abs(alignment.dy)).toBeLessThan(2)
      expect(alignment.insetX).toBeGreaterThan(0)
      expect(alignment.insetY).toBeGreaterThan(0)
      if (kind === 'doors')
        await page.screenshot({
          path: testInfo.outputPath('opening-doors.png'),
        })
      await stage.evaluate((element) =>
        element
          .getAnimations({ subtree: true })
          .forEach((animation) => animation.finish())
      )
      await expect(stage).toHaveCount(0)
      await expect(page.locator('.story-page-surface')).toHaveCSS(
        'visibility',
        'visible'
      )
      await expect(page.locator('.story-page-current')).toHaveAttribute(
        'src',
        new RegExp(destination)
      )
    }
    expect(errors).toEqual([])
  })

  test(`cleaners, wake-up rooms and all seven playground scenes play and clean up (${width})`, async ({
    page,
  }, testInfo) => {
    await page.setViewportSize({ width, height: width === 390 ? 844 : 800 })
    await openReader(page)
    await jump(page, 15)
    const cleaners = page.locator('.cleaning-scene.ready')
    await expect(cleaners.locator('.cleaner')).toHaveCount(2)
    expect(
      await cleaners.evaluate(
        (element) => element.getAnimations({ subtree: true }).length
      )
    ).toBeGreaterThan(2)
    const shape = await cleaners
      .locator('.cleaner-sprite')
      .first()
      .evaluate((image: HTMLImageElement) => {
        const style = getComputedStyle(image)
        return {
          rendered: parseFloat(style.width) / parseFloat(style.height),
          natural: image.naturalWidth / image.naturalHeight,
        }
      })
    expect(shape.rendered).toBeCloseTo(shape.natural, 2)
    await page.screenshot({ path: testInfo.outputPath('cleaning.png') })
    await jump(page, 32)
    await expect(page.locator('.cleaning-scene')).toHaveCount(0)
    const rooms = page.locator('.morning-rooms.ready .morning-room img')
    await expect(rooms).toHaveCount(6)
    const starts = await rooms.evaluateAll((nodes) =>
      nodes.map((node) => node.getAnimations()[0]!.startTime as number)
    )
    expect(Math.max(...starts) - Math.min(...starts)).toBeLessThan(20)
    await page.screenshot({ path: testInfo.outputPath('wake-up.png') })
    for (const [offset, count] of [5, 3, 5, 2, 2, 2, 3].entries()) {
      await jump(page, 39 + offset)
      const scene = page.locator('.air-scene.ready')
      await expect(scene).toHaveCount(1)
      await expect(page.locator('.morning-rooms')).toHaveCount(0)
      await expect(scene.locator('.air-actor')).toHaveCount(count)
      expect(
        await scene.evaluate(
          (element) =>
            element
              .getAnimations({ subtree: true })
              .filter((animation) => animation.playState === 'running').length
        )
      ).toBeGreaterThan(0)
    }
    await page.screenshot({ path: testInfo.outputPath('bridge.png') })
    await jump(page, 63)
    await expect(page.locator('.air-scene')).toHaveCount(0)
  })
}

test('navigation, closing and reduced motion dispose the new effects', async ({
  page,
}) => {
  await openReader(page)
  await jump(page, 34)
  await page.keyboard.press('ArrowRight')
  await expect(page.locator('.story-transition')).toHaveAttribute(
    'data-ready',
    'true'
  )
  await jump(page, 39)
  await expect(page.locator('.story-transition')).toHaveCount(0)
  await expect(page.locator('.air-scene.ready')).toHaveCount(1)
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await expect
    .poll(() =>
      page
        .locator('.air-scene')
        .evaluate((element) => element.getAnimations({ subtree: true }).length)
    )
    .toBe(0)
  await jump(page, 15)
  await expect(page.locator('.cleaning-scene.ready')).toBeVisible()
  expect(
    await page
      .locator('.cleaning-scene')
      .evaluate((element) => element.getAnimations({ subtree: true }).length)
  ).toBe(0)
  await jump(page, 32)
  await expect(page.locator('.morning-rooms.ready')).toBeVisible()
  expect(
    await page
      .locator('.morning-rooms')
      .evaluate((element) => element.getAnimations({ subtree: true }).length)
  ).toBe(0)
  await jump(page, 34)
  await page.keyboard.press('ArrowRight')
  await expect(page.locator('.story-page-current')).toHaveAttribute(
    'src',
    /33-pink-portal/
  )
  await expect(page.locator('.story-transition')).toHaveCount(0)
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await jump(page, 39)
  await expect(page.locator('.air-scene.ready')).toHaveCount(1)
  await page.getByRole('button', { name: 'Return to tests' }).click()
  await expect(page.locator('.air-scene')).toHaveCount(0)
  await expect(page.getByRole('dialog')).toHaveCount(0)
})

test('missing new animation layers retain the original illustration', async ({
  page,
}) => {
  await page.route(
    /\/(?:layers\/(?:air|cleaning|tidying)|opening\/morning-rooms)\//,
    (route) =>
      route.request().resourceType() === 'image'
        ? route.abort()
        : route.continue()
  )
  await openReader(page)
  for (const index of [15, 17, 32, 39]) {
    await jump(page, index)
    await page
      .locator('.story-page-current')
      .evaluate((image: HTMLImageElement) => image.decode())
    await expect(page.locator('.story-page-current')).toBeVisible()
    await expect(
      page.locator(
        '.morning-rooms.ready, .air-scene.ready, .cleaning-scene.ready, .tidying-scene.ready'
      )
    ).toHaveCount(0)
  }
})

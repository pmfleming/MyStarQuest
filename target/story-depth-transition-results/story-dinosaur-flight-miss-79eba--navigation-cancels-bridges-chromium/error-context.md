# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: story-dinosaur-flight.spec.ts >> missing flight layers keep the complete illustration and fast navigation cancels bridges
- Location: tests\e2e\story-dinosaur-flight.spec.ts:285:1

# Error details

```
Error: page.goto: net::ERR_CONNECTION_REFUSED at http://127.0.0.1:4187/tests/fixtures/story-reader.html
Call log:
  - navigating to "http://127.0.0.1:4187/tests/fixtures/story-reader.html", waiting until "load"

```

# Test source

```ts
  191 |             width: parseFloat(style.width),
  192 |           }
  193 |         })
  194 |         return positions
  195 |       })
  196 |     expect(climb[1]!.bottom).toBeGreaterThan(climb[0]!.bottom)
  197 |     expect(climb[1]!.width).toBeLessThan(climb[0]!.width)
  198 |     await page.screenshot({ path: testInfo.outputPath('takeoff.png') })
  199 |     // Turn before the climb is finished: the bridge must retain this exact pose.
  200 |     await scene.locator('[data-rider="odette"]').evaluate((element) => {
  201 |       element.getAnimations()[0]!.currentTime = 2400
  202 |     })
  203 |     for (const destination of layout.slice(2)) {
  204 |       const departing = await scene
  205 |         .locator('[data-rider="odette"] img')
  206 |         .boundingBox()
  207 |       await page.keyboard.press('ArrowRight')
  208 |       await expect(bridge).toHaveAttribute('data-ready', 'true')
  209 |       await bridge.evaluate((element) =>
  210 |         element.getAnimations({ subtree: true }).forEach((animation) => {
  211 |           animation.pause()
  212 |           animation.currentTime = 0
  213 |         })
  214 |       )
  215 |       const carried = await bridge
  216 |         .locator('[data-rider="odette"] img:last-child')
  217 |         .boundingBox()
  218 |       for (const axis of ['x', 'y', 'width', 'height'] as const)
  219 |         expect(
  220 |           Math.abs(carried![axis] - departing![axis]),
  221 |           `departure ${axis}`
  222 |         ).toBeLessThan(1)
  223 |       await finishBridge(page)
  224 |       await expect(scene).toHaveAttribute('data-panel-id', destination.id)
  225 |       await expect(scene.locator('.dinosaur-flight-rider')).toHaveCount(3)
  226 |       await expect(scene.locator('[data-mount="digosaurus"]')).toHaveCount(2)
  227 |       await expect(scene.locator('[data-rider="diana"] img')).toHaveAttribute(
  228 |         'src',
  229 |         /diana-riding\.webp/
  230 |       )
  231 |       await expect(scene.locator('[data-rider="eclipse"] img')).toHaveAttribute(
  232 |         'src',
  233 |         /eclipse-riding\.webp/
  234 |       )
  235 |       await expect(scene.locator('[data-rider="odette"] img')).toHaveAttribute(
  236 |         'src',
  237 |         /riding-lookdown\.webp/
  238 |       )
  239 |       await expect(scene.locator('.dinosaur-flight-visitor')).toHaveCount(
  240 |         destination.visitors.length
  241 |       )
  242 |       for (const visitor of destination.visitors)
  243 |         await expect(
  244 |           scene.locator(`[data-dinosaur="${visitor.id}"] img`)
  245 |         ).toBeVisible()
  246 |       expect(
  247 |         await scene.evaluate(
  248 |           (element) => element.getAnimations({ subtree: true }).length
  249 |         )
  250 |       ).toBeGreaterThan(5)
  251 |       await scene.evaluate((element) =>
  252 |         element.getAnimations({ subtree: true }).forEach((animation) => {
  253 |           animation.pause()
  254 |           animation.currentTime = 0
  255 |         })
  256 |       )
  257 |       await page.screenshot({
  258 |         path: testInfo.outputPath(`${destination.background}.png`),
  259 |       })
  260 |     }
  261 |     // Backward page turns also carry the complete party, and reduced motion settles in place.
  262 |     await page.keyboard.press('ArrowLeft')
  263 |     await finishBridge(page)
  264 |     await page.emulateMedia({ reducedMotion: 'reduce' })
  265 |     await expect
  266 |       .poll(() =>
  267 |         scene.evaluate(
  268 |           (element) => element.getAnimations({ subtree: true }).length
  269 |         )
  270 |       )
  271 |       .toBe(0)
  272 |     await page.keyboard.press('ArrowRight')
  273 |     await expect(scene).toHaveAttribute('data-panel-id', layout.at(-1)!.id)
  274 |     await expect(page.locator('.story-transition')).toHaveCount(0)
  275 |     const showControls = page.getByRole('button', {
  276 |       name: 'Show story controls',
  277 |     })
  278 |     if (await showControls.isVisible()) await showControls.click()
  279 |     await page.getByRole('button', { name: 'Return to tests' }).click()
  280 |     await expect(page.locator('.dinosaur-flight-scene')).toHaveCount(0)
  281 |     expect(errors).toEqual([])
  282 |   })
  283 | }
  284 |
  285 | test('missing flight layers keep the complete illustration and fast navigation cancels bridges', async ({
  286 |   page,
  287 | }) => {
  288 |   await page.route('**/rainbowasaurus-flight/diana-riding.webp', (route) =>
  289 |     route.abort()
  290 |   )
> 291 |   await page.goto('/tests/fixtures/story-reader.html')
      |              ^ Error: page.goto: net::ERR_CONNECTION_REFUSED at http://127.0.0.1:4187/tests/fixtures/story-reader.html
  292 |   await page.getByRole('button', { name: 'Read Sea friends' }).click()
  293 |   await expect(page.getByRole('dialog')).toHaveAttribute(
  294 |     'data-story-opening',
  295 |     'false'
  296 |   )
  297 |   const slider = page.getByRole('slider', { name: 'Story progress' })
  298 |   await slider.fill((await slider.getAttribute('max'))!)
  299 |   await expect(page.locator('.story-page-current')).toHaveAttribute(
  300 |     'src',
  301 |     /70-dinosaur-cloud-flight\.webp/
  302 |   )
  303 |   await expect(page.locator('.dinosaur-flight-scene.ready')).toHaveCount(0)
  304 |   await page
  305 |     .locator('.story-page-current')
  306 |     .evaluate((image: HTMLImageElement) => image.decode())
  307 |   await expect(page.locator('.story-page-current')).toBeVisible()
  308 |   await page.unroute('**/rainbowasaurus-flight/diana-riding.webp')
  309 |   await page.getByRole('dialog').focus()
  310 |   await page.keyboard.press('ArrowLeft')
  311 |   await expect(page.locator('.story-transition')).toHaveAttribute(
  312 |     'data-transition',
  313 |     'dinosaur-flight'
  314 |   )
  315 |   await page.keyboard.press('Home')
  316 |   await expect(page.locator('.dinosaur-flight-scene')).toHaveCount(0)
  317 |   await expect(page.locator('.story-page-current')).toHaveAttribute(
  318 |     'src',
  319 |     /sea-friends-poster/
  320 |   )
  321 | })
  322 |
```

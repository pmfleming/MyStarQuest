# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: story-dinosaur-flight.spec.ts >> all three mounted friends take off, swoop between pages, and visit every habitat (1280)
- Location: tests\e2e\story-dinosaur-flight.spec.ts:134:3

# Error details

```
Error: the foreground, characters and landscape must survive the handoff together

expect(received).toBeLessThan(expected)

Expected: < 1.5
Received:   1.7823321759259259
```

# Page snapshot

```yaml
- generic [ref=e1]:
    - main [ref=e3]:
        - radiogroup "Test categories" [ref=e4]:
            - radio "Numbers" [ref=e5] [cursor=pointer]
            - radio "Letters" [ref=e7] [cursor=pointer]
            - radio "Trivia" [ref=e9] [cursor=pointer]
            - radio "Stories" [checked] [ref=e11] [cursor=pointer]
        - article [ref=e17]:
            - group [ref=e19]:
                - generic [ref=e20]:
                    - img "Sea friends story cover"
            - button "Read Sea friends" [ref=e23] [cursor=pointer]
    - dialog "Sea friends story reader" [active] [ref=e24]:
        - generic [ref=e25]:
            - generic [ref=e30]:
                - img "The three riders bank over a sunny meadow. Odette and Princess Rainbowasaurus look down at turquoise Triceratops, yellow Stegosaurus, golden armoured Ankylosaurus, green Parasaurolophus and purple Pachycephalosaurus. Diana Ping and Eclipse Ping ride their separate Digosauruses behind them."
            - button "Previous page" [ref=e31] [cursor=pointer]
            - button "Next page" [ref=e32] [cursor=pointer]
            - generic [ref=e33]:
                - navigation "Story chapters" [ref=e34]:
                    - button "Land" [ref=e35] [cursor=pointer]
                    - button "Sea" [ref=e37] [cursor=pointer]
                    - button "Air" [ref=e39] [cursor=pointer]
                    - button "Space" [ref=e41] [cursor=pointer]
                    - button "Fossils" [ref=e43] [cursor=pointer]
                - button "Return to tests" [ref=e45] [cursor=pointer]
                - slider "Story progress" [ref=e47] [cursor=pointer]: '68'
                - status "Page 69 of 73" [ref=e48]:
                    - generic [aria-hidden] [ref=e50]:
                        - strong [ref=e51]: '69'
                        - generic [ref=e52]: / 73
```

# Test source

```ts
  29  |   await expect(bridge).toHaveAttribute('data-ready', 'true')
  30  |   await expect(bridge.locator('.dinosaur-flight-bridge-rider')).toHaveCount(3)
  31  |   await bridge.evaluate((element) =>
  32  |     element.getAnimations({ subtree: true }).forEach((animation) => {
  33  |       animation.pause()
  34  |       animation.currentTime = Number(animation.effect!.getTiming().duration) - 1
  35  |     })
  36  |   )
  37  |   const landing = await bridge
  38  |     .locator('.dinosaur-flight-bridge-rider > img:first-child')
  39  |     .evaluateAll((images) =>
  40  |       images.map((image) => {
  41  |         const rect = image.getBoundingClientRect()
  42  |         return {
  43  |           id: (image.parentElement as HTMLElement).dataset.rider,
  44  |           x: rect.x,
  45  |           y: rect.y,
  46  |           width: rect.width,
  47  |           height: rect.height,
  48  |         }
  49  |       })
  50  |     )
  51  |   const checkComposition = /dinosaur-meadow|dinosaur-cloud-flight/.test(
  52  |     (await bridge.getAttribute('data-destination'))!
  53  |   )
  54  |   const lastFrame = checkComposition
  55  |     ? await bridge
  56  |         .locator('.story-paper-illustration')
  57  |         .screenshot({ path: test.info().outputPath('handoff-before.png') })
  58  |     : null
  59  |   await bridge.evaluate((element) =>
  60  |     element
  61  |       .getAnimations({ subtree: true })
  62  |       .forEach((animation) => animation.finish())
  63  |   )
  64  |   await expect(bridge).toHaveCount(0)
  65  |   await expect(page.locator('.dinosaur-flight-scene.ready.flying')).toHaveCount(
  66  |     1
  67  |   )
  68  |   const scene = page.locator('.dinosaur-flight-scene.ready.flying')
  69  |   await scene.evaluate((element) =>
  70  |     element.getAnimations({ subtree: true }).forEach((animation) => {
  71  |       animation.pause()
  72  |       animation.currentTime = 0
  73  |     })
  74  |   )
  75  |   for (const pose of landing) {
  76  |     const settled = await scene
  77  |       .locator(`[data-rider="${pose.id}"] img`)
  78  |       .boundingBox()
  79  |     for (const axis of ['x', 'y', 'width', 'height'] as const)
  80  |       expect(
  81  |         Math.abs(settled![axis] - pose[axis]),
  82  |         `${pose.id} ${axis} at the handoff`
  83  |       ).toBeLessThan(1)
  84  |   }
  85  |   if (lastFrame) {
  86  |     const settledFrame = await page
  87  |       .locator('.story-page-surface > .story-paper-illustration')
  88  |       .screenshot({ path: test.info().outputPath('handoff-after.png') })
  89  |     const difference = await page.evaluate(
  90  |       async ([before, after]) => {
  91  |         async function pixels(base64: string) {
  92  |           const image = new Image()
  93  |           image.src = `data:image/png;base64,${base64}`
  94  |           await image.decode()
  95  |           const canvas = document.createElement('canvas')
  96  |           // Ignore fractional device-pixel resampling at the paper edge.
  97  |           canvas.width = 320
  98  |           canvas.height = Math.round((320 * image.height) / image.width)
  99  |           const context = canvas.getContext('2d')!
  100 |           context.drawImage(image, 0, 0, canvas.width, canvas.height)
  101 |           return context.getImageData(0, 0, canvas.width, canvas.height).data
  102 |         }
  103 |         const [a, b] = await Promise.all([pixels(before!), pixels(after!)])
  104 |         if (a.length !== b.length) return Infinity
  105 |         let error = 0
  106 |         // Match within one sample pixel to tolerate fractional CSS/GPU rasterization.
  107 |         for (let i = 0; i < a.length; i += 4) {
  108 |           let closest = Infinity
  109 |           const x = (i / 4) % 320
  110 |           for (let dy = -1; dy <= 1; dy++)
  111 |             for (let dx = -1; dx <= 1; dx++) {
  112 |               const j = i + (dy * 320 + dx) * 4
  113 |               if (x + dx < 0 || x + dx >= 320 || j < 0 || j + 2 >= b.length)
  114 |                 continue
  115 |               let pixelError = 0
  116 |               for (let channel = 0; channel < 3; channel++)
  117 |                 pixelError += Math.abs(a[i + channel]! - b[j + channel]!)
  118 |               closest = Math.min(closest, pixelError)
  119 |             }
  120 |           error += closest
  121 |         }
  122 |         return error / (a.length * 0.75)
  123 |       },
  124 |       [lastFrame.toString('base64'), settledFrame.toString('base64')]
  125 |     )
  126 |     expect(
  127 |       difference,
  128 |       'the foreground, characters and landscape must survive the handoff together'
> 129 |     ).toBeLessThan(1.5)
      |       ^ Error: the foreground, characters and landscape must survive the handoff together
  130 |   }
  131 | }
  132 |
  133 | for (const width of [1280, 390]) {
  134 |   test(`all three mounted friends take off, swoop between pages, and visit every habitat (${width})`, async ({
  135 |     page,
  136 |   }, testInfo) => {
  137 |     test.setTimeout(90000)
  138 |     const errors: string[] = []
  139 |     page.on('pageerror', (error) => errors.push(error.message))
  140 |     await page.setViewportSize({ width, height: width === 390 ? 844 : 800 })
  141 |     await openFlight(page)
  142 |     const scene = page.locator('.dinosaur-flight-scene.ready.flying')
  143 |     await expect(scene).toHaveAttribute('data-mode', 'boarding')
  144 |     await scene.evaluate((element) =>
  145 |       element
  146 |         .getAnimations({ subtree: true })
  147 |         .forEach((animation) => animation.pause())
  148 |     )
  149 |     const boardingPose = await scene
  150 |       .locator('[data-rider="odette"] img')
  151 |       .boundingBox()
  152 |     await page.screenshot({ path: testInfo.outputPath('boarding.png') })
  153 |     await page.keyboard.press('ArrowRight')
  154 |     const bridge = page.locator(
  155 |       '.story-transition[data-transition="dinosaur-flight"]'
  156 |     )
  157 |     await expect(bridge).toHaveAttribute('data-ready', 'true')
  158 |     await bridge.evaluate((element) =>
  159 |       element.getAnimations({ subtree: true }).forEach((animation) => {
  160 |         animation.pause()
  161 |         animation.currentTime = 0
  162 |       })
  163 |     )
  164 |     const boardingDeparture = await bridge
  165 |       .locator('[data-rider="odette"] img:last-child')
  166 |       .boundingBox()
  167 |     for (const axis of ['x', 'y', 'width', 'height'] as const)
  168 |       expect(
  169 |         Math.abs(boardingDeparture![axis] - boardingPose![axis])
  170 |       ).toBeLessThan(1)
  171 |     await bridge.evaluate((element) =>
  172 |       element.getAnimations({ subtree: true }).forEach((animation) => {
  173 |         animation.pause()
  174 |         animation.currentTime = 1400
  175 |       })
  176 |     )
  177 |     await page.screenshot({ path: testInfo.outputPath('between-panels.png') })
  178 |     await finishBridge(page)
  179 |     await expect(scene).toHaveAttribute('data-mode', 'takeoff')
  180 |     const climb = await scene
  181 |       .locator('[data-rider="odette"]')
  182 |       .evaluate((element) => {
  183 |         const animation = element.getAnimations()[0]!
  184 |         animation.pause()
  185 |         const positions = [0, 6000].map((time) => {
  186 |           animation.currentTime = time
  187 |           const style = getComputedStyle(element)
  188 |           return {
  189 |             bottom: parseFloat(style.bottom),
  190 |             width: parseFloat(style.width),
  191 |           }
  192 |         })
  193 |         return positions
  194 |       })
  195 |     expect(climb[1]!.bottom).toBeGreaterThan(climb[0]!.bottom)
  196 |     expect(climb[1]!.width).toBeLessThan(climb[0]!.width)
  197 |     await page.screenshot({ path: testInfo.outputPath('takeoff.png') })
  198 |     // Turn before the climb is finished: the bridge must retain this exact pose.
  199 |     await scene.locator('[data-rider="odette"]').evaluate((element) => {
  200 |       element.getAnimations()[0]!.currentTime = 2400
  201 |     })
  202 |     for (const destination of layout.slice(2)) {
  203 |       const departing = await scene
  204 |         .locator('[data-rider="odette"] img')
  205 |         .boundingBox()
  206 |       await page.keyboard.press('ArrowRight')
  207 |       await expect(bridge).toHaveAttribute('data-ready', 'true')
  208 |       await bridge.evaluate((element) =>
  209 |         element.getAnimations({ subtree: true }).forEach((animation) => {
  210 |           animation.pause()
  211 |           animation.currentTime = 0
  212 |         })
  213 |       )
  214 |       const carried = await bridge
  215 |         .locator('[data-rider="odette"] img:last-child')
  216 |         .boundingBox()
  217 |       for (const axis of ['x', 'y', 'width', 'height'] as const)
  218 |         expect(
  219 |           Math.abs(carried![axis] - departing![axis]),
  220 |           `departure ${axis}`
  221 |         ).toBeLessThan(1)
  222 |       await finishBridge(page)
  223 |       await expect(scene).toHaveAttribute('data-panel-id', destination.id)
  224 |       await expect(scene.locator('.dinosaur-flight-rider')).toHaveCount(3)
  225 |       await expect(scene.locator('[data-mount="digosaurus"]')).toHaveCount(2)
  226 |       await expect(scene.locator('[data-rider="diana"] img')).toHaveAttribute(
  227 |         'src',
  228 |         /diana-riding\.webp/
  229 |       )
```

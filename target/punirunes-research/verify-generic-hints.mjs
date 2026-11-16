import { chromium } from '@playwright/test'

const browser = await chromium.launch({ headless: true })
try {
  for (const [width, theme] of [
    [320, 'princess'],
    [380, 'teenie'],
  ]) {
    const page = await browser.newPage({ viewport: { width, height: 1000 } })
    const errors = []
    page.on('pageerror', (error) => errors.push(error.message))
    await page.goto(
      `http://127.0.0.1:4175/target/punirunes-research/hint-preview.html?theme=${theme}`
    )
    await page.getByRole('radio', { name: 'Punirunes', exact: true }).click()
    const names = await page.evaluate(async () => {
      const { default: collection } =
        await import('/src/data/creatureCollections/punirunes.ts')
      return collection.catalog.map((animal) => animal.name)
    })
    for (const [index, name] of names.entries()) {
      await page.getByAltText(name, { exact: true }).waitFor()
      await page
        .locator('.animal-fact-card img')
        .evaluateAll((images) =>
          Promise.all(images.map((image) => image.decode()))
        )
      const state = await page.evaluate(() => ({
        cards: document.querySelectorAll('.animal-fact-card').length,
        images: document.querySelectorAll('.animal-fact-card img').length,
        emojis: document.querySelectorAll('.animal-fact-symbol').length,
        titles: document.querySelectorAll('.animal-fact-category').length,
        overflow: document.documentElement.scrollWidth > innerWidth,
        captionsFit: [
          ...document.querySelectorAll('.animal-fact-card strong'),
        ].every(
          (el) =>
            el.scrollHeight <= el.clientHeight &&
            el.scrollWidth <= el.clientWidth
        ),
      }))
      if (
        state.cards !== 4 ||
        state.images !== 4 ||
        state.emojis ||
        state.titles ||
        state.overflow ||
        !state.captionsFit ||
        errors.length
      )
        throw new Error(JSON.stringify({ name, width, state, errors }))
      if (['Bakerun', 'Coorun', 'Jewerun', 'Ururun'].includes(name)) {
        await page.screenshot({
          path: `target/punirunes-research/generic-${name}-${width}.png`,
          fullPage: true,
        })
      }
      if (index < names.length - 1)
        await page
          .getByRole('button', { name: 'Next punirune', exact: true })
          .click()
    }
    console.log(
      JSON.stringify({
        width,
        theme,
        characters: names.length,
        cards: names.length * 4,
        errors,
      })
    )
    await page.close()
  }
} finally {
  await browser.close()
}

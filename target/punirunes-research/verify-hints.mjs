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
    await page.getByAltText('Airun', { exact: true }).waitFor()
    await page.getByRole('button', { name: 'Choose starting letter' }).click()
    const letters = page.getByRole('toolbar', { name: 'Starting letters' })
    await letters.dispatchEvent('wheel', { deltaY: 100 })
    await letters.dispatchEvent('wheel', { deltaY: 100 })
    await page.getByRole('button', { name: 'Jump to J', exact: true }).click()
    await page.getByAltText('Jewerun', { exact: true }).waitFor()
    await page
      .locator('.animal-fact-card img')
      .evaluateAll((imgs) => Promise.all(imgs.map((img) => img.decode())))
    const result = await page.evaluate(() => ({
      cards: document.querySelectorAll('.animal-fact-card').length,
      visibleTitles: document.querySelectorAll('.animal-fact-category').length,
      overflow: document.documentElement.scrollWidth > innerWidth,
      imagesLoaded: [
        ...document.querySelectorAll('.animal-fact-card img'),
      ].every((img) => img.naturalWidth > 0),
      captions: [...document.querySelectorAll('.animal-fact-card strong')].map(
        (el) => ({
          text: el.textContent,
          fits:
            el.scrollHeight <= el.clientHeight &&
            el.scrollWidth <= el.clientWidth,
        })
      ),
    }))
    if (
      result.cards !== 4 ||
      result.visibleTitles ||
      result.overflow ||
      !result.imagesLoaded ||
      result.captions.some((c) => !c.fits) ||
      errors.length
    )
      throw new Error(JSON.stringify({ result, errors }))
    await page.screenshot({
      path: `target/punirunes-research/hints-${width}-${theme}.png`,
      fullPage: true,
    })
    console.log(JSON.stringify({ width, theme, ...result, errors }))
    await page.close()
  }
} finally {
  await browser.close()
}

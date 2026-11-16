import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { expect, it } from 'vitest'
import { classifySchoolEvent } from '../../functions/src/schoolEventCatalog'
import snapshot from '../../src/data/calendar/school-calendar.json'

it.each([
  ['Kruidnoten bakken groep 1/ 2 A', 'Cookie Baking', 'kruidnoten-baking'],
  ['inpakouders gezocht 1/ 2 A', 'Gift Wrapping', 'gift-wrapping'],
  ['lampionnen maken groep 1/2 A', 'Lantern Making', 'lantern-making'],
  ['Bezoek Kruiskerk', 'Church Visit', 'church-visit'],
])('illustrates %s without closing school', (summary, titleEn, artwork) => {
  expect(classifySchoolEvent(summary)).toEqual({
    titleNl: summary,
    titleEn,
    artwork,
    kind: 'activity',
  })
})

it('provides both theme images for every event in the bundled school year', () => {
  const summaries = new Set(
    Object.values(snapshot.data).flatMap((day) => day.summaries ?? [])
  )
  for (const summary of summaries) {
    const { artwork, titleEn } = classifySchoolEvent(summary)
    expect(artwork, summary).toBeDefined()
    expect(titleEn.split(/\s+/).length, summary).toBeLessThanOrEqual(2)
    for (const theme of ['teenie', 'princess']) {
      const file = resolve(
        `src/assets/themes/${theme}/school-events/${artwork}.webp`
      )
      expect(existsSync(file), `${theme}: ${summary}`).toBe(true)
    }
  }
})

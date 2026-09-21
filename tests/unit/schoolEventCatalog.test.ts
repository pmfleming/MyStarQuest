import { expect, it } from 'vitest'
import { classifySchoolEvent } from '../../functions/src/schoolEventCatalog'

it.each([
  ['Goede Vrijdag', 'day-off'],
  ['Alle leerlingen 12:00 uur vrij', 'early-finish'],
  ['Schoolfotograaf broertjes/zusjes', 'activity'],
])(
  'classifies and translates the reviewed calendar title %s',
  (title, kind) => {
    const result = classifySchoolEvent(title)
    expect(result.kind).toBe(kind)
    expect(result.titleNl).toBe(title.trim())
    expect(result.titleEn).not.toBe(title.trim())
    expect(result.titleEn.split(/\s+/).length).toBeLessThanOrEqual(2)
    expect(result.artwork).toBeDefined()
  }
)

it('keeps unknown events visible with a short English fallback', () => {
  expect(classifySchoolEvent('Nieuwe activiteit')).toEqual({
    titleNl: 'Nieuwe activiteit',
    titleEn: 'School Event',
    kind: 'activity',
  })
})

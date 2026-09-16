import { APP_TIME_ZONE, getTodayDescriptor } from '../../../src/lib/today'

describe('today utilities', () => {
  it('describes today using the app timezone and its day boundary', () => {
    const descriptor = getTodayDescriptor(
      new Date('2026-03-08T12:00:00Z'),
      APP_TIME_ZONE
    )

    expect(descriptor.dateKey).toBe('2026-03-08')
    expect(descriptor.dayType).toBe('nonschoolday')
    expect(descriptor.season).toBe('spring')
    expect(descriptor.dayName).toBe('Sunday')
    expect(descriptor.formattedDate).toContain('8')
    expect(descriptor.formattedDate).toMatch(/march/i)

    const boundaryDescriptor = getTodayDescriptor(
      new Date('2026-03-20T23:30:00-07:00'),
      APP_TIME_ZONE
    )

    expect(boundaryDescriptor.dateKey).toBe('2026-03-21')
    expect(boundaryDescriptor.dayType).toBe('nonschoolday')
  })
})

import { expect, it } from 'vitest'
import { dateFormats } from '../../src/lib/dateFormats'
import { getDateKeyInTimeZone, getTodayDescriptor } from '../../src/lib/today'

it.each([
  'Europe/Amsterdam',
  'Europe/London',
  'America/New_York',
  'Asia/Tokyo',
])(
  'reuses formatters and preserves locale output across date/DST boundaries in %s',
  (zone) => {
    expect(dateFormats(zone)).toBe(dateFormats(zone))
    for (const instant of [
      '2026-03-29T00:59:00Z',
      '2026-03-29T01:01:00Z',
      '2026-10-25T01:01:00Z',
      '2026-11-16T23:59:00Z',
    ]) {
      const date = new Date(instant)
      expect(dateFormats(zone).time.format(date)).toBe(
        date.toLocaleTimeString('en-GB', {
          timeZone: zone,
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        })
      )
      expect(getDateKeyInTimeZone(date, zone)).toBe(
        getTodayDescriptor(date, zone).dateKey
      )
      expect(getTodayDescriptor(date, zone).formattedDate).toBe(
        date.toLocaleDateString(undefined, {
          timeZone: zone,
          month: 'long',
          day: 'numeric',
        })
      )
    }
  }
)

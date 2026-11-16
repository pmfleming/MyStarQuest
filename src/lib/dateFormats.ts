// A small shared cache avoids rebuilding ICU formatters in history/projection loops.
const cache = new Map<string, ReturnType<typeof createFormats>>()
function createFormats(timeZone: string) {
  return {
    parts: new Intl.DateTimeFormat('en-GB', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      weekday: 'long',
    }),
    time: new Intl.DateTimeFormat('en-GB', {
      timeZone,
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }),
    label: new Intl.DateTimeFormat(undefined, {
      timeZone,
      month: 'long',
      day: 'numeric',
    }),
  }
}
export function dateFormats(timeZone: string) {
  let formats = cache.get(timeZone)
  if (!formats) {
    formats = createFormats(timeZone)
    if (cache.size === 16) cache.delete(cache.keys().next().value!)
    cache.set(timeZone, formats)
  }
  return formats
}

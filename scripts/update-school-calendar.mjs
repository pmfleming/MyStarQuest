import { writeFile } from 'node:fs/promises'
import { createServer } from 'vite'

const server = await createServer({
  server: { middlewareMode: true },
  cacheDir: 'node_modules/.vite-calendar-snapshot',
  optimizeDeps: { noDiscovery: true, include: [] },
})
let calendarSchema
try {
  ;({ calendarSchema } = await server.ssrLoadModule(
    '/src/lib/schoolCalendarData.ts'
  ))
} finally {
  await server.close()
}

const response = await fetch(
  'https://getschoolcalendar-6ujocyt4pq-uc.a.run.app',
  {
    signal: AbortSignal.timeout(15_000),
    cache: 'no-store',
  }
)
if (!response.ok) throw new Error(`Calendar HTTP ${response.status}`)
const data = calendarSchema.parse(await response.json())
if (!Object.keys(data).length)
  throw new Error('Refusing to bundle an empty calendar')
await writeFile(
  new URL('../src/data/calendar/school-calendar.json', import.meta.url),
  JSON.stringify({ checkedAt: Date.now(), data }, null, 2) + '\n'
)
console.log(`Bundled ${Object.keys(data).length} calendar dates.`)

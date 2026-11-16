// @vitest-environment node
import { readFileSync } from 'node:fs'
import { runInNewContext } from 'node:vm'
import { expect, it, vi } from 'vitest'

type Event = {
  request?: Request
  data?: unknown
  waitUntil: (promise: Promise<unknown>) => void
  respondWith: (promise: Promise<Response>) => void
}
function worker() {
  const maps = new Map<string, Map<string, Response>>([
    ['msq-shell-old', new Map()],
  ])
  const key = (request: Request | string) =>
    typeof request === 'string'
      ? new URL(request, 'https://app.test').href
      : request.url
  const caches = {
    match: async (request: Request | string) => {
      for (const entries of maps.values()) {
        const response = entries.get(key(request))
        if (response) return response.clone()
      }
    },
    keys: async () => [...maps.keys()],
    delete: async (name: string) => maps.delete(name),
    open: async (name: string) => {
      if (!maps.has(name)) maps.set(name, new Map())
      const entries = maps.get(name)!
      return {
        put: async (request: Request | string, response: Response) => {
          entries.set(key(request), response.clone())
        },
        match: async (request: Request | string) =>
          entries.get(key(request))?.clone(),
        keys: async () => [...entries.keys()].map((url) => new Request(url)),
        delete: async (request: Request | string) =>
          entries.delete(key(request)),
      }
    },
  }
  const fetch = vi.fn(
    async (request: Request) =>
      new Response(request.url.endsWith('.js') ? 'export{}' : '<html></html>', {
        headers: {
          'Content-Type': request.url.endsWith('.js')
            ? 'text/javascript'
            : 'text/html',
        },
      })
  )
  const handlers = new Map<string, (event: Event) => void>()
  const self = {
    location: new URL('https://app.test'),
    clients: {
      claim: vi.fn(),
      matchAll: vi.fn<() => Promise<object[]>>().mockResolvedValue([]),
    },
    skipWaiting: vi.fn().mockResolvedValue(undefined),
    addEventListener: (name: string, handler: (event: Event) => void) =>
      handlers.set(name, handler),
  }
  const script = readFileSync('scripts/offline-worker.js', 'utf8').replace(
    '__OFFLINE_BUILD__',
    JSON.stringify({ version: 'new', core: ['/assets/app-123.js'] })
  )
  class LocalRequest extends Request {
    constructor(input: string | URL | Request, init?: RequestInit) {
      super(
        typeof input === 'string' ? new URL(input, 'https://app.test') : input,
        init
      )
    }
  }
  runInNewContext(script, {
    self,
    caches,
    fetch,
    URL,
    Request: LocalRequest,
    Response,
    Headers,
    AbortController,
    setTimeout,
    clearTimeout,
  })
  function event(name: string, request?: Request, data?: unknown) {
    const work: Promise<unknown>[] = []
    const respondWith = vi.fn((promise: Promise<Response>) =>
      work.push(promise)
    )
    handlers.get(name)!({
      request,
      data,
      waitUntil: (promise) => work.push(promise),
      respondWith,
    })
    return { done: Promise.all(work), respondWith }
  }
  return { maps, fetch, event, caches, self }
}

it('activates only on request and preserves lazy chunks for another open tab', async () => {
  const sw = worker()
  await sw.event('install').done
  expect(sw.self.skipWaiting).not.toHaveBeenCalled()
  await sw.event('message', undefined, { type: 'ACTIVATE_UPDATE' }).done
  expect(sw.self.skipWaiting).toHaveBeenCalledOnce()
  sw.self.clients.matchAll.mockResolvedValue([{ id: 'older-tab' }])
  const old = await sw.caches.open('msq-shell-old')
  await old.put('/assets/older-page.js', new Response('older page'))
  await sw.event('activate').done
  sw.fetch.mockRejectedValue(new Error('Offline'))
  const [response] = (await sw.event(
    'fetch',
    new Request('https://app.test/assets/older-page.js')
  ).done) as Response[]
  expect(await response.text()).toBe('older page')
  expect(sw.maps.has('msq-shell-old')).toBe(true)
})

it('preserves the working cache after a broken deployment, then installs and serves a valid release safely', async () => {
  const sw = worker()
  const validFetch = sw.fetch.getMockImplementation()!
  sw.fetch.mockResolvedValue(
    new Response('<html/>', { headers: { 'Content-Type': 'text/html' } })
  )
  await expect(sw.event('install').done).rejects.toThrow('Unexpected HTML')
  expect(sw.maps.has('msq-shell-old')).toBe(true)
  expect(sw.maps.has('msq-shell-new')).toBe(false)

  sw.fetch.mockImplementation(validFetch)
  await sw.event('install').done
  await sw.event('activate').done
  expect(sw.maps.has('msq-shell-old')).toBe(false)
  sw.fetch.mockRejectedValue(new Error('Offline'))
  const script = sw.event(
    'fetch',
    new Request('https://app.test/assets/app-123.js')
  )
  const responses = (await script.done) as Response[]
  expect(await responses[0].text()).toBe('export{}')
  for (const request of [
    new Request('https://app.test/__/auth/handler'),
    new Request('https://app.test/api/data'),
    new Request('https://app.test/assets/app-123.js', { method: 'POST' }),
    new Request('https://other.test/assets/app-123.js'),
  ]) {
    expect(sw.event('fetch', request).respondWith).not.toHaveBeenCalled()
  }
})

import { expect, test } from '@playwright/test'
import { loadEnv } from 'vite'
import { emptyState } from '../../src/offline/model'

test('a saved signed-in family opens and saves a chore with the network disabled', async ({
  page,
  context,
}) => {
  await page.goto('/login')
  await expect(
    page.getByRole('button', { name: 'Google Account' })
  ).toBeEnabled()
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready
  })
  const state = emptyState()
  state.documents.children.child = {
    displayName: 'Offline Child',
    totalStars: 5,
    themeId: 'princess',
    createdAt: new Date(),
  }
  state.documents.chores.tidy = {
    childId: 'child',
    title: 'Tidy',
    taskType: 'standard',
    isRepeating: true,
    starValue: 3,
    schoolDayEnabled: true,
    nonSchoolDayEnabled: true,
    createdAt: new Date(),
  }
  await context.setOffline(true)
  await page.addInitScript(() =>
    Object.defineProperty(navigator, 'onLine', {
      get: () => false,
      configurable: true,
    })
  )
  await page.evaluate(
    async ({ state, apiKey }) => {
      async function put(
        databaseName: string,
        storeName: string,
        key: string | null,
        value: unknown
      ) {
        const database = await new Promise<IDBDatabase>((resolve, reject) => {
          const request = indexedDB.open(databaseName, 1)
          request.onupgradeneeded = () =>
            request.result.createObjectStore(storeName)
          request.onsuccess = () => resolve(request.result)
          request.onerror = () => reject(request.error)
        })
        try {
          await new Promise<void>((resolve, reject) => {
            const transaction = database.transaction(storeName, 'readwrite')
            if (key === null) transaction.objectStore(storeName).put(value)
            else transaction.objectStore(storeName).put(value, key)
            transaction.oncomplete = () => resolve()
            transaction.onabort = () => reject(transaction.error)
          })
        } finally {
          database.close()
        }
      }
      await put('mystarquest-offline', 'accounts', 'offline-test-parent', state)
      // Synthetic local SDK fixture; never authenticate or send writes to a real account.
      await put('firebaseLocalStorageDb', 'firebaseLocalStorage', null, {
        fbase_key: `firebase:authUser:${apiKey}:[DEFAULT]`,
        value: {
          uid: 'offline-test-parent',
          emailVerified: false,
          isAnonymous: false,
          providerData: [],
          apiKey,
          appName: '[DEFAULT]',
          stsTokenManager: {
            refreshToken: 'offline-test',
            accessToken: 'offline-test',
            expirationTime: Date.now() + 3600000,
          },
        },
      })
    },
    {
      state,
      apiKey: loadEnv('production', process.cwd(), 'VITE_')
        .VITE_FIREBASE_API_KEY,
    }
  )
  await page.goto('/tabs/chores')
  await expect(page.getByText('Offline Child', { exact: true })).toBeVisible({
    timeout: 30_000,
  })
  await expect(page.getByText('Tidy', { exact: true })).toBeVisible()
  await expect(page.getByText('Offline · Showing saved data')).toBeVisible()
  await page.getByRole('button', { name: 'Give stars for Tidy' }).click()
  await expect(page.getByText(/1 change saved on this device/)).toBeVisible()
  await expect(page.getByText('8', { exact: true })).toBeVisible()
  await page.reload()
  await expect(page.getByText('Offline Child', { exact: true })).toBeVisible()
  await expect(page.getByText(/1 change saved on this device/)).toBeVisible()
})

test('production app reopens offline, retains code/fonts, and restores sign-in when online', async ({
  page,
  context,
}) => {
  const errors: string[] = []
  // Playwright's network blocking may leave navigator.onLine true with SW
  // navigation. Exercise browser connectivity events separately from real I/O.
  await page.addInitScript(() =>
    Object.defineProperty(navigator, 'onLine', {
      get: () => !localStorage.getItem('test-offline'),
      configurable: true,
    })
  )
  page.on('pageerror', (error) => errors.push(error.message))
  await page.goto('/login')
  const login = page.getByRole('button', { name: 'Google Account' })
  await expect(login).toBeEnabled()
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready
    if (!navigator.serviceWorker.controller)
      await new Promise<void>((resolve) =>
        navigator.serviceWorker.addEventListener(
          'controllerchange',
          () => resolve(),
          { once: true }
        )
      )
  })
  const cached = await page.evaluate(async () => {
    const names = await caches.keys()
    const shell = await caches.open(
      names.find((name) => name.startsWith('msq-shell-'))!
    )
    return (await shell.keys()).map((request) => new URL(request.url).pathname)
  })
  expect(cached).toContain('/index.html')
  expect(cached.some((path) => path.includes('TimeExplorerPage'))).toBe(true)
  expect(cached.some((path) => /\.woff2$/.test(path))).toBe(true)
  // Only code/fonts are precached; hundreds of MB of artwork stay demand-loaded.
  expect(cached.some((path) => /\.(png|webp)$/.test(path))).toBe(false)
  await context.setOffline(true)
  await page.evaluate(() => localStorage.setItem('test-offline', 'yes'))
  await page.reload()
  await expect(login).toBeDisabled()
  await expect(page.getByText('Connect to sign in.')).toBeVisible()
  await page.goto('/tabs/time-explorer')
  await expect(login).toBeDisabled()
  await context.setOffline(false)
  await page.evaluate(() => {
    localStorage.removeItem('test-offline')
    window.dispatchEvent(new Event('online'))
  })
  await expect(login).toBeEnabled()
  expect(errors).toEqual([])
})

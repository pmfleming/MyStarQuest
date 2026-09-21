import { expect, test } from '@playwright/test'
import { applyOperation } from '../../src/offline/transport'
import type { LocalDocument, PendingAction } from '../../src/offline/model'

test('simultaneous tabs retain both queued actions and share one device sequence', async ({
  page,
  context,
}) => {
  const other = await context.newPage()
  await Promise.all([
    page.goto('/tests/fixtures/offline.html'),
    other.goto('/tests/fixtures/offline.html'),
  ])
  await expect(page.locator('#balance')).toHaveText('5')
  await expect(other.locator('#balance')).toHaveText('5')
  await Promise.all([
    page.getByRole('button', { name: 'Complete chore' }).click(),
    other.getByRole('button', { name: 'Buy reward' }).click(),
  ])
  await expect(page.locator('#pending')).not.toHaveText('0')
  await expect(other.locator('#pending')).not.toHaveText('0')
  await Promise.all([page.reload(), other.reload()])
  await expect(page.locator('#pending')).toHaveText('2')
  await expect(other.locator('#pending')).toHaveText('2')
  const state = await page.evaluate(async () => {
    const database = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open('mystarquest-offline', 1)
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
    try {
      return await new Promise<{ pending: PendingAction[] }>(
        (resolve, reject) => {
          const request = database
            .transaction('accounts')
            .objectStore('accounts')
            .get('parent')
          request.onsuccess = () => resolve(request.result)
          request.onerror = () => reject(request.error)
        }
      )
    } finally {
      database.close()
    }
  })
  expect(state.pending.map((item) => item.sequence)).toEqual([1, 2])
  expect(new Set(state.pending.map((item) => item.deviceId)).size).toBe(1)
  expect(new Set(state.pending.map((item) => item.action.kind))).toEqual(
    new Set(['activity', 'redeem'])
  )
})

test('offline actions survive reload and a lost server response without duplicate stars', async ({
  page,
}) => {
  const documents = new Map<string, LocalDocument>([
    ['users/parent/children/child', { totalStars: 5 }],
  ])
  let loseFirstResponse = true
  let accepted = 0
  await page.route('**/offline-cloud', async (route) => {
    const { userId, operation } = route.request().postDataJSON() as {
      userId: string
      operation: PendingAction
    }
    const alreadyAccepted = documents.has(
      `users/parent/syncReceipts/${operation.id}`
    )
    const receipt = await applyOperation(
      {
        get: async (path) => structuredClone(documents.get(path)),
        set: (path, data) => {
          documents.set(path, structuredClone(data))
        },
        delete: (path) => {
          documents.delete(path)
        },
      },
      userId,
      operation
    )
    if (!alreadyAccepted) accepted++
    if (loseFirstResponse) {
      loseFirstResponse = false
      await route.abort()
      return
    }
    await route.fulfill({ json: receipt })
  })
  await page.goto('/tests/fixtures/offline.html')
  await expect(page.locator('#balance')).toHaveText('5')
  await page.getByRole('button', { name: 'Complete chore' }).click()
  await expect(page.locator('#balance')).toHaveText('8')
  await expect(page.locator('#pending')).toHaveText('1')
  await page.reload()
  await expect(page.locator('#balance')).toHaveText('8')
  await expect(page.locator('#pending')).toHaveText('1')
  await page.getByRole('button', { name: 'Sync', exact: true }).click()
  await expect(page.locator('#pending')).toHaveText('0')
  await expect(page.locator('#balance')).toHaveText('8')
  expect(accepted).toBe(1)
  expect(documents.get('users/parent/children/child')?.totalStars).toBe(8)
  await page.getByRole('button', { name: 'Buy reward' }).click()
  await expect(page.locator('#balance')).toHaveText('0')
  await expect(page.locator('#pending')).toHaveText('0')
  await page.reload()
  await expect(page.locator('#balance')).toHaveText('0')
  expect(accepted).toBe(2)
})

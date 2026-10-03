import { expect, test } from '@playwright/test'
import { applyOperation } from '../../src/offline/transport'
import type { LocalDocument, PendingAction } from '../../src/offline/model'

test('concurrent offline actions survive reload and lost acknowledgement without duplicate stars', async ({
  page,
  context,
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
  const projectedBalance = state.pending[0].action.kind === 'activity' ? 0 : 3
  expect(state.pending.map((item) => item.sequence)).toEqual([1, 2])
  expect(new Set(state.pending.map((item) => item.deviceId)).size).toBe(1)
  expect(new Set(state.pending.map((item) => item.action.kind))).toEqual(
    new Set(['activity', 'redeem'])
  )
  await expect(page.locator('#balance')).toHaveText(String(projectedBalance))
  await other.close()
  await page.getByRole('button', { name: 'Sync', exact: true }).click()
  await expect(page.locator('#pending')).toHaveText('0')
  await expect(page.locator('#balance')).toHaveText(String(projectedBalance))
  expect(accepted).toBe(2)
  expect(documents.get('users/parent/children/child')?.totalStars).toBe(
    projectedBalance
  )
  await page.reload()
  await expect(page.locator('#balance')).toHaveText(String(projectedBalance))
  await expect(page.locator('#pending')).toHaveText('0')
})

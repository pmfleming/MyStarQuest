import { expect, test } from '@playwright/test'
import { applyOperation } from '../../src/offline/transport'
import type { LocalDocument, PendingAction } from '../../src/offline/model'

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

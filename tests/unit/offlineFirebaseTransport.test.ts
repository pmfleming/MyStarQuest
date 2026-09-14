import { expect, it, vi } from 'vitest'
import { Timestamp } from 'firebase/firestore'
vi.mock('../../src/firebaseDb', () => ({ db: {} }))
vi.mock('../../src/firebase', () => ({ auth: { currentUser: null } }))
import {
  localDocument,
  snapshotDocument,
  sendToFirebase,
} from '../../src/offline/firebaseTransport'

it('round-trips nested Firestore timestamps as cloneable dates and omits undefined fields', () => {
  const date = new Date(123),
    timestamp = Timestamp.fromDate(date)
  const saved = localDocument({
    createdAt: timestamp,
    nested: [{ at: timestamp, missing: undefined }],
    date,
  })
  expect(structuredClone(saved)).toEqual({
    createdAt: date,
    nested: [{ at: date }],
    date,
  })
  expect(snapshotDocument(saved).createdAt.toDate()).toEqual(date)
})
it('refuses delivery under another account before contacting Firestore', async () => {
  await expect(sendToFirebase('parent', {} as never)).rejects.toMatchObject({
    code: 'unauthenticated',
  })
})

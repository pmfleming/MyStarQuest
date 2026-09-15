import { OfflineStore } from '../../src/offline/store'
import { IndexedDbPersistence } from '../../src/offline/persistence'
import { OfflineSync } from '../../src/offline/sync'
import { projectDocuments } from '../../src/offline/model'

const store = new OfflineStore('parent', new IndexedDbPersistence())
await store.open()
if (!store.getSnapshot()!.documents.children.child) {
  await store.mergeCollection('children', { child: { totalStars: 5 } })
}
const sync = new OfflineSync(store, async (userId, operation) => {
  const response = await fetch('/offline-cloud', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, operation }),
  })
  if (!response.ok) throw new Error('Cloud unavailable')
  return response.json()
})
const publish = () => {
  document.getElementById('balance')!.textContent = String(
    projectDocuments(store.getSnapshot()!, 'children').child.totalStars
  )
  document.getElementById('pending')!.textContent = String(
    store.getSnapshot()!.pending.length
  )
  document.getElementById('status')!.textContent = sync.getSnapshot().state
}
store.subscribe(publish)
sync.subscribe(publish)
publish()
document.getElementById('complete')!.onclick = async () => {
  await store.queue({
    kind: 'activity',
    collection: 'chores',
    entityId: 'tidy',
    childId: 'child',
    dateKey: '2026-09-14',
    patch: { manageCompletedAt: Date.now() },
    delta: 3,
    complete: true,
    reset: false,
    consume: false,
  })
}
document.getElementById('buy')!.onclick = async () => {
  await store.queue({
    kind: 'redeem',
    entityId: 'toy',
    childId: 'child',
    title: 'Toy',
    cost: 10,
    consume: false,
  })
}
document.getElementById('sync')!.onclick = () => {
  sync.start()
}

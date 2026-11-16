import { useSyncExternalStore } from 'react'
import {
  applyAppUpdate,
  getWaitingWorker,
  subscribeAppUpdate,
} from '../lib/appUpdate'

export default function AppUpdateNotice() {
  const worker = useSyncExternalStore(
    subscribeAppUpdate,
    getWaitingWorker,
    () => null
  )
  if (!worker) return null
  return (
    <aside
      role="status"
      className="fixed top-3 left-1/2 z-[1000] flex w-max max-w-[calc(100%-24px)] -translate-x-1/2 items-center gap-3 rounded-2xl border border-purple-200 bg-white px-4 py-3 text-purple-950 shadow-lg"
    >
      <span>An update is ready.</span>
      <button
        type="button"
        className="min-h-11 rounded-xl bg-purple-800 px-4 font-bold text-white"
        onClick={applyAppUpdate}
      >
        Reload to update
      </button>
    </aside>
  )
}

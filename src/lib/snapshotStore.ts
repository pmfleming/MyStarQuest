// Stable methods and snapshot identity for React's useSyncExternalStore.
export function snapshotStore<T>(initial: T) {
  let value = initial
  const listeners = new Set<() => void>()
  return {
    getSnapshot: () => value,
    subscribe: (listener: () => void) => {
      listeners.add(listener)
      return () => {
        listeners.delete(listener)
      }
    },
    publish: (next: T) => {
      if (Object.is(value, next)) return
      value = next
      listeners.forEach((listener) => listener())
    },
  }
}

// Bound the wait even when a native bridge or transport ignores cancellation.
// A late result cannot settle the returned promise after it has been aborted.
export async function withDeadline<T>(
  run: (signal: AbortSignal) => Promise<T>,
  timeoutMs: number,
  controller = new AbortController()
): Promise<T> {
  const { signal } = controller
  signal.throwIfAborted()
  let onAbort = () => {}
  const timer = setTimeout(
    () => controller.abort(new Error('Request timed out')),
    timeoutMs
  )
  try {
    return await new Promise<T>((resolve, reject) => {
      onAbort = () => reject(signal.reason)
      signal.addEventListener('abort', onAbort, { once: true })
      run(signal).then(resolve, reject)
    })
  } finally {
    clearTimeout(timer)
    signal.removeEventListener('abort', onAbort)
  }
}

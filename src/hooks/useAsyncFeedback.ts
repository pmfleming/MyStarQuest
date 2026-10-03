import { useRef, useState } from 'react'

export function useAsyncFeedback(fallback: string) {
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const pending = useRef(false)
  const run = async (action: () => Promise<void>) => {
    if (pending.current) return
    pending.current = true
    setBusy(true)
    setMessage('')
    try {
      await action()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : fallback)
    } finally {
      pending.current = false
      setBusy(false)
    }
  }
  return { busy, message, setMessage, run }
}

import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import AppUpdateNotice from '../../src/components/AppUpdateNotice'
import { setWaitingWorker } from '../../src/lib/appUpdate'

afterEach(() => {
  cleanup()
  setWaitingWorker(null)
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

it('offers an explicit update without activating it during normal use', () => {
  const worker = { postMessage: vi.fn() }
  const events = { addEventListener: vi.fn() }
  vi.stubGlobal('navigator', { serviceWorker: events })
  setWaitingWorker(worker as unknown as ServiceWorker)
  render(<AppUpdateNotice />)
  expect(worker.postMessage).not.toHaveBeenCalled()
  fireEvent.click(screen.getByRole('button', { name: 'Reload to update' }))
  expect(worker.postMessage).toHaveBeenCalledWith({ type: 'ACTIVATE_UPDATE' })
  expect(events.addEventListener).toHaveBeenCalledWith(
    'controllerchange',
    expect.any(Function),
    { once: true }
  )
})

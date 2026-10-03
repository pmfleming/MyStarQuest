import type { KeyboardEvent } from 'react'

export function keyboardActivation(event: KeyboardEvent, activate: () => void) {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault()
    activate()
  }
}

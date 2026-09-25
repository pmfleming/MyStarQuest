import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import ExpandableAgendaItem from '../../src/components/ExpandableAgendaItem'

describe('expandable agenda rows', () => {
  it('supports keyboard expansion, Escape, and focus moving off the row', () => {
    const { unmount } = render(
      <>
        <ul>
          <ExpandableAgendaItem>Sleeping</ExpandableAgendaItem>
        </ul>
        <button>Outside</button>
      </>
    )
    const button = screen.getByRole('button', { name: 'Sleeping' })
    fireEvent.keyDown(button, { key: 'Enter' })
    expect(button).toHaveAttribute('aria-expanded', 'true')
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(button).toHaveAttribute('aria-expanded', 'false')
    fireEvent.keyDown(button, { key: ' ' })
    fireEvent.focusIn(screen.getByRole('button', { name: 'Outside' }))
    expect(button).toHaveAttribute('aria-expanded', 'false')
    fireEvent.keyDown(button, { key: 'Enter' })
    unmount()
    // An interrupted interaction must leave no handler touching an unmounted row.
    fireEvent.pointerDown(document.body)
  })
})
